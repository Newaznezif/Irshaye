import type { NextRequest } from 'next/server';

import { intParam, stringParam } from '@/lib/data/api';
import { completed, openScopedRead, refused, scopeMessage } from '@/lib/field/managementApi';
import { ALERT_SEVERITIES, ALERT_STATUSES, alertRulesInScope, alertsPage } from '@/lib/field/observationService';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_OFFSET, MAX_PAGE_SIZE } from '@/lib/field/registration';

/**
 * `/api/field/alerts` — what the platform has already raised, and the rules that raised it.
 *
 * Read-only, and that is the requirement rather than a gap. This route evaluates nothing: an alert
 * is a row `field.device_alerts` holds, and the thresholds behind it are the ones an operator wrote
 * into `field.alert_rules`. Inventing a limit in a browser tab — "below 30 % is dry" — would be an
 * agronomic opinion wearing IRSHAYE's interface, on soil and a crop this deployment knows nothing
 * about. The rules are returned beside the alerts so a farmer can read the number that fired and
 * who chose it, which is the whole difference between an alert and advice.
 *
 * `alert_type` and `severity` come back as the schema's stable keys, never as sentences: prose in a
 * database cannot be translated, and this module ships in five languages.
 */

export async function GET(request: NextRequest): Promise<Response> {
  const opened = await openScopedRead(request, 'alert_list');
  if (!opened.ok) return opened.response;
  const { scope } = opened;

  const url = new URL(request.url);

  const status = stringParam(url, 'status');
  if (status !== null && !(ALERT_STATUSES as readonly string[]).includes(status)) {
    return refused({ code: 'invalid_payload', message: `status must be one of: ${ALERT_STATUSES.join(', ')}.` });
  }

  const severity = stringParam(url, 'severity');
  if (severity !== null && !(ALERT_SEVERITIES as readonly string[]).includes(severity)) {
    return refused({ code: 'invalid_payload', message: `severity must be one of: ${ALERT_SEVERITIES.join(', ')}.` });
  }

  const limit = intParam(url, 'limit', 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const offset = intParam(url, 'offset', 0, MAX_PAGE_OFFSET, 0);

  const listed = await alertsPage(scope, { status, severity, limit, offset });
  if (!listed.ok) return refused(listed.error);

  const rules = await alertRulesInScope(scope);
  if (!rules.ok) return refused(rules.error);

  return completed(
    {
      alerts: listed.value.alerts,
      total: listed.value.total,
      page: listed.value.page,
      coverage: listed.value.coverage,
      configured_rules: rules.value.rules,
      rules_coverage: rules.value.coverage,
      visible_cooperatives: scope,
    },
    scopeMessage(scope, `${String(listed.value.alerts.length)} of ${String(listed.value.total)} alerts, with ${String(rules.value.rules.length)} configured rule(s) in scope.`),
    null,
  );
}
