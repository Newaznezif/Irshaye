import type { BadgeTone } from '@/components/ui';

/**
 * Client-side mirrors of the `/api/data/markets` payloads.
 *
 * They are structural on purpose: importing `lib/data/*` into a client component
 * would pull the server's fetch, cache and connector code into the browser bundle.
 * The shapes here are the wire format, not a second source of truth — the routes
 * are built from `lib/data/marketService.ts`, and `scripts/check-data-routes.mjs`
 * asserts the fields these types depend on against live responses.
 */

export type FreshnessTier = 'current' | 'recent' | 'stale' | 'historical' | 'unknown';

export type SourceReportState =
  | 'connected'
  | 'stale'
  | 'historical'
  | 'unavailable'
  | 'auth_required'
  | 'not_configured';

/**
 * The three small registries the UI renders by key. They are unions rather than `string`
 * because `t(`dataType.${…}`)` only typechecks against the dictionary, and a publisher value
 * outside them would render a raw key instead of a word — which is a bug worth a build error.
 */
export type MarketDataTypeValue = 'market-survey' | 'reference-price' | 'projection' | 'administrative';

export type SourceCadence =
  | 'realtime'
  | 'hourly'
  | 'daily'
  | '8daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'irregular';

export type PriceFlag = 'actual' | 'aggregate' | 'replaced' | 'unknown';

export interface CatalogueResourceView {
  name: string;
  format: string;
  sizeBytes: number | null;
  lastModified: string | null;
  datastoreActive: boolean;
}

export interface SourceCatalogueView {
  sourceId: string;
  checkedAt: string;
  reachable: boolean;
  metadataModified: string | null;
  resources: CatalogueResourceView[];
  error: { code: string; message: string; status?: number } | null;
}

/** One published price row, plus how old it actually is. */
export interface MarketRecordView {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  dataType: MarketDataTypeValue;
  observedOn: string;
  market: string;
  marketId: string | null;
  admin1: string | null;
  admin2: string | null;
  latitude: number | null;
  longitude: number | null;
  commodity: string;
  category: string | null;
  unit: string;
  currency: string;
  price: number | null;
  usdPrice: number | null;
  retail: string;
  priceFlag: PriceFlag;
  retrievedAt: string;
  sourceFields: Record<string, string | number | boolean | null>;
  freshness: FreshnessTier;
  retrievalAgeSeconds: number | null;
}

export interface MarketSourceReport {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
  cadence: SourceCadence;
  state: SourceReportState;
  code: string | null;
  upstreamStatus: number | null;
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
  dataType: MarketDataTypeValue;
  surveyDates: number | null;
  publishedRows: number | null;
  excludedRows: number | null;
  truncated: boolean;
  catalogue: SourceCatalogueView | null;
}

export interface CatalogCommodityView {
  name: string;
  category: string | null;
  units: string[];
  retail: string[];
  markets: number;
  months: number;
  firstObservedOn: string;
  latestObservedOn: string;
  observations: number;
}

export interface CatalogMarketView {
  name: string;
  admin1: string | null;
  admin2: string | null;
  latitude: number | null;
  longitude: number | null;
  commodities: number;
  months: number;
  latestObservedOn: string;
  observations: number;
}

export interface CatalogRegionView {
  name: string;
  markets: number;
  commodities: number;
  months: number;
  latestObservedOn: string;
  observations: number;
}

export interface MarketCatalogView {
  commodities: CatalogCommodityView[];
  markets: CatalogMarketView[];
  regions: CatalogRegionView[];
  months: string[];
  firstObservedOn: string | null;
  latestObservedOn: string | null;
  observations: number;
  marketsWithCoordinates: number;
  sources: { sourceId: string; sourceName: string; sourceUrl: string; dataType: MarketDataTypeValue }[];
}

export interface MarketSummaryView {
  commoditiesWithData: number;
  marketsMonitored: number;
  regionsMonitored: number;
  surveyMonths: number;
  surveyDates: number;
  latestObservation: string | null;
  earliestObservation: string | null;
  currencies: string[];
  units: string[];
  observations: number;
  rowsWithPrice: number;
  rowsWithoutPrice: number;
  duplicateRows: number;
  priceTypes: string[];
  marketsWithCoordinates: number;
  seasonalSeries: number;
  supportedGranularity: ('weekly' | 'monthly')[];
  freshness: FreshnessTier;
  topMovers: MarketInsightView[];
}

export interface MarketRecordPageView {
  records: MarketRecordView[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  matchedWithoutPrice: number;
  latestObservation: string | null;
  oldestObservation: string | null;
}

export interface SeriesStatsView {
  observations: number;
  markets: number;
  firstObservedOn: string;
  latestObservedOn: string;
  average: number | null;
  minimum: { value: number; observedOn: string } | null;
  maximum: { value: number; observedOn: string } | null;
  latest: { value: number; observedOn: string } | null;
  changePct: number | null;
  changeFrom: string | null;
  changeTo: string | null;
  currency: string;
  unit: string;
}

export interface SeriesPointView {
  observedOn: string;
  latestObservation: string;
  average: number;
  minimum: number;
  maximum: number;
  markets: number;
  observations: number;
  currency: string;
  unit: string;
}

export interface SeriesBundleView {
  commodity: string;
  unit: string;
  retail: string;
  points: SeriesPointView[];
  stats: SeriesStatsView | null;
  byMarket: {
    market: string;
    admin1: string | null;
    stats: SeriesStatsView | null;
    latitude: number | null;
    longitude: number | null;
  }[];
  missingDates: string[];
  granularity: 'weekly' | 'monthly';
  weeklySupported: boolean;
  sourceIds: string[];
  freshness: FreshnessTier;
}

export interface SpreadRowView {
  market: string;
  admin1: string | null;
  price: number;
  currency: string;
  unit: string;
  observedOn: string;
  aboveCheapestPct: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface SpreadView {
  observedOn: string;
  commodity: string;
  unit: string;
  retail: string;
  markets: SpreadRowView[];
  cheapest: { market: string; price: number } | null;
  dearest: { market: string; price: number } | null;
  spreadPct: number | null;
  currency: string;
  mappable: number;
}

export interface CompareBundleView {
  month: string;
  monthsAvailable: string[];
  commodity: string;
  unit: string;
  retail: string;
  spread: SpreadView | null;
  byRegion: { region: string; markets: number; average: number; currency: string; unit: string }[];
  sourceIds: string[];
}

export type InsightKind =
  | 'price-rise'
  | 'price-fall'
  | 'market-spread'
  | 'seasonal-coverage'
  | 'market-outdated'
  | 'thin-coverage';

export interface MarketInsightView {
  kind: InsightKind;
  params: Record<string, string | number>;
  period: { from: string; to: string };
  evidence: {
    commodity: string;
    unit: string;
    retail: string;
    markets: string[];
    observations: number;
    sourceName: string;
  };
  /**
   * Dictionary key naming the limitation that applies to this finding. The four strings are
   * a union rather than `string` so a typo fails at build time instead of rendering a key.
   */
  limitationKey:
    | 'markets.insightLimit.change'
    | 'markets.insightLimit.spread'
    | 'markets.insightLimit.seasonal'
    | 'markets.insightLimit.coverage';
}

export interface InsightsBundleView {
  insights: MarketInsightView[];
  seasonal: {
    commodity: string;
    unit: string;
    retail: string;
    markets: number;
    months: number;
    wetVsDryPct: number | null;
  }[];
}

/** Every markets route answers with the per-publisher report beside `data`. */
export interface MarketSourcesExtra {
  sources?: MarketSourceReport[];
}

/* ------------------------------------------------------------------ *
 * Tone registries — one meaning, one colour, across the whole module
 * ------------------------------------------------------------------ */

export const SOURCE_STATE_TONE: Record<SourceReportState, BadgeTone> = {
  connected: 'brand',
  stale: 'gold',
  historical: 'neutral',
  unavailable: 'clay',
  auth_required: 'info',
  not_configured: 'outline',
};

export const FRESHNESS_TONE: Record<FreshnessTier, BadgeTone> = {
  current: 'brand',
  recent: 'info',
  stale: 'gold',
  historical: 'neutral',
  unknown: 'outline',
};

/** Publisher spellings are never translated: they are citation strings. */
export const priceTypeLabel = (retail: string): string =>
  retail === 'Retail' ? 'Retail' : retail === 'Wholesale' ? 'Wholesale' : retail;
