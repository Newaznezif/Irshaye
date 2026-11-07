/**
 * The one calendar the dashboard uses when it turns a picked day into a query.
 *
 * Dates are picked in `Africa/Addis_Ababa` because every timestamp on the screen is printed in that
 * zone, while the API reads its bounds as instants: sending the bare `2026-11-03` would ask for
 * midnight UTC and quietly drop the first three hours of the operator's own day. Ethiopia has never
 * observed a DST change, so the offset is a constant rather than a lookup — if that ever moves, this
 * is the one line that has to change, and `npm run test:fieldintel` grades it.
 */
export const ADDIS_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

/** The instant that opens or closes the given `YYYY-MM-DD` in Addis Ababa time, as UTC. */
export function dayBounds(date: string, edge: 'start' | 'end'): string {
  const dayStart = Date.parse(`${date}T00:00:00Z`);
  const at = edge === 'start' ? dayStart : dayStart + 86_400_000 - 1;
  return new Date(at - ADDIS_UTC_OFFSET_MS).toISOString();
}
