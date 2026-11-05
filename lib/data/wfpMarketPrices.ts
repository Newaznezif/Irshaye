import Papa from 'papaparse';

import { cachedFetch } from './cache';
import { httpText } from './http';
import { observationIdOf, type SourceAttribution } from './marketModel';
import { provenanceFor, SOURCES } from './sources';
import type { ConnectorResult, MarketPriceObservation, MarketSnapshot, PriceChange, SourceError } from './types';

/**
 * WFP's rEMS export for Ethiopia, served through the Humanitarian Data Exchange.
 * It is a monthly retail/wholesale survey of real Ethiopian markets (observed
 * values in ETB with the publisher's own USD conversion) and the only source in
 * this app that carries actual Ethiopian farm-gate style prices.
 *
 * The HDX link 302s to a presigned S3 URL whose query string carries an AWS
 * signature. We therefore keep the HDX URL as the identity of the endpoint and
 * never store or log the redirected address.
 */
const HDX_PRICES_URL =
  'https://data.humdata.org/dataset/2e4f1922-e446-4b57-a98a-d0e2d5e34afa/resource/87bac18e-f3aa-4b29-8cf8-76763e823dc5/download/wfp_food_prices_eth.csv';

/** The dataset's own slug, used only to ask the publisher's catalogue about itself. */
export const HDX_PRICES_DATASET = 'wfp-food-prices-for-ethiopia';

/**
 * Whole-file download, once per 12 hours per process (see `getRowStore`).
 *
 * The file is 7.6 MB and measured 71 s from this machine on an ordinary link when it is served
 * at all, so the 45 s used elsewhere would fail every cold-cache request for the source that
 * carries the market prices — from a slow connection, which is exactly where an Ethiopian agro
 * dealer is. It gets its own budget instead of slowing every other connector down.
 *
 * One bounded retry, shared with `lib/data/http.ts`, and `retryOnTimeout: false`: a stalled
 * download is not cured by a second stalled download, and hanging 120 s twice would double the
 * wait for the person watching the page.
 *
 * As measured on 2026-11-04, this endpoint refuses unattended requests outright (empty `202`
 * challenge or `406`), so the realistic outcome of this call is a reported failure and the module
 * degrades to its other publisher. The timeout budget is for the days the file does arrive.
 */
const FETCH_OPTIONS = { timeoutMs: 120_000, retries: 1, retryOnTimeout: false, maxBytes: 24 * 1024 * 1024 };

interface RawRow {
  date?: string;
  admin1?: string;
  admin2?: string;
  market?: string;
  market_id?: string;
  latitude?: string;
  longitude?: string;
  category?: string;
  commodity?: string;
  unit?: string;
  priceflag?: string;
  pricetype?: string;
  currency?: string;
  price?: string;
  usdprice?: string;
}

/**
 * A published cell, read as a number.
 *
 * An empty cell is a gap and stays `null`: `Number('')` is 0, which would turn "not
 * surveyed" into "cost nothing" and, in the latitude and longitude columns, would place a
 * market in the Gulf of Guinea at (0, 0) — a coordinate nobody published.
 */
function toNumber(v: string | undefined): number | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalisePriceType(v: string | undefined): MarketPriceObservation['retail'] {
  const s = (v ?? '').toLowerCase();
  if (s.startsWith('retail')) return 'Retail';
  if (s.startsWith('whole')) return 'Wholesale';
  if (s.startsWith('aggregate')) return 'aggregate';
  return 'unknown';
}

function normaliseFlag(v: string | undefined): MarketPriceObservation['priceFlag'] {
  const s = (v ?? '').toLowerCase().replace(/"/g, '');
  if (s.startsWith('actual')) return 'actual';
  if (s.startsWith('aggregate')) return 'aggregate';
  if (s.startsWith('replaced')) return 'replaced';
  return 'unknown';
}

export interface ParsedPriceFile {
  rows: MarketPriceObservation[];
  /** Rows the file carried that had no market, no commodity or no readable survey date. */
  unreadableRows: number;
}

/** Exported for tests: parsing is pure, so a fixture proves it. */
export function parsePriceCsv(text: string, at: SourceAttribution): ParsedPriceFile {
  const parsed = Papa.parse<RawRow>(text.trim(), { header: true, skipEmptyLines: true });
  const out: MarketPriceObservation[] = [];
  let unreadableRows = 0;
  for (const r of parsed.data) {
    const date = (r.date ?? '').trim();
    const market = (r.market ?? '').trim();
    const commodity = (r.commodity ?? '').trim();
    const price = toNumber(r.price);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !market || !commodity) {
      // Counted rather than dropped quietly: "the file has 15,000 rows" and "the file
      // has 15,000 rows, 3 of which we could not read" are different claims.
      unreadableRows += 1;
      continue;
    }
    const retail = normalisePriceType(r.pricetype);
    const unit = (r.unit ?? '').trim() || 'unknown';
    out.push({
      id: observationIdOf(at.sourceId, { market, commodity, unit, retail, observedOn: date }),
      sourceId: at.sourceId,
      sourceName: at.sourceName,
      sourceUrl: at.sourceUrl,
      // A surveyed retail/wholesale shelf price, not a benchmark: this is the one
      // source in the app that reports what a named Ethiopian market charged.
      dataType: 'market-survey',
      observedOn: date,
      market,
      marketId: (r.market_id ?? '').trim() || null,
      admin1: (r.admin1 ?? '').trim() || null,
      admin2: (r.admin2 ?? '').trim() || null,
      latitude: toNumber(r.latitude),
      longitude: toNumber(r.longitude),
      commodity,
      category: (r.category ?? '').trim() || null,
      unit,
      currency: (r.currency ?? '').trim() || 'ETB',
      price,
      usdPrice: toNumber(r.usdprice),
      retail,
      priceFlag: normaliseFlag(r.priceflag),
      retrievedAt: at.retrievedAt,
      // The published cells behind the parsed figures, kept as strings. Only fields this
      // parser actually reads appear here: the column set is the file's, not a guess.
      sourceFields: {
        marketId: (r.market_id ?? '').trim() || null,
        priceFlag: (r.priceflag ?? '').trim() || null,
        priceType: (r.pricetype ?? '').trim() || null,
        rawPrice: (r.price ?? '').trim() || null,
        rawUsdPrice: (r.usdprice ?? '').trim() || null,
      },
    });
  }
  return { rows: out, unreadableRows };
}

type Loaded = { ok: true; rows: MarketPriceObservation[]; unreadableRows: number } | { ok: false; error: SourceError };

async function loadAllRows(): Promise<Loaded> {
  const res = await httpText(HDX_PRICES_URL, FETCH_OPTIONS);
  if (!res.ok) return { ok: false, error: res.error };
  const parsed = parsePriceCsv(res.text, {
    sourceId: SOURCES.wfpPrices.id,
    sourceName: SOURCES.wfpPrices.name,
    sourceUrl: SOURCES.wfpPrices.homeUrl,
    dataType: 'market-survey',
    retrievedAt: new Date().toISOString(),
  });
  if (parsed.rows.length === 0) return { ok: false, error: { code: 'parse_failed', message: 'Price file parsed to zero usable rows' } };
  return { ok: true, rows: parsed.rows, unreadableRows: parsed.unreadableRows };
}

interface RowStore {
  rows: MarketPriceObservation[];
  latestDate: string;
  /** File rows this parser could not read: a coverage fact, not a dropped row. */
  unreadableRows: number;
  servedFromCache: boolean;
  retrievedAt: string;
}

/** Whole-file snapshot, shared by every market query and cached per process. */
async function getRowStore(): Promise<RowStore | { error: SourceError }> {
  const outcome = await cachedFetch<{ rows: MarketPriceObservation[]; latestDate: string; unreadableRows: number }>(
    'wfp:prices:all',
    12 * 3600,
    async () => {
      const loaded = await loadAllRows();
      if (!loaded.ok) return { ok: false, error: loaded.error };
      const latestDate = loaded.rows.reduce((max, r) => (r.observedOn > max ? r.observedOn : max), '');
      return { ok: true, value: { rows: loaded.rows, latestDate, unreadableRows: loaded.unreadableRows } };
    },
  );

  const value = outcome.value;
  if (!value.ok) return { error: value.error };
  return {
    rows: value.value.rows,
    latestDate: value.value.latestDate,
    unreadableRows: value.value.unreadableRows,
    servedFromCache: outcome.servedFromCache,
    retrievedAt: new Date(outcome.storedAt).toISOString(),
  };
}

function marketProvenance(o: { observedAt: string | null; servedFromCache: boolean; coverage: string; retrievedAt?: string }) {
  return provenanceFor(SOURCES.wfpPrices, {
    endpoint: HDX_PRICES_URL,
    observedAt: o.observedAt,
    // A survey observation, not a model output or a forecast.
    valueKind: 'observed',
    units: 'ETB per published unit (100 KG / KG / Head / L / Unit); usdPrice is WFP’s own conversion',
    methodology:
      'WFP market-monitoring survey of Ethiopian retail and wholesale outlets, published monthly on the ~15th. Prices are observations in the market’s currency; only rows with the same market, unit and price type are compared.',
    coverage: o.coverage,
    retrievedAt: o.retrievedAt,
  });
}

const GRAIN_TERMS = ['teff', 'maize', 'wheat', 'sorghum', 'barley', 'millet'] as const;

export function isGrainCommodity(name: string): boolean {
  const lower = name.toLowerCase();
  return GRAIN_TERMS.some((t) => lower.includes(t));
}

export interface MarketQuery {
  region?: string | null;
  market?: string | null;
  commodity?: string | null;
  /** Match grain and cereal commodities only. */
  grainsOnly?: boolean;
  retail?: 'Retail' | 'Wholesale';
  /** Number of most recent observation months to include. */
  months?: number;
  limit?: number;
}

/**
 * Latest-month rows plus the month-on-month movement per market/commodity.
 * Every comparison keeps unit and price type fixed, so a 100 KG wholesale quote
 * is never divided against a KG retail quote.
 */
export async function getMarketSnapshot(q: MarketQuery = {}): Promise<ConnectorResult<MarketSnapshot>> {
  const store = await getRowStore();
  if ('error' in store) {
    return { ok: false, error: store.error, provenance: marketProvenance({ observedAt: null, servedFromCache: false, coverage: 'Ethiopia' }) };
  }

  const monthsBack = Math.max(1, Math.min(24, q.months ?? 6));
  const allDates = [...new Set(store.rows.map((r) => r.observedOn))].sort();
  const window = allDates.slice(-monthsBack);
  const latest = window[window.length - 1];

  const filtered = store.rows.filter((r) => {
    if (!window.includes(r.observedOn)) return false;
    if (q.region && (r.admin1 ?? '').toLowerCase() !== q.region.toLowerCase()) return false;
    if (q.market && !r.market.toLowerCase().includes(q.market.toLowerCase())) return false;
    if (q.commodity && !r.commodity.toLowerCase().includes(q.commodity.toLowerCase())) return false;
    if (q.grainsOnly && !isGrainCommodity(r.commodity)) return false;
    if (q.retail && r.retail !== q.retail) return false;
    return true;
  });

  const latestRows = filtered.filter((r) => r.observedOn === latest);
  const limit = Math.max(1, Math.min(500, q.limit ?? 120));

  return {
    ok: true,
    data: {
      asOfLatestObservation: latest,
      markets: new Set(latestRows.map((r) => r.market)).size,
      commodities: new Set(latestRows.map((r) => r.commodity)).size,
      rows: latestRows.slice(0, limit),
      changes: computeChanges(filtered),
    },
    provenance: marketProvenance({
      observedAt: latest,
      servedFromCache: store.servedFromCache,
      coverage: q.region ? `${q.region}, Ethiopia` : `Ethiopia (national survey, ${new Set(latestRows.map((r) => r.admin1)).size} regions at latest month)`,
      retrievedAt: store.retrievedAt,
    }),
  };
}

/**
 * Month-on-month change for each (market, commodity, unit, price type) series.
 * Returns only pairs where both months exist, so `changePct` is never inferred
 * from an unrelated market or a different unit.
 */
export function computeChanges(rows: MarketPriceObservation[]): PriceChange[] {
  const bySeries = new Map<string, MarketPriceObservation[]>();
  for (const r of rows) {
    const key = `${r.market}|${r.commodity}|${r.unit}|${r.retail}`;
    const bucket = bySeries.get(key);
    if (bucket) bucket.push(r);
    else bySeries.set(key, [r]);
  }

  const changes: PriceChange[] = [];
  for (const seriesList of bySeries.values()) {
    if (seriesList.length < 1) continue;
    const sorted = [...seriesList].sort((a, b) => a.observedOn.localeCompare(b.observedOn));
    const latest = sorted[sorted.length - 1];
    if (latest.price === null) continue;
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
    const previousPrice = previous?.price ?? null;

    changes.push({
      commodity: latest.commodity,
      market: latest.market,
      unit: latest.unit,
      currency: latest.currency,
      latestObservedOn: latest.observedOn,
      latestPrice: latest.price,
      previousObservedOn: previous?.observedOn ?? null,
      previousPrice,
      changePct:
        previousPrice !== null && previousPrice > 0
          ? Math.round(((latest.price - previousPrice) / previousPrice) * 1000) / 10
          : null,
      observations: sorted.length,
    });
  }

  return changes.sort((a, b) => Math.abs(b.changePct ?? 0) - Math.abs(a.changePct ?? 0));
}

/**
 * The whole publisher window as rows, for persistence and for the market module.
 *
 * Deliberately NOT `getMarketSnapshot`: that returns a page of the newest month, which is
 * right for a table and wrong for a store — a sync that saved 500 of ~15,000 observations
 * would look like a price history and would not be one. Unit, currency, market and survey
 * date are preserved per row so nothing has to be inferred later.
 *
 * `unreadableFileRows` travels with it because the transparency report has to be able to say
 * how many rows the file carried that this parser could not read, rather than implying that
 * every published row became a price.
 */
export async function getObservationWindow(
  months = 24,
): Promise<ConnectorResult<{ rows: MarketPriceObservation[]; unreadableFileRows: number }>> {
  const store = await getRowStore();
  if ('error' in store) {
    return { ok: false, error: store.error, provenance: marketProvenance({ observedAt: null, servedFromCache: false, coverage: 'Ethiopia' }) };
  }

  const wanted = Math.max(1, Math.min(60, months));
  const dates = [...new Set(store.rows.map((r) => r.observedOn))].sort();
  const window = new Set(dates.slice(-wanted));
  const rows = store.rows.filter((r) => window.has(r.observedOn));

  return {
    ok: true,
    data: { rows, unreadableFileRows: store.unreadableRows },
    provenance: marketProvenance({
      observedAt: store.latestDate,
      servedFromCache: store.servedFromCache,
      coverage: `Ethiopia, ${window.size} survey months, ${new Set(rows.map((r) => r.market)).size} markets, ${new Set(rows.map((r) => r.commodity)).size} commodities`,
      retrievedAt: store.retrievedAt,
    }),
  };
}

/** National average per grain for the latest month, with the market count. */
export async function getGrainOverview(): Promise<
  ConnectorResult<{ asOf: string; commodities: { commodity: string; avgEtbPerUnit: number; unit: string; markets: number }[] }>
> {
  const store = await getRowStore();
  if ('error' in store) {
    return { ok: false, error: store.error, provenance: marketProvenance({ observedAt: null, servedFromCache: false, coverage: 'Ethiopia' }) };
  }

  const latest = store.latestDate;
  const rows = store.rows.filter((r) => r.observedOn === latest && isGrainCommodity(r.commodity) && r.retail === 'Retail');

  // Average within a unit only: "Teff 100 KG" and "Teff (white) KG" are different goods.
  const buckets = new Map<string, { sum: number; n: number; markets: Set<string> }>();
  for (const r of rows) {
    if (r.price === null) continue;
    const key = `${r.commodity}@@${r.unit}`;
    const b = buckets.get(key) ?? { sum: 0, n: 0, markets: new Set<string>() };
    b.sum += r.price;
    b.n += 1;
    b.markets.add(r.market);
    buckets.set(key, b);
  }

  const commodities = [...buckets.entries()]
    .map(([key, b]) => {
      const [commodity, unit] = key.split('@@');
      return { commodity, unit, avgEtbPerUnit: Math.round((b.sum / b.n) * 100) / 100, markets: b.markets.size };
    })
    .filter((c) => c.markets >= 2)
    .sort((a, b) => b.avgEtbPerUnit - a.avgEtbPerUnit);

  return {
    ok: true,
    data: { asOf: latest, commodities },
    provenance: marketProvenance({
      observedAt: latest,
      servedFromCache: store.servedFromCache,
      coverage: `Ethiopian retail survey, grain and cereal commodities at ${commodities.length} commodity/unit groups`,
      retrievedAt: store.retrievedAt,
    }),
  };
}
