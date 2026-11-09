import { NextResponse } from 'next/server';

import { verifyCaller } from '@/lib/serverSupabase';

import { MANAGEMENT_STATUS_BY_CODE, capabilityOf, decideAccess, narrowScope, refusalFor, scopedCooperativeIds, type AccessDecision, type RefusalSubject } from './access';
import { auditEntry, type AuditDetailKey, type AuditFacts } from './audit';
import { alertWithScope } from './alertService';
import { fieldDatabaseStatus } from './deviceService';
import { isJsonContentType, parseJsonBody, readCappedBody } from './ingest';
import { loadDeviceWithCredential, resolveMemberships, writeAudit } from './managementService';
import { isWellFormedNodeId, parseCooperativeFilter } from './registration';
import type { DeviceAlertRow } from './observationService';
import type { AuditDetailValue, CooperativeRole, CredentialRow, HardwareNodeRow, ManagementAction, ManagementFailure, Membership } from './types';

/**
 * The plumbing every device-management route shares, in one place on purpose.
 *
 * Five routes would otherwise each contain the same four steps — confirm the session, confirm the
 * database, read the memberships, decide — and a management surface fails in exactly one way when
 * those steps are duplicated: the fifth route forgets one of them. The requirement that no
 * unauthenticated caller may reach a device-management endpoint is enforced here, in a function
 * whose return type makes it impossible to hold a `ManagementContext` without having passed them.
 *
 * The envelope matches the device ingestion route (`{ ok, message, timestamp, data }`, with
 * `error: { code, message }` on failure) and carries no `provenance`: nothing here came from a
 * publisher. Unlike the ingestion route, `cache-control: no-store` is not negotiable — a cached
 * device list becomes a cached view of another cooperative's hardware the moment a cache key is
 * wrong, and one cached credential response is a leaked secret.
 */

const SESSION_REALM = 'Bearer realm="irshaye-session"';

/**
 * The response builder for every answer a caller is not entitled to, and the only way a management
 * route can produce an error body — so a status code cannot be hand-typed at a call site, and a new
 * error code without a status in `MANAGEMENT_STATUS_BY_CODE` is a compile error rather than a 200.
 */
export function refused(error: ManagementFailure): NextResponse {
  const status = MANAGEMENT_STATUS_BY_CODE[error.code];
  return NextResponse.json(
    {
      ok: false,
      message: error.message,
      error: { code: error.code, message: error.message },
      timestamp: new Date().toISOString(),
      data: null,
    },
    {
      status,
      headers: {
        'cache-control': 'no-store',
        ...(status === 401 ? { 'www-authenticate': SESSION_REALM } : {}),
      },
    },
  );
}

function envelope(
  data: Record<string, unknown>,
  message: string,
  status: number,
  auditRecorded: boolean | null,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      message,
      timestamp: new Date().toISOString(),
      // `audit_recorded` sits in `data` next to the thing it describes: an operator reading a
      // rotation response has to be able to see that the trail did not capture it. It is absent on
      // successful reads, which this phase deliberately does not audit — see lib/field/audit.ts.
      data: { ...data, ...(auditRecorded === null ? {} : { audit_recorded: auditRecorded }), ...(extra ?? {}) },
    },
    {
      status,
      // `private` on top of `no-store`: the only responses that carry a device secret are produced
      // by `issued`, and an intermediary with a shared cache must not be able to hold one.
      headers: { 'cache-control': 'no-store, private' },
    },
  );
}

export function completed(data: Record<string, unknown>, message: string, auditRecorded: boolean | null = null): NextResponse {
  return envelope(data, message, 200, auditRecorded);
}

/** `201` for the two actions that create a row: a registration and an issued credential. */
export function created(data: Record<string, unknown>, message: string, auditRecorded: boolean): NextResponse {
  return envelope(data, message, 201, auditRecorded);
}

/**
 * A successful credential action that produces a secret.
 *
 * The secret is a sibling of the summary rather than a field inside it, so the shape of a device
 * summary stays the same everywhere it appears and `device_secret` exists only in this one
 * response type. It is never written to a log, an audit row, or an error message — the CHECK
 * constraints on `app.management_audit.detail` refuse the field name outright.
 */
export function issued(data: Record<string, unknown>, message: string, auditRecorded: boolean, deviceSecret: string): NextResponse {
  return envelope(data, message, 201, auditRecorded, { device_secret: deviceSecret });
}

export interface ManagementContext {
  action: ManagementAction;
  userId: string;
  memberships: Membership[];
  /** Writes the trail row and reports whether it landed. Never throws, never changes the answer. */
  audit(facts: Omit<AuditFacts, 'actorUserId' | 'action'>, now?: Date): Promise<boolean>;
}

export type Opened = { ok: true; ctx: ManagementContext } | { ok: false; response: NextResponse };

/**
 * Session, database, memberships — in that order, and each step's failure is terminal.
 *
 * Why that order: verifying the session costs one Auth call and needs no database; the database
 * check is free and prevents a membership query that would throw. Reversing the last two produces a
 * 500 with a driver message in the log instead of the setup state a human can act on.
 *
 * Note what a refusal here cannot do: write an audit row. `app.management_audit.actor_user_id` is
 * NOT NULL because a trail entry with no subject is not evidence, and an unconfirmed caller has no
 * subject to name. Those refusals live in the response and the server log, which is the honest limit
 * of what can be recorded about someone who never proved who they are.
 */
export async function openManagement(request: Request, action: ManagementAction): Promise<Opened> {
  const caller = await verifyCaller(request);
  if (!caller.ok) {
    return { ok: false, response: refused({ code: caller.code, message: caller.message }) };
  }

  const database = fieldDatabaseStatus();
  if (!database.ok) return { ok: false, response: refused(database.error) };

  const memberships = await resolveMemberships(caller.userId);
  if (!memberships.ok) return { ok: false, response: refused(memberships.error) };

  const userId = caller.userId;
  return {
    ok: true,
    ctx: {
      action,
      userId,
      memberships: memberships.value.memberships,
      async audit(facts, now) {
        const outcome = await writeAudit(auditEntry({ ...facts, actorUserId: userId, action }, now));
        return outcome.ok;
      },
    },
  };
}

/**
 * The answer for a decision that stopped an action, with the trail written first.
 *
 * `subjectId` reaches the audit row and the refusal's own wording, never a statement that the
 * resource exists — `refusalFor` is what keeps that promise for the `not_a_member` branch.
 */
export async function deny(
  ctx: ManagementContext,
  decision: Exclude<AccessDecision, { ok: true }>,
  subject: RefusalSubject,
  refs: { nodeId?: string | null; cooperativeId?: number | null; detail?: AuditFacts['detail'] },
  subjectId?: string | number,
): Promise<NextResponse> {
  const { answer, auditReason } = refusalFor(decision, subject, subjectId);
  await ctx.audit({
    outcome: 'refused',
    actorRole: null,
    nodeId: refs.nodeId ?? null,
    cooperativeId: refs.cooperativeId ?? null,
    reasonCode: auditReason,
    detail: refs.detail,
  });
  return refused(answer);
}

/**
 * Reads a small JSON body, sharing the device route's content-type and byte-ceiling rules.
 *
 * A management body is a form POST of a handful of identifiers; the 8 KiB ceiling that stops a
 * device from uploading a video is the right ceiling here too, and reusing `readCappedBody` is the
 * reason there is one streaming implementation rather than two.
 */
export async function readBody(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  if (!isJsonContentType(request.headers.get('content-type'))) {
    return { ok: false, response: refused({ code: 'invalid_content_type', message: 'Content-Type must be application/json.' }) };
  }
  const body = await readCappedBody(request);
  if (!body.ok) return { ok: false, response: refused(body.error) };
  const parsed = parseJsonBody(body.text);
  if (!parsed.ok) return { ok: false, response: refused(parsed.error) };
  return { ok: true, value: parsed.value };
}

export type DeviceAuthorization =
  | { ok: false; response: NextResponse }
  | { ok: true; node: HardwareNodeRow; credential: CredentialRow | null; role: CooperativeRole };

/**
 * The one device-level authorization check, used by every `/devices/[nodeId]` route.
 *
 * It resolves the node first, then asks `decideAccess` about the cooperative the DATABASE says owns
 * it — never the cooperative the caller claims. Two refusals come out of here and they are not the
 * same event: a node id that matches nothing is recorded as `unknown_node` (an operator typo, or a
 * probe), while a node that exists under someone else's cooperative is recorded as `not_a_member`
 * and answered as if it did not exist. Only the audit trail can tell those apart later, which is
 * precisely why the trail exists.
 */
export async function loadAndAuthorize(
  ctx: ManagementContext,
  nodeId: string,
  subject: 'device' | 'credential' = 'device',
): Promise<DeviceAuthorization> {
  if (!isWellFormedNodeId(nodeId)) {
    // Refused before the lookup, so a path segment can never become a query value.
    return { ok: false, response: refused({ code: 'invalid_payload', message: 'node_id must be 3-63 characters of letters, digits, "_", ".", ":" or "-", starting with a letter or digit.' }) };
  }

  const device = await loadDeviceWithCredential(nodeId);
  if (!device.ok) {
    if (device.error.code === 'unknown_node') {
      await ctx.audit({ outcome: 'refused', nodeId, cooperativeId: null, reasonCode: 'unknown_node' });
    }
    return { ok: false, response: refused(device.error) };
  }

  const decision = decideAccess(ctx.memberships, device.value.node.cooperative_id, ctx.action);
  if (!decision.ok) {
    const response = await deny(ctx, decision, subject, { nodeId, cooperativeId: device.value.node.cooperative_id });
    return { ok: false, response };
  }

  return { ok: true, node: device.value.node, credential: device.value.credential, role: decision.role };
}

/* ------------------------------------------------------------------------------------------
 * The alert gate — the same shape, one hop further
 * ---------------------------------------------------------------------------------------- */

export type AlertAuthorization =
  | { ok: false; response: NextResponse }
  | {
      ok: true;
      alert: DeviceAlertRow;
      node: HardwareNodeRow | null;
      role: CooperativeRole;
      /** The caller's READ scope, reused by the transition calls so the hop is done once. */
      scope: number[];
    };

/**
 * `device_alerts` has no cooperative column, so an alert's owner is a two-hop fact: alert → node →
 * that node's `cooperative_id`. This is the only place the hop is walked, for the same reason
 * `loadAndAuthorize` is the only place the device hop is walked — a detail route that checked the
 * alert row alone would be scoping on a table that does not carry scope, and three transition routes
 * duplicating that mistake is how a tenant leak ships.
 *
 * The lookup uses the caller's READ scope, then `decideAccess` grades the action being performed.
 * Doing it the other way round — narrowing the scope by the write capability first — would answer
 * `unknown_alert` to a viewer who tried to resolve an alert in their own cooperative. They are a
 * member; the honest answer is 403 `insufficient_role`, and the honest audit row is that refusal.
 *
 * A nonexistent id and another cooperative's id both answer `unknown_alert`, because an `alert_id` is
 * a small integer handed out in order and "41 exists somewhere" is the fact a probing caller wants.
 */
export async function loadAlertAndAuthorize(ctx: ManagementContext, rawAlertId: string): Promise<AlertAuthorization> {
  const alertId = positiveIdOf(rawAlertId);
  if (alertId === null) {
    return { ok: false, response: refused({ code: 'invalid_payload', message: 'alert_id must be a positive integer id from /api/field/alerts.' }) };
  }

  const scope = scopedCooperativeIds(ctx.memberships, 'read');
  const found = await alertWithScope(alertId, scope);
  if (!found.ok) {
    if (found.error.code === 'unknown_alert') {
      await ctx.audit({ outcome: 'refused', nodeId: null, cooperativeId: null, reasonCode: 'unknown_alert', detail: { alert_id: alertId } });
    }
    return { ok: false, response: refused(found.error) };
  }

  const decision = decideAccess(ctx.memberships, found.value.node?.cooperative_id ?? null, ctx.action);
  if (!decision.ok) {
    return {
      ok: false,
      response: await deny(ctx, decision, 'alert', {
        nodeId: found.value.alert.node_id,
        cooperativeId: found.value.node?.cooperative_id ?? null,
        detail: { alert_id: alertId },
      }),
    };
  }

  return { ok: true, alert: found.value.alert, node: found.value.node, role: decision.role, scope };
}

/**
 * A path segment as an id, or null.
 *
 * Digits only: `Number('1e3')` is 1 000 and `Number(' 41 ')` is 41, so a cast would quietly accept
 * shapes the database never issues and make an id in a path a parsing exercise rather than a lookup.
 */
export function positiveIdOf(raw: string): number | null {
  if (!/^\d{1,15}$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

/* ------------------------------------------------------------------------------------------
 * The scoped read gate — the same five steps every dashboard endpoint needs
 * ---------------------------------------------------------------------------------------- */

export type ScopedOpening =
  | { ok: true; ctx: ManagementContext; scope: number[]; requestedCooperativeId: number | null }
  | { ok: false; response: NextResponse };

/**
 * Session, database, memberships, scope — with the optional `cooperative_id` filter applied.
 *
 * One function because six dashboard endpoints would otherwise each contain the same four steps,
 * and this is the surface where a forgotten step is a tenant leak rather than a bug report: a read
 * route that skipped `narrowScope` would answer for every cooperative on the platform, and — far
 * worse — a route that trusted `?cooperative_id=` as the scope would let any signed-in user read
 * anyone's fleet by typing a number. `narrowScope` returns the intersection, so a filter can only
 * shrink what the memberships already allow.
 *
 * The capability comes from `capabilityOf(action)`, not from the word "read" in the caller's
 * comment: a route that declared a `manage` action on this gate would be scoped for management,
 * which is the correct answer for a write and an accident for a dashboard.
 */
export async function openScopedRead(
  request: Request,
  action: ManagementAction,
  detail?: Partial<Record<AuditDetailKey, AuditDetailValue>>,
): Promise<ScopedOpening> {
  const opened = await openManagement(request, action);
  if (!opened.ok) return opened;

  const url = new URL(request.url);
  const requested = parseCooperativeFilter(url.searchParams.get('cooperative_id'));
  if (requested === 'invalid') {
    return { ok: false, response: refused({ code: 'invalid_payload', message: 'cooperative_id must be a positive integer id of a cooperative you belong to.' }) };
  }

  const scope = narrowScope(opened.ctx.memberships, requested, capabilityOf(action));
  if (scope === null) {
    // The caller named a cooperative they are not in. That is their own relationship to talk about,
    // so the answer says so plainly — and the attempt is recorded, because six read routes make
    // enumeration easy and quiet.
    const response = await deny(opened.ctx, { ok: false, reason: 'not_a_member' }, 'cooperative', {
      cooperativeId: requested,
      detail: { requested_cooperative_id: requested, ...detail },
    }, requested ?? undefined);
    return { ok: false, response };
  }

  return { ok: true, ctx: opened.ctx, scope, requestedCooperativeId: requested };
}

/**
 * What a scoped read with no membership says, in one sentence, in one place.
 *
 * Six routes would otherwise each write their own version of "you can see nothing", and the ones
 * that drift tend to drift toward the empty-looking answer: an empty list and an unjoined
 * cooperative look identical to a farmer, and only one of them has an action to take.
 */
export const NO_MEMBERSHIP_NOTE =
  'You hold no cooperative membership yet, so nothing is listed. Ask a manager of your cooperative to add you — see docs/field-intelligence-setup.md.';

export function scopeMessage(scope: number[], normal: string): string {
  return scope.length === 0 ? NO_MEMBERSHIP_NOTE : normal;
}
