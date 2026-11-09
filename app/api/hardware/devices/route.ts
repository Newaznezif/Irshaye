import type { NextRequest } from 'next/server';

import { intParam, stringParam } from '@/lib/data/api';
import { decideAccess, scopedCooperativeIds } from '@/lib/field/access';
import { toDeviceSummary } from '@/lib/field/deviceService';
import { NO_MEMBERSHIP_NOTE, completed, created, deny, openScopedRead, openManagement, readBody, refused } from '@/lib/field/managementApi';
import { getFieldSite, listDevicesInScope, registerDevice } from '@/lib/field/managementService';
import { ALL_STATUSES, DEFAULT_PAGE_SIZE, MAX_PAGE_OFFSET, MAX_PAGE_SIZE, validateRegistration } from '@/lib/field/registration';

/**
 * `/api/hardware/devices` — the cooperative-scoped device register.
 *
 * `GET` lists the devices the caller may see. `POST` registers one under a field site the caller
 * manages. Both go through the same session-first gate, so neither can be reached without a session
 * the Auth server confirmed, and neither answers anything about a cooperative the caller is not in.
 * `GET` uses `openScopedRead`, the gate the dashboard endpoints use too: the four steps — session,
 * database, memberships, scope — have one implementation, which is the only reason there is no
 * fifth route that forgot one of them.
 *
 * The list is scoped by the memberships the SERVER read (`scopedCooperativeIds`), never by a
 * cooperative id in the request. A `cooperative_id` query parameter narrows that scope or is
 * refused; it cannot widen it, which is the property the cross-tenant tests in
 * `scripts/check-hardware-routes.mjs` aim at.
 *
 * No response from this route can contain a credential: `toDeviceSummary` is the only device shape
 * exported by the service layer, and it has no hash field to leak. Callers see `provisioned: true`
 * and the expiry, which is what an operator needs in a list.
 */

export async function GET(request: NextRequest): Promise<Response> {
  // Validation of the optional filters happens after the gate, never before: an unauthenticated
  // caller must not be able to use a 400 as a probe of what this endpoint parses.
  const opened = await openScopedRead(request, 'device_list');
  if (!opened.ok) return opened.response;
  const { ctx, scope } = opened;

  const url = new URL(request.url);
  const status = stringParam(url, 'status');
  if (status !== null && !(ALL_STATUSES as readonly string[]).includes(status)) {
    return refused({ code: 'invalid_payload', message: `status must be one of: ${ALL_STATUSES.join(', ')}.` });
  }

  const limit = intParam(url, 'limit', 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const offset = intParam(url, 'offset', 0, MAX_PAGE_OFFSET, 0);

  if (scope.length === 0) {
    // No membership at all is a normal, non-error state for a newly signed-in person. Saying so is
    // more useful than an empty list that looks like a device that stopped reporting.
    return completed(
      { devices: [], total: 0, page: { limit, offset }, visible_cooperatives: [] },
      NO_MEMBERSHIP_NOTE,
      null,
    );
  }

  const listed = await listDevicesInScope(scope, { status, limit, offset });
  if (!listed.ok) return refused(listed.error);

  return completed(
    {
      devices: listed.value.devices,
      total: listed.value.total,
      page: { limit, offset },
      // The scope is echoed because a dashboard must be able to say "these are the cooperatives this
      // view covers" without inferring it from the rows — an empty page and an unscoped page look
      // identical otherwise.
      visible_cooperatives: scopedCooperativeIds(ctx.memberships, 'read'),
      ...(status ? { filtered_by_status: status } : {}),
    },
    `${listed.value.devices.length} of ${listed.value.total} devices in this caller's scope.`,
    null,
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  const opened = await openManagement(request, 'device_register');
  if (!opened.ok) return opened.response;
  const ctx = opened.ctx;

  const body = await readBody(request);
  if (!body.ok) return body.response;

  const validated = validateRegistration(body.value);
  if (!validated.ok) return refused(validated.error);
  const registration = validated.value;

  // The site is resolved before the permission question is asked, because the site is where the
  // device's owner comes from. Nothing in this branch reads a cooperative id from the body.
  const site = await getFieldSite(registration.fieldSiteId);
  if (!site.ok) {
    if (site.error.code === 'unknown_site') {
      await ctx.audit({ outcome: 'refused', nodeId: registration.nodeId, reasonCode: 'unknown_site', detail: { field_site_id: registration.fieldSiteId } });
    }
    return refused(site.error);
  }

  const decision = decideAccess(ctx.memberships, site.value.cooperative_id, 'device_register');
  if (!decision.ok) {
    return deny(ctx, decision, 'field site', {
      nodeId: registration.nodeId,
      cooperativeId: site.value.cooperative_id,
      detail: { field_site_id: site.value.field_site_id },
    }, site.value.field_site_id);
  }

  const inserted = await registerDevice(registration, site.value.cooperative_id);
  if (!inserted.ok) {
    // `failed` for a storage fault, `refused` for a collision the operator can act on: an incident
    // review should not have to open a log to tell those apart.
    const outcome = inserted.error.code === 'device_exists' ? 'refused' : 'failed';
    await ctx.audit({
      outcome,
      actorRole: decision.role,
      nodeId: registration.nodeId,
      cooperativeId: site.value.cooperative_id,
      reasonCode: inserted.error.code,
      detail: { field_site_id: site.value.field_site_id },
    });
    return refused(inserted.error);
  }

  const auditRecorded = await ctx.audit({
    outcome: 'success',
    actorRole: decision.role,
    nodeId: registration.nodeId,
    cooperativeId: site.value.cooperative_id,
    detail: { field_site_id: site.value.field_site_id, status: 'inactive', provisioned: false },
  });

  return created(
    { device: toDeviceSummary(inserted.value, null) },
    `${registration.nodeId} is registered as inactive and has no credential, so it cannot submit readings yet. Issue one with POST /api/hardware/devices/${registration.nodeId}/credentials; the secret is shown once.`,
    auditRecorded,
  );
}
