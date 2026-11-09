import type { NextRequest } from 'next/server';

import { completed, openScopedRead, refused, scopeMessage } from '@/lib/field/managementApi';
import { mapPositions } from '@/lib/field/observationService';

/**
 * `/api/field/map` — where the devices are, from the coordinates the database holds.
 *
 * A device with no `latitude`/`longitude` is counted, not placed. The reference place attached to
 * its site, the nearest town, a cooperative centroid: each is a position we would be making up, and
 * a fabricated pin on an agricultural map is how a wrong coordinate ends up in somebody's irrigation
 * decision. `without_coordinates` is in the response so the map can say "three devices are not
 * shown yet" instead of rendering a quiet, convincing emptiness.
 *
 * `coordinate_source` travels with every point, and the counts of each source are summarised here,
 * because a GNSS fix and a value someone typed into a form are not the same kind of fact and must
 * not look identical on screen.
 */

export async function GET(request: NextRequest): Promise<Response> {
  const opened = await openScopedRead(request, 'map_read');
  if (!opened.ok) return opened.response;
  const { scope } = opened;

  const positions = await mapPositions(scope);
  if (!positions.ok) return refused(positions.error);

  const bySource = positions.value.positions.reduce<Record<string, number>>((tally, point) => {
    const key = point.coordinate_source ?? 'unattributed';
    tally[key] = (tally[key] ?? 0) + 1;
    return tally;
  }, {});

  return completed(
    {
      positions: positions.value.positions,
      without_coordinates: positions.value.without_coordinates,
      total_devices: positions.value.total_devices,
      coordinates_by_source: bySource,
      coverage: positions.value.coverage,
      visible_cooperatives: scope,
    },
    scopeMessage(scope, `${String(positions.value.positions.length)} device position(s) held; ${String(positions.value.without_coordinates)} without coordinates.`),
    null,
  );
}
