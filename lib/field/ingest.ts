import type { IngestFailure, ReadingTimeSource, SensorMeasurements } from './types';

/**
 * Ingestion payload validation. Pure: no database, no network, no clock it does not receive.
 *
 * Every rule here has a twin in schema `field` (the CHECK constraints and unique indexes in
 * supabase/migrations/20261105000200), and that is deliberate rather than redundant. The
 * database is the authority — a constraint is the only defence that exists when somebody adds a
 * second write path and forgets this file — but a device in a field cannot read a Postgres
 * error, so the boundary answers with the reason, in the field's own name, before a round trip
 * is spent. The two sets were checked against each other by executing both: the harness in
 * docs/field-intelligence-setup.md shows each rejected value failing on the constraint named
 * here.
 *
 * Numbers arrive as JSON numbers only. A firmware that sends `"soil_moisture": "42.5"` is
 * rejected rather than coerced, because a device that stringifies its measurements has usually
 * also mis-scaled them, and silently accepting the string would bury that bug in a row of
 * plausible-looking data.
 */

/** A sensor payload is four numbers and an identifier. Anything bigger is not a reading. */
export const MAX_BODY_BYTES = 8 * 1024;

/**
 * A device clock may run ahead of the server by this much before the reading is refused: 15
 * minutes, which is also what `sensor_log_measured_not_ahead_of_receipt` allows in the table, so
 * a value that clears the boundary cannot be refused by the column. Change one, change both.
 */
export const CLOCK_DRIFT_TOLERANCE_SECONDS = 15 * 60;

/**
 * How stale a reading may be and still be accepted. 72 hours is the interval a node on deep-sleep
 * can be offline for and still report its backlog, and it is the window inside which
 * `measured_at` is still worth charting. Older than this, the device is telling us about last
 * week, and the honest answer is to refuse and say why rather than to draw a three-day-old point
 * beside a live one.
 */
export const MAX_ACCEPTED_AGE_SECONDS = 72 * 60 * 60;

/**
 * Mirrors `hardware_node_id_is_stable`, and exported because the management route registers the
 * same identifier a device later authenticates with: two copies of this pattern is how a node
 * becomes registrable and unauthenticable.
 */
export const NODE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,62}$/;

/** Mirrors `hardware_credential_hash_is_sha256_hex`'s caller side: a usable secret, not a hash. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

const RANGES: Record<keyof SensorMeasurements, { min: number; max: number; json: string }> = {
  soilMoisturePct: { min: 0, max: 100, json: 'soil_moisture' },
  ambientTempC: { min: -40, max: 60, json: 'ambient_temp' },
  humidityPct: { min: 0, max: 100, json: 'humidity' },
  batteryVoltageV: { min: 0, max: 30, json: 'battery_voltage' },
};

export type ValidatedIngest = {
  nodeId: string;
  secretToken: string;
  /** ISO-8601, always set: the device's own timestamp, or the receipt time when it sent none. */
  measuredAt: string;
  timeSource: ReadingTimeSource;
  measurements: SensorMeasurements;
  /** The body as received, with the credential removed. See `stripCredential`. */
  rawPayload: Record<string, unknown>;
  /** The exact string the digest is taken over; stored nowhere itself. */
  canonical: string;
};

export type IngestValidation = { ok: true; value: ValidatedIngest } | { ok: false; error: IngestFailure };

const failure = (code: IngestFailure['code'], message: string): { ok: false; error: IngestFailure } => ({
  ok: false,
  error: { code, message },
});

/**
 * Strict JSON content type. A form POST arrives as `application/x-www-form-urlencoded` and its
 * body is not JSON, so accepting it on a lenient read would parse into nothing and store a row
 * that means nothing.
 */
export function isJsonContentType(header: string | null): boolean {
  if (!header) return false;
  const mediaType = header.split(';')[0].trim().toLowerCase();
  return mediaType === 'application/json' || mediaType === 'text/json';
}

/** JSON.parse with the failure turned into a device-readable answer, not a thrown syntax error. */
export function parseJsonBody(text: string): { ok: true; value: unknown } | { ok: false; error: IngestFailure } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return failure(
      'malformed_json',
      'Body is not valid JSON. Expected e.g. {"node_id":"ESP32_FIELD_NODE_01","secret_token":"…","soil_moisture":42.5}',
    );
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNumber(source: Record<string, unknown>, jsonKey: string): number | null | 'invalid' {
  const raw = source[jsonKey];
  // Absent, an explicit null, and undefined all mean "this sensor reported nothing". JSON.parse
  // never produces an undefined value, so the second form only arrives from hand-built objects —
  // but treating it as a missing sensor is what `measured_at` already does, and a device should
  // not be refused for a distinction it cannot express on the wire.
  if (raw === undefined || raw === null) return null;
  // typeof, not `Number(raw)`: `'42'` would coerce, and a firmware that stringifies its floats
  // is a firmware with a scaling bug that must not be papered over.
  if (typeof raw !== 'number') return 'invalid';
  if (!Number.isFinite(raw)) return 'invalid';
  return raw;
}

/**
 * The whole of the request-body contract, in one function.
 *
 * Order matters for what a device learns: identity first (is this a shape we can even route?),
 * then the timestamp, then the measurements. An unauthenticated probe is therefore rejected for
 * being unauthenticated rather than for having a bad humidity value, which is the order that
 * leaks least about what the server knows.
 */
export function validateIngestPayload(body: unknown, now: Date = new Date()): IngestValidation {
  if (!isPlainObject(body)) {
    return failure('invalid_payload', 'Body must be a single JSON object.');
  }

  const nodeId = body.node_id;
  if (typeof nodeId !== 'string' || !NODE_ID_PATTERN.test(nodeId.trim())) {
    return failure(
      'invalid_payload',
      'node_id must be 3-63 characters of letters, digits, "_", ".", ":" or "-", starting with a letter or digit. It is the identifier printed on the device.',
    );
  }

  const secretToken = body.secret_token;
  if (typeof secretToken !== 'string' || !TOKEN_PATTERN.test(secretToken)) {
    return failure(
      'invalid_payload',
      'secret_token must be the 16-128 character credential issued to this device at provisioning. It is never shown again after that one response.',
    );
  }

  const measurements: SensorMeasurements = {
    soilMoisturePct: null,
    ambientTempC: null,
    humidityPct: null,
    batteryVoltageV: null,
  };
  for (const [field, range] of Object.entries(RANGES) as [keyof SensorMeasurements, (typeof RANGES)[keyof typeof RANGES]][]) {
    const value = readNumber(body, range.json);
    if (value === 'invalid') {
      return failure(
        'invalid_payload',
        `${range.json} must be a finite JSON number between ${range.min} and ${range.max}. A missing sensor must be omitted or sent as null, never as 0 or an empty string.`,
      );
    }
    if (value === null) continue;
    if (value < range.min || value > range.max) {
      return failure(
        'invalid_payload',
        `${range.json} is ${value}, outside the supported range ${range.min} to ${range.max}. This reading was not stored.`,
      );
    }
    measurements[field] = value;
  }

  const reported = Object.values(measurements).some((v) => v !== null);
  if (!reported) {
    return failure(
      'invalid_payload',
      'At least one measurement is required: soil_moisture, ambient_temp, humidity or battery_voltage. A row of nothing is not a reading, and storing one would render an empty line and call it data.',
    );
  }

  const measuredAt = timestampFrom(body.measured_at, now);
  if (!measuredAt.ok) return measuredAt;

  return {
    ok: true,
    value: {
      nodeId: nodeId.trim(),
      secretToken,
      measuredAt: measuredAt.value.measuredAt,
      timeSource: measuredAt.value.timeSource,
      measurements,
      rawPayload: stripCredential(body, secretToken),
      canonical: canonicalPayload(nodeId.trim(), measuredAt.value.measuredAt, measurements),
    },
  };
}

/**
 * `measured_at` is optional by design: an ESP32 without an RTC or an NTP fix cannot honestly
 * state when it sampled, and the alternative — letting firmware invent a timestamp — is how a
 * chart fills up with readings dated to the epoch.
 *
 * When it is absent the server's receipt time is used and the row says so in `time_source`, so
 * the UI can state that the measurement time is ours, not the device's.
 */
function timestampFrom(raw: unknown, now: Date): { ok: true; value: { measuredAt: string; timeSource: ReadingTimeSource } } | { ok: false; error: IngestFailure } {
  if (raw === undefined || raw === null) {
    return { ok: true, value: { measuredAt: now.toISOString(), timeSource: 'server' } };
  }
  if (typeof raw !== 'string') {
    return failure('invalid_payload', 'measured_at must be an ISO-8601 string such as "2026-11-05T09:30:00Z", or omitted.');
  }
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) {
    return failure('timestamp_out_of_window', `measured_at "${raw.slice(0, 40)}" is not a date this server can parse. Send ISO-8601 with a timezone offset.`);
  }

  const driftSeconds = (now.getTime() - parsed) / 1000;
  if (driftSeconds < -CLOCK_DRIFT_TOLERANCE_SECONDS) {
    return failure(
      'timestamp_out_of_window',
      `measured_at is ${Math.round(-driftSeconds)} s ahead of this server, past the ${CLOCK_DRIFT_TOLERANCE_SECONDS}s allowance. Check the device clock or NTP sync; a future-dated reading would sort after every real one.`,
    );
  }
  if (driftSeconds > MAX_ACCEPTED_AGE_SECONDS) {
    return failure(
      'timestamp_out_of_window',
      `measured_at is ${Math.round(driftSeconds / 3600)} h old, past the ${Math.round(MAX_ACCEPTED_AGE_SECONDS / 3600)}h acceptance window. Backlog older than this is not charted as though it had just arrived.`,
    );
  }
  return { ok: true, value: { measuredAt: new Date(parsed).toISOString(), timeSource: 'device' } };
}

/**
 * Key order is fixed by construction, and nulls are written explicitly, so the same reading
 * always digests to the same value. `JSON.stringify` alone would not: it preserves whatever key
 * order the parsed object happened to have, and two firmwares that emit the fields in a
 * different order would then look like two different readings of one instant.
 */
export function canonicalPayload(nodeId: string, measuredAt: string, m: SensorMeasurements): string {
  return [
    nodeId,
    measuredAt,
    num(m.soilMoisturePct),
    num(m.ambientTempC),
    num(m.humidityPct),
    num(m.batteryVoltageV),
  ].join('|');
}

function num(value: number | null): string {
  return value === null ? '~' : String(value);
}

/**
 * Removes the credential from the copy that is stored in `raw_payload`.
 *
 * Storing the body as received would write every device secret into the database in plaintext —
 * the exact thing the hash-only rule forbids — so this is not a nicety. The walk is recursive and
 * drops (a) any key named `secret_token`, at any depth, and (b) any string value that equals the
 * submitted token, because a firmware that renames the field, or nests it inside a `{"cfg":{…}}`
 * object, must still not be able to persist the secret.
 *
 * `field.sensor_log_raw_carries_no_credential` is the backstop for the top-level key only — the
 * database cannot search a jsonb tree for an unknown value — so this function is the one that
 * carries the guarantee at depth, and a nested-array-within-an-object payload is covered by it.
 */
export function stripCredential(source: Record<string, unknown>, secretToken: string): Record<string, unknown> {
  return scrub(source, secretToken) as Record<string, unknown>;
}

function scrub(value: unknown, secretToken: string): unknown {
  if (Array.isArray(value)) return value.map((item) => scrub(item, secretToken));
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'secret_token') continue;
      if (typeof nested === 'string' && nested === secretToken) continue;
      out[key] = scrub(nested, secretToken);
    }
    return out;
  }
  // A bare string equal to the token can only arrive here as an array element; a key would have
  // been dropped with its value. Left as null so the array's shape is still recognisable.
  return typeof value === 'string' && value === secretToken ? null : value;
}

/**
 * Reads a request body with a hard byte ceiling.
 *
 * `request.text()` has no size limit, and Next.js route handlers on serverless runtimes will
 * hand the whole body over first, so the ceiling has to be enforced while streaming: a client
 * that PUTs 200 MB would otherwise be buffered by the function before any of the validation
 * below ever ran.
 */
export async function readCappedBody(request: Request, maxBytes = MAX_BODY_BYTES): Promise<{ ok: true; text: string } | { ok: false; error: IngestFailure }> {
  const declared = Number(request.headers.get('content-length') ?? '');
  if (Number.isFinite(declared) && declared > maxBytes) {
    return failure('payload_too_large', `Request body is ${declared} bytes; the limit for a reading is ${maxBytes}.`);
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: true, text: '' };

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return failure('payload_too_large', `Request body exceeded ${maxBytes} bytes and was discarded unread.`);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder('utf-8').decode(bytes) };
}
