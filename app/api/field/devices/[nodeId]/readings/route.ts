import type { NextRequest } from 'next/server';

import { intParam, stringParam } from '@/lib/data/api';
import { toDeviceSummary } from '@/lib/field/deviceService';
import { completed, loadAndAuthorize, openScopedRead, refused } from '@/lib/field/managementApi';
import { parseReadingWindow, readingsPage } from '@/lib/field/observationService';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_OFFSET, MAX_PAGE_SIZE } from '@/lib/field/registration';

/**
 * `/api/field/devices/[nodeId]/readings` — one device's stored history.
 *
 * The device is authorized before the readings are looked up: `loadAndAuthorize` resolves the node,
 * reads the cooperative that owns it out of the database, and asks `decideAccess` about
 * `observation_read`, which is a read capability — so a viewer may watch a chart and may not change
 * anything. This matters here more than on the list endpoints: `sensor_logs` has no cooperative
 * column, so the ownership of the *device* is the only thing standing between a caller and another
 * cooperative's field history.
 *
 * Values are the stored measurements with their own `measured_at`, plus `time_source` so the UI can
 * say whether the device stamped them or we did on receipt. Nothing is interpolated, averaged or
 * filled in: a gap in a chart is a gap, and a line drawn across it would be a reading nobody took.
 */

type RouteContext = { params: Promise<{ nodeId: string }> };

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  const { nodeId } = await context.params;

  const opened = await openScopedRead(request, 'observation_read');
  if (!opened.ok) return opened.response;

  const authorized = await loadAndAuthorize(opened.ctx, nodeId);
  if (!authorized.ok) return authorized.response;

  const url = new URL(request.url);
  const range = parseReadingWindow(stringParam(url, 'from'), stringParam(url, 'to'));
  if (!range.ok) return refused(range.error);

  const limit = intParam(url, 'limit', 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const offset = intParam(url, 'offset', 0, MAX_PAGE_OFFSET, 0);

  const page = await readingsPage(authorized.node.node_id, range.value, { limit, offset });
  if (!page.ok) return refused(page.error);

  return completed(
    {
      device: toDeviceSummary(authorized.node, authorized.credential),
      readings: page.value.readings,
      total_in_range: page.value.total_in_range,
      page: page.value.page,
      window: page.value.window,
      // Stated in the response because the chart can only honestly cover what it plots: at most
      // `limit` of `total_in_range` rows. Bucketing the remainder is an aggregate the database would
      // have to compute, and averaging one page of samples in a browser is not that.
      chart_covers: `the newest ${String(limit)} readings in this window`,
    },
    `${String(page.value.readings.length)} of ${String(page.value.total_in_range)} readings stored for ${authorized.node.node_id}.`,
    null,
  );
}
