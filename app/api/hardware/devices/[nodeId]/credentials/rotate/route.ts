import type { NextRequest } from 'next/server';

import { rotateDeviceCredential, toDeviceSummary } from '@/lib/field/deviceService';
import { issued, loadAndAuthorize, openManagement, refused } from '@/lib/field/managementApi';

/**
 * `POST /api/hardware/devices/[nodeId]/credentials/rotate` — replace the device's secret.
 *
 * The lifecycle, stated once because it is what an operator has to plan around:
 *
 *   1. a new secret is generated in this process and only its digest is sent to the database;
 *   2. `field.rotate_device_credential` revokes the current row and inserts the new one inside one
 *      transaction, so there is no moment in which the device has no valid path or two live ones;
 *   3. the old secret stops working the instant this returns — there is no grace period, and a
 *      device still sending with it is refused 401 `invalid_credentials`;
 *   4. the new secret is shown here and nowhere else, ever again.
 *
 * No grace period is a deliberate choice, not an oversight: a rotation that leaves the old digest
 * valid until some later timestamp is a rotation that cannot be verified as done, which defeats the
 * reason a compromised device gets rotated at all. The operational cost — reflashing the device
 * before it next reports — is stated in the response so nobody discovers it in the field.
 */

export async function POST(request: NextRequest, context: { params: Promise<{ nodeId: string }> }): Promise<Response> {
  const { nodeId } = await context.params;

  const opened = await openManagement(request, 'credential_rotate');
  if (!opened.ok) return opened.response;
  const ctx = opened.ctx;

  const authorized = await loadAndAuthorize(ctx, nodeId, 'credential');
  if (!authorized.ok) return authorized.response;
  const { node, credential, role } = authorized;

  const rotated = await rotateDeviceCredential(nodeId);
  if (!rotated.ok) {
    await ctx.audit({ outcome: 'failed', actorRole: role, nodeId, cooperativeId: node.cooperative_id, reasonCode: rotated.error.code });
    return refused(rotated.error);
  }

  const auditRecorded = await ctx.audit({
    outcome: 'success',
    actorRole: role,
    nodeId,
    cooperativeId: node.cooperative_id,
    detail: { credential_id: rotated.value.credentialId, superseded_credential_id: rotated.value.supersededId },
  });

  return issued(
    {
      node_id: nodeId,
      credential_id: rotated.value.credentialId,
      superseded_credential_id: rotated.value.supersededId,
      // If the node had no current credential, rotation behaved exactly like provisioning; saying so
      // is more useful than a response that implies a secret was replaced when none existed.
      superseded_present: rotated.value.supersededId !== null,
      device: toDeviceSummary(node, credential),
      now_provisioned: true,
      firmware_field: 'secret_token',
      reflash_required: true,
    },
    `Credential ${rotated.value.credentialId} issued for ${nodeId}${
      rotated.value.supersededId === null ? '' : `, replacing ${rotated.value.supersededId}`
    }. The previous secret is invalid from this moment, so the device must be reflashed before its next report or it will be refused with 401.`,
    auditRecorded,
    rotated.value.token,
  );
}
