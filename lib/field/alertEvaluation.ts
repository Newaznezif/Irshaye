import { alertTypeFor, METRIC_COLUMN, SENSOR_METRICS, minutesToMilliseconds, unitsMatchMetric } from './metrics';
import type { AlertType, RuleMetric, SensorMetricName } from './metrics';
import type { HardwareNodeRow } from './types';

/**
 * Alert rule evaluation, as pure arithmetic.
 *
 * This is the phase's actual requirement — "evaluate configured rules against accepted readings" —
 * kept in a module with no database, no HTTP and no clock it does not receive, for the same reason
 * `access.ts` and `ingest.ts` exist: the part a reviewer has to trust is the part a test can execute,
 * and an alerting rule that is only reachable through Postgres is only ever verified in production.
 *
 * Three rules govern everything below, and they are the three ways an automated alert becomes a lie.
 *
 *  1. **A threshold is never invented here.** Only a rule that already exists in `field.alert_rules`
 *     is evaluated, and a rule that is `disabled`, unit-mismatched or has no readable threshold is
 *     skipped with a reason. Nothing in this file knows that soil moisture below 30 % is anything.
 *  2. **A missing measurement is not a clear.** If the reading does not carry the quantity a rule
 *     watches, the rule is skipped — the existing alert stays open. Treating "the sensor did not
 *     report" as "the condition is gone" would silently resolve real alerts during a sensor outage,
 *     which is the opposite of what an outage needs.
 *  3. **An answer is a verdict plus its evidence.** Every breach carries the metric, the comparator,
 *     the observed value, the threshold, the unit and the reading it came from, because an alert that
 *     shows only its own sentence is not something a farmer can check.
 *
 * `sensor_failure` is never emitted from here. That type describes the platform refusing a payload,
 * which is a fact only the code doing the refusing can attest to; a threshold cannot produce it
 * honestly.
 */

/** The part of a stored reading this module reads, kept structural so the pure layer does not import the database layer. */
export interface EvaluableReading {
  log_id: number;
  measured_at: string;
  soil_moisture_pct: number | null;
  ambient_temp_c: number | null;
  humidity_pct: number | null;
  battery_voltage_v: number | null;
}

/** One row of `field.alert_rules`, as the evaluator needs it. */
export interface EvaluableRule {
  rule_id: number;
  name: string;
  cooperative_id: number | null;
  field_site_id: number | null;
  metric: RuleMetric;
  comparator: 'lt' | 'gt';
  threshold_value: number | null;
  threshold_units: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'enabled' | 'disabled';
}

export type SkipReason =
  | 'rule_units_mismatch'
  | 'rule_threshold_unreadable'
  | 'no_measurement'
  | 'no_previous_reading'
  | 'no_comparable_previous'
  | 'previous_value_is_zero'
  | 'no_last_seen';

export interface RuleBreach {
  rule_id: number;
  rule_name: string;
  metric: RuleMetric;
  comparator: 'lt' | 'gt';
  alert_type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  threshold_value: number;
  units: string;
  /** The value that crossed the threshold, or null for a comparison the platform performed (`offline`, `reading_change`). */
  observed_value: number | null;
  /** What goes into `field.device_alerts.detail`: numbers, their units, and the reading they came from. */
  detail: Record<string, string | number | boolean | null>;
}

export interface RuleClear {
  rule_id: number;
  alert_type: AlertType;
  metric: RuleMetric;
}

export interface RuleSkipped {
  rule_id: number;
  metric: RuleMetric;
  reason: SkipReason;
}

export interface EvaluationResult {
  breaches: RuleBreach[];
  clears: RuleClear[];
  skipped: RuleSkipped[];
  /** The reading the verdicts are about, so a persisted alert can name its evidence. */
  triggered_by: { log_id: number; measured_at: string } | null;
}

export interface EvaluationInput {
  node: Pick<HardwareNodeRow, 'node_id' | 'status' | 'cooperative_id' | 'field_site_id' | 'last_seen_at'>;
  /** The reading that just arrived, or null when nothing new was accepted (a manual sweep). */
  reading: EvaluableReading | null;
  /** The reading immediately before it, which only `reading_change` needs. */
  previous: EvaluableReading | null;
  rules: EvaluableRule[];
  /** Milliseconds. A parameter, never `Date.now()` at the top of the module, so a test can stand at a chosen second. */
  now: number;
}

/**
 * Which rules a node is inside, by the scope the schema derives from the target columns.
 *
 * `alert_rule_targets_one_scope` allows at most one of `cooperative_id` and `field_site_id`, and the
 * migration spells out the four meanings of that pair: both null is platform-wide, cooperative only
 * is every node in that cooperative, site only is that one field. A site rule for a field the node is
 * not in must not fire on it, and a rule for a cooperative the node does not belong to must not
 * either — that is tenant isolation inside the alerting path, where getting it wrong shows one
 * farmer another farm's conditions.
 *
 * Disabled rules are filtered out here rather than skipped downstream, so nothing can evaluate a
 * rule an operator retired. Their history stays in `device_alerts`; only the evaluation stops.
 */
export function rulesForNode(rules: EvaluableRule[], node: Pick<HardwareNodeRow, 'cooperative_id' | 'field_site_id'>): EvaluableRule[] {
  return rules.filter((rule) => {
    if (rule.status !== 'enabled') return false;
    if (rule.field_site_id !== null) return node.field_site_id !== null && node.field_site_id === rule.field_site_id;
    if (rule.cooperative_id !== null) return node.cooperative_id !== null && node.cooperative_id === rule.cooperative_id;
    return true;
  });
}

/** The value a rule watches, out of a reading. `offline` and `reading_change` have no single stored value. */
function measuredValue(reading: EvaluableReading | null, metric: RuleMetric): number | null {
  if (reading === null) return null;
  if (metric === 'offline' || metric === 'reading_change') return null;
  const value = reading[METRIC_COLUMN[metric]];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * `reading_change` as the schema describes it: the size of the jump between two consecutive readings
 * of one quantity, as a percentage of the previous value.
 *
 * It is a magnitude, so the comparator reads the size of the jump and not its direction — that is
 * what the column comment means by "the size of the jump", and it is why a `reading_change gt 40`
 * rule catches a sensor that suddenly doubles as well as one that drops to nothing. Returns null
 * when the previous value is 0: `40 % of zero` is a division by zero, and reporting an infinite
 * change would be an alert built out of an arithmetic failure.
 */
export function changePercent(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return null;
  return (Math.abs(current - previous) / Math.abs(previous)) * 100;
}

/** Two decimals: a percent change of `33.333333333333336` is a floating-point artefact, not a measurement. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The quantities two consecutive readings both carry, with the jump for each.
 *
 * A `reading_change` rule names a comparison, not a sensor: `alert_rules.metric` has one
 * `reading_change` value per scope (the unique index makes it one rule), while a node measures up to
 * four quantities. So the rule watches every quantity the two readings share and reports the largest
 * jump, and `detail.changed_metric` says which one — otherwise a soil-moisture spike would have to be
 * configured as a separate rule the schema has no room for.
 *
 * `sharedCount` is reported separately from `withChange.length` because they answer different
 * questions: "the two readings measured nothing in common" and "they measured 0 and 0" both mean no
 * alert, and an operator asking why deserves the true one.
 */
function comparablePairs(current: EvaluableReading, previous: EvaluableReading): { withChange: ChangeEntry[]; sharedCount: number } {
  const shared = SENSOR_METRICS.map((metric) => ({
    metric,
    current: measuredValue(current, metric),
    previous: measuredValue(previous, metric),
  })).filter((entry): entry is { metric: SensorMetricName; current: number; previous: number } => entry.current !== null && entry.previous !== null);

  const withChange = shared
    .filter((entry) => entry.previous !== 0)
    .map((entry) => ({ ...entry, change: round2(Number(changePercent(entry.current, entry.previous) ?? 0)) }));

  return { withChange, sharedCount: shared.length };
}

interface ChangeEntry {
  metric: SensorMetricName;
  current: number;
  previous: number;
  change: number;
}

/** The comparison a rule states, applied to a value in the same unit as its threshold. */
function crosses(value: number, comparator: 'lt' | 'gt', threshold: number): boolean {
  return comparator === 'lt' ? value < threshold : value > threshold;
}

/**
 * The whole evaluation: one node, one reading, the rules that cover it.
 *
 * Order is by `rule_id` so the same inputs always produce the same output list, which is what makes
 * "safe to retry" testable: an evaluation that returns its verdicts in a stable order cannot produce
 * two different alert rows for one submission.
 */
export function evaluateRules(input: EvaluationInput): EvaluationResult {
  const breaches: RuleBreach[] = [];
  const clears: RuleClear[] = [];
  const skipped: RuleSkipped[] = [];

  const rules = [...rulesForNode(input.rules, input.node)].sort((a, b) => a.rule_id - b.rule_id);
  const triggeredBy = input.reading === null ? null : { log_id: input.reading.log_id, measured_at: input.reading.measured_at };

  for (const rule of rules) {
    const alertType = alertTypeFor(rule.metric, rule.comparator);

    // A rule that cannot be read has to be reported, not evaluated as though it could.
    if (!unitsMatchMetric(rule.metric, rule.threshold_units)) {
      skipped.push({ rule_id: rule.rule_id, metric: rule.metric, reason: 'rule_units_mismatch' });
      continue;
    }
    if (rule.threshold_value === null || !Number.isFinite(rule.threshold_value)) {
      skipped.push({ rule_id: rule.rule_id, metric: rule.metric, reason: 'rule_threshold_unreadable' });
      continue;
    }
    const threshold = rule.threshold_value;

    if (rule.metric === 'offline') {
      const windowMs = minutesToMilliseconds(threshold);
      const lastSeenAt = Date.parse(String(input.node.last_seen_at ?? ''));
      if (windowMs === null) {
        skipped.push({ rule_id: rule.rule_id, metric: rule.metric, reason: 'rule_threshold_unreadable' });
        continue;
      }
      if (!Number.isFinite(lastSeenAt)) {
        // Never authenticated: there is no age to compare, and "it has been silent for a week" would
        // be a story about a clock that has never ticked here. The dashboard reports this device as
        // never contacted, which is a different and true sentence.
        skipped.push({ rule_id: rule.rule_id, metric: rule.metric, reason: 'no_last_seen' });
        continue;
      }
      const silentMs = input.now - lastSeenAt;
      if (silentMs > windowMs) {
        breaches.push({
          rule_id: rule.rule_id,
          rule_name: rule.name,
          metric: rule.metric,
          comparator: rule.comparator,
          alert_type: alertType,
          severity: rule.severity,
          threshold_value: threshold,
          units: rule.threshold_units,
          observed_value: Math.max(0, Math.round(silentMs / 60_000)),
          detail: {
            metric: rule.metric,
            comparator: rule.comparator,
            observed_value: Math.max(0, Math.round(silentMs / 60_000)),
            threshold_value: threshold,
            units: rule.threshold_units,
            rule_id: rule.rule_id,
            last_seen_at: input.node.last_seen_at,
            // An offline condition has no reading behind it; saying so is more honest than leaving
            // the field out and letting the row look like every other alert.
            reading_log_id: null,
            reading_measured_at: null,
          },
        });
      } else {
        clears.push({ rule_id: rule.rule_id, alert_type: alertType, metric: rule.metric });
      }
      continue;
    }

    if (rule.metric === 'reading_change') {
      if (input.reading === null) {
        skipped.push({ rule_id: rule.rule_id, metric: rule.metric, reason: 'no_measurement' });
        continue;
      }
      if (input.previous === null) {
        skipped.push({ rule_id: rule.rule_id, metric: rule.metric, reason: 'no_previous_reading' });
        continue;
      }

      const { withChange, sharedCount } = comparablePairs(input.reading, input.previous);
      if (sharedCount === 0) {
        skipped.push({ rule_id: rule.rule_id, metric: rule.metric, reason: 'no_comparable_previous' });
        continue;
      }
      if (withChange.length === 0) {
        skipped.push({ rule_id: rule.rule_id, metric: rule.metric, reason: 'previous_value_is_zero' });
        continue;
      }

      const crossed = withChange.filter((entry) => crosses(entry.change, rule.comparator, threshold));
      if (crossed.length === 0) {
        clears.push({ rule_id: rule.rule_id, alert_type: alertType, metric: rule.metric });
        continue;
      }

      // One rule, one alert: the largest jump is the one worth showing, and the others stay in the
      // history they came from rather than becoming three rows about one submission.
      const jumped = crossed.reduce((widest, entry) => (entry.change > widest.change ? entry : widest));
      const observed = round2(jumped.change);
      breaches.push({
        rule_id: rule.rule_id,
        rule_name: rule.name,
        metric: rule.metric,
        comparator: rule.comparator,
        alert_type: alertType,
        severity: rule.severity,
        threshold_value: threshold,
        units: rule.threshold_units,
        observed_value: observed,
        detail: {
          metric: rule.metric,
          comparator: rule.comparator,
          observed_value: observed,
          threshold_value: threshold,
          units: rule.threshold_units,
          rule_id: rule.rule_id,
          changed_metric: jumped.metric,
          current_value: jumped.current,
          previous_value: jumped.previous,
          previous_measured_at: input.previous.measured_at,
          reading_log_id: input.reading.log_id,
          reading_measured_at: input.reading.measured_at,
        },
      });
      continue;
    }

    const value = measuredValue(input.reading, rule.metric);
    if (value === null) {
      // The device did not measure this quantity. Not a 0, not a clear, not a guess.
      skipped.push({ rule_id: rule.rule_id, metric: rule.metric, reason: 'no_measurement' });
      continue;
    }
    if (crosses(value, rule.comparator, threshold)) {
      breaches.push({
        rule_id: rule.rule_id,
        rule_name: rule.name,
        metric: rule.metric,
        comparator: rule.comparator,
        alert_type: alertType,
        severity: rule.severity,
        threshold_value: threshold,
        units: rule.threshold_units,
        observed_value: value,
        detail: {
          metric: rule.metric,
          comparator: rule.comparator,
          observed_value: value,
          threshold_value: threshold,
          units: rule.threshold_units,
          rule_id: rule.rule_id,
          reading_log_id: input.reading?.log_id ?? null,
          reading_measured_at: input.reading?.measured_at ?? null,
        },
      });
    } else {
      clears.push({ rule_id: rule.rule_id, alert_type: alertType, metric: rule.metric });
    }
  }

  return { breaches, clears, skipped, triggered_by: triggeredBy };
}
