#!/usr/bin/env node
/**
 * Unit tests for the Field Intelligence dashboard's data layer: the derivations that turn rows into
 * figures, and the bounds that keep a page from becoming a full-table scan.
 *
 * These grade the ARITHMETIC, not the database. No Supabase project is needed, and that is the
 * point: "the newest reading per node comes from the newest row, and an empty map means 'outside the
 * scan window' rather than 'never reported'" is a claim that must be checkable in a process with no
 * rows in it. The HTTP layer is `npm run check:fieldintel`; the authorization decisions behind it are
 * `npm run test:management`, which already covers the six dashboard read actions as a vocabulary.
 *
 * What these CANNOT prove: that the counts PostgREST returns are the counts the tables hold, that a
 * scope filter lands where the SQL thinks it lands, that an operator's alert rules are correctly
 * attached to their cooperative, or that the panels paint correctly at 375px in Amharic. The first
 * three need a configured project (docs/field-intelligence-setup.md); the last needs a browser.
 *
 * Sections 9 to 13 widen the same no-database idea to the dashboard's own source files, because a
 * panel's promises are the things a later edit can delete silently while the screen still looks
 * right: a charted gap stays a gap, every code the API can answer with has its own sentence, every
 * string a panel can render exists in five languages, and a device credential is displayed in one
 * place and written down nowhere. Those read the shipped text, so they grade a rule being removed
 * from a component — never a component rendering wrongly, which is the browser's job.
 *
 * Sections 14 to 25 do the same for the analytics and alerting engine, and they need a database for
 * nothing but arithmetic and for the shipped text of the modules that do the writing. Three kinds of
 * claim live there. The first is graded against the real functions: `historyMath.ts` windows,
 * aggregation, reporting health and buckets, and `alertEvaluation.ts` verdicts, scope and retry
 * determinism — the two modules are pure, so importing them costs no connection. The second is graded
 * against the whole `lib/field` and `app/api` trees rather than one file, because "only one module
 * writes device_alerts", "no route body carries a credential hash" and "the routes name exactly the
 * actions the table classifies" are claims about every file at once. The third is graded against the
 * migration SQL, the published ingestion contract and `docs/api-specification.md`, since the partial
 * unique index that makes an alert unique per (node, type), the promise that alerting cannot change a
 * device's response, and the endpoint list an integrator reads before trusting this API are all things
 * a later edit can break without touching a line of the code that depends on them.
 *
 * `authorize.ts` and `managementService.ts` are imported for their constants rather than for their
 * behaviour: a test that re-typed the status map or the column list would pass while the shipped
 * table drifted, which is the exact failure these sections exist to prevent.
 *
 * Run with `npm run test:fieldintel`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { METRIC_COLUMN } from '../components/field/labels.ts';
import { ADDIS_UTC_OFFSET_MS, dayBounds } from '../components/field/localTime.ts';
import {
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  OBSERVATION_SCAN_CAP,
  SCOPE_NODE_CAP,
  UNRESOLVED_ALERT_STATUSES,
  ageSecondsOf,
  emptyStatusCounts,
  newestObservationPerNode,
  numberFrom,
  offlineWindowMinutes,
  parseReadingWindow,
  ruleScopeOrigin,
  totalFromStatusCounts,
} from '../lib/field/observationService.ts';
import {
  MANAGEMENT_STATUS_BY_CODE,
  capabilityOf,
  decideAccess,
  narrowScope,
  refusalFor,
  scopedCooperativeIds,
} from '../lib/field/access.ts';
import { changePercent, evaluateRules, rulesForNode } from '../lib/field/alertEvaluation.ts';
import { INGEST_STATUS_BY_CODE } from '../lib/field/authorize.ts';
import { CREDENTIAL_METADATA_COLUMNS } from '../lib/field/managementService.ts';
import {
  ADDIS_UTC_OFFSET_MS as LIBRARY_ADDIS_OFFSET_MS,
  HISTORY_RANGES,
  MAX_HISTORY_SPAN_MS,
  bucketSizeFor,
  buildBuckets,
  intervalsBetween,
  resolveHistoryWindow,
  summarizeHistory,
} from '../lib/field/historyMath.ts';
import { ALERT_TYPES, METRIC_UNITS, RULE_METRICS, STORE_RANGES, alertTypeFor, unitsMatchMetric } from '../lib/field/metrics.ts';
import { OPERATOR_SETTABLE_STATUSES } from '../lib/field/registration.ts';
import { am } from '../lib/i18n/locales/am.ts';
import { en } from '../lib/i18n/locales/en.ts';
import { om } from '../lib/i18n/locales/om.ts';
import { ru } from '../lib/i18n/locales/ru.ts';
import { sw } from '../lib/i18n/locales/sw.ts';

const results = [];
let group = 'general';
const section = (name) => {
  group = name;
};
const yes = (label, condition, detail = '') => results.push({ group, label, pass: condition === true, detail: condition === true ? '' : detail });
const show = (value) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text === undefined ? String(value) : text.slice(0, 220);
};
const same = (label, actual, expected) => yes(label, show(actual) === show(expected), `got ${show(actual)} · want ${show(expected)}`);

const NOW = Date.parse('2026-11-06T09:00:00.000Z');

/** A reading row, with the fields the derivations actually look at. */
const reading = (node, measured, extra = {}) => ({
  log_id: Math.round(Date.parse(measured) / 1000),
  node_id: node,
  measured_at: measured,
  received_at: measured,
  time_source: 'device',
  soil_moisture_pct: null,
  ambient_temp_c: null,
  humidity_pct: null,
  battery_voltage_v: null,
  ...extra,
});

/* ------------------------------------------------------------------ *
 * 1. Status buckets — the overview's device figures
 * ------------------------------------------------------------------ */

section('Device counts — four buckets that are the whole vocabulary');
same('every status in the register has a bucket', Object.keys(emptyStatusCounts()).join(','), 'active,inactive,maintenance,disabled');
same('a fleet of none is zero, not null or undefined', totalFromStatusCounts(emptyStatusCounts()), 0);
same(
  'the buckets sum to the total, so a headline cannot disagree with its own breakdown',
  totalFromStatusCounts({ active: 7, inactive: 2, maintenance: 1, disabled: 3 }),
  13,
);
yes('a count of zero is a real answer and stays zero', totalFromStatusCounts({ ...emptyStatusCounts(), active: 0 }) === 0);

/* ------------------------------------------------------------------ *
 * 2. Newest observation per node — the monitoring section's last reading
 * ------------------------------------------------------------------ */

section('Newest observation per node — one scan, exact within it');
{
  const rows = [reading('B', '2026-11-06T08:00:00Z'), reading('A', '2026-11-06T07:00:00Z'), reading('B', '2026-11-05T08:00:00Z'), reading('A', '2026-11-01T08:00:00Z')];
  const { byNode, truncated } = newestObservationPerNode(rows);
  same('the first row a node meets in a newest-first scan is its newest', byNode.get('A').measured_at, '2026-11-06T07:00:00Z');
  same('…and the same for the node whose rows are not adjacent', byNode.get('B').measured_at, '2026-11-06T08:00:00Z');
  same('an unfinished scan is reported as complete', truncated, false);
  same('one entry per node, not one per row', byNode.size, 2);
}
{
  const { truncated } = newestObservationPerNode(Array.from({ length: OBSERVATION_SCAN_CAP }, (_, i) => reading(`N_${i}`, '2026-11-06T06:00:00Z')));
  yes('a scan that reached the cap says so, so "no observation" is never claimed on its evidence', truncated === true);
}
yes('the scan cap is smaller than a table and larger than a fleet', OBSERVATION_SCAN_CAP > SCOPE_NODE_CAP && OBSERVATION_SCAN_CAP <= 5_000);

/* ------------------------------------------------------------------ *
 * 3. Age — freshness measured against the observation, not the page load
 * ------------------------------------------------------------------ */

section('Age of data — from its own timestamp');
same('an observation two hours old is 7200 seconds old', ageSecondsOf('2026-11-06T07:00:00Z', NOW), 7_200);
same('nothing to age is null, not zero', ageSecondsOf(null, NOW), null);
same('an unparseable timestamp is null rather than a confident NaN', ageSecondsOf('yesterday', NOW), null);
same('an empty string is null', ageSecondsOf('', NOW), null);
same('a reading from the future ages to zero, not to a negative number', ageSecondsOf('2026-11-06T10:00:00Z', NOW), 0);
same('a bare date is aged from midnight UTC of that day', ageSecondsOf('2026-11-05', NOW), 86_400 + 32_400);

/* ------------------------------------------------------------------ *
 * 4. The offline window — only what an operator configured
 * ------------------------------------------------------------------ */

section('Offline window — no invented threshold');
const rule = (over) => ({ rule_id: 1, name: 'r', cooperative_id: 1, field_site_id: null, metric: 'offline', comparator: 'gt', threshold_value: 60, threshold_units: 'minutes', severity: 'warning', status: 'enabled', scope_origin: 'cooperative', ...over });
same('no rules at all means no threshold', offlineWindowMinutes([]), null);
same('rules about other metrics do not count as an offline window', offlineWindowMinutes([rule({ metric: 'soil_moisture', threshold_value: 35, threshold_units: '%' })]), null);
same('a DISABLED offline rule defines nothing — it is retired, not in force', offlineWindowMinutes([rule({ status: 'disabled' })]), null);
same('two enabled windows take the tighter one, because that is the one that fires', offlineWindowMinutes([rule({ threshold_value: 240 }), rule({ threshold_value: 90 })]), 90);
same('a rule with no threshold value is not a number', offlineWindowMinutes([rule({ threshold_value: null })]), null);
same('offline rules are measured in minutes, and the schema insists', rule({}).threshold_units, 'minutes');

/* ------------------------------------------------------------------ *
 * 5. Numbers from PostgREST — the bigint/numeric boundary
 * ------------------------------------------------------------------ */

section('Number normalisation — null is never 0');
same('a JSON number passes through', numberFrom(38.2), 38.2);
same('a bigint handed back as text becomes a number', numberFrom('12043'), 12043);
same('zero is a value and stays zero', numberFrom(0), 0);
same('null stays null', numberFrom(null), null);
same('absent stays null', numberFrom(undefined), null);
same('text that is not a number becomes null, not NaN', numberFrom('abc'), null);
same('NaN is refused, because NaN !== NaN would break every later comparison', numberFrom(Number.NaN), null);
same('Infinity is refused, because no sensor column holds it', numberFrom(Number.POSITIVE_INFINITY), null);

/* ------------------------------------------------------------------ *
 * 6. Rule scope — which relationship put a rule in this caller's view
 * ------------------------------------------------------------------ */

section('Alert rule scope — three kinds, from the schema columns');
same('a rule naming a cooperative is a cooperative rule', ruleScopeOrigin({ cooperative_id: 4, field_site_id: null }), 'cooperative');
same('a rule naming a site is a site rule, and is labelled as one', ruleScopeOrigin({ cooperative_id: null, field_site_id: 9 }), 'field_site');
same('a rule naming neither is platform-wide', ruleScopeOrigin({ cooperative_id: null, field_site_id: null }), 'platform');
yes('a site rule is never mislabelled as a cooperative rule', ruleScopeOrigin({ cooperative_id: 4, field_site_id: 9 }) === 'field_site');

/* ------------------------------------------------------------------ *
 * 7. The date range a chart asks for
 * ------------------------------------------------------------------ */

section('Reading window — refuse a filter you cannot honour');
{
  const ok = parseReadingWindow('2026-11-01', '2026-11-05T12:00:00Z');
  yes('a well-formed range is accepted', ok.ok === true);
  same('…normalised to UTC instants', ok.value.from, '2026-11-01T00:00:00.000Z');
  same('…both ends', ok.value.to, '2026-11-05T12:00:00.000Z');
}
{
  const open_ = parseReadingWindow(null, '');
  yes('no range at all is a legal request', open_.ok === true && open_.value.from === null && open_.value.to === null);
}
for (const bad of ['not-a-date', '2026-13-45', '11/02/2026']) {
  const refusedResult = parseReadingWindow(bad, null);
  yes(`"${bad}" is refused rather than silently ignored`, refusedResult.ok === false && refusedResult.error.code === 'invalid_payload', refusedResult.ok === true ? 'accepted' : refusedResult.error.message);
}
{
  const reversed = parseReadingWindow('2026-11-05', '2026-11-01');
  yes('a reversed range is refused, not emptied', reversed.ok === false && reversed.error.code === 'invalid_payload');
}
{
  const toOnly = parseReadingWindow(null, '2026-11-05T00:00:00Z');
  yes('one bound alone is a window, not an error', toOnly.ok === true && toOnly.value.from === null);
}

/* ------------------------------------------------------------------ *
 * 8. The vocabularies the routes validate against
 * ------------------------------------------------------------------ */

section('Closed vocabularies — the filters a route will accept');
same('alert statuses are the four the column CHECK allows', ALERT_STATUSES.join(','), 'open,acknowledged,resolved,dismissed');
same('unresolved is the first two, not "everything but resolved"', UNRESOLVED_ALERT_STATUSES.join(','), 'open,acknowledged');
same('severities are the three the column CHECK allows', ALERT_SEVERITIES.join(','), 'info,warning,critical');
yes('dismissed is NOT unresolved — a human closed it', !UNRESOLVED_ALERT_STATUSES.includes('dismissed'));
yes('resolved is NOT unresolved either', !UNRESOLVED_ALERT_STATUSES.includes('resolved'));

/* ------------------------------------------------------------------ *
 * Helpers the three Phase 5 sections share.
 *
 * Sections 9 to 11 read the dashboard's own source files and assert on them. That is deliberate: a
 * panel's promises — a gap stays a gap, a refusal has its own sentence, the token never reaches a
 * URL, a secret renders behind one explicit action — are exactly what a later edit can break
 * silently while the screen still looks right. Comment text is stripped before any of it, because a
 * docstring that explains a rule is not the rule.
 * ------------------------------------------------------------------ */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const dictionaries = { en, ru, am, om, sw };
const LOCALE_CODES = Object.keys(dictionaries);

const basenameOf = basename;

/** Block comments, comment lines, and the continuation lines of a block comment. */
function withoutComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return !(trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*'));
    })
    .join('\n');
}

function readSource(...parts) {
  return withoutComments(readFileSync(join(ROOT, ...parts), 'utf8'));
}

/** Every `.ts`/`.tsx` file the dashboard is made of, keyed by base name, comments removed. */
function dashboardSources() {
  const dirs = [join(ROOT, 'components', 'field'), join(ROOT, 'app', 'dashboard', 'field-intelligence')];
  const files = dirs
    .flatMap((dir) => readdirSync(dir).filter((name) => /\.(ts|tsx)$/.test(name)).map((name) => join(dir, name)));
  const stripped = Object.fromEntries(files.map((file) => [basenameOf(file), withoutComments(readFileSync(file, 'utf8'))]));
  return stripped;
}

/**
 * Every locale key the dashboard can hand `t()`: the literals in its own files. The vocabulary tables
 * in `components/field/labels.ts` and the section/tab maps in the view are part of that scan, so a
 * key added to a table is graded without this list being edited — which is the point.
 */
function dashboardTranslationKeys() {
  const keys = new Set();
  for (const text of Object.values(dashboardSources())) {
    for (const match of text.matchAll(/'((?:field|module\.field-intelligence)\.[^']+)'/g)) keys.add(match[1]);
  }
  return keys;
}

/** The contents of the first `[…]` array literal a pattern captures, as strings. */
function literalArray(text, pattern) {
  const match = text.match(pattern);
  if (match === undefined || match === null) return [];
  return match[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^'|'$/g, ''))
    .filter((entry) => entry !== '');
}

/** The `code: 'locale.key',` entries of a top-level map, as pairs. */
function mapEntries(text, pattern) {
  const match = text.match(pattern);
  if (match === null || match === undefined) return [];
  return [...match[1].matchAll(/^ {2}([a-z_]+): '([^']+)',$/gm)].map((entry) => [entry[1], entry[2]]);
}

const placeholderTokens = (value) => (value.match(/\{[A-Za-z0-9_]+\}/g) ?? []).sort().join(',');

/** Every request path the dashboard asks for, with `${…}` segments folded to `:id`. */
function requestedPaths(sources, extra) {
  const paths = new Set();
  // A path is written with backticks where a segment is interpolated and with plain quotes where it
  // is static, so both are collected. Neither scan may run past a quote of the other kind, or the
  // comma between two arguments starts looking like part of an endpoint.
  const scan = /`([^`'\n]*\/api\/[^`'\n]*)`|'([^`'\n]*\/api\/[^`'\n]*)'/g;
  for (const text of [...Object.values(sources), ...(extra ?? [])]) {
    for (const match of text.matchAll(scan)) {
      const raw = match[1] ?? match[2];
      const path = raw.replace(/\$\{[^}]*\}/g, ':id').split('?')[0];
      if (!path.includes('*')) paths.add(path);
    }
  }
  return [...paths].sort();
}

/** The entries of a quoted array literal's inner text. */
function splitList(inner) {
  return inner
    .split(',')
    .map((entry) => entry.trim().replace(/^'|'$/g, ''))
    .filter((entry) => entry !== '');
}

/** The file's text with nothing removed: for promises that live in prose, which `readSource` strips. */
function readRaw(...parts) {
  return readFileSync(join(ROOT, ...parts), 'utf8');
}

/**
 * Every `.ts` file under a directory tree, comments removed, keyed by its repo-relative path with
 * forward slashes. The Phase 6A sections need a whole tree rather than one folder: "only this module
 * writes alerts" and "no route body carries a credential hash" are claims about every file, and a
 * scan of the convenient directory is how such a claim goes stale.
 */
function sourceTree(...parts) {
  const root = join(ROOT, ...parts);
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
  return Object.fromEntries(
    walk(root).map((file) => [file.slice(root.length + 1).replace(/\\/g, '/'), withoutComments(readFileSync(file, 'utf8'))]),
  );
}

/* ------------------------------------------------------------------ *
 * 9. The calendar the dashboard queries with
 * ------------------------------------------------------------------ */

section('Calendar bounds — a picked day is the operator’s day, not a UTC midnight');
{
  same('the offset is Addis Ababa’s, and Ethiopia has never observed DST', ADDIS_UTC_OFFSET_MS, 3 * 60 * 60 * 1000);
  same('so a picked day opens at 21:00 UTC the evening before', dayBounds('2026-11-03', 'start'), '2026-11-02T21:00:00.000Z');
  same('…and closes at 20:59:59.999 UTC the same evening', dayBounds('2026-11-03', 'end'), '2026-11-03T20:59:59.999Z');

  const day = [dayBounds('2026-11-03', 'start'), dayBounds('2026-11-03', 'end')];
  yes('one day spans 24 hours minus one millisecond, no more', Date.parse(day[1]) - Date.parse(day[0]) === 86_400_000 - 1, day.join(' … '));
  yes('…which two consecutive days tile without overlapping',
    Date.parse(dayBounds('2026-11-04', 'start')) === Date.parse(day[1]) + 1, `${day[1]} → ${dayBounds('2026-11-04', 'start')}`);

  yes('the operator’s first hour is inside the window', Date.parse('2026-11-03T00:30:00+03:00') >= Date.parse(day[0]), day[0]);
  yes('…and its last instant is inside too', Date.parse('2026-11-03T23:59:59+03:00') <= Date.parse(day[1]), day[1]);
  yes('…but the next day’s first reading is not', Date.parse('2026-11-04T00:00:00+03:00') > Date.parse(day[1]), day[1]);

  const opened = parseReadingWindow(day[0], day[1]);
  yes('the route’s own parser accepts both bounds', opened.ok === true, opened.ok === false ? opened.error.message : 'accepted');

  // The trap `dayBounds` exists for. The API reads a bare date as the instant its spec gives it —
  // midnight UTC — so a UI that sent the picked string would quietly lose the first three hours of
  // every day it was asked about, and the chart would look like a short night rather than a short query.
  const bare = parseReadingWindow('2026-11-03', '2026-11-03');
  yes('…which is why a bare date is never sent: the API reads it as midnight UTC',
    bare.ok === true && bare.value.from === '2026-11-03T00:00:00.000Z', show(bare));
  yes('a reading at 03:01 local is outside that bare day but inside the operator’s',
    Date.parse('2026-11-03T03:01:00+03:00') > Date.parse('2026-11-03T00:00:00.000Z')
      && Date.parse('2026-11-03T03:01:00+03:00') <= Date.parse(day[1]));
}

/* ------------------------------------------------------------------ *
 * 10. Locale coverage of the dashboard's own strings
 * ------------------------------------------------------------------ */

section('Locale coverage — the dashboard speaks all five languages it claims to');
{
  const keys = [...dashboardTranslationKeys()].sort();
  yes(`the scan found the dashboard's vocabulary (${String(keys.length)} keys)`, keys.length >= 300, String(keys.length));

  const absent = [];
  const drifted = [];
  for (const key of keys) {
    const english = dictionaries.en[key];
    if (typeof english !== 'string') {
      absent.push(`en: ${key}`);
      continue;
    }
    for (const code of LOCALE_CODES.filter((c) => c !== 'en')) {
      const value = dictionaries[code][key];
      if (typeof value !== 'string') absent.push(`${code}: ${key}`);
      else if (placeholderTokens(value) !== placeholderTokens(english)) drifted.push(`${code}: ${key}`);
    }
  }
  yes('every key exists in all five locales', absent.length === 0, `${String(absent.length)} absent: ${absent.slice(0, 12).join(', ')}`);
  yes('…and carries the same interpolation tokens as English', drifted.length === 0, `drift: ${drifted.slice(0, 12).join(', ')}`);

  // Present but identical to English means the string was copied rather than translated, which the
  // brief forbids. The dashboard is allowed exactly three copies, and they are unit symbols: `%` is
  // typography, and `°C` and `V` are SI marks the Latin-script locales write the way English does.
  // Amharic and Russian spell the volt in their own script, so those are real translations, not gaps.
  const UNTRANSLATABLE = new Set(['field.unit.percent', 'field.unit.celsius', 'field.unit.volts']);
  const verbatim = [];
  for (const code of LOCALE_CODES.filter((c) => c !== 'en')) {
    for (const key of keys) {
      if (UNTRANSLATABLE.has(key)) continue;
      if (dictionaries[code][key] === dictionaries.en[key]) verbatim.push(`${code}: ${key}`);
    }
  }
  yes('…and are translated rather than copied from English, unit symbols excepted',
    verbatim.length === 0, `${String(verbatim.length)} verbatim: ${verbatim.slice(0, 12).join(', ')}`);


  // A placeholder English declares but a call site never supplies renders on screen as a literal
  // `{siteId}` — the bug the static audit of `field.sites.detailHint` caught before a browser could.
  // The other half is a variable named on the wrong side of the call, which is the same silent gap
  // wearing a different hat, so the supplied set is checked against English in both directions.
  const calls = new Map();
  for (const text of Object.values(dashboardSources())) {
    for (const match of text.matchAll(/\bt\(\s*'((?:field|module\.field-intelligence)\.[^']+)'(?:, (\{[^}]*\}))?/g)) {
      const vars = match[2] === undefined ? null : new Set([...match[2].matchAll(/([A-Za-z0-9_]+):/g)].map((pair) => pair[1]));
      if (!calls.has(match[1])) calls.set(match[1], []);
      calls.get(match[1]).push(vars);
    }
  }
  yes(`the scan sees real call sites, not a short list (${String(calls.size)} keys)`, calls.size >= 200, String(calls.size));

  const unsupplied = [];
  const unknown = [];
  for (const [key, sites] of calls) {
    const declared = new Set([...String(dictionaries.en[key]).matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((token) => token[1]));
    const supplied = new Set(sites.filter((site) => site !== null).flatMap((site) => [...site]));
    for (const token of declared) if (!supplied.has(token)) unsupplied.push(`${key} → {${token}}`);
    for (const token of supplied) if (!declared.has(token)) unknown.push(`${key} → ${token}`);
  }
  yes('every placeholder English declares is supplied by a call site', unsupplied.length === 0, `${String(unsupplied.length)} unsupplied: ${unsupplied.slice(0, 12).join(', ')}`);
  yes('…and no call site passes a variable English does not declare', unknown.length === 0, `${String(unknown.length)} unknown: ${unknown.slice(0, 12).join(', ')}`);
}

/* ------------------------------------------------------------------ *
 * 11. Data honesty, read from the panels themselves
 * ------------------------------------------------------------------ */

section('Data honesty — no panel invents a number, a reading or a position');
{
  const src = dashboardSources();
  const all = Object.values(src).join('\n');
  const analytics = src['FieldAnalyticsSection.tsx'] ?? '';
  const alerts = src['FieldAlertsSection.tsx'] ?? '';
  const mapPanel = src['FieldMapSection.tsx'] ?? '';
  const overview = src['FieldOverviewSection.tsx'] ?? '';
  const sites = src['FieldSitesSection.tsx'] ?? '';

  yes('nothing keeps a sample device, reading or count in source', !/const (SAMPLE|MOCK|DEMO|FAKE|PLACEHOLDER)[A-Z0-9_]* =|\.mock\(/.test(all), 'mock data in a dashboard file');
  yes('no figure is aged from the render clock', !/Date\.now\(\)/.test(analytics + overview + sites + all), 'Date.now() in a section');
  yes('nothing polls on a timer', !/setInterval/.test(all), 'a polling interval exists');

  // Chart integrity in three parts: the columns are numeric and nullable, a null stays a gap, and the
  // axis is the stored instant. A line that bridges a missing reading draws a trend the database never
  // recorded, and a day filter that is not the operator's own day queries the wrong hours.
  const metricTargets = Object.values(METRIC_COLUMN).sort();
  same('the four charted metrics read exactly the four nullable columns', metricTargets.join(','), 'ambient_temp_c,battery_voltage_v,humidity_pct,soil_moisture_pct');
  yes('…so no series can be pointed at a text column or a timestamp', !/node_id|time_source|measured_at|received_at|log_id/.test(metricTargets.join(',')), metricTargets.join(','));
  yes('a missing reading stays a gap in the line', /connectNulls=\{false\}/.test(analytics), 'connectNulls not false');
  yes('the x-axis is the measurement instant', /dataKey="at"/.test(analytics), 'the axis is not keyed to a stored timestamp');
  yes('the panel says which part of the range this page covers', /field\.analytics\.covers/.test(analytics) && /chart_covers/.test(analytics), 'no coverage sentence');
  yes('a day the operator picks is queried through the Addis calendar', /dayBounds\(/.test(analytics) && /from '\.\/localTime'/.test(analytics), 'the panel keeps its own calendar');

  // Agronomy is out of scope by mandate: no optimal band, no stress index, no advice.
  yes('alerts quote what the database raised instead of evaluating a threshold here', !/(threshold_value|threshold_units)\s*[<>]/.test(alerts), 'a comparison happens in the panel');
  yes('…and say plainly that nothing in this build raises them', /field\.alerts\.emptyWhy/.test(alerts) && /field\.alerts\.rulesNotInvented/.test(alerts), 'no read-only statement');
  yes('only configured rules are shown as rules', /alert_rules|data\.rules|rules\.length/.test(alerts), 'rules rendered without a configured source');
  yes('no advice, stress index or irrigation copy is rendered anywhere', !/stress|irrigat|recommend|advice/i.test(alerts + analytics), 'agronomic copy found');

  yes('the map draws the shared Ethiopia scene, reused rather than replaced', /EthiopiaRegionMap/.test(mapPanel) && /components\/data\/EthiopiaRegionMap/.test(mapPanel), 'existing map not reused');
  yes('…no latitude or longitude is written into a marker here', !/(latitude|longitude):\s*[0-9]/.test(mapPanel), 'an invented coordinate');
  yes('…devices without a stored position are counted, not silently dropped', /without_coordinates/.test(mapPanel) && /field\.map\.unpositionedBody/.test(mapPanel), 'unpositioned devices are silent');
  yes('…and where a position came from is shown with it', /coordinate_source|COORDINATE_SOURCE_KEYS/.test(mapPanel), 'position provenance missing');

  yes('the overview ages figures from the elapsed seconds the server computed', /age_seconds/.test(overview), 'no stored age used');
  yes('…a floor from partial coverage is labelled as a floor', /coverage === 'partial'/.test(overview) && /field\.overview\.atLeast/.test(overview), 'partial coverage rendered as exact');
  yes('…no device is called offline without a configured window', /configured_offline_window_minutes === null/.test(overview) && /field\.overview\.offlineNone/.test(overview), 'an invented offline rule');
  yes('a site that has never reported says so instead of showing zero', /field\.sites\.noObservation/.test(sites), 'a silent zero');
  yes('…and its ages are measured against the instant the rows were read', /fetchedAt/.test(sites), 'ages from the browser clock');

  const sections = Object.entries(src).filter(([, text]) => /^export function Field[A-Za-z]+Section/m.test(text));
  yes('the scan finds the six sections', sections.length === 6, String(sections.length));
  yes('…each routing an empty, refused or failed read through one shared state',
    sections.every(([, text]) => /reasonFor\(/.test(text)),
    sections.filter(([, text]) => !/reasonFor\(/.test(text)).map(([name]) => name).join(', '));

  const view = src['FieldIntelligenceView.tsx'] ?? '';
  const page = src['page.tsx'] ?? '';
  yes('metadata stays on the server page and the view is the client half',
    /export const metadata/.test(page) && !/'use client'/.test(page) && /'use client'/.test(view) && !/export const metadata/.test(view),
    'a metadata export inside a client file');
  const guards = [...view.matchAll(/section === '([a-z]+)'/g)].map((match) => match[1]);
  same('one section mounts at a time, so the page is one fetch rather than six',
    [...new Set(guards)].sort().join(','), 'alerts,analytics,devices,map,overview,sites');
  yes('…and all six are behind a guard', guards.length === 6, String(guards.length));
}

/* ------------------------------------------------------------------ *
 * 12. The request surface and the refusal vocabulary
 * ------------------------------------------------------------------ */

section('Request surface — what leaves the browser, and what never does');
{
  const src = dashboardSources();
  const all = Object.values(src).join('\n');
  const hook = readSource('hooks', 'useLiveData.ts');
  const paths = requestedPaths(src, [hook]);

  const DOCUMENTED = [
    '/api/field/alerts',
    '/api/field/alerts/:id',
    '/api/field/alerts/:id/acknowledge',
    '/api/field/alerts/:id/resolve',
    '/api/field/data-quality',
    '/api/field/devices/:id/history',
    '/api/field/devices/:id/readings',
    '/api/field/map',
    '/api/field/overview',
    '/api/field/sites',
    '/api/field/sites/:id',
    '/api/hardware/devices',
    '/api/hardware/devices/:id',
    '/api/hardware/devices/:id/credentials',
    '/api/hardware/devices/:id/credentials/revoke',
    '/api/hardware/devices/:id/credentials/rotate',
  ];
  yes('the dashboard asks only for documented endpoints', paths.every((path) => DOCUMENTED.includes(path)), paths.filter((path) => !DOCUMENTED.includes(path)).join(', '));
  yes('…including all six reads the panels are built on',
    ['/api/field/overview', '/api/field/sites', '/api/field/alerts', '/api/field/map', '/api/field/devices/:id/readings', '/api/hardware/devices/:id'].every((path) => paths.includes(path)),
    paths.join(', '));
  yes('…and no ingestion endpoint, which belongs to firmware rather than to a page', !paths.some((path) => path.includes('/v1/hardware')), paths.join(', '));

  yes('the session token is carried as one Authorization header', /authorization: `Bearer \$\{accessToken\}`/.test(hook), 'no bearer header in the hook');
  yes('…and never as part of a URL', paths.every((path) => !/token/i.test(path)), paths.join(', '));
  yes('a cooperative is never named by the browser', !/cooperative_id=/.test(all) && paths.every((path) => !/cooperative/i.test(path)), 'a client-supplied cooperative filter');

  const panel = src['FieldDeviceManagementSection.tsx'] ?? '';
  const bodyMatch = panel.match(/const body: Record<string, unknown> = \{([\s\S]*?)\};/);
  const registerKeys = bodyMatch === null
    ? []
    : [...new Set([
      ...[...bodyMatch[1].matchAll(/^ {6}([a-z_]+):/gm)].map((entry) => entry[1]),
      ...[...panel.matchAll(/\bbody\.([a-z_]+) =/g)].map((entry) => entry[1]),
    ])].sort();
  same('registration sends the device and the site it belongs to',
    registerKeys.join(','), 'coordinate_source,field_site_id,firmware_version,hardware_model,latitude,longitude,name,node_id');
  yes('…and no role, credential or cooperative the caller chose', !/role|token|secret|cooperative/.test(registerKeys.join(',')), registerKeys.join(','));
  yes('…the site is picked from a scoped read rather than typed as an id', /useLiveData<SitesResponse/.test(panel) && /field_site_id/.test(panel), 'site id not sourced from a scoped read');
}

section('Capabilities and refusals — the UI repeats the server’s vocabulary or says nothing');
{
  const src = dashboardSources();
  const panel = src['FieldDeviceManagementSection.tsx'] ?? '';
  const sharedState = src['FieldSectionState.tsx'] ?? '';
  const detailRoute = readSource('app', 'api', 'hardware', 'devices', '[nodeId]', 'route.ts');
  const actionVocabulary = readSource('lib', 'field', 'types.ts');

  const lists = [...detailRoute.matchAll(/return \[([^\]]*)\]/g)].map((match) => splitList(match[1]));
  const viewerCaps = lists[0] ?? [];
  const managerCaps = lists[1] ?? [];
  same('a viewer is handed exactly one capability', viewerCaps.join(','), 'device_view');
  yes('a manager is handed the read plus the five actions this screen offers', managerCaps.length === 6, managerCaps.join(','));
  yes('every capability name is an API action, not a label invented here',
    managerCaps.every((cap) => new RegExp(`'${cap}'`).test(actionVocabulary)),
    managerCaps.filter((cap) => !new RegExp(`'${cap}'`).test(actionVocabulary)).join(', '));

  const manageCaps = literalArray(panel, /const MANAGE_CAPABILITIES[^=]*= \[([^\]]*)\]/);
  same('the panel’s manage list is the server’s, minus the read every caller has',
    manageCaps.slice().sort().join(','),
    managerCaps.filter((cap) => cap !== 'device_view').sort().join(','));
  yes('controls are shown from that list, per device', /hasCapability\(capabilities, 'credential_provision'\)/.test(panel) && /hasCapability\(capabilities, 'device_status_change'\)/.test(panel), 'controls not capability-gated');
  yes('…a viewer is told why nothing here changes anything', /field\.devices\.capabilitiesViewer/.test(panel), 'no viewer explanation');
  yes('…and the panel says every action is re-checked on the server', /field\.devices\.serverDecides/.test(panel), 'no server-decides line');

  const refusalEntries = mapEntries(panel, /const REFUSAL_KEYS[^{]*\{([\s\S]*?)\n\};/);
  const refusalCodes = refusalEntries.map(([code]) => code);
  const serverCodes = new Set([...Object.keys(MANAGEMENT_STATUS_BY_CODE), 'network']);
  yes('every refusal the panel has a sentence for is a code the API can actually answer with',
    refusalCodes.every((code) => serverCodes.has(code)),
    refusalCodes.filter((code) => !serverCodes.has(code)).join(', '));
  const addedCodes = Object.keys(MANAGEMENT_STATUS_BY_CODE).filter((code) => !(code in INGEST_STATUS_BY_CODE)).sort();
  // `unknown_alert` is answered by the alert endpoints, whose panel is not this one, so the vocabulary is
  // graded across every field panel's own list — each of which must stay inside the server's codes.
  const panelSentences = new Map();
  for (const [name, text] of Object.entries(src)) {
    for (const [code, key] of mapEntries(text, /const REFUSAL_KEYS[^{]*\{([\s\S]*?)\n\};/)) panelSentences.set(code, { name, key });
  }
  const sentenceCodes = [...panelSentences.keys()];
  yes('every code the management surface adds over the device surface has its own sentence',
    addedCodes.every((code) => sentenceCodes.includes(code)),
    addedCodes.filter((code) => !sentenceCodes.includes(code)).join(', '));
  yes('…in a panel that only names codes the server can answer',
    sentenceCodes.every((code) => serverCodes.has(code)),
    sentenceCodes.filter((code) => !serverCodes.has(code)).join(', '));
  yes('…and as a locale key rather than a string in the component',
    [...panelSentences.values()].every(({ key }) => /^field\.result\./.test(key)),
    [...panelSentences.values()].filter(({ key }) => !/^field\.result\./.test(key)).map(({ name }) => name).join(', '));

  const reasonCodes = mapEntries(sharedState, /const CODE_REASONS[^{]*\{([\s\S]*?)\n\};/).map(([code]) => code);
  yes('the empty-state map keys on codes the server sends, not on nearby words for them',
    reasonCodes.length > 0 && reasonCodes.every((code) => serverCodes.has(code)),
    reasonCodes.filter((code) => !serverCodes.has(code)).join(', '));

  const settable = literalArray(panel, /const SETTABLE_STATUSES[^=]*= \[([^\]]*)\]/);
  same('the status choices offered are the ones the API validates',
    settable.slice().sort().join(','), [...OPERATOR_SETTABLE_STATUSES].sort().join(','));
  yes('…`inactive` is history rather than an intent an operator picks', !settable.includes('inactive'), settable.join(','));
}

/* ------------------------------------------------------------------ *
 * 13. Credential handling in the client half
 * ------------------------------------------------------------------ */

section('Credential handling — one display, one lifetime, nothing written down');
{
  const src = dashboardSources();
  const all = Object.values(src).join('\n');
  const panel = src['FieldDeviceManagementSection.tsx'] ?? '';
  const disclosure = src['FieldCredentialDisclosure.tsx'] ?? '';
  const readPanels = ['FieldOverviewSection.tsx', 'FieldSitesSection.tsx', 'FieldAlertsSection.tsx', 'FieldMapSection.tsx', 'FieldAnalyticsSection.tsx']
    .map((name) => src[name] ?? '')
    .join('\n');

  const secretFiles = Object.entries(src).filter(([, text]) => /deviceSecret|device_secret/.test(text)).map(([name]) => name).sort();
  same('the wire field is unpacked only by the transport and the panel that receives it',
    secretFiles.join(','), 'FieldDeviceManagementSection.tsx,api.ts');
  same('…and the disclosure is the one place a secret is rendered',
    Object.entries(src).filter(([, text]) => /revealed \? secret :/.test(text)).map(([name]) => name).join(','),
    'FieldCredentialDisclosure.tsx');
  yes('the value is masked until an explicit reveal', /useState\(false\)/.test(disclosure) && /revealed \? secret :/.test(disclosure), 'rendered without a reveal step');
  yes('…with the says-once warning beside it', /field\.credential\.onceTitle/.test(disclosure) && /field\.credential\.onceBody/.test(disclosure), 'no one-time warning');
  yes('the clipboard is touched in that one panel and nowhere else',
    (all.match(/navigator\.clipboard/g) ?? []).length === 1 && /navigator\.clipboard/.test(disclosure),
    `${String((all.match(/navigator\.clipboard/g) ?? []).length)} clipboard sites`);
  yes('a failed copy is told rather than swallowed', /field\.credential\.copyFailed/.test(disclosure), 'no copy failure state');
  yes('nothing is written to browser storage', !/localStorage|sessionStorage|indexedDB|document\.cookie/.test(all), 'browser storage touched');
  yes('a new credential remounts the disclosure instead of reusing the last secret',
    /key=\{`\$\{issued\.nodeId\}-\$\{String\(issued\.credentialId\)\}`\}/.test(panel), 'the panel keeps one instance across issues');
  yes('dismissal drops the secret from state', /setIssued\(null\)/.test(panel), 'dismiss keeps the secret');
  yes('the read panels never receive a secret, only a provisioning flag', !/deviceSecret/.test(readPanels), 'a secret reached a read panel');
}

/* ------------------------------------------------------------------ *
 * 14. History windows — what a caller is allowed to ask for
 * ------------------------------------------------------------------ */

section('History windows — bounded, parsed, and never wider than a screen');
{
  const DAY_MS = 86_400_000;
  const ask = (range, from = null, to = null) => resolveHistoryWindow({ range, from, to }, NOW);
  const valueOf = (parsed) => (parsed.ok === true ? parsed.value : {});
  const why = (parsed) => (parsed.ok === false ? parsed.message : `accepted: ${show(parsed.value)}`);
  const refusedWith = (label, parsed, fragment) => yes(label, parsed.ok === false && String(parsed.message).includes(fragment), why(parsed));

  same('the keywords a caller may send are the four the panels offer', HISTORY_RANGES.join(','), '24h,7d,30d,custom');
  yes('a request with no range at all is a day, not the whole table', ask(null).ok === true && valueOf(ask(null)).range === '24h', why(ask(null)));

  const day = ask('24h');
  same('…and the day ends at the instant it was asked for', valueOf(day).to, '2026-11-06T09:00:00.000Z');
  same('…opening exactly 24 hours earlier', valueOf(day).from, '2026-11-05T09:00:00.000Z');
  same('…which is 86 400 000 milliseconds of readings', valueOf(day).span_ms, DAY_MS);
  same('a week is seven of those days', valueOf(ask('7d')).span_ms, 7 * DAY_MS);
  same('a month is thirty', valueOf(ask('30d')).span_ms, 30 * DAY_MS);
  yes('a relative window is measured from the instant passed in, never from a clock read inside',
    valueOf(resolveHistoryWindow({ range: '24h', from: null, to: null }, NOW - DAY_MS)).to === '2026-11-05T09:00:00.000Z',
    'the window moved on its own');

  refusedWith('an unrecognised keyword is refused rather than defaulted to something', ask('12h'), '24h, 7d, 30d, custom');
  refusedWith('a custom window needs both bounds, not the one the caller remembered', ask('custom', '2026-11-01T00:00:00Z', null), 'requires both');
  refusedWith('…and an instant the server cannot parse is told back, not guessed', ask('custom', 'yesterday', '2026-11-06T00:00:00Z'), 'ISO-8601');
  refusedWith('a window that runs backwards is refused', ask('custom', '2026-11-06T00:00:00Z', '2026-11-01T00:00:00Z'), 'from must not be after to');
  refusedWith('a 400-day window is refused by name, with the limit in the sentence', ask('custom', new Date(NOW - 400 * DAY_MS).toISOString(), new Date(NOW).toISOString()), '366');
  refusedWith('…and a window that ends in the future is refused, because it promises readings that cannot exist',
    ask('custom', new Date(NOW - 3 * DAY_MS).toISOString(), new Date(NOW + 60 * 60_000).toISOString()), 'in the future');

  yes('a bound 10 minutes ahead of the request is clock skew, not a promise, and is accepted',
    ask('custom', new Date(NOW - 3 * DAY_MS).toISOString(), new Date(NOW + 10 * 60_000).toISOString()).ok === true,
    why(ask('custom', new Date(NOW - 3 * DAY_MS).toISOString(), new Date(NOW + 10 * 60_000).toISOString())));
  yes('the widest window accepted is the one the message quotes',
    ask('custom', new Date(NOW - MAX_HISTORY_SPAN_MS).toISOString(), new Date(NOW).toISOString()).ok === true,
    `${String(MAX_HISTORY_SPAN_MS)} ms`);
  same('…which is 366 days, so the answer is a screen of dailies rather than a download', MAX_HISTORY_SPAN_MS, 366 * DAY_MS);

  same('three days of hour buckets is 73 points, which a chart can hold', bucketSizeFor(3 * DAY_MS), 'hour');
  same('one millisecond more is day buckets', bucketSizeFor(3 * DAY_MS + 1), 'day');
  same('so even the widest window allowed is a daily series', bucketSizeFor(MAX_HISTORY_SPAN_MS), 'day');
  yes('the server and the browser calendar agree on Addis Ababa being UTC+3',
    LIBRARY_ADDIS_OFFSET_MS === ADDIS_UTC_OFFSET_MS && LIBRARY_ADDIS_OFFSET_MS === 3 * 60 * 60 * 1000,
    `${String(LIBRARY_ADDIS_OFFSET_MS)} vs ${String(ADDIS_UTC_OFFSET_MS)}`);
}

/* ------------------------------------------------------------------ *
 * Helpers the Phase 6A history sections share.
 *
 * The window comes from the resolver rather than being written out, so these tests grade the same
 * bounds a route hands to `summarizeHistory` — a fixture window nobody can ask for would prove less.
 * ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;

const historyWindow = (parsed) => {
  if (parsed.ok === false) throw new Error(`window refused: ${parsed.message}`);
  return parsed.value;
};
const window24h = (now = NOW) => historyWindow(resolveHistoryWindow({ range: '24h', from: null, to: null }, now));
const summarise = (rows, offlineMinutes = null, window = window24h(), now = NOW) => summarizeHistory(rows, window, now, offlineMinutes);
const metricOf = (summary, name) => summary.metrics.find((entry) => entry.metric === name) ?? {};

/* ------------------------------------------------------------------ *
 * 15. Historical aggregation — figures from rows, nulls from absences
 * ------------------------------------------------------------------ */

section('Historical aggregation — means, medians and the difference between zero and nothing');
{
  const three = [
    reading('N1', '2026-11-06T05:00:00Z', { soil_moisture_pct: 20, ambient_temp_c: 18 }),
    reading('N1', '2026-11-06T06:00:00Z', { soil_moisture_pct: 30, ambient_temp_c: 21 }),
    reading('N1', '2026-11-06T07:00:00Z', { soil_moisture_pct: 40 }),
  ];
  const s = summarise(three);
  same('every quantity is summarised, not only the ones that reported', s.metrics.map((entry) => entry.metric).join(','), 'soil_moisture,ambient_temp,humidity,battery_voltage');
  same('three readings are three observations for each of them', new Set(s.metrics.map((entry) => entry.observations_in_window)).size, 1);
  same('…and the count is the scan’s own', s.rows_scanned, 3);

  const soil = metricOf(s, 'soil_moisture');
  same('a quantity every reading carried has no gaps', `${String(soil.samples)},${String(soil.missing)}`, '3,0');
  same('…so its reporting rate is a whole', soil.reporting_rate, 1);
  same('its mean is the readings’ own mean', soil.mean, 30);
  same('…its median the middle value', soil.median, 30);
  same('…its minimum the lowest stored value', `${String(soil.minimum)},${String(soil.maximum)}`, '20,40');
  same('…and its latest the newest one, with its instant', `${String(soil.latest_value)} @ ${String(soil.latest_measured_at)}`, '40 @ 2026-11-06T07:00:00.000Z');
  same('…while first_measured_at is the oldest, which is not the same sentence', soil.first_measured_at, '2026-11-06T05:00:00.000Z');

  const temp = metricOf(s, 'ambient_temp');
  same('a quantity two of three readings carried is 2 samples and 1 missing', `${String(temp.samples)},${String(temp.missing)}`, '2,1');
  same('…with a rate that is the honest two-thirds', temp.reporting_rate, 0.667);
  same('…a mean of the values that exist', temp.mean, 19.5);
  same('…a median that is the lower of the two, not an invented midpoint', temp.median, 18);
  same('…and a latest that is the newest reading which carried it', temp.latest_value, 21);

  const humidity = metricOf(s, 'humidity');
  yes('a quantity nobody measured has a null mean — a zero would be a reading', humidity.mean === null);
  yes('…and nulls for its extremes and its latest too', humidity.minimum === null && humidity.maximum === null && humidity.latest_value === null);
  same('…but its missing count is real, so the gap is a number rather than a blank', humidity.missing, 3);
  same('…and its rate is zero, which is a measurement of the gap rather than a guess', humidity.reporting_rate, 0);
  same('the per-metric gap counts are the same figures the summaries carry',
    Object.entries(s.quality.missing_by_metric).map(([name, value]) => `${name}=${String(value)}`).join(','),
    'soil_moisture=0,ambient_temp=1,humidity=3,battery_voltage=3');

  yes('the same rows handed over in the opposite order give the identical summary',
    show(summarise([...three].reverse())) === show(s), 'the scan order changed the figures');

  const empty = summarise([]);
  same('a window with no readings says so instead of painting zeroes', empty.quality.no_readings_in_window, true);
  same('…and reports no observations', `${String(empty.reporting.observation_count)},${String(empty.rows_scanned)}`, '0,0');
  yes('…with nulls where a mean, a median or a freshness would otherwise be claimed',
    empty.metrics.every((entry) => entry.mean === null && entry.median === null && entry.reporting_rate === null && entry.latest_value === null));
  yes('…and nulls rather than a fabricated reporting cadence',
    empty.reporting.mean_interval_seconds === null && empty.reporting.median_interval_seconds === null && empty.reporting.largest_gap_seconds === null);
  same('…with no missing values to count, because there were no readings to be missing from',
    empty.metrics.every((entry) => entry.missing === 0), true);

  const edges = summarise([
    reading('N1', '2026-11-06T05:00:00Z', { soil_moisture_pct: STORE_RANGES.soil_moisture.min }),
    reading('N1', '2026-11-06T06:00:00Z', { soil_moisture_pct: STORE_RANGES.soil_moisture.max }),
    reading('N1', '2026-11-06T07:00:00Z', { soil_moisture_pct: 50 }),
  ]);
  same('a reading sitting exactly on the bound the schema refuses beyond is counted as an edge', metricOf(edges, 'soil_moisture').at_range_edge, 2);
  yes('…and the bounds are the storage limits, which are not thresholds and are not advice',
    Object.values(STORE_RANGES).every((range) => range.min < range.max) && !s.metrics.some((entry) => 'threshold' in entry),
    show(Object.keys(STORE_RANGES.soil_moisture)));
}

/* ------------------------------------------------------------------ *
 * 16. Reporting health — intervals, freshness, replays, unreadable instants
 * ------------------------------------------------------------------ */

section('Reporting health — intervals, freshness, replays and unreadable instants');
{
  const at = (instant) => Date.parse(instant);
  const cadence = summarise([
    reading('N1', '2026-11-06T05:00:00Z', { soil_moisture_pct: 30 }),
    reading('N1', '2026-11-06T07:00:00Z', { soil_moisture_pct: 31 }),
    reading('N1', '2026-11-06T08:00:00Z', { soil_moisture_pct: 32 }),
  ]);
  same('the intervals between consecutive readings are their differences, in seconds',
    intervalsBetween([at('2026-11-06T05:00:00Z'), at('2026-11-06T07:00:00Z'), at('2026-11-06T08:00:00Z')]).join(','), '7200,3600');
  same('…and the summary’s mean interval is those two averaged', cadence.reporting.mean_interval_seconds, 5400);
  same('…its median the lower of the two rather than a midpoint nobody measured', cadence.reporting.median_interval_seconds, 3600);
  same('…its largest gap the worse of the two, which is what an operator acts on', cadence.reporting.largest_gap_seconds, 7200);
  same('the window’s own first and last measurement instants come from the rows',
    `${String(cadence.reporting.first_measured_at)} … ${String(cadence.reporting.last_measured_at)}`,
    '2026-11-06T05:00:00.000Z … 2026-11-06T08:00:00.000Z');

  same('a single reading is an observation, not a cadence',
    summarise([reading('N1', '2026-11-06T08:00:00Z', { soil_moisture_pct: 30 })]).reporting.mean_interval_seconds, null);
  same('…and two readings at the same instant give no interval either, because zero is not a period',
    intervalsBetween([at('2026-11-06T08:00:00Z'), at('2026-11-06T08:00:00Z')]).length, 0);

  const replay = summarise([
    reading('N1', '2026-11-06T08:00:00Z', { log_id: 1, soil_moisture_pct: 30 }),
    reading('N1', '2026-11-06T08:00:00Z', { log_id: 2, soil_moisture_pct: 31 }),
    reading('N1', '2026-11-06T06:00:00Z', { log_id: 3, soil_moisture_pct: 29 }),
  ]);
  same('a stored replay is counted as two rows at one instant, not merged into one',
    `${String(replay.rows_scanned)},${String(replay.quality.duplicate_instant_count)}`, '3,1');
  same('…with both ids named, so the row a human goes to look at is the row that exists',
    replay.quality.duplicate_instants.map((entry) => `${entry.measured_at}#${entry.log_ids.join('+')}`).join(' | '),
    '2026-11-06T08:00:00Z#1+2');
  same('…and a replay at an instant the device already reported adds no interval to the cadence',
    `${String(replay.reporting.mean_interval_seconds)},${String(replay.reporting.largest_gap_seconds)}`, '7200,7200');

  const backfill = summarise([
    reading('N1', '2026-11-06T08:00:00Z', { log_id: 1, received_at: '2026-11-06T08:01:00Z', soil_moisture_pct: 30 }),
    reading('N1', '2026-11-06T07:00:00Z', { log_id: 2, received_at: '2026-11-06T08:30:00Z', soil_moisture_pct: 31 }),
  ]);
  same('freshness ages from the newest measurement, not the newest arrival', backfill.reporting.freshness_seconds, 3600);
  same('…and receipt freshness is reported as its own number, because a device that backfills makes them differ',
    backfill.reporting.receipt_freshness_seconds, 1800);
  same('…with the newest measurement still the newest one, whichever arrived last', backfill.reporting.last_measured_at, '2026-11-06T08:00:00.000Z');

  const stamped = summarise([
    reading('N1', '2026-11-06T08:00:00Z', { time_source: 'server', soil_moisture_pct: 30 }),
    reading('N1', '2026-11-06T07:00:00Z', { time_source: 'device', soil_moisture_pct: 31 }),
  ]);
  same('a reading whose device sent no timestamp is counted as server-stamped, not corrected away', stamped.quality.server_stamped_count, 1);

  const unreadable = summarise([
    reading('N1', '2026-11-06T07:00:00Z', { log_id: 1, soil_moisture_pct: 30 }),
    reading('N1', '2026-11-06T08:00:00Z', { log_id: 2, measured_at: 'not-an-instant', received_at: 'not-an-instant', soil_moisture_pct: 90 }),
  ]);
  same('a row whose instant cannot be parsed is counted as a problem rather than dropped', unreadable.quality.unparseable_timestamp_count, 1);
  same('…while the scan still reports both rows', `${String(unreadable.rows_scanned)},${String(unreadable.reporting.observation_count)}`, '2,2');
  same('…and its value never becomes the latest reading, because its time is not knowable',
    `${String(metricOf(unreadable, 'soil_moisture').samples)},${String(metricOf(unreadable, 'soil_moisture').latest_value)}`, '1,30');
  yes('…so a broken timestamp cannot move a trend line, only raise a data-quality count',
    unreadable.quality.unparseable_timestamp_count === 1 && unreadable.reporting.last_measured_at === '2026-11-06T07:00:00.000Z',
    show(unreadable.reporting));
}

/* ------------------------------------------------------------------ *
 * 17. Staleness and gaps — only against a window somebody configured
 * ------------------------------------------------------------------ */

section('Staleness and reporting gaps — no verdict without an operator’s rule');
{
  const quiet = [reading('N1', '2026-11-05T13:00:00Z', { soil_moisture_pct: 25 }), reading('N1', '2026-11-06T08:00:00Z', { soil_moisture_pct: 26 })];
  const unconfigured = summarise(quiet);
  yes('with no offline rule in force, nothing is called stale', unconfigured.quality.is_stale === null && unconfigured.quality.stale_after_seconds === null);
  same('…and the report names that as the reason rather than leaving it implied', unconfigured.reporting.reference, 'not_configured');
  same('…while the nineteen-hour silence between the two readings is still measured', unconfigured.reporting.largest_gap_seconds, 19 * 3600);
  yes('…and no gap is counted as unexpected, because nobody said what unexpected means',
    unconfigured.reporting.unexpected_gap_count === null && unconfigured.reporting.gap_threshold_seconds === null,
    show(unconfigured.reporting));

  const anHour = 60;
  const configured = summarise(quiet, anHour);
  same('an operator’s offline rule becomes the threshold, in seconds, and is named as configured',
    `${String(configured.reporting.gap_threshold_seconds)},${String(configured.reporting.reference)}`, '3600,configured_offline_rule');
  same('…it counts the intervals longer than itself, comparing seconds with seconds', configured.reporting.unexpected_gap_count, 1);
  same('…and a device whose last reading is exactly one hour old is not yet stale, because the rule says longer than',
    configured.quality.is_stale, false);
  same('…the same measured intervals are reported, so the numbers do not move when a rule is added',
    configured.reporting.largest_gap_seconds, unconfigured.reporting.largest_gap_seconds);

  const silent = summarise([reading('N1', '2026-11-06T07:00:00Z', { soil_moisture_pct: 25 })], anHour);
  same('two hours of silence past an hour’s rule is stale', silent.quality.is_stale, true);
  same('…four hours of allowance makes the same silence within policy', summarise([reading('N1', '2026-11-06T07:00:00Z', { soil_moisture_pct: 25 })], 240).quality.is_stale, false);
  yes('…and the staleness verdict comes with the window it was measured against',
    silent.quality.stale_after_seconds === 3600, String(silent.quality.stale_after_seconds));
}

/* ------------------------------------------------------------------ *
 * 18. Buckets — Addis-aligned boundaries, and a gap that stays a gap
 * ------------------------------------------------------------------ */

section('Buckets — boundaries in the operator’s day, empty hours drawn as gaps');
{
  const rows = [
    reading('N1', '2026-11-06T05:00:00Z', { soil_moisture_pct: 10 }),
    reading('N1', '2026-11-06T08:00:00Z', { soil_moisture_pct: 30 }),
    reading('N1', '2026-11-06T08:30:00Z', { soil_moisture_pct: 31 }),
  ];
  const hourly = buildBuckets(rows, window24h(), 'hour');
  same('a day cut hourly has both ends of the window as boundaries', hourly.length, 25);
  same('…opening where the window opens, because 09:00 UTC is noon in Addis', hourly[0].bucket_start, '2026-11-05T09:00:00.000Z');
  same('…ending one millisecond before the next boundary, so buckets tile without overlapping', hourly[0].bucket_end, '2026-11-05T09:59:59.999Z');
  same('…and closing at the window’s own last instant', hourly[hourly.length - 1].bucket_start, '2026-11-06T09:00:00.000Z');

  const eight = hourly.find((bucket) => bucket.bucket_start === '2026-11-06T08:00:00.000Z') ?? {};
  same('two readings inside one hour average into one point', `${String(eight.readings)},${String(eight.soil_moisture_pct)}`, '2,30.5');
  const five = hourly.find((bucket) => bucket.bucket_start === '2026-11-06T05:00:00.000Z') ?? {};
  same('…a reading alone in its hour is itself', `${String(five.readings)},${String(five.soil_moisture_pct)}`, '1,10');
  const seven = hourly.find((bucket) => bucket.bucket_start === '2026-11-06T07:00:00.000Z') ?? {};
  yes('an hour nobody reported in has a null for every quantity, which the chart draws as a gap',
    seven.readings === 0 && [seven.soil_moisture_pct, seven.ambient_temp_c, seven.humidity_pct, seven.battery_voltage_v].every((value) => value === null),
    show(seven));
  same('…and every reading lands in exactly one bucket', hourly.reduce((total, bucket) => total + bucket.readings, 0), 3);

  const weekly = summarise(rows, null, historyWindow(resolveHistoryWindow({ range: '7d', from: null, to: null }, NOW)), NOW);
  same('a week is cut by day, not by 168 hours', weekly.bucket_size, 'day');
  same('…whose first boundary is midnight in Addis rather than midnight in UTC', weekly.buckets[0].bucket_start, '2026-10-29T21:00:00.000Z');
  same('…and the seventh day is tiled by eight such boundaries', weekly.buckets.length, 8);
  yes('…with the empty days null too, so a night with no reading is not a flat line',
    weekly.buckets.some((bucket) => bucket.readings === 0 && bucket.soil_moisture_pct === null));
  same('a month is a daily series as well',
    summarise(rows, null, historyWindow(resolveHistoryWindow({ range: '30d', from: null, to: null }, NOW)), NOW).bucket_size, 'day');

  const forced = historyWindow(resolveHistoryWindow({ range: 'custom', from: new Date(NOW - 30 * DAY_MS).toISOString(), to: new Date(NOW).toISOString() }, NOW));
  same('a month cut hourly would be 721 boundaries, and the cap stops it at 700', buildBuckets(rows, forced, 'hour').length, 700);
  yes('…so no request can turn the chart into a download', buildBuckets(rows, forced, 'hour').length <= 700);
  same('a window whose bounds cannot be read yields no buckets rather than a guess',
    buildBuckets(rows, { from: 'yesterday', to: 'today', range: 'custom', span_ms: 0 }, 'hour').length, 0);
}

/* ------------------------------------------------------------------ *
 * Helpers the Phase 6A evaluation sections share.
 * ------------------------------------------------------------------ */

/** One row of `field.alert_rules`, as an operator would write it for cooperative 1. */
const evalRule = (over = {}) => ({
  rule_id: 1,
  name: 'Soil too dry',
  cooperative_id: 1,
  field_site_id: null,
  metric: 'soil_moisture',
  comparator: 'lt',
  threshold_value: 30,
  threshold_units: '%',
  severity: 'warning',
  status: 'enabled',
  ...over,
});

/** The part of a stored reading the evaluator reads. */
const sample = (measured, over = {}) => ({
  log_id: 100,
  measured_at: measured,
  soil_moisture_pct: null,
  ambient_temp_c: null,
  humidity_pct: null,
  battery_voltage_v: null,
  ...over,
});

/** The device the rules are being matched against. */
const target = (over = {}) => ({
  node_id: 'N1',
  status: 'active',
  cooperative_id: 1,
  field_site_id: null,
  last_seen_at: '2026-11-06T08:00:00.000Z',
  ...over,
});

/** The count triple a pass answers with, in the order the result reports them. */
const verdicts = (result) => `${String(result.breaches.length)},${String(result.clears.length)},${String(result.skipped.length)}`;

/* ------------------------------------------------------------------ *
 * 19. Rule evaluation — one breach, one clear, and the reasons a rule sits out
 * ------------------------------------------------------------------ */

section('Rule evaluation — thresholds an operator wrote, never ones the platform guessed');
{
  const against = (value, rule = evalRule()) =>
    evaluateRules({ node: target(), reading: sample('2026-11-06T08:00:00Z', { soil_moisture_pct: value }), previous: null, rules: [rule], now: NOW });

  const breach = against(25);
  same('a reading that crossed a configured threshold raises exactly one alert', verdicts(breach), '1,0,0');
  same('…filed under an alert_type the column can hold', breach.breaches[0].alert_type, 'low_soil_moisture');
  same('…naming the rule so the alert traces back to an operator’s own words', breach.breaches[0].rule_name, 'Soil too dry');
  same('…carrying the value, the unit, the sign and the threshold it was written with',
    `${String(breach.breaches[0].observed_value)}${String(breach.breaches[0].units)} ${breach.breaches[0].comparator} ${String(breach.breaches[0].threshold_value)}`,
    '25% lt 30');
  same('…and the reading it came from, both in the evidence and on the verdict',
    `${String(breach.breaches[0].detail.reading_log_id)},${String(breach.triggered_by.log_id)}`, '100,100');
  same('…with the rule’s severity rather than a platform default', breach.breaches[0].severity, 'warning');

  const clear = against(35);
  same('a reading on the other side is a clear, which is what closes an alert later', verdicts(clear), '0,1,0');
  same('…and the clear names only the type its own rule can close', clear.clears[0].alert_type, 'low_soil_moisture');
  yes('…a value exactly on the threshold has not crossed it, because `lt` means less than',
    clear.breaches.length === 0 && against(30).clears.length === 1, verdicts(against(30)));

  const nothing = against(null);
  same('a reading that did not measure this quantity is skipped rather than cleared', verdicts(nothing), '0,0,1');
  same('…with the reason recorded, so the pass is auditable', nothing.skipped[0].reason, 'no_measurement');
  yes('…which is the difference between “the soil is wet” and “the sensor did not say”: an outage must not close real alerts',
    nothing.clears.length === 0 && nothing.breaches.length === 0, show(nothing));

  same('a disabled rule is not evaluated at all, and says nothing either way',
    verdicts(evaluateRules({ node: target(), reading: sample('2026-11-06T08:00:00Z', { soil_moisture_pct: 5 }), previous: null, rules: [evalRule({ status: 'disabled' })], now: NOW })),
    '0,0,0');
  same('a rule whose unit contradicts its metric is refused rather than read in the wrong dimension',
    against(25, evalRule({ threshold_units: '°C' })).skipped[0].reason, 'rule_units_mismatch');
  same('…and a threshold that is not a number is named as unreadable',
    against(25, evalRule({ threshold_value: null })).skipped[0].reason, 'rule_threshold_unreadable');
  same('…including a value that parses as nothing', against(25, evalRule({ threshold_value: Number.NaN })).skipped[0].reason, 'rule_threshold_unreadable');

  const silentRule = evalRule({ metric: 'offline', comparator: 'gt', threshold_value: 60, threshold_units: 'minutes' });
  const silence = (lastSeen, reading = null) =>
    evaluateRules({ node: target({ last_seen_at: lastSeen }), reading, previous: null, rules: [silentRule], now: NOW });
  const offline = silence('2026-11-06T05:00:00.000Z');
  same('four hours of silence past an hour’s rule is a breach, measured in minutes', verdicts(offline), '1,0,0');
  same('…filed as the device being offline', offline.breaches[0].alert_type, 'device_offline');
  same('…with the silence itself as the observed value', offline.breaches[0].observed_value, 240);
  yes('…and no reading behind it, which the evidence states instead of leaving blank',
    offline.breaches[0].detail.reading_log_id === null && offline.triggered_by === null, show(offline.breaches[0].detail));
  same('a device that reported ten minutes ago is within the window, so its alert can close',
    verdicts(silence('2026-11-06T08:50:00.000Z')), '0,1,0');
  same('a device that has never been seen has no age to compare, and is skipped rather than aged',
    silence(null).skipped[0].reason, 'no_last_seen');
  const swept = silence('2026-11-06T05:00:00.000Z', sample('2026-11-06T09:00:00Z', { soil_moisture_pct: 44 }));
  yes('…a pass that does carry a reading measures the same silence, because the condition is about the clock',
    swept.breaches[0].observed_value === offline.breaches[0].observed_value && swept.triggered_by !== null,
    show(swept.breaches[0]));

  const jumpRule = evalRule({ metric: 'reading_change', comparator: 'gt', threshold_value: 40, threshold_units: '%' });
  const jumped = (current, previous) =>
    evaluateRules({ node: target(), reading: current, previous, rules: [jumpRule], now: NOW });
  const spike = jumped(sample('2026-11-06T08:00:00Z', { soil_moisture_pct: 30 }), sample('2026-11-06T07:00:00Z', { soil_moisture_pct: 20 }));
  same('a jump between two consecutive readings of one quantity is a breach of the change rule', verdicts(spike), '1,0,0');
  same('…reported as a percentage of the previous value', spike.breaches[0].observed_value, 50);
  same('…with the quantity that moved named, since one rule watches all four', spike.breaches[0].detail.changed_metric, 'soil_moisture');
  same('…plus both values and the instant of the one it was compared against',
    `${String(spike.breaches[0].detail.current_value)},${String(spike.breaches[0].detail.previous_value)},${String(spike.breaches[0].detail.previous_measured_at)}`,
    '30,20,2026-11-06T07:00:00Z');
  const dropped = jumped(sample('2026-11-06T08:00:00Z', { soil_moisture_pct: 10 }), sample('2026-11-06T07:00:00Z', { soil_moisture_pct: 20 }));
  same('…the size of the jump is what the rule watches, so a halving alerts as loudly as a doubling', dropped.breaches[0].observed_value, 50);
  const widest = jumped(
    sample('2026-11-06T08:00:00Z', { soil_moisture_pct: 50, humidity_pct: 60 }),
    sample('2026-11-06T07:00:00Z', { soil_moisture_pct: 30, humidity_pct: 50 }),
  );
  same('two quantities crossing on one submission is one alert, carrying the widest jump',
    `${verdicts(widest)} @ ${String(widest.breaches[0].observed_value)} ${String(widest.breaches[0].detail.changed_metric)}`, '1,0,0 @ 66.67 soil_moisture');
  same('a change below the threshold is a clear',
    verdicts(jumped(sample('2026-11-06T08:00:00Z', { humidity_pct: 51 }), sample('2026-11-06T07:00:00Z', { humidity_pct: 50 }))),
    '0,1,0');
  same('with no previous reading there is nothing to compare, and the rule says so',
    jumped(sample('2026-11-06T08:00:00Z', { soil_moisture_pct: 30 }), null).skipped[0].reason, 'no_previous_reading');
  same('…a previous value of zero is a division by zero, not an infinite change',
    jumped(sample('2026-11-06T08:00:00Z', { soil_moisture_pct: 10 }), sample('2026-11-06T07:00:00Z', { soil_moisture_pct: 0 })).skipped[0].reason,
    'previous_value_is_zero');
  same('…and two readings that measured nothing in common are not comparable at all',
    jumped(sample('2026-11-06T08:00:00Z', { soil_moisture_pct: 30 }), sample('2026-11-06T07:00:00Z', { ambient_temp_c: 20 })).skipped[0].reason,
    'no_comparable_previous');

  same('the percentage itself is the same arithmetic from either side', `${String(changePercent(30, 20))},${String(changePercent(20, 20))}`, '50,0');
  yes('…and is null rather than infinite or invented when it cannot be computed',
    changePercent(50, 0) === null && changePercent(null, 10) === null && changePercent(10, null) === null);

  const filing = RULE_METRICS.flatMap((metric) => ['lt', 'gt'].map((comparator) => `${metric} ${comparator} → ${alertTypeFor(metric, comparator)}`));
  same('every metric and sign is filed under a type the column CHECK allows', filing.join(' | '), 'soil_moisture lt → low_soil_moisture | soil_moisture gt → abnormal_reading | ambient_temp lt → abnormal_reading | ambient_temp gt → high_temperature | humidity lt → abnormal_reading | humidity gt → abnormal_reading | battery_voltage lt → low_battery | battery_voltage gt → abnormal_reading | offline lt → device_offline | offline gt → device_offline | reading_change lt → abnormal_reading | reading_change gt → abnormal_reading');
  yes('…no threshold can raise `sensor_failure`, because only a refused payload can attest to a fault',
    !filing.some((line) => line.endsWith('sensor_failure')), filing.join(' | '));
  yes('…and every type named here is in the schema’s own vocabulary',
    filing.every((line) => ALERT_TYPES.includes(line.split(' → ')[1])), filing.join(' | '));
  same('a rule is evaluated in the unit its metric is stored in, and in no other',
    RULE_METRICS.map((metric) => `${metric}:${METRIC_UNITS[metric]}`).join(','), 'soil_moisture:%,ambient_temp:°C,humidity:%,battery_voltage:V,offline:minutes,reading_change:%');
  yes('…which is the same test the database runs before a rule can be written',
    RULE_METRICS.every((metric) => unitsMatchMetric(metric, METRIC_UNITS[metric]) && !unitsMatchMetric(metric, 'furlongs')));
}

/* ------------------------------------------------------------------ *
 * 20. Evaluation scope and retry safety
 * ------------------------------------------------------------------ */

section('Evaluation scope — whose rules fire on which device, and twice being the same as once');
{
  const covering = (node, rules) => rulesForNode(rules, node).map((rule) => rule.rule_id).join(',');
  same('a cooperative rule covers every device in that cooperative', covering(target({ cooperative_id: 1 }), [evalRule({ rule_id: 1, cooperative_id: 1 })]), '1');
  same('…and never a device in the cooperative next door', covering(target({ cooperative_id: 2 }), [evalRule({ rule_id: 1, cooperative_id: 1 })]), '');
  same('…nor a device whose cooperative has never been assigned', covering(target({ cooperative_id: null }), [evalRule({ rule_id: 1, cooperative_id: 1 })]), '');
  same('a site rule covers only a device standing in that site', covering(target({ field_site_id: 5 }), [evalRule({ rule_id: 2, cooperative_id: null, field_site_id: 5 })]), '2');
  same('…not a device in another site of the same cooperative',
    covering(target({ cooperative_id: 1, field_site_id: 7 }), [evalRule({ rule_id: 2, cooperative_id: null, field_site_id: 5 })]), '');
  same('…nor one that has no site at all', covering(target({ field_site_id: null }), [evalRule({ rule_id: 2, cooperative_id: null, field_site_id: 5 })]), '');
  same('a platform rule (both scope columns null) covers every device, knowingly',
    covering(target({ cooperative_id: 9, field_site_id: 9 }), [evalRule({ rule_id: 3, cooperative_id: null, field_site_id: null })]), '3');
  same('…an unassigned device included, which is the operator’s own choice to write it that way',
    covering(target({ cooperative_id: null, field_site_id: null }), [evalRule({ rule_id: 3, cooperative_id: null, field_site_id: null })]), '3');
  same('a rule an operator retired is not in the set at all', covering(target(), [evalRule({ status: 'disabled' })]), '');
  same('…and several scopes can cover one device at once, tighter first in id order',
    covering(target({ cooperative_id: 1, field_site_id: 5 }), [
      evalRule({ rule_id: 11, cooperative_id: 1, field_site_id: null }),
      evalRule({ rule_id: 12, cooperative_id: null, field_site_id: 5 }),
      evalRule({ rule_id: 13, cooperative_id: 2, field_site_id: null }),
    ]), '11,12');

  const foreign = evaluateRules({
    node: target({ cooperative_id: 2, field_site_id: null }),
    reading: sample('2026-11-06T08:00:00Z', { soil_moisture_pct: 4 }),
    previous: null,
    rules: [evalRule({ cooperative_id: 1 })],
    now: NOW,
  });
  same('a bone-dry device in another cooperative gets no verdict from this cooperative’s rule', verdicts(foreign), '0,0,0');
  yes('…not even a skip, which would still be a statement about somebody else’s field', foreign.clears.length === 0, show(foreign));

  const sweep = {
    node: target({ last_seen_at: '2026-11-06T05:00:00.000Z' }),
    reading: sample('2026-11-06T08:00:00Z', { soil_moisture_pct: 20 }),
    previous: sample('2026-11-06T07:00:00Z', { soil_moisture_pct: 60 }),
    rules: [
      evalRule({ rule_id: 9, metric: 'offline', comparator: 'gt', threshold_value: 60, threshold_units: 'minutes', name: 'Quiet device' }),
      evalRule({ rule_id: 4, metric: 'reading_change', comparator: 'gt', threshold_value: 40, threshold_units: '%', name: 'Sudden change' }),
      evalRule({ rule_id: 2, severity: 'critical', name: 'Soil too dry' }),
    ],
    now: NOW,
  };
  const first = evaluateRules(sweep);
  same('three rules that all agree raise three conditions, in rule order whatever order they were read in',
    first.breaches.map((breach) => breach.rule_id).join(','), '2,4,9');
  same('…each filed under the type the open-row index keys on',
    first.breaches.map((breach) => `${String(breach.rule_id)}:${breach.alert_type}`).join(','), '2:low_soil_moisture,4:abnormal_reading,9:device_offline');
  same('…and the verdict is about the reading that arrived', first.triggered_by.measured_at, '2026-11-06T08:00:00Z');
  yes('a replay of the same submission produces an identical list, which is what makes retry safe at the decision layer',
    show(evaluateRules(sweep)) === show(first), 'the evaluator is not deterministic');
  yes('…and the order the caller passed the rules in cannot change the answer',
    show(evaluateRules({ ...sweep, rules: [...sweep.rules].reverse() })) === show(first), 'the rule order leaked into the verdicts');
  yes('…with nothing skipped, so a silent failure cannot hide inside a successful pass',
    first.skipped.length === 0 && first.clears.length === 0, verdicts(first));
}

/* ------------------------------------------------------------------ *
 * 21. Alert and credential authorisation
 * ------------------------------------------------------------------ */

section('Alert and credential authorisation — eight actions, read or managed, refused in the right words');
{
  const actionsBlock = readSource('lib', 'field', 'types.ts').match(/export type ManagementAction =([\s\S]*?);\n/)?.[1] ?? '';
  const actionNames = [...actionsBlock.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]);
  yes(`every declared management action is classified (${String(actionNames.length)} of them)`, actionNames.length >= 18, String(actionNames.length));
  yes('…and none lands in a capability the table does not name', actionNames.every((action) => ['read', 'manage'].includes(capabilityOf(action))),
    actionNames.filter((action) => !['read', 'manage'].includes(capabilityOf(action))).join(', '));
  same('…the nine reads, which now include one alert’s own detail',
    actionNames.filter((action) => capabilityOf(action) === 'read').sort().join(','),
    'alert_list,alert_view,device_list,device_view,map_read,observation_read,overview_read,site_list,site_view');
  same('…and the nine writes, which now include acknowledging, resolving, and listing a device’s credentials',
    actionNames.filter((action) => capabilityOf(action) === 'manage').sort().join(','),
    'alert_acknowledge,alert_resolve,credential_list,credential_provision,credential_revoke,credential_rotate,device_register,device_status_change,device_update');

  const manager = [{ cooperative_id: 1, role: 'manager' }];
  const viewer = [{ cooperative_id: 1, role: 'viewer' }];
  yes('a viewer may list alerts and open one to read its evidence',
    decideAccess(viewer, 1, 'alert_list').ok === true && decideAccess(viewer, 1, 'alert_view').ok === true, show(decideAccess(viewer, 1, 'alert_view')));
  same('…but acknowledging is a manager’s act', decideAccess(viewer, 1, 'alert_acknowledge'), { ok: false, reason: 'insufficient_role' });
  same('…so is resolving, because closing an alert ends a watch somebody else may be relying on', decideAccess(viewer, 1, 'alert_resolve'), { ok: false, reason: 'insufficient_role' });
  same('…and so is listing a device’s credential metadata', decideAccess(viewer, 1, 'credential_list'), { ok: false, reason: 'insufficient_role' });
  yes('a manager may do all five',
    ['alert_list', 'alert_view', 'alert_acknowledge', 'alert_resolve', 'credential_list'].every((action) => decideAccess(manager, 1, action).ok === true),
    ['alert_list', 'alert_view', 'alert_acknowledge', 'alert_resolve', 'credential_list'].filter((action) => !decideAccess(manager, 1, action).ok).join(', '));
  same('a caller with no membership in the cooperative is refused before their role is ever asked',
    decideAccess([], 1, 'alert_view'), { ok: false, reason: 'not_a_member' });
  same('…and a device nobody owns is not open to every authenticated caller',
    decideAccess(manager, null, 'alert_list'), { ok: false, reason: 'not_a_member' });

  const roleAnswer = refusalFor({ ok: false, reason: 'insufficient_role' }, 'alert');
  same('a viewer who tries to acknowledge is told their own role, which is their own fact', roleAnswer.answer.code, 'insufficient_role');
  same('…at 403', MANAGEMENT_STATUS_BY_CODE[roleAnswer.answer.code], 403);
  yes('…with a sentence that says what a viewer may still do', /can see an alert and its evidence/.test(roleAnswer.answer.message), roleAnswer.answer.message);
  same('…and the trail records the same reason it told', roleAnswer.auditReason, 'insufficient_role');

  const stranger = refusalFor({ ok: false, reason: 'not_a_member' }, 'alert', 41);
  same('a stranger who guesses an alert id is answered with the not-found code', stranger.answer.code, 'unknown_alert');
  same('…at 404, so “alert 41 exists in another cooperative” is not a fact they get to have', MANAGEMENT_STATUS_BY_CODE[stranger.answer.code], 404);
  same('…while the audit trail keeps the real reason, which the answer does not', stranger.auditReason, 'not_a_member');
  yes('…and the answer names no cooperative, no owner and no field', !/cooperative|owner|site/i.test(stranger.answer.message), stranger.answer.message);
  yes('…the alert probe has its own code rather than borrowing the device one',
    stranger.answer.code !== refusalFor({ ok: false, reason: 'not_a_member' }, 'device').answer.code, stranger.answer.code);

  const both = [{ cooperative_id: 1, role: 'viewer' }, { cooperative_id: 2, role: 'manager' }, { cooperative_id: 4, role: 'manager' }];
  same('a read scope is every cooperative the caller belongs to at all', scopedCooperativeIds(both, 'read').join(','), '1,2,4');
  same('…a management scope only the ones they manage, which is what an alert write is filtered by',
    scopedCooperativeIds(both, 'manage').join(','), '2,4');
  same('…sorted, because the array goes into an `in()` filter and into an assertion',
    scopedCooperativeIds([{ cooperative_id: 4, role: 'manager' }, { cooperative_id: 2, role: 'manager' }], 'manage').join(','), '2,4');
  same('a caller who asks to filter by a cooperative they manage gets exactly that one', narrowScope(both, 2, 'manage').join(','), '2');
  same('…a viewer asking for their own cooperative gets null rather than a widened scope', narrowScope(both, 1, 'manage'), null);
  same('…and a cooperative they do not belong to gets null as well', narrowScope(both, 99, 'read'), null);
  yes('…an empty scope is an empty answer, not a missing filter', scopedCooperativeIds([], 'read').length === 0 && narrowScope([], null, 'read').length === 0);
}

/* ------------------------------------------------------------------ *
 * 22. Alert persistence — one writer, one open row, failures told
 * ------------------------------------------------------------------ */

section('Alert persistence — one writer, one open row per condition, and failures that are told');
{
  const services = sourceTree('lib', 'field');
  const api = sourceTree('app', 'api');
  const svc = services['alertService.ts'] ?? '';
  const gate = services['managementApi.ts'] ?? '';
  const sql = readRaw('supabase', 'migrations', '20261105000200_field_intelligence_observations.sql');

  const readers = Object.entries(services).filter(([, text]) => text.includes("from('device_alerts')")).map(([name]) => name).sort();
  same('the alert table is read from the two modules that know its shape', readers.join(','), 'alertService.ts,observationService.ts');
  const writers = readers.filter((name) => /from\('device_alerts'\)[\s\S]{0,220}?\.(insert|update)\(/.test(services[name]));
  same('…and written from exactly one of them, so no second code path can raise a duplicate row', writers.join(','), 'alertService.ts');
  yes('…no route queries the table itself, which is where a missing scope filter would hide',
    Object.entries(api).every(([, text]) => !text.includes("from('device_alerts')")),
    Object.entries(api).filter(([, text]) => text.includes("from('device_alerts')")).map(([name]) => name).join(', '));

  yes('the database, not this file, is what refuses a second open alert for one condition on one device',
    /create unique index if not exists device_alert_one_open_per_node_and_type_uid\s+on field\.device_alerts \(node_id, alert_type\)\s+where status in \('open', 'acknowledged'\);/.test(sql),
    'the partial unique index is not in the migration');
  yes('…the writer treats that conflict as the expected retry path rather than as an error',
    /error\.code === '23505'/.test(svc) && svc.includes('device_alert_one_open_per_node_and_type_uid'), 'the 23505 branch is gone');
  yes('…by adopting the row it collided with and advancing it, so a replayed submission updates one alert',
    /23505[\s\S]{0,500}openAlertsForNode[\s\S]{0,220}advanceAlert\(/.test(svc), 'a conflict does not advance the existing row');
  yes('…and saying so, with its own step and code, when the adoption cannot complete',
    svc.includes("'reread_after_conflict'") && svc.includes("'unique_index_conflict_unresolved'"));

  const SUPPRESSIONS = ['duplicate_alert_type_in_this_evaluation', 'kept_open_by_a_breach_in_this_evaluation', 'open_alert_belongs_to_another_rule', 'open_alert_has_no_rule_to_clear_it'];
  yes('four conditions a pass could have written are reported as suppressed rather than quietly dropped',
    SUPPRESSIONS.every((reason) => svc.includes(`| '${reason}'`) && (svc.match(new RegExp(`reason: '${reason}'`, 'g')) ?? []).length === 1),
    SUPPRESSIONS.filter((reason) => !svc.includes(reason)).join(', '));
  yes('…a breach outranks a clear of the same type, so an all-clear is never invented beside an open condition',
    /claimed\.has\(clear\.alert_type\)/.test(svc), 'a clear can close what another rule is breaching');
  yes('…only the rule that raised a condition closes it', /openRow\.alert_rule_id !== clear\.rule_id/.test(svc), 'any clear can close any row');
  yes('…and a row with no rule behind it is left for a person, because nothing configured can attest to its end',
    /openRow\.alert_rule_id === null/.test(svc), 'an unowned row is auto-closed');

  const cap = Number((svc.match(/export const OPEN_ALERT_SCAN_CAP = (\d+)/) ?? [])[1] ?? '0');
  yes(`one pass reads at most ${String(cap)} open rows per device, so a broken evaluator cannot make it unbounded`, cap > 0 && cap <= 100, String(cap));
  yes('…and says when the cap was what limited the scan rather than the data',
    /truncated: rows\.length >= OPEN_ALERT_SCAN_CAP/.test(svc), 'a truncated scan is silent');

  const STEPS = ['read_open_alerts', 'insert_alert', 'advance_alert', 'resolve_alert', 'reread_after_conflict', 'evaluation_aborted'];
  yes('every write that cannot complete comes back with its step and a code', STEPS.every((step) => svc.includes(`'${step}'`)), STEPS.filter((step) => !svc.includes(`'${step}'`)).join(', '));
  yes('…an evaluation that throws is still an answered pass with a failure in it, never a thrown error at the caller',
    /step: 'evaluation_aborted'[\s\S]{0,260}return \{ ok: true, value: outcome \}/.test(svc), 'the throw escapes the outcome');
  yes('…and the whole pass is then marked as not evaluated, which is what the ingestion response reports',
    /outcome\.evaluated = false/.test(svc) && /evaluated: true/.test(svc), 'the evaluated flag is missing');

  yes('the alert’s own clock is the platform’s, and never earlier than a timestamp already on the row',
    /Math\.max\(now, baseAt\)/.test(svc), 'a replay can move first_raised_at backwards');
  yes('…a re-confirmed condition updates only the observation time and the evidence, so an acknowledged alert stays acknowledged',
    svc.includes('.update({ last_observed_at: at, detail: breach.detail })'), 'the advance writes status or age');
  yes('…closing one writes status and timestamp in the same statement, because the schema refuses either alone',
    svc.includes(".update({ status: 'resolved', resolved_at: at })"), 'the close splits its write');

  const acknowledge = api['field/alerts/[alertId]/acknowledge/route.ts'] ?? '';
  const resolve = api['field/alerts/[alertId]/resolve/route.ts'] ?? '';
  const detail = api['field/alerts/[alertId]/route.ts'] ?? '';
  const list = api['field/alerts/route.ts'] ?? '';
  yes('the alert routes ask who the caller is before anything else — a read for the list and the detail',
    /openScopedRead\(request, 'alert_list'\)/.test(list) && /openScopedRead\(request, 'alert_view'\)/.test(detail), 'a read route opened without its action');
  yes('…and the management gate for the two writes, whose capability table says viewer is not enough',
    /openManagement\(request, 'alert_acknowledge'\)/.test(acknowledge) && /openManagement\(request, 'alert_resolve'\)/.test(resolve), 'a write route skipped the gate');
  yes('…ownership is settled by reading the alert, then its device, then comparing that cooperative with the caller’s scope',
    /loadAlertAndAuthorize\(ctx, alertId\)/.test(acknowledge) && /scopedCooperativeIds\(ctx\.memberships, 'read'\)/.test(gate) && /decideAccess\(ctx\.memberships,[\s\S]{0,80}ctx\.action\)/.test(gate),
    'the ownership hop or the role gate is missing');
  yes('…a guessed id is audited as a refusal even though the caller only ever sees a 404',
    gate.includes("reasonCode: 'unknown_alert'") && /outcome: 'refused'/.test(gate), 'the probe left no trail');
  yes('…the write goes to the service with the server-resolved scope, never a cooperative the browser named',
    /acknowledgeAlert\([\s\S]{0,40}scope\)/.test(acknowledge) && /resolveAlert\([\s\S]{0,60}scope[\s\S]{0,40}\)/.test(resolve),
    'the scope argument is not the server’s');
  yes('…both the change and the refusal are audited, with the alert id rather than its contents',
    /ctx\.audit\(\{[\s\S]{0,240}outcome: 'success'/.test(acknowledge) && /reasonCode: acknowledged\.error\.code/.test(acknowledge), 'an acknowledge wrote no trail');
  yes('…and the answer says whether anything was written, so a repeat click is not reported as a second change',
    /changed: acknowledged\.value\.changed/.test(acknowledge) && /changed: resolved\.value\.changed/.test(resolve), 'the response hides the no-op');

  const transitionCall = (name) => (svc.match(new RegExp(`function ${name}\\([\\s\\S]{0,260}?transitionAlert\\([\\s\\S]*?\\);`)) ?? [''])[0] ?? '';
  yes('an acknowledgement moves only an open row, and only to acknowledged', transitionCall('acknowledgeAlert').includes("['open'], 'acknowledged'"), transitionCall('acknowledgeAlert'));
  yes('…resolving accepts an open or an acknowledged row, which is what the panel offers on each',
    transitionCall('resolveAlert').includes("['open', 'acknowledged']"), transitionCall('resolveAlert'));
  yes('…both are written as a compare-and-set on the status the read saw, so two managers produce one change',
    /update\(patch\)[\s\S]{0,200}\.eq\('status', alert\.status\)/.test(svc), 'the transition is unconditional');
  yes('…a row somebody else moved first is re-read and answered as unchanged rather than as a failure',
    /const reread = await alertWithScope\(/.test(svc) && svc.includes('changed: false'), 'the lost race is an error');
  yes('…and a row already in the state asked for is an idempotent success with nothing written',
    /if \(alert\.status === to\) return \{ ok: true, value: \{ alert, changed: false \} \}/.test(svc), 'a repeat call writes again');
}

/* ------------------------------------------------------------------ *
 * 23. Credential metadata disclosure
 * ------------------------------------------------------------------ */

section('Credential metadata — a manager can list what a device holds, and never what it is');
{
  const api = sourceTree('app', 'api');
  const services = sourceTree('lib', 'field');
  const route = api['hardware/devices/[nodeId]/credentials/route.ts'] ?? '';
  const mgmt = services['managementService.ts'] ?? '';
  const getList = route.match(/export async function GET\([\s\S]*?\n\}/)?.[0] ?? '';

  same('the listing reads exactly the seven metadata columns the response is allowed to describe',
    CREDENTIAL_METADATA_COLUMNS, 'credential_id,node_id,hash_algorithm,created_at,last_used_at,expires_at,revoked_at');
  same('…of which the only column that could carry a secret is the one that names how it was hashed',
    CREDENTIAL_METADATA_COLUMNS.replace('hash_algorithm', '').split(',').filter((column) => /token|secret|plain|value/i.test(column)).join(','), '');
  yes('…the hash column is selected by the authentication path, which is server-side and does not respond',
    Object.entries(api).every(([, text]) => !text.includes('token_hash')),
    Object.entries(api).filter(([, text]) => text.includes('token_hash')).map(([name]) => name).join(', '));
  same('…in the service layer it is named only by the modules that verify, store or type a credential',
    Object.entries(services).filter(([, text]) => text.includes('token_hash')).map(([name]) => name).sort().join(','),
    'authorize.ts,deviceService.ts,managementService.ts,registration.ts,types.ts');

  const metadataShape = (mgmt.match(/export interface CredentialMetadata \{([\s\S]*?)\n\}/) ?? ['', ''])[1];
  same('the type the endpoint returns carries ids, times and a state, and nothing else',
    [...metadataShape.matchAll(/^ {2}([a-z_]+):/gm)].map((entry) => entry[1]).join(','),
    'credential_id,hash_algorithm,issued_at,last_used_at,expires_at,revoked_at,state');
  yes('…so a later column added to the table cannot reach a response body by accident',
    !/token|secret|plain/i.test(metadataShape.replace('hash_algorithm', '')), metadataShape);
  yes('…`state` is derived, since the schema holds no state column of its own',
    /'current' \| 'expired' \| 'retired'/.test(metadataShape) && /revoked_at IS NOT NULL|revokedAt !== null/.test(mgmt), 'state is not derived');

  yes('listing a device’s credentials is a manager’s read, taken through the same gate as its writes',
    /openManagement\(request, 'credential_list'\)/.test(getList), 'the listing opened without the manager gate');
  yes('…scoped by the device’s own cooperative rather than anything the caller typed',
    /loadAndAuthorize\(opened\.ctx, nodeId, 'credential'\)/.test(route) && !/cooperative_id=/.test(route), 'the route resolved its own scope');
  yes('…returning metadata and a note, and no secret field of any name',
    getList.length > 0 && !/device_secret|deviceSecret|token_hash|plaintext/.test(getList), getList.slice(0, 160));
  yes('…while the secret still exists in exactly one place in the file: the response that issues it',
    route.includes('device_secret') && !getList.includes('device_secret'), 'the secret left the issuing path');
  yes('…the listing is bounded by a page size, not by the size of a device’s history',
    /\.range\(0, limit - 1\)/.test(mgmt) && /intParam\(url, 'limit', 1, MAX_PAGE_SIZE/.test(route), 'the listing is unbounded');
  yes('…and a full page is reported as partial coverage rather than as the whole history',
    /coverage: credentials\.length === limit \? 'partial' : 'complete'/.test(route), 'a full page claimed completeness');

  const panel = dashboardSources()['FieldDeviceManagementSection.tsx'] ?? '';
  yes('the dashboard addresses a credential by id, which is what the listing exists to make possible',
    /field\.devices\.revokeIdLabel/.test(panel) && /field\.devices\.revokeIdHint/.test(panel), 'the revoke form has no id field');
  same('…and the hint points at the endpoint rather than at a secret',
    String(en['field.devices.revokeIdHint']).includes('/api/hardware/devices/') && String(en['field.devices.revokeIdHint']).includes('/credentials'), true);
  yes('…no panel renders a hash or a plaintext from the listing', !/token_hash/.test(panel), 'a hash reached the panel');
}

/* ------------------------------------------------------------------ *
 * 24. Ingestion contract regression
 * ------------------------------------------------------------------ */

section('Ingestion contract — the device-facing surface is untouched by the alerting work');
{
  const api = sourceTree('app', 'api');
  const ingest = api['v1/hardware/logs/route.ts'] ?? '';
  const rawIngest = readRaw('app', 'api', 'v1', 'hardware', 'logs', 'route.ts');

  same('the sixteen device-facing codes still answer with the statuses the firmware branches on',
    Object.entries(INGEST_STATUS_BY_CODE).map(([code, status]) => `${code}=${String(status)}`).sort().join(','),
    'credential_expired=403,database_not_configured=503,database_unavailable=503,device_disabled=403,duplicate_reading=409,internal_error=500,invalid_content_type=400,invalid_credentials=401,invalid_payload=400,malformed_json=400,not_provisioned=401,payload_too_large=413,rate_limited=429,timestamp_out_of_window=400,unknown_credential=404,unknown_node=404');
  same('…including the two codes the management surface shares, which must mean the same thing to both',
    `${String(MANAGEMENT_STATUS_BY_CODE.unknown_node)},${String(MANAGEMENT_STATUS_BY_CODE.unknown_alert)}`, '404,404');

  yes('a stored reading is still accepted with 201 whatever the alerting side did',
    /\{ status: 201, headers: \{ 'cache-control': 'no-store' \} \}/.test(ingest), 'the accepted response changed');
  const evaluationAt = ingest.indexOf('const evaluation = await evaluateForIngestion');
  yes('…the evaluation runs only after the row is stored, so a payload that was refused evaluates nothing',
    evaluationAt > ingest.indexOf('if (!stored.ok) return refused(stored.error)') && /return refused\(/.test(ingest.slice(0, evaluationAt)) && !/return refused\(/.test(ingest.slice(evaluationAt)),
    'an evaluation failure could still refuse the reading');
  yes('…an evaluation that could not run is reported in the response rather than dropped',
    /performed: false, reason: evaluated\.error\.code/.test(ingest) && /performed: false, reason: 'evaluation_threw'/.test(ingest),
    'a failed evaluation is invisible');
  yes('…so the platform never swallows its own alerting failures, and never blames the device for them',
    /The reading is stored/.test(ingest) && !/status: 50[0-9][\s\S]{0,80}evaluation/.test(ingest), 'an evaluation failure changed the status');
  yes('…the published contract says in words that alerting cannot change the response',
    /Nothing in that evaluation changes this response status/.test(rawIngest), 'the contract stopped saying it');
  yes('…and that this platform sets no thresholds of its own, which is what keeps the engine honest',
    /alert_evaluation: /.test(rawIngest) && rawIngest.includes('the alert rules that cover this device are evaluated'), 'the contract dropped the evaluation section');
  const services = sourceTree('lib', 'field');
  same('readings are inserted by exactly one service function, and the alerting path is not it',
    Object.entries(services).filter(([, text]) => /from\('sensor_logs'\)[\s\S]{0,80}\.insert\(/.test(text)).map(([name]) => name).sort().join(','), 'deviceService.ts');
  yes('…no route writes a reading, and none reaches the table at all',
    Object.entries(api).every(([, text]) => !text.includes("from('sensor_logs')")),
    Object.entries(api).filter(([, text]) => text.includes("from('sensor_logs')")).map(([name]) => name).join(', '));
}


/* ------------------------------------------------------------------ *
 * 25. The published contract — the specification names every route that exists
 * ------------------------------------------------------------------ */

section('The written contract — a route nobody documented is a route that will silently drift');
{
  // `docs/api-specification.md` is what an integrator reads before they trust this API, and what a
  // reviewer checks the code against. Nothing compiles it, so it rots: an endpoint ships working and
  // undocumented, and the next one gets copied from the last documented example rather than from the
  // route. This grades the document against the file tree, the way the HTTP gates grade the surface
  // against the session check.
  const spec = readRaw('docs', 'api-specification.md');
  // Prose wraps at 100 columns, so a literal list can sit across two lines. Comparing collapsed text
  // keeps the assertion about the FIELDS rather than about where the editor broke the line.
  const flat = spec.replace(/\s+/g, ' ');

  const fieldRoutes = Object.keys(sourceTree('app', 'api', 'field')).sort().map((key) => `/api/field/${key.replace(/\/route\.ts$/, '')}`);

  const missing = fieldRoutes.filter((path) => !spec.includes(path));
  yes(`every field route is named in the specification (${String(fieldRoutes.length)} checked)`,
    missing.length === 0, missing.length === 0 ? 'all named' : missing.join(', '));

  yes('…including the alert detail route by its documented path, not just the list',
    spec.includes('GET /api/field/alerts/[alertId]') && spec.includes('POST /api/field/alerts/[alertId]/acknowledge') && spec.includes('POST /api/field/alerts/[alertId]/resolve'),
    'an action route is missing its method-and-path heading');

  yes('the credential listing is documented as a GET, on the route that already had a POST',
    spec.includes('GET /api/hardware/devices/[nodeId]/credentials'), 'the metadata listing has no heading');
  yes('…with the exact field list the query is allowed to produce, so a later column shows up as a doc gap',
    flat.includes('{ credential_id, hash_algorithm, issued_at, last_used_at, expires_at, revoked_at, state }'), 'the documented field list drifted');

  yes('the history and data-quality windows are documented with the bounds the parser enforces',
    spec.includes('366 days') && spec.includes('Africa/Addis_Ababa') && spec.includes('`scan_cap` (2000)'),
    'the window grammar or a scan cap is missing from the spec');

  yes('`unknown_alert` is documented at 404, which is the answer that hides existence',
    /`unknown_alert` \| 404/.test(spec) || spec.includes('`unknown_alert` is 404'), 'the refusal status is undocumented');

  // The three promises this phase would otherwise lose quietly, because each lives where a later
  // "simplification" would look like an improvement.
  yes('the spec says an alerting failure cannot change a device’s response',
    /Nothing in that step changes this response/.test(flat), 'the ingestion/evaluation guarantee left the document');
  yes('…that resolving an alert does not silence the rule behind it',
    flat.includes('if_the_condition_returns') && /does not silence a rule/.test(flat), 'the re-raise behaviour is undocumented');
  yes('…that the platform sets no thresholds of its own',
    /an operator wrote into `field\.alert_rules`/.test(flat) && spec.includes('store_bounds_are_not_thresholds'),
    'the no-invented-thresholds rule or the store-bound disclaimer is missing');
  yes('…and that a staleness verdict needs an operator’s rule, stated as the absence of one',
    spec.includes('not_configured'), 'the not_configured basis is undocumented');

  const planned = spec.slice(spec.indexOf('## Planned, not implemented'));
  yes('the planned list no longer claims the alert routes are unwritten',
    !planned.includes('/api/alerts*') && planned.includes('/api/field/alerts'), planned.split('\n')[2]);
  yes('…while still claiming the authoring side is missing, which is the honest gap',
    /no endpoint writes[\s\S]{0,40}alert_rules/.test(planned), 'the rule-authoring gap was dropped instead of restated');
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
  console.log(`  ${result.pass ? '✓' : '✗'} ${result.label}${result.pass ? '' : ` — ${result.detail}`}`);
}

console.log(`\n${results.length - failures.length}/${results.length} assertions passed.`);
if (failures.length > 0) {
  console.log(`${failures.length} FAILED.`);
  process.exitCode = 1;
} else {
  console.log('Dashboard derivations are exact within their stated bounds; counts and totals come from the database.');
}
