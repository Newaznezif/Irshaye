import { NextResponse } from 'next/server';

import { evaluateStoredReading } from '@/lib/field/alertService';
import { authorizeSubmission, INGEST_STATUS_BY_CODE } from '@/lib/field/authorize';
import { payloadDigest } from '@/lib/field/credentials';
import { fieldDatabaseStatus, getDeviceForIngestion, markDeviceSeen, recordReading } from '@/lib/field/deviceService';
import {
  CLOCK_DRIFT_TOLERANCE_SECONDS,
  MAX_ACCEPTED_AGE_SECONDS,
  MAX_BODY_BYTES,
  isJsonContentType,
  parseJsonBody,
  readCappedBody,
  validateIngestPayload,
  type ValidatedIngest,
} from '@/lib/field/ingest';
import { RATE_LIMIT_INFO, checkDeviceRate } from '@/lib/field/rateLimit';
import type { SensorReadingRow } from '@/lib/field/observationService';
import type { HardwareNodeRow, IngestFailure } from '@/lib/field/types';

/**
 * POST /api/v1/hardware/logs — the device ingestion endpoint.
 *
 * This is the only route in the project that a machine authenticates to. The browser-facing
 * routes are either public reads (`/api/data/*`) or session-guarded (`verifyCaller`), and neither
 * model fits an ESP32: it has no session, no user, and no way to complete an OAuth flow. So the
 * credential is a per-device secret issued once at provisioning, held by the device, and stored
 * here only as its SHA-256 digest.
 *
 * The answer order is the security order:
 *   1. content type      — refuse a form POST before parsing it as anything
 *   2. byte ceiling      — refuse while streaming, before the body is ever materialised
 *   3. JSON parse        — a device that cannot send JSON learns that first
 *   4. payload shape     — identity and ranges, checked before any database round trip
 *   5. per-device budget — an unauthenticated flood is throttled by node_id
 *   6. node lookup       — is this device registered at all
 *   7. status, credential lifecycle, digest comparison — `authorizeSubmission`, lib/field/authorize.ts
 * then the insert, then the heartbeat.
 *
 * Steps 1-4 run before the database is touched, so a rejected request costs this deployment
 * nothing but CPU, and a flooded endpoint cannot turn into a query storm. Step 5 precedes 6 for
 * the same reason: the throttle is keyed on an attacker-chosen string, and it must be cheap.
 *
 * After the insert and the heartbeat, the configured alert rules covering this device are evaluated
 * and the outcome is reported additively in `data.alert_evaluation`. That step cannot change this
 * response: an alert is a judgement derived from the reading, and the reading is the fact.
 *
 * The envelope is `{ ok, message, timestamp, data }`, plus `error: { code, message }` on failure.
 * It carries no `provenance` block, unlike the data routes: provenance describes an external
 * publisher, and the provenance of a sensor row IS the device that sent it — so `node_id`,
 * `measured_at`, `received_at` and `time_source` are in `data` instead.
 *
 * This module needs the Node.js runtime (`node:crypto` in lib/field/credentials.ts), which is the
 * default for every route here and is never switched to `edge` anywhere.
 */

/**
 * `cache-control: no-store` goes on every answer, success or refusal: a cached "unauthorized"
 * would lock a working device out for the cache lifetime, and a cached reading would let one
 * submission be replayed as though it were current.
 */
function refused(error: IngestFailure): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      message: error.message,
      error: { code: error.code, message: error.message, ...(error.retryAfterSeconds ? { retryAfterSeconds: error.retryAfterSeconds } : {}) },
      timestamp: new Date().toISOString(),
      data: null,
    },
    {
      status: INGEST_STATUS_BY_CODE[error.code],
      headers: {
        'cache-control': 'no-store',
        ...(error.code === 'invalid_credentials' || error.code === 'not_provisioned' ? { 'www-authenticate': 'Bearer realm="irshaye-device"' } : {}),
        ...(error.retryAfterSeconds ? { 'retry-after': String(error.retryAfterSeconds) } : {}),
      },
    },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const now = new Date();

  if (!isJsonContentType(request.headers.get('content-type'))) {
    return refused({
      code: 'invalid_content_type',
      message: 'Content-Type must be application/json. Send the reading as a JSON body with content-type: application/json.',
    });
  }

  const body = await readCappedBody(request);
  if (!body.ok) return refused(body.error);

  const parsed = parseJsonBody(body.text);
  if (!parsed.ok) return refused(parsed.error);

  const validated = validateIngestPayload(parsed.value, now);
  if (!validated.ok) return refused(validated.error);

  const payload = validated.value;

  const rate = checkDeviceRate(payload.nodeId, now.getTime());
  if (!rate.ok) {
    return refused({
      code: 'rate_limited',
      message: `${RATE_LIMIT_INFO.maxSubmissionsPerWindow} submissions per ${RATE_LIMIT_INFO.windowSeconds}s per device. This node exceeded that and the reading was not stored; send it again after retry_after_seconds or it is lost. Note this budget is per server process, not global.`,
      retryAfterSeconds: rate.retryAfterSeconds,
    });
  }

  const device = await getDeviceForIngestion(payload.nodeId);
  if (!device.ok) return refused(device.error);

  const authority = authorizeSubmission({
    status: device.value.node.status,
    credential: device.value.credential,
    secretToken: payload.secretToken,
    now,
  });
  if (!authority.ok) return refused(authority.error);
  // The row that actually authenticated, kept for the heartbeat stamp rather than re-derived.
  const credential = authority.credential;

  const stored = await recordReading({
    nodeId: payload.nodeId,
    measuredAt: payload.measuredAt,
    timeSource: payload.timeSource,
    measurements: payload.measurements,
    payloadHash: payloadDigest(payload.canonical),
    rawPayload: payload.rawPayload,
  });
  if (!stored.ok) return refused(stored.error);

  const heartbeat = await markDeviceSeen(payload.nodeId, credential.credential_id);

  // Alert evaluation runs AFTER the reading is stored and is never allowed to change this response's
  // status. The brief's rule is explicit — a failed evaluation must not corrupt ingestion — and the
  // reasoning is worth keeping: the stored row is the field's own data, while an alert is a derived
  // judgement about it. Refusing a valid reading because the judgement could not be computed would
  // lose the evidence to answer "what did it actually report", which is the question an operator asks
  // after an alerting failure. Everything that goes wrong here is reported in `alert_evaluation`
  // instead, and the reading stays accepted.
  const evaluation = await evaluateForIngestion({ node: device.value.node, reading: storedReading(payload, stored.value) });

  return NextResponse.json(
    {
      ok: true,
      message: 'Reading stored.',
      timestamp: new Date().toISOString(),
      data: {
        log_id: stored.value.logId,
        node_id: payload.nodeId,
        measured_at: payload.measuredAt,
        received_at: stored.value.receivedAt,
        time_source: payload.timeSource,
        // Only the fields this device actually reported, echoed under the names it sent them
        // under, so a firmware author can see at once that a sensor landed on the right column
        // and at the right scale.
        stored: storedMeasurements(payload),
        // A lost heartbeat does not invalidate the reading; it is reported as lost rather than
        // quietly dropped, so the dashboard's "last seen" can say it is unknown instead of wrong.
        heartbeat_recorded: heartbeat.ok,
        // Additive since Phase 6A: what the configured rules made of this reading. The existing
        // fields above are unchanged, so a firmware build written before alerting exists keeps
        // parsing this response exactly as it did.
        alert_evaluation: evaluation,
      },
    },
    { status: 201, headers: { 'cache-control': 'no-store' } },
  );
}

/**
 * The stored row, as the evaluator sees it.
 *
 * Built from the payload that was validated and the two columns the insert returned — `log_id` and
 * `received_at` come from the database, not from the clock in this process, so the evidence an alert
 * cites is the row that exists rather than a reconstruction of it.
 */
function storedReading(payload: ValidatedIngest, stored: { logId: number; receivedAt: string }): SensorReadingRow {
  return {
    log_id: stored.logId,
    node_id: payload.nodeId,
    measured_at: payload.measuredAt,
    received_at: stored.receivedAt,
    time_source: payload.timeSource,
    soil_moisture_pct: payload.measurements.soilMoisturePct,
    ambient_temp_c: payload.measurements.ambientTempC,
    humidity_pct: payload.measurements.humidityPct,
    battery_voltage_v: payload.measurements.batteryVoltageV,
  };
}

/**
 * One call, one report. The report never throws and never carries a driver message: a device that
 * cannot reach the alerting side of this deployment is not the device's problem to parse, and a
 * Postgres string in a firmware log is a support ticket nobody can read.
 */
async function evaluateForIngestion(input: { node: HardwareNodeRow; reading: SensorReadingRow }): Promise<Record<string, unknown>> {
  try {
    const evaluated = await evaluateStoredReading(input);
    if (!evaluated.ok) {
      return { performed: false, reason: evaluated.error.code };
    }

    const outcome = evaluated.value;
    return {
      performed: outcome.evaluated,
      rules_considered: outcome.rules_considered,
      raised: outcome.raised,
      confirmed: outcome.confirmed,
      resolved: outcome.resolved,
      suppressed: outcome.suppressed,
      skipped: outcome.skipped,
      failures: outcome.failures,
      triggered_by: outcome.triggered_by,
      note:
        outcome.rules_considered === 0
          ? 'No alert rule covers this device, so there was nothing to evaluate. Alerts are raised only against thresholds a manager of this cooperative has configured — the platform sets none of its own.'
          : outcome.failures.length > 0
            ? 'The reading is stored. Part of the alert evaluation did not complete; `failures` names the step and the code, and the server log has the reason.'
            : 'The reading is stored and evaluated against every rule that covers this device.',
    };
  } catch (err) {
    console.error(`Field Intelligence: alert evaluation threw for ${input.node.node_id} (${err instanceof Error ? err.message.slice(0, 200) : 'unknown error'})`);
    return { performed: false, reason: 'evaluation_threw' };
  }
}

function storedMeasurements(payload: ValidatedIngest): Record<string, number> {
  const reported: Record<string, number | null> = {
    soil_moisture: payload.measurements.soilMoisturePct,
    ambient_temp: payload.measurements.ambientTempC,
    humidity: payload.measurements.humidityPct,
    battery_voltage: payload.measurements.batteryVoltageV,
  };
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(reported)) {
    if (value !== null) out[key] = value;
  }
  return out;
}

/**
 * GET — the endpoint's own contract, for whoever is writing the firmware.
 *
 * No credential is needed because it discloses nothing but this server's rules. It is the
 * readable alternative to guessing why a device got a 400, and it names the limits instead of
 * burying them in a document nobody opens at 6am in a field.
 */
export async function GET(): Promise<NextResponse> {
  const database = fieldDatabaseStatus();
  return NextResponse.json(
    {
      ok: true,
      message: 'Send a device reading with POST.',
      timestamp: new Date().toISOString(),
      data: {
        method: 'POST',
        content_type: 'application/json',
        max_body_bytes: MAX_BODY_BYTES,
        required_fields: ['node_id', 'secret_token'],
        optional_fields: ['soil_moisture (%, 0-100)', 'ambient_temp (deg C, -40..60)', 'humidity (%, 0-100)', 'battery_voltage (V, 0-30)', 'measured_at (ISO-8601)'],
        rules: {
          at_least_one_measurement: true,
          credentials: 'secret_token is the device secret issued once at provisioning. It is stored only as a SHA-256 digest and never returned by any endpoint.',
          clock_drift_tolerance_seconds: CLOCK_DRIFT_TOLERANCE_SECONDS,
          max_accepted_age_seconds: MAX_ACCEPTED_AGE_SECONDS,
          replay: 'A node_id + measured_at + payload digest already present is refused with 409 duplicate_reading, so a retry after a timeout you did not suffer cannot double-store.',
          rate_limit: { ...RATE_LIMIT_INFO, note: 'process-local: not a shared guarantee across serverless instances' },
          alert_evaluation: 'Once a reading is stored, the alert rules that cover this device are evaluated in the same request and the outcome is reported in data.alert_evaluation. Nothing in that evaluation changes this response status: a stored reading is accepted even when alerting cannot run.',
        },
        // Names and booleans only — never a value, never a key.
        database_configured: database.ok,
        setup_documentation: 'docs/field-intelligence-setup.md',
      },
    },
    { status: 200, headers: { 'cache-control': 'no-store' } },
  );
}
