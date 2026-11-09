import type { NextRequest } from 'next/server';

import { ruleForAlert } from '@/lib/field/alertService';
import { completed, loadAlertAndAuthorize, openScopedRead, refused } from '@/lib/field/managementApi';
import type { CooperativeRole, ManagementAction } from '@/lib/field/types';

/**
 * `GET /api/field/alerts/[alertId]` — one condition, and the evidence behind it.
 *
 * Scope is established by walking `alert_id` → `node_id` → `cooperative_id`, because
 * `field.device_alerts` carries no cooperative column of its own: the alert row alone says nothing
 * about who is allowed to read it. A nonexistent id and another cooperative's id get the same 404,
 * which matters more here than on the device routes — an `alert_id` is a small integer handed out in
 * order, so it is the easiest thing in this API to enumerate.
 *
 * `alert_view` is a READ capability: a viewer may investigate an alert, its rule and the observation
 * that raised it, and may not close it. That is the point of separating the detail route from the
 * `/acknowledge` and `/resolve` actions next door.
 *
 * What the response carries is the schema's own words — stable keys for type, severity, status, plus
 * the `detail` object with the metric, comparator, observed value and threshold. No sentence is
 * assembled server-side, because this screen is rendered in five languages and a stored English
 * string cannot be translated after the fact.
 */

type RouteContext = { params: Promise<{ alertId: string }> };

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  const { alertId } = await context.params;

  const opened = await openScopedRead(request, 'alert_view');
  if (!opened.ok) return opened.response;

  const authorized = await loadAlertAndAuthorize(opened.ctx, alertId);
  if (!authorized.ok) return authorized.response;

  const rule = await ruleForAlert(authorized.alert.alert_rule_id);
  if (!rule.ok) return refused(rule.error);

  const alert = authorized.alert;

  return completed(
    {
      alert,
      // The device, as this response knows it: only the fields the node row was read for. No
      // provisioning claim is made here, because no credential row was read to answer this question.
      device: authorized.node
        ? {
            node_id: authorized.node.node_id,
            name: authorized.node.name,
            status: authorized.node.status,
            cooperative_id: authorized.node.cooperative_id,
            field_site_id: authorized.node.field_site_id,
            last_seen_at: authorized.node.last_seen_at,
          }
        : null,
      rule: rule.value,
      // Null `alert_rule_id` is the platform's own integrity check, not a missing lookup: saying so
      // is the difference between an unexplained blank and an operator who knows nobody configured
      // this condition.
      rule_note:
        rule.value === null
          ? 'No rule is behind this alert. Rows with no rule id are raised by the platform itself — a payload the database refused, or an operator record — so there is no threshold to read.'
          : `Rule ${String(rule.value.rule_id)} (${rule.value.name}), scope ${rule.value.scope_origin}, applies ${rule.value.metric} ${rule.value.comparator} ${String(rule.value.threshold_value)}${rule.value.threshold_units}.`,
      evidence: alert.detail,
      evidence_note:
        alert.detail === null
          ? 'This row carries no detail object, so there is no stored observation behind it to show.'
          : 'The stored observation this condition was raised or last confirmed on. Values are the readings as recorded, not a re-measurement.',
      status: alert.status,
      allowed_transitions: allowedTransitions(authorized.role, alert.status),
      capabilities: alertCapabilitiesFor(authorized.role),
    },
    `${alert.alert_type} on ${alert.node_id}: ${alert.severity}, ${alert.status}.`,
    null,
  );
}

/**
 * What this caller may do next to this alert, computed from the role the database gave them and the
 * status the row actually holds.
 *
 * A hint for the UI, not a permission: the action routes re-run `decideAccess` and re-read the row, so
 * a button that appeared from a stale list here still gets the honest 403 or the honest
 * "this alert is resolved". Listing the transitions the server will refuse would be the one way for
 * this response to become a lie.
 */
function allowedTransitions(role: CooperativeRole, status: string): ManagementAction[] {
  if (role !== 'manager') return [];
  if (status === 'open') return ['alert_acknowledge', 'alert_resolve'];
  if (status === 'acknowledged') return ['alert_resolve'];
  return [];
}

function alertCapabilitiesFor(role: CooperativeRole): ManagementAction[] {
  if (role === 'viewer') return ['alert_view'];
  return ['alert_view', 'alert_acknowledge', 'alert_resolve'];
}
