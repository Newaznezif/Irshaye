import type { NextRequest } from 'next/server';

import { acknowledgeAlert } from '@/lib/field/alertService';
import { completed, loadAlertAndAuthorize, openManagement, refused } from '@/lib/field/managementApi';

/**
 * `POST /api/field/alerts/[alertId]/acknowledge` — a person has seen this condition.
 *
 * Manager-only: `capabilityOf('alert_acknowledge')` is `manage`, so a viewer holding the same
 * cooperative membership is refused with 403 and told that closing an incident record is a manager's
 * statement. A caller who is not a member at all gets the same 404 as a bad id, because which
 * cooperative owns an alert is not information for a stranger.
 *
 * The write is a compare-and-set on the status the authorization step read, so two managers clicking
 * the same alert at once produce one change and one honest `changed: false` rather than two
 * acknowledgements that disagree about what they wrote. Retrying this request is safe by design — an
 * alert that is already acknowledged answers success without writing again, which is what §9 asks of
 * an alerting surface that sits behind a flaky mobile connection.
 *
 * Acknowledging changes nothing about the condition. The rule still holds, the device keeps reporting,
 * and the next confirming observation advances `last_observed_at` on this same row. That is the
 * difference between acknowledging and resolving, and the response says so in the message.
 *
 * No body is read: the only input is the id in the path, and inventing a field to make the endpoint
 * look like the others would be a second way for a client to be wrong about what this does.
 */

type RouteContext = { params: Promise<{ alertId: string }> };

export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  const { alertId } = await context.params;

  const opened = await openManagement(request, 'alert_acknowledge');
  if (!opened.ok) return opened.response;
  const ctx = opened.ctx;

  const authorized = await loadAlertAndAuthorize(ctx, alertId);
  if (!authorized.ok) return authorized.response;
  const { alert, node, role, scope } = authorized;

  const acknowledged = await acknowledgeAlert(authorized.alert.alert_id, scope);
  if (!acknowledged.ok) {
    const outcome = acknowledged.error.code === 'database_unavailable' || acknowledged.error.code === 'database_not_configured' ? 'failed' : 'refused';
    await ctx.audit({
      outcome,
      actorRole: role,
      nodeId: alert.node_id,
      cooperativeId: node?.cooperative_id ?? null,
      reasonCode: acknowledged.error.code,
      detail: { alert_id: alert.alert_id },
    });
    return refused(acknowledged.error);
  }

  const auditRecorded = await ctx.audit({
    outcome: 'success',
    actorRole: role,
    nodeId: alert.node_id,
    cooperativeId: node?.cooperative_id ?? null,
    detail: { alert_id: alert.alert_id, status: acknowledged.value.alert.status },
  });

  return completed(
    {
      alert: acknowledged.value.alert,
      previous_status: alert.status,
      changed: acknowledged.value.changed,
      allowed_transitions: acknowledged.value.alert.status === 'open' ? ['alert_acknowledge', 'alert_resolve'] : ['alert_resolve'],
    },
    acknowledged.value.changed
      ? `Alert ${String(alert.alert_id)} (${alert.alert_type} on ${alert.node_id}) is acknowledged. The condition is unchanged: it still holds until the rule that raised it stops seeing it, or a manager resolves it.`
      : `Alert ${String(alert.alert_id)} was already ${acknowledged.value.alert.status}, so nothing was written.`,
    auditRecorded,
  );
}
