import type { NextRequest } from 'next/server';

import { stringParam } from '@/lib/data/api';
import { fleetDataQuality } from '@/lib/field/historyService';
import { completed, openScopedRead, refused, scopeMessage } from '@/lib/field/managementApi';
import { alertRulesInScope } from '@/lib/field/observationService';

/**
 * `GET /api/field/data-quality` — how well the fleet is reporting, before anyone asks what it said.
 *
 * A dashboard that only shows readings cannot answer the question an operator actually starts with:
 * is the field quiet because nothing is happening or because nothing is talking. This endpoint is
 * that answer, computed from the stored rows and the device rows beside them — missing measurements,
 * reporting gaps longer than the operator's own silence allowance, duplicate instants, server-stamped
 * timestamps, devices that have never completed an authenticated call.
 *
 * Three things it deliberately does not do:
 *
 *  - **It does not judge.** "Stale" is measured against an `offline` rule a manager configured. With
 *    no such rule the response returns ages, intervals and counts with `basis: 'not_configured'` and
 *    null verdicts, because how long a farm's sensor may be silent is a fact about that farm's
 *    power supply and network, not about this code.
 *  - **It does not present a scan as a total.** Every headline number is an exact count query; the
 *    per-device detail comes from a capped scan whose coverage travels with it. Where the scan
 *    cannot prove an absence — a device missing from a page limit — the answer is null, not zero.
 *  - **It does not evaluate rules or write alerts.** Read-only, like every endpoint here.
 *
 * Timestamps are the stored instants the device claimed, and the buckets any trend uses are aligned
 * to Africa/Addis_Ababa (UTC+3, no daylight saving) the same way `/history` and the overview do.
 */

export async function GET(request: NextRequest): Promise<Response> {
  const opened = await openScopedRead(request, 'overview_read');
  if (!opened.ok) return opened.response;
  const { scope } = opened;

  const url = new URL(request.url);
  const rules = await alertRulesInScope(scope);
  if (!rules.ok) return refused(rules.error);

  const quality = await fleetDataQuality(scope, { range: stringParam(url, 'range'), from: stringParam(url, 'from'), to: stringParam(url, 'to') }, rules.value.rules);
  if (!quality.ok) return refused(quality.error);

  const value = quality.value;
  const staleNote =
    value.reference.basis === 'not_configured'
      ? 'No offline rule is configured in this scope, so nothing is labelled stale: the ages and gaps below are measurements without a verdict. A manager can set that allowance with an alert rule.'
      : `Staleness and gap length are judged against the ${String(value.reference.offline_window_minutes)} minute silence allowance an operator configured.`;

  return completed(
    {
      window: value.window,
      scanned_from: value.scanned_from,
      totals: value.totals,
      scanning: value.scanning,
      reference: value.reference,
      stale_devices: value.stale_devices,
      missing_data: value.missing_data,
      at_store_bounds: value.at_store_bounds,
      duplicates: value.duplicates,
      server_stamped: value.server_stamped,
      unparseable_timestamps: value.unparseable_timestamps,
      reporting_gaps: value.reporting_gaps,
      devices: value.devices,
      rules_coverage: rules.value.coverage,
      // Separated from the measurements on purpose: these are the schema's own storage bounds, and
      // sitting on one is a hint about a sensor's wiring, not a statement about a field.
      store_bounds_are_not_thresholds: true,
    },
    scopeMessage(scope, `${String(value.totals.devices)} device(s) in scope, ${String(value.scanning.rows_scanned)} reading(s) scanned. ${staleNote}`),
    null,
  );
}
