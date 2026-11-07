import type { NextRequest } from 'next/server';

import { completed, openScopedRead, refused } from '@/lib/field/managementApi';
import { siteDetail } from '@/lib/field/observationService';
import { parseIdFilter } from '@/lib/field/registration';

/**
 * `/api/field/sites/[siteId]` — one field, with its devices.
 *
 * The id in the path selects a row; it does not grant a permission. `siteDetail` re-reads the site's
 * owning cooperative and checks it against the caller's scope, and answers the same `unknown_site`
 * whether the id does not exist or belongs to somebody else — which matters more here than anywhere
 * else on this surface, because a numeric path segment is trivial to enumerate and a difference in
 * answer is a map of who owns what.
 */

type RouteContext = { params: Promise<{ siteId: string }> };

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  const { siteId } = await context.params;

  const opened = await openScopedRead(request, 'site_view');
  if (!opened.ok) return opened.response;
  const { ctx, scope } = opened;

  const requestedId = parseIdFilter(siteId);
  if (requestedId === 'invalid' || requestedId === null) {
    // Refused before the lookup, so a path segment can never become a query value.
    return refused({ code: 'invalid_payload', message: 'site_id must be a positive integer id.' });
  }

  const detail = await siteDetail(scope, requestedId);
  if (!detail.ok) {
    if (detail.error.code === 'unknown_site') {
      // Recorded with the id that was asked for. Whether the site exists is exactly what the caller
      // was not entitled to learn, and the trail is the only place that distinction can be kept.
      await ctx.audit({ outcome: 'refused', cooperativeId: null, reasonCode: 'unknown_site', detail: { field_site_id: requestedId } });
    }
    return refused(detail.error);
  }

  return completed(
    {
      site: detail.value.site,
      devices: detail.value.devices,
      visible_cooperatives: scope,
    },
    `${detail.value.site.name}: ${String(detail.value.devices.length)} device(s) registered against this site.`,
    null,
  );
}
