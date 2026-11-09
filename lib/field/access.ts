import { INGEST_STATUS_BY_CODE } from './authorize';
import type { ManagementAction, ManagementErrorCode, ManagementFailure, Membership } from './types';

/**
 * Cooperative access decisions, as pure functions.
 *
 * This module is the authorization surface of the device-management API, and it is deliberately
 * free of databases, sessions and HTTP so that the part a reviewer cares about — who may do what to
 * whose device — can be executed by `npm run test:field` in a process with no Supabase project and
 * no rows in it. A tenant-isolation bug found here costs one assertion; the same bug found in a
 * route is an incident.
 *
 * Two rules shape every function below.
 *
 * 1. The input is a list of memberships the server read from `app.cooperative_members` for a
 *    subject the Auth server confirmed. Nothing a caller sends — a cooperative id in a body, a role
 *    in a header, an organisation name in a query string — is ever an input here. A route that
 *    wanted to trust one would have to call these functions with a different argument, and the
 *    argument type makes that a compile error rather than a code review finding.
 *
 * 2. A refusal says as little as is consistent with being useful. A caller who is not a member of
 *    the cooperative that owns a device is answered with the same 404 as a caller who mistyped a
 *    node id, because "cooperative 7 exists and owns that device" is exactly the fact a probing
 *    stranger wants. Membership in an organisation the caller named themselves is different: the
 *    caller's own relationship to that cooperative is not a secret, so a scope query can answer 403
 *    honestly. Both reasons are recorded in full in the audit trail regardless of the answer.
 */

/**
 * What an action needs: reading a device's metadata, or changing something — including issuing a
 * credential, which is the one action that produces a secret.
 */
export type Capability = 'read' | 'manage';

const READ_ACTIONS: readonly ManagementAction[] = [
  'device_list',
  'device_view',
  // The dashboard's own reads. Listed here rather than defaulted, so a new endpoint that forgets to
  // declare itself is refused for a viewer (the safe direction) instead of silently inheriting
  // `manage` — which would hand a viewer a write capability through a read route.
  'overview_read',
  'site_list',
  'site_view',
  'observation_read',
  'alert_list',
  // One alert's own detail. Listed apart from `alert_list` because a detail route is where an id is
  // easiest to guess, and a viewer may read it while only a manager may change it.
  'alert_view',
  'map_read',
];

export function capabilityOf(action: ManagementAction): Capability {
  return READ_ACTIONS.includes(action) ? 'read' : 'manage';
}

/**
 * `viewer` may read; only `manager` may change anything or touch a credential.
 *
 * Stated as a table rather than inline `role === 'manager'` comparisons at six call sites, so a
 * later role (an installer who may provision but not disable) is one edit here plus its tests, and
 * not a hunt through the routes for who checked what.
 */
export function roleAllows(role: Membership['role'], capability: Capability): boolean {
  if (role === 'manager') return true;
  return capability === 'read';
}

export type AccessDecision =
  | { ok: true; role: Membership['role'] }
  | { ok: false; reason: 'not_a_member' | 'insufficient_role' };

/**
 * The single question every management route asks before touching a row.
 *
 * Order matters: membership first, then role. Reporting `insufficient_role` to someone who is not a
 * member at all would confirm the cooperative exists, and reporting `not_a_member` to a viewer
 * would tell them to go join a cooperative they already belong to.
 */
export function decideAccess(memberships: Membership[], cooperativeId: number | null, action: ManagementAction): AccessDecision {
  if (cooperativeId === null) {
    // An unassigned device belongs to nobody, so no membership can cover it. This is the safe
    // direction for a NULL: the alternative — "unassigned means any authenticated caller may
    // manage it" — would make every registration mistake a cross-tenant hole.
    return { ok: false, reason: 'not_a_member' };
  }
  const capability = capabilityOf(action);
  const held = memberships.find((m) => m.cooperative_id === cooperativeId);
  if (!held) return { ok: false, reason: 'not_a_member' };
  if (!roleAllows(held.role, capability)) return { ok: false, reason: 'insufficient_role' };
  return { ok: true, role: held.role };
}

/**
 * The cooperative scope a caller may act within, as one sorted array.
 *
 * Sorting is not cosmetic: the array goes into an `.in(...)` filter and into audit detail and test
 * assertions, where an unstable order would make a passing run indistinguishable from a lucky one.
 */
export function scopedCooperativeIds(memberships: Membership[], capability: Capability): number[] {
  return memberships
    .filter((m) => roleAllows(m.role, capability))
    .map((m) => m.cooperative_id)
    .sort((a, b) => a - b);
}

/**
 * What a caller asked to filter by versus what they hold.
 *
 * Returns `null` when the caller may not act on that cooperative, and a one-element scope when they
 * may — so a route can never accidentally widen a filtered query back to the whole table.
 */
export function narrowScope(memberships: Membership[], requested: number | null, capability: Capability): number[] | null {
  const scope = scopedCooperativeIds(memberships, capability);
  if (requested === null) return scope;
  return scope.includes(requested) ? [requested] : null;
}

export type RefusalSubject = 'device' | 'field site' | 'credential' | 'alert' | 'cooperative';

/**
 * The refusal a caller gets, and the reason the audit record keeps.
 *
 * They are returned together, not as two separate helpers, so a route cannot answer while leaving
 * the trail blank or log a reason it never told anyone.
 */
export function refusalFor(
  decision: Exclude<AccessDecision, { ok: true }>,
  subject: RefusalSubject,
  subjectId?: string | number,
): { answer: ManagementFailure; auditReason: string } {
  if (decision.reason === 'insufficient_role') {
    return {
      auditReason: 'insufficient_role',
      answer: {
        code: 'insufficient_role',
        message:
          subject === 'credential'
            ? 'Your role in this cooperative is viewer, which can read devices but not issue, rotate or revoke their credentials. A manager must perform this action.'
            : subject === 'alert'
              ? 'Your role in this cooperative is viewer, which can see an alert and its evidence but cannot acknowledge or resolve it. Doing that closes a condition someone else may still be watching, so a manager must perform it.'
              : 'Your role in this cooperative is viewer, which can read devices but not change them. A manager must perform this action.',
      },
    };
  }

  // A named cooperative is answered plainly: the caller is asking about their own relationship to
  // it, which is their information.
  if (subject === 'cooperative') {
    return {
      auditReason: 'not_a_member',
      answer: {
        code: 'not_a_member',
        message: `You hold no membership in cooperative ${String(subjectId ?? '?')}, so nothing was listed or changed for it. A manager of that cooperative has to add you; see docs/field-intelligence-setup.md.`,
      },
    };
  }

  // Everything else is a resource the caller may not even be allowed to know is owned by anybody.
  const code: ManagementErrorCode =
    subject === 'field site'
      ? 'unknown_site'
      : subject === 'credential'
        ? 'unknown_credential'
        : subject === 'alert'
          ? 'unknown_alert'
          : 'unknown_node';
  return {
    auditReason: 'not_a_member',
    answer: {
      code,
      message:
        subject === 'field site'
          ? 'No field site with that id is available to this caller. Register a device against a site in a cooperative you manage.'
          : `No ${subject} with that id is available to this caller.`,
    },
  };
}

/**
 * Every management code's HTTP status. The ingest codes keep their meanings — `unknown_node` is a
 * 404 in both surfaces — and the seven new ones are listed rather than defaulted, so a code added
 * without a status here is a compile error rather than a 200.
 */
export const MANAGEMENT_STATUS_BY_CODE: Record<ManagementErrorCode, number> = {
  ...INGEST_STATUS_BY_CODE,
  unauthenticated: 401,
  auth_unavailable: 503,
  not_a_member: 403,
  insufficient_role: 403,
  unknown_site: 404,
  // A nonexistent alert and another cooperative's alert get the same answer, for the reason
  // spelled out on `refusalFor`: existence is the fact a probing caller wants.
  unknown_alert: 404,
  device_exists: 409,
  credential_exists: 409,
};
