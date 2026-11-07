import { getSyncClient } from '@/lib/supabaseAdmin';

import { evaluateRules } from './alertEvaluation';
import { fieldDatabaseStatus } from './deviceService';
import { METRIC_UNITS } from './metrics';
import { ALERT_COLUMNS, messageOf, normalizeReading, numberFrom, READING_COLUMNS, RULE_COLUMNS, rulesApplyingToNode, UNRESOLVED_ALERT_STATUSES } from './observationService';
import { NODE_COLUMNS } from './managementService';
import type { RuleBreach, RuleSkipped } from './alertEvaluation';
import type { AlertType, RuleMetric } from './metrics';
import type { AlertRuleRow, DeviceAlertRow, SensorReadingRow } from './observationService';
import type { ManagementDb } from './managementService';
import type { HardwareNodeRow, ManagementFailure } from './types';

/**
 * Turning rule verdicts into rows, and rows back into the dashboard.
 *
 * `alertEvaluation.ts` decides; this module is the only place that writes `field.device_alerts`, and
 * the whole discipline of it comes down to one sentence in the brief: alert evaluation must be safe
 * to retry without producing a second alert. The database already guarantees that —
 * `device_alert_one_open_per_node_and_type_uid` is a partial unique index on `(node_id, alert_type)`
 * for rows in `('open', 'acknowledged')` — so this file's job is to treat a unique-violation on that
 * index as an EXPECTED outcome and fall back to updating the row it collided with, rather than as an
 * error. A submission replayed by flaky firmware therefore advances one alert instead of raising two.
 *
 * Four more properties, each because an alert system can be wrong in a specific way:
 *
 *  1. **A breach outranks a clear.** Two rules can share an `alert_type` (a cooperative rule and a
 *     site rule both watch soil moisture, and `device_alerts` keys on the type, not the rule), so a
 *     pass that both breaches and clears that type keeps it open and reports the suppression. Closing
 *     it would be an automated all-clear on a condition that another configured rule still sees.
 *  2. **Only a rule closes its own alerts.** A clear from rule 7 never resolves a row raised by rule
 *     3, and a row with `alert_rule_id IS NULL` — the platform's own integrity check — is never
 *     auto-closed at all. Only a person dismisses those.
 *  3. **The alert's clock is the platform's clock.** `first_raised_at` and `last_observed_at` are
 *     when WE observed the condition; the device's own instant travels in `detail` as
 *     `reading_measured_at`. A backfilled reading from last night must not make an alert look like it
 *     has existed since last night.
 *  4. **A failure is reported, never swallowed.** Every write that cannot complete comes back in
 *     `failures` with a code and a step, and the ingestion route still answers 201: the reading is
 *     stored and is the more important fact. `evaluated: false` in the response is the operator's
 *     signal that the alerting side of that submission did not happen.
 *
 * Nothing here invents a threshold. A rule that an operator did not configure cannot fire, and the
 * vocabulary of what may fire at all is `metrics.ts`, which mirrors the schema's own CHECKs.
 */

/** Rows one evaluation may open at a time for a single device. Above it the evaluation says so. */
export const OPEN_ALERT_SCAN_CAP = 50;

export interface PersistedAlert {
  alert_id: number;
  node_id: string;
  alert_type: string;
  severity: DeviceAlertRow['severity'];
  status: DeviceAlertRow['status'];
  alert_rule_id: number | null;
  first_raised_at: string;
  last_observed_at: string | null;
  resolved_at: string | null;
}

export type SuppressionReason =
  | 'duplicate_alert_type_in_this_evaluation'
  | 'kept_open_by_a_breach_in_this_evaluation'
  | 'open_alert_belongs_to_another_rule'
  | 'open_alert_has_no_rule_to_clear_it';

export type AlertFailureStep =
  | 'read_open_alerts'
  | 'insert_alert'
  | 'advance_alert'
  | 'resolve_alert'
  | 'reread_after_conflict'
  /** The evaluation threw. The reading it came from is already stored and stays stored. */
  | 'evaluation_aborted';

export interface AlertFailure {
  step: AlertFailureStep;
  alert_type: string | null;
  rule_id: number | null;
  /** A code, never a driver message: the detail goes to the server log, this goes to the client. */
  code: 'database_unavailable' | 'unique_index_conflict_unresolved';
}

export interface AlertEvaluationOutcome {
  evaluated: boolean;
  breaches: number;
  clears: number;
  /** How many configured rules the pass looked at. Zero means the cooperative has written none. */
  rules_considered: number;
  /** Conditions that had no open row: brand-new alerts. */
  raised: PersistedAlert[];
  /** Conditions an open row already covered: the same alert, now re-confirmed. */
  confirmed: PersistedAlert[];
  /** Open rows this pass closed because their own rule no longer sees the condition. */
  resolved: PersistedAlert[];
  suppressed: Array<{ rule_id: number; alert_type: AlertType; reason: SuppressionReason }>;
  skipped: RuleSkipped[];
  failures: AlertFailure[];
  /** The reading the verdicts came from, so a response can name its own evidence. */
  triggered_by: { log_id: number; measured_at: string } | null;
}

/**
 * The device's open conditions, newest first, as a bounded read.
 *
 * Ordered and capped like every other read in this module: a device whose evaluator has gone wrong
 * should not be able to make an evaluation read unbounded history, and `truncated` tells the caller
 * when the cap is what limited it rather than the data.
 */
async function openAlertsForNode(client: ReturnType<typeof getSyncClient>, nodeId: string): Promise<ManagementDb<{ rows: DeviceAlertRow[]; truncated: boolean }>> {
  const { data, error } = await client
    .schema('field')
    .from('device_alerts')
    .select(ALERT_COLUMNS)
    .eq('node_id', nodeId)
    .in('status', [...UNRESOLVED_ALERT_STATUSES])
    .order('first_raised_at', { ascending: false })
    .order('alert_id', { ascending: false })
    .range(0, OPEN_ALERT_SCAN_CAP - 1);

  if (error) return { ok: false, error: alertAccessFailure('read open alerts', error.message) };
  const rows = ((data ?? []) as Array<Record<string, unknown>>).map((row) => normalizeAlert(row, null, null));
  return { ok: true, value: { rows, truncated: rows.length >= OPEN_ALERT_SCAN_CAP } };
}

/**
 * The alert row → the shape the dashboard renders.
 *
 * `site_id` and `device_name` are passed in rather than looked up: `device_alerts` has no site or
 * cooperative column, so the scope hop belongs to whichever query already has the node rows, and a
 * mapper that silently fired its own query would be the N+1 pattern this module keeps refusing.
 */
export function normalizeAlert(row: Record<string, unknown>, deviceName: string | null, siteId: number | null): DeviceAlertRow {
  return {
    alert_id: Number(row.alert_id),
    node_id: String(row.node_id),
    alert_rule_id: row.alert_rule_id === null || row.alert_rule_id === undefined ? null : Number(row.alert_rule_id),
    alert_type: String(row.alert_type),
    severity: row.severity as DeviceAlertRow['severity'],
    status: row.status as DeviceAlertRow['status'],
    first_raised_at: String(row.first_raised_at),
    last_observed_at: String(row.last_observed_at),
    resolved_at: typeof row.resolved_at === 'string' ? row.resolved_at : null,
    detail: row.detail && typeof row.detail === 'object' ? (row.detail as Record<string, unknown>) : null,
    site_id: siteId,
    device_name: deviceName,
  };
}

function toPersisted(row: DeviceAlertRow): PersistedAlert {
  return {
    alert_id: row.alert_id,
    node_id: row.node_id,
    alert_type: row.alert_type,
    severity: row.severity,
    status: row.status,
    alert_rule_id: row.alert_rule_id,
    first_raised_at: row.first_raised_at,
    last_observed_at: row.last_observed_at,
    resolved_at: row.resolved_at,
  };
}

/**
 * The instant to stamp, never earlier than a timestamp already on the row.
 *
 * `device_alert_last_observation_not_before_first` refuses a regression, and a retry that arrives
 * across a clock adjustment would otherwise be rejected by the database for a reason nobody can see
 * from the code. `base` is the value already stored; the answer is the later of it and `now`.
 */
function observedInstant(now: number, base?: string | null): string {
  const baseAt = typeof base === 'string' ? Date.parse(base) : Number.NaN;
  return new Date(Number.isFinite(baseAt) ? Math.max(now, baseAt) : now).toISOString();
}

/**
 * Evaluate the configured rules for one device and persist what they say.
 *
 * This is the function the ingestion route calls after a reading is stored, and the manual sweep
 * endpoint can call with `reading: null` to re-run the contact-based rules (`offline`) against a
 * device that has not reported. A null reading makes threshold rules skip with `no_measurement`
 * rather than clear — see the note in `alertEvaluation.ts` on why an outage is not an all-clear.
 */
export async function evaluateAndPersist(input: {
  node: Pick<HardwareNodeRow, 'node_id' | 'status' | 'cooperative_id' | 'field_site_id' | 'last_seen_at'>;
  reading: SensorReadingRow | null;
  previous: SensorReadingRow | null;
  rules: AlertRuleRow[];
  now?: number;
}): Promise<ManagementDb<AlertEvaluationOutcome>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  const now = input.now ?? Date.now();
  const verdicts = evaluateRules({ node: input.node, reading: input.reading, previous: input.previous, rules: input.rules, now });

  const outcome: AlertEvaluationOutcome = {
    evaluated: true,
    breaches: verdicts.breaches.length,
    clears: verdicts.clears.length,
    rules_considered: input.rules.length,
    raised: [],
    confirmed: [],
    resolved: [],
    suppressed: [],
    skipped: verdicts.skipped,
    failures: [],
    triggered_by: verdicts.triggered_by,
  };

  try {
    const client = getSyncClient();
    const open = await openAlertsForNode(client, input.node.node_id);
    if (!open.ok) {
      outcome.evaluated = false;
      outcome.failures.push({ step: 'read_open_alerts', alert_type: null, rule_id: null, code: 'database_unavailable' });
      return { ok: true, value: outcome };
    }

    const openByType = new Map<string, DeviceAlertRow>();
    for (const row of open.value.rows) {
      if (!openByType.has(row.alert_type)) openByType.set(row.alert_type, row);
    }

    const claimed = new Set<string>();

    for (const breach of verdicts.breaches) {
      if (claimed.has(breach.alert_type)) {
        // The schema holds one open row per (node, type), so a second rule that agrees with the
        // first cannot raise its own alert — and it should not: the operator's screen would show two
        // conditions where the field has one. Reported, not hidden.
        outcome.suppressed.push({ rule_id: breach.rule_id, alert_type: breach.alert_type, reason: 'duplicate_alert_type_in_this_evaluation' });
        continue;
      }
      claimed.add(breach.alert_type);

      const existing = openByType.get(breach.alert_type) ?? null;
      const written = existing === null ? await raiseAlert(client, input.node.node_id, breach, now) : await advanceAlert(client, existing, breach, now);

      if (!written.ok) {
        outcome.failures.push(written.failure);
        continue;
      }
      openByType.set(breach.alert_type, written.value);
      (existing === null ? outcome.raised : outcome.confirmed).push(toPersisted(written.value));
    }

    for (const clear of verdicts.clears) {
      if (claimed.has(clear.alert_type)) {
        outcome.suppressed.push({ rule_id: clear.rule_id, alert_type: clear.alert_type, reason: 'kept_open_by_a_breach_in_this_evaluation' });
        continue;
      }
      const openRow = openByType.get(clear.alert_type) ?? null;
      if (openRow === null) continue;
      if (openRow.alert_rule_id === null) {
        outcome.suppressed.push({ rule_id: clear.rule_id, alert_type: clear.alert_type, reason: 'open_alert_has_no_rule_to_clear_it' });
        continue;
      }
      if (openRow.alert_rule_id !== clear.rule_id) {
        outcome.suppressed.push({ rule_id: clear.rule_id, alert_type: clear.alert_type, reason: 'open_alert_belongs_to_another_rule' });
        continue;
      }

      const closed = await closeAlert(client, openRow, now);
      if (!closed.ok) {
        outcome.failures.push(closed.failure);
        continue;
      }
      openByType.delete(clear.alert_type);
      outcome.resolved.push(toPersisted(closed.value));
    }

    return { ok: true, value: outcome };
  } catch (err) {
    outcome.failures.push({ step: 'evaluation_aborted', alert_type: null, rule_id: null, code: 'database_unavailable' });
    console.error(`Field Intelligence: alert evaluation aborted for ${input.node.node_id} (${messageOf(err).slice(0, 200)})`);
    return { ok: true, value: outcome };
  }
}

/**
 * A new open alert.
 *
 * The insert is the normal path and the 23505 branch is the retry path: if a concurrent submission
 * raised the same condition first, this evaluation adopts that row and advances it instead of
 * reporting a failure. That is the whole of what "safe to retry" means here, and it is only possible
 * because the conflict names the index it came from.
 */
async function raiseAlert(
  client: ReturnType<typeof getSyncClient>,
  nodeId: string,
  breach: RuleBreach,
  now: number,
): Promise<{ ok: true; value: DeviceAlertRow } | { ok: false; failure: AlertFailure }> {
  const at = observedInstant(now);
  const payload = {
    node_id: nodeId,
    alert_rule_id: breach.rule_id,
    alert_type: breach.alert_type,
    severity: breach.severity,
    status: 'open',
    first_raised_at: at,
    last_observed_at: at,
    detail: breach.detail,
  };

  const { data, error } = await client.schema('field').from('device_alerts').insert(payload).select(ALERT_COLUMNS).maybeSingle();

  if (error) {
    if (error.code === '23505' && error.message.includes('device_alert_one_open_per_node_and_type_uid')) {
      const existing = await openAlertsForNode(client, nodeId);
      if (existing.ok) {
        const row = existing.value.rows.find((alert) => alert.alert_type === breach.alert_type) ?? null;
        if (row) return advanceAlert(client, row, breach, now);
      }
      return { ok: false, failure: { step: 'reread_after_conflict', alert_type: breach.alert_type, rule_id: breach.rule_id, code: 'unique_index_conflict_unresolved' } };
    }
    return { ok: false, failure: storageFailure('insert_alert', error.message, breach.alert_type, breach.rule_id) };
  }

  if (!data) return { ok: false, failure: { step: 'insert_alert', alert_type: breach.alert_type, rule_id: breach.rule_id, code: 'database_unavailable' } };
  return { ok: true, value: normalizeAlert(data as Record<string, unknown>, null, null) };
}

/**
 * Re-confirm a condition that already has an open row.
 *
 * `detail` is replaced rather than merged: the evidence on an open alert should be the observation
 * that last confirmed it, and the previous evidence stays reachable through the reading ids it
 * names. `status` and `first_raised_at` are not touched, so an acknowledged alert stays
 * acknowledged by the person who acknowledged it and an alert's age keeps meaning "since the
 * condition was first seen".
 */
async function advanceAlert(
  client: ReturnType<typeof getSyncClient>,
  existing: DeviceAlertRow,
  breach: RuleBreach,
  now: number,
): Promise<{ ok: true; value: DeviceAlertRow } | { ok: false; failure: AlertFailure }> {
  const at = observedInstant(now, existing.last_observed_at);
  const { data, error } = await client
    .schema('field')
    .from('device_alerts')
    .update({ last_observed_at: at, detail: breach.detail })
    .eq('alert_id', existing.alert_id)
    .in('status', [...UNRESOLVED_ALERT_STATUSES])
    .select(ALERT_COLUMNS)
    .maybeSingle();

  if (error) return { ok: false, failure: storageFailure('advance_alert', error.message, breach.alert_type, breach.rule_id) };
  if (!data) return { ok: false, failure: { step: 'advance_alert', alert_type: breach.alert_type, rule_id: breach.rule_id, code: 'database_unavailable' } };
  return { ok: true, value: normalizeAlert(data as Record<string, unknown>, existing.device_name, existing.site_id) };
}

/**
 * Close an alert whose own rule no longer sees the condition.
 *
 * `status` and `resolved_at` go in the SAME statement because
 * `device_alert_closed_only_with_timestamp` makes them equivalent: `resolved` without a timestamp is
 * refused, and so is a timestamp on a row still called `open`. The `.in(status, open|acknowledged)`
 * guard is the compare-and-set — a row a manager dismissed a moment earlier is not reopened or
 * re-resolved by an evaluator that never saw it.
 */
async function closeAlert(
  client: ReturnType<typeof getSyncClient>,
  existing: DeviceAlertRow,
  now: number,
): Promise<{ ok: true; value: DeviceAlertRow } | { ok: false; failure: AlertFailure }> {
  const at = observedInstant(now, existing.last_observed_at);
  const { data, error } = await client
    .schema('field')
    .from('device_alerts')
    .update({ status: 'resolved', resolved_at: at })
    .eq('alert_id', existing.alert_id)
    .in('status', [...UNRESOLVED_ALERT_STATUSES])
    .select(ALERT_COLUMNS)
    .maybeSingle();

  if (error) return { ok: false, failure: storageFailure('resolve_alert', error.message, existing.alert_type, existing.alert_rule_id) };
  // No row: somebody closed it between our read and this write. That is a success for the field and
  // a no-op for us, not an error — the condition is closed either way.
  if (!data) return { ok: true, value: { ...existing, status: 'resolved', resolved_at: at } };
  return { ok: true, value: normalizeAlert(data as Record<string, unknown>, existing.device_name, existing.site_id) };
}

function storageFailure(step: AlertFailureStep, detail: string, alertType: string | null, ruleId: number | null): AlertFailure {
  console.error(`Field Intelligence: alert ${step} failed (${detail.slice(0, 200)})`);
  return { step, alert_type: alertType, rule_id: ruleId, code: 'database_unavailable' };
}

/* ------------------------------------------------------------------------------------------
 * The reading before this one
 * ---------------------------------------------------------------------------------------- */

/**
 * The device's previous stored reading, by measurement instant.
 *
 * One row, `log_id` descending as the tie-breaker: `reading_change` is about the jump between two
 * consecutive measurements, and a rule that compared a reading against itself would report a change
 * of zero forever. Rows at the SAME instant are excluded — the replay index makes them different
 * payloads of one instant, and neither is "the previous one". Null is a real answer (a first
 * reading) and the evaluator turns it into a skip rather than a zero-change clear.
 */
export async function previousReading(nodeId: string, beforeMeasuredAt: string): Promise<ManagementDb<SensorReadingRow | null>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('sensor_logs')
      .select(READING_COLUMNS)
      .eq('node_id', nodeId)
      .lt('measured_at', beforeMeasuredAt)
      .order('measured_at', { ascending: false })
      .order('log_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { ok: false, error: alertAccessFailure('previous reading', error.message) };
    if (!data) return { ok: true, value: null };
    return { ok: true, value: normalizeReading(data as Record<string, unknown>) };
  } catch (err) {
    return { ok: false, error: alertAccessFailure('previous reading', messageOf(err)) };
  }
}

/* ------------------------------------------------------------------------------------------
 * The ingestion hook
 * ---------------------------------------------------------------------------------------- */

/**
 * Evaluate one stored reading against the rules that cover its device.
 *
 * The route calls this and nothing else: the two lookups the evaluator needs (which rules apply to
 * this node, and what did this device say last) are gathered here so a caller cannot reach the
 * persistence half with a stale `previous` or a rule list filtered by the wrong scope.
 *
 * A deployment with no rules configured costs this function one bounded query on `alert_rules` and
 * no write at all, which is deliberate: alerting is opt-in per cooperative, and an unconfigured farm
 * should not pay a storage round trip for an empty rule set. `rules_considered: 0` in the outcome is
 * the difference between "we looked and nothing applies" and "we did not look".
 *
 * Failure is returned, never thrown, and the reading that triggered it stays stored. §4 of the brief
 * asks for exactly that: an evaluation that cannot complete is an alerting gap to be reported, not a
 * reason to refuse a device's data.
 */
export async function evaluateStoredReading(input: {
  node: HardwareNodeRow;
  reading: SensorReadingRow;
  now?: number;
}): Promise<ManagementDb<AlertEvaluationOutcome>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  const [rules, previous] = await Promise.all([
    rulesApplyingToNode(input.node),
    previousReading(input.node.node_id, input.reading.measured_at),
  ]);
  if (!rules.ok) return rules;
  if (!previous.ok) return previous;

  if (rules.value.length === 0) {
    return {
      ok: true,
      value: {
        evaluated: true,
        breaches: 0,
        clears: 0,
        rules_considered: 0,
        raised: [],
        confirmed: [],
        resolved: [],
        suppressed: [],
        skipped: [],
        failures: [],
        triggered_by: { log_id: input.reading.log_id, measured_at: input.reading.measured_at },
      },
    };
  }

  return evaluateAndPersist({
    node: input.node,
    reading: input.reading,
    previous: previous.value,
    rules: rules.value,
    now: input.now,
  });
}

/* ------------------------------------------------------------------------------------------
 * Alert management: read, acknowledge, resolve
 * ---------------------------------------------------------------------------------------- */

export interface AlertWithScope {
  alert: DeviceAlertRow;
  node: HardwareNodeRow | null;
}

const unknownAlert = { code: 'unknown_alert', message: 'No alert with that id is available to this caller.' } as const;

/**
 * One alert, with its device, after the ownership hop.
 *
 * `device_alerts` carries no cooperative column, so scope is established the same way every other
 * alert read does it: read the alert, read the node it belongs to, and compare THAT cooperative id
 * against the caller's server-resolved scope. Both a nonexistent id and an out-of-scope one answer
 * `unknown_alert`, because "alert 41 exists in some other cooperative" is the fact a probing caller
 * is after. The check lives next to the query rather than in the route, because a detail endpoint is
 * where an id is easiest to guess.
 */
export async function alertWithScope(alertId: number, cooperativeScope: number[]): Promise<ManagementDb<AlertWithScope>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;
  if (cooperativeScope.length === 0) return { ok: false, error: unknownAlert };

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('device_alerts')
      .select(ALERT_COLUMNS)
      .eq('alert_id', alertId)
      .maybeSingle();

    if (error) return { ok: false, error: alertAccessFailure('alert detail', error.message) };
    if (!data) return { ok: false, error: unknownAlert };

    const alert = normalizeAlert(data as Record<string, unknown>, null, null);
    const node = await nodeForAlert(client, alert.node_id);
    if (!node.ok) return node;
    if (!node.value || node.value.cooperative_id === null || !cooperativeScope.includes(node.value.cooperative_id)) return { ok: false, error: unknownAlert };

    return { ok: true, value: { alert: { ...alert, device_name: node.value.name, site_id: node.value.field_site_id }, node: node.value } };
  } catch (err) {
    return { ok: false, error: alertAccessFailure('alert detail', messageOf(err)) };
  }
}

async function nodeForAlert(client: ReturnType<typeof getSyncClient>, nodeId: string): Promise<ManagementDb<HardwareNodeRow | null>> {
  const { data, error } = await client.schema('field').from('hardware_nodes').select(NODE_COLUMNS).eq('node_id', nodeId).maybeSingle();
  if (error) return { ok: false, error: alertAccessFailure('alert device', error.message) };
  if (!data) return { ok: true, value: null };
  return { ok: true, value: data as HardwareNodeRow };
}

/**
 * `open` → `acknowledged`: a person has seen it, the condition still holds.
 *
 * The status transition is written as a compare-and-set on the status the caller's read saw, so two
 * managers clicking at once produce one change and one honest `changed: false`, not a lost update.
 * A row already `acknowledged` answers success without writing: an acknowledgement is a statement
 * that can be repeated safely, and §9 asks for exactly that.
 */
export async function acknowledgeAlert(alertId: number, cooperativeScope: number[]): Promise<ManagementDb<{ alert: DeviceAlertRow; changed: boolean }>> {
  return transitionAlert(alertId, cooperativeScope, ['open'], 'acknowledged', null);
}

/**
 * `open` or `acknowledged` → `resolved`, with its timestamp in the same statement.
 *
 * Resolution is a management action and nothing else: the evaluator closes conditions automatically
 * from a cleared rule, and a person closes one the rule cannot see — a device swapped out, a known
 * cause, a field that changed. `device_alert_closed_only_with_timestamp` is why `resolved_at` is
 * part of this call rather than a second update, and why a partial failure cannot leave a `resolved`
 * row without a time on it.
 */
export async function resolveAlert(alertId: number, cooperativeScope: number[], at?: string): Promise<ManagementDb<{ alert: DeviceAlertRow; changed: boolean }>> {
  return transitionAlert(alertId, cooperativeScope, ['open', 'acknowledged'], 'resolved', at ?? new Date().toISOString());
}

async function transitionAlert(
  alertId: number,
  cooperativeScope: number[],
  from: DeviceAlertRow['status'][],
  to: DeviceAlertRow['status'],
  resolvedAt: string | null,
): Promise<ManagementDb<{ alert: DeviceAlertRow; changed: boolean }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  const current = await alertWithScope(alertId, cooperativeScope);
  if (!current.ok) return current;

  const alert = current.value.alert;
  if (!from.includes(alert.status)) {
    // Already in the target state (or closed for good): idempotent success, no write issued.
    if (alert.status === to) return { ok: true, value: { alert, changed: false } };
    return {
      ok: false,
      error: {
        code: 'invalid_payload',
        message: `This alert is ${alert.status}, which cannot move directly to ${to}. Only an open or acknowledged alert can be changed.`,
      },
    };
  }

  try {
    const client = getSyncClient();
    const patch: Record<string, string> = { status: to };
    // Both halves of `device_alert_closed_only_with_timestamp` in one statement: a closed row
    // without a timestamp, or a timestamp on a row still called open, is refused by the database.
    if (to === 'resolved' || to === 'dismissed') patch.resolved_at = resolvedAt ?? new Date().toISOString();

    const { data, error } = await client
      .schema('field')
      .from('device_alerts')
      .update(patch)
      .eq('alert_id', alertId)
      .eq('status', alert.status)
      .select(ALERT_COLUMNS)
      .maybeSingle();

    if (error) return { ok: false, error: alertAccessFailure('alert status change', error.message) };
    if (!data) {
      // Somebody else moved the row between the read and this write. Re-read and report what it says
      // now, rather than claiming a change that another manager made first.
      const reread = await alertWithScope(alertId, cooperativeScope);
      if (!reread.ok) return reread;
      return { ok: true, value: { alert: reread.value.alert, changed: false } };
    }

    return { ok: true, value: { alert: normalizeAlert(data as Record<string, unknown>, alert.device_name, alert.site_id), changed: true } };
  } catch (err) {
    return { ok: false, error: alertAccessFailure('alert status change', messageOf(err)) };
  }
}

/**
 * The rule behind an alert, when there is one.
 *
 * `device_alerts.alert_rule_id` is a foreign key, so a persisted alert can always be traced back to
 * the configuration that produced it — the difference between "the system alerted" and "rule 12,
 * `soil_moisture lt 30 %`, which an operator in this cooperative wrote". Null is the platform's own
 * integrity check, and the UI says so rather than showing a blank.
 */
export async function ruleForAlert(alertRuleId: number | null): Promise<ManagementDb<AlertRuleRow | null>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;
  if (alertRuleId === null) return { ok: true, value: null };

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('alert_rules')
      .select(RULE_COLUMNS)
      .eq('rule_id', alertRuleId)
      .maybeSingle();

    if (error) return { ok: false, error: alertAccessFailure('alert rule', error.message) };
    if (!data) return { ok: true, value: null };

    const row = data as Record<string, unknown>;
    const cooperativeId = numberFrom(row.cooperative_id);
    const siteId = numberFrom(row.field_site_id);
    const metric = row.metric as RuleMetric;
    return {
      ok: true,
      value: {
        rule_id: Number(row.rule_id),
        name: String(row.name),
        cooperative_id: cooperativeId,
        field_site_id: siteId,
        metric,
        comparator: row.comparator as AlertRuleRow['comparator'],
        threshold_value: numberFrom(row.threshold_value),
        threshold_units: typeof row.threshold_units === 'string' ? row.threshold_units : METRIC_UNITS[metric],
        severity: row.severity as AlertRuleRow['severity'],
        status: row.status as AlertRuleRow['status'],
        scope_origin: siteId !== null ? 'field_site' : cooperativeId !== null ? 'cooperative' : 'platform',
      },
    };
  } catch (err) {
    return { ok: false, error: alertAccessFailure('alert rule', messageOf(err)) };
  }
}

function alertAccessFailure(operation: string, detail: string): ManagementFailure {
  console.error(`Field Intelligence: alert ${operation} failed (${detail.slice(0, 200)})`);
  return {
    code: 'database_unavailable',
    message: `The Field Intelligence database could not complete ${operation}. No alert was read or changed.`,
  };
}

export type { RuleBreach, RuleSkipped };
