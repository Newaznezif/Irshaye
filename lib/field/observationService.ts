import { parseObservedAt } from '@/lib/data/freshness';
import { getSyncClient } from '@/lib/supabaseAdmin';

import { databaseUnavailable, fieldDatabaseStatus } from './deviceService';
import { METRIC_UNITS } from './metrics';
import { NODE_COLUMNS } from './managementService';
import { ALL_STATUSES } from './registration';
import type { ManagementDb } from './managementService';
import type { CoordinateSource, HardwareNodeRow, IngestFailure, NodeStatus, ReadingTimeSource } from './types';

/**
 * Cooperative-scoped reads for the Field Intelligence dashboard.
 *
 * This is the data half of the dashboard phase, and it lives in its own module for one reason:
 * Phase 4 established that a device read is safe only when the scope comes from memberships the
 * server read, and a dashboard multiplies that exposure. A page with six sections issues more
 * queries than any firmware loop, so every function here takes an explicit `cooperativeScope:
 * number[]` produced by `narrowScope(memberships, …, 'read')` at the route — and has no other way
 * to obtain one. An empty scope answers empty **without touching the database**, the same rule
 * `listDevicesInScope` keeps, because a caller with no membership should not be generating load.
 *
 * Three properties every function here holds, because the brief asks for them by name:
 *
 *  1. **Bounded.** Every select names its columns, is paginated or capped, and reports the cap it
 *     hit (`coverage: 'partial'`) instead of quietly returning less than the truth. The caps serve
 *     a second purpose: an `.in(…)` list travels in the request URL, so an unbounded id list is not
 *     merely slow, it is an oversized request that fails at the edge.
 *  2. **Real.** No figure comes from a constant, a sample, or a "typical" value. Where the database
 *     cannot answer exactly within a cap, the response says so and the UI has to render that
 *     admission rather than the number someone would prefer to see.
 *  3. **Nothing secret.** `token_hash` appears in no column list, by construction, and
 *     `sensor_logs.raw_payload` does not either: it is the device's own JSON, it is large, and no
 *     dashboard cell needs it. `payload_hash` stays server-side for the same reason — a digest in a
 *     browser is a thing somebody will later mistake for a credential.
 *
 * Like the rest of `lib/field`, nothing here uses a PostgREST embed. Relationships are resolved as
 * explicit queries in code (see the note on `getDeviceForIngestion` for why), which also means each
 * hop is independently checkable in a test with a stubbed client.
 *
 * The limitation worth stating rather than discovering later: `sensor_logs`, `device_alerts` and
 * `alert_rules` carry no `cooperative_id`, so their scope is one hop away through
 * `hardware_nodes` (two, for site-scoped rules). This module closes that hop by reading the scoped
 * node ids first and filtering by them — exact up to `SCOPE_NODE_CAP` devices per caller, and
 * explicitly partial beyond it. The permanent fix is a security-defined view or an RPC in the
 * migration pack: a reviewed addition, applied by a human, not something a dashboard branch
 * assumes and not something to slip in quietly.
 */

/**
 * How many node ids may enter an `.in()` filter, and so how many devices one caller's dashboard can
 * summarise exactly. 200 keeps the encoded list inside a normal request URL and well past what one
 * cooperative operates today; above it the response is marked partial rather than being short by
 * accident.
 */
export const SCOPE_NODE_CAP = 200;

/** Rows scanned when finding the newest observation per node. Ordered newest-first, so this is the freshest window. */
export const OBSERVATION_SCAN_CAP = 500;

/** `device_alerts.status` values that mean "a condition somebody still holds" — the brief's "unresolved". */
export const UNRESOLVED_ALERT_STATUSES = ['open', 'acknowledged'] as const;

/** The full vocabularies, declared here because a route must be able to refuse anything outside them. */
export const ALERT_STATUSES = ['open', 'acknowledged', 'resolved', 'dismissed'] as const;
export const ALERT_SEVERITIES = ['info', 'warning', 'critical'] as const;

const SITE_COLUMNS = 'field_site_id,cooperative_id,name,crop,area_hectares,location_key';

/**
 * The reading columns every bounded history read selects, in one place.
 *
 * Exported for the same reason `NODE_COLUMNS` is: a second column list is a second truth, and the
 * one that drifts is the one that eventually asks for `raw_payload` or `payload_hash` in a response.
 * Neither appears here, by construction.
 */
export const READING_COLUMNS = 'log_id,node_id,measured_at,received_at,time_source,soil_moisture_pct,ambient_temp_c,humidity_pct,battery_voltage_v';

/**
 * The alert and rule columns the dashboard reads, exported for the same reason as the node and
 * reading lists: `alertService.ts` writes rows in these tables and must be able to read back exactly
 * what the dashboard will show, from one column list rather than a second one that can drift.
 *
 * `detail` is in the list because it is the evidence an alert is judged on — the metric, the
 * observed value, the threshold. It is not a dump: the evaluator builds it from named numeric keys,
 * and `device_alert_detail_is_an_object` is what keeps it an object.
 */
export const ALERT_COLUMNS = 'alert_id,node_id,alert_rule_id,alert_type,severity,status,first_raised_at,last_observed_at,resolved_at,detail';
export const RULE_COLUMNS = 'rule_id,name,cooperative_id,field_site_id,metric,comparator,threshold_value,threshold_units,severity,status';

/* ------------------------------------------------------------------------------------------
 * What the dashboard is allowed to see
 * ---------------------------------------------------------------------------------------- */

export interface SensorReadingRow {
  log_id: number;
  node_id: string;
  /** When the field measured it. Never the page-load time — that inversion is the failure this whole module exists to avoid. */
  measured_at: string;
  received_at: string;
  time_source: ReadingTimeSource;
  soil_moisture_pct: number | null;
  ambient_temp_c: number | null;
  humidity_pct: number | null;
  battery_voltage_v: number | null;
}

export interface FieldSiteRow {
  field_site_id: number;
  cooperative_id: number;
  name: string;
  crop: string | null;
  area_hectares: number | null;
  location_key: string | null;
}

/**
 * The reference place a site's `location_key` points at.
 *
 * Descriptive only. A `field_sites` row has no coordinates of its own, so this is the place an
 * operator attached, not the position of the field — which is why the map plots devices and uses
 * this for wording, never for geometry.
 */
export interface SitePlace {
  location_key: string;
  name: string;
  admin1: string | null;
  admin2: string | null;
}

export interface SiteSummaryRow extends FieldSiteRow {
  place: SitePlace | null;
  device_count: number;
  devices_by_status: Record<NodeStatus, number>;
  /** Newest `last_seen_at` among this site's devices: authenticated contact, which is not a measurement. */
  last_seen_at: string | null;
  last_observed_at: string | null;
  /** The reading behind `last_observed_at`, so a list row can show a value with its unit rather than a bare timestamp. */
  last_observation: SensorReadingRow | null;
  coverage: 'complete' | 'partial';
}

export interface DeviceAlertRow {
  alert_id: number;
  node_id: string;
  alert_rule_id: number | null;
  /** A stable rendering key, never a sentence — the five locale dictionaries supply the wording. */
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  first_raised_at: string;
  last_observed_at: string;
  resolved_at: string | null;
  /** The numbers behind the claim (metric, observed value, unit, threshold). Rendered key by key, never dumped. */
  detail: Record<string, unknown> | null;
  /** Filled from the scoped node scan: `device_alerts` has no site column of its own. */
  site_id: number | null;
  device_name: string | null;
}

export interface AlertRuleRow {
  rule_id: number;
  name: string;
  cooperative_id: number | null;
  field_site_id: number | null;
  metric: 'soil_moisture' | 'ambient_temp' | 'humidity' | 'battery_voltage' | 'offline' | 'reading_change';
  comparator: 'lt' | 'gt';
  threshold_value: number | null;
  threshold_units: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'enabled' | 'disabled';
  /** Which relationship put the rule in this caller's scope. An operator reading the list needs to know whose rule it is. */
  scope_origin: 'cooperative' | 'field_site' | 'platform';
}

export interface MapPosition {
  node_id: string;
  name: string;
  latitude: number;
  longitude: number;
  coordinate_source: CoordinateSource | null;
  status: NodeStatus;
  last_seen_at: string | null;
  field_site_id: number | null;
}

/* ------------------------------------------------------------------------------------------
 * Pure derivations — what `npm run test:fieldintel` executes without a database
 * ---------------------------------------------------------------------------------------- */

export function emptyStatusCounts(): Record<NodeStatus, number> {
  const counts = {} as Record<NodeStatus, number>;
  for (const status of ALL_STATUSES) counts[status] = 0;
  return counts;
}

/**
 * `hardware_nodes.status` is NOT NULL with a CHECK over exactly `ALL_STATUSES`, so the sum of the
 * four buckets IS the device total. Deriving it that way instead of issuing a fifth count query
 * buys a consistency the tests can assert: a total that disagrees with its own buckets becomes
 * impossible rather than merely unlikely.
 */
export function totalFromStatusCounts(counts: Record<NodeStatus, number>): number {
  return ALL_STATUSES.reduce((sum, status) => sum + counts[status], 0);
}

/**
 * The newest row per node out of a newest-first scan.
 *
 * A node absent from `rows` is absent from the map, and the caller must consult `truncated` before
 * reading that absence as "has no observations": with the scan capped, an older reading can sit
 * outside the window. That distinction is the difference between an honest empty state and an
 * invented one, which is why the flag travels with the map rather than being reimplemented at
 * each call site.
 */
export function newestObservationPerNode(rows: SensorReadingRow[]): { byNode: Map<string, SensorReadingRow>; truncated: boolean } {
  const byNode = new Map<string, SensorReadingRow>();
  for (const row of rows) {
    if (!byNode.has(row.node_id)) byNode.set(row.node_id, row);
  }
  return { byNode, truncated: rows.length >= OBSERVATION_SCAN_CAP };
}

/** Seconds between an observation and `now`; null when there is nothing to age. Never a guessed 0. */
export function ageSecondsOf(iso: string | null | undefined, now: number = Date.now()): number | null {
  const at = parseObservedAt(iso);
  if (at === null) return null;
  return Math.max(0, (now - at) / 1000);
}

/**
 * The operator's own definition of "offline", in minutes, or null when nobody configured one.
 *
 * There is no platform-wide offline threshold in this schema, and inventing one would be exactly
 * the silent opinion the brief forbids. An enabled `offline` rule is the only number here that
 * means something, because a human chose it; the smallest window wins, since that is the one that
 * would fire first.
 *
 * The parameter is structural rather than `AlertRuleRow[]` so the evaluator's rule shape — the same
 * columns, no scope label — answers the same question, instead of a second copy of this function
 * drifting away from the first.
 */
export function offlineWindowMinutes(rules: ReadonlyArray<Pick<AlertRuleRow, 'metric' | 'status' | 'threshold_value'>>): number | null {
  const windows = rules
    .filter((rule) => rule.metric === 'offline' && rule.status === 'enabled' && rule.threshold_value !== null)
    .map((rule) => Number(rule.threshold_value));
  if (windows.length === 0) return null;
  return Math.min(...windows);
}

/**
 * PostgREST renders `numeric` as a JSON number but has been seen to hand a `bigint` back as a
 * string, and a NULL `numeric` is NULL. Normalising here keeps every later comparison (`===`, `<`,
 * `Math.min`) honest. Unparseable text becomes null, which the UI must render as `—`, never as 0.
 */
export function numberFrom(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * `alert_rule_targets_one_scope` allows at most one of the two scope columns, so this reads as the
 * schema does: a site rule, else a cooperative rule, else a platform-wide one.
 */
export function ruleScopeOrigin(rule: { cooperative_id: number | null; field_site_id: number | null }): AlertRuleRow['scope_origin'] {
  if (rule.field_site_id !== null) return 'field_site';
  if (rule.cooperative_id !== null) return 'cooperative';
  return 'platform';
}

export type ReadingWindow = { from: string | null; to: string | null };

/**
 * The shape a bound must have before it is parsed: a calendar date, optionally with a time and an
 * offset. `Date.parse` alone is not a validator — it accepts `11/02/2026` as 2 February or
 * 11 November depending on the runtime's locale defaults, and a date filter whose day and month
 * were swapped by a parser is a chart of the wrong week that looks exactly like a chart of the
 * right one.
 */
const ISO_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Validates the optional `from` / `to` of a readings request.
 *
 * A bound that parses is normalised to a UTC instant before it reaches the `timestamptz`
 * comparison, so the filter means the same thing whoever's browser typed it and whatever this
 * server's clock is set to; a bare date is the start of that UTC day, which is the reading the
 * spec gives it. A value that does not parse or does not look like ISO-8601 is refused rather than
 * ignored: a chart whose date filter was silently dropped shows a different week than the one the
 * operator asked for, and looks exactly the same doing it.
 */
export function parseReadingWindow(rawFrom: string | null, rawTo: string | null): { ok: true; value: ReadingWindow } | { ok: false; error: IngestFailure } {
  const bounds: Array<{ label: 'from' | 'to'; raw: string | null }> = [
    { label: 'from', raw: rawFrom },
    { label: 'to', raw: rawTo },
  ];
  const parsed: Record<'from' | 'to', string | null> = { from: null, to: null };

  for (const { label, raw } of bounds) {
    if (raw === null || raw.trim() === '') continue;
    const trimmed = raw.trim();
    const message = `"${label}" must be an ISO-8601 date or timestamp, for example 2026-11-01 or 2026-11-01T07:30:00Z.`;
    if (!ISO_INSTANT_PATTERN.test(trimmed)) {
      return { ok: false, error: { code: 'invalid_payload', message } };
    }
    const at = Date.parse(trimmed);
    if (Number.isNaN(at)) {
      return { ok: false, error: { code: 'invalid_payload', message } };
    }
    parsed[label] = new Date(at).toISOString();
  }

  if (parsed.from !== null && parsed.to !== null && Date.parse(parsed.from) > Date.parse(parsed.to)) {
    return { ok: false, error: { code: 'invalid_payload', message: '"from" must not be after "to".' } };
  }
  return { ok: true, value: parsed };
}

/* ------------------------------------------------------------------------------------------
 * Scoped hops — the two relationships the dashboard needs
 * ---------------------------------------------------------------------------------------- */

interface ScopedNodes {
  nodes: HardwareNodeRow[];
  truncated: boolean;
}

/**
 * The devices inside a scope, in one bounded query.
 *
 * Three sections need this same hop (overview, alerts, map), and issuing it three times per page
 * load is the duplicate-request pattern the brief names, so routes call the functions below rather
 * than reaching for the nodes themselves.
 *
 * Exported for the history and data-quality services: they need the identical hop, and a second
 * copy of it would be a second cap and a second truncation flag to keep honest. The `truncated`
 * field is the reason the flag travels at all — callers must report an absence as an absence only
 * when the scan was capable of seeing it.
 */
export async function scopedNodes(cooperativeScope: number[]): Promise<ManagementDb<ScopedNodes>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;
  if (cooperativeScope.length === 0) return { ok: true, value: { nodes: [], truncated: false } };

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('hardware_nodes')
      // `node_id` ascending for the same reason the device list does it: a scan whose order can tie
      // repeats or skips rows between calls, and a truncated scan is only interpretable if it is
      // deterministic.
      .select(NODE_COLUMNS)
      .in('cooperative_id', cooperativeScope)
      .order('node_id', { ascending: true })
      .range(0, SCOPE_NODE_CAP);

    if (error) return { ok: false, error: databaseUnavailable('scoped devices', error.message) };
    const nodes = (data ?? []) as HardwareNodeRow[];
    return { ok: true, value: { nodes, truncated: nodes.length >= SCOPE_NODE_CAP } };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('scoped devices', messageOf(err)) };
  }
}

/** The sites inside a scope, bounded the same way, for the two hops that need site names. */
async function scopedSites(cooperativeScope: number[]): Promise<ManagementDb<{ sites: FieldSiteRow[]; truncated: boolean }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;
  if (cooperativeScope.length === 0) return { ok: true, value: { sites: [], truncated: false } };

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('field_sites')
      .select(SITE_COLUMNS)
      .in('cooperative_id', cooperativeScope)
      .order('field_site_id', { ascending: true })
      .range(0, SCOPE_NODE_CAP);

    if (error) return { ok: false, error: databaseUnavailable('scoped field sites', error.message) };
    const sites = (data ?? []).map(normalizeSite) as FieldSiteRow[];
    return { ok: true, value: { sites, truncated: sites.length >= SCOPE_NODE_CAP } };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('scoped field sites', messageOf(err)) };
  }
}

function normalizeSite(row: Record<string, unknown>): FieldSiteRow {
  return {
    field_site_id: Number(row.field_site_id),
    cooperative_id: Number(row.cooperative_id),
    name: String(row.name),
    crop: typeof row.crop === 'string' ? row.crop : null,
    area_hectares: numberFrom(row.area_hectares),
    location_key: typeof row.location_key === 'string' ? row.location_key : null,
  };
}

/**
 * The row → reading mapping, exported for the history service.
 *
 * A second mapper is a second answer to "what is a stored reading": one would eventually stop
 * normalising a `bigint` handed back as a string, and a chart whose values are strings averages
 * nothing while looking entirely healthy.
 */
export function normalizeReading(row: Record<string, unknown>): SensorReadingRow {
  return {
    log_id: Number(row.log_id),
    node_id: String(row.node_id),
    measured_at: String(row.measured_at),
    received_at: String(row.received_at),
    time_source: row.time_source === 'device' ? 'device' : 'server',
    soil_moisture_pct: numberFrom(row.soil_moisture_pct),
    ambient_temp_c: numberFrom(row.ambient_temp_c),
    humidity_pct: numberFrom(row.humidity_pct),
    battery_voltage_v: numberFrom(row.battery_voltage_v),
  };
}

/* ------------------------------------------------------------------------------------------
 * Overview
 * ---------------------------------------------------------------------------------------- */

export interface FieldOverview {
  devices: {
    total: number;
    by_status: Record<NodeStatus, number>;
    /** Devices that have never completed an authenticated submission. A separate fact from `status`. */
    never_seen: number;
    /** Not a status: `hardware_nodes.status` has no `offline` value, so this is a heartbeat question, answered from `last_seen_at`. */
    heartbeat: { newest_last_seen_at: string | null; age_seconds: number | null };
    coverage: 'complete' | 'partial';
  };
  field_sites: { total: number };
  alerts: { unresolved: number; coverage: 'complete' | 'partial' };
  observations: {
    total: number;
    newest_measured_at: string | null;
    newest_received_at: string | null;
    /** Age of the newest measurement, aged against that measurement's own timestamp. */
    age_seconds: number | null;
    coverage: 'complete' | 'partial';
  };
  /** The offline window an operator configured, in minutes; null when none is configured. */
  configured_offline_window_minutes: number | null;
  cooperatives: Array<{ cooperative_id: number; name: string }>;
}

export type Counted = { count: number | null; error: { message: string } | null };

/** One `count: 'exact'` head query, with the database-failure answer spelled out once. */
export async function exactCount(label: string, run: () => PromiseLike<Counted>): Promise<ManagementDb<number>> {
  const { count, error } = await run();
  if (error) return { ok: false, error: databaseUnavailable(label, error.message) };
  return { ok: true, value: Number(count ?? 0) };
}

/**
 * The headline figures, each from its own exact count query over the caller's scope.
 *
 * Note what is *not* here: no figure is computed by fetching rows and counting them in JavaScript,
 * because that would inherit the scan caps and then present a partial scan as a total. Counts come
 * from the database; only the heartbeat timestamp and the newest observation, which are single
 * values, are read as rows — and both say so when the scan underneath them was capped.
 */
export async function fieldOverview(cooperativeScope: number[], now: number = Date.now()): Promise<ManagementDb<FieldOverview>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  if (cooperativeScope.length === 0) {
    return {
      ok: true,
      value: {
        devices: { total: 0, by_status: emptyStatusCounts(), never_seen: 0, heartbeat: { newest_last_seen_at: null, age_seconds: null }, coverage: 'complete' },
        field_sites: { total: 0 },
        alerts: { unresolved: 0, coverage: 'complete' },
        observations: { total: 0, newest_measured_at: null, newest_received_at: null, age_seconds: null, coverage: 'complete' },
        configured_offline_window_minutes: null,
        cooperatives: [],
      },
    };
  }

  try {
    const client = getSyncClient();

    const statusCounts = await Promise.all(
      ALL_STATUSES.map((status) =>
        exactCount(`device count (${status})`, () =>
          client
            .schema('field')
            .from('hardware_nodes')
            .select('node_id', { count: 'exact', head: true })
            .in('cooperative_id', cooperativeScope)
            .eq('status', status),
        ),
      ),
    );
    const failedStatus = statusCounts.find((result) => !result.ok);
    if (failedStatus && !failedStatus.ok) return failedStatus;

    const [sites, neverSeen, nodesFirst] = await Promise.all([
      exactCount('field site count', () =>
        client.schema('field').from('field_sites').select('field_site_id', { count: 'exact', head: true }).in('cooperative_id', cooperativeScope),
      ),
      exactCount('never-seen device count', () =>
        client
          .schema('field')
          .from('hardware_nodes')
          .select('node_id', { count: 'exact', head: true })
          .in('cooperative_id', cooperativeScope)
          .is('last_seen_at', null),
      ),
      scopedNodes(cooperativeScope),
    ]);
    if (!sites.ok) return sites;
    if (!neverSeen.ok) return neverSeen;
    if (!nodesFirst.ok) return nodesFirst;

    const nodeIds = nodesFirst.value.nodes.map((node) => node.node_id);
    const coverage: 'complete' | 'partial' = nodesFirst.value.truncated ? 'partial' : 'complete';

    const [observationsTotal, newestMeasured, newestReceived, alerts, cooperatives] = await Promise.all([
      nodeIds.length === 0
        ? Promise.resolve<ManagementDb<number>>({ ok: true, value: 0 })
        : exactCount('reading count', () =>
            client.schema('field').from('sensor_logs').select('log_id', { count: 'exact', head: true }).in('node_id', nodeIds),
          ),
      newestReading(client, nodeIds, 'measured_at'),
      newestReading(client, nodeIds, 'received_at'),
      unresolvedAlerts(client, nodeIds, coverage),
      client.schema('field').from('cooperatives').select('cooperative_id,name').in('cooperative_id', cooperativeScope),
    ]);

    if (!observationsTotal.ok) return observationsTotal;
    if (!newestMeasured.ok) return newestMeasured;
    if (!newestReceived.ok) return newestReceived;
    if (!alerts.ok) return alerts;
    if (cooperatives.error) return { ok: false, error: databaseUnavailable('cooperative names', cooperatives.error.message) };

    const byStatus = emptyStatusCounts();
    ALL_STATUSES.forEach((status, index) => {
      const counted = statusCounts[index];
      byStatus[status] = counted.ok ? counted.value : 0;
    });

    const heartbeats = nodesFirst.value.nodes
      .map((node) => node.last_seen_at)
      .filter((value): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value)));
    const newestHeartbeat = heartbeats.length === 0 ? null : heartbeats.reduce((latest, iso) => (Date.parse(iso) > Date.parse(latest) ? iso : latest));

    const rules = await alertRulesInScope(cooperativeScope);

    return {
      ok: true,
      value: {
        devices: {
          total: totalFromStatusCounts(byStatus),
          by_status: byStatus,
          never_seen: neverSeen.value,
          heartbeat: { newest_last_seen_at: newestHeartbeat, age_seconds: ageSecondsOf(newestHeartbeat, now) },
          coverage,
        },
        field_sites: { total: sites.value },
        alerts: { unresolved: alerts.value.unresolved, coverage: alerts.value.coverage },
        observations: {
          total: observationsTotal.value,
          newest_measured_at: newestMeasured.value?.measured_at ?? null,
          newest_received_at: newestReceived.value?.received_at ?? null,
          age_seconds: ageSecondsOf(newestMeasured.value?.measured_at ?? null, now),
          coverage,
        },
        configured_offline_window_minutes: rules.ok ? offlineWindowMinutes(rules.value.rules) : null,
        cooperatives: ((cooperatives.data ?? []) as Array<{ cooperative_id: number | string; name: string }>).map((row) => ({
          cooperative_id: Number(row.cooperative_id),
          name: row.name,
        })),
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('field overview', messageOf(err)) };
  }
}

/**
 * The single newest value of one time column, as a two-column row.
 *
 * Two queries rather than one, because "the newest measurement" and "the newest submission" are
 * different facts when a device backfills: firmware may report last night's reading this morning,
 * and an operator watching data freshness needs to see both times rather than a blended one.
 * `limit(1)` on `sensor_log_node_time_idx` / `sensor_log_node_received_idx` makes each an index
 * lookup, not a scan.
 */
async function newestReading(client: ReturnType<typeof getSyncClient>, nodeIds: string[], column: 'measured_at' | 'received_at'): Promise<ManagementDb<{ measured_at: string; received_at: string } | null>> {
  if (nodeIds.length === 0) return { ok: true, value: null };
  try {
    const { data, error } = await client
      .schema('field')
      .from('sensor_logs')
      .select('measured_at,received_at')
      .in('node_id', nodeIds)
      .order(column, { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { ok: false, error: databaseUnavailable(`newest ${column}`, error.message) };
    if (!data) return { ok: true, value: null };
    return { ok: true, value: { measured_at: String(data.measured_at), received_at: String(data.received_at) } };
  } catch (err) {
    return { ok: false, error: databaseUnavailable(`newest ${column}`, messageOf(err)) };
  }
}

async function unresolvedAlerts(client: ReturnType<typeof getSyncClient>, nodeIds: string[], coverage: 'complete' | 'partial'): Promise<ManagementDb<{ unresolved: number; coverage: 'complete' | 'partial' }>> {
  if (nodeIds.length === 0) return { ok: true, value: { unresolved: 0, coverage } };
  const counted = await exactCount('unresolved alert count', () =>
    client
      .schema('field')
      .from('device_alerts')
      .select('alert_id', { count: 'exact', head: true })
      .in('node_id', nodeIds)
      .in('status', [...UNRESOLVED_ALERT_STATUSES]),
  );
  if (!counted.ok) return counted;
  return { ok: true, value: { unresolved: counted.value, coverage } };
}

/* ------------------------------------------------------------------------------------------
 * Field monitoring
 * ---------------------------------------------------------------------------------------- */

export interface SitesPage {
  sites: SiteSummaryRow[];
  total: number;
  page: { limit: number; offset: number };
}

/**
 * One page of sites, each with its device counts and its newest observation.
 *
 * Four queries for the whole page rather than four per site: the page's sites, their devices, the
 * newest readings across those devices, and the reference places their keys point at. Per-site
 * loops are the pattern that turns a 20-site page into eighty requests, and at the sizes this
 * module runs at the difference is invisible — which is exactly why it goes uncorrected unless the
 * rule is written down.
 *
 * `device_count` is derived from the capped device scan, so a site at the cap reports
 * `coverage: 'partial'`; the UI must then present the count as a floor, not a total.
 */
export async function fieldSites(cooperativeScope: number[], options: { limit: number; offset: number }): Promise<ManagementDb<SitesPage>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  if (cooperativeScope.length === 0) {
    return { ok: true, value: { sites: [], total: 0, page: { limit: options.limit, offset: options.offset } } };
  }

  try {
    const client = getSyncClient();
    const [rowsQuery, counted] = await Promise.all([
      client
        .schema('field')
        .from('field_sites')
        .select(SITE_COLUMNS)
        .in('cooperative_id', cooperativeScope)
        .order('field_site_id', { ascending: true })
        .range(options.offset, options.offset + options.limit - 1),
      client
        .schema('field')
        .from('field_sites')
        .select('field_site_id', { count: 'exact', head: true })
        .in('cooperative_id', cooperativeScope),
    ]);

    if (rowsQuery.error) return { ok: false, error: databaseUnavailable('field sites', rowsQuery.error.message) };
    if (counted.error) return { ok: false, error: databaseUnavailable('field site count', counted.error.message) };

    const sites = ((rowsQuery.data ?? []) as Array<Record<string, unknown>>).map(normalizeSite);
    const siteIds = sites.map((site) => site.field_site_id);

    const devices = await devicesForSites(siteIds);
    if (!devices.ok) return devices;

    const nodeIds = devices.value.nodes.map((node) => node.node_id);
    const readings = await newestReadingsFor(client, nodeIds);
    if (!readings.ok) return readings;

    const places = await placesFor(client, sites.map((site) => site.location_key).filter((key): key is string => key !== null));
    if (!places.ok) return places;

    const coverage = devices.value.truncated || readings.value.truncated ? 'partial' : 'complete';

    return {
      ok: true,
      value: {
        sites: sites.map((site) => summarizeSite(site, devices.value.nodes, readings.value.byNode, places.value, coverage)),
        total: Number(counted.count ?? 0),
        page: { limit: options.limit, offset: options.offset },
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('field sites', messageOf(err)) };
  }
}

async function devicesForSites(siteIds: number[]): Promise<ManagementDb<{ nodes: HardwareNodeRow[]; truncated: boolean }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;
  if (siteIds.length === 0) return { ok: true, value: { nodes: [], truncated: false } };

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('hardware_nodes')
      .select(NODE_COLUMNS)
      .in('field_site_id', siteIds)
      .order('node_id', { ascending: true })
      .range(0, SCOPE_NODE_CAP);

    if (error) return { ok: false, error: databaseUnavailable('site devices', error.message) };
    const nodes = (data ?? []) as HardwareNodeRow[];
    return { ok: true, value: { nodes, truncated: nodes.length >= SCOPE_NODE_CAP } };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('site devices', messageOf(err)) };
  }
}

/**
 * The newest stored reading per node, one capped scan.
 *
 * Deliberately *not* taken from `last_seen_at`: that column is the receipt time of the last
 * authenticated contact, stamped by the server, while `measured_at` is the instant the field
 * actually held the value. A dashboard that showed one as the other would be the brief's
 * "stale data presented as live" in a column that already exists.
 *
 * Exported because the fleet data-quality report needs exactly this hop and must inherit its cap:
 * a second scan with a second cap is how one section of a dashboard starts reporting a different
 * device total than another section inside the same page load.
 */
export async function newestReadingsFor(client: ReturnType<typeof getSyncClient>, nodeIds: string[]): Promise<ManagementDb<{ byNode: Map<string, SensorReadingRow>; truncated: boolean }>> {
  if (nodeIds.length === 0) return { ok: true, value: { byNode: new Map<string, SensorReadingRow>(), truncated: false } };

  const { data, error } = await client
    .schema('field')
    .from('sensor_logs')
    .select(READING_COLUMNS)
    .in('node_id', nodeIds)
    .order('measured_at', { ascending: false })
    .range(0, OBSERVATION_SCAN_CAP - 1);

  if (error) return { ok: false, error: databaseUnavailable('latest observations', error.message) };
  const rows = ((data ?? []) as Array<Record<string, unknown>>).map(normalizeReading);
  return { ok: true, value: newestObservationPerNode(rows) };
}

async function placesFor(client: ReturnType<typeof getSyncClient>, locationKeys: string[]): Promise<ManagementDb<Map<string, SitePlace>>> {
  const byKey = new Map<string, SitePlace>();
  if (locationKeys.length === 0) return { ok: true, value: byKey };

  const { data, error } = await client
    .schema('data')
    .from('location')
    .select('location_key,name,admin1,admin2')
    .in('location_key', locationKeys);

  if (error) return { ok: false, error: databaseUnavailable('located places', error.message) };
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    byKey.set(String(row.location_key), {
      location_key: String(row.location_key),
      name: String(row.name),
      admin1: typeof row.admin1 === 'string' ? row.admin1 : null,
      admin2: typeof row.admin2 === 'string' ? row.admin2 : null,
    });
  }
  return { ok: true, value: byKey };
}

function summarizeSite(
  site: FieldSiteRow,
  nodes: HardwareNodeRow[],
  latest: Map<string, SensorReadingRow>,
  places: Map<string, SitePlace>,
  coverage: 'complete' | 'partial',
): SiteSummaryRow {
  const own = nodes.filter((node) => node.field_site_id === site.field_site_id);
  const byStatus = emptyStatusCounts();
  let newestSeen: string | null = null;
  let newestObservation: SensorReadingRow | null = null;

  for (const node of own) {
    byStatus[node.status] += 1;
    if (typeof node.last_seen_at === 'string' && (newestSeen === null || Date.parse(node.last_seen_at) > Date.parse(newestSeen))) newestSeen = node.last_seen_at;

    const reading = latest.get(node.node_id);
    if (reading && (newestObservation === null || Date.parse(reading.measured_at) > Date.parse(newestObservation.measured_at))) newestObservation = reading;
  }

  return {
    ...site,
    place: site.location_key === null ? null : places.get(site.location_key) ?? null,
    device_count: own.length,
    devices_by_status: byStatus,
    last_seen_at: newestSeen,
    last_observed_at: newestObservation?.measured_at ?? null,
    last_observation: newestObservation,
    coverage,
  };
}

/**
 * One site the caller may see, with its devices.
 *
 * Ownership is re-read from the database and checked against the scope *here*, not only at the
 * route, and an out-of-scope id is answered with the same `unknown_site` as a nonexistent one. A
 * detail view is where a tenant leak is easiest to introduce — the path parameter is a number, so
 * guessing one is trivial — therefore the check belongs next to the query that would leak.
 */
export async function siteDetail(cooperativeScope: number[], fieldSiteId: number): Promise<ManagementDb<{ site: SiteSummaryRow; devices: HardwareNodeRow[] }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  const notThere = { code: 'unknown_site', message: 'No field site with that id is available to this caller.' } as const;

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('field_sites')
      .select(SITE_COLUMNS)
      .eq('field_site_id', fieldSiteId)
      .maybeSingle();

    if (error) return { ok: false, error: databaseUnavailable('field site detail', error.message) };
    if (!data) return { ok: false, error: notThere };

    const site = normalizeSite(data as Record<string, unknown>);
    if (!cooperativeScope.includes(site.cooperative_id)) return { ok: false, error: notThere };

    const devices = await devicesForSites([site.field_site_id]);
    if (!devices.ok) return devices;

    const readings = await newestReadingsFor(client, devices.value.nodes.map((node) => node.node_id));
    if (!readings.ok) return readings;

    const places = await placesFor(client, site.location_key === null ? [] : [site.location_key]);
    if (!places.ok) return places;

    const coverage = devices.value.truncated || readings.value.truncated ? 'partial' : 'complete';
    return {
      ok: true,
      value: {
        site: summarizeSite(site, devices.value.nodes, readings.value.byNode, places.value, coverage),
        devices: devices.value.nodes,
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('field site detail', messageOf(err)) };
  }
}

/* ------------------------------------------------------------------------------------------
 * Sensor analytics
 * ---------------------------------------------------------------------------------------- */

export interface ReadingsPage {
  readings: SensorReadingRow[];
  total_in_range: number;
  page: { limit: number; offset: number };
  window: ReadingWindow;
}

/**
 * One page of a device's stored readings, newest first.
 *
 * **Authorization is the route's job and this function cannot perform it**: `sensor_logs` has no
 * `cooperative_id`, so the only way to scope the query is to have already established that this
 * `node_id` belongs to a cooperative in the caller's scope — which is precisely what
 * `loadAndAuthorize` answers. That is the same split Phase 4 uses for credential revocation, and it
 * is written here because a future caller who forgets it produces a cross-tenant history endpoint
 * that looks like it works.
 *
 * The chart on the other side of this route plots at most `limit` rows out of `total_in_range`, and
 * says so. Bucketing a year into daily means would be the alternative, and that is an aggregate the
 * database would have to compute — a view or RPC in the migration pack, reviewed and applied by a
 * person, not a mean taken over one page of samples in a browser.
 */
export async function readingsPage(
  nodeId: string,
  window: ReadingWindow,
  options: { limit: number; offset: number },
): Promise<ManagementDb<ReadingsPage>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    // Two builders carrying the SAME filters. A `total_in_range` from an unfiltered count is the
    // subtle kind of wrong: the page looks paginated, the note reads "showing 100 of 4", and
    // nobody can tell the chart is showing a window nobody asked for.
    let rowsBuilder = client.schema('field').from('sensor_logs').select(READING_COLUMNS).eq('node_id', nodeId);
    let countBuilder = client.schema('field').from('sensor_logs').select('log_id', { count: 'exact', head: true }).eq('node_id', nodeId);
    if (window.from !== null) {
      rowsBuilder = rowsBuilder.gte('measured_at', window.from);
      countBuilder = countBuilder.gte('measured_at', window.from);
    }
    if (window.to !== null) {
      rowsBuilder = rowsBuilder.lte('measured_at', window.to);
      countBuilder = countBuilder.lte('measured_at', window.to);
    }

    const [rowsQuery, counted] = await Promise.all([
      rowsBuilder
        .order('measured_at', { ascending: false })
        // `log_id` breaks a tie: two readings measured in the same millisecond would otherwise make
        // the page boundary non-deterministic, and a chart that repeats a point looks like a spike.
        .order('log_id', { ascending: false })
        .range(options.offset, options.offset + options.limit - 1),
      countBuilder,
    ]);

    if (rowsQuery.error) return { ok: false, error: databaseUnavailable('readings', rowsQuery.error.message) };
    if (counted.error) return { ok: false, error: databaseUnavailable('reading count', counted.error.message) };

    return {
      ok: true,
      value: {
        readings: ((rowsQuery.data ?? []) as Array<Record<string, unknown>>).map(normalizeReading),
        total_in_range: Number(counted.count ?? 0),
        page: { limit: options.limit, offset: options.offset },
        window,
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('readings', messageOf(err)) };
  }
}

/* ------------------------------------------------------------------------------------------
 * Alerts
 * ---------------------------------------------------------------------------------------- */

export interface AlertsPage {
  alerts: DeviceAlertRow[];
  total: number;
  page: { limit: number; offset: number };
  coverage: 'complete' | 'partial';
}

/**
 * Persisted alerts, newest activity first.
 *
 * Read-only by design, and that is the requirement rather than an omission: this module raises
 * nothing. An alert is a row `field.device_alerts` already holds, and the rules behind it are the
 * ones an operator wrote into `field.alert_rules`. No threshold in this file, and no evaluation in
 * a browser tab, because a number invented at render time is an agronomic opinion wearing our
 * interface.
 */
export async function alertsPage(
  cooperativeScope: number[],
  options: { status: string | null; severity: string | null; limit: number; offset: number },
): Promise<ManagementDb<AlertsPage>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  if (cooperativeScope.length === 0) {
    return { ok: true, value: { alerts: [], total: 0, page: { limit: options.limit, offset: options.offset }, coverage: 'complete' } };
  }

  const nodes = await scopedNodes(cooperativeScope);
  if (!nodes.ok) return nodes;
  const nodeIds = nodes.value.nodes.map((node) => node.node_id);
  const coverage: 'complete' | 'partial' = nodes.value.truncated ? 'partial' : 'complete';

  if (nodeIds.length === 0) {
    return { ok: true, value: { alerts: [], total: 0, page: { limit: options.limit, offset: options.offset }, coverage } };
  }

  try {
    const client = getSyncClient();
    // The count and the page must carry identical filters, for the reason given on `readingsPage`:
    // a total from an unfiltered count makes the footer say something the list does not contain.
    let rowsBuilder = client.schema('field').from('device_alerts').select(ALERT_COLUMNS).in('node_id', nodeIds);
    let countBuilder = client.schema('field').from('device_alerts').select('alert_id', { count: 'exact', head: true }).in('node_id', nodeIds);
    if (options.status !== null) {
      rowsBuilder = rowsBuilder.eq('status', options.status);
      countBuilder = countBuilder.eq('status', options.status);
    }
    if (options.severity !== null) {
      rowsBuilder = rowsBuilder.eq('severity', options.severity);
      countBuilder = countBuilder.eq('severity', options.severity);
    }

    const [rowsQuery, counted] = await Promise.all([
      rowsBuilder
        .order('last_observed_at', { ascending: false })
        .order('alert_id', { ascending: false })
        .range(options.offset, options.offset + options.limit - 1),
      countBuilder,
    ]);

    if (rowsQuery.error) return { ok: false, error: databaseUnavailable('alerts', rowsQuery.error.message) };
    if (counted.error) return { ok: false, error: databaseUnavailable('alert count', counted.error.message) };

    const byNode = new Map(nodes.value.nodes.map((node) => [node.node_id, node]));
    const alerts = ((rowsQuery.data ?? []) as Array<Record<string, unknown>>).map((row) => {
      const node = byNode.get(String(row.node_id));
      return {
        alert_id: Number(row.alert_id),
        node_id: String(row.node_id),
        alert_rule_id: row.alert_rule_id === null || row.alert_rule_id === undefined ? null : Number(row.alert_rule_id),
        alert_type: String(row.alert_type),
        severity: row.severity as DeviceAlertRow['severity'],
        status: row.status as DeviceAlertRow['status'],
        first_raised_at: String(row.first_raised_at),
        last_observed_at: String(row.last_observed_at),
        resolved_at: typeof row.resolved_at === 'string' ? row.resolved_at : null,
        detail: row.detail && typeof row.detail === 'object' ? (row.detail as Record<string, unknown>) : null,
        site_id: node?.field_site_id ?? null,
        device_name: node?.name ?? null,
      } satisfies DeviceAlertRow;
    });

    return { ok: true, value: { alerts, total: Number(counted.count ?? 0), page: { limit: options.limit, offset: options.offset }, coverage } };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('alerts', messageOf(err)) };
  }
}

export interface RulesList {
  rules: AlertRuleRow[];
  coverage: 'complete' | 'partial';
}

/**
 * The rules an operator configured that apply to this caller, in three bounded queries.
 *
 * `alert_rules` can be scoped three ways — by cooperative, by field site, or platform-wide (both
 * columns NULL) — and `alert_rule_targets_one_scope` means a row carries at most one of them.
 * Reading only the cooperative column would therefore hide a cooperative's own site rules, which
 * is the failure mode where an operator cannot work out why an alert exists; the three sets are
 * fetched apart so each can be labelled with the relationship that brought it into scope.
 *
 * A rule that matches nothing here is reported by `coverage`, never assumed absent.
 */
export async function alertRulesInScope(cooperativeScope: number[]): Promise<ManagementDb<RulesList>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  if (cooperativeScope.length === 0) return { ok: true, value: { rules: [], coverage: 'complete' } };

  try {
    const client = getSyncClient();
    const sites = await scopedSites(cooperativeScope);
    if (!sites.ok) return sites;
    const siteIds = sites.value.sites.map((site) => site.field_site_id);

    const [byCooperative, byPlatform, bySite] = await Promise.all([
      client.schema('field').from('alert_rules').select(RULE_COLUMNS).in('cooperative_id', cooperativeScope),
      client.schema('field').from('alert_rules').select(RULE_COLUMNS).is('cooperative_id', null).is('field_site_id', null),
      siteIds.length === 0
        ? Promise.resolve<{ data: unknown[] | null; error: null }>({ data: null, error: null })
        : client.schema('field').from('alert_rules').select(RULE_COLUMNS).in('field_site_id', siteIds),
    ]);

    if (byCooperative.error) return { ok: false, error: databaseUnavailable('alert rules', byCooperative.error.message) };
    if (byPlatform.error) return { ok: false, error: databaseUnavailable('platform alert rules', byPlatform.error.message) };
    if (bySite.error) return { ok: false, error: databaseUnavailable('site alert rules', bySite.error.message) };

    const byId = new Map<number, AlertRuleRow>();
    for (const row of [...(byCooperative.data ?? []), ...(byPlatform.data ?? []), ...(bySite.data ?? [])] as Array<Record<string, unknown>>) {
      const rule = normalizeRuleRow(row);
      byId.set(rule.rule_id, rule);
    }

    return {
      ok: true,
      value: {
        rules: [...byId.values()].sort((a, b) => a.rule_id - b.rule_id),
        coverage: sites.value.truncated ? 'partial' : 'complete',
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('alert rules', messageOf(err)) };
  }
}

/**
 * One `alert_rules` row as the code sees it.
 *
 * Shared by the scope listing above and the per-node fetch below, because a rule that normalises one
 * way for the dashboard and another way for the evaluator is a threshold read twice — and the
 * evaluator's comparison is only as good as the number it read.
 */
export function normalizeRuleRow(row: Record<string, unknown>): AlertRuleRow {
  const cooperativeId = numberFrom(row.cooperative_id);
  const siteId = numberFrom(row.field_site_id);
  const metric = row.metric as AlertRuleRow['metric'];
  return {
    rule_id: Number(row.rule_id),
    name: String(row.name),
    cooperative_id: cooperativeId,
    field_site_id: siteId,
    metric,
    comparator: row.comparator as AlertRuleRow['comparator'],
    threshold_value: numberFrom(row.threshold_value),
    // The column default is set by a CHECK that ties units to metric, so a missing value here means a
    // row this code did not read whole; the metric's own unit is the only honest fallback.
    threshold_units: typeof row.threshold_units === 'string' ? row.threshold_units : METRIC_UNITS[metric],
    severity: row.severity as AlertRuleRow['severity'],
    status: row.status as AlertRuleRow['status'],
    scope_origin: ruleScopeOrigin({ cooperative_id: cooperativeId, field_site_id: siteId }),
  };
}

/**
 * The rules that cover ONE device: its cooperative's, the platform's, and its own site's.
 *
 * This is the ingestion path's rule fetch, and it exists rather than reusing `alertRulesInScope`
 * because that function resolves a cooperative's whole site list first — four queries for a route
 * that has the device row in hand and needs exactly three bounded ones. Every authenticated reading
 * runs this, so the cost is stated plainly: three indexed selects on `alert_rules` per accepted
 * submission, none of them on `sensor_logs`.
 *
 * A device with no cooperative and no site still gets the platform rules, which is the correct
 * answer for an unassigned node and the reason the two optional branches are optional rather than
 * an early return.
 */
export async function rulesApplyingToNode(node: Pick<HardwareNodeRow, 'cooperative_id' | 'field_site_id'>): Promise<ManagementDb<AlertRuleRow[]>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    const [byCooperative, byPlatform, bySite] = await Promise.all([
      node.cooperative_id === null
        ? Promise.resolve<{ data: unknown[] | null; error: null }>({ data: null, error: null })
        : client.schema('field').from('alert_rules').select(RULE_COLUMNS).eq('cooperative_id', node.cooperative_id),
      client.schema('field').from('alert_rules').select(RULE_COLUMNS).is('cooperative_id', null).is('field_site_id', null),
      node.field_site_id === null
        ? Promise.resolve<{ data: unknown[] | null; error: null }>({ data: null, error: null })
        : client.schema('field').from('alert_rules').select(RULE_COLUMNS).eq('field_site_id', node.field_site_id),
    ]);

    if (byCooperative.error) return { ok: false, error: databaseUnavailable('device alert rules', byCooperative.error.message) };
    if (byPlatform.error) return { ok: false, error: databaseUnavailable('platform alert rules', byPlatform.error.message) };
    if (bySite.error) return { ok: false, error: databaseUnavailable('site alert rules', bySite.error.message) };

    const byId = new Map<number, AlertRuleRow>();
    for (const row of [...(byCooperative.data ?? []), ...(byPlatform.data ?? []), ...(bySite.data ?? [])] as Array<Record<string, unknown>>) {
      const rule = normalizeRuleRow(row);
      byId.set(rule.rule_id, rule);
    }

    return { ok: true, value: [...byId.values()].sort((a, b) => a.rule_id - b.rule_id) };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('device alert rules', messageOf(err)) };
  }
}

/* ------------------------------------------------------------------------------------------
 * Field map
 * ---------------------------------------------------------------------------------------- */

export interface PositionsResult {
  positions: MapPosition[];
  /** Devices with no coordinates stored. Reported as a count so "the map is empty" and "nothing has been surveyed" are different sentences. */
  without_coordinates: number;
  total_devices: number;
  coverage: 'complete' | 'partial';
}

/**
 * Where the devices are, from the coordinates the database holds.
 *
 * A device with no `latitude`/`longitude` is counted, not placed: the nearest town, the site's
 * reference place, the centroid of a cooperative — each is a position we would be making up, and a
 * fabricated pin on an agricultural map is how a wrong coordinate ends up in somebody's irrigation
 * decision. `coordinate_source` travels with every point for the same reason the schema keeps it:
 * a GNSS fix and an operator's guess are not the same kind of fact, and the map must not let them
 * look identical.
 */
export async function mapPositions(cooperativeScope: number[]): Promise<ManagementDb<PositionsResult>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  const nodes = await scopedNodes(cooperativeScope);
  if (!nodes.ok) return nodes;

  const positions: MapPosition[] = [];
  for (const node of nodes.value.nodes) {
    const latitude = numberFrom(node.latitude);
    const longitude = numberFrom(node.longitude);
    // `hardware_node_coordinates_are_paired` makes one half impossible, but a hand-edited row is
    // not a proof, and a plot at (0, null) is worse than no plot.
    if (latitude === null || longitude === null) continue;
    positions.push({
      node_id: node.node_id,
      name: node.name,
      latitude,
      longitude,
      coordinate_source: node.coordinate_source,
      status: node.status,
      last_seen_at: node.last_seen_at,
      field_site_id: node.field_site_id,
    });
  }

  return {
    ok: true,
    value: {
      positions,
      without_coordinates: nodes.value.nodes.length - positions.length,
      total_devices: nodes.value.nodes.length,
      coverage: nodes.value.truncated ? 'partial' : 'complete',
    },
  };
}

/**
 * The one place a thrown client error becomes a string.
 *
 * Exported because every service in `lib/field` hands it to `databaseUnavailable`, which folds the
 * detail into a server-side log line and returns a message-only failure: the text a driver produced
 * must not be reachable from a response, and two copies of that rule is two chances to get it wrong.
 */
export function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'unknown error';
}
