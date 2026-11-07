/**
 * The metric vocabulary Field Intelligence evaluates against, in one place.
 *
 * Three vocabularies already exist and this module only lines them up — it does not add to any of
 * them:
 *
 *  - `field.sensor_logs` columns (`soil_moisture_pct`, `ambient_temp_c`, `humidity_pct`,
 *    `battery_voltage_v`), each unit spelled out in its own name;
 *  - `field.alert_rules.metric`, closed by a CHECK to six values, two of which (`offline`,
 *    `reading_change`) are comparisons the platform performs rather than something a device
 *    measured;
 *  - `field.device_alerts.alert_type`, closed by a CHECK to six values.
 *
 * The rule names in this file are mirrors of those CHECKs, and `npm run test:fieldintel` reads the
 * migration text and compares them, because a metric the evaluator does not know is an alert an
 * operator configured and never received — the worst possible failure of an alerting system, and
 * silent by nature.
 *
 * Nothing here computes anything. Evaluation lives in `alertEvaluation.ts`, aggregation in
 * `historyMath.ts`; this module is the dictionary they both read from.
 */

/** The four quantities a device can measure. */
export type SensorMetricName = 'soil_moisture' | 'ambient_temp' | 'humidity' | 'battery_voltage';

/** The six values `alert_rules.metric` accepts: the four measurements plus two platform comparisons. */
export type RuleMetric = SensorMetricName | 'offline' | 'reading_change';

/** The six values `device_alerts.alert_type` accepts. A rendering key, never a sentence. */
export type AlertType =
  | 'low_soil_moisture'
  | 'high_temperature'
  | 'low_battery'
  | 'device_offline'
  | 'abnormal_reading'
  | 'sensor_failure';

export type MetricComparator = 'lt' | 'gt';

/** The CHECK values of `alert_rules.metric` in 20261105000200 section 4. */
export const RULE_METRICS: readonly RuleMetric[] = ['soil_moisture', 'ambient_temp', 'humidity', 'battery_voltage', 'offline', 'reading_change'];

/** The CHECK values of `device_alerts.alert_type` in 20261105000200 section 5. */
export const ALERT_TYPES: readonly AlertType[] = [
  'low_soil_moisture',
  'high_temperature',
  'low_battery',
  'device_offline',
  'abnormal_reading',
  'sensor_failure',
];

/** The metrics a threshold is compared against a stored measurement for. */
export const SENSOR_METRICS: readonly SensorMetricName[] = ['soil_moisture', 'ambient_temp', 'humidity', 'battery_voltage'];

/**
 * Metric → `field.sensor_logs` column.
 *
 * The key is also the JSON field name a device sends (`soil_moisture`), which is not a coincidence
 * to rely on but is worth naming: `RANGES` in lib/field/ingest.ts maps the payload key to the
 * `SensorMeasurements` property, and this maps the same key to the column. Two maps, one database
 * name, so a rule and a reading can be joined without either side guessing.
 */
export const METRIC_COLUMN: Record<SensorMetricName, 'soil_moisture_pct' | 'ambient_temp_c' | 'humidity_pct' | 'battery_voltage_v'> = {
  soil_moisture: 'soil_moisture_pct',
  ambient_temp: 'ambient_temp_c',
  humidity: 'humidity_pct',
  battery_voltage: 'battery_voltage_v',
};

/**
 * Metric → the unit a threshold has to be written in.
 *
 * Mirrors `alert_rule_units_match_metric` exactly, including `minutes` for `offline` — that CHECK is
 * why an `offline` rule carries a wait length rather than a voltage, and why the evaluator can
 * convert minutes to milliseconds without asking anyone.
 */
export const METRIC_UNITS: Record<RuleMetric, '%' | '°C' | 'V' | 'minutes'> = {
  soil_moisture: '%',
  ambient_temp: '°C',
  humidity: '%',
  battery_voltage: 'V',
  offline: 'minutes',
  reading_change: '%',
};

/**
 * The plausible-range bounds `field.sensor_logs` enforces, restated for reporting.
 *
 * These are NOT thresholds and must never be presented as ones: a value outside them could not have
 * been stored at all, so they say something about the sensor's wiring, not about somebody's field.
 * They exist here because the data-quality report needs a word for "this reading sits at the very
 * edge of what the schema accepts", and that edge has to be the same edge the database enforces.
 */
export const STORE_RANGES: Record<SensorMetricName, { min: number; max: number }> = {
  soil_moisture: { min: 0, max: 100 },
  ambient_temp: { min: -40, max: 60 },
  humidity: { min: 0, max: 100 },
  battery_voltage: { min: 0, max: 30 },
};

/**
 * Metric + comparator → the `alert_type` the condition is filed under.
 *
 * Read this as the schema's own limit, not as a design choice. `device_alerts.alert_type` has six
 * legal values, and three of them name a direction (`low_…`, `high_…`, `device_offline`); there is
 * no `high_humidity`, no `low_temperature` and no `battery_too_high`. A `humidity gt 80` rule is a
 * perfectly legitimate configuration, so rather than invent a vocabulary — which would be a
 * migration nobody has applied and five translations nobody has written — those rules are filed as
 * `abnormal_reading`, and the `detail` object carries the metric, the comparator, the observed value
 * and the threshold, which is what the screen renders. An operator who configures `humidity lt 20`
 * therefore sees "abnormal reading" with the number and the sign in it, and can tell exactly which
 * rule fired; they do not see a sentence the database cannot hold.
 *
 * `sensor_failure` is deliberately unreachable from here. It describes the platform's own integrity
 * check — a payload the database refused — and only the code that observes a refusal can raise it,
 * so a mapping that could produce it from a threshold would be a fault accusation about a sensor
 * that reported honestly.
 */
export function alertTypeFor(metric: RuleMetric, comparator: MetricComparator): AlertType {
  if (metric === 'offline') return 'device_offline';
  if (metric === 'soil_moisture' && comparator === 'lt') return 'low_soil_moisture';
  if (metric === 'ambient_temp' && comparator === 'gt') return 'high_temperature';
  if (metric === 'battery_voltage' && comparator === 'lt') return 'low_battery';
  return 'abnormal_reading';
}

/**
 * Does this rule's stored unit agree with its metric?
 *
 * The database makes a mismatch impossible to insert. This exists because `force row level security`
 * and a hand-edited row are not the same thing as a guarantee, and because a rule whose unit is
 * wrong would be evaluated in the wrong dimension: `soil_moisture lt 20` written as `°C` is a number
 * applied to a different quantity, and the alert it raises would be a false statement about a field.
 * Refusing to evaluate it, and saying so, is the honest answer.
 */
export function unitsMatchMetric(metric: RuleMetric, units: string): boolean {
  return METRIC_UNITS[metric] === units;
}

/** Minutes, as the `offline` rule stores them, into milliseconds. Non-finite input becomes null rather than a huge wait. */
export function minutesToMilliseconds(minutes: number | null): number | null {
  if (minutes === null || !Number.isFinite(minutes)) return null;
  return minutes * 60_000;
}
