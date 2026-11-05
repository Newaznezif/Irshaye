#!/usr/bin/env node
/**
 * Unit tests for the market module's data path — the parts that must be right whether or not
 * a publisher happens to answer when the suite runs.
 *
 * `check:data` grades the live contract; this file grades the pure logic: normalization of
 * each publisher's CSV, the gap-vs-zero rule, de-duplication, series statistics, the
 * four-way comparison lock, freshness graded against each publisher's own cadence, CSV export
 * safety, and the dictionary keys the module can only reach by string interpolation.
 *
 * Run with `npm run test:market`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { parseFewsNetPrices } from '../lib/data/fewsNetPrices.ts';
import { parsePriceCsv } from '../lib/data/wfpMarketPrices.ts';
import {
  SEASON_MIN_MONTHS,
  buildCatalog,
  dedupeObservations,
  marketSpread,
  observationIdOf,
  seasonalCandidates,
  seriesStats,
} from '../lib/data/marketModel.ts';
import { buildInsights } from '../lib/data/marketInsights.ts';
import { classifyFreshness, retrievalAgeSeconds } from '../lib/data/freshness.ts';
import { csvFileName, sanitizeCsvCell, toCsv } from '../lib/ui/csv.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ *
 * Harness
 * ------------------------------------------------------------------ */

const results = [];
let group = 'general';
const section = (name) => {
  group = name;
};
const yes = (label, condition, detail = '') => results.push({ group, label, pass: condition === true, detail: condition === true ? '' : detail });
const show = (value) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text === undefined ? String(value) : text.slice(0, 120);
};
const same = (label, actual, expected) =>
  yes(label, show(actual) === show(expected), `got ${show(actual)} · want ${show(expected)}`);

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const AT = {
  sourceId: 'fewsnet-market-prices',
  sourceName: 'FEWS NET Ethiopia Market Prices',
  sourceUrl: 'https://data.fewsnet.example/ethiopia',
  dataType: 'market-survey',
  retrievedAt: '2026-11-01T06:00:00.000Z',
};

const HDX_AT = { ...AT, sourceId: 'wfp-hdx-prices', sourceName: 'WFP rEMS (HDX)', sourceUrl: 'https://data.hdx.example/wfp-food-prices-for-ethiopia' };

const FEWS_COLUMNS = [
  'market', 'market_id', 'fnid', 'product', 'cpcv2', 'period_date', 'price_type', 'unit', 'currency',
  'status', 'collection_status', 'value', 'common_currency', 'common_currency_price', 'exchange_rate',
  'admin_1', 'admin_2', 'latitude', 'longitude', 'collection_schedule', 'data_usage_policy', 'created', 'modified',
];

const fewsCsv = (...overrides) =>
  [
    FEWS_COLUMNS.join(','),
    ...overrides.map((o) => {
      const row = { market: 'Mekele', product: 'Teff', period_date: '2026-09-23', price_type: 'Retail', unit: 'KG', currency: 'ETB', status: 'Collected', value: '1840', collection_schedule: 'Weekly', ...o };
      return FEWS_COLUMNS.map((c) => row[c] ?? '').join(',');
    }),
  ].join('\n');

const HDX_COLUMNS = [
  'date', 'market', 'market_id', 'commodity', 'category', 'unit', 'currency', 'price', 'usdprice',
  'pricetype', 'priceflag', 'admin1', 'admin2', 'latitude', 'longitude',
];

const hdcCsv = (...overrides) =>
  [
    HDX_COLUMNS.join(','),
    ...overrides.map((o) => {
      const row = { date: '2026-09-15', market: 'Adama', commodity: 'Maize', unit: '100 KG', currency: 'ETB', price: '3100', pricetype: 'Retail', priceflag: 'Actual', ...o };
      return HDX_COLUMNS.map((c) => row[c] ?? '').join(',');
    }),
  ].join('\n');

/** A complete published row, with the identity the module derives rather than invents. */
const row = (o = {}) => {
  const base = {
    sourceId: 'wfp-hdx-prices',
    sourceName: 'WFP rEMS',
    sourceUrl: 'https://data.hdx.example/wfp',
    dataType: 'market-survey',
    observedOn: '2026-09-15',
    market: 'Mekele',
    marketId: null,
    admin1: 'Tigray',
    admin2: null,
    latitude: null,
    longitude: null,
    commodity: 'Teff',
    category: 'Cereals',
    unit: 'KG',
    currency: 'ETB',
    price: 100,
    usdPrice: null,
    retail: 'Retail',
    priceFlag: 'actual',
    retrievedAt: '2026-11-01T06:00:00.000Z',
    sourceFields: {},
    ...o,
  };
  return { ...base, id: observationIdOf(base.sourceId, base) };
};

const NOW = Date.UTC(2026, 10, 4, 12, 0, 0);
const DAY = 86_400_000;

/* ------------------------------------------------------------------ *
 * A · FEWS NET normalization
 * ------------------------------------------------------------------ */

section('FEWS NET normalization');
{
  const parsed = parseFewsNetPrices(
    fewsCsv(
      {},
      { status: 'Not Available', value: '' },
      { price_type: 'Wage', unit: 'Day', product: 'Casual labour', value: '500' },
      { market: '', value: '100' },
      { period_date: '23/09/2026', value: '100' },
      { value: 'not a number', market: 'Wolisso' },
      { price_type: 'Wholesale', unit: '100 KG', market: 'Adama' },
      { latitude: '13.59', longitude: '39.47', market: 'Axum', value: '2000' },
      { market: 'Hawassa', currency: 'ETB', common_currency: 'USD', common_currency_price: '22.5', value: '1234' },
    ),
    AT,
  );

  const first = parsed.observations[0];
  same('a Collected row reads as a figure', first.price, 1840);
  same('a Collected row is flagged actual', first.priceFlag, 'actual');
  same('a non-price status becomes a gap, not a zero', parsed.observations[1].price, null);
  same('a gap is flagged unknown rather than actual', parsed.observations[1].priceFlag, 'unknown');
  same('wage rows are counted, not dropped quietly', parsed.wageRows, 1);
  yes('no wage row entered the commodity series', !parsed.observations.some((o) => o.commodity === 'Casual labour'));
  same('rows with no market are counted as malformed', parsed.malformedRows, 2);
  yes('a day-shaped date in another format never enters the series', !parsed.observations.some((o) => o.observedOn === '23/09/2026'));
  yes('an unreadable value is a gap, never 0', !parsed.observations.some((o) => o.price === 0));
  same('an unreadable figure yields a gap, not 0', parsed.observations.find((o) => o.market === 'Wolisso')?.price, null);
  same('the publisher unit is kept verbatim', parsed.observations.find((o) => o.market === 'Adama')?.unit, '100 KG');
  same('retail and wholesale stay distinct price types', parsed.observations.find((o) => o.market === 'Adama')?.retail, 'Wholesale');
  same('coordinates are kept when published', parsed.observations.find((o) => o.market === 'Axum')?.latitude, 13.59);
  yes('a market with no published coordinate stays unmapped', first.latitude === null && first.longitude === null);
  same('the publisher currency is kept', parsed.observations.find((o) => o.market === 'Hawassa')?.currency, 'ETB');
  same('the publisher’s own USD conversion is kept as theirs', parsed.observations.find((o) => o.market === 'Hawassa')?.usdPrice, 22.5);
  yes('a row without a common currency has no USD figure invented', parsed.observations.every((o) => (o.market === 'Hawassa' ? true : o.usdPrice === null)));
  same('attribution travels with every row', [parsed.observations.every((o) => o.sourceId === AT.sourceId && o.sourceName === AT.sourceName && o.sourceUrl === AT.sourceUrl && o.dataType === 'market-survey' && o.retrievedAt === AT.retrievedAt), true].join(), 'true,true');
  same('the declared collection schedule is recorded', parsed.declaredSchedules.join(), 'Weekly');
  same('a survey cell keeps the publisher’s own state string', first.sourceFields.collectionState, 'Collected');

  const bom = parseFewsNetPrices(`\uFEFF${fewsCsv({})}`, AT);
  same('a byte-order mark does not corrupt the first column', bom.observations[0]?.market, 'Mekele');

  const repeated = parseFewsNetPrices(fewsCsv({}, {}), AT);
  same('the same published cell twice gets the same identity', new Set(repeated.observations.map((o) => o.id)).size, 1);
}

/* ------------------------------------------------------------------ *
 * B · WFP / HDX price-file normalization
 * ------------------------------------------------------------------ */

section('WFP price file normalization');
{
  const parsed = parsePriceCsv(
    hdcCsv(
      { market: 'Adama' },
      { market: 'Bahir Dar', pricetype: 'Wholesale' },
      { market: 'Dessie', pricetype: 'Aggregate', priceflag: 'Aggregate' },
      { market: 'Gondar', pricetype: 'Other', priceflag: 'Replaced' },
      { market: 'Hawassa', price: '' },
      { market: 'Jimma', price: 'abc' },
      { market: 'Kombolcha', date: '15/09/2026' },
      { market: 'Mekdela', commodity: '' },
      { market: 'Neu Sara', unit: '', currency: '' },
      { market: 'Shashamanane', priceflag: 'Actual', latitude: '8.54', longitude: '40.08', usdprice: '34.2' },
      { market: 'Gode', latitude: '', longitude: '', usdprice: '' },
    ),
    HDX_AT,
  );
  const at = (name) => parsed.rows.find((r) => r.market === name);

  same('retail is a distinct price type', at('Adama').retail, 'Retail');
  same('wholesale is a distinct price type', at('Bahir Dar').retail, 'Wholesale');
  same('an aggregate row is not read as a shelf price', at('Dessie').retail, 'aggregate');
  same('an unrecognised price type stays unknown', at('Gondar').retail, 'unknown');
  same('the publisher flag is normalised', at('Dessie').priceFlag, 'aggregate');
  same('a replaced figure is flagged as one', at('Gondar').priceFlag, 'replaced');
  yes('an empty price cell stays a gap', at('Hawassa').price === null && at('Hawassa').price !== 0);
  yes('an unreadable price never becomes 0', at('Jimma').price === null);
  same('an unreadable date is counted, not dropped silently', parsed.unreadableRows, 2);
  same('a blank unit becomes a stated unknown, not KG', at('Neu Sara').unit, 'unknown');
  same('a blank currency defaults to the published currency', at('Neu Sara').currency, 'ETB');
  same('coordinates are kept exactly as published', at('Shashamanane').latitude, 8.54);
  yes('a blank coordinate is no coordinate, not the equator', at('Gode').latitude === null && at('Gode').longitude === null);
  same('a blank USD cell is a gap, not 0', at('Gode').usdPrice, null);
  same('the publisher’s own USD column is preserved', at('Shashamanane').usdPrice, 34.2);
  same('the raw published cell is retained for dispute', at('Jimma').sourceFields.rawPrice, 'abc');
  same('dataType says what kind of figure this is', at('Adama').dataType, 'market-survey');
  yes('every row carries its publisher', parsed.rows.every((r) => r.sourceId === HDX_AT.sourceId && r.sourceUrl === HDX_AT.sourceUrl));

  const empty = parsePriceCsv(HDX_COLUMNS.join(','), HDX_AT);
  yes('a header-only file parses to no rows and none invented', empty.rows.length === 0 && empty.unreadableRows === 0);
}

/* ------------------------------------------------------------------ *
 * C · Identity and de-duplication
 * ------------------------------------------------------------------ */

section('De-duplication');
{
  const figure = row({ price: 1840 });
  const gap = row({ price: null, priceFlag: 'unknown' });
  const other = dedupeObservations([figure, gap]);
  same('a duplicate is counted, not hidden', other.duplicates, 1);
  same('the row carrying a published figure is the one kept', other.rows[0].price, 1840);

  const contradiction = dedupeObservations([row({ price: 1840 }), row({ price: 1900 })]);
  same('two different published figures keep the first — we do not choose a price', contradiction.rows[0].price, 1840);

  const distinct = dedupeObservations([
    row({ unit: 'KG' }),
    row({ unit: '100 KG' }),
    row({ retail: 'Wholesale' }),
    row({ market: 'Adama' }),
    row({ commodity: 'Maize' }),
  ]);
  same('a different unit, price type, market or commodity is a different fact', distinct.rows.length, 5);
  same('nothing was reported as a duplicate then', distinct.duplicates, 0);
}

/* ------------------------------------------------------------------ *
 * D · Series statistics and the comparison lock
 * ------------------------------------------------------------------ */

section('Series statistics');
{
  const rows = [
    row({ observedOn: '2026-08-05', price: 100 }),
    row({ observedOn: '2026-08-20', price: 300, market: 'Adama' }),
    row({ observedOn: '2026-09-15', price: 220 }),
    row({ observedOn: '2026-09-30', price: null, priceFlag: 'unknown' }),
  ];
  const stats = seriesStats(rows);
  same('only figures count as observations', stats.observations, 3);
  same('the mean is of the published figures', Math.round(stats.average * 100) / 100, 206.67);
  same('minimum keeps the date it was recorded at', `${stats.minimum.value}@${stats.minimum.observedOn}`, '100@2026-08-05');
  same('maximum likewise', `${stats.maximum.value}@${stats.maximum.observedOn}`, '300@2026-08-20');
  same('a month with two outlets is averaged before the series is read', stats.latest.value, 220);
  same('the latest point carries a real survey date', stats.latest.observedOn, '2026-09-15');
  same('change is computed between the two periods with figures', stats.changePct, 10);
  same('and says which periods those were', `${stats.changeFrom}→${stats.changeTo}`, '2026-08→2026-09');
  same('the unit is the publisher’s, unmolested', stats.unit, 'KG');
  same('the currency is the publisher’s, unmolested', stats.currency, 'ETB');

  same('a series of figures that are all gaps produces no statistics', seriesStats([row({ price: null })]), null);
  const single = seriesStats([row({ price: 100 })]);
  yes('one period reports no percentage change', single.changePct === null && single.changeFrom === null);

  section('Comparison lock');
  const month = '2026-09';
  const spreadRows = [
    row({ market: 'Mekele', observedOn: '2026-09-10', price: 100, latitude: 13.5, longitude: 39.5 }),
    row({ market: 'Adama', observedOn: '2026-09-12', price: 150, latitude: null, longitude: null }),
    row({ market: 'Hawassa', observedOn: '2026-09-12', price: 900, retail: 'Wholesale' }),
    row({ market: 'Bahir Dar', observedOn: '2026-09-12', price: 900, unit: '100 KG' }),
    row({ market: 'Gondar', observedOn: '2026-10-01', price: 900 }),
    row({ market: 'Jimma', observedOn: '2026-09-12', price: null, priceFlag: 'unknown' }),
  ];
  const spread = marketSpread(spreadRows, month, 'Teff', 'KG', 'Retail');
  same('a wholesale row never joins a retail comparison', spread.markets.length, 2);
  same('a different unit never joins the comparison either', spread.markets.every((m) => m.unit === 'KG'), true);
  same('another month never joins it', spread.markets.some((m) => m.market === 'Gondar'), false);
  same('a market whose figure is a gap is absent, not zero', spread.markets.some((m) => m.market === 'Jimma'), false);
  same('cheapest is the cheapest of the markets that reported', spread.cheapest.market, 'Mekele');
  same('dearest likewise', spread.dearest.market, 'Adama');
  same('the spread is our arithmetic on the published means', spread.spreadPct, 50);
  same('only markets with a published coordinate are mappable', spread.mappable, 1);
  same('the row above cheapest states its own percentage', spread.markets.find((m) => m.market === 'Adama').aboveCheapestPct, 50);
  same('two outlets of one market are averaged before comparing', marketSpread([row({ market: 'X', price: 100 }), row({ market: 'X', price: 200 }), row({ market: 'Y', price: 300 })], month, 'Teff', 'KG', 'Retail').markets.find((m) => m.market === 'X').price, 150);
  same('a month with one market has no spread to report', marketSpread([row({ market: 'Mekele' })], month, 'Teff', 'KG', 'Retail').spreadPct, null);

  section('Catalogue');
  const catalog = buildCatalog(spreadRows);
  same('the catalogue counts the survey months actually published', catalog.months.length, 2);
  yes(
    'one commodity at two units is two catalogue entries, never one',
    catalog.commodities.filter((c) => c.name === 'Teff').length === 2 && catalog.commodities.every((c) => c.units.length === 1),
    show(catalog.commodities.map((c) => `${c.name}/${c.units.join()}`)),
  );
  same('markets are counted from published rows', catalog.markets.length, expectMarkets(spreadRows));
  same('only publisher coordinates count as mappable', catalog.marketsWithCoordinates, 1);
  const nothing = buildCatalog([]);
  yes(
    'an empty dataset catalogues as empty, with no invented zero',
    [nothing.commodities, nothing.markets, nothing.regions, nothing.months].every((list) => list.length === 0) &&
      nothing.observations === 0 &&
      nothing.firstObservedOn === null &&
      nothing.latestObservedOn === null &&
      nothing.marketsWithCoordinates === 0,
  );
}

function expectMarkets(rows) {
  return new Set(rows.map((r) => r.market)).size;
}

/* ------------------------------------------------------------------ *
 * E · Freshness graded against each publisher’s own cadence
 * ------------------------------------------------------------------ */

section('Freshness classification');
{
  const daysAgo = (n) => new Date(NOW - n * DAY).toISOString().slice(0, 10);
  const monthly = { cadence: 'monthly', publicationLagSeconds: 0 };
  same('a month-old figure from a monthly survey is current', classifyFreshness(daysAgo(30), monthly, NOW).tier, 'current');
  same('two cycles old is recent', classifyFreshness(daysAgo(50), monthly, NOW).tier, 'recent');
  same('three cycles is behind schedule', classifyFreshness(daysAgo(100), monthly, NOW).tier, 'stale');
  same('beyond four cycles it is a historical record', classifyFreshness(daysAgo(200), monthly, NOW).tier, 'historical');

  const weekly = { cadence: 'weekly', publicationLagSeconds: 0 };
  same('a weekly survey two days old is current', classifyFreshness(daysAgo(2), weekly, NOW).tier, 'current');
  same('ten days is a missed week, not a catastrophe', classifyFreshness(daysAgo(10), weekly, NOW).tier, 'recent');
  same('three weeks late is behind schedule for a weekly publisher', classifyFreshness(daysAgo(21), weekly, NOW).tier, 'stale');
  same('the same three weeks is current for a monthly one', classifyFreshness(daysAgo(21), monthly, NOW).tier, 'current');
  same('and six weeks is history for a weekly publisher, recent for a monthly one', [classifyFreshness(daysAgo(42), weekly, NOW).tier, classifyFreshness(daysAgo(42), monthly, NOW).tier].join('/'), 'historical/recent');

  const annual = { cadence: 'annual', publicationLagSeconds: 0 };
  same('a 400-day-old annual indicator is not yet stale', classifyFreshness(daysAgo(400), annual, NOW).tier, 'recent');

  const delayed = { cadence: 'daily', publicationLagSeconds: 3 * 86_400 };
  same('a publisher’s declared release lag is not the data being old', classifyFreshness(daysAgo(3), delayed, NOW).tier, 'current');
  same('without that declared lag the same reading is behind schedule', classifyFreshness(daysAgo(3), { cadence: 'daily', publicationLagSeconds: 0 }, NOW).tier, 'stale');

  const irregular = { cadence: 'irregular', publicationLagSeconds: 0 };
  same('an irregular publisher with no cycle is classified, never graded current', classifyFreshness(daysAgo(120), irregular, NOW).tier, 'recent');
  same('and beyond a long contract it is historical', classifyFreshness(daysAgo(500), irregular, NOW).tier, 'historical');

  for (const unusable of [null, undefined, '', 'not a date', '2026-13-45']) {
    same(`an unusable date (${show(unusable)}) is unknown, never current`, classifyFreshness(unusable, monthly, NOW).tier, 'unknown');
  }
  same('an unusable date reports no age', classifyFreshness('', monthly, NOW).ageSeconds, null);
  same('a future observation is not credited with negative age', classifyFreshness(daysAgo(-5), monthly, NOW).ageSeconds, 0);
  same('the interval used is published with the tier', classifyFreshness(daysAgo(1), weekly, NOW).intervalSeconds, 7 * 86_400);
  same('an irregular source publishes no interval', classifyFreshness(daysAgo(1), irregular, NOW).intervalSeconds, null);
  same('retrieval age is measured from our own fetch', retrievalAgeSeconds(new Date(NOW - 2 * 3_600_000).toISOString(), NOW) / 3600, 2);
  same('a fetch we cannot timestamp says so', retrievalAgeSeconds(null, NOW), null);
}

/* ------------------------------------------------------------------ *
 * F · Insights stay inside what the rows support
 * ------------------------------------------------------------------ */

section('Insights');
{
  const rise = [
    row({ market: 'Mekele', observedOn: '2026-08-05', price: 100 }),
    row({ market: 'Mekele', observedOn: '2026-09-05', price: 150 }),
    row({ market: 'Adama', observedOn: '2026-09-05', price: 400 }),
  ];
  const insights = buildInsights({ rows: rise, seasonal: seasonalCandidates(rise) });
  const kinds = insights.map((i) => i.kind);
  yes('a verified movement is reported', kinds.includes('price-rise'), show(kinds));
  yes('a same-month gap between markets is reported', kinds.includes('market-spread'), show(kinds));
  yes(
    'every finding names the series, markets and rows behind it',
    insights.every((i) => i.evidence.commodity && i.evidence.markets.length > 0 && i.evidence.observations > 0 && i.evidence.sourceName),
  );
  yes('every finding carries its own limitation', insights.every((i) => String(i.limitationKey).startsWith('markets.insightLimit.')));
  yes('no insight is a forecast', !kinds.some((k) => /forecast|projection/.test(k)));

  same('an empty dataset supports no statement', buildInsights({ rows: [], seasonal: [] }).length, 0);
  same('one survey period supports no movement', buildInsights({ rows: [row({ observedOn: '2026-09-05', price: 100 })], seasonal: [] }).filter((i) => i.kind === 'price-rise' || i.kind === 'price-fall').length, 0);
  same(
    'an aggregated figure is never read as an observed movement',
    buildInsights({ rows: [row({ observedOn: '2026-08-05', price: 100, priceFlag: 'aggregate' }), row({ observedOn: '2026-09-05', price: 150, priceFlag: 'aggregate' })], seasonal: [] })
      .filter((i) => i.kind === 'price-rise')
      .length,
    0,
  );
  same(
    'one market alone supports no regional statement',
    buildInsights({ rows: [row({ market: 'Mekele', observedOn: '2026-08-05', price: 100 }), row({ market: 'Mekele', observedOn: '2026-09-05', price: 400 })], seasonal: [] })
      .filter((i) => i.kind === 'market-spread')
      .length,
    0,
  );
  yes('a season needs the depth before it may be named', seasonalCandidates([row({ observedOn: '2026-09-05', price: 100 })]).every((s) => s.months >= SEASON_MIN_MONTHS));
}

/* ------------------------------------------------------------------ *
 * G · CSV export keeps attribution and cannot execute
 * ------------------------------------------------------------------ */

section('CSV export safety');
{
  same('a leading = is neutralised', sanitizeCsvCell('=HYPERLINK("http://x","y")').slice(0, 3), `"'=`);
  same('a leading + is neutralised', sanitizeCsvCell('+1-234'), "'+1-234");
  same('a leading - is neutralised', sanitizeCsvCell('-2+3'), "'-2+3");
  same('a leading @ is neutralised', sanitizeCsvCell('@SUM(A1)'), "'@SUM(A1)");
  same('a leading tab is neutralised', sanitizeCsvCell('\t=cmd'), "'\t=cmd");
  same('a leading CR is neutralised and the cell stays quoted', sanitizeCsvCell('\r=cmd'), `"'\r=cmd"`);
  same('an ordinary market name is untouched', sanitizeCsvCell('Mekele'), 'Mekele');
  same('a negative number stays a number', sanitizeCsvCell(-2), '-2');
  same('a published price is not quoted away', sanitizeCsvCell(1840.5), '1840.5');
  same('null is an empty cell, not the word null', sanitizeCsvCell(null), '');
  same('undefined is an empty cell', sanitizeCsvCell(undefined), '');
  same('a comma is quoted', sanitizeCsvCell('Addis Ababa, Kilinto'), '"Addis Ababa, Kilinto"');
  same('an inner quote is doubled', sanitizeCsvCell('Teff "white"'), '"Teff ""white"""');
  same('a newline is quoted', sanitizeCsvCell('a\nb'), '"a\nb"');
  same('Amharic text survives as text', sanitizeCsvCell('ጤፍ'), 'ጤፍ');

  const columns = [
    { header: 'market', value: (r) => r.market },
    { header: 'price', value: (r) => r.price },
    { header: 'currency', value: (r) => r.currency },
    { header: 'unit', value: (r) => r.unit },
    { header: 'observed_on', value: (r) => r.observedOn },
    { header: 'retrieved_at', value: (r) => r.retrievedAt },
    { header: 'source', value: (r) => r.sourceName },
    { header: 'source_url', value: (r) => r.sourceUrl },
  ];
  const csv = toCsv(columns, [row({ market: '=HYPERLINK("x")', price: 1840 })]);
  yes('a real export carries a UTF-8 BOM for Excel', csv.charCodeAt(0) === 0xfeff);
  yes('the injected name never executes in the exported file', !/\n=HYPERLINK/.test(csv) && csv.includes(`"'=HYPERLINK(""x"")"`));
  same('rows are separated with CRLF and end with one', csv.split('\r\n').length, 3);
  same('the header row carries every attribution column', csv.replace('\uFEFF', '').split('\r\n')[0], 'market,price,currency,unit,observed_on,retrieved_at,source,source_url');
  same('an empty export is a header and nothing else', toCsv(columns, []), 'market,price,currency,unit,observed_on,retrieved_at,source,source_url\r\n');

  const name = csvFileName('irshaye-prices', { commodity: 'Teff (white)', month: '2026-09', source: null });
  yes('the file name is safe and says what is inside', /^irshaye-prices_commodity-Teff-white_month-2026-09_\d{4}-\d{2}-\d{2}\.csv$/.test(name), name);
}

/* ------------------------------------------------------------------ *
 * H · Dictionary keys the module reaches by interpolation
 * ------------------------------------------------------------------ */

section('Locale coverage for dynamic keys');
{
  const parseKeys = (code) => {
    const source = readFileSync(join(HERE, '..', 'lib', 'i18n', 'locales', `${code}.ts`), 'utf8');
    const keys = new Set();
    for (const m of source.matchAll(/^\s{2}'((?:[^'\\]|\\.)+)':/gm)) keys.add(m[1]);
    return keys;
  };
  const locales = ['en', 'ru', 'am', 'om', 'sw'];
  const dictionaries = new Map(locales.map((code) => [code, parseKeys(code)]));

  const dynamic = [
    ...['actual', 'aggregate', 'replaced', 'unknown'].map((v) => `markets.flag.${v}`),
    ...['market-survey', 'reference-price', 'projection', 'administrative'].map((v) => `dataType.${v}`),
    ...['current', 'recent', 'stale', 'historical', 'unknown'].map((v) => `freshness.${v}`),
    ...['connected', 'stale', 'historical', 'unavailable', 'auth_required', 'not_configured'].map((v) => `statusLabel.${v}`),
    ...['realtime', 'hourly', 'daily', '8daily', 'weekly', 'monthly', 'quarterly', 'annual', 'irregular'].map((v) => `cadence.${v}`),
    'markets.granularity.weekly',
    'markets.granularity.monthly',
    'markets.state.access_challenged',
    ...['overview', 'prices', 'history', 'regions', 'insights', 'exchange', 'sources'].map((v) => `markets.tab.${v}`),
    ...['price-rise', 'price-fall', 'market-spread', 'seasonal-coverage', 'market-outdated', 'thin-coverage'].flatMap((k) => [`markets.ins.${k}`, `markets.ins.kind.${k}`]),
    ...['change', 'spread', 'seasonal', 'coverage'].map((v) => `markets.insightLimit.${v}`),
  ];

  const absent = [];
  for (const code of locales) {
    for (const key of dynamic) if (!dictionaries.get(code).has(key)) absent.push(`${code}: ${key}`);
  }
  same(`every interpolated key exists in all five locales (${dynamic.length} keys)`, absent.length ? absent.join('\n') : 'none', 'none');

  // Keys the market components pass as string literals, read straight out of the source.
  const marketDir = join(HERE, '..', 'components', 'data', 'market');
  const files = [join(HERE, '..', 'components', 'data', 'MarketIntelligence.tsx'), ...readdirSync(marketDir).map((f) => join(marketDir, f))];
  const literals = new Set();
  for (const file of files) {
    for (const m of readFileSync(file, 'utf8').matchAll(/\bt\(\s*'((?:[^'\\]|\\.)+)'/g)) literals.add(m[1].replace(/\\'/g, "'"));
  }
  const missingInEn = [...literals].filter((key) => !dictionaries.get('en').has(key));
  same(`${literals.size} literal keys used by the market UI all exist in English`, missingInEn.length ? missingInEn.join('\n') : 'none', 'none');
  const untranslated = [];
  for (const code of locales.filter((c) => c !== 'en')) {
    for (const key of literals) if (!dictionaries.get(code).has(key)) untranslated.push(`${code}: ${key}`);
  }
  same('and in the four other locales', untranslated.length ? untranslated.join('\n') : 'none', 'none');
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const failures = results.filter((r) => !r.pass);
let lastGroup = '';
for (const result of results) {
  if (result.group !== lastGroup) {
    console.log(`\n${result.group}`);
    lastGroup = result.group;
  }
  console.log(`${result.pass ? '  ✓' : '  ✗'} ${result.label}${result.pass ? '' : ` — ${result.detail}`}`);
}
console.log(`\n${results.length - failures.length}/${results.length} assertions passed.`);
if (failures.length > 0) {
  console.error(`✗ ${failures.length} failed`);
  process.exit(1);
}
