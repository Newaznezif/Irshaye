/**
 * Shared vocabulary for the Field Intelligence module.
 *
 * These shapes mirror schema `field` in supabase/migrations/20261105000100 and 000200, column
 * for column. Where the database spells a unit out (`soil_moisture_pct`, `ambient_temp_c`,
 * `battery_voltage_v`) the TypeScript keeps the same suffix: a field named `moisture` is a
 * field somebody will later read as a ratio, and this project's one permanent rule is that no
 * number travels without its unit.
 *
 * Nothing here is a UI type. Presentation models live in the components that need them.
 */

export type NodeStatus = 'active' | 'inactive' | 'maintenance' | 'disabled';

/** `device` = the payload carried its own timestamp. `server` = we supplied the receipt time. */
export type ReadingTimeSource = 'device' | 'server';

export type CoordinateSource = 'device-gnss' | 'surveyed' | 'operator-entered' | 'imported';

/** A registered device, exactly as `field.hardware_nodes` holds it. */
export interface HardwareNodeRow {
  node_id: string;
  name: string;
  cooperative_id: number | null;
  field_site_id: number | null;
  status: NodeStatus;
  latitude: number | null;
  longitude: number | null;
  coordinate_source: CoordinateSource | null;
  hardware_model: string | null;
  firmware_version: string | null;
  last_seen_at: string | null;
  record_added_at: string;
  record_replaced_at: string;
}

/**
 * One issued credential. `token_hash` is server-only: it is compared inside the ingestion
 * route and is never placed in a response, a log line, or a client-visible type. Code that
 * renders a device must use `DeviceSummary` in lib/field/deviceService.ts instead of this row.
 */
export interface CredentialRow {
  credential_id: number;
  node_id: string;
  token_hash: string;
  hash_algorithm: 'sha256';
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
}

/** The measurements a device may report. All optional; at least one must be present. */
export interface SensorMeasurements {
  soilMoisturePct: number | null;
  ambientTempC: number | null;
  humidityPct: number | null;
  batteryVoltageV: number | null;
}

/** A reading accepted for insertion, in the column names of `field.sensor_logs`. */
export interface PreparedReading {
  nodeId: string;
  measuredAt: string;
  timeSource: ReadingTimeSource;
  measurements: SensorMeasurements;
  payloadHash: string;
  /** The request body with `secret_token` removed. Insertion refuses it otherwise. */
  rawPayload: Record<string, unknown>;
}

/**
 * Stable, client-safe codes for the hardware API. The read routes reuse `SourceErrorCode` from
 * lib/data/types.ts; this route is a WRITE with a device in front of it, and a firmware loop
 * branches on these strings, so they are named apart and never renamed casually.
 */
export type IngestErrorCode =
  | 'invalid_content_type'
  | 'payload_too_large'
  | 'malformed_json'
  | 'invalid_payload'
  | 'timestamp_out_of_window'
  | 'unknown_node'
  | 'not_provisioned'
  | 'invalid_credentials'
  | 'credential_expired'
  | 'unknown_credential'
  | 'device_disabled'
  | 'rate_limited'
  | 'duplicate_reading'
  | 'database_not_configured'
  | 'database_unavailable'
  | 'internal_error';

export interface IngestFailure {
  code: IngestErrorCode;
  /** Safe to show a device operator. Never a stack, a column name, or an upstream body. */
  message: string;
  retryAfterSeconds?: number;
}

/* ------------------------------------------------------------------------------------------
 * Device management (authenticated, cooperative-scoped) — schema `app`
 * ---------------------------------------------------------------------------------------- */

/** Mirrors `app.cooperative_members.role`. Two roles: see capabilityOf in lib/field/access.ts. */
export type CooperativeRole = 'manager' | 'viewer';

/** A current membership as the server read it. Note what is absent: no user id, no cooperative name. */
export interface Membership {
  cooperative_id: number;
  role: CooperativeRole;
}

/**
 * The audited actions. Every value must exist in
 * `management_audit_action_in` in 20261106000200 — `npm run test:field` compares the two lists,
 * because an action recorded in code but missing from the CHECK would fail the insert and lose the
 * very event the trail keeps.
 *
 * The second block is the dashboard's read surface. Those actions are named and auditable for the
 * same reason the write ones are: a refusal to read is an access-control event, and "who kept
 * trying to see another cooperative's field history" is a question the trail has to answer even
 * though a successful read is deliberately not recorded.
 */
export type ManagementAction =
  | 'device_register'
  | 'device_update'
  | 'device_status_change'
  | 'credential_provision'
  | 'credential_rotate'
  | 'credential_revoke'
  | 'device_list'
  | 'device_view'
  | 'overview_read'
  | 'site_list'
  | 'site_view'
  | 'observation_read'
  | 'alert_list'
  | 'map_read'
  // Phase 6A: the alert and credential surfaces. `alert_view` is a read, while acknowledging,
  // resolving and listing a device's credential metadata are manager actions — which `capabilityOf`
  // expresses by NOT listing these four in its read set.
  | 'alert_view'
  | 'alert_acknowledge'
  | 'alert_resolve'
  | 'credential_list';

export type AuditOutcome = 'success' | 'refused' | 'failed';

/**
 * The values a `detail` object may hold. Deliberately not `unknown`: an audit row is built from a
 * small set of identifiers the code names explicitly, never from a request body, and a value type
 * this narrow is what makes "no credential in the trail" a structural property rather than a hope.
 */
export type AuditDetailValue = string | number | boolean | null;

export interface AuditEntry {
  /** ISO-8601, supplied by `auditEntry` rather than the database, so a test can pin the instant. */
  occurredAt: string;
  action: ManagementAction;
  outcome: AuditOutcome;
  actorUserId: string;
  actorRole: CooperativeRole | null;
  cooperativeId: number | null;
  nodeId: string | null;
  reasonCode: string | null;
  detail: Record<string, AuditDetailValue>;
}

/**
 * Stable codes for the management API. It is `IngestErrorCode` extended rather than a parallel
 * union, because the two surfaces genuinely share nine answers (`invalid_payload`, `unknown_node`,
 * `unknown_credential`, the two database states, ...) and a code that means one thing to a device
 * and another thing to a person is how a firmware loop ends up branching on the wrong string. The
 * additions are the ones only a session-bearing caller can be given.
 */
export type ManagementErrorCode =
  | IngestErrorCode
  | 'unauthenticated'
  | 'auth_unavailable'
  | 'not_a_member'
  | 'insufficient_role'
  | 'unknown_site'
  | 'unknown_alert'
  | 'device_exists'
  | 'credential_exists';

export interface ManagementFailure {
  code: ManagementErrorCode;
  /** Safe to show an operator. Never a stack, a constraint name, or another cooperative's data. */
  message: string;
}
