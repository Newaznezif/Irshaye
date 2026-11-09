import type { NextResponse } from 'next/server';

import { badRequest, fromSourced, intParam, isoDateParam, monthParam, stringParam } from '@/lib/data/api';
import { isRecordSort, marketCompare, marketInsights, marketRecords, marketSeries, marketSummary, type RecordQuery } from '@/lib/data/marketService';
import type { MarketPriceObservation } from '@/lib/data/types';

/**
 * GET /api/data/markets — Ethiopia's published market prices.
 *
 * Every figure here comes from a publisher's own survey row: commodity, market, unit,
 * currency and survey date are what the publisher wrote, and nothing is filled in when
 * a row has no price. Each response carries `sources` alongside `provenance`, so the UI
 * can say which publisher answered, which did not, and how old the newest observation is
 * — a successful HTTP response is not the same claim as a current dataset.
 *
 *  - `mode=summary`   what the data covers: commodities, markets, regions, freshness, top movers
 *  - `mode=records`   the explorer's page of rows, with per-row freshness — also what CSV export reads
 *  - `mode=series`    one comparable series (commodity + unit + price type), its statistics and its markets
 *  - `mode=compare`   one survey month across markets, for the regional view
 *  - `mode=insights`  what the observations support saying, with their evidence
 *
 * Filters that name a value (commodity, market, region, unit, sourceId) are matched exactly
 * against the publisher's spelling; `search` is the only substring filter, and it never
 * leaves the server.
 *
 * `granularity` on `mode=series` accepts `weekly` or `monthly` and defaults to monthly.
 * Weekly is honoured only where a publisher that surveys weekly contributes rows to that
 * series; daily is not offered at all, because no market publisher here reports daily prices
 * and a daily chart would have to invent the days between surveys.
 *
 * `month` on `mode=compare` is a survey month — `YYYY-MM`, or any date inside one, which is
 * normalised onto the month. Publishers report months, so the parameter they are filtered by
 * is a month; an unparseable value is refused instead of silently reading as the newest month.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const mode = stringParam(url, 'mode') ?? 'summary';

  const commodity = stringParam(url, 'commodity');
  const market = stringParam(url, 'market');
  const region = stringParam(url, 'region');
  const unit = stringParam(url, 'unit');

  const retailRaw = stringParam(url, 'priceType');
  if (retailRaw && retailRaw !== 'Retail' && retailRaw !== 'Wholesale') {
    return badRequest('priceType must be Retail or Wholesale');
  }
  const retail = (retailRaw ?? null) as MarketPriceObservation['retail'] | null;

  if (mode === 'summary') return fromSourced(await marketSummary(intParam(url, 'movers', 1, 12, 6)), 6 * 3600);

  if (mode === 'records') {
    const from = isoDateParam(url, 'from');
    const to = isoDateParam(url, 'to');
    if (from === 'invalid' || to === 'invalid') return badRequest('from and to must be real YYYY-MM-DD dates');
    if (typeof from === 'string' && typeof to === 'string' && from > to) return badRequest('from must not be after to');

    const sortRaw = stringParam(url, 'sort');
    // A negated type guard inside `if (x && !is(x)) return` leaves `sortRaw` unnarrowed, so the
    // validated value is bound here instead of re-tested below.
    const sort = sortRaw === null ? undefined : isRecordSort(sortRaw) ? sortRaw : null;
    if (sort === null) return badRequest('sort must be observedOn, price, commodity or market');

    const query: RecordQuery = {
      commodity,
      unit,
      retail,
      market,
      region,
      sourceId: stringParam(url, 'sourceId'),
      from,
      to,
      search: stringParam(url, 'search'),
      pricedOnly: stringParam(url, 'pricedOnly') === '1',
      sort,
      direction: stringParam(url, 'direction') === 'asc' ? 'asc' : 'desc',
      page: intParam(url, 'page', 1, 100_000, 1),
      pageSize: intParam(url, 'pageSize', 10, 200, 50),
    };
    return fromSourced(await marketRecords(query), 15 * 60);
  }

  if (mode === 'series') {
    if (!commodity) return badRequest('mode=series requires a commodity, e.g. commodity=Teff');
    const granularityRaw = stringParam(url, 'granularity');
    if (granularityRaw && granularityRaw !== 'weekly' && granularityRaw !== 'monthly') {
      return badRequest('granularity must be weekly or monthly — no market publisher in this app surveys daily');
    }
    const granularity = granularityRaw === 'weekly' ? ('weekly' as const) : granularityRaw === 'monthly' ? ('monthly' as const) : null;
    return fromSourced(
      await marketSeries({
        commodity,
        unit,
        retail,
        market,
        region,
        sourceId: stringParam(url, 'sourceId'),
        months: intParam(url, 'months', 2, 60, 36),
        weeks: intParam(url, 'weeks', 4, 52, 26),
        granularity,
      }),
      6 * 3600,
    );
  }

  if (mode === 'compare') {
    const month = monthParam(url, 'month');
    if (month === 'invalid') return badRequest('month must be a survey month, e.g. 2026-09');
    return fromSourced(
      await marketCompare({ commodity, unit, retail, month, region, sourceId: stringParam(url, 'sourceId') }),
      6 * 3600,
    );
  }

  if (mode === 'insights') return fromSourced(await marketInsights(intParam(url, 'limit', 1, 12, 4)), 6 * 3600);

  return badRequest(`Unknown mode “${mode}”. Expected summary, records, series, compare or insights.`);
}
