import { getSyncClient } from '@/lib/supabaseAdmin';

import { rulesForNode } from './alertEvaluation';
import { databaseUnavailable, fieldDatabaseStatus } from './deviceService';
import { resolveHistoryWindow, summarizeHistory } from './historyMath';
import { METRIC_COLUMN, METRIC_UNITS, SENSOR_METRICS, STORE_RANGES } from './metrics';
import { exactCount, messageOf, newestReadingsFor, normalizeReading, offlineWindowMinutes, READING_COLUMNS, scopedNodes } from './observationService';
import type { AlertRuleRow, SensorReadingRow } from './observationService';
import type { HistorySummary, HistoryWindow } from './historyMath';
import type { ManagementDb } from './managementService';
import type { HardwareNodeRow } from './types';

/**
 * Historical analytics and fleet data quality, from real bounded queries.
 *
 * The arithmetic lives in `historyMath.ts` and takes rows; this module is the part that obtains
 * them, and it is where the three promises the brief makes about history get paid:
 *
 *  1. **A total is a total, a scan is a scan.** Every headline count here is an exact
 *     `count: 'exact'` head query — readings in the window, devices in scope, devices that have
 *     never contacted the platform. The rows the statistics are computed from come from a *separate*
 *     capped scan, and `rows_scanned` travels beside every derived number so nothing computed from
 *     2 000 rows can be read as a statement about 40 000.
 *  2. **A truncated scan is re-scoped, never described.** Truncation is detected by comparing the
 *     scan against the exact count rather than against the page size, which also catches a
 *     PostgREST `db-max-rows` cap the project owner set and this code cannot see. When it happens
 *     the response switches to `scanned_from` / `scanned_window`: the span the numbers genuinely
 *     cover. A 30-day summary that silently describes 9 days is the failure this module exists to
 *     avoid, and it is invisible on screen because the chart still looks full.
 *  3. **A verdict needs a human's number.** "Stale" and "unexpected gap" are computed against an
 *     operator's `offline` rule and nothing else. Without one, the report returns measured ages,
 *     intervals and counts with `basis: 'not_configured'` and null verdicts, because deciding how
 *     long a farm's sensor may be silent is not this code's call.
 *
 * Nothing is interpolated and nothing is zero-filled: a metric a device never measured comes back
 * with `samples: 0` and null statistics, and a bucket nobody reported in holds null. The stored rows
 * behind every figure stay reachable through `/api/field/devices/[nodeId]/readings`.
 */

/**
 * Rows one history request may read.
 *
 * 2 000 is a payload that arrives in well under a second and more points than a chart can draw, but
 * it is still a number an operator can hit: a device reporting every 5 minutes over 30 days is
 * 8 640 rows. The honest fix is a bucketed SQL aggregate — a view or an RPC in the migration pack,
 * reviewed and applied by a person — and §11 of the brief forbids applying one here, so the client
 * gets the truth about the cap instead of a silently averaged fortnight.
 */
export const HISTORY_SCAN_CAP = 2000;

/** The same ceiling for the fleet scan, which spreads across every device in scope rather than one. */
export const FLEET_SCAN_CAP = 2000;

/* ------------------------------------------------------------------------------------------
 * One device's history
 * ---------------------------------------------------------------------------------------- */

export interface DeviceHistoryResult {
  /** The window the caller asked for, resolved to instants. */
  window: HistoryWindow;
  /** The window the numbers actually cover. Equal to `window` unless the scan was cut short. */
  scanned_window: HistoryWindow;
  /** Exact: readings stored for this device inside `window`. May exceed `rows_scanned`. */
  total_in_range: number;
  rows_scanned: number;
  scan_cap: number;
  coverage: 'complete' | 'partial';
  /** Exact, all time. Separates "no history in November" from "this device has never reported". */
  all_time_observations: number;
  /** The silence allowance for THIS device, from the rules that cover it; null when none exists. */
  offline_window_minutes: number | null;
  summary: HistorySummary;
}

/**
 * Everything the analytics panel plots for one device: per-metric statistics, reporting cadence,
 * data quality, and Addis-aligned buckets.
 *
 * **Authorization is the route's job.** Like `readingsPage`, this scopes by `node_id` alone,
 * because `field.sensor_logs` has no cooperative column; the caller must already have established
 * through `loadAndAuthorize` that this device sits in their own scope. A route that skipped that
 * step would serve another farm's history and look identical while doing it.
 *
 * Three queries, run together: the exact count in the window, the exact all-time count, and the
 * capped newest-first scan. The count builder carries the same bounds as the scan, for the reason
 * spelled out on `readingsPage` — a total from an unfiltered count is a footer that contradicts its
 * own chart.
 */
export async function deviceHistory(
  node: Pick<HardwareNodeRow, 'node_id' | 'cooperative_id' | 'field_site_id'>,
  requested: { range: string | null; from: string | null; to: string | null },
  rules: AlertRuleRow[],
  now: number = Date.now(),
): Promise<ManagementDb<DeviceHistoryResult>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  const resolved = resolveHistoryWindow(requested, now);
  if (!resolved.ok) return { ok: false, error: { code: 'invalid_payload', message: resolved.message } };
  const window = resolved.value;

  try {
    const client = getSyncClient();
    const [counted, allTime, scanQuery] = await Promise.all([
      exactCount('history reading count', () =>
        client
          .schema('field')
          .from('sensor_logs')
          .select('log_id', { count: 'exact', head: true })
          .eq('node_id', node.node_id)
          .gte('measured_at', window.from)
          .lte('measured_at', window.to),
      ),
      exactCount('all-time reading count', () =>
        client.schema('field').from('sensor_logs').select('log_id', { count: 'exact', head: true }).eq('node_id', node.node_id),
      ),
      client
        .schema('field')
        .from('sensor_logs')
        .select(READING_COLUMNS)
        .eq('node_id', node.node_id)
        .gte('measured_at', window.from)
        .lte('measured_at', window.to)
        .order('measured_at', { ascending: false })
        .order('log_id', { ascending: false })
        .range(0, HISTORY_SCAN_CAP - 1),
    ]);

    if (!counted.ok) return counted;
    if (!allTime.ok) return allTime;
    if (scanQuery.error) return { ok: false, error: databaseUnavailable('device history', scanQuery.error.message) };

    const rows = ((scanQuery.data ?? []) as Array<Record<string, unknown>>).map(normalizeReading);
    const truncated = rows.length < counted.value;

    // A capped scan holds the newest rows, so the oldest row in it is the true floor of what these
    // numbers can speak about. Buckets are cut over that span rather than over the requested one,
    // which keeps every plotted bucket inside the data that backs it.
    let scannedWindow = window;
    if (truncated && rows.length > 0) {
      const times = rows.map((row) => Date.parse(row.measured_at)).filter((at) => Number.isFinite(at));
      if (times.length > 0) {
        const oldest = Math.min(...times);
        scannedWindow = { from: new Date(oldest).toISOString(), to: window.to, range: window.range, span_ms: Date.parse(window.to) - oldest };
      }
    }

    const offlineMinutes = offlineWindowMinutes(rulesForNode(rules, node));

    return {
      ok: true,
      value: {
        window,
        scanned_window: scannedWindow,
        total_in_range: counted.value,
        rows_scanned: rows.length,
        scan_cap: HISTORY_SCAN_CAP,
        coverage: truncated ? 'partial' : 'complete',
        all_time_observations: allTime.value,
        offline_window_minutes: offlineMinutes,
        summary: summarizeHistory(rows, scannedWindow, now, offlineMinutes),
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('device history', messageOf(err)) };
  }
}

/* ------------------------------------------------------------------------------------------
 * Fleet-wide data quality
 * ---------------------------------------------------------------------------------------- */

/**
 * Whether this device has stored readings, and how confidently we can say so.
 *
 * `unknown_scan_truncated` exists because a capped scan cannot prove an absence, and "this device
 * has never reported" is the kind of sentence a farm acts on — a device sent back to the field, or
 * written off, on the strength of a page limit.
 */
export type ObservationState = 'has_observations' | 'none_recorded' | 'never_contacted' | 'unknown_scan_truncated';

export interface FleetDeviceQuality {
  node_id: string;
  name: string;
  status: HardwareNodeRow['status'];
  field_site_id: number | null;
  /** Authenticated contact, server-stamped. A heartbeat, not a measurement. */
  last_seen_at: string | null;
  heartbeat_age_seconds: number | null;
  /** The newest measurement the device stored, aged from its own `measured_at`. */
  last_observed_at: string | null;
  freshness_seconds: number | null;
  observation_state: ObservationState;
  /** This device's own configured silence allowance: rules are scoped per site and cooperative. */
  stale_after_minutes: number | null;
  /** A verdict, and only when a human configured the number behind it. */
  is_stale: boolean | null;
}

export interface MetricMissingness {
  metric: (typeof SENSOR_METRICS)[number];
  units: string;
  column: string;
  readings_scanned: number;
  readings_missing: number;
  /** missing / scanned, or null when there is nothing to divide by. Never a guessed 0 or 1. */
  share: number | null;
  basis: 'scanned_rows_in_window' | 'no_readings_in_window';
}

export interface FleetDataQualityResult {
  window: HistoryWindow;
  /** The instant the fleet scan reaches back to — `window.from` when it covered the whole window. */
  scanned_from: string;
  totals: {
    /** Exact count of devices in the caller's scope, independent of the capped node scan. */
    devices: number;
    /** Exact: `hardware_nodes.last_seen_at IS NULL`. Never completed an authenticated call. */
    never_contacted: number;
    /** Devices with no stored reading at all. Null when the scan was too short to be sure. */
    without_observations: number | null;
    without_observations_basis: 'exact' | 'scan_truncated';
    /** Exact count of readings in the window across every scoped device. */
    observations_in_window: number;
  };
  scanning: { rows_scanned: number; scan_cap: number; coverage: 'complete' | 'partial' };
  reference: { offline_window_minutes: number | null; basis: 'configured_offline_rule' | 'not_configured' };
  stale_devices: {
    count: number | null;
    /** Devices the verdict could be computed for: a configured window and a known newest measurement. */
    devices_with_a_verdict: number;
  };
  missing_data: MetricMissingness[];
  /**
   * Readings sitting exactly on a bound of the range `field.sensor_logs` enforces. NOT a threshold
   * and NOT an agronomic statement: a value outside those bounds could not have been stored, so a
   * reading parked on one is a hint about a sensor's wiring or clipping and nothing more.
   */
  at_store_bounds: Array<{ metric: (typeof SENSOR_METRICS)[number]; count: number; bounds: { min: number; max: number } }>;
  /** Stored readings claiming an instant another stored reading already claims; the replay index permits this when the values differ. */
  duplicates: { instants_with_duplicates: number; rows_involved: number };
  /** Readings timestamped by the platform because the payload carried no `measured_at`. */
  server_stamped: { count: number; share: number | null };
  unparseable_timestamps: number;
  /**
   * Reporting gaps longer than the configured allowance, counted inside the scanned span only. The
   * scan is globally newest-first, so every pair of consecutive rows it holds for one device really
   * was consecutive in storage; the count is complete for `[scanned_from, window.to]` and silent
   * below that, which is why `covers_from` travels with it.
   */
  reporting_gaps: { threshold_seconds: number | null; count: number | null; covers_from: string };
  devices: FleetDeviceQuality[];
}

/**
 * The whole fleet's reporting health, in five queries: scoped devices, their newest reading, the
 * recent rows across all of them, and two exact counts.
 *
 * Scope is the caller's resolved cooperative list, exactly as every other dashboard read takes it —
 * an empty scope answers empty without touching the database. The node hop is capped at
 * `SCOPE_NODE_CAP` by `scopedNodes`, so `scanning.coverage` reports `partial` for a cooperative
 * large enough to exceed it instead of describing a subset as the fleet.
 *
 * The two clocks stay apart on purpose, because collapsing them is the classic way a dashboard
 * lies: `last_seen_at` is when the platform last authenticated a submission, `measured_at` is when
 * the field held a value. A device backfilling last night's readings is fresh on one axis and stale
 * on the other, and an operator needs to see both.
 */
export async function fleetDataQuality(
  cooperativeScope: number[],
  requested: { range: string | null; from: string | null; to: string | null },
  rules: AlertRuleRow[],
  now: number = Date.now(),
): Promise<ManagementDb<FleetDataQualityResult>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  const resolved = resolveHistoryWindow(requested, now);
  if (!resolved.ok) return { ok: false, error: { code: 'invalid_payload', message: resolved.message } };
  const window = resolved.value;

  if (cooperativeScope.length === 0) return { ok: true, value: emptyFleetReport(window) };

  const nodes = await scopedNodes(cooperativeScope);
  if (!nodes.ok) return nodes;
  const scoped = nodes.value.nodes;
  const nodeIds = scoped.map((node) => node.node_id);
  const nodeCoverage: 'complete' | 'partial' = nodes.value.truncated ? 'partial' : 'complete';

  if (nodeIds.length === 0) return { ok: true, value: emptyFleetReport(window) };

  try {
    const client = getSyncClient();

    const [deviceTotal, neverContacted, observationsInRange, newest, scanQuery] = await Promise.all([
      exactCount('scoped device count', () =>
        client.schema('field').from('hardware_nodes').select('node_id', { count: 'exact', head: true }).in('cooperative_id', cooperativeScope),
      ),
      exactCount('never-contacted device count', () =>
        client
          .schema('field')
          .from('hardware_nodes')
          .select('node_id', { count: 'exact', head: true })
          .in('cooperative_id', cooperativeScope)
          .is('last_seen_at', null),
      ),
      exactCount('scoped reading count', () =>
        client
          .schema('field')
          .from('sensor_logs')
          .select('log_id', { count: 'exact', head: true })
          .in('node_id', nodeIds)
          .gte('measured_at', window.from)
          .lte('measured_at', window.to),
      ),
      newestReadingsFor(client, nodeIds),
      client
        .schema('field')
        .from('sensor_logs')
        .select(READING_COLUMNS)
        .in('node_id', nodeIds)
        .gte('measured_at', window.from)
        .lte('measured_at', window.to)
        .order('measured_at', { ascending: false })
        .order('log_id', { ascending: false })
        .range(0, FLEET_SCAN_CAP - 1),
    ]);

    if (!deviceTotal.ok) return deviceTotal;
    if (!neverContacted.ok) return neverContacted;
    if (!observationsInRange.ok) return observationsInRange;
    if (!newest.ok) return newest;
    if (scanQuery.error) return { ok: false, error: databaseUnavailable('fleet data quality', scanQuery.error.message) };

    const rows = ((scanQuery.data ?? []) as Array<Record<string, unknown>>).map(normalizeReading);
    const scanTruncated = rows.length < observationsInRange.value;

    const parsedTimes = rows.map((row) => Date.parse(row.measured_at)).filter((at) => Number.isFinite(at));
    const floorMs = scanTruncated && parsedTimes.length > 0 ? Math.min(...parsedTimes) : Date.parse(window.from);
    const scannedFrom = new Date(Number.isFinite(floorMs) ? floorMs : Date.parse(window.from)).toISOString();

    const byNode = newest.value.byNode;
    const sawEveryDevice = byNode.size >= scoped.length;
    // An absence is only a fact when the scan could have seen it: if every scoped device appears in
    // the newest-per-node map the answer is exact even when the scan was capped, and if the scan
    // was capped with a device missing, the honest count is `null`.
    const absenceIsExact = !newest.value.truncated || sawEveryDevice;

    const fleetOfflineMinutes = offlineWindowMinutes(rules);

    const devices = scoped.map((node): FleetDeviceQuality => {
      const reading = byNode.get(node.node_id) ?? null;
      const staleAfterMinutes = offlineWindowMinutes(rulesForNode(rules, node));
      const freshness = reading === null ? null : Math.max(0, (now - Date.parse(reading.measured_at)) / 1000);
      const heartbeatAge = typeof node.last_seen_at === 'string' && Number.isFinite(Date.parse(node.last_seen_at)) ? Math.max(0, (now - Date.parse(node.last_seen_at)) / 1000) : null;

      const state: ObservationState =
        reading !== null
          ? 'has_observations'
          : !sawEveryDevice && newest.value.truncated
            ? 'unknown_scan_truncated'
            : node.last_seen_at === null
              ? 'never_contacted'
              : 'none_recorded';

      return {
        node_id: node.node_id,
        name: node.name,
        status: node.status,
        field_site_id: node.field_site_id,
        last_seen_at: node.last_seen_at,
        heartbeat_age_seconds: heartbeatAge,
        last_observed_at: reading?.measured_at ?? null,
        freshness_seconds: freshness,
        observation_state: state,
        stale_after_minutes: staleAfterMinutes,
        // The configured `offline` window is written against CONTACT, which is what the alerting
        // path reads it for. Re-using the same human-chosen number here answers a different
        // question — how long since a MEASUREMENT — so the quality flag and the alert can
        // legitimately disagree for a device that backfills, and both figures are reported.
        is_stale: staleAfterMinutes === null || freshness === null ? null : freshness > staleAfterMinutes * 60_000,
      };
    });

    const withVerdict = devices.filter((device) => device.stale_after_minutes !== null && device.freshness_seconds !== null);

    return {
      ok: true,
      value: {
        window,
        scanned_from: scannedFrom,
        totals: {
          devices: deviceTotal.value,
          never_contacted: neverContacted.value,
          without_observations: absenceIsExact ? Math.max(0, scoped.length - byNode.size) : null,
          without_observations_basis: absenceIsExact ? 'exact' : 'scan_truncated',
          observations_in_window: observationsInRange.value,
        },
        scanning: { rows_scanned: rows.length, scan_cap: FLEET_SCAN_CAP, coverage: scanTruncated || nodeCoverage === 'partial' ? 'partial' : 'complete' },
        reference: { offline_window_minutes: fleetOfflineMinutes, basis: fleetOfflineMinutes === null ? 'not_configured' : 'configured_offline_rule' },
        stale_devices: {
          count: fleetOfflineMinutes === null ? null : withVerdict.filter((device) => device.is_stale === true).length,
          devices_with_a_verdict: withVerdict.length,
        },
        missing_data: missingDataReport(rows),
        at_store_bounds: storeBoundReport(rows),
        duplicates: duplicateReport(rows),
        server_stamped: {
          count: rows.filter((row) => row.time_source === 'server').length,
          share: rows.length === 0 ? null : round3(rows.filter((row) => row.time_source === 'server').length / rows.length),
        },
        unparseable_timestamps: rows.length - parsedTimes.length,
        reporting_gaps: {
          // The smallest window configured anywhere in scope, which is the one that would fire
          // first; per-device history reports each device's own rule.
          threshold_seconds: fleetOfflineMinutes === null ? null : fleetOfflineMinutes * 60,
          count: fleetOfflineMinutes === null ? null : gapCount(rows, fleetOfflineMinutes * 60_000),
          covers_from: scannedFrom,
        },
        devices,
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('fleet data quality', messageOf(err)) };
  }
}

function emptyFleetReport(window: HistoryWindow): FleetDataQualityResult {
  return {
    window,
    scanned_from: window.from,
    totals: { devices: 0, never_contacted: 0, without_observations: 0, without_observations_basis: 'exact', observations_in_window: 0 },
    scanning: { rows_scanned: 0, scan_cap: FLEET_SCAN_CAP, coverage: 'complete' },
    reference: { offline_window_minutes: null, basis: 'not_configured' },
    stale_devices: { count: null, devices_with_a_verdict: 0 },
    missing_data: SENSOR_METRICS.map((metric) => ({
      metric,
      units: METRIC_UNITS[metric],
      column: METRIC_COLUMN[metric],
      readings_scanned: 0,
      readings_missing: 0,
      share: null,
      basis: 'no_readings_in_window' as const,
    })),
    at_store_bounds: SENSOR_METRICS.map((metric) => ({ metric, count: 0, bounds: STORE_RANGES[metric] })),
    duplicates: { instants_with_duplicates: 0, rows_involved: 0 },
    server_stamped: { count: 0, share: null },
    unparseable_timestamps: 0,
    reporting_gaps: { threshold_seconds: null, count: null, covers_from: window.from },
    devices: [],
  };
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * How often each quantity is absent from the rows that were scanned.
 *
 * A missing measurement is a fact about a device's payload, never a zero:
 * `sensor_log_carries_a_measurement` accepts a row carrying three of the four quantities, so a fleet
 * that reports soil and battery but not humidity is normal, and this rate says so without inventing
 * a humidity value.
 */
function missingDataReport(rows: SensorReadingRow[]): MetricMissingness[] {
  return SENSOR_METRICS.map((metric) => {
    const column = METRIC_COLUMN[metric];
    const missing = rows.filter((row) => !Number.isFinite(row[column])).length;
    return {
      metric,
      units: METRIC_UNITS[metric],
      column,
      readings_scanned: rows.length,
      readings_missing: missing,
      share: rows.length === 0 ? null : round3(missing / rows.length),
      basis: rows.length === 0 ? 'no_readings_in_window' : 'scanned_rows_in_window',
    };
  });
}

/** Values sitting ON a storage bound. A wiring observation about the sensor, not an opinion about the field. */
function storeBoundReport(rows: SensorReadingRow[]): FleetDataQualityResult['at_store_bounds'] {
  return SENSOR_METRICS.map((metric) => {
    const column = METRIC_COLUMN[metric];
    const bounds = STORE_RANGES[metric];
    return {
      metric,
      count: rows.filter((row) => row[column] === bounds.min || row[column] === bounds.max).length,
      bounds,
    };
  });
}

/**
 * Duplicate measurement instants, grouped per device.
 *
 * `sensor_log_replay_uid` is unique on `(node_id, measured_at, payload_hash)`, so two rows sharing
 * an instant with different payloads are both legal storage — a device that resent a corrected
 * reading, or a clock that revisited a minute. Counting them is a report, not an accusation: the
 * schema allowed them, and an operator deciding whether that is acceptable needs the number.
 */
function duplicateReport(rows: SensorReadingRow[]): { instants_with_duplicates: number; rows_involved: number } {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.node_id}|${row.measured_at}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  let instants = 0;
  let involved = 0;
  for (const count of groups.values()) {
    if (count > 1) {
      instants += 1;
      involved += count;
    }
  }
  return { instants_with_duplicates: instants, rows_involved: involved };
}

/**
 * Consecutive-reading intervals longer than the allowance, per device.
 *
 * The pairs are genuine, and it is worth knowing why rather than trusting it: a newest-first scan
 * that stops at the cap holds EVERY row at or above the instant it stopped, so the slice it gives
 * back for one device is a contiguous run of that device's history. No interval inside it can be an
 * artefact of the page limit. What the count cannot see is below `scanned_from`, which is why the
 * response reports the span it covers instead of calling the number a total.
 */
function gapCount(rows: SensorReadingRow[], thresholdMs: number): number {
  const timesByNode = new Map<string, number[]>();
  for (const row of rows) {
    const at = Date.parse(row.measured_at);
    if (!Number.isFinite(at)) continue;
    const list = timesByNode.get(row.node_id);
    if (list) list.push(at);
    else timesByNode.set(row.node_id, [at]);
  }

  let gaps = 0;
  for (const times of timesByNode.values()) {
    const sorted = [...times].sort((a, b) => a - b);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1] ?? 0;
      const current = sorted[index] ?? 0;
      if (current - previous > thresholdMs) gaps += 1;
    }
  }
  return gaps;
}
