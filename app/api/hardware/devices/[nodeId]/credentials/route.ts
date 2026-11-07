import type { NextRequest } from 'next/server';

import { intParam } from '@/lib/data/api';
import { provisionDeviceCredential, toDeviceSummary } from '@/lib/field/deviceService';
import { completed, issued, loadAndAuthorize, openManagement, refused } from '@/lib/field/managementApi';
import { credentialsMetadata } from '@/lib/field/managementService';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/field/registration';

/**
 * `/api/hardware/devices/[nodeId]/credentials` — the device's credential record.
 *
 * `GET` lists its metadata; `POST` issues its FIRST credential. Both authorize against the device in
 * the path and both are manager-only: `capabilityOf('credential_list')` is `manage`, so a viewer who
 * may read the device may not even enumerate its secrets.
 *
 * `POST` — the plaintext secret appears in exactly one place in this project: the `device_secret`
 * field of this response, and of the rotation response next door. Nothing else ever returns it,
 * nothing logs it, and `app.management_audit` has CHECK constraints that refuse the field name — so
 * an operator who loses it rotates the credential rather than recovering it, which is the intended
 * design and is what the message below says.
 *
 * This route refuses when a current credential already exists, rather than quietly issuing a second
 * one. A node with two live secrets is a node whose rotation cannot be verified, and
 * `hardware_credential_single_current_uid` would refuse the insert anyway; answering 409 with the
 * route to call is kinder than relaying a constraint violation.
 */

/**
 * `GET` — the ids a revocation needs.
 *
 * Closing the gap §6 asks about: `POST /credentials/revoke` takes a `credential_id`, and until now
 * the only ids an operator could name were the ones a provision or rotate response happened to
 * return. A manager looking at a device that still has a retired row had no way to find that row's
 * id, so the capability was documented and unreachable.
 *
 * What comes back is metadata only — id, issue time, last use, expiry, revocation, hash ALGORITHM,
 * and a derived state. Never `token_hash`, never a plaintext, never anything a response could replay
 * as a device: the column list this query names does not include the digest, so the guarantee is
 * structural rather than a filter that could be forgotten in a later edit.
 *
 * `state` is derived from the row rather than stored, because the schema does not hold a state
 * column: `retired` is `revoked_at IS NOT NULL`, `expired` is a current row whose `expires_at` has
 * passed, and `current` is the database's own definition —
 * `hardware_credential_single_current_uid` allows at most one row per node with `revoked_at IS NULL`.
 * A device whose current credential has expired authenticates nowhere, and that is a state a manager
 * has to be able to see in order to fix it.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ nodeId: string }> }): Promise<Response> {
  const { nodeId } = await context.params;

  const opened = await openManagement(request, 'credential_list');
  if (!opened.ok) return opened.response;

  const authorized = await loadAndAuthorize(opened.ctx, nodeId, 'credential');
  if (!authorized.ok) return authorized.response;

  const url = new URL(request.url);
  const limit = intParam(url, 'limit', 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);

  const listed = await credentialsMetadata(authorized.node.node_id, limit);
  if (!listed.ok) return refused(listed.error);

  const credentials = listed.value.credentials;
  const current = credentials.find((credential) => credential.state !== 'retired') ?? null;

  // A successful read is not audited — the rule every other read here keeps, and the reason the trail
  // stays a record of decisions rather than a copy of the access log. A refusal to reach this
  // endpoint IS audited, inside `loadAndAuthorize`.
  return completed(
    {
      node_id: authorized.node.node_id,
      credentials,
      returned: credentials.length,
      limit,
      // Bounded listing, stated as bounded: when the page is exactly full there may be older retired
      // rows below it, and an operator choosing what to revoke needs to know that rather than
      // assuming the list is the whole history.
      coverage: credentials.length === limit ? 'partial' : 'complete',
      current_credential_id: current?.credential_id ?? null,
      note: 'Metadata only. A credential secret is shown once, at provisioning or rotation, and is not retrievable from this or any other endpoint.',
    },
    `${String(credentials.length)} credential record(s) for ${authorized.node.name}. ${current === null ? 'None is current: this device has no working secret, so its readings will be refused until one is issued.' : `Credential ${String(current.credential_id)} is ${current.state}.`}`,
    null,
  );
}

export async function POST(request: NextRequest, context: { params: Promise<{ nodeId: string }> }): Promise<Response> {
  const { nodeId } = await context.params;

  const opened = await openManagement(request, 'credential_provision');
  if (!opened.ok) return opened.response;
  const ctx = opened.ctx;

  const authorized = await loadAndAuthorize(ctx, nodeId, 'credential');
  if (!authorized.ok) return authorized.response;
  const { node, credential, role } = authorized;

  if (credential) {
    // Refused, and recorded as refused: an attempt to double-provision is either a confused
    // operator or a script that lost track of the first secret.
    await ctx.audit({
      outcome: 'refused',
      actorRole: role,
      nodeId,
      cooperativeId: node.cooperative_id,
      reasonCode: 'credential_exists',
      detail: { credential_id: credential.credential_id },
    });
    return refused({
      code: 'credential_exists',
      message: `${nodeId} already holds a current credential (id ${credential.credential_id}). A device has one live secret at a time; use POST /api/hardware/devices/${nodeId}/credentials/rotate to replace it. The original is not recoverable — it was shown once.`,
    });
  }

  const provisioned = await provisionDeviceCredential(nodeId);
  if (!provisioned.ok) {
    await ctx.audit({ outcome: 'failed', actorRole: role, nodeId, cooperativeId: node.cooperative_id, reasonCode: provisioned.error.code });
    return refused(provisioned.error);
  }

  const auditRecorded = await ctx.audit({
    outcome: 'success',
    actorRole: role,
    nodeId,
    cooperativeId: node.cooperative_id,
    // The id only. No hash, no secret, no hint at either.
    detail: { credential_id: provisioned.value.credentialId },
  });

  // The summary is the row read BEFORE the insert, so `provisioned` is reported from this action's
  // own result rather than restated from the stale row or rebuilt from a fabricated credential. The
  // full device state is one GET away and this response's job is the secret.
  return issued(
    {
      node_id: nodeId,
      credential_id: provisioned.value.credentialId,
      device: toDeviceSummary(node, credential),
      now_provisioned: true,
      firmware_field: 'secret_token',
      credential_note: 'Write device_secret into the firmware as secret_token now. It is not retrievable; rotation produces a new one.',
    },
    `Credential ${provisioned.value.credentialId} issued for ${nodeId}. This is the only time this secret will be shown.`,
    auditRecorded,
    provisioned.value.token,
  );
}
