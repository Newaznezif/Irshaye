import type { NextRequest } from 'next/server';

import { completed, openScopedRead, refused, scopeMessage } from '@/lib/field/managementApi';
import { fieldOverview } from '@/lib/field/observationService';

/**
 * `/api/field/overview` — the numbers on the dashboard's first screen.
 *
 * Every figure comes from an authorized count query over the caller's own scope, and the response
 * carries `coverage: "partial"` beside any number a scan cap could have clipped. That field is the
 * reason this route can be trusted at all: a headline "3 devices" that is really a truncated scan of
 * a larger fleet is a fabricated number with our interface around it, and the only honest defence is
 * to say which of the two cases the reader is in.
 *
 * A successful read is not audited; a refusal is, and a refusal is what a stranger probing this
 * endpoint receives. `database_not_configured` arrives through the same gate as everywhere else, so
 * the dashboard's setup state and the API's setup state cannot disagree.
 */

export async function GET(request: NextRequest): Promise<Response> {
  const opened = await openScopedRead(request, 'overview_read');
  if (!opened.ok) return opened.response;
  const { scope } = opened;

  // `now` is taken once, here, and handed down. Every age in the response is then aged against the
  // same instant: two figures computed a second apart would drift against each other and make
  // "fresh" and "stale" describe this request rather than the data behind it.
  const overview = await fieldOverview(scope, Date.now());
  if (!overview.ok) return refused(overview.error);

  return completed(
    {
      ...overview.value,
      // Echoed rather than inferred from the rows, for the reason the device list gives: an empty
      // page and an unscoped page look identical otherwise.
      visible_cooperatives: scope,
    },
    scopeMessage(scope, 'Field Intelligence overview for the cooperatives this caller belongs to.'),
    null,
  );
}
