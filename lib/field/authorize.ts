import { credentialIsUsable, tokenMatches } from './credentials';
import type { CredentialRow, IngestErrorCode, IngestFailure, NodeStatus } from './types';

/**
 * The device authorization decision, kept apart from the HTTP layer on purpose.
 *
 * `lib/data/api.ts` holds the read routes' code→status table and their response builders, so this
 * module is the Field Intelligence equivalent for the one route that WRITES from an untrusted
 * machine: a pure function from (node status, credential row, submitted secret, now) to a verdict,
 * plus the table that turns a verdict into a status. Both are testable without a database and
 * without a running server, which is the only way either could be tested at all while no Supabase
 * project is connected.
 */

/**
 * Which HTTP status each refusal answers with, and why it is not the same table as the data
 * routes': `lib/data/api.ts` maps `payload_too_large` to 502 because there it means an UPSTREAM
 * response was oversized, while here it means this caller's request body was, which is 413. The
 * brief's list (201/400/401/403/404/429/500) is kept for every case it covers; three statuses are
 * added where the generic one would be a worse instruction to a device:
 *
 * - `413` for an oversized body — a firmware that loops on 400 will retry the same 200 KB payload
 *   forever; 413 plus the byte count in the message is actionable.
 * - `409` for `duplicate_reading` — the reading is already stored. Retrying it is the opposite of
 *   the right response, so it must not look like a 500.
 * - `503` for `database_not_configured` / `database_unavailable` — this deployment cannot check
 *   anything. That is `lib/serverSupabase.ts`'s existing meaning for `auth_unavailable`, and a
 *   device should back off and retry, not treat its own payload as wrong.
 */
export const INGEST_STATUS_BY_CODE: Record<IngestErrorCode, number> = {
  invalid_content_type: 400,
  payload_too_large: 413,
  malformed_json: 400,
  invalid_payload: 400,
  timestamp_out_of_window: 400,
  invalid_credentials: 401,
  not_provisioned: 401,
  credential_expired: 403,
  device_disabled: 403,
  unknown_node: 404,
  unknown_credential: 404,
  duplicate_reading: 409,
  rate_limited: 429,
  database_not_configured: 503,
  database_unavailable: 503,
  internal_error: 500,
};

export type Authority = { ok: true; credential: CredentialRow } | { ok: false; error: IngestFailure };

/**
 * Decides whether a well-formed payload may be stored, in the order an operator needs to read it.
 *
 * A device that is not `active` is refused before its secret is examined, so a retired or
 * handed-over node cannot probe whether an old credential still works, and because "your node is
 * switched off in Device Management" is the answer that saves someone re-flashing firmware in the
 * rain.
 *
 * A revoked row never reaches here: the credential query asks for `revoked_at is null`, so a
 * revoked secret simply has nothing to match and comes back as `invalid_credentials`. The revoked
 * branch below is kept for a caller that hands this function a row it read elsewhere.
 *
 * Nothing in the refusals echoes the submitted secret, a hash of it, the credential id, or the
 * expiry of a credential belonging to a different device.
 *
 * The reasons ARE distinguishable, which does tell a caller that this `node_id` is registered.
 * That is accepted deliberately: `node_id` is printed on the device and appears in every
 * provisioning sheet and dashboard row, so it is not the secret — `secret_token` is. Folding the
 * eight steps into one indistinguishable "rejected" would leave an installer standing in a field
 * with no way to tell "not registered yet" from "wrong credential", and those two are fixed by
 * completely different actions.
 */
export function authorizeSubmission(input: {
  status: NodeStatus;
  credential: CredentialRow | null;
  secretToken: string;
  now?: Date;
}): Authority {
  const now = input.now ?? new Date();

  if (input.status !== 'active') {
    return refuse(
      'device_disabled',
      `This node's status is "${input.status}" and only active nodes may submit readings. Nothing was stored. Set it to active in Device Management when the device is back in service.`,
    );
  }

  if (input.credential === null) {
    return refuse(
      'not_provisioned',
      'This node is registered but has no current credential, so there is nothing to compare the submitted secret against. Provision it in Device Management.',
    );
  }

  const usable = credentialIsUsable(input.credential, now);
  if (!usable.ok && usable.reason === 'expired') {
    return refuse(
      'credential_expired',
      `This credential passed its expiry date (${input.credential.expires_at}). The device must be rotated to receive a new secret; nothing was stored.`,
    );
  }
  if (!usable.ok && usable.reason === 'revoked') {
    return refuse('invalid_credentials', 'This device\'s credential has been revoked. Nothing was stored.');
  }

  if (!tokenMatches(input.secretToken, input.credential.token_hash)) {
    return refuse(
      'invalid_credentials',
      'The secret_token in the body does not match this node\'s credential. Nothing was stored, and it is not echoed back. Re-provision the device and update its configuration.',
    );
  }

  return { ok: true, credential: input.credential };
}

function refuse(code: IngestErrorCode, message: string): { ok: false; error: IngestFailure } {
  return { ok: false, error: { code, message } };
}
