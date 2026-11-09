import { METRIC_COLUMN, METRIC_UNITS, SENSOR_METRICS, STORE_RANGES, type SensorMetricName } from './metrics';

/**
 * Historical aggregation and data-quality arithmetic, on rows someone already read.
 *
 * The brief asks for 24-hour, 7-day and 30-day analytics, missing-data frequency and reporting
 * health out of a table that can only be reached through bounded, exact queries. This module is where
 * that happens, and it is deliberately pure — it takes an array of stored readings plus the two
 * bounds of the window, and returns numbers it can name the rows behind. Nothing here opens a
 * database connection, so `npm run test:fieldintel` can hand it a history with a hole in it and check
 * what comes back.
 *
 * Four rules, all of them about not making things up:
 *
 *  1. **A statistic says how many rows it used.** Every figure carries `samples`, and an empty window
 *     produces nulls rather than 0. A mean over zero readings is not a mean.
 *  2. **A missing measurement stays missing.** `null` is counted as missing and never averaged into
 *     a number, never read as 0, and never bridged by a bucket that invents a value for an hour
 *     nobody reported in.
 *  3. **Nothing is interpolated.** Gaps are reported as gaps: intervals between real readings, and
 *     buckets whose value is null when the device sent nothing for that interval.
 *  4. **A judgement needs a configured reference.** "Unexpected gap" and "stale" are verdicts, and a
 *     verdict requires a number somebody chose. The only such number in this schema is an operator's
 *     `offline` rule, so without one the report returns the measurements plus
 *     `reference: 'not_configured'` and no verdict. This module does not decide how long a farm's
 *     sensor may be silent.
 *
 * The calendar is Addis Ababa, matching every timestamp the dashboard prints: Ethiopia has never
 * observed a DST change, so the offset is a constant. `components/field/localTime.ts` holds the
 * client's copy of that constant for the day pickers, and `npm run test:fieldintel` asserts the two
 * are the same number — a chart bucketed on UTC days beside a table stamped in +03 is exactly the
 * kind of quiet disagreement that makes a dashboard look wrong while being wrong.
 */

/** Africa/Addis_Ababa is UTC+3 all year. */
export const ADDIS_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

export type HistoryRange = '24h' | '7d' | '30d' | 'custom';
export const HISTORY_RANGES: readonly HistoryRange[] = ['24h', '7d', '30d', 'custom'];

/** One year, and the reason it is a limit rather than a suggestion: 366 daily buckets is a screen, 4 000 is a download. */
export const MAX_HISTORY_SPAN_MS = 366 * 86_400_000;

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** The reading shape the aggregation consumes, kept structural so the pure layer never imports the DB layer. */
export interface HistoryRow {
  log_id: number;
  measured_at: string;
  received_at: string;
  time_source: 'device' | 'server';
  soil_moisture_pct: number | null;
  ambient_temp_c: number | null;
  humidity_pct: number | null;
  battery_voltage_v: number | null;
}

export interface HistoryWindow {
  from: string;
  to: string;
  range: HistoryRange;
  span_ms: number;
}

export type WindowParse = { ok: true; value: HistoryWindow } | { ok: false; message: string };

/**
 * Turns a `range` keyword, or a `from`/`to` pair, into one bounded window.
 *
 * Relative ranges are computed from `now` (a parameter, never read from the clock inside) so the
 * 24-hour window means the same thing twice in a row and in a test. The upper bound is deliberately
 * NOT widened to "now plus a slack": a window ending in the future would be a promise about readings
 * that cannot exist, and the honest empty chart is better than a silently clipped filter.
 */
export function resolveHistoryWindow(raw: { range: string | null; from: string | null; to: string | null }, now: number): WindowParse {
  const requested = (raw.range ?? '24h').trim();
  // Looked up rather than cast, so `range` below is a `HistoryRange` and not a string wearing one:
  // an unrecognised keyword has to be refused, and a cast is how one ends up in a span of `undefined`
  // days.
  const range = HISTORY_RANGES.find((keyword) => keyword === requested);
  if (range === undefined) {
    return { ok: false, message: `range must be one of: ${HISTORY_RANGES.join(', ')}.` };
  }

  if (range !== 'custom') {
    const span = range === '24h' ? DAY_MS : range === '7d' ? 7 * DAY_MS : 30 * DAY_MS;
    return { ok: true, value: { from: new Date(now - span).toISOString(), to: new Date(now).toISOString(), range, span_ms: span } };
  }

  if (raw.from === null || raw.to === null) {
    return { ok: false, message: 'range=custom requires both from and to as ISO-8601 instants, for example 2026-11-01T00:00:00Z.' };
  }
  const from = Date.parse(raw.from);
  const to = Date.parse(raw.to);
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return { ok: false, message: 'from and to must be ISO-8601 dates or timestamps this server can parse.' };
  }
  if (from > to) return { ok: false, message: 'from must not be after to.' };
  const span = to - from;
  if (span > MAX_HISTORY_SPAN_MS) {
    return { ok: false, message: `a custom window may span at most ${String(Math.round(MAX_HISTORY_SPAN_MS / DAY_MS))} days; ask for a shorter range.` };
  }
  if (to > now + 15 * 60_000) {
    return { ok: false, message: 'to is in the future. History ends at the current instant.' };
  }
  return { ok: true, value: { from: new Date(from).toISOString(), to: new Date(to).toISOString(), range, span_ms: span } };
}

/** Hour buckets below three days, day buckets above: enough resolution to see a daily cycle, few enough points to render one. */
export function bucketSizeFor(spanMs: number): 'hour' | 'day' {
  return spanMs <= 3 * DAY_MS ? 'hour' : 'day';
}

function valueOf(row: HistoryRow, metric: SensorMetricName): number | null {
  const raw = row[METRIC_COLUMN[metric]];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

function sortedTimes(rows: HistoryRow[]): number[] {
  return rows.map((row) => Date.parse(row.measured_at)).filter((at) => Number.isFinite(at)).sort((a, b) => a - b);
}

function quantile(sorted: number[], fraction: number): number | null {
  if (sorted.length === 0) return null;
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower] ?? null;
  return sorted[lower] ?? sorted[upper] ?? null;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Three decimals: a mean of 41.900000000000006 % claims a precision no sensor has. */
function round3(value: number | null): number | null {
  return value === null ? null : Math.round(value * 1000) / 1000;
}

export interface MetricSummary {
  metric: SensorMetricName;
  units: string;
  /** Readings of any kind in the window. `samples` is how many of them carried THIS quantity. */
  observations_in_window: number;
  samples: number;
  missing: number;
  /** samples / observations_in_window, or null when there are no readings to divide by. Never a guessed 1. */
  reporting_rate: number | null;
  minimum: number | null;
  maximum: number | null;
  /** Derived from the stored rows only. A mean of a sensor's own readings, not a claim about a field. */
  mean: number | null;
  median: number | null;
  /** The newest reading that actually carried this quantity, so "latest" and "latest available" are never confused. */
  latest_value: number | null;
  latest_measured_at: string | null;
  first_measured_at: string | null;
  /** Values sitting ON the bound `field.sensor_logs` refuses beyond. Not a threshold, and labelled as such downstream. */
  at_range_edge: number;
}

export interface ReportingStats {
  observation_count: number;
  first_measured_at: string | null;
  last_measured_at: string | null;
  /** Age of the newest measurement, against `now`. Data freshness, aged from the reading, never from the page load. */
  freshness_seconds: number | null;
  /** Age of the newest submission. Different from freshness whenever a device backfills. */
  receipt_freshness_seconds: number | null;
  /** Mean interval between consecutive stored readings, from the rows in this window. */
  mean_interval_seconds: number | null;
  median_interval_seconds: number | null;
  largest_gap_seconds: number | null;
  /** Intervals longer than the reference, with the reference named. Null when nobody configured one. */
  gap_threshold_seconds: number | null;
  unexpected_gap_count: number | null;
  /** `offline` minutes come from an operator's rule; without one there is no verdict to give. */
  reference: 'configured_offline_rule' | 'not_configured';
}

export interface DuplicateInstant {
  measured_at: string;
  log_ids: number[];
}

export interface QualityReport {
  /** Readings whose device sent no timestamp, so the platform stamped the receipt instant. */
  server_stamped_count: number;
  /** Stored readings claiming an instant another stored reading already claims — the replay index permits these when the values differ. */
  duplicate_instants: DuplicateInstant[];
  duplicate_instant_count: number;
  /** Rows with an unparseable `measured_at`. The table refuses them; reporting the count proves the reader is not silently dropping them. */
  unparseable_timestamp_count: number;
  /** Newest reading older than the reference, i.e. the device itself is quiet. Null verdict when no rule exists. */
  is_stale: boolean | null;
  stale_after_seconds: number | null;
  /** True when the window holds no readings at all — "no history" is a fact about this window, and `no_history_ever` needs the count. */
  no_readings_in_window: boolean;
  missing_by_metric: Record<SensorMetricName, number>;
}

export interface HistoryBucket {
  bucket_start: string;
  bucket_end: string;
  readings: number;
  soil_moisture_pct: number | null;
  ambient_temp_c: number | null;
  humidity_pct: number | null;
  battery_voltage_v: number | null;
}

export interface HistorySummary {
  window: HistoryWindow;
  bucket_size: 'hour' | 'day';
  rows_scanned: number;
  metrics: MetricSummary[];
  reporting: ReportingStats;
  quality: QualityReport;
  buckets: HistoryBucket[];
}

/**
 * Everything the history panel shows, from one bounded scan.
 *
 * `offlineWindowSeconds` is the operator's configured silence allowance in minutes, already resolved
 * from `alert_rules` by the caller: this function must not decide what "too long" means, and passing
 * null is the honest answer for a deployment where nobody has configured anything. The dashboard then
 * shows the measured intervals without a verdict, which is exactly what the data supports.
 */
export function summarizeHistory(rows: HistoryRow[], window: HistoryWindow, now: number, offlineWindowMinutes: number | null): HistorySummary {
  const ordered = [...rows].sort((a, b) => Date.parse(a.measured_at) - Date.parse(b.measured_at) || a.log_id - b.log_id);
  const times = sortedTimes(ordered);
  const observations = ordered.length;

  const metrics = SENSOR_METRICS.map((metric): MetricSummary => {
    const present = ordered
      .map((row) => ({ at: Date.parse(row.measured_at), value: valueOf(row, metric) }))
      .filter((entry): entry is { at: number; value: number } => entry.value !== null && Number.isFinite(entry.at));

    const values = present.map((entry) => entry.value);
    const range = STORE_RANGES[metric];
    // `ordered` is ascending, so the last entry that carries this quantity is its newest one.
    const newest = present.length === 0 ? null : present[present.length - 1] ?? null;
    const earliest = present.length === 0 ? null : present[0] ?? null;
    const sortedValues = [...values].sort((a, b) => a - b);

    return {
      metric,
      units: METRIC_UNITS[metric],
      observations_in_window: observations,
      samples: values.length,
      missing: observations - values.length,
      reporting_rate: observations === 0 ? null : round3(values.length / observations),
      minimum: sortedValues.length === 0 ? null : sortedValues[0] ?? null,
      maximum: sortedValues.length === 0 ? null : sortedValues[sortedValues.length - 1] ?? null,
      mean: round3(mean(values)),
      median: round3(quantile(sortedValues, 0.5)),
      latest_value: newest === null ? null : newest.value,
      latest_measured_at: newest === null ? null : new Date(newest.at).toISOString(),
      first_measured_at: earliest === null ? null : new Date(earliest.at).toISOString(),
      at_range_edge: values.filter((value) => value === range.min || value === range.max).length,
    };
  });

  const intervals = intervalsBetween(times);
  const offlineWindowMs = offlineWindowMinutes === null || !Number.isFinite(offlineWindowMinutes) ? null : offlineWindowMinutes * 60_000;
  // The intervals are counted in seconds, so the threshold has to be in seconds too: comparing them
  // against the millisecond window would make a gap "unexpected" only after weeks of silence.
  const gapThresholdSeconds = offlineWindowMs === null ? null : offlineWindowMs / 1000;
  const lastMeasuredAt = times.length === 0 ? null : times[times.length - 1] ?? null;
  const lastReceivedAt = ordered
    .map((row) => Date.parse(row.received_at))
    .filter((at) => Number.isFinite(at))
    .reduce<number | null>((latest, at) => (latest === null || at > latest ? at : latest), null);

  const reporting: ReportingStats = {
    observation_count: observations,
    first_measured_at: times.length === 0 ? null : new Date(times[0] ?? 0).toISOString(),
    last_measured_at: lastMeasuredAt === null ? null : new Date(lastMeasuredAt).toISOString(),
    freshness_seconds: lastMeasuredAt === null ? null : Math.max(0, (now - lastMeasuredAt) / 1000),
    receipt_freshness_seconds: lastReceivedAt === null ? null : Math.max(0, (now - lastReceivedAt) / 1000),
    mean_interval_seconds: intervals.length === 0 ? null : round3(mean(intervals) ?? null),
    median_interval_seconds: round3(quantile([...intervals].sort((a, b) => a - b), 0.5)),
    largest_gap_seconds: intervals.length === 0 ? null : Math.max(...intervals),
    gap_threshold_seconds: gapThresholdSeconds,
    unexpected_gap_count: gapThresholdSeconds === null ? null : intervals.filter((seconds) => seconds > gapThresholdSeconds).length,
    reference: offlineWindowMs === null ? 'not_configured' : 'configured_offline_rule',
  };

  const byInstant = new Map<string, number[]>();
  for (const row of ordered) {
    const key = row.measured_at;
    const list = byInstant.get(key);
    if (list) list.push(row.log_id);
    else byInstant.set(key, [row.log_id]);
  }
  const duplicates: DuplicateInstant[] = [...byInstant.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([measured_at, ids]) => ({ measured_at, log_ids: ids }))
    .sort((a, b) => Date.parse(b.measured_at) - Date.parse(a.measured_at));

  const missingByMetric = {} as Record<SensorMetricName, number>;
  for (const summary of metrics) missingByMetric[summary.metric] = summary.missing;

  const quality: QualityReport = {
    server_stamped_count: ordered.filter((row) => row.time_source === 'server').length,
    duplicate_instants: duplicates.slice(0, 20),
    duplicate_instant_count: duplicates.length,
    unparseable_timestamp_count: ordered.length - times.length,
    is_stale:
      offlineWindowMs === null || lastMeasuredAt === null
        ? null
        : now - lastMeasuredAt > offlineWindowMs,
    stale_after_seconds: offlineWindowMs === null ? null : offlineWindowMs / 1000,
    no_readings_in_window: observations === 0,
    missing_by_metric: missingByMetric,
  };

  return {
    window,
    bucket_size: bucketSizeFor(window.span_ms),
    rows_scanned: observations,
    metrics,
    reporting,
    quality,
    buckets: buildBuckets(ordered, window, bucketSizeFor(window.span_ms)),
  };
}

/** Seconds between consecutive stored readings. Zero-length input gives an empty list, not a fabricated cadence. */
export function intervalsBetween(sortedEpochMs: number[]): number[] {
  const gaps: number[] = [];
  for (let index = 1; index < sortedEpochMs.length; index += 1) {
    const previous = sortedEpochMs[index - 1];
    const current = sortedEpochMs[index];
    if (previous === undefined || current === undefined) continue;
    const delta = (current - previous) / 1000;
    if (delta > 0) gaps.push(Math.round(delta));
  }
  return gaps;
}

/**
 * The window cut into buckets, each bucket holding the mean of the readings that fell inside it.
 *
 * A bucket with no readings has a null value per metric, which the chart draws as a gap. That is the
 * whole difference between "the sensor reported nothing for six hours" and a line that implies it
 * reported something flat. Bucket means are derived statistics and are labelled in the response as
 * such; the stored rows behind them are always reachable through `/api/field/devices/[nodeId]/readings`.
 */
export function buildBuckets(ordered: HistoryRow[], window: HistoryWindow, size: 'hour' | 'day'): HistoryBucket[] {
  const stepMs = size === 'hour' ? HOUR_MS : DAY_MS;
  const from = Date.parse(window.from);
  const to = Date.parse(window.to);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return [];

  // Bucket boundaries are Addis-aligned: an operator reading "06:00" on the axis means six in the
  // morning in their own day, not six in the morning in UTC.
  const offsetStart = from + ADDIS_UTC_OFFSET_MS;
  const firstBoundary = Math.floor(offsetStart / stepMs) * stepMs - ADDIS_UTC_OFFSET_MS;

  const buckets: HistoryBucket[] = [];
  for (let start = firstBoundary; start <= to && buckets.length < 700; start += stepMs) {
    const end = start + stepMs - 1;
    const inside = ordered.filter((row) => {
      const at = Date.parse(row.measured_at);
      return Number.isFinite(at) && at >= start && at <= end;
    });

    const bucket = {
      bucket_start: new Date(start).toISOString(),
      bucket_end: new Date(end).toISOString(),
      readings: inside.length,
    } as HistoryBucket;

    for (const metric of SENSOR_METRICS) {
      const column = METRIC_COLUMN[metric];
      const values = inside.map((row) => row[column]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      bucket[column] = values.length === 0 ? null : round3(mean(values));
    }
    buckets.push(bucket);
  }

  return buckets;
}
