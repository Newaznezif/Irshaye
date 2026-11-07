/**
 * The client-side shape of the Field Intelligence API responses.
 *
 * These mirror `lib/field/observationService.ts` and `lib/field/deviceService.ts` by hand rather
 * than importing them, for one reason: those modules import the service-role client, and anything
 * that imports them lands in a browser bundle with a server-only dependency. The duplication is
 * therefore deliberate, and it is cheap to check — a field that drifts shows up as a rendering
 * `undefined`, which is why every number below is `number | null` and never a bare `number`.
 *
 * Nothing here carries a credential, a hash or a raw payload: the routes do not emit those
 * (`READING_COLUMNS` excludes `raw_payload`/`payload_hash`, `toDeviceSummary` excludes
 * `token_hash`), so a type that could hold one would be a promise the UI cannot keep. The one field
 * that names a digest's *function* (`hash_algorithm` on a credential row) is a label, not a secret,
 * and `CREDENTIAL_METADATA_COLUMNS` on the server cannot select the digest beside it.
 */

export type NodeStatus = 'active' | 'inactive' | 'maintenance' | 'disabled';
export type Coverage = 'complete' | 'partial';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';
export type CoordinateSource = 'device-gnss' | 'surveyed' | 'operator-entered' | 'imported';
export type ReadingTimeSource = 'device' | 'server';

/** The four quantities a device can measure — mirrors `SensorMetricName` in `lib/field/metrics.ts`. */
export type SensorMetricName = 'soil_moisture' | 'ambient_temp' | 'humidity' | 'battery_voltage';

export interface ReadingRow {
  log_id: number;
  node_id: string;
  measured_at: string;
  received_at: string;
  time_source: ReadingTimeSource;
  soil_moisture_pct: number | null;
  ambient_temp_c: number | null;
  humidity_pct: number | null;
  battery_voltage_v: number | null;
}

export interface SitePlace {
  location_key: string;
  name: string;
  admin1: string | null;
  admin2: string | null;
}

export interface SiteRow {
  field_site_id: number;
  cooperative_id: number;
  name: string;
  crop: string | null;
  area_hectares: number | null;
  location_key: string | null;
  place: SitePlace | null;
  device_count: number;
  devices_by_status: Record<NodeStatus, number>;
  last_seen_at: string | null;
  last_observed_at: string | null;
  last_observation: ReadingRow | null;
  coverage: Coverage;
}

export interface DeviceRow {
  node_id: string;
  name: string;
  status: NodeStatus;
  cooperative_id: number | null;
  field_site_id: number | null;
  latitude: number | null;
  longitude: number | null;
  coordinate_source: CoordinateSource | null;
  hardware_model: string | null;
  firmware_version: string | null;
  last_seen_at: string | null;
  provisioned: boolean;
  credential_expires_at: string | null;
}

export interface AlertRow {
  alert_id: number;
  node_id: string;
  alert_rule_id: number | null;
  alert_type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  first_raised_at: string;
  last_observed_at: string;
  resolved_at: string | null;
  detail: Record<string, unknown> | null;
  site_id: number | null;
  device_name: string | null;
}

export interface RuleRow {
  rule_id: number;
  name: string;
  cooperative_id: number | null;
  field_site_id: number | null;
  metric: 'soil_moisture' | 'ambient_temp' | 'humidity' | 'battery_voltage' | 'offline' | 'reading_change';
  comparator: 'lt' | 'gt';
  threshold_value: number | null;
  threshold_units: string;
  severity: AlertSeverity;
  status: 'enabled' | 'disabled';
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

export interface OverviewResponse {
  devices: {
    total: number;
    by_status: Record<NodeStatus, number>;
    never_seen: number;
    heartbeat: { newest_last_seen_at: string | null; age_seconds: number | null };
    coverage: Coverage;
  };
  field_sites: { total: number };
  alerts: { unresolved: number; coverage: Coverage };
  observations: {
    total: number;
    newest_measured_at: string | null;
    newest_received_at: string | null;
    age_seconds: number | null;
    coverage: Coverage;
  };
  configured_offline_window_minutes: number | null;
  cooperatives: Array<{ cooperative_id: number; name: string }>;
  visible_cooperatives: number[];
}

export interface SitesResponse {
  sites: SiteRow[];
  total: number;
  page: { limit: number; offset: number };
  visible_cooperatives: number[];
}

export interface SiteDetailResponse {
  site: SiteRow;
  devices: DeviceRow[];
  visible_cooperatives: number[];
}

export interface ReadingsResponse {
  device: DeviceRow;
  readings: ReadingRow[];
  total_in_range: number;
  page: { limit: number; offset: number };
  window: { from: string | null; to: string | null };
  chart_covers: string;
}

export interface AlertsResponse {
  alerts: AlertRow[];
  total: number;
  page: { limit: number; offset: number };
  coverage: Coverage;
  configured_rules: RuleRow[];
  rules_coverage: Coverage;
  visible_cooperatives: number[];
}

export interface MapResponse {
  positions: MapPosition[];
  without_coordinates: number;
  total_devices: number;
  coordinates_by_source: Record<string, number>;
  coverage: Coverage;
  visible_cooperatives: number[];
}

export interface DeviceListResponse {
  devices: DeviceRow[];
  total: number;
  page: { limit: number; offset: number };
  visible_cooperatives: number[];
  filtered_by_status?: string;
}

/** The only two management payloads the dashboard reads beyond a list. */
export interface CredentialIssueResponse {
  node_id: string;
  credential_id: number;
  superseded_credential_id?: number | null;
  device: DeviceRow;
  now_provisioned: boolean;
  firmware_field: string;
  reflash_required?: boolean;
}

export interface CredentialRevokeResponse {
  node_id: string;
  credential_id: number;
  revoked_at: string;
  was_the_current_credential: boolean;
  device: DeviceRow;
}

export interface DeviceUpdateResponse {
  device: DeviceRow;
  previous_status: NodeStatus;
  allowed_statuses: NodeStatus[];
}

/**
 * One device plus the actions the server says this caller may take on it.
 *
 * `capabilities` stays `string[]` because that is what the wire carries: the names come from
 * `ManagementAction` in `lib/field/types.ts`, and typing them as a closed union here would let the
 * UI assert a capability the server never sent. An unrecognised name simply matches no button.
 */
export interface DeviceDetailResponse {
  device: DeviceRow;
  capabilities: string[];
}

/**
 * One credential as a manager sees it: an id, dates, and a derived state.
 *
 * `hash_algorithm` names the function, not a value. There is no field here that could hold the
 * digest, because the route's column list cannot select one.
 */
export interface CredentialMetadataRow {
  credential_id: number;
  hash_algorithm: string;
  issued_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  state: 'current' | 'expired' | 'retired';
}

export interface CredentialListResponse {
  node_id: string;
  credentials: CredentialMetadataRow[];
  returned: number;
  limit: number;
  /** `partial` when the page is full and older retired rows may sit below it. */
  coverage: Coverage;
  current_credential_id: number | null;
}

/* ------------------------------------------------------------------------------------------
 * Phase 6A — historical analytics
 * ---------------------------------------------------------------------------------------- */

export type HistoryRange = '24h' | '7d' | '30d' | 'custom';

export interface HistoryWindow {
  from: string;
  to: string;
  range: HistoryRange;
  span_ms: number;
}

/** Per-metric statistics, computed from the scanned rows and never from the browser's clock. */
export interface MetricSummary {
  metric: SensorMetricName;
  units: string;
  /** Exact count of readings in the window; `samples` is how many of them carried this quantity. */
  observations_in_window: number;
  samples: number;
  missing: number;
  reporting_rate: number | null;
  minimum: number | null;
  maximum: number | null;
  mean: number | null;
  median: number | null;
  latest_value: number | null;
  latest_measured_at: string | null;
  first_measured_at: string | null;
  at_range_edge: number;
}

export interface ReportingStats {
  observation_count: number;
  first_measured_at: string | null;
  last_measured_at: string | null;
  freshness_seconds: number | null;
  receipt_freshness_seconds: number | null;
  mean_interval_seconds: number | null;
  median_interval_seconds: number | null;
  largest_gap_seconds: number | null;
  gap_threshold_seconds: number | null;
  unexpected_gap_count: number | null;
  reference: 'configured_offline_rule' | 'not_configured';
}

export interface HistoryQuality {
  server_stamped_count: number;
  duplicate_instants: Array<{ measured_at: string; log_ids: number[] }>;
  duplicate_instant_count: number;
  unparseable_timestamp_count: number;
  is_stale: boolean | null;
  stale_after_seconds: number | null;
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
  quality: HistoryQuality;
  buckets: HistoryBucket[];
}

export interface DeviceHistoryResponse {
  device: DeviceRow;
  window: HistoryWindow;
  /** The span the statistics really cover — differs from `window` when the scan hit its cap. */
  scanned_window: HistoryWindow;
  total_in_range: number;
  rows_scanned: number;
  scan_cap: number;
  coverage: Coverage;
  all_time_observations: number;
  offline_window_minutes: number | null;
  summary: HistorySummary;
  rules_coverage: Coverage;
}

/* ------------------------------------------------------------------------------------------
 * Phase 6A — fleet data quality
 * ---------------------------------------------------------------------------------------- */

/**
 * Whether a device has stored readings, and how confidently that can be said.
 * `unknown_scan_truncated` is the honest answer when a bounded scan cannot prove an absence.
 */
export type ObservationState = 'has_observations' | 'none_recorded' | 'never_contacted' | 'unknown_scan_truncated';

export interface FleetDeviceQuality {
  node_id: string;
  name: string;
  status: NodeStatus;
  field_site_id: number | null;
  last_seen_at: string | null;
  heartbeat_age_seconds: number | null;
  last_observed_at: string | null;
  freshness_seconds: number | null;
  observation_state: ObservationState;
  stale_after_minutes: number | null;
  /** Null whenever no operator configured a silence allowance, or nothing was measured. */
  is_stale: boolean | null;
}

export interface MetricMissingness {
  metric: SensorMetricName;
  units: string;
  column: string;
  readings_scanned: number;
  readings_missing: number;
  share: number | null;
  basis: 'scanned_rows_in_window' | 'no_readings_in_window';
}

export interface DataQualityResponse {
  window: HistoryWindow;
  scanned_from: string;
  totals: {
    devices: number;
    never_contacted: number;
    without_observations: number | null;
    without_observations_basis: 'exact' | 'scan_truncated';
    observations_in_window: number;
  };
  scanning: { rows_scanned: number; scan_cap: number; coverage: Coverage };
  reference: { offline_window_minutes: number | null; basis: 'configured_offline_rule' | 'not_configured' };
  stale_devices: { count: number | null; devices_with_a_verdict: number };
  missing_data: MetricMissingness[];
  at_store_bounds: Array<{ metric: SensorMetricName; count: number; bounds: { min: number; max: number } }>;
  duplicates: { instants_with_duplicates: number; rows_involved: number };
  server_stamped: { count: number; share: number | null };
  unparseable_timestamps: number;
  reporting_gaps: { threshold_seconds: number | null; count: number | null; covers_from: string };
  devices: FleetDeviceQuality[];
  rules_coverage: Coverage;
  store_bounds_are_not_thresholds: boolean;
}

/* ------------------------------------------------------------------------------------------
 * Phase 6A — alert management
 * ---------------------------------------------------------------------------------------- */

export interface AlertDeviceBrief {
  node_id: string;
  name: string;
  status: NodeStatus;
  cooperative_id: number | null;
  field_site_id: number | null;
  last_seen_at: string | null;
}

/**
 * One alert, the rule behind it, and what this caller may do next.
 *
 * `rule_note`/`evidence_note`/`basis`-style sentences are not typed here on purpose: they are English
 * log lines, and this screen is rendered in five languages from the stable keys above them.
 */
export interface AlertDetailResponse {
  alert: AlertRow;
  /** Null when the node row behind the alert is gone; no provisioning claim is made either way. */
  device: AlertDeviceBrief | null;
  rule: RuleRow | null;
  evidence: Record<string, unknown> | null;
  status: AlertStatus;
  allowed_transitions: string[];
  capabilities: string[];
}

export interface AlertActionResponse {
  alert: AlertRow;
  previous_status: AlertStatus;
  /** False when the row already held this status, which is a successful retry rather than a write. */
  changed: boolean;
  allowed_transitions: string[];
}
