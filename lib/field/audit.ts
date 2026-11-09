import type { AuditDetailValue, AuditEntry, AuditOutcome, CooperativeRole, ManagementAction } from './types';

/**
 * Building audit records, as pure functions.
 *
 * The trail is the one place a module is allowed to describe a refusal in its own words, and it is
 * also the place a secret could end up if a developer passes the request body "for context". So this
 * module owns the shape, and the shape cannot hold a body: the caller supplies named facts, the
 * detail object accepts a closed list of keys, and everything that survives is truncated.
 *
 * `npm run test:field` asserts the sanitising rules and the CHECK constraints in
 * `20261106000200` agree, because an audit insert that violates a constraint loses the event it
 * exists to record — and a refused action whose audit row failed is exactly the incident someone
 * later asks "why is there nothing in the trail about that?".
 */

/**
 * The only keys `detail` accepts. Each entry is an identifier or a bound, never a value a device
 * sent. Adding one here is a deliberate review; adding a key at a call site is a silent no-op, which
 * is the failure mode chosen — a missing detail field is a weaker record, an unexpected one is a
 * leak.
 */
export const AUDIT_DETAIL_KEYS = [
  'field_site_id',
  'credential_id',
  'superseded_credential_id',
  // Phase 6A: an alert row and the rule that raised it. Both are ids, which is the whole design of
  // this list — an audit row is an index into an event, so it names the alert a manager closed and
  // the threshold that opened it without copying either row's contents.
  'alert_id',
  'rule_id',
  'status',
  'limit',
  'offset',
  'requested_cooperative_id',
  'scope_count',
  'device_count',
  'provisioned',
  'force',
  'outcome_of_previous_step',
] as const;

export type AuditDetailKey = (typeof AUDIT_DETAIL_KEYS)[number];

/**
 * A key name that must never appear, whatever the allow-list says. This is checked against the
 * lower-cased name so a future allow-list entry like `refresh_token` would still be refused here.
 */
const FORBIDDEN_KEY_PARTS = ['token', 'secret', 'password', 'credential_hash', 'hash'];

const REASON_CODE_PATTERN = /^[a-z][a-z0-9_]{0,48}$/;

/** Mirrors `management_audit_node_actions_name_a_node`. */
const NODE_LEVEL_ACTIONS: readonly ManagementAction[] = [
  'device_register',
  'device_update',
  'device_status_change',
  'credential_provision',
  'credential_rotate',
  'credential_revoke',
  // The one dashboard read that names a device. It belongs in this list because the refusal it
  // records is "you may not read THIS device's history", and a trail entry for that without the
  // node id is not evidence of anything.
  'observation_read',
];

export function isNodeLevelAction(action: ManagementAction): boolean {
  return NODE_LEVEL_ACTIONS.includes(action);
}

export interface AuditFacts {
  actorUserId: string;
  action: ManagementAction;
  outcome: AuditOutcome;
  actorRole?: CooperativeRole | null;
  cooperativeId?: number | null;
  nodeId?: string | null;
  reasonCode?: string | null;
  detail?: Partial<Record<AuditDetailKey, AuditDetailValue>>;
}

/**
 * Turns what a route knows into the row it will write, refusing to carry anything it should not.
 *
 * `now` is a parameter rather than a call to `new Date()` inside, for the same reason it is one in
 * the rate limiter and the freshness classifier: a test has to be able to stand at a specific
 * second. Omit it and the record takes the clock.
 */
export function auditEntry(facts: AuditFacts, now: Date = new Date()): AuditEntry {
  const detail = sanitizeDetail(facts.detail);
  return {
    actorUserId: facts.actorUserId.slice(0, 64),
    actorRole: facts.actorRole ?? null,
    cooperativeId: facts.cooperativeId ?? null,
    // A node id a caller typed can be malformed, and the trail should still say what was asked
    // for. Truncated, never dropped — the CHECK on node-level actions wants it present.
    nodeId: facts.nodeId === undefined || facts.nodeId === null ? null : facts.nodeId.slice(0, 120),
    action: facts.action,
    outcome: facts.outcome,
    reasonCode: sanitizeReasonCode(facts.reasonCode),
    detail,
    occurredAt: now.toISOString(),
  };
}

function sanitizeReasonCode(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  // Anything that does not fit the column's own pattern is discarded rather than repaired: a
  // reason code that would have been rejected on insert is worse than no code, because it looks
  // like a recorded fact.
  return REASON_CODE_PATTERN.test(value) ? value : null;
}

function sanitizeDetail(input: Partial<Record<AuditDetailKey, AuditDetailValue>> | undefined): Record<string, AuditDetailValue> {
  const out: Record<string, AuditDetailValue> = {};
  if (!input) return out;
  for (const [rawKey, value] of Object.entries(input)) {
    const key = rawKey.trim();
    if (!(AUDIT_DETAIL_KEYS as readonly string[]).includes(key)) continue;
    if (FORBIDDEN_KEY_PARTS.some((part) => key.toLowerCase().includes(part))) continue;
    if (value === undefined) continue;
    out[key] = typeof value === 'string' ? value.slice(0, 120) : value;
  }
  return out;
}

/**
 * The audit columns in the exact names `app.management_audit` uses, so the insert in
 * `managementService.ts` is a map over this and nothing else is free to build the row by hand.
 */
export function auditRow(entry: AuditEntry): Record<string, string | number | boolean | null | Record<string, AuditDetailValue>> {
  return {
    occurred_at: entry.occurredAt,
    actor_user_id: entry.actorUserId,
    actor_role: entry.actorRole,
    cooperative_id: entry.cooperativeId,
    node_id: entry.nodeId,
    action: entry.action,
    outcome: entry.outcome,
    reason_code: entry.reasonCode,
    detail: entry.detail,
  };
}

/**
 * A detail object from a route is allowed to be built only from these named facts. Exported so the
 * tests can assert the rule rather than read for it.
 */
export function detailOf(pairs: Partial<Record<AuditDetailKey, AuditDetailValue>>): Record<string, AuditDetailValue> {
  return sanitizeDetail(pairs);
}
