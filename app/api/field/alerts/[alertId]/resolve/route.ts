import type { NextRequest } from 'next/server';

import { resolveAlert } from '@/lib/field/alertService';
import { completed, loadAlertAndAuthorize, openManagement, refused } from '@/lib/field/managementApi';

/**
 * `POST /api/field/alerts/[alertId]/resolve` — a person closes this condition.
 *
 * The manual half of alerting. The evaluator closes a condition automatically when the rule that
 * raised it stops seeing the breach; this is for the cases a threshold cannot see — a device swapped
 * out, a known cause already fixed, a field that changed use. Manager-only, for the same reason
 * acknowledging is: closing an incident record is a statement about the field, and a viewer's role
 * does not carry it.
 *
 * `status` and `resolved_at` are written in the same statement because
 * `device_alert_closed_only_with_timestamp` makes them one fact: a resolved row without a timestamp
 * is refused, and a timestamp on a row still called open is refused too. The caller supplies no
 * timestamp — this is when the platform was told, and letting a client set it would be a way to
 * backdate who fixed what.
 *
 * The consequence worth stating out loud: resolving does not silence a rule. If the condition still
 * holds, the next reading that breaches it raises a NEW alert, because the partial unique index only
 * guarantees one open row per device and type. An alert that keeps coming back after a resolution is
 * not a bug and not a duplicate — it is the sensor still saying the same thing.
 */

type RouteContext = { params: Promise<{ alertId: string }> };

export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  const { alertId } = await context.params;

  const opened = await openManagement(request, 'alert_resolve');
  if (!opened.ok) return opened.response;
  const ctx = opened.ctx;

  const authorized = await loadAlertAndAuthorize(ctx, alertId);
  if (!authorized.ok) return authorized.response;
  const { alert, node, role, scope } = authorized;

  const resolved = await resolveAlert(authorized.alert.alert_id, scope);
  if (!resolved.ok) {
    const outcome = resolved.error.code === 'database_unavailable' || resolved.error.code === 'database_not_configured' ? 'failed' : 'refused';
    await ctx.audit({
      outcome,
      actorRole: role,
      nodeId: alert.node_id,
      cooperativeId: node?.cooperative_id ?? null,
      reasonCode: resolved.error.code,
      detail: { alert_id: alert.alert_id },
    });
    return refused(resolved.error);
  }

  const auditRecorded = await ctx.audit({
    outcome: 'success',
    actorRole: role,
    nodeId: alert.node_id,
    cooperativeId: node?.cooperative_id ?? null,
    detail: { alert_id: alert.alert_id, status: resolved.value.alert.status },
  });

  return completed(
    {
      alert: resolved.value.alert,
      previous_status: alert.status,
      changed: resolved.value.changed,
      allowed_transitions: [],
      // Said here because it is the surprise this endpoint would otherwise cause: a resolution is not
      // a mute button, and an operator who expects silence needs to know what will happen instead.
      if_the_condition_returns: 'A new alert row is raised on the next reading that breaches the rule. Nothing is suppressed.',
    },
    resolved.value.changed
      ? `Alert ${String(alert.alert_id)} (${alert.alert_type} on ${alert.node_id}) is resolved as of ${String(resolved.value.alert.resolved_at)}.`
      : `Alert ${String(alert.alert_id)} was already ${resolved.value.alert.status}, so nothing was written.`,
    auditRecorded,
  );
}
