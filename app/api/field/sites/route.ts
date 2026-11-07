import type { NextRequest } from 'next/server';

import { intParam } from '@/lib/data/api';
import { completed, openScopedRead, refused, scopeMessage } from '@/lib/field/managementApi';
import { fieldSites } from '@/lib/field/observationService';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_OFFSET, MAX_PAGE_SIZE } from '@/lib/field/registration';

/**
 * `/api/field/sites` — the fields the caller's cooperative works.
 *
 * One page of sites, each with its device counts and its newest observation, in four queries for
 * the whole page rather than four per site. A section like Field Monitoring is where an N+1 goes
 * unnoticed — twenty sites, eighty requests, a fast laptop — so the batching is in the service
 * layer and this route only decides the page.
 *
 * `last_observed_at` is the measurement time from `sensor_logs`, and `last_seen_at` is the receipt
 * time of the last authenticated contact from `hardware_nodes`. They are different facts and this
 * route returns both names, because a dashboard that shows only one of them will eventually show
 * the wrong one and call the device live.
 */

export async function GET(request: NextRequest): Promise<Response> {
  const opened = await openScopedRead(request, 'site_list');
  if (!opened.ok) return opened.response;
  const { scope } = opened;

  const url = new URL(request.url);
  const limit = intParam(url, 'limit', 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const offset = intParam(url, 'offset', 0, MAX_PAGE_OFFSET, 0);

  const listed = await fieldSites(scope, { limit, offset });
  if (!listed.ok) return refused(listed.error);

  return completed(
    {
      sites: listed.value.sites,
      total: listed.value.total,
      page: listed.value.page,
      visible_cooperatives: scope,
    },
    scopeMessage(scope, `${String(listed.value.sites.length)} of ${String(listed.value.total)} field sites in this caller's scope.`),
    null,
  );
}
