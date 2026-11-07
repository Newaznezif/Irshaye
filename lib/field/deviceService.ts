import { getSyncClient, isSyncConfigured } from '@/lib/supabaseAdmin';
import { generateDeviceToken, hashDeviceToken } from './credentials';
import type { CredentialRow, HardwareNodeRow, IngestFailure, PreparedReading } from './types';

/**
 * Server-only data access for schema `field`.
 *
 * This is the module that holds the database service-role key, and it is the only way into the
 * device tables. `lib/supabaseAdmin.ts` reads the key from a variable with no `NEXT_PUBLIC`
 * prefix, so Next.js cannot inline it into a browser bundle, and the module itself refuses to
 * run where `window` exists. The import below reuses that client rather than creating a second
 * one — the name says "sync" because the publisher sync was its first user, but it is the same
 * project, the same role, and the same rules about never echoing the key.
 *
 * Every function returns a discriminated result instead of throwing, because the caller is an
 * HTTP handler that has to answer a device in one shot: a thrown error would surface as a 500
 * with a stack, and the whole point of this layer is that a database problem produces an honest
 * `database_unavailable` and nothing else.
 */

export type FieldDb<T> = { ok: true; value: T } | { ok: false; error: IngestFailure };

/**
 * `not_configured` is a distinct answer from a failure, and the dashboard depends on the
 * difference: "no database has been connected to this deployment" is a setup state a human can
 * act on, while "the database refused" is an outage. Reporting the first as the second would
 * send someone to look for a broken server that was never built.
 */
export function fieldDatabaseStatus(): { ok: true } | { ok: false; error: IngestFailure } {
  const configured = isSyncConfigured();
  if (configured.ok) return { ok: true };
  return {
    ok: false,
    error: {
      code: 'database_not_configured',
      message: `Field Intelligence has no database in this deployment: ${configured.reason} Set up the project and apply supabase/migrations — see docs/field-intelligence-setup.md.`,
    },
  };
}

/**
 * Looks the device up and fetches its current credential in two queries rather than one embed.
 *
 * A `select('*, hardware_node_credentials(*)')` would be one round trip, but PostgREST resolves
 * embeds through the relationship name, and this must keep working after a device has been
 * provisioned with an expired or revoked row; "the current one" is a rule with a WHERE clause,
 * and a WHERE inside an embed is not expressible through the REST layer. Two explicit queries
 * also let the caller tell `unknown_node` from `not_provisioned`, which a device installer
 * standing in a field genuinely needs to distinguish.
 */
export async function getDeviceForIngestion(nodeId: string): Promise<FieldDb<{ node: HardwareNodeRow; credential: CredentialRow | null }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('hardware_nodes')
      .select('node_id,name,cooperative_id,field_site_id,status,latitude,longitude,coordinate_source,hardware_model,firmware_version,last_seen_at,record_added_at,record_replaced_at')
      .eq('node_id', nodeId)
      .maybeSingle();

    if (error) return { ok: false, error: databaseUnavailable('device lookup', error.message) };
    if (!data) return { ok: false, error: { code: 'unknown_node', message: 'No device is registered with that node_id.' } };

    const credential = await client
      .schema('field')
      .from('hardware_node_credentials')
      .select('credential_id,node_id,token_hash,hash_algorithm,created_at,last_used_at,expires_at,revoked_at')
      .eq('node_id', nodeId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (credential.error) return { ok: false, error: databaseUnavailable('credential lookup', credential.error.message) };

    return { ok: true, value: { node: data as HardwareNodeRow, credential: (credential.data as CredentialRow | null) ?? null } };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('device lookup', messageOf(err)) };
  }
}

/**
 * Inserts one accepted reading.
 *
 * `23505` on `sensor_log_replay_uid` is not an error to report as a fault: it means this exact
 * payload for this exact instant is already stored, which is the documented answer to a device
 * that retried after a timeout it did not actually suffer. The caller turns it into 409 and the
 * device stops resending.
 *
 * Any other rejection is returned as `database_unavailable` with the REASON NAME kept server-side
 * only. A Postgres message can contain a column name, a constraint, or a fragment of the failing
 * statement; none of those belong in a response to a device, and `docs/field-intelligence-setup.md`
 * says so where the operator reads it.
 */
export async function recordReading(reading: PreparedReading): Promise<FieldDb<{ logId: number; receivedAt: string }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('sensor_logs')
      .insert({
        node_id: reading.nodeId,
        soil_moisture_pct: reading.measurements.soilMoisturePct,
        ambient_temp_c: reading.measurements.ambientTempC,
        humidity_pct: reading.measurements.humidityPct,
        battery_voltage_v: reading.measurements.batteryVoltageV,
        measured_at: reading.measuredAt,
        time_source: reading.timeSource,
        payload_hash: reading.payloadHash,
        raw_payload: reading.rawPayload,
      })
      .select('log_id, received_at')
      .single();

    if (error) {
      if (error.code === '23505' && error.message.includes('sensor_log_replay_uid')) {
        return { ok: false, error: { code: 'duplicate_reading', message: 'This exact reading has already been stored for this device at this timestamp. Resend it only if the timestamp changes.' } };
      }
      return { ok: false, error: databaseUnavailable('reading insert', error.message) };
    }
    return { ok: true, value: { logId: Number(data.log_id), receivedAt: data.received_at as string } };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('reading insert', messageOf(err)) };
  }
}

/**
 * Stamps the two "we heard from you" columns after a credential has already been verified, so a
 * rejected device can never advance a heartbeat — an offline alarm based on a timestamp a
 * stranger wrote would be a fake.
 *
 * Failure here does not fail the ingestion. The reading is stored and is the thing the field
 * cares about; a missing heartbeat makes the dashboard say "last seen: unknown", which is honest,
 * whereas discarding a stored reading would not be.
 */
export async function markDeviceSeen(nodeId: string, credentialId: number): Promise<{ ok: true } | { ok: false; logged: string }> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return { ok: false, logged: blocked.error.code };

  try {
    const client = getSyncClient();
    const now = new Date().toISOString();
    const seen = await client.schema('field').from('hardware_nodes').update({ last_seen_at: now }).eq('node_id', nodeId);
    const used = await client
      .schema('field')
      .from('hardware_node_credentials')
      .update({ last_used_at: now })
      .eq('credential_id', credentialId);

    if (seen.error || used.error) return { ok: false, logged: databaseUnavailable('heartbeat', `${seen.error?.message ?? used.error?.message ?? 'failed'}`).message };
    return { ok: true };
  } catch (err) {
    return { ok: false, logged: messageOf(err) };
  }
}

/** A registered node that is safe to hand to a response body: no hash, no secret, no raw payload. */
export interface DeviceSummary {
  node_id: string;
  name: string;
  status: HardwareNodeRow['status'];
  cooperative_id: number | null;
  field_site_id: number | null;
  latitude: number | null;
  longitude: number | null;
  coordinate_source: HardwareNodeRow['coordinate_source'];
  hardware_model: string | null;
  firmware_version: string | null;
  last_seen_at: string | null;
  /** True when a current credential exists. The value itself is never readable through any path. */
  provisioned: boolean;
  credential_expires_at: string | null;
}

export function toDeviceSummary(node: HardwareNodeRow, credential: CredentialRow | null): DeviceSummary {
  return {
    node_id: node.node_id,
    name: node.name,
    status: node.status,
    cooperative_id: node.cooperative_id,
    field_site_id: node.field_site_id,
    latitude: node.latitude,
    longitude: node.longitude,
    coordinate_source: node.coordinate_source,
    hardware_model: node.hardware_model,
    firmware_version: node.firmware_version,
    last_seen_at: node.last_seen_at,
    provisioned: credential !== null,
    credential_expires_at: credential?.expires_at ?? null,
  };
}

/**
 * Issues the device's first credential.
 *
 * Returns the plaintext exactly once, in the returned value, and nothing else ever does. The
 * row that is written holds only its digest; the plaintext is not logged, not echoed by the
 * list endpoints, and not recoverable from the database afterwards — which is why the caller must
 * show it to the operator in the same response and why `rotateDeviceCredential` produces a new
 * one instead of fetching this.
 */
export async function provisionDeviceCredential(nodeId: string): Promise<FieldDb<{ credentialId: number; token: string }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  const token = generateDeviceToken();
  return callRotationRpc(nodeId, token);
}

/**
 * Replaces the device's credential. The old secret stops working the instant this returns.
 *
 * Both halves happen inside `field.rotate_device_credential`, in one transaction, because a
 * rotation that revokes successfully and then fails to issue leaves a field device holding a
 * secret the database no longer recognises — recoverable only by visiting the device. That is
 * the reason the function exists rather than two calls here.
 */
export async function rotateDeviceCredential(nodeId: string): Promise<FieldDb<{ credentialId: number; supersededId: number | null; token: string }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  const token = generateDeviceToken();
  const result = await callRotationRpc(nodeId, token);
  if (!result.ok) return result;
  return { ok: true, value: { ...result.value, token } };
}

async function callRotationRpc(nodeId: string, token: string): Promise<FieldDb<{ credentialId: number; supersededId: number | null; token: string }>> {
  const tokenHash = hashDeviceToken(token);
  try {
    const client = getSyncClient();
    const { data, error } = await client.schema('field').rpc('rotate_device_credential', {
      p_node_id: nodeId,
      p_token_hash: tokenHash,
    });

    if (error) {
      // The function's own refusals are operational messages written for a reviewer, and they
      // name no secret; anything else is collapsed to the generic storage failure.
      const refusal = /ROTATE_REFUSED/.test(error.message);
      return {
        ok: false,
        error: refusal
          ? { code: 'invalid_payload', message: error.message.replace(/^ROTATE_REFUSED:\s*/, '') }
          : databaseUnavailable('credential rotation', error.message),
      };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { ok: false, error: databaseUnavailable('credential rotation', 'the function returned no row') };
    return {
      ok: true,
      value: {
        credentialId: Number(row.credential_id),
        supersededId: row.superseded_credential_id === null || row.superseded_credential_id === undefined ? null : Number(row.superseded_credential_id),
        token,
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('credential rotation', messageOf(err)) };
  }
}

/**
 * Retires one credential by id. Refuses to retire the device's only current credential unless
 * `allowUnprovisioned` is set, because a node with no current credential cannot ingest anything,
 * and an operator who means to re-provision should have to say so.
 */
export async function revokeDeviceCredential(credentialId: number, allowUnprovisioned = false): Promise<FieldDb<{ revokedAt: string }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();

    const { data: target, error: lookupError } = await client
      .schema('field')
      .from('hardware_node_credentials')
      .select('credential_id,node_id')
      .eq('credential_id', credentialId)
      .is('revoked_at', null)
      .maybeSingle();

    if (lookupError) return { ok: false, error: databaseUnavailable('credential lookup', lookupError.message) };
    if (!target) return { ok: false, error: { code: 'unknown_credential', message: 'No unrevoked credential carries that id.' } };

    if (!allowUnprovisioned) {
      // A count, not a list: this branch only needs to know whether anything would be left.
      // `head: true` asks PostgREST for the count without the rows.
      const { count, error: countError } = await client
        .schema('field')
        .from('hardware_node_credentials')
        .select('credential_id', { count: 'exact', head: true })
        .eq('node_id', target.node_id)
        .is('revoked_at', null);

      if (countError) return { ok: false, error: databaseUnavailable('credential count', countError.message) };
      if ((count ?? 0) <= 1) {
        return {
          ok: false,
          error: {
            code: 'invalid_payload',
            message: 'This is the device\'s only current credential. Revoking it leaves the node unable to submit readings until a new one is issued; rotate instead, or pass force to revoke without replacing.',
          },
        };
      }
    }

    const revokedAt = new Date().toISOString();
    const { data, error } = await client
      .schema('field')
      .from('hardware_node_credentials')
      // The `revoked_at is null` filter makes this a compare-and-set: a concurrent revocation of
      // the same row wins, and the loser reports `unknown_credential` rather than pretending.
      .update({ revoked_at: revokedAt })
      .eq('credential_id', credentialId)
      .is('revoked_at', null)
      .select('credential_id')
      .maybeSingle();

    if (error) return { ok: false, error: databaseUnavailable('credential revocation', error.message) };
    if (!data) return { ok: false, error: { code: 'unknown_credential', message: 'No unrevoked credential carries that id.' } };
    return { ok: true, value: { revokedAt } };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('credential revocation', messageOf(err)) };
  }
}

/**
 * The one shape every Field Intelligence database failure takes, exported because
 * `managementService.ts` reports the same failure with the same wording: a caller must not be able
 * to tell "the ingestion layer could not reach the database" from "the management layer could not".
 * `detail` never leaves the process.
 */
export function databaseUnavailable(operation: string, detail: string): IngestFailure {
  // `detail` never leaves the process; it is folded into a name-only console line so an operator
  // can correlate the failure with a request without the response carrying any of it.
  console.error(`Field Intelligence: ${operation} failed (${detail.slice(0, 200)})`);
  return { code: 'database_unavailable', message: `The Field Intelligence database could not complete ${operation}. Nothing was stored.` };
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'unknown error';
}
