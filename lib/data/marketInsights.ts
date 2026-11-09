import { monthOf, distinctMonths, hasPrice, seriesKeyOf, type SeasonalSeries } from './marketModel';
import type { MarketPriceObservation } from './types';

/**
 * What the observations actually support saying.
 *
 * An insight here is a *fact plus its own evidence*, never a conclusion: the
 * component that renders it supplies the wording from the locale dictionary, so
 * five languages get the same finding rather than five different amounts of
 * confidence. Nothing in this file can claim causation, and nothing in it
 * projects a price forward — both would need data this platform does not have.
 *
 * The rows are filtered to `priceFlag === 'actual'` before any movement is
 * computed. WFP marks some rows `replaced` (an estimate standing in for a
 * missing survey) and `aggregate`; calling a replaced figure a price rise would
 * report our arithmetic as a market event.
 */

export type InsightKind =
  | 'price-rise'
  | 'price-fall'
  | 'market-spread'
  | 'seasonal-coverage'
  | 'market-outdated'
  | 'thin-coverage';

export interface MarketInsight {
  kind: InsightKind;
  /**
   * Raw values only — numbers, ISO dates, and publisher spellings. Formatted with
   * the reader's locale at render time, so a percentage never freezes into the
   * decimal comma of whichever language happened to compute it.
   */
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
  /** Dictionary key naming the limitation that applies to this finding. */
  limitationKey: 'markets.insightLimit.change' | 'markets.insightLimit.spread' | 'markets.insightLimit.seasonal' | 'markets.insightLimit.coverage';
}

/** A month-on-month movement is only reportable when both months carry a real figure. */
interface SeriesPoint {
  observedOn: string;
  price: number;
  market: string;
  commodity: string;
  unit: string;
  retail: string;
  currency: string;
  sourceName: string;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Mean price per (series, month), so a month with more surveyed outlets cannot outweigh a thinner one. */
function monthlyMeans(rows: MarketPriceObservation[]): Map<string, SeriesPoint[]> {
  const bySeries = new Map<string, Map<string, { sum: number; n: number; sample: SeriesPoint }>>();
  for (const r of rows) {
    if (!hasPrice(r.price)) continue;
    const key = seriesKeyOf(r);
    const months = bySeries.get(key) ?? new Map<string, { sum: number; n: number; sample: SeriesPoint }>();
    const month = monthOf(r.observedOn);
    const bucket = months.get(month) ?? {
      sum: 0,
      n: 0,
      sample: {
        observedOn: r.observedOn,
        price: r.price,
        market: r.market,
        commodity: r.commodity,
        unit: r.unit,
        retail: r.retail,
        currency: r.currency,
        sourceName: r.sourceName,
      },
    };
    bucket.sum += r.price;
    bucket.n += 1;
    months.set(month, bucket);
    bySeries.set(key, months);
  }

  const out = new Map<string, SeriesPoint[]>();
  for (const [key, months] of bySeries) {
    out.set(
      key,
      [...months.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, b]) => ({ ...b.sample, observedOn: `${month}-01`, price: b.sum / b.n })),
    );
  }
  return out;
}

/**
 * The largest verified movements, up and down.
 *
 * `changePct` is computed between two consecutive survey months of the *same*
 * market, commodity, unit and price type, so the sentence it fills in is about
 * one outlet's shelf price, not a national index the publisher never published.
 */
function movements(rows: MarketPriceObservation[], limit: number): MarketInsight[] {
  const out: MarketInsight[] = [];
  for (const [, points] of monthlyMeans(rows)) {
    if (points.length < 2) continue;
    const latest = points.at(-1)!;
    const previous = points.at(-2)!;
    if (previous.price <= 0) continue;
    const changePct = round1(((latest.price - previous.price) / previous.price) * 100);
    if (!Number.isFinite(changePct) || Math.abs(changePct) < 1) continue;
    out.push({
      kind: changePct > 0 ? 'price-rise' : 'price-fall',
      params: {
        commodity: latest.commodity,
        unit: latest.unit,
        market: latest.market,
        retail: latest.retail,
        pct: Math.abs(changePct),
        from: previous.observedOn,
        to: latest.observedOn,
        price: round1(latest.price),
        currency: latest.currency,
      },
      period: { from: previous.observedOn, to: latest.observedOn },
      evidence: {
        commodity: latest.commodity,
        unit: latest.unit,
        retail: latest.retail,
        markets: [latest.market],
        observations: points.length,
        sourceName: latest.sourceName,
      },
      limitationKey: 'markets.insightLimit.change',
    });
  }
  return out.sort((a, b) => Math.abs(b.params.pct as number) - Math.abs(a.params.pct as number)).slice(0, limit);
}

/**
 * The widest gap between two markets selling the same thing in the same month.
 *
 * A real price difference is a fact about transport, seasonality and local
 * supply at once — this reports the gap and stops there.
 */
function spreads(rows: MarketPriceObservation[], month: string, limit: number): MarketInsight[] {
  const byGroup = new Map<string, MarketPriceObservation[]>();
  for (const r of rows) {
    if (monthOf(r.observedOn) !== month || !hasPrice(r.price)) continue;
    const key = `${r.commodity}|${r.unit}|${r.retail}`;
    const bucket = byGroup.get(key);
    if (bucket) bucket.push(r);
    else byGroup.set(key, [r]);
  }

  const out: MarketInsight[] = [];
  for (const [, group] of byGroup) {
    if (new Set(group.map((r) => r.market)).size < 2) continue;
    // One mean per market, then the extremes: two rows from one town must not
    // masquerade as two towns.
    const perMarket = new Map<string, { sum: number; n: number }>();
    for (const r of group) {
      const b = perMarket.get(r.market) ?? { sum: 0, n: 0 };
      b.sum += r.price as number;
      b.n += 1;
      perMarket.set(r.market, b);
    }
    const means = [...perMarket.entries()].map(([market, b]) => ({ market, price: b.sum / b.n }));
    const low = means.reduce((a, b) => (b.price < a.price ? b : a));
    const high = means.reduce((a, b) => (b.price > a.price ? b : a));
    if (low.price <= 0) continue;
    const spreadPct = round1(((high.price - low.price) / low.price) * 100);
    if (spreadPct < 10) continue;
    out.push({
      kind: 'market-spread',
      params: {
        commodity: group[0].commodity,
        unit: group[0].unit,
        retail: group[0].retail,
        dearest: high.market,
        cheapest: low.market,
        pct: spreadPct,
        markets: means.length,
        month,
        currency: group[0].currency,
      },
      period: { from: `${month}-01`, to: `${month}-01` },
      evidence: {
        commodity: group[0].commodity,
        unit: group[0].unit,
        retail: group[0].retail,
        markets: means.map((m) => m.market),
        observations: group.length,
        sourceName: group[0].sourceName,
      },
      limitationKey: 'markets.insightLimit.spread',
    });
  }
  return out.sort((a, b) => (b.params.pct as number) - (a.params.pct as number)).slice(0, limit);
}

/** Markets whose newest survey row is older than the publisher's latest month. */
function outdatedMarkets(rows: MarketPriceObservation[], latestMonth: string): MarketInsight[] {
  const latestPerMarket = new Map<string, { observedOn: string; sourceName: string }>();
  for (const r of rows) {
    const current = latestPerMarket.get(r.market);
    if (!current || r.observedOn > current.observedOn) latestPerMarket.set(r.market, { observedOn: r.observedOn, sourceName: r.sourceName });
  }

  const monthsMissing = new Map<string, number>();
  for (const [, v] of latestPerMarket) {
    const gap = monthsBetween(v.observedOn, `${latestMonth}-01`);
    if (gap >= 2) monthsMissing.set(v.observedOn.slice(0, 7), (monthsMissing.get(v.observedOn.slice(0, 7)) ?? 0) + 1);
  }
  const worst = [...monthsMissing.entries()].sort((a, b) => a[0].localeCompare(b[0]))[0];
  if (!worst) return [];

  const [worstMonth] = worst;
  const markets = [...latestPerMarket.entries()]
    .filter(([, v]) => monthOf(v.observedOn) === worstMonth)
    .map(([market]) => market);
  return [
    {
      kind: 'market-outdated',
      params: {
        months: markets.length,
        lastMonth: worstMonth,
        latestMonth,
        markets: markets.slice(0, 4).join(', '),
        more: Math.max(0, markets.length - 4),
      },
      period: { from: `${worstMonth}-01`, to: `${latestMonth}-01` },
      evidence: {
        commodity: '—',
        unit: '—',
        retail: '—',
        markets,
        observations: rows.length,
        sourceName: rows[0]?.sourceName ?? '—',
      },
      limitationKey: 'markets.insightLimit.coverage',
    },
  ];
}

function monthsBetween(fromIso: string, toIso: string): number {
  const [fy, fm] = fromIso.slice(0, 7).split('-').map(Number);
  const [ty, tm] = toIso.slice(0, 7).split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/** Commodities so thinly surveyed that any national average would be one town's shelf. */
function thinCoverage(rows: MarketPriceObservation[], limit: number): MarketInsight[] {
  const byCommodity = new Map<string, { markets: Set<string>; unit: string; retail: string; sourceName: string; observations: number }>();
  for (const r of rows) {
    if (!hasPrice(r.price)) continue;
    const key = `${r.commodity}|${r.unit}|${r.retail}`;
    const b = byCommodity.get(key) ?? { markets: new Set<string>(), unit: r.unit, retail: r.retail, sourceName: r.sourceName, observations: 0 };
    b.markets.add(r.market);
    b.observations += 1;
    byCommodity.set(key, b);
  }
  const out: MarketInsight[] = [];
  for (const [key, b] of byCommodity) {
    if (b.markets.size > 1) continue;
    out.push({
      kind: 'thin-coverage',
      params: { commodity: key.split('|')[0], unit: b.unit, retail: b.retail, market: [...b.markets][0] },
      period: { from: '', to: '' },
      evidence: {
        commodity: key.split('|')[0],
        unit: b.unit,
        retail: b.retail,
        markets: [...b.markets],
        observations: b.observations,
        sourceName: b.sourceName,
      },
      limitationKey: 'markets.insightLimit.coverage',
    });
  }
  return out
    .sort((a, b) => String(a.params.commodity).localeCompare(String(b.params.commodity)))
    .slice(0, limit);
}

/** Series with a full year or more — the honest count of what seasonality can be discussed at all. */
function seasonality(seasonal: SeasonalSeries[]): MarketInsight[] {
  if (seasonal.length === 0) return [];
  const top = seasonal[0];
  return [
    {
      kind: 'seasonal-coverage',
      params: { series: seasonal.length, commodity: top.commodity, unit: top.unit, months: top.months, markets: top.markets },
      period: { from: '', to: '' },
      evidence: {
        commodity: top.commodity,
        unit: top.unit,
        retail: top.retail,
        markets: [],
        observations: top.months,
        sourceName: '—',
      },
      limitationKey: 'markets.insightLimit.seasonal',
    },
  ];
}

export interface InsightsInput {
  rows: MarketPriceObservation[];
  seasonal: SeasonalSeries[];
  /** Rows to keep for each movement type. */
  limit?: number;
}

/**
 * Build the findings for this dataset.
 *
 * Ordered by how directly the data supports the claim: an observed movement in a
 * named market first, then a same-month gap between markets, then statements
 * about coverage itself. `priceFlag === 'actual'` gating happens here so a caller
 * cannot forget it.
 */
export function buildInsights({ rows, seasonal, limit = 4 }: InsightsInput): MarketInsight[] {
  const actual = rows.filter((r) => r.priceFlag === 'actual');
  const months = distinctMonths(actual);
  const latestMonth = months.at(-1) ?? null;

  const movement = movements(actual, limit);
  const spread = latestMonth ? spreads(actual, latestMonth, limit) : [];
  const stale = latestMonth ? outdatedMarkets(actual, latestMonth) : [];

  return [
    ...movement.slice(0, 3),
    ...spread.slice(0, 2),
    ...seasonality(seasonal),
    ...stale,
    ...thinCoverage(actual, 3),
  ];
}
