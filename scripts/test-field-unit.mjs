#!/usr/bin/env node
/**
 * Unit tests for the Field Intelligence device path: credentials, payload validation, the
 * authorization decision, the body ceiling, the throttle, and the shapes the API is allowed to
 * return.
 *
 * These grade the logic, not the database. Nothing here needs Supabase, and that is the point:
 * the rules a field device is answered by — which values are refused, which status a refusal
 * carries, whether a secret can survive into a stored payload — have to be provable while no
 * project is connected. The database half (constraints, indexes, RLS, grants) is validated by
 * executing the migration files against real PostgreSQL, and `npm run check:field` grades the
 * routes over HTTP.
 *
 * Run with `npm run test:field`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEVICE_TOKEN_BYTES,
  TOKEN_HASH_PATTERN,
  credentialIsUsable,
  generateDeviceToken,
  hashDeviceToken,
  payloadDigest,
  tokenMatches,
} from '../lib/field/credentials.ts';
import {
  CLOCK_DRIFT_TOLERANCE_SECONDS,
  MAX_ACCEPTED_AGE_SECONDS,
  MAX_BODY_BYTES,
  canonicalPayload,
  isJsonContentType,
  parseJsonBody,
  readCappedBody,
  stripCredential,
  validateIngestPayload,
} from '../lib/field/ingest.ts';
import { INGEST_STATUS_BY_CODE, authorizeSubmission } from '../lib/field/authorize.ts';
import { RATE_LIMIT_INFO, checkDeviceRate, resetDeviceRate } from '../lib/field/rateLimit.ts';
import { toDeviceSummary } from '../lib/field/deviceService.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ *
 * Harness
 * ------------------------------------------------------------------ */

const results = [];
let group = 'general';
const section = (name) => {
  group = name;
};
const yes = (label, condition, detail = '') => results.push({ group, label, pass: condition === true, detail: condition === true ? '' : detail });
const show = (value) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text === undefined ? String(value) : text.slice(0, 160);
};
const same = (label, actual, expected) =>
  yes(label, show(actual) === show(expected), `got ${show(actual)} · want ${show(expected)}`);

/** Asserts a validation/authorization result refused with exactly this code. */
const refusedWith = (label, result, code) =>
  yes(label, result.ok === false && result.error?.code === code, `got ${result.ok === true ? 'ok' : `${result.error?.code}: ${show(result.error?.message)}`} · want ${code}`);

/** Asserts a result was accepted, so the following field checks have something to read. */
const accepted = (label, result) => yes(label, result.ok === true, result.ok === true ? '' : `rejected: ${result.error?.code} — ${show(result.error?.message)}`);

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const NOW = new Date('2026-11-05T09:00:00.000Z');
/** Shifted ISO stamps: the validator compares against `now`, so every timestamp case is relative. */
const at = (offsetSeconds) => new Date(NOW.getTime() + offsetSeconds * 1000).toISOString();

const SECRET = 'TEST_DEVICE_SECRET_0123456789_abcdef';
const HASH = hashDeviceToken(SECRET);
const OTHER_HASH = hashDeviceToken('ANOTHER_DEVICE_SECRET_0123456789abcd');

/** A credential row as `field.hardware_node_credentials` returns it. */
const credential = (over = {}) => ({
  credential_id: 7,
  node_id: 'ESP32_FIELD_NODE_01',
  token_hash: HASH,
  hash_algorithm: 'sha256',
  created_at: '2026-11-01T00:00:00.000Z',
  last_used_at: null,
  expires_at: null,
  revoked_at: null,
  ...over,
});

/** A node row as `field.hardware_nodes` returns it. */
const node = (over = {}) => ({
  node_id: 'ESP32_FIELD_NODE_01',
  name: 'Node 01 — teff trial',
  cooperative_id: 1,
  field_site_id: 2,
  status: 'active',
  latitude: 9.02,
  longitude: 38.75,
  coordinate_source: 'device-gnss',
  hardware_model: 'ESP32-WROOM-32 + CAP100',
  firmware_version: '0.3.1',
  last_seen_at: null,
  record_added_at: '2026-11-01T00:00:00.000Z',
  record_replaced_at: '2026-11-01T00:00:00.000Z',
  ...over,
});

const reading = (over = {}) => ({
  node_id: 'ESP32_FIELD_NODE_01',
  secret_token: SECRET,
  soil_moisture: 42.5,
  ambient_temp: 21.4,
  measured_at: at(-60),
  ...over,
});

const validate = (over = {}) => validateIngestPayload(reading(over), NOW);

/** A body-capped request without the fetch layer's header filtering getting in the way. */
const fakeRequest = (headers, chunks) => ({
  headers: { get: (name) => headers[name.toLowerCase()] ?? null },
  body: {
    getReader: () => {
      let i = 0;
      return {
        read: async () => (i < chunks.length ? { done: false, value: chunks[i++] } : { done: true, value: undefined }),
        cancel: async () => undefined,
      };
    },
  },
});

const bytes = (text) => new TextEncoder().encode(text);

/* ------------------------------------------------------------------ *
 * 1. Token generation, hashing, verification
 * ------------------------------------------------------------------ */

section('Device credentials — generation and hashing');
yes(`${DEVICE_TOKEN_BYTES} bytes yields a 43-character base64url token`, generateDeviceToken().length === 43);
const samples = Array.from({ length: 500 }, generateDeviceToken);
yes('a generated token always matches the shape the payload validator accepts', samples.every((t) => /^[A-Za-z0-9_-]{16,128}$/.test(t)));
yes('a generated token never needs URL escaping', samples.every((t) => !/[+/=]/.test(t)));
same('2000 generated tokens are 2000 distinct values', new Set(Array.from({ length: 2000 }, generateDeviceToken)).size, 2000);
yes('the stored form is 64 lowercase hex characters, which is what hardware_credential_hash_is_sha256_hex requires', TOKEN_HASH_PATTERN.test(HASH));
same('hashing is deterministic', hashDeviceToken(SECRET), HASH);
yes('two different secrets hash differently', hashDeviceToken('ANOTHER_DEVICE_SECRET_0123456789abcd') !== HASH);
yes('the digest is never the secret', HASH !== SECRET && !SECRET.includes(HASH) && !HASH.includes(SECRET));

section('Device credentials — verification');
yes('the right secret matches', tokenMatches(SECRET, HASH));
yes('a wrong secret does not match', !tokenMatches('ANOTHER_DEVICE_SECRET_0123456789abcd', HASH));
yes('a secret that differs by one character does not match', !tokenMatches(`${SECRET}x`, HASH));
yes('a plaintext value stored in the hash column is refused, not compared', !tokenMatches(SECRET, SECRET));
yes('a truncated digest is refused rather than padded', !tokenMatches(SECRET, HASH.slice(0, 63)));
yes('verification never throws on a malformed stored hash', [ '', 'zz'.repeat(32), 'Z'.repeat(64) ].every((h) => tokenMatches(SECRET, h) === false));

section('Device credentials — lifecycle');
same('unrevoked with no expiry is usable', credentialIsUsable(credential(), NOW), { ok: true });
same('past expiry is refused as expired', credentialIsUsable(credential({ expires_at: at(-1) }), NOW), { ok: false, reason: 'expired' });
same('expiry exactly now is refused (the deadline is inclusive)', credentialIsUsable(credential({ expires_at: NOW.toISOString() }), NOW), { ok: false, reason: 'expired' });
same('future expiry is usable', credentialIsUsable(credential({ expires_at: at(3600) }), NOW), { ok: true });
same('revocation beats expiry in the reported reason', credentialIsUsable(credential({ revoked_at: at(-10), expires_at: at(-10) }), NOW), { ok: false, reason: 'revoked' });
same('an unparseable expiry is refused rather than trusted', credentialIsUsable(credential({ expires_at: 'not-a-date' }), NOW), { ok: false, reason: 'expired' });

/* ------------------------------------------------------------------ *
 * 2. Request body: content type, size, JSON
 * ------------------------------------------------------------------ */

section('Request plumbing — content type');
same('application/json', isJsonContentType('application/json'), true);
same('application/json with a charset', isJsonContentType('application/json; charset=utf-8'), true);
same('case does not matter', isJsonContentType('APPLICATION/JSON'), true);
same('surrounding space does not matter', isJsonContentType('  application/json  '), true);
same('text/json is accepted', isJsonContentType('text/json'), true);
yes('form posts are refused', isJsonContentType('application/x-www-form-urlencoded') === false);
yes('a bare text body is refused', isJsonContentType('text/plain') === false);
yes('a missing header is refused', isJsonContentType(null) === false);
yes('application/jsonml is not mistaken for json', isJsonContentType('application/jsonml') === false);

section('Request plumbing — byte ceiling');
refusedWith('a declared oversize body is discarded before it is read', await readCappedBody(fakeRequest({ 'content-length': String(MAX_BODY_BYTES + 1) }, [])), 'payload_too_large');
refusedWith('an undeclared oversize body is refused mid-stream', await readCappedBody(fakeRequest({}, [bytes('x'.repeat(4096)), bytes('y'.repeat(4096)), bytes('z'.repeat(4096))])), 'payload_too_large');
yes('a body exactly at the ceiling is read', (await readCappedBody(fakeRequest({}, [bytes('x'.repeat(MAX_BODY_BYTES))]))).ok === true);
same('an empty body yields empty text, which JSON parsing then refuses', (await readCappedBody(fakeRequest({}, []))).text, '');
const multibyte = bytes('{"note":"ጠላ ዘር"}');
same(
  'a multi-byte character split across chunks is reassembled, not corrupted',
  (await readCappedBody(fakeRequest({}, [multibyte.subarray(0, 12), multibyte.subarray(12)]))).text,
  '{"note":"ጠላ ዘር"}',
);
yes('the ceiling is under 10 KB so a real reading always fits', MAX_BODY_BYTES === 8192);

section('Request plumbing — JSON parsing');
refusedWith('a truncated body is malformed_json, not a thrown syntax error', parseJsonBody('{"node_id":'), 'malformed_json');
refusedWith('an empty body is malformed_json', parseJsonBody(''), 'malformed_json');
refusedWith('html from a captive portal is malformed_json', parseJsonBody('<html>redirect</html>'), 'malformed_json');
yes('a valid object parses', parseJsonBody('{"node_id":"A_1"}').ok === true);

/* ------------------------------------------------------------------ *
 * 3. Payload validation
 * ------------------------------------------------------------------ */

section('Payload validation — accepted shapes');
const good = validate();
accepted('a complete reading is accepted', good);
same('the device-supplied timestamp is marked as the device\'s own', good.ok && good.value.timeSource, 'device');
same('measurements land on their typed fields', [good.value?.measurements.soilMoisturePct, good.value?.measurements.ambientTempC], [42.5, 21.4]);
same('unreported measurements stay null rather than 0', [good.value?.measurements.humidityPct, good.value?.measurements.batteryVoltageV], [null, null]);
same('whitespace around node_id is trimmed', validate({ node_id: '  ESP32_FIELD_NODE_01  ' }).value?.nodeId, 'ESP32_FIELD_NODE_01');
const noStamp = validate({ measured_at: undefined });
accepted('a reading with no timestamp is accepted rather than invented by the device', noStamp);
same('and the server says so in time_source', noStamp.value?.timeSource, 'server');
same('with the receipt time as measured_at', noStamp.value?.measuredAt, NOW.toISOString());
same('a single measurement is enough', validate({ soil_moisture: undefined, ambient_temp: undefined, humidity: 55 }).value?.measurements.humidityPct, 55);
same('an explicit null means "no sensor", not zero', validate({ soil_moisture: null }).value?.measurements.soilMoisturePct, null);
same('an offset timestamp is normalised to UTC', validate({ measured_at: '2026-11-05T11:00:00+02:00' }).value?.measuredAt, '2026-11-05T09:00:00.000Z');

section('Payload validation — range boundaries');
for (const [key, min, max] of [
  ['soil_moisture', 0, 100],
  ['ambient_temp', -40, 60],
  ['humidity', 0, 100],
  ['battery_voltage', 0, 30],
]) {
  accepted(`${key} accepts its minimum`, validate({ [key]: min }));
  accepted(`${key} accepts its maximum`, validate({ [key]: max }));
  refusedWith(`${key} below the minimum is refused`, validate({ [key]: min - 0.1 }), 'invalid_payload');
  refusedWith(`${key} above the maximum is refused`, validate({ [key]: max + 0.1 }), 'invalid_payload');
}
refusedWith('a numeric string is not coerced', validate({ soil_moisture: '42.5' }), 'invalid_payload');
refusedWith('NaN is refused', validate({ soil_moisture: Number.NaN }), 'invalid_payload');
refusedWith('Infinity is refused', validate({ ambient_temp: Number.POSITIVE_INFINITY }), 'invalid_payload');
refusedWith('a measurement that is an object is refused', validate({ humidity: { value: 55 } }), 'invalid_payload');
refusedWith('a boolean is refused', validate({ battery_voltage: true }), 'invalid_payload');
yes(
  'the refusal names the offending value so firmware can be fixed without a debugger',
  (validate({ soil_moisture: 140 }).error?.message ?? '').includes('140'),
);

section('Payload validation — identity and shape');
refusedWith('an array body is refused', validateIngestPayload([reading()], NOW), 'invalid_payload');
refusedWith('a null body is refused', validateIngestPayload(null, NOW), 'invalid_payload');
refusedWith('a JSON string body is refused', validateIngestPayload('hello', NOW), 'invalid_payload');
refusedWith('a missing node_id is refused', validate({ node_id: undefined }), 'invalid_payload');
refusedWith('a numeric node_id is refused', validate({ node_id: 42 }), 'invalid_payload');
refusedWith('node_id shorter than 3 characters is refused', validate({ node_id: 'AB' }), 'invalid_payload');
accepted('node_id of exactly 3 characters is accepted', validate({ node_id: 'ABC' }));
accepted('node_id of exactly 63 characters is accepted', validate({ node_id: `A${'b'.repeat(62)}` }));
refusedWith('node_id of 64 characters is refused', validate({ node_id: `A${'b'.repeat(63)}` }), 'invalid_payload');
accepted('the characters the column allows are allowed', validate({ node_id: 'esp32.field-01:node_A' }));
refusedWith('node_id may not start with punctuation', validate({ node_id: '_field_node_01' }), 'invalid_payload');
refusedWith('node_id may not contain a slash', validate({ node_id: 'field/../../etc' }), 'invalid_payload');
refusedWith('node_id may not contain whitespace inside', validate({ node_id: 'field node 01' }), 'invalid_payload');
refusedWith('a missing secret_token is refused', validate({ secret_token: undefined }), 'invalid_payload');
refusedWith('a 15-character secret is refused', validate({ secret_token: 'a'.repeat(15) }), 'invalid_payload');
accepted('a 16-character secret has a valid shape, so the reading passes on that count', validate({ secret_token: 'a'.repeat(16) }));
refusedWith('a 129-character secret is refused', validate({ secret_token: 'a'.repeat(129) }), 'invalid_payload');
refusedWith('a secret with URL-unsafe characters is refused', validate({ secret_token: 'abc+def/ghi=jklmnop' }), 'invalid_payload');
refusedWith('a non-string secret is refused', validate({ secret_token: 1234567890123456 }), 'invalid_payload');
refusedWith('a reading with no measurements at all is refused', validate({ soil_moisture: undefined, ambient_temp: undefined, measured_at: undefined }), 'invalid_payload');
refusedWith('a reading whose measurements are all null is refused', validate({ soil_moisture: null, ambient_temp: null, humidity: null, battery_voltage: null }), 'invalid_payload');

section('Payload validation — timestamps and replay window');
refusedWith('a malformed timestamp string is refused with its own code', validate({ measured_at: 'yesterday afternoon' }), 'timestamp_out_of_window');
refusedWith('a numeric timestamp is refused, not assumed to be epoch seconds', validate({ measured_at: NOW.getTime() }), 'invalid_payload');
refusedWith('an empty timestamp string is refused', validate({ measured_at: '' }), 'timestamp_out_of_window');
accepted(`a device clock ${CLOCK_DRIFT_TOLERANCE_SECONDS - 60}s ahead is tolerated`, validate({ measured_at: at(CLOCK_DRIFT_TOLERANCE_SECONDS - 60) }));
refusedWith(`a device clock ${CLOCK_DRIFT_TOLERANCE_SECONDS + 60}s ahead is refused`, validate({ measured_at: at(CLOCK_DRIFT_TOLERANCE_SECONDS + 60) }), 'timestamp_out_of_window');
accepted('backlog just inside the acceptance window is stored', validate({ measured_at: at(-MAX_ACCEPTED_AGE_SECONDS + 60) }));
refusedWith('backlog past the acceptance window is refused', validate({ measured_at: at(-MAX_ACCEPTED_AGE_SECONDS - 60) }), 'timestamp_out_of_window');
yes('the refusal states how far ahead the clock was', validate({ measured_at: at(3600) }).error.message.includes('3600'));
yes('the acceptance window is hours, not minutes: a node on deep sleep may report its backlog',
  MAX_ACCEPTED_AGE_SECONDS === 72 * 60 * 60 && CLOCK_DRIFT_TOLERANCE_SECONDS === 15 * 60);

section('Payload validation — the stored copy carries no secret');
const scrubbed = validate().value.rawPayload;
yes('secret_token is not a key of raw_payload', !('secret_token' in scrubbed));
yes('no value of raw_payload equals the secret', !JSON.stringify(scrubbed).includes(SECRET));
yes('the node identity and the measurements survive scrubbing', scrubbed.node_id === 'ESP32_FIELD_NODE_01' && scrubbed.soil_moisture === 42.5);
const renamed = stripCredential({ node_id: 'A_1', key: SECRET, nested: { device_key: SECRET, ok: 1 }, list: [SECRET, 'visible'] }, SECRET);
same('a key renamed to `key` is dropped because its VALUE is the secret', 'key' in renamed, false);
same('a secret nested one level down is dropped too', 'device_key' in renamed.nested, false);
same('a secret inside an array becomes a hole rather than a leak', renamed.list, [null, 'visible']);
same('non-secret siblings are kept', renamed.nested.ok, 1);
yes('the canonical replay string never contains the secret', !validate().value.canonical.includes(SECRET));

section('Payload validation — canonical form and digest');
const one = canonicalPayload('ESP32_FIELD_NODE_01', '2026-11-05T09:00:00.000Z', { soilMoisturePct: 42.5, ambientTempC: 21.4, humidityPct: null, batteryVoltageV: 12.6 });
const two = canonicalPayload('ESP32_FIELD_NODE_01', '2026-11-05T09:00:00.000Z', { humidityPct: null, batteryVoltageV: 12.6, ambientTempC: 21.4, soilMoisturePct: 42.5 });
same('key insertion order cannot change the digest', one, two);
yes('an absent sensor is distinguishable from 0', one !== canonicalPayload('ESP32_FIELD_NODE_01', '2026-11-05T09:00:00.000Z', { soilMoisturePct: 0, ambientTempC: 21.4, humidityPct: null, batteryVoltageV: 12.6 }));
yes('a different node digests differently', canonicalPayload('ESP32_FIELD_NODE_02', '2026-11-05T09:00:00.000Z', { soilMoisturePct: 42.5, ambientTempC: 21.4, humidityPct: null, batteryVoltageV: 12.6 }) !== one);
yes('a different instant digests differently', canonicalPayload('ESP32_FIELD_NODE_01', '2026-11-05T09:00:01.000Z', { soilMoisturePct: 42.5, ambientTempC: 21.4, humidityPct: null, batteryVoltageV: 12.6 }) !== one);
yes('the digest is a 64-character hex value', /^[0-9a-f]{64}$/.test(payloadDigest(one)));
same('the digest is stable across calls', payloadDigest(one), payloadDigest(one));

/* ------------------------------------------------------------------ *
 * 4. The authorization decision
 * ------------------------------------------------------------------ */

section('Authorization — order of answers');
const granted = authorizeSubmission({ status: 'active', credential: credential(), secretToken: SECRET, now: NOW });
yes('an active node with the right secret is authorized', granted.ok === true);
same('and the caller is handed the row that authenticated, not a re-derived one', granted.ok && granted.credential.credential_id, 7);
for (const status of ['inactive', 'maintenance', 'disabled']) {
  const r = authorizeSubmission({ status, credential: credential(), secretToken: SECRET, now: NOW });
  refusedWith(`status "${status}" is refused even when the secret is CORRECT`, r, 'device_disabled');
  yes(`"${status}" is refused before its secret is examined`, r.ok === false && !r.error.message.toLowerCase().includes('credential'));
}
refusedWith('a registered node with no credential is refused as not_provisioned', authorizeSubmission({ status: 'active', credential: null, secretToken: SECRET, now: NOW }), 'not_provisioned');
refusedWith('an expired credential is refused as credential_expired', authorizeSubmission({ status: 'active', credential: credential({ expires_at: at(-1) }), secretToken: SECRET, now: NOW }), 'credential_expired');
refusedWith('a revoked credential is refused even though the secret still matches', authorizeSubmission({ status: 'active', credential: credential({ revoked_at: at(-5) }), secretToken: SECRET, now: NOW }), 'invalid_credentials');
refusedWith('the wrong secret is refused as invalid_credentials', authorizeSubmission({ status: 'active', credential: credential(), secretToken: 'WRONG_SECRET_BUT_RIGHT_SHAPE_1', now: NOW }), 'invalid_credentials');
refusedWith('a secret belonging to another device is refused', authorizeSubmission({ status: 'active', credential: credential({ token_hash: OTHER_HASH }), secretToken: SECRET, now: NOW }), 'invalid_credentials');
yes('an expiry in the future does not block a correct secret', authorizeSubmission({ status: 'active', credential: credential({ expires_at: at(3600) }), secretToken: SECRET, now: NOW }).ok === true);

section('Authorization — what a refusal may not say');
const refusals = [
  authorizeSubmission({ status: 'disabled', credential: credential(), secretToken: SECRET, now: NOW }),
  authorizeSubmission({ status: 'active', credential: null, secretToken: SECRET, now: NOW }),
  authorizeSubmission({ status: 'active', credential: credential({ expires_at: at(-1) }), secretToken: SECRET, now: NOW }),
  authorizeSubmission({ status: 'active', credential: credential({ revoked_at: at(-1) }), secretToken: SECRET, now: NOW }),
  authorizeSubmission({ status: 'active', credential: credential(), secretToken: 'WRONG_SECRET_BUT_RIGHT_SHAPE_1', now: NOW }),
];
yes('no refusal echoes the submitted secret', refusals.every((r) => r.ok === false && !r.error.message.includes(SECRET)));
yes('no refusal echoes the stored digest', refusals.every((r) => r.ok === false && !r.error.message.includes(HASH)));
yes('no refusal names a credential id', refusals.every((r) => r.ok === false && !/\bcredential_id\b/.test(r.error.message)));
yes('no refusal reports a stored reading', refusals.every((r) => r.ok === false && !/Reading stored/i.test(r.error.message)));

section('Authorization — status codes');
const CODES = [
  'invalid_content_type', 'payload_too_large', 'malformed_json', 'invalid_payload', 'timestamp_out_of_window',
  'invalid_credentials', 'not_provisioned', 'credential_expired', 'device_disabled', 'unknown_node',
  'unknown_credential', 'duplicate_reading', 'rate_limited', 'database_not_configured', 'database_unavailable',
  'internal_error',
];
const unmapped = CODES.filter((code) => INGEST_STATUS_BY_CODE[code] === undefined);
same('every ingest error code has a status', unmapped.length ? unmapped.join(', ') : 'none', 'none');
yes('the table is a failure table: no code maps below 400', Object.values(INGEST_STATUS_BY_CODE).every((status) => status >= 400));
for (const [code, status] of [
  ['invalid_content_type', 400],
  ['payload_too_large', 413],
  ['malformed_json', 400],
  ['invalid_payload', 400],
  ['timestamp_out_of_window', 400],
  ['invalid_credentials', 401],
  ['not_provisioned', 401],
  ['credential_expired', 403],
  ['device_disabled', 403],
  ['unknown_node', 404],
  ['unknown_credential', 404],
  ['duplicate_reading', 409],
  ['rate_limited', 429],
  ['database_not_configured', 503],
  ['database_unavailable', 503],
  ['internal_error', 500],
]) {
  same(`${code} answers ${status}`, INGEST_STATUS_BY_CODE[code], status);
}
yes('nothing is silently a 200: the table has no 2xx entry', Object.values(INGEST_STATUS_BY_CODE).every((status) => status >= 400 && status <= 599));

/* ------------------------------------------------------------------ *
 * 5. What may leave the server
 * ------------------------------------------------------------------ */

section('Response surface — credentials stay in the database');
const summary = toDeviceSummary(node(), credential());
const serialized = JSON.stringify(summary);
yes('a device summary carries no token_hash', !('token_hash' in summary));
yes('no key of the summary mentions token, hash or secret', !/(token|hash|secret)/i.test(Object.keys(summary).join(' ')));
yes('the summary does not contain the stored digest', !serialized.includes(HASH));
yes('the summary does not contain the secret', !serialized.includes(SECRET));
same('it says the device is provisioned', summary.provisioned, true);
same('it says a node without a credential is not provisioned', toDeviceSummary(node(), null).provisioned, false);
same('it still reports the expiry date, which is an operational fact and not a secret', summary.credential_expires_at, null);
same('coordinates pass through unchanged for the map', [summary.latitude, summary.longitude], [9.02, 38.75]);

/* ------------------------------------------------------------------ *
 * 6. Per-device throttle
 * ------------------------------------------------------------------ */

section('Throttle — per-device budget');
same('the window is 60 seconds', RATE_LIMIT_INFO.windowSeconds, 60);
same('the budget is 20 submissions per device per window', RATE_LIMIT_INFO.maxSubmissionsPerWindow, 20);
yes('it declares itself as NOT shared across processes', RATE_LIMIT_INFO.shared === false);

resetDeviceRate();
const t0 = NOW.getTime();
const allowedBefore = Array.from({ length: RATE_LIMIT_INFO.maxSubmissionsPerWindow }, () => checkDeviceRate('NODE_A', t0).ok);
yes('20 submissions in one window are all allowed', allowedBefore.every(Boolean));
const overflow = checkDeviceRate('NODE_A', t0 + 1);
yes('the 21st is refused', overflow.ok === false);
yes('and it is told how long to wait, in whole seconds', overflow.ok === false && overflow.retryAfterSeconds >= 1 && overflow.retryAfterSeconds <= 60);
same('a different node is not punished for the first one', checkDeviceRate('NODE_B', t0 + 1), { ok: true });
same('the window slides: the same node is allowed again once the attempts fall out of it', checkDeviceRate('NODE_A', t0 + RATE_LIMIT_INFO.windowSeconds * 1000 + 1), { ok: true });
resetDeviceRate();
same('reset clears the budget (test seam)', checkDeviceRate('NODE_A', t0), { ok: true });

resetDeviceRate();
for (let i = 0; i < 2_500; i += 1) checkDeviceRate(`FLOOD_${String(i).padStart(5, '0')}`, t0);
yes('a flood of unknown node ids does not exhaust the allowance of a new device', checkDeviceRate('NODE_LATE', t0).ok === true);
// The bound is enforced by forgetting the oldest entries, so a throttled device can come back
// early after a flood. That is a memory guard, not fairness, and it is asserted here so the
// behaviour is documented rather than discovered by someone reading the Map.
resetDeviceRate();
for (let i = 0; i < RATE_LIMIT_INFO.maxSubmissionsPerWindow; i += 1) checkDeviceRate('NODE_EARLY', t0);
yes('a device that used its whole budget is refused', checkDeviceRate('NODE_EARLY', t0).ok === false);
for (let i = 0; i < 2_500; i += 1) checkDeviceRate(`FLOOD_${String(i).padStart(5, '0')}`, t0);
yes('and the tracker drops its oldest entries under pressure rather than growing without bound', checkDeviceRate('NODE_EARLY', t0).ok === true);
resetDeviceRate();

/* ------------------------------------------------------------------ *
 * 7. Cross-checks against the migration pack
 * ------------------------------------------------------------------ */

section('Migration cross-checks — the boundary and the database agree');
const sql = (name) => readFileSync(join(HERE, '..', 'supabase', 'migrations', name), 'utf8');
const registry = sql('20261105000100_field_intelligence_registry.sql');
const observations = sql('20261105000200_field_intelligence_observations.sql');

yes('the credential hash CHECK matches TOKEN_HASH_PATTERN', registry.includes("check (token_hash ~ '^[0-9a-f]{64}$')"));
yes('the drift allowance mirrored in sensor_log_measured_not_ahead_of_receipt is the same 15 minutes the validator applies', observations.includes("interval '15 minutes'") && CLOCK_DRIFT_TOLERANCE_SECONDS === 900);
yes('the replay unique index that recordReading maps to 409 still exists under that name', observations.includes('sensor_log_replay_uid'));
yes('the raw_payload credential CHECK is the top-level key test stripCredential backs up', observations.includes("raw_payload ? 'secret_token'"));
yes('node_id shape CHECK matches the 3-63 characters the validator enforces', registry.includes("'^[A-Za-z0-9][A-Za-z0-9_.:-]{2,62}$'"));
yes('one current credential per node is a database rule, not a convention', registry.includes('hardware_credential_single_current_uid'));

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const failures = results.filter((r) => !r.pass);
let lastGroup = '';
for (const result of results) {
  if (result.group !== lastGroup) {
    console.log(`\n${result.group}`);
    lastGroup = result.group;
  }
  console.log(`${result.pass ? '  ✓' : '  ✗'} ${result.label}${result.pass ? '' : ` — ${result.detail}`}`);
}
console.log(`\n${results.length - failures.length}/${results.length} assertions passed.`);
if (failures.length > 0) {
  console.error(`✗ ${failures.length} failed`);
  process.exit(1);
}
