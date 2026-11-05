import { classifyFreshness, retrievalAgeSeconds, type FreshnessTier } from './freshness';
import { FEWS_NET_WINDOW_WEEKS, getFewsNetWindow } from './fewsNetPrices';
import { buildCatalog, dedupeObservations, hasPrice, marketSpread, monthOf, seasonalCandidates, seriesStats, type MarketCatalog, type SeasonalSeries, type SeriesStats } from './marketModel';
import { buildInsights, type MarketInsight } from './marketInsights';
import { sourceCatalogue, type SourceCatalogue } from './sourceCatalogue';
import { SOURCES, descriptorFor } from './sources';
import { HDX_PRICES_DATASET, getObservationWindow } from './wfpMarketPrices';
import type { MarketPriceObservation, Provenance, SourceDescriptor, SourceError, SourceErrorCode, SourcedResult } from './types';

/**
 * The market module's service layer: it loads the published rows once, then answers
 * every question the UI asks from that one read.
 *
 * Three properties the module depends on:
 *
 * 1. **One publisher cannot take the page down.** Each source is loaded independently
 *    and reported in `sources` with its own state. When HDX answers `202`, FEWS NET
 *    still answers with its weekly survey and the module renders; when both fail the
 *    failure is named per publisher, not hidden.
 * 2. **Nothing is derived that the rows do not support.** Filters come from the
 *    catalogue of what exists, statistics are labelled as ours, and a gap stays a gap.
 * 3. **A merged payload never loses its publisher.** Rows from two surveys sit in one
 *    table because both are Ethiopian market observations, but each row keeps its own
 *    `sourceId`, units, currency and coordinates, and every comparison is locked to one
 *    market + commodity + unit + price type. Two publishers stating the same grain in
 *    different units therefore never average together.
 */

/** One row as the module serves it: the publisher's figure plus how old it actually is. */
export interface MarketRecordView extends MarketPriceObservation {
  /** Graded against the row's own publisher and cadence, not a fixed number of days. */
  freshness: FreshnessTier;
  /** How long our copy has been sitting, reported apart from the observation's age. */
  retrievalAgeSeconds: number | null;
}

export type SourceReportState = 'connected' | 'stale' | 'historical' | 'unavailable' | 'auth_required' | 'not_configured';

/**
 * What the module can say about one publisher. `code` is machine-readable so the
 * sentence is written by the locale file, not by this server — a five-language
 * product cannot afford English diagnostics rendered as UI copy.
 */
export interface MarketSourceReport {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
  /** The registry's own cadence, kept as its union so the UI can translate it by key. */
  cadence: SourceDescriptor['cadence'];
  state: SourceReportState;
  /** Stable code for the state text, present only when something went wrong. */
  code: SourceErrorCode | null;
  upstreamStatus: number | null;
  /**
   * The publisher answered, but its bot protection refused the automated download. This is the
   * fourth state §5G asks for: the source is neither connected nor offline — it is reachable and
   * not ours to read, which the catalogue probe confirms from the same host.
   */
  accessChallenged: boolean;
  latestObservation: string | null;
  earliestObservation: string | null;
  retrievedAt: string | null;
  freshness: FreshnessTier | null;
  observationAgeSeconds: number | null;
  retrievalAgeSeconds: number | null;
  rows: number;
  markets: number;
  commodities: number;
  coverage: string;
  /** The kind of figure this publisher supplies, in its own words. */
  dataType: string;
  /** Distinct survey dates this publisher answered with, or null when it did not answer. */
  surveyDates: number | null;
  /**
   * Rows the publisher itself counts for the requested window. Null when the publisher does
   * not report a count — WFP ships a file and states no row total.
   */
  publishedRows: number | null;
  /**
   * Publisher rows deliberately kept out of the price series — wage rows, unreadable rows —
   * or null when the connector cannot count them. Null and zero are different claims: zero
   * says nothing was held out.
   */
  excludedRows: number | null;
  /** True when fewer rows reached us than the publisher counts for the same window. */
  truncated: boolean;
  /**
   * The publisher's own catalogue, read through its documented API. Present even when the
   * data file did not reach us, because it is what distinguishes "publisher offline" from
   * "publisher reachable, download challenged".
   */
  catalogue: SourceCatalogue | null;
}

/** The bucket sizes a price series can honestly be drawn at. */
export type Granularity = 'weekly' | 'monthly';

/**
 * Cadences that publish at least weekly. A row from one of these may be charted per survey
 * date; anything coarser can only ever be charted per month, and charting it daily would be
 * inventing the days between surveys.
 */
const WEEKLY_OR_FINER = new Set<SourceDescriptor['cadence']>(['realtime', 'hourly', 'daily', '8daily', 'weekly']);

interface Dataset {
  rows: MarketRecordView[];
  catalog: MarketCatalog;
  seasonal: SeasonalSeries[];
  duplicates: number;
  sources: MarketSourceReport[];
  provenance: Provenance;
  /** Granularities the contributing publishers' cadences actually support. */
  granularities: Granularity[];
}

/** Survey window depth. The WFP file is monthly and spans a few years. */
const WINDOW_MONTHS = 60;
/** Weekly windows are capped by the connector's own stated limit. */
const WINDOW_WEEKS = FEWS_NET_WINDOW_WEEKS;

/** What one publisher answered, in the module's own vocabulary. */
interface PublisherOutcome {
  descriptor: SourceDescriptor;
  rows: MarketPriceObservation[];
  error: SourceError | null;
  provenance: Provenance;
  retrievedAt: string | null;
  servedFromCache: boolean;
  surveyDates: number | null;
  publishedRows: number | null;
  excludedRows: number | null;
  truncated: boolean;
  catalogue: SourceCatalogue | null;
}

const failedOutcome = (descriptor: SourceDescriptor, error: SourceError, provenance: Provenance, catalogue: SourceCatalogue | null): PublisherOutcome => ({
  descriptor,
  rows: [],
  error,
  provenance,
  retrievedAt: null,
  servedFromCache: false,
  surveyDates: null,
  publishedRows: null,
  excludedRows: null,
  truncated: false,
  catalogue,
});

/**
 * WFP's monthly survey, downloaded through HDX.
 *
 * The catalogue probe runs in parallel with the file and is kept whichever way the file went,
 * because the pair of answers is what tells a reader whether the publisher is down or is
 * refusing our automated download.
 */
async function loadWfpSurvey(): Promise<PublisherOutcome> {
  const [window, catalogue] = await Promise.all([
    getObservationWindow(WINDOW_MONTHS),
    sourceCatalogue(SOURCES.wfpPrices.id, HDX_PRICES_DATASET),
  ]);
  if (!window.ok) return failedOutcome(SOURCES.wfpPrices, window.error, window.provenance, catalogue);
  return {
    descriptor: SOURCES.wfpPrices,
    rows: window.data.rows,
    error: null,
    provenance: window.provenance,
    retrievedAt: window.provenance.retrievedAt,
    servedFromCache: window.provenance.servedFromCache,
    surveyDates: null,
    // The file states no row total, so only the parser's own count is reportable.
    publishedRows: null,
    excludedRows: window.data.unreadableFileRows,
    truncated: false,
    catalogue,
  };
}

/** FEWS NET's weekly survey, requested as one bounded CSV window. */
async function loadFewsNetSurvey(): Promise<PublisherOutcome> {
  const result = await getFewsNetWindow(WINDOW_WEEKS);
  if (!result.ok) return failedOutcome(SOURCES.fewsNetPrices, result.error, result.provenance, null);
  const w = result.data;
  return {
    descriptor: SOURCES.fewsNetPrices,
    rows: w.observations,
    error: null,
    provenance: result.provenance,
    retrievedAt: w.retrievedAt,
    servedFromCache: w.servedFromCache,
    surveyDates: w.surveyDates,
    publishedRows: w.publishedRows,
    excludedRows: w.wageRows + w.malformedRows,
    truncated: w.truncated,
    catalogue: null,
  };
}

const stateOf = (outcome: PublisherOutcome, tier: FreshnessTier): SourceReportState => {
  if (outcome.error) {
    return outcome.error.code === 'auth_required' ? 'auth_required' : outcome.error.code === 'not_configured' ? 'not_configured' : 'unavailable';
  }
  if (tier === 'historical') return 'historical';
  return tier === 'stale' ? 'stale' : 'connected';
};

function reportOf(outcome: PublisherOutcome, now: number): MarketSourceReport {
  const rows = outcome.rows;
  const latest = rows.reduce<string | null>((max, r) => (!max || r.observedOn > max ? r.observedOn : max), null);
  const earliest = rows.reduce<string | null>((min, r) => (!min || r.observedOn < min ? r.observedOn : min), null);
  // Graded against this publisher's own cadence: the same September Friday is current for a
  // monthly survey and late for a weekly one.
  const freshness = classifyFreshness(latest, outcome.descriptor, now);

  const surveyDates = new Set(rows.map((r) => r.observedOn)).size;
  const marketsCount = new Set(rows.map((r) => r.market)).size;
  const regionCount = new Set(rows.map((r) => r.admin1).filter((v): v is string => v !== null)).size;
  const commodityCount = new Set(rows.map((r) => `${r.commodity}|${r.unit}`)).size;

  return {
    sourceId: outcome.descriptor.id,
    sourceName: outcome.descriptor.name,
    sourceUrl: outcome.descriptor.homeUrl,
    license: outcome.descriptor.license,
    cadence: outcome.descriptor.cadence,
    state: stateOf(outcome, freshness.tier),
    code: outcome.error?.code ?? null,
    upstreamStatus: outcome.error?.status ?? null,
    accessChallenged: outcome.error?.botChallenge === true,
    latestObservation: latest,
    earliestObservation: earliest,
    retrievedAt: outcome.retrievedAt,
    freshness: rows.length > 0 || outcome.error ? freshness.tier : null,
    observationAgeSeconds: freshness.ageSeconds,
    retrievalAgeSeconds: retrievalAgeSeconds(outcome.retrievedAt, now),
    rows: rows.length,
    markets: marketsCount,
    commodities: commodityCount,
    coverage: rows.length > 0 ? `${surveyDates} survey dates · ${marketsCount} markets · ${regionCount} regions` : '—',
    dataType: 'market-survey',
    surveyDates,
    publishedRows: outcome.publishedRows,
    excludedRows: outcome.excludedRows,
    truncated: outcome.truncated,
    catalogue: outcome.catalogue,
  };
}

/**
 * One provenance for a payload built from several publishers.
 *
 * It describes the newest contributing publisher — the envelope can only name one source
 * URL — and says plainly in `methodology` that the payload is merged. Every row carries its
 * own `sourceId`/`sourceName`/`sourceUrl`, and `sources[]` carries the full per-publisher
 * report, so nothing depends on this field for attribution.
 */
function mergedProvenance(outcomes: PublisherOutcome[], reports: MarketSourceReport[]): Provenance {
  const contributing = outcomes.filter((o) => o.rows.length > 0);
  // Nothing answered: the envelope describes the publisher that failed, so a reader still
  // gets its name, licence and endpoint next to the error rather than an empty object.
  if (contributing.length === 0) return outcomes[0].provenance;
  if (contributing.length === 1) return contributing[0].provenance;

  const newest = contributing.reduce((a, b) => (b.provenance.observedAt && b.provenance.observedAt > (a.provenance.observedAt ?? '') ? b : a));
  const names = contributing.map((o) => o.descriptor.name);
  return {
    ...newest.provenance,
    source: names.join(' + '),
    methodology: `Merged from ${names.length} independent Ethiopian market surveys (${names.join(', ')}). Rows keep their own publisher, units, currency and coordinates; series comparisons are locked to one market, commodity, unit and price type, so no figure is averaged across publishers that publish it differently. `,
    coverage: reports.filter((r) => r.rows > 0).map((r) => `${r.sourceName}: ${r.coverage}`).join(' · '),
    // The strictest contract of the pair: if any contributing publisher is behind, the
    // merged payload must not be presented as current.
    maxAgeSeconds: Math.min(...contributing.map((o) => o.provenance.maxAgeSeconds)),
    stale: reports.some((r) => r.state === 'stale' || r.state === 'historical' || r.state === 'unavailable'),
    servedFromCache: contributing.every((o) => o.servedFromCache),
  };
}

/** Every answer the module gives is paired with the per-publisher report behind it. */
type Result<T> = SourcedResult<T, MarketSourceReport>;

/**
 * Load every market price publisher, independently, and merge what answered.
 */
async function loadDataset(): Promise<Result<Dataset>> {
  const outcomes = await Promise.all([loadWfpSurvey(), loadFewsNetSurvey()]);
  const now = Date.now();

  const allRows = outcomes.flatMap((o) => o.rows);
  if (allRows.length === 0) {
    // A challenge or an outage is reported per publisher, with the code each one returned.
    // No cached-forever numbers are substituted, and the module renders these as
    // unavailable states rather than an empty dashboard styled as data.
    const reports = outcomes.map((o) => reportOf(o, now));
    const first = outcomes.find((o) => o.error) ?? outcomes[0];
    return {
      ok: false,
      error: first.error ?? { code: 'no_data', message: 'No market publisher returned usable observations' },
      provenance: mergedProvenance(outcomes, reports),
      sources: reports,
    };
  }

  const unique = dedupeObservations(allRows);
  const rows: MarketRecordView[] = unique.rows.map((r) => {
    const descriptor = descriptorFor(r.sourceId);
    return {
      ...r,
      freshness: descriptor ? classifyFreshness(r.observedOn, descriptor, now).tier : 'unknown',
      retrievalAgeSeconds: retrievalAgeSeconds(r.retrievedAt, now),
    };
  });

  const catalog = buildCatalog(unique.rows);
  const seasonal = seasonalCandidates(unique.rows);
  const reports = outcomes.map((o) => reportOf(o, now));
  const provenance = mergedProvenance(outcomes, reports);
  const granularities = granularitiesFor(outcomes.filter((o) => o.rows.length > 0));

  return {
    ok: true,
    data: { rows, catalog, seasonal, duplicates: unique.duplicates, sources: reports, provenance, granularities },
    provenance,
    sources: reports,
  };
}

/** Which bucket sizes the contributing publishers' declared cadences support. */
function granularitiesFor(outcomes: PublisherOutcome[]): Granularity[] {
  const cadences = new Set(outcomes.map((o) => o.descriptor.cadence));
  const out: Granularity[] = [];
  if ([...cadences].some((c) => WEEKLY_OR_FINER.has(c))) out.push('weekly');
  if ([...cadences].some((c) => c === 'monthly' || c === 'quarterly' || c === 'annual' || WEEKLY_OR_FINER.has(c))) out.push('monthly');
  return out;
}

/** True when this row's publisher publishes at least weekly, so its date is a real survey date. */
const isWeeklyRow = (row: { sourceId: string }): boolean => {
  const descriptor = descriptorFor(row.sourceId);
  return descriptor !== null && WEEKLY_OR_FINER.has(descriptor.cadence);
};

/* ------------------------------------------------------------------ *
 * Summary — what the module actually has
 * ------------------------------------------------------------------ */

export interface MarketSummary {
  /** Commodities with at least one usable price. Everything else is unreachable by design. */
  commoditiesWithData: number;
  marketsMonitored: number;
  regionsMonitored: number;
  surveyMonths: number;
  /** Distinct survey dates: weekly publishers show one per week, monthly ones per month. */
  surveyDates: number;
  latestObservation: string | null;
  earliestObservation: string | null;
  /** Currencies and units exactly as published — the module never merges them. */
  currencies: string[];
  units: string[];
  observations: number;
  rowsWithPrice: number;
  rowsWithoutPrice: number;
  duplicateRows: number;
  priceTypes: string[];
  marketsWithCoordinates: number;
  /** Series long enough to discuss seasonality at all. */
  seasonalSeries: number;
  /** Granularities the contributing publishers' cadences actually support. */
  supportedGranularity: Granularity[];
  /** Graded against the publisher that owns the newest row, not an assumed cycle. */
  freshness: FreshnessTier;
  topMovers: MarketInsight[];
}

/** Latest-period figures per commodity/unit, so the overview shows published numbers only. */
export async function marketSummary(limit = 6): Promise<Result<{ summary: MarketSummary; catalog: MarketCatalog }>> {
  const dataset = await loadDataset();
  if (!dataset.ok) return dataset;
  const { catalog, rows, seasonal, duplicates, sources, provenance, granularities } = dataset.data;

  const latest = catalog.latestObservedOn;
  const rowsWithPrice = rows.filter((r) => hasPrice(r.price));
  const currencies = [...new Set(rowsWithPrice.map((r) => r.currency))].sort();
  const units = [...new Set(rowsWithPrice.map((r) => r.unit))].sort();
  const priceTypes = [...new Set(rowsWithPrice.map((r) => r.retail))].sort();
  const newestRow = rows.reduce<MarketRecordView | null>((best, r) => (!best || r.observedOn > best.observedOn ? r : best), null);
  const newestDescriptor = newestRow ? descriptorFor(newestRow.sourceId) : null;

  const summary: MarketSummary = {
    commoditiesWithData: catalog.commodities.filter((c) => c.markets > 0).length,
    marketsMonitored: catalog.markets.length,
    regionsMonitored: catalog.regions.length,
    surveyMonths: catalog.months.length,
    surveyDates: new Set(rows.map((r) => r.observedOn)).size,
    latestObservation: latest,
    earliestObservation: catalog.firstObservedOn,
    currencies,
    units,
    observations: catalog.observations,
    rowsWithPrice: rowsWithPrice.length,
    rowsWithoutPrice: catalog.observations - rowsWithPrice.length,
    duplicateRows: duplicates,
    priceTypes,
    marketsWithCoordinates: catalog.marketsWithCoordinates,
    seasonalSeries: seasonal.length,
    // Only what a publisher's own cycle answers. Offering a daily granularity here would let
    // the UI draw a chart this module would have to invent.
    supportedGranularity: granularities,
    freshness: newestDescriptor ? classifyFreshness(latest, newestDescriptor, Date.now()).tier : 'unknown',
    topMovers: buildInsights({ rows: rowsWithPrice, seasonal, limit }).slice(0, limit),
  };

  return { ok: true, data: { summary, catalog }, provenance, sources };
}

/* ------------------------------------------------------------------ *
 * Records — the explorer's table and CSV export
 * ------------------------------------------------------------------ */

export interface RecordQuery {
  commodity?: string | null;
  unit?: string | null;
  retail?: string | null;
  market?: string | null;
  region?: string | null;
  sourceId?: string | null;
  from?: string | null;
  to?: string | null;
  /** Free text against the publisher's own market and commodity spellings. */
  search?: string | null;
  /** Only rows carrying a figure. */
  pricedOnly?: boolean;
  sort?: 'observedOn' | 'price' | 'commodity' | 'market';
  direction?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

const SORT_FIELDS = new Set(['observedOn', 'price', 'commodity', 'market']);

export const isRecordSort = (value: string | null | undefined): value is NonNullable<RecordQuery['sort']> =>
  value !== undefined && value !== null && SORT_FIELDS.has(value);

export interface RecordPage {
  records: MarketRecordView[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  /** How many rows matched but carry no figure — an empty cell is a coverage fact. */
  matchedWithoutPrice: number;
  latestObservation: string | null;
  oldestObservation: string | null;
}

export async function marketRecords(query: RecordQuery = {}): Promise<Result<RecordPage>> {
  const dataset = await loadDataset();
  if (!dataset.ok) return dataset;
  const { rows, provenance, sources } = dataset.data;

  const pageSize = Math.max(10, Math.min(200, query.pageSize ?? 50));
  const page = Math.max(1, Math.trunc(query.page ?? 1));
  const sort = isRecordSort(query.sort) ? query.sort : 'observedOn';
  const direction = query.direction === 'asc' ? 1 : -1;
  const search = query.search?.toLowerCase() ?? null;

  const matched = rows.filter((r) => {
    if (query.commodity && r.commodity !== query.commodity) return false;
    if (query.unit && r.unit !== query.unit) return false;
    if (query.retail && r.retail !== query.retail) return false;
    if (query.market && r.market !== query.market) return false;
    if (query.region && r.admin1 !== query.region) return false;
    if (query.sourceId && r.sourceId !== query.sourceId) return false;
    if (query.from && r.observedOn < query.from) return false;
    if (query.to && r.observedOn > query.to) return false;
    if (query.pricedOnly && !hasPrice(r.price)) return false;
    if (search && !(r.market.toLowerCase().includes(search) || r.commodity.toLowerCase().includes(search))) return false;
    return true;
  });

  const sorted = [...matched].sort((a, b) => {
    if (sort === 'price') {
      // A row with no figure sorts below every figure rather than being dropped: it
      // belongs to the result set, and the UI shows the gap.
      if (!hasPrice(a.price) && !hasPrice(b.price)) return a.observedOn.localeCompare(b.observedOn);
      if (!hasPrice(a.price)) return 1;
      if (!hasPrice(b.price)) return -1;
      return (a.price - b.price) * direction;
    }
    const left = sort === 'observedOn' ? a.observedOn : sort === 'commodity' ? a.commodity : a.market;
    const right = sort === 'observedOn' ? b.observedOn : sort === 'commodity' ? b.commodity : b.market;
    const base = left.localeCompare(right);
    // Date sort is newest first by default; name sorts read better ascending.
    return base * (sort === 'observedOn' ? direction : direction === -1 ? -1 : 1);
  });

  const slice = sorted.slice((page - 1) * pageSize, page * pageSize);

  return {
    ok: true,
    data: {
      records: slice,
      page,
      pageSize,
      total: matched.length,
      pages: Math.max(1, Math.ceil(matched.length / pageSize)),
      matchedWithoutPrice: matched.filter((r) => !hasPrice(r.price)).length,
      latestObservation: matched.reduce<string | null>((max, r) => (!max || r.observedOn > max ? r.observedOn : max), null),
      oldestObservation: matched.reduce<string | null>((min, r) => (!min || r.observedOn < min ? r.observedOn : min), null),
    },
    provenance,
    sources,
  };
}

/* ------------------------------------------------------------------ *
 * Series — one comparable series, its statistics, and its markets
 * ------------------------------------------------------------------ */

export interface SeriesPoint {
  /**
   * The period this point stands for: a real survey date at weekly granularity, the month
   * at monthly granularity. `latestObservation` holds the actual date inside it.
   */
  observedOn: string;
  /** The newest survey date that contributed to this point, exactly as published. */
  latestObservation: string;
  /** Mean of that period's published figures within one market/unit/price type. */
  average: number;
  minimum: number;
  maximum: number;
  markets: number;
  observations: number;
  currency: string;
  unit: string;
}

export interface SeriesBundle {
  commodity: string;
  unit: string;
  retail: string;
  points: SeriesPoint[];
  stats: SeriesStats | null;
  /** Same statistic per market, so a comparison never crosses units. */
  byMarket: { market: string; admin1: string | null; stats: SeriesStats | null; latitude: number | null; longitude: number | null }[];
  /**
   * Periods inside the window the survey simply has no figure for: gaps, never interpolated.
   * Month labels (YYYY-MM) at monthly granularity, survey dates at weekly.
   */
  missingDates: string[];
  granularity: Granularity;
  /** False when weekly was asked for and no publisher contributing this series surveys weekly. */
  weeklySupported: boolean;
  /** Publishers whose rows this series actually drew on, so a chart can name them. */
  sourceIds: string[];
  freshness: FreshnessTier;
}

/** One survey period's figures, averaged within the period and never across periods. */
function bucketPoints(priced: MarketPriceObservation[], bucketOf: (r: MarketPriceObservation) => string): SeriesPoint[] {
  const buckets = new Map<string, MarketPriceObservation[]>();
  for (const r of priced) {
    const key = bucketOf(r);
    const list = buckets.get(key);
    if (list) list.push(r);
    else buckets.set(key, [r]);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, inBucket]) => {
      const values = inBucket.map((r) => r.price as number);
      return {
        observedOn: key.length === 7 ? `${key}-01` : key,
        latestObservation: inBucket.reduce((max, r) => (r.observedOn > max ? r.observedOn : max), inBucket[0].observedOn),
        average: values.reduce((a, b) => a + b, 0) / values.length,
        minimum: Math.min(...values),
        maximum: Math.max(...values),
        markets: new Set(inBucket.map((r) => r.market)).size,
        observations: inBucket.length,
        currency: inBucket[0].currency,
        unit: inBucket[0].unit,
      };
    });
}

/**
 * The periods between the first and the last one in the window that carry no figure.
 *
 * At weekly granularity this walks a seven-day grid, because the publisher declares its own
 * cycle on every row (`collection_schedule: Weekly`): a missing Wednesday is a missing survey,
 * not a rounding artefact. Nothing is filled in either way — the list is returned so the chart
 * can draw the hole.
 */
function missingPeriods(window: string[], bucketsWithFigures: Set<string>, granularity: Granularity): string[] {
  if (window.length === 0) return [];
  const [from, to] = [window[0], window.at(-1)!];
  const gaps: string[] = [];
  if (granularity === 'weekly') {
    for (let cursor = Date.parse(`${from}T00:00:00Z`); cursor <= Date.parse(`${to}T00:00:00Z`); cursor += 7 * 86_400_000) {
      const label = new Date(cursor).toISOString().slice(0, 10);
      if (!bucketsWithFigures.has(label)) gaps.push(label);
    }
    return gaps;
  }
  let cursor = from;
  while (cursor <= to) {
    if (!bucketsWithFigures.has(cursor)) gaps.push(cursor);
    const [y, m] = cursor.split('-').map(Number);
    cursor = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  }
  return gaps;
}

export async function marketSeries(query: {
  commodity: string;
  unit?: string | null;
  retail?: string | null;
  market?: string | null;
  region?: string | null;
  sourceId?: string | null;
  months?: number;
  weeks?: number;
  granularity?: Granularity | null;
}): Promise<Result<SeriesBundle>> {
  const dataset = await loadDataset();
  if (!dataset.ok) return dataset;
  const { rows, provenance, sources } = dataset.data;

  const name = rows.find((r) => r.commodity === query.commodity)?.commodity ?? null;
  if (!name) {
    // The catalogue is built from real rows, so an unknown commodity is a genuine
    // absence of coverage — reported as such rather than answered with an empty chart.
    return {
      ok: false,
      error: { code: 'no_data', message: `No published observations for “${query.commodity}”` },
      provenance,
      sources,
    };
  }

  const unit = query.unit ?? dataset.data.catalog.commodities.find((c) => c.name === name)?.units[0] ?? null;
  const retail = query.retail ?? 'Retail';

  const scopedAll = rows.filter((r) => {
    if (r.commodity !== name) return false;
    if (unit && r.unit !== unit) return false;
    if (r.retail !== retail) return false;
    if (query.market && r.market !== query.market) return false;
    if (query.region && r.admin1 !== query.region) return false;
    if (query.sourceId && r.sourceId !== query.sourceId) return false;
    return true;
  });

  const weeklySupported = scopedAll.some(isWeeklyRow);
  const granularity: Granularity = query.granularity === 'weekly' && weeklySupported ? 'weekly' : 'monthly';
  // A weekly chart of a monthly survey would plot days the publisher never looked at, so
  // weekly granularity only ever reads the rows of a publisher that surveys weekly.
  const scoped = granularity === 'weekly' ? scopedAll.filter(isWeeklyRow) : scopedAll;
  const bucketOf = (r: MarketPriceObservation) => (granularity === 'weekly' ? r.observedOn : monthOf(r.observedOn));

  const wantPeriods = granularity === 'weekly'
    ? Math.max(4, Math.min(52, query.weeks ?? 26))
    : Math.max(2, Math.min(WINDOW_MONTHS, query.months ?? 36));

  const priced = scoped.filter((r) => hasPrice(r.price));
  const periods = [...new Set(scoped.map(bucketOf))].sort();
  const window = periods.slice(-wantPeriods);
  const inWindow = new Set(window);
  const pricedInWindow = priced.filter((r) => inWindow.has(bucketOf(r)));

  const points = bucketPoints(pricedInWindow, bucketOf);
  const stats = seriesStats(pricedInWindow, bucketOf);

  const byMarket = [...new Set(pricedInWindow.map((r) => r.market))]
    .map((market) => {
      const marketRows = pricedInWindow.filter((r) => r.market === market);
      const first = marketRows[0];
      return {
        market,
        admin1: first?.admin1 ?? null,
        stats: seriesStats(marketRows, bucketOf),
        latitude: marketRows.find((r) => r.latitude !== null)?.latitude ?? null,
        longitude: marketRows.find((r) => r.longitude !== null)?.longitude ?? null,
      };
    })
    .filter((m) => m.stats !== null)
    .sort((a, b) => (b.stats?.latest?.value ?? 0) - (a.stats?.latest?.value ?? 0))
    .slice(0, 12);

  const newest = scopedAll.reduce<MarketRecordView | null>((best, r) => (!best || r.observedOn > best.observedOn ? r : best), null);
  const newestDescriptor = newest ? descriptorFor(newest.sourceId) : null;

  return {
    ok: true,
    data: {
      commodity: name,
      unit: unit ?? '—',
      retail,
      points,
      stats,
      byMarket,
      // Periods the survey covered but produced no figure for. Reported so the chart marks
      // the hole instead of drawing a line straight across it.
      missingDates: missingPeriods(window, new Set(points.map((p) => (granularity === 'weekly' ? p.observedOn : monthOf(p.observedOn)))), granularity),
      granularity,
      weeklySupported,
      sourceIds: [...new Set(scoped.map((r) => r.sourceId))].sort(),
      freshness: newest && newestDescriptor ? classifyFreshness(newest.observedOn, newestDescriptor, Date.now()).tier : 'unknown',
    },
    provenance,
    sources,
  };
}

/* ------------------------------------------------------------------ *
 * Compare — one month across markets
 * ------------------------------------------------------------------ */

export interface CompareBundle {
  month: string;
  monthsAvailable: string[];
  commodity: string;
  unit: string;
  retail: string;
  spread: ReturnType<typeof marketSpread>;
  byRegion: { region: string; markets: number; average: number; currency: string; unit: string }[];
  /** Publishers that supplied this month's rows, so a map can name them. */
  sourceIds: string[];
}

export async function marketCompare(query: {
  commodity?: string | null;
  unit?: string | null;
  retail?: string | null;
  month?: string | null;
  region?: string | null;
  sourceId?: string | null;
}): Promise<Result<CompareBundle>> {
  const dataset = await loadDataset();
  if (!dataset.ok) return dataset;
  const { rows, catalog, provenance, sources } = dataset.data;

  const month = query.month && catalog.months.includes(query.month) ? query.month : catalog.months.at(-1);
  if (!month) {
    return { ok: false, error: { code: 'no_data', message: 'No survey month with published prices' }, provenance, sources };
  }

  const scoped = rows.filter((r) => {
    if (query.region && r.admin1 !== query.region) return false;
    if (query.sourceId && r.sourceId !== query.sourceId) return false;
    return true;
  });

  // Default to a commodity the publisher covers, chosen from the data rather than a
  // hardcoded list: the module's default view should never be an empty one.
  const candidate = catalog.commodities
    .filter((c) => c.markets >= 2)
    .find((c) => (query.commodity ? c.name === query.commodity : true))
    ?? catalog.commodities[0];

  if (!candidate) {
    return { ok: false, error: { code: 'no_data', message: 'No priced commodity in this dataset' }, provenance, sources };
  }

  const retail = (query.retail === 'Wholesale' ? 'Wholesale' : 'Retail') as MarketPriceObservation['retail'];
  const unit = query.unit && candidate.units.includes(query.unit) ? query.unit : candidate.units[0];

  const spread = marketSpread(scoped, month, candidate.name, unit, retail);

  const inMonth = scoped.filter(
    (r) => monthOf(r.observedOn) === month && r.commodity === candidate.name && r.unit === unit && r.retail === retail && hasPrice(r.price),
  );
  const regions = new Map<string, { sum: number; n: number; markets: Set<string>; currency: string }>();
  for (const r of inMonth) {
    const key = r.admin1 ?? '—';
    const b = regions.get(key) ?? { sum: 0, n: 0, markets: new Set<string>(), currency: r.currency };
    b.sum += r.price as number;
    b.n += 1;
    b.markets.add(r.market);
    regions.set(key, b);
  }

  return {
    ok: true,
    data: {
      month,
      monthsAvailable: catalog.months,
      commodity: candidate.name,
      unit,
      retail,
      spread,
      byRegion: [...regions.entries()]
        .map(([region, b]) => ({ region, markets: b.markets.size, average: b.sum / b.n, currency: b.currency, unit }))
        .sort((a, b) => b.average - a.average),
      sourceIds: [...new Set(inMonth.map((r) => r.sourceId))].sort(),
    },
    provenance,
    sources,
  };
}

/* ------------------------------------------------------------------ *
 * Insights — what the rows support saying
 * ------------------------------------------------------------------ */

export async function marketInsights(limit = 4): Promise<Result<{ insights: MarketInsight[]; seasonal: SeasonalSeries[] }>> {
  const dataset = await loadDataset();
  if (!dataset.ok) return dataset;
  const { rows, seasonal, provenance, sources } = dataset.data;
  return {
    ok: true,
    data: { insights: buildInsights({ rows, seasonal, limit }), seasonal },
    provenance,
    sources,
  };
}
