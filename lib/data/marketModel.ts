import type { MarketDataType, MarketPriceObservation } from './types';

/**
 * The analytics layer for market observations.
 *
 * Everything here is pure: rows in, figures out, no fetching, no formatting, no
 * wording. That is deliberate — a derived statistic has to be testable against a
 * fixture without a live publisher, and the five locales must not each carry
 * their own copy of the arithmetic. What the platform measured is stated once
 * and translated many times.
 *
 * The rule enforced by these types: a comparison only ever happens inside one
 * (market, commodity, unit, price type) series. "Teff 100 KG" retail and
 * "Teff (white) KG" retail are different goods in different quantities, and
 * dividing one by the other produces a number that looks like inflation and is
 * nothing of the kind.
 */

/** The four fields that make two rows the same fact about the world. */
export const seriesKeyOf = (o: { market: string; commodity: string; unit: string; retail: string }) =>
  [o.market, o.commodity, o.unit, o.retail].join(' | ');

/** Identity across publishers: two sources reporting the same fact get the same id. */
export const observationIdOf = (
  sourceId: string,
  o: { market: string; commodity: string; unit: string; retail: string; observedOn: string },
) => `${sourceId} @ ${o.observedOn} :: ${seriesKeyOf(o)}`;

export interface SourceAttribution {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  dataType: MarketDataType;
  retrievedAt: string;
}

/**
 * De-duplicate on identity, keeping the more informative of the two rows.
 *
 * Returning the count rather than silently dropping rows is the point: a sync that quietly
 * halved the dataset would look like a price collapse next month.
 *
 * "More informative" is not a preference, it is measured. FEWS NET publishes the same series
 * cell twice in the same survey week — verified on the live service for `Refined sugar` at
 * Degehabour on 2026-09-23, once `Collected` with a figure and once `Not Available` with an
 * empty cell. Keeping whichever row arrived first would throw away the published price and
 * report the survey as silent, so a row carrying a figure always wins over an empty cell for
 * the same identity. Two rows that both carry figures are a publisher contradiction, and the
 * first stays: choosing between them would be us deciding a price.
 */
export function dedupeObservations(rows: MarketPriceObservation[]): { rows: MarketPriceObservation[]; duplicates: number } {
  const byId = new Map<string, MarketPriceObservation>();
  for (const r of rows) {
    const kept = byId.get(r.id);
    if (!kept) {
      byId.set(r.id, r);
      continue;
    }
    if (!hasPrice(kept.price) && hasPrice(r.price)) byId.set(r.id, r);
  }
  return { rows: [...byId.values()], duplicates: rows.length - byId.size };
}

const sortableDate = (a: string, b: string) => a.localeCompare(b);

export const monthOf = (isoDate: string) => isoDate.slice(0, 7);

export const distinctMonths = (rows: { observedOn: string }[]): string[] =>
  [...new Set(rows.map((r) => monthOf(r.observedOn)))].sort(sortableDate);

/** True only when the figure is a usable price: a null or non-finite number is a gap, not a zero. */
export const hasPrice = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/* ------------------------------------------------------------------ *
 * Catalogue — what the data actually covers, discovered rather than listed
 * ------------------------------------------------------------------ */

export interface CatalogCommodity {
  name: string;
  category: string | null;
  /** Publisher units, verbatim. One commodity at two units is two comparable series, never one. */
  units: string[];
  retail: MarketPriceObservation['retail'][];
  markets: number;
  months: number;
  firstObservedOn: string;
  latestObservedOn: string;
  observations: number;
}

export interface CatalogMarket {
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

export interface CatalogRegion {
  name: string;
  markets: number;
  commodities: number;
  months: number;
  latestObservedOn: string;
  observations: number;
}

export interface MarketCatalog {
  commodities: CatalogCommodity[];
  markets: CatalogMarket[];
  regions: CatalogRegion[];
  months: string[];
  firstObservedOn: string | null;
  latestObservedOn: string | null;
  observations: number;
  marketsWithCoordinates: number;
  sources: { sourceId: string; sourceName: string; sourceUrl: string; dataType: MarketDataType }[];
}

interface Bucket {
  markets: Set<string>;
  months: Set<string>;
  first: string;
  latest: string;
  observations: number;
  priceless: number;
}

const newBucket = (): Bucket => ({ markets: new Set(), months: new Set(), first: '', latest: '', observations: 0, priceless: 0 });

function into(bucket: Bucket, r: MarketPriceObservation) {
  bucket.markets.add(r.market);
  bucket.months.add(monthOf(r.observedOn));
  bucket.observations += 1;
  if (!hasPrice(r.price)) bucket.priceless += 1;
  if (!bucket.first || r.observedOn < bucket.first) bucket.first = r.observedOn;
  if (!bucket.latest || r.observedOn > bucket.latest) bucket.latest = r.observedOn;
}

/**
 * Everything the loaded rows genuinely cover.
 *
 * The explorer's option lists are built from this instead of from a hardcoded
 * commodity array, so a commodity the publisher never surveyed cannot appear as
 * a clickable filter that answers with an empty chart.
 */
export function buildCatalog(rows: MarketPriceObservation[]): MarketCatalog {
  const commodities = new Map<string, { category: string | null; units: Set<string>; retail: Set<MarketPriceObservation['retail']>; bucket: Bucket; marketsWithPrice: Set<string> }>();
  const markets = new Map<string, { admin1: Set<string>; admin2: Set<string>; lat: number | null; lng: number | null; commodities: Set<string>; bucket: Bucket }>();
  const regions = new Map<string, { markets: Set<string>; commodities: Set<string>; bucket: Bucket }>();
  const sources = new Map<string, { sourceId: string; sourceName: string; sourceUrl: string; dataType: MarketDataType }>();

  for (const r of rows) {
    const commodityKey = `${r.commodity} | ${r.unit}`;
    const c = commodities.get(commodityKey) ?? { category: r.category, units: new Set<string>(), retail: new Set<MarketPriceObservation['retail']>(), bucket: newBucket(), marketsWithPrice: new Set<string>() };
    if (r.category && !c.category) c.category = r.category;
    c.units.add(r.unit);
    c.retail.add(r.retail);
    if (hasPrice(r.price)) c.marketsWithPrice.add(r.market);
    into(c.bucket, r);
    commodities.set(commodityKey, c);

    const m = markets.get(r.market) ?? { admin1: new Set<string>(), admin2: new Set<string>(), lat: r.latitude, lng: r.longitude, commodities: new Set<string>(), bucket: newBucket() };
    if (r.admin1) m.admin1.add(r.admin1);
    if (r.admin2) m.admin2.add(r.admin2);
    // Coordinates are the publisher's, so a null in one row never overwrites a
    // real value from another; the first non-null wins.
    if (m.lat === null && r.latitude !== null) m.lat = r.latitude;
    if (m.lng === null && r.longitude !== null) m.lng = r.longitude;
    m.commodities.add(commodityKey);
    into(m.bucket, r);
    markets.set(r.market, m);

    if (r.admin1) {
      const g = regions.get(r.admin1) ?? { markets: new Set<string>(), commodities: new Set<string>(), bucket: newBucket() };
      g.markets.add(r.market);
      g.commodities.add(commodityKey);
      into(g.bucket, r);
      regions.set(r.admin1, g);
    }

    sources.set(r.sourceId, { sourceId: r.sourceId, sourceName: r.sourceName, sourceUrl: r.sourceUrl, dataType: r.dataType });
  }

  const allMonths = distinctMonths(rows);

  return {
    commodities: [...commodities.entries()]
      .map(([key, c]) => ({
        name: key.split(' | ')[0],
        category: c.category,
        units: [...c.units].sort(),
        retail: [...c.retail].sort(),
        markets: c.marketsWithPrice.size,
        months: c.bucket.months.size,
        firstObservedOn: c.bucket.first,
        latestObservedOn: c.bucket.latest,
        observations: c.bucket.observations,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    markets: [...markets.entries()]
      .map(([name, m]) => ({
        name,
        admin1: [...m.admin1].sort().join('; ') || null,
        admin2: [...m.admin2].sort().join('; ') || null,
        latitude: m.lat,
        longitude: m.lng,
        commodities: m.commodities.size,
        months: m.bucket.months.size,
        latestObservedOn: m.bucket.latest,
        observations: m.bucket.observations,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    regions: [...regions.entries()]
      .map(([name, g]) => ({
        name,
        markets: g.markets.size,
        commodities: g.commodities.size,
        months: g.bucket.months.size,
        latestObservedOn: g.bucket.latest,
        observations: g.bucket.observations,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    months: allMonths,
    firstObservedOn: rows.reduce<string | null>((min, r) => (!min || r.observedOn < min ? r.observedOn : min), null),
    latestObservedOn: rows.reduce<string | null>((max, r) => (!max || r.observedOn > max ? r.observedOn : max), null),
    observations: rows.length,
    marketsWithCoordinates: [...markets.values()].filter((m) => m.lat !== null && m.lng !== null).length,
    sources: [...sources.values()].sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
  };
}

/* ------------------------------------------------------------------ *
 * Series statistics — calculated here, so the UI can label them as ours
 * ------------------------------------------------------------------ */

export interface SeriesStats {
  observations: number;
  markets: number;
  firstObservedOn: string;
  latestObservedOn: string;
  /** Mean of the published figures. Our arithmetic, not the publisher's. */
  average: number | null;
  minimum: { value: number; observedOn: string } | null;
  maximum: { value: number; observedOn: string } | null;
  latest: { value: number; observedOn: string } | null;
  /** Change between the two most recent distinct survey periods that carry figures. */
  changePct: number | null;
  /** The period labels the change was computed between: a YYYY-MM month, or a survey date. */
  changeFrom: string | null;
  changeTo: string | null;
  currency: string;
  unit: string;
}

/**
 * Round to one decimal: a percentage change reported to six digits implies a
 * precision the monthly survey does not have.
 */
const pct = (from: number, to: number) => (from > 0 ? Math.round(((to - from) / from) * 1000) / 10 : null);

/**
 * Statistics for one comparable series (already filtered to a single
 * commodity/unit/price type, and optionally one market).
 *
 * Two figures from the same period in different markets are averaged before the
 * series is read, so a widely surveyed period cannot out-weight a thin one in the
 * min/max/latest comparisons.
 *
 * `bucketOf` decides what a period is. It defaults to the survey month because that is the
 * cadence of the publisher with the deepest history; a weekly publisher is read with its own
 * survey date as the bucket, so a week-over-week change is never described as a month-over-
 * month one.
 */
export function seriesStats(
  rows: MarketPriceObservation[],
  bucketOf: (row: MarketPriceObservation) => string = (r) => monthOf(r.observedOn),
): SeriesStats | null {
  const priced = rows.filter((r) => hasPrice(r.price));
  if (priced.length === 0) return null;

  const byMonth = new Map<string, { sum: number; n: number; latestOn: string }>();
  for (const r of priced) {
    const key = bucketOf(r);
    const m = byMonth.get(key) ?? { sum: 0, n: 0, latestOn: r.observedOn };
    m.sum += r.price as number;
    m.n += 1;
    if (r.observedOn > m.latestOn) m.latestOn = r.observedOn;
    byMonth.set(key, m);
  }
  const months = [...byMonth.entries()]
    .map(([month, b]) => ({ month, avg: b.sum / b.n, latestOn: b.latestOn }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const values = priced.map((r) => r.price as number);
  const min = values.reduce((a, b) => (b < a ? b : a));
  const max = values.reduce((a, b) => (b > a ? b : a));
  const minRow = priced.find((r) => r.price === min)!;
  const maxRow = priced.find((r) => r.price === max)!;
  const lastMonth = months.at(-1)!;
  const prevMonth = months.at(-2) ?? null;

  return {
    observations: priced.length,
    markets: new Set(priced.map((r) => r.market)).size,
    firstObservedOn: priced.reduce((a, b) => (a < b.observedOn ? a : b.observedOn), priced[0].observedOn),
    latestObservedOn: priced.reduce((a, b) => (a > b.observedOn ? a : b.observedOn), priced[0].observedOn),
    average: values.reduce((a, b) => a + b, 0) / values.length,
    minimum: { value: min, observedOn: minRow.observedOn },
    maximum: { value: max, observedOn: maxRow.observedOn },
    // The newest survey date inside the last period, as published, rather than a month start
    // we would have to invent for it.
    latest: { value: lastMonth.avg, observedOn: lastMonth.latestOn },
    changePct: prevMonth ? pct(prevMonth.avg, lastMonth.avg) : null,
    changeFrom: prevMonth?.month ?? null,
    changeTo: lastMonth.month,
    currency: priced[0].currency,
    unit: priced[0].unit,
  };
}

/* ------------------------------------------------------------------ *
 * Cross-market spread for one month
 * ------------------------------------------------------------------ */

export interface MarketSpreadRow {
  market: string;
  admin1: string | null;
  price: number;
  currency: string;
  unit: string;
  observedOn: string;
  /** Percent above the cheapest market in the same month, unit and price type. */
  aboveCheapestPct: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface MarketSpread {
  observedOn: string;
  commodity: string;
  unit: string;
  retail: MarketPriceObservation['retail'];
  markets: MarketSpreadRow[];
  cheapest: { market: string; price: number } | null;
  dearest: { market: string; price: number } | null;
  /** Dearest minus cheapest, as a percent of cheapest. Our arithmetic on published rows. */
  spreadPct: number | null;
  currency: string;
  /** Markets in this month whose publisher row carries usable coordinates. */
  mappable: number;
}

/**
 * One month, one commodity, one unit, one price type — compared across markets.
 *
 * The four-way lock is what makes the spread mean anything: comparing Addis
 * Ababa retail against Dire Dawa wholesale, or Maize per 100 KG against Maize per
 * KG, produces a "regional difference" that is purely an artefact of the
 * question being asked wrong.
 */
export function marketSpread(
  rows: MarketPriceObservation[],
  month: string,
  commodity: string,
  unit: string,
  retail: MarketPriceObservation['retail'],
): MarketSpread | null {
  const candidates = rows.filter(
    (r) =>
      monthOf(r.observedOn) === month &&
      r.commodity === commodity &&
      r.unit === unit &&
      r.retail === retail &&
      hasPrice(r.price),
  );
  if (candidates.length === 0) return null;

  // One row per market: where a market reports twice in a month, the mean of its
  // own rows keeps one outlet from standing in for a whole town.
  const byMarket = new Map<string, { sum: number; n: number; admin1: string | null; lat: number | null; lng: number | null; observedOn: string; currency: string }>();
  for (const r of candidates) {
    const b = byMarket.get(r.market) ?? { sum: 0, n: 0, admin1: r.admin1, lat: r.latitude, lng: r.longitude, observedOn: r.observedOn, currency: r.currency };
    b.sum += r.price as number;
    b.n += 1;
    if (b.admin1 === null) b.admin1 = r.admin1;
    if (b.lat === null && r.latitude !== null) b.lat = r.latitude;
    if (b.lng === null && r.longitude !== null) b.lng = r.longitude;
    if (r.observedOn > b.observedOn) b.observedOn = r.observedOn;
    byMarket.set(r.market, b);
  }

  const priced = [...byMarket.entries()].map(([market, b]) => ({ market, price: b.sum / b.n, ...b }));
  const lowest = priced.reduce((a, b) => (b.price < a.price ? b : a));
  const highest = priced.reduce((a, b) => (b.price > a.price ? b : a));

  return {
    observedOn: month + '-01',
    commodity,
    unit,
    retail,
    currency: priced[0].currency,
    mappable: priced.filter((p) => p.lat !== null && p.lng !== null).length,
    cheapest: priced.length > 1 ? { market: lowest.market, price: lowest.price } : null,
    dearest: priced.length > 1 ? { market: highest.market, price: highest.price } : null,
    spreadPct: priced.length > 1 ? pct(lowest.price, highest.price) : null,
    markets: priced
      .map((p) => ({
        market: p.market,
        admin1: p.admin1,
        price: p.price,
        currency: p.currency,
        // The spread's own lock, not a per-market field: every row here already
        // matches it, so a market that reported a different unit never entered.
        unit,
        observedOn: p.observedOn,
        aboveCheapestPct: priced.length > 1 ? pct(lowest.price, p.price) : null,
        latitude: p.lat,
        longitude: p.lng,
      }))
      .sort((a, b) => b.price - a.price),
  };
}

/* ------------------------------------------------------------------ *
 * Seasonal sufficiency
 * ------------------------------------------------------------------ */

/** Months of observations a series needs before a seasonal pattern may be named. */
export const SEASON_MIN_MONTHS = 12;

export interface SeasonalSeries {
  commodity: string;
  unit: string;
  retail: MarketPriceObservation['retail'];
  markets: number;
  months: number;
  /** Wet-season (June–September) mean against the rest of the year, in percent. */
  wetVsDryPct: number | null;
}

/**
 * Series with a full year of monthly coverage.
 *
 * A seasonal claim needs to see the same months twice or it is a description of
 * one year, not a pattern — and one year of one market is a story about that
 * market, which is why the market count travels with the figure.
 */
export function seasonalCandidates(rows: MarketPriceObservation[]): SeasonalSeries[] {
  // Group on commodity/unit/price type only — the market count is a property of
  // the group, not part of its identity.
  const bySeries = new Map<string, MarketPriceObservation[]>();
  for (const r of rows) {
    if (!hasPrice(r.price)) continue;
    const key = `${r.commodity}|${r.unit}|${r.retail}`;
    const bucket = bySeries.get(key);
    if (bucket) bucket.push(r);
    else bySeries.set(key, [r]);
  }

  const out: SeasonalSeries[] = [];
  for (const bucket of bySeries.values()) {
    const months = new Set(bucket.map((r) => monthOf(r.observedOn)));
    if (months.size < SEASON_MIN_MONTHS) continue;
    const monthNumber = (r: MarketPriceObservation) => Number(r.observedOn.slice(5, 7));
    const wet = bucket.filter((r) => monthNumber(r) >= 6 && monthNumber(r) <= 9);
    const dry = bucket.filter((r) => !(monthNumber(r) >= 6 && monthNumber(r) <= 9));
    const mean = (list: MarketPriceObservation[]) =>
      list.length ? list.reduce((a, r) => a + (r.price as number), 0) / list.length : null;
    const wetMean = mean(wet);
    const dryMean = mean(dry);
    out.push({
      commodity: bucket[0].commodity,
      unit: bucket[0].unit,
      retail: bucket[0].retail,
      markets: new Set(bucket.map((r) => r.market)).size,
      months: months.size,
      wetVsDryPct: wetMean !== null && dryMean !== null ? pct(dryMean, wetMean) : null,
    });
  }
  return out.sort((a, b) => b.months - a.months);
}
