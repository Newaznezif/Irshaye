import { NODE_ID_PATTERN } from './ingest';
import type { CoordinateSource, ManagementFailure, NodeStatus } from './types';

/**
 * Management payload validation. Pure, and the mirror image of `lib/field/ingest.ts` for the
 * human-facing side of the same tables.
 *
 * The device boundary and this one share a principle: what is refused here has a twin CHECK in the
 * database, so a mistake is reported with the field name that caused it instead of arriving as a
 * Postgres error a route would have to translate after the operator already waited. They differ in
 * one respect worth stating: an invalid *device* payload is usually broken firmware, while an
 * invalid *management* payload is usually a form that sent the wrong shape — so these messages name
 * the expected JSON key rather than the wire rule.
 *
 * Numbers are JSON numbers only, for the same reason ingest refuses `"42.5"`: a caller that sends
 * an id as a string has a bug worth surfacing, and coercing `"12 OR 1=1"` into a row is a lesson
 * this project already learned from the legacy views.
 */

/** Mirrors `hardware_node_name_is_meaningful`. */
const NAME_MIN = 2;
const NAME_MAX = 160;

/** The coordinate provenance `hardware_nodes.coordinate_source` accepts. */
export const COORDINE_SOURCES: readonly CoordinateSource[] = ['device-gnss', 'surveyed', 'operator-entered', 'imported'];

/** The full lifecycle vocabulary `hardware_nodes.status` holds, including the derived one. */
export const ALL_STATUSES: readonly NodeStatus[] = ['active', 'inactive', 'maintenance', 'disabled'];

/**
 * Statuses an operator may set.
 *
 * `inactive` is excluded on purpose: schema `field` defines it as "registered, never yet
 * authenticated", which is a fact about the device's history rather than a wish. An operator who
 * sets it by hand would be asserting that a device which has been reporting for months has never
 * reported, and the offline-alert logic downstream would believe them.
 */
export const OPERATOR_SETTABLE_STATUSES: readonly NodeStatus[] = ['active', 'maintenance', 'disabled'];

export interface DeviceRegistration {
  nodeId: string;
  name: string;
  fieldSiteId: number;
  latitude: number | null;
  longitude: number | null;
  coordinateSource: CoordinateSource | null;
  hardwareModel: string | null;
  firmwareVersion: string | null;
}

export type Validated<T> = { ok: true; value: T } | { ok: false; error: ManagementFailure };

const invalid = (message: string): { ok: false; error: ManagementFailure } => ({
  ok: false,
  error: { code: 'invalid_payload', message },
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Absent or null both mean "not supplied"; anything else must already be the right type. */
function optionalText(source: Record<string, unknown>, key: string, maxLength: number): string | null | 'invalid' {
  const raw = source[key];
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') return 'invalid';
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (trimmed.length > maxLength) return 'invalid';
  return trimmed;
}

function optionalNumber(source: Record<string, unknown>, key: string): number | null | 'invalid' {
  const raw = source[key];
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 'invalid';
  return raw;
}

function positiveId(source: Record<string, unknown>, key: string): number | 'invalid' {
  const raw = source[key];
  if (typeof raw !== 'number' || !Number.isFinite(raw) || !Number.isInteger(raw) || raw < 1) return 'invalid';
  // 2^53 is where a JSON number stops being an exact integer, so a larger "id" is not an id.
  if (raw > Number.MAX_SAFE_INTEGER) return 'invalid';
  return raw;
}

/**
 * The keys a registration must NOT carry, checked before anything else.
 *
 * `validateStatusChange` refuses a body with an unexpected key, and this is the same rule applied
 * where the stakes are the highest: `cooperative_id` here is the owner claim the whole authorization
 * model is built not to trust. Silently ignoring it would be SAFE (the owner comes from the field
 * site's row, and no code path reads this key) but it would also be invisible — a form author who
 * believes they assigned a device to cooperative 12 would get a 201 and a device in somebody else's
 * cooperative, and discover it in the field. A refusal says the rule out loud.
 */
const FORBIDDEN_REGISTRATION_KEYS = ['cooperative_id', 'cooperative', 'role', 'secret_token', 'token', 'token_hash'];

/**
 * Validates a registration and returns the row shape to insert.
 *
 * Note what is NOT in the output: `cooperative_id`. A caller names a field site, and the
 * cooperative is read from that site's row in `managementService.ts`. If this function could emit a
 * cooperative id, a future caller would have something to pass, and the FK would no longer be the
 * only thing tying a device to an organisation.
 */
export function validateRegistration(body: unknown): Validated<DeviceRegistration> {
  if (!isPlainObject(body)) return invalid('Body must be a single JSON object.');

  const forbidden = Object.keys(body).filter((key) => FORBIDDEN_REGISTRATION_KEYS.includes(key.toLowerCase()));
  if (forbidden.length > 0) {
    return invalid(`A registration cannot carry ${forbidden.slice(0, 3).join(', ')}. A device's cooperative comes from the field site it is registered against, and its credential is issued by /credentials — never named here.`);
  }

  const nodeId = body.node_id;
  if (typeof nodeId !== 'string' || !NODE_ID_PATTERN.test(nodeId.trim())) {
    return invalid('node_id must be 3-63 characters of letters, digits, "_", ".", ":" or "-", starting with a letter or digit. It is the identifier written into the device firmware and cannot be changed later without re-provisioning.');
  }

  const name = body.name;
  if (typeof name !== 'string' || name.trim().length < NAME_MIN || name.trim().length > NAME_MAX) {
    return invalid(`name must be ${NAME_MIN}-${NAME_MAX} characters. It is what the device list and the map label show.`);
  }

  const fieldSiteId = positiveId(body, 'field_site_id');
  if (fieldSiteId === 'invalid') {
    return invalid('field_site_id must be a positive integer id of a field site you manage. The cooperative is taken from that site, never from this request.');
  }

  const latitude = optionalNumber(body, 'latitude');
  if (latitude === 'invalid') return invalid('latitude must be a JSON number between -90 and 90, or omitted.');
  const longitude = optionalNumber(body, 'longitude');
  if (longitude === 'invalid') return invalid('longitude must be a JSON number between -180 and 180, or omitted.');

  if ((latitude === null) !== (longitude === null)) {
    return invalid('latitude and longitude arrive together or not at all. A position with one axis is not a place, and plotting it would invent the other.');
  }
  if (latitude !== null && (latitude < -90 || latitude > 90)) return invalid('latitude must be between -90 and 90.');
  if (longitude !== null && (longitude < -180 || longitude > 180)) return invalid('longitude must be between -180 and 180.');

  const coordinateSource = optionalText(body, 'coordinate_source', 32);
  if (coordinateSource === 'invalid') return invalid(`coordinate_source must be one of: ${COORDINE_SOURCES.join(', ')}.`);
  if (coordinateSource !== null && !(COORDINE_SOURCES as readonly string[]).includes(coordinateSource)) {
    return invalid(`coordinate_source must be one of: ${COORDINE_SOURCES.join(', ')}. It says where the position came from, and an unattributed pin cannot be drawn honestly.`);
  }
  if (latitude !== null && coordinateSource === null) {
    return invalid('A device with coordinates must say how they were obtained: coordinate_source is required whenever latitude is present.');
  }
  // The paired rule again from the caller's side: a provenance with no position is a leftover, and
  // silently dropping it would lose the operator's note rather than the data.
  if (latitude === null && coordinateSource !== null) {
    return invalid('coordinate_source was given without a position. Send latitude and longitude too, or omit it.');
  }

  const hardwareModel = optionalText(body, 'hardware_model', 120);
  if (hardwareModel === 'invalid') return invalid('hardware_model must be text of at most 120 characters.');
  const firmwareVersion = optionalText(body, 'firmware_version', 120);
  if (firmwareVersion === 'invalid') return invalid('firmware_version must be text of at most 120 characters.');

  return {
    ok: true,
    value: {
      nodeId: nodeId.trim(),
      name: name.trim(),
      fieldSiteId,
      latitude,
      longitude,
      coordinateSource: (coordinateSource as CoordinateSource | null) ?? null,
      hardwareModel,
      firmwareVersion,
    },
  };
}

/** A status change is the whole of PATCH today; anything else in the body is a mistake, not noise. */
export function validateStatusChange(body: unknown): Validated<{ status: NodeStatus }> {
  if (!isPlainObject(body)) return invalid('Body must be a single JSON object with a status.');

  const unknown = Object.keys(body).filter((key) => key !== 'status');
  if (unknown.length > 0) {
    return invalid(`Only "status" can be changed on this endpoint; it cannot change ${unknown.slice(0, 3).join(', ')} as well.`);
  }

  const status = body.status;
  if (typeof status !== 'string' || !(OPERATOR_SETTABLE_STATUSES as readonly string[]).includes(status)) {
    return invalid(`status must be one of: ${OPERATOR_SETTABLE_STATUSES.join(', ')}. "inactive" is not settable — it means this device has never authenticated, which is history, not intent.`);
  }
  return { ok: true, value: { status: status as NodeStatus } };
}

/**
 * Revocation targets a credential id. `force` is the operator's acknowledgement that the device
 * will be left unable to submit anything until a new credential is issued.
 */
export function validateRevocation(body: unknown): Validated<{ credentialId: number; force: boolean }> {
  if (!isPlainObject(body)) return invalid('Body must be a JSON object with a credential_id.');

  const credentialId = positiveId(body, 'credential_id');
  if (credentialId === 'invalid') return invalid('credential_id must be a positive integer — the id returned when the credential was issued. The secret itself is not accepted and is not needed here.');

  const force = body.force;
  if (force !== undefined && typeof force !== 'boolean') return invalid('force must be true or false, or omitted.');
  return { ok: true, value: { credentialId, force: force === true } };
}

/**
 * Page bounds for the management lists.
 *
 * A device list is bounded because the module brief says so and because an unbounded `select *`
 * across every cooperative a platform administrator belongs to is the kind of query that turns a
 * dashboard into an outage. 100 rows of metadata is a screen nobody scrolls through twice; the
 * offset cap exists so a paging bug fails as a short page rather than as a full-table scan.
 */
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
export const MAX_PAGE_OFFSET = 10_000;

/** Ids in a path segment are caller-chosen text; they must match the column's own shape first. */
export function isWellFormedNodeId(candidate: string | undefined | null): candidate is string {
  return typeof candidate === 'string' && NODE_ID_PATTERN.test(candidate);
}

/**
 * A positive integer id, from a query parameter or a path segment: a number, or nothing, or a shape
 * that is not an id at all.
 *
 * Kept separate from `parseCooperativeFilter` so the same rules apply to a `field_site_id` in a
 * path, where the caller types it freely and a value like `1;drop` must fail as a bad request
 * rather than as a database error. The pattern is deliberately digits-only and bounded: an id that
 * will not fit a JS safe integer is not an id this API can name.
 */
export function parseIdFilter(raw: string | null | undefined): number | null | 'invalid' {
  if (raw === null || raw === undefined || raw.trim() === '') return null;
  if (!/^\d{1,18}$/.test(raw.trim())) return 'invalid';
  const value = Number(raw.trim());
  return Number.isSafeInteger(value) && value >= 1 ? value : 'invalid';
}

/** The `cooperative_id` query filter, which is a number or nothing. */
export function parseCooperativeFilter(raw: string | null): number | null | 'invalid' {
  return parseIdFilter(raw);
}
