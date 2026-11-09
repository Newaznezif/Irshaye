import type { NextRequest } from 'next/server';

import { stringParam } from '@/lib/data/api';
import { toDeviceSummary } from '@/lib/field/deviceService';
import { deviceHistory } from '@/lib/field/historyService';
import { completed, loadAndAuthorize, openScopedRead, refused } from '@/lib/field/managementApi';
import { alertRulesInScope } from '@/lib/field/observationService';

/**
 * `GET /api/field/devices/[nodeId]/history` — one device's stored past, as statistics.
 *
 * The device is authorized before its history is read, exactly as `/readings` does it: the node is
 * resolved, the cooperative that owns it comes out of the database, and `observation_read` (a read
 * capability) is what `decideAccess` grades — so a viewer may watch the trend and cannot get here to
 * change anything. `field.sensor_logs` has no cooperative column, which makes the device's ownership
 * the only thing between a caller and another farm's field history.
 *
 * What this is NOT: the readings themselves. Those stay at `/readings`, page by page. This endpoint
 * answers the questions a page of rows cannot — how often does this device report, how long was it
 * silent, what did each quantity average, how much of what it sent was missing — from a capped scan
 * of the rows, and it carries the scan's coverage beside every figure so a derived statistic can
 * never be read as a total.
 *
 * Nothing is interpolated and nothing is zero-filled. A metric the device never measured comes back
 * with `samples: 0` and null min/mean/max; a bucket nobody reported in holds null. The silence
 * allowance that turns "old" into "stale" is the operator's own `offline` rule, and where no such
 * rule exists the verdict is null rather than a number this code invented.
 */

type RouteContext = { params: Promise<{ nodeId: string }> };

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  const { nodeId } = await context.params;

  const opened = await openScopedRead(request, 'observation_read');
  if (!opened.ok) return opened.response;

  const authorized = await loadAndAuthorize(opened.ctx, nodeId);
  if (!authorized.ok) return authorized.response;

  const url = new URL(request.url);
  // The caller's scope, not the device's cooperative: `deviceHistory` narrows this list to the rules
  // that actually cover this node (site → cooperative → platform), and a scope already resolved by
  // `openScopedRead` is one less thing this route has to derive from a nullable column.
  const rules = await alertRulesInScope(opened.scope);
  if (!rules.ok) return refused(rules.error);

  const history = await deviceHistory(
    authorized.node,
    { range: stringParam(url, 'range'), from: stringParam(url, 'from'), to: stringParam(url, 'to') },
    rules.value.rules,
  );
  if (!history.ok) return refused(history.error);

  const value = history.value;

  return completed(
    {
      device: toDeviceSummary(authorized.node, authorized.credential),
      window: value.window,
      scanned_window: value.scanned_window,
      coverage: value.coverage,
      total_in_range: value.total_in_range,
      rows_scanned: value.rows_scanned,
      scan_cap: value.scan_cap,
      all_time_observations: value.all_time_observations,
      offline_window_minutes: value.offline_window_minutes,
      summary: value.summary,
      // The sentence the panel needs to be able to say out loud: which numbers are exact counts from
      // the database and which are computed from the capped scan.
      basis: `${String(value.total_in_range)} readings counted in the window; statistics computed from ${String(value.rows_scanned)} scanned rows.`,
      rules_coverage: rules.value.coverage,
    },
    value.coverage === 'complete'
      ? `${authorized.node.name}: ${String(value.total_in_range)} readings in this ${value.window.range} window.`
      : `${authorized.node.name}: this window holds ${String(value.total_in_range)} readings but only the newest ${String(value.rows_scanned)} could be scanned — the statistics describe ${value.scanned_window.from.slice(0, 10)} onward, not the whole window.`,
    null,
  );
}
