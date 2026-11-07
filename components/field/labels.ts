import type { BadgeTone } from '@/components/ui/Badge';
import type { TranslationKey } from '@/lib/i18n';

import type { AlertSeverity, AlertStatus, CoordinateSource, HistoryRange, NodeStatus, ObservationState, ReadingRow, ReadingTimeSource } from './types';

/**
 * The vocabulary the Field Intelligence API uses, each word given one label key and one colour.
 *
 * These lists exist so no panel invents its own wording for the same stored value. Every item here
 * maps a value a CHECK constraint already closes (`hardware_nodes.status`, `device_alerts.severity`,
 * `alert_rules.metric`, `sensor_logs.time_source`, …) onto a locale key — which is what keeps five
 * languages and one database in agreement, and keeps an unknown future value from rendering as a
 * silent `undefined`. A value outside the list renders its own token instead of a guess, because a
 * device labelled "active" by a fallback is a lie about a machine.
 */

export const STATUS_TONE: Record<NodeStatus, BadgeTone> = {
  active: 'brand',
  inactive: 'neutral',
  maintenance: 'gold',
  disabled: 'clay',
};

export const STATUS_KEYS: Record<NodeStatus, TranslationKey> = {
  active: 'field.status.active',
  inactive: 'field.status.inactive',
  maintenance: 'field.status.maintenance',
  disabled: 'field.status.disabled',
};

/** Every status, in the order the overview band lists them. */
export const NODE_STATUSES: readonly NodeStatus[] = ['active', 'inactive', 'maintenance', 'disabled'];

export const SEVERITY_TONE: Record<AlertSeverity, BadgeTone> = {
  info: 'info',
  warning: 'gold',
  critical: 'clay',
};

export const SEVERITY_KEYS: Record<AlertSeverity, TranslationKey> = {
  info: 'field.severity.info',
  warning: 'field.severity.warning',
  critical: 'field.severity.critical',
};

/** Mirrors `ALERT_SEVERITIES` in `lib/field/observationService.ts`; the server validates, this labels. */
export const ALERT_SEVERITIES: readonly AlertSeverity[] = ['info', 'warning', 'critical'];

export const ALERT_STATUSES: readonly AlertStatus[] = ['open', 'acknowledged', 'resolved', 'dismissed'];

export const ALERT_STATUS_TONE: Record<AlertStatus, BadgeTone> = {
  open: 'clay',
  acknowledged: 'gold',
  resolved: 'brand',
  dismissed: 'neutral',
};

export const ALERT_STATUS_KEYS: Record<AlertStatus, TranslationKey> = {
  open: 'field.alertStatus.open',
  acknowledged: 'field.alertStatus.acknowledged',
  resolved: 'field.alertStatus.resolved',
  dismissed: 'field.alertStatus.dismissed',
};

/** `device_alerts.alert_type` is closed by a CHECK; anything else is data this build never saw. */
export const ALERT_TYPE_KEYS: Record<string, TranslationKey> = {
  low_soil_moisture: 'field.alertType.low_soil_moisture',
  high_temperature: 'field.alertType.high_temperature',
  low_battery: 'field.alertType.low_battery',
  device_offline: 'field.alertType.device_offline',
  abnormal_reading: 'field.alertType.abnormal_reading',
  sensor_failure: 'field.alertType.sensor_failure',
};

export type SensorMetric = 'soil_moisture' | 'ambient_temp' | 'humidity' | 'battery_voltage';

/** The four columns `sensor_logs` actually holds. `offline`/`reading_change` are rules, not readings. */
export const SENSOR_METRICS: readonly SensorMetric[] = ['soil_moisture', 'ambient_temp', 'humidity', 'battery_voltage'];

export const METRIC_KEYS: Record<SensorMetric | 'offline' | 'reading_change', TranslationKey> = {
  soil_moisture: 'field.metric.soil_moisture',
  ambient_temp: 'field.metric.ambient_temp',
  humidity: 'field.metric.humidity',
  battery_voltage: 'field.metric.battery_voltage',
  offline: 'field.metric.offline',
  reading_change: 'field.metric.reading_change',
};

/** Units come from the column, not from the label: `soil_moisture_pct` is percent because it is named so. */
export type MetricColumn = { [K in keyof ReadingRow]: null extends ReadingRow[K] ? K : never }[keyof ReadingRow];

export const METRIC_COLUMN: Record<SensorMetric, MetricColumn> = {
  soil_moisture: 'soil_moisture_pct',
  ambient_temp: 'ambient_temp_c',
  humidity: 'humidity_pct',
  battery_voltage: 'battery_voltage_v',
};

export const METRIC_UNIT_KEYS: Record<SensorMetric, TranslationKey> = {
  soil_moisture: 'field.unit.percent',
  ambient_temp: 'field.unit.celsius',
  humidity: 'field.unit.percent',
  battery_voltage: 'field.unit.volts',
};

export const COORDINATE_SOURCE_KEYS: Record<CoordinateSource, TranslationKey> = {
  'device-gnss': 'field.coordSource.deviceGnss',
  surveyed: 'field.coordSource.surveyed',
  'operator-entered': 'field.coordSource.operatorEntered',
  imported: 'field.coordSource.imported',
};

/**
 * The derived state of a credential row, as `credentialsMetadata()` computes it.
 *
 * `expired` is not `retired`: the first is the database's current row whose `expires_at` has passed,
 * so the device holds a secret that authenticates nowhere, and only a manager who can see that
 * distinction will issue a new one before the next report rather than after it.
 */
export const CREDENTIAL_STATE_KEYS: Record<'current' | 'expired' | 'retired', TranslationKey> = {
  current: 'field.credentialState.current',
  expired: 'field.credentialState.expired',
  retired: 'field.credentialState.retired',
};

export const CREDENTIAL_STATE_TONE: Record<'current' | 'expired' | 'retired', BadgeTone> = {
  current: 'brand',
  expired: 'gold',
  retired: 'neutral',
};

/**
 * Whether a device has stored observations, and how confidently the platform can say so.
 * `unknown_scan_truncated` is the honest state and gets its own label rather than being folded into
 * `none_recorded`, which is a sentence an operator acts on.
 */
export const OBSERVATION_STATE_KEYS: Record<ObservationState, TranslationKey> = {
  has_observations: 'field.observationState.hasObservations',
  none_recorded: 'field.observationState.noneRecorded',
  never_contacted: 'field.observationState.neverContacted',
  unknown_scan_truncated: 'field.observationState.unknownScan',
};

export const OBSERVATION_STATE_TONE: Record<ObservationState, BadgeTone> = {
  has_observations: 'brand',
  none_recorded: 'gold',
  never_contacted: 'clay',
  unknown_scan_truncated: 'neutral',
};

export const HISTORY_RANGES: readonly HistoryRange[] = ['24h', '7d', '30d', 'custom'];

export const HISTORY_RANGE_KEYS: Record<HistoryRange, TranslationKey> = {
  '24h': 'field.historyRange.24h',
  '7d': 'field.historyRange.7d',
  '30d': 'field.historyRange.30d',
  custom: 'field.historyRange.custom',
};

export const TIME_SOURCE_KEYS: Record<ReadingTimeSource, TranslationKey> = {
  device: 'field.timeSource.device',
  server: 'field.timeSource.server',
};

export const RULE_STATUS_KEYS: Record<'enabled' | 'disabled', TranslationKey> = {
  enabled: 'field.ruleStatus.enabled',
  disabled: 'field.ruleStatus.disabled',
};

export const SCOPE_ORIGIN_KEYS: Record<'cooperative' | 'field_site' | 'platform', TranslationKey> = {
  cooperative: 'field.scopeOrigin.cooperative',
  field_site: 'field.scopeOrigin.fieldSite',
  platform: 'field.scopeOrigin.platform',
};

/**
 * A duration in seconds, spoken. The buckets are coarse on purpose: an operator scanning a fleet
 * needs "4 h", not "4 h 12 m 9 s", and the exact instant is always available beside it via `stamp()`.
 */
export function ageBuckets(seconds: number): { key: TranslationKey; value: number } {
  const abs = Math.max(0, Math.round(seconds));
  if (abs < 60) return { key: 'field.age.seconds', value: abs };
  if (abs < 3600) return { key: 'field.age.minutes', value: Math.round(abs / 60) };
  if (abs < 86_400) return { key: 'field.age.hours', value: Math.round(abs / 3600) };
  return { key: 'field.age.days', value: Math.round(abs / 86_400) };
}
