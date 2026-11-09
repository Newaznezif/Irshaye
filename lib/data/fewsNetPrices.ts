import Papa from 'papaparse';

import { cachedFetch, type FetchOutcome } from './cache';
import { httpJson, httpText } from './http';
import { observationIdOf, type SourceAttribution } from './marketModel';
import { provenanceFor, SOURCES } from './sources';
import type { ConnectorResult, MarketPriceObservation } from './types';

/**
 * FEWS NET's Food Data Watch (FDW) price service for Ethiopia.
 *
 * This is the market module's second, independent price publisher, registered because the
 * first one is currently unreachable for automated clients: HDX's front door answers our
 * download requests with `202` and an empty body, and answering that challenge by solving its
 * JavaScript or rotating our identity would be evasion, which this app does not do. FEWS NET
 * answers an honest client. Its prices are real monitored observations in named Ethiopian
 * markets, in ETB, with the publisher's own USD conversion — and unlike WFP's monthly file
 * they arrive on a weekly cycle the publisher declares on every row
 * (`collection_schedule: "Weekly"`).
 *
 * Coverage differs from WFP and is reported rather than blended away: FEWS NET monitors a
 * narrow set of markets (measured 2026-11-04: 9 markets, 7 administrative zones, 21 products
 * per survey week) and publishes weekly; WFP surveys ~130 markets monthly. The two also state
 * the same grain in different units — `kg` here, `100 KG` there — so the app's unit-exact
 * series key keeps them apart by construction instead of averaging them together.
 *
 * Every request rule below was measured against the live service on 2026-11-04:
 * - `start_date` / `end_date` are real inclusive bounds. Without them the endpoint offers the
 *   whole 114,185-row file (~216 MB of JSON), which is never requested.
 * - `format=csv` with ONE comma-joined `fields=` list returns exactly those columns, and one
 *   request carries a whole window. Repeating `fields=` instead collapses a CSV to its last
 *   column, which is why the joined form is used here.
 * - `page_size` above 500, and any `ordering=`, answer 403. `period_date__gte`, `period_year`,
 *   `period_month` and `product__icontains` are ignored without warning and return the
 *   unfiltered set, so only the exact and bounded forms appear in this file.
 */
const FDW_ENDPOINT = 'https://fdw.fews.net/api/marketpricefacts/';

/** The publisher's own dataset name: part of every request and of the methodology note. */
export const FEWS_NET_DATASET = 'FEWS_NET_Staple_Food_Price_Data';

/**
 * Columns requested. The list is narrow on purpose: `dataseries_name` and `source_document`
 * repeat ~200 identical bytes on every row, and both are derivable from the market, the CPC
 * code and the unit. What stays is what makes a quoted figure traceable to one published cell.
 */
const PROJECTED_FIELDS = [
  'market', 'market_id', 'fnid', 'product', 'cpcv2', 'period_date', 'price_type', 'unit', 'currency',
  'status', 'collection_status', 'value', 'common_currency', 'common_currency_price', 'exchange_rate',
  'admin_1', 'admin_2', 'latitude', 'longitude', 'collection_schedule', 'data_usage_policy', 'created', 'modified',
];

/**
 * Survey weeks held per load. 26 is a stated design limit, not a courtesy: the window is one
 * CSV request, measured at ~4,100 rows and 5-8 s on a cold cache. The service does publish
 * back to 2019 — with no Ethiopia rows through most of 2025 — and a deeper window would cost
 * more waiting than a farmer on a slow connection should spend on a page that opens in weeks.
 */
export const FEWS_NET_WINDOW_WEEKS = 26;

const windowOptions = { timeoutMs: 60_000, retries: 1, retryOnTimeout: false, maxBytes: 8 * 1024 * 1024 };
/** Asks the publisher how many rows the window holds. One row comes back; only `count` is read. */
const countOptions = { timeoutMs: 20_000, retries: 1, retryOnTimeout: false, maxBytes: 256 * 1024 };

const windowUrl = (from: string, to: string) =>
  `${FDW_ENDPOINT}?dataset=${FEWS_NET_DATASET}&country=ET&format=csv&fields=${PROJECTED_FIELDS.join(',')}&start_date=${from}&end_date=${to}`;

const countUrl = (from: string, to: string) =>
  `${FDW_ENDPOINT}?dataset=${FEWS_NET_DATASET}&country=ET&format=json&fields=period_date&page_size=1&start_date=${from}&end_date=${to}`;

interface RawRow {
  market?: string;
  market_id?: string;
  fnid?: string;
  product?: string;
  cpcv2?: string;
  period_date?: string;
  price_type?: string;
  unit?: string;
  currency?: string;
  status?: string;
  collection_status?: string;
  value?: string;
  common_currency?: string;
  common_currency_price?: string;
  exchange_rate?: string;
  admin_1?: string;
  admin_2?: string;
  latitude?: string;
  longitude?: string;
  collection_schedule?: string;
  data_usage_policy?: string;
  created?: string;
  modified?: string;
}

const trimmed = (v: string | undefined): string | null => {
  const s = (v ?? '').trim();
  return s.length > 0 ? s : null;
};

const numeric = (v: string | undefined): number | null => {
  const s = (v ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export interface FewsNetParsed {
  observations: MarketPriceObservation[];
  /**
   * Casual-labour prices. The publisher's wage rows (`price_type: Wage`, unit `day`) are real
   * published figures and genuinely useful, but a day's wage is not a commodity price: putting
   * one into a food series would let it be averaged with teff. They are counted and excluded.
   */
  wageRows: number;
  /** Rows that carried no market, no product or no usable survey date. */
  malformedRows: number;
  /** Distinct `collection_schedule` values seen, so the declared weekly cycle is checkable. */
  declaredSchedules: string[];
}

/** FEWS NET serves the CSV with a byte-order mark; it would otherwise become the first column name. */
const stripBom = (text: string) => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);

/**
 * Normalization, pure and exported so a fixture can prove it without a live publisher.
 *
 * `status` is the publisher's own collection state, and it governs: only `Collected` is read
 * as a price. Everything else (`Not Available`, `Not Collected` — measured 22 of 189 rows in
 * the 2026-09-30 week) becomes an empty cell flagged `unknown`, which is a coverage fact. It
 * is never a zero, and never the last known price carried forward.
 */
export function parseFewsNetPrices(text: string, at: SourceAttribution): FewsNetParsed {
  const parsed = Papa.parse<RawRow>(stripBom(text).trim(), { header: true, skipEmptyLines: true });
  const observations: MarketPriceObservation[] = [];
  const schedules = new Set<string>();
  let wageRows = 0;
  let malformedRows = 0;

  for (const r of parsed.data) {
    const market = trimmed(r.market);
    const commodity = trimmed(r.product);
    const observedOn = trimmed(r.period_date);
    if (!market || !commodity || !observedOn || !/^\d{4}-\d{2}-\d{2}$/.test(observedOn)) {
      malformedRows += 1;
      continue;
    }

    const schedule = trimmed(r.collection_schedule);
    if (schedule) schedules.add(schedule);

    const priceType = trimmed(r.price_type) ?? 'unknown';
    if (priceType.toLowerCase() === 'wage') {
      wageRows += 1;
      continue;
    }

    const retail: MarketPriceObservation['retail'] =
      priceType.toLowerCase() === 'retail' ? 'Retail' : priceType.toLowerCase() === 'wholesale' ? 'Wholesale' : 'unknown';
    const collected = (trimmed(r.status) ?? '').toLowerCase() === 'collected';
    const unit = trimmed(r.unit) ?? 'unknown';

    observations.push({
      id: observationIdOf(at.sourceId, { market, commodity, unit, retail, observedOn }),
      sourceId: at.sourceId,
      sourceName: at.sourceName,
      sourceUrl: at.sourceUrl,
      dataType: at.dataType,
      observedOn,
      market,
      marketId: trimmed(r.market_id) ?? trimmed(r.fnid),
      admin1: trimmed(r.admin_1),
      admin2: trimmed(r.admin_2),
      // Published for the named market by the monitor itself. Shown as given; never inferred.
      latitude: numeric(r.latitude),
      longitude: numeric(r.longitude),
      commodity,
      // Null rather than a label we would have to invent: `cpcv2` is published, the
      // classification tree behind it is not restated here. The code is kept in `sourceFields`.
      category: null,
      unit,
      currency: trimmed(r.currency) ?? 'ETB',
      price: collected ? numeric(r.value) : null,
      // The publisher's own conversion at its own rate, kept in its own column. Never recomputed.
      usdPrice: (trimmed(r.common_currency) ?? '').toUpperCase() === 'USD' ? numeric(r.common_currency_price) : null,
      retail,
      priceFlag: collected ? 'actual' : 'unknown',
      retrievedAt: at.retrievedAt,
      sourceFields: {
        fnid: trimmed(r.fnid),
        cpcv2: trimmed(r.cpcv2),
        priceType,
        collectionState: trimmed(r.status),
        collectionStatus: trimmed(r.collection_status),
        collectionSchedule: schedule,
        dataUsagePolicy: trimmed(r.data_usage_policy),
        commonCurrency: trimmed(r.common_currency),
        exchangeRate: numeric(r.exchange_rate),
        publishedAt: trimmed(r.created),
        revisedAt: trimmed(r.modified),
      },
    });
  }

  return { observations, wageRows, malformedRows, declaredSchedules: [...schedules].sort() };
}

export interface FewsNetWindow extends FewsNetParsed {
  /** Rows the publisher counts for this window, read from its own JSON envelope. */
  publishedRows: number | null;
  /** True when fewer rows reached us than the publisher counts for the same window. */
  truncated: boolean;
  windowFrom: string;
  windowTo: string;
  latestObservation: string | null;
  earliestObservation: string | null;
  surveyDates: number;
  markets: number;
  commodities: number;
  servedFromCache: boolean;
  retrievedAt: string;
}

function summarise(parsed: FewsNetParsed, publishedRows: number | null, from: string, to: string, retrievedAt: string): FewsNetWindow {
  const dates = [...new Set(parsed.observations.map((r) => r.observedOn))].sort();
  const arrived = parsed.observations.length + parsed.wageRows + parsed.malformedRows;
  return {
    ...parsed,
    publishedRows,
    // A silent server-side cap would otherwise read as a hole in the survey.
    truncated: publishedRows !== null && publishedRows > arrived,
    windowFrom: from,
    windowTo: to,
    latestObservation: dates.at(-1) ?? null,
    earliestObservation: dates[0] ?? null,
    surveyDates: dates.length,
    markets: new Set(parsed.observations.map((r) => r.market)).size,
    commodities: new Set(parsed.observations.map((r) => r.commodity)).size,
    servedFromCache: false,
    retrievedAt,
  };
}

async function loadWindow(weeks: number): Promise<FetchOutcome<FewsNetWindow>> {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - weeks * 7 * 86_400_000).toISOString().slice(0, 10);

  const outcome = await cachedFetch<FewsNetWindow>(`fdw:prices:window:${weeks}`, 24 * 3600, async () => {
    const [file, probe] = await Promise.all([
      httpText(windowUrl(from, to), windowOptions),
      httpJson(countUrl(from, to), countOptions).then((res) => {
        const count = (res.ok ? (res.json as { count?: unknown } | undefined) : undefined)?.count;
        return typeof count === 'number' && Number.isFinite(count) ? count : null;
      }),
    ]);
    if (!file.ok) return { ok: false, error: file.error };

    const at: SourceAttribution = {
      sourceId: SOURCES.fewsNetPrices.id,
      sourceName: SOURCES.fewsNetPrices.name,
      sourceUrl: SOURCES.fewsNetPrices.homeUrl,
      dataType: 'market-survey',
      retrievedAt: new Date().toISOString(),
    };
    const parsed = parseFewsNetPrices(file.text, at);
    if (parsed.observations.length === 0) {
      // An empty window is reported as the source's own failure. It is not a page of nothing,
      // and it is never filled in from another publisher's units or an older week's figure.
      return { ok: false, error: { code: 'no_data', message: 'Price window carried no readable market observations' } };
    }
    return { ok: true, value: summarise(parsed, probe, from, to, at.retrievedAt) };
  });

  if (!outcome.value.ok) return { ok: false, error: outcome.value.error };
  return { ok: true, value: { ...outcome.value.value, servedFromCache: outcome.servedFromCache } };
}

function fewsNetProvenance(seed: { observedAt: string | null; servedFromCache: boolean; coverage: string; retrievedAt?: string }) {
  return provenanceFor(SOURCES.fewsNetPrices, {
    endpoint: FDW_ENDPOINT,
    observedAt: seed.observedAt,
    valueKind: 'observed',
    units: 'ETB per published unit (kg / ea / L / day); the USD figure is FEWS NET’s own conversion at its own published rate',
    methodology:
      `FEWS NET market price monitoring of named Ethiopian markets, dataset “${FEWS_NET_DATASET}”. The publisher declares the cycle on every row (collection_schedule: Weekly). Only rows it marks Collected are read as prices; rows marked Not Available stay empty. Casual-labour wage rows are published figures but not commodity prices, so they are held apart from every price series.`,
    coverage: seed.coverage,
    retrievedAt: seed.retrievedAt,
    quality: 'high',
  });
}

/**
 * The recent weekly survey window as normalized market observations.
 *
 * The window is stated in the coverage string instead of implied by a chart, and the newest
 * published week can trail today by several weeks. That is the publisher's release schedule,
 * and it is reported as observation age rather than hidden behind the fetch timestamp.
 */
export async function getFewsNetWindow(weeks = FEWS_NET_WINDOW_WEEKS): Promise<ConnectorResult<FewsNetWindow>> {
  const loaded = await loadWindow(weeks);
  if (!loaded.ok) {
    return { ok: false, error: loaded.error, provenance: fewsNetProvenance({ observedAt: null, servedFromCache: false, coverage: 'Ethiopia' }) };
  }

  const w = loaded.value;
  return {
    ok: true,
    data: w,
    provenance: fewsNetProvenance({
      observedAt: w.latestObservation,
      servedFromCache: w.servedFromCache,
      coverage: `${w.surveyDates} weekly survey dates · ${w.markets} markets · ${w.commodities} commodities`,
      retrievedAt: w.retrievedAt,
    }),
  };
}
