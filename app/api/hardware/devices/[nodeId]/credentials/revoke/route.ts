import type { NextRequest } from 'next/server';

import { revokeDeviceCredential, toDeviceSummary } from '@/lib/field/deviceService';
import { completed, loadAndAuthorize, openManagement, readBody, refused } from '@/lib/field/managementApi';
import { getCredentialOwner } from '@/lib/field/managementService';
import { validateRevocation } from '@/lib/field/registration';

/**
 * `POST /api/hardware/devices/[nodeId]/credentials/revoke` — retire a credential.
 *
 * A POST action rather than `DELETE /credentials/{id}`, for two reasons that outweigh the REST
 * convention. This revocation carries a second input (`force`) and an explanation of what it just did
 * to the device, so it needs a body — and a DELETE body is dropped by intermediaries and rejected by
 * some clients, which is a bad way to deliver an acknowledgement. And this collection already answers
 * `/credentials/rotate` with POST: two verbs for the same kind of side-effecting action on the same
 * resource is how an operator ends up guessing which one the runbook meant.
 *
 * The lifecycle this closes: a revoked secret stops working at ingestion the moment the row is
 * stamped (`lib/field/authorize.ts` checks `revoked_at` before it compares the digest), the row
 * itself stays for the history, and `force` is the operator's acknowledgement that a device with no
 * current credential cannot report at all.
 */

type RouteContext = { params: Promise<{ nodeId: string }> };

export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  const { nodeId } = await context.params;

  const opened = await openManagement(request, 'credential_revoke');
  if (!opened.ok) return opened.response;
  const ctx = opened.ctx;

  // Authorization is against the DEVICE in the path: the caller must manage this node. The body then
  // names a credential, which is why the next question is not "may you revoke" but "is this the node's".
  const authorized = await loadAndAuthorize(ctx, nodeId, 'credential');
  if (!authorized.ok) return authorized.response;
  const { node, credential, role } = authorized;

  const body = await readBody(request);
  if (!body.ok) return body.response;

  const validated = validateRevocation(body.value);
  if (!validated.ok) return refused(validated.error);
  const { credentialId, force } = validated.value;

  const owner = await getCredentialOwner(credentialId);
  if (!owner.ok) {
    await ctx.audit({ outcome: 'failed', actorRole: role, nodeId, cooperativeId: node.cooperative_id, reasonCode: owner.error.code, detail: { credential_id: credentialId } });
    return refused(owner.error);
  }

  // The answer is the same 404 a credential that does not exist gets, because "that credential
  // exists, under a different cooperative's device" is exactly the fact this call exists not to hand
  // out. The trail records the real reason, which is the only place it can be read.
  if (owner.value.nodeId !== node.node_id) {
    await ctx.audit({
      outcome: 'refused',
      actorRole: role,
      nodeId,
      cooperativeId: node.cooperative_id,
      reasonCode: 'credential_belongs_to_another_node',
      detail: { credential_id: credentialId },
    });
    return refused({ code: 'unknown_credential', message: `No credential with that id is available on ${nodeId}. A secret is revoked on the device that holds it.` });
  }

  const revoked = await revokeDeviceCredential(credentialId, force);
  if (!revoked.ok) {
    // `invalid_payload` here is the "this is the only current credential and force was not sent"
    // refusal — an operator decision, recorded as refused. A storage fault is `failed`.
    const outcome = revoked.error.code === 'database_unavailable' || revoked.error.code === 'database_not_configured' ? 'failed' : 'refused';
    await ctx.audit({ outcome, actorRole: role, nodeId, cooperativeId: node.cooperative_id, reasonCode: revoked.error.code, detail: { credential_id: credentialId, force } });
    return refused(revoked.error);
  }

  const revokedTheCurrentOne = credential !== null && credential.credential_id === credentialId;

  const auditRecorded = await ctx.audit({
    outcome: 'success',
    actorRole: role,
    nodeId,
    cooperativeId: node.cooperative_id,
    // The id and the acknowledgement, and nothing else. The trail must not hold the secret it just
    // invalidated; the CHECK constraints on `detail` refuse the field names outright.
    detail: { credential_id: credentialId, force },
  });

  return completed(
    {
      node_id: nodeId,
      credential_id: credentialId,
      revoked_at: revoked.value.revokedAt,
      was_the_current_credential: revokedTheCurrentOne,
      // Computed from this action's own result rather than restated from the row read before it: if
      // this was the device's live secret, the device is unprovisioned NOW, and a GET on the same
      // node must agree with what is written here.
      device: toDeviceSummary(node, revokedTheCurrentOne ? null : credential),
    },
    revokedTheCurrentOne
      ? `Credential ${credentialId} is revoked and ${nodeId} has no working secret, so its readings will be refused with 401 not_provisioned until a new one is issued. The original is not recoverable — issue it at POST /api/hardware/devices/${nodeId}/credentials.`
      : `Credential ${credentialId} is revoked. ${nodeId} still holds a different current credential, so it can keep reporting.`,
    auditRecorded,
  );
}
