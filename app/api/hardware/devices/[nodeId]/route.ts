import type { NextRequest } from 'next/server';

import { toDeviceSummary } from '@/lib/field/deviceService';
import { completed, loadAndAuthorize, openManagement, readBody, refused } from '@/lib/field/managementApi';
import { setDeviceStatus } from '@/lib/field/managementService';
import { OPERATOR_SETTABLE_STATUSES, validateStatusChange } from '@/lib/field/registration';
import type { CooperativeRole, ManagementAction } from '@/lib/field/types';

/**
 * `/api/hardware/devices/[nodeId]` — one device.
 *
 * `GET` reads its metadata and lifecycle state. `PATCH` moves it along that lifecycle. Both resolve
 * the device first and ask `decideAccess` (inside `loadAndAuthorize`) about the cooperative the
 * database recorded as its owner, so the id in the path selects a row rather than granting a
 * permission.
 *
 * `PATCH` is the first use of that verb in this project, and it is here rather than a `POST` action
 * endpoint because a status change is a partial update of an existing resource with no side effects
 * beyond the row. The body accepts exactly one key; anything else in it is refused instead of being
 * quietly ignored, so a form that posts `{status, secret_token}` is told the second field is not
 * settable here rather than learning it from a leaked-looking response.
 */

type RouteContext = { params: Promise<{ nodeId: string }> };

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  const { nodeId } = await context.params;

  const opened = await openManagement(request, 'device_view');
  if (!opened.ok) return opened.response;

  const authorized = await loadAndAuthorize(opened.ctx, nodeId);
  if (!authorized.ok) return authorized.response;

  // A successful read is not audited. Every dashboard poll would write a row, which turns the
  // trail into a copy of the access log and makes the actions worth keeping harder to find.
  // Refused reads ARE audited, in `loadAndAuthorize` — see docs/field-intelligence-setup.md.
  return completed(
    {
      device: toDeviceSummary(authorized.node, authorized.credential),
      // What the caller is allowed to do next, computed from the role the database gave them rather
      // than from the action they just performed: a viewer looking at a manager's device needs to be
      // able to say why the buttons are missing.
      capabilities: capabilitiesFor(authorized.role),
    },
    `${authorized.node.node_id}: ${authorized.node.name}, status ${authorized.node.status}.`,
    null,
  );
}

function capabilitiesFor(role: CooperativeRole): ManagementAction[] {
  // The names are the API's own action names, not UI labels: a dashboard that branches on these
  // strings is branching on the same vocabulary the audit trail and `decideAccess` use, so a button
  // cannot appear for an action the server would refuse.
  if (role === 'viewer') return ['device_view'];
  // `credential_list` is a read, and it is on this list because it is a MANAGER read: a viewer may
  // not enumerate a device's credential ids, so the panel that shows them may not appear for one.
  return ['device_view', 'device_status_change', 'credential_provision', 'credential_rotate', 'credential_revoke', 'credential_list'];
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  const { nodeId } = await context.params;

  const opened = await openManagement(request, 'device_status_change');
  if (!opened.ok) return opened.response;
  const ctx = opened.ctx;

  const authorized = await loadAndAuthorize(ctx, nodeId);
  if (!authorized.ok) return authorized.response;
  const { node, credential, role } = authorized;

  const body = await readBody(request);
  if (!body.ok) return body.response;

  const validated = validateStatusChange(body.value);
  if (!validated.ok) return refused(validated.error);

  const previous = node.status;
  // `node.node_id`, not the path segment: they are the same string once `loadAndAuthorize` has
  // validated the shape, and writing the UPDATE with the row's own identity keeps the comparison
  // honest if the caller padded the id it sent.
  const updated = await setDeviceStatus(node.node_id, validated.value.status, previous);
  if (!updated.ok) {
    await ctx.audit({ outcome: 'failed', actorRole: role, nodeId: node.node_id, cooperativeId: node.cooperative_id, reasonCode: updated.error.code });
    return refused(updated.error);
  }

  const auditRecorded = await ctx.audit({
    outcome: 'success',
    actorRole: role,
    nodeId: node.node_id,
    cooperativeId: node.cooperative_id,
    detail: { status: validated.value.status },
  });

  // The consequence of `disabled` is stated in the response because it is the reason an operator
  // reaches for this endpoint: the device will start being refused at ingestion, and its readings
  // stop arriving. Anything that looks like a pause but is not one would be a lie about hardware.
  const consequence =
    validated.value.status === 'disabled'
      ? 'It will now be refused with 403 device_disabled at ingestion.'
      : validated.value.status === 'maintenance'
        ? 'Its silence will raise no offline alert, but readings it does send are still accepted.'
        : 'It is expected to report again.';

  return completed(
    {
      device: toDeviceSummary(updated.value, credential),
      previous_status: previous,
      // Decided by the caller's role, not asserted by this route: a viewer cannot get here (the
      // manage capability refuses first), so listing the consequence is guidance, not a promise
      // that they could repeat the call.
      allowed_statuses: OPERATOR_SETTABLE_STATUSES,
    },
    `${nodeId} moved from ${previous} to ${validated.value.status}. ${consequence}`,
    auditRecorded,
  );
}
