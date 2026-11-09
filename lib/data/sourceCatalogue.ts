import { cachedFetch } from './cache';
import { httpJson } from './http';
import type { SourceError } from './types';

/**
 * The publisher's own catalogue, read through its documented API.
 *
 * This is not a substitute for the data: it answers nothing about prices. It exists
 * because the two failures a reader needs to tell apart look identical from a fetch
 * alone — "the publisher is offline" and "the publisher is reachable but is
 * challenging our automated download". HDX serves its CKAN API normally while its
 * file host answers an automated request with an empty `202` challenge, so asking
 * the catalogue is what lets the status panel say which one happened.
 *
 * We stop there. Answering the JavaScript challenge, or claiming to be a different
 * client to slip past the filter, would be evading the publisher's own access
 * control, and no dashboard is worth that.
 */

const CKAN_PACKAGE = 'https://data.humdata.org/api/3/action/package_show?id=';

export interface CatalogueResource {
  name: string;
  format: string;
  sizeBytes: number | null;
  lastModified: string | null;
  /** Whether rows can be paged as JSON instead of downloading the whole file. */
  datastoreActive: boolean;
}

export interface SourceCatalogue {
  sourceId: string;
  checkedAt: string;
  reachable: boolean;
  /** The publisher's own statement of when the dataset last changed. */
  metadataModified: string | null;
  resources: CatalogueResource[];
  error: SourceError | null;
}

interface CkanResource {
  name?: string;
  format?: string;
  size?: number | string | null;
  last_modified?: string | null;
  datastore_active?: boolean;
}

interface CkanResponse {
  success?: boolean;
  result?: { metadata_modified?: string; resources?: CkanResource[] };
}

const asNumber = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function describe(json: unknown, sourceId: string): SourceCatalogue {
  const checkedAt = new Date().toISOString();
  const body = json as CkanResponse;
  const resources = (body.result?.resources ?? []).map((r) => ({
    name: (r.name ?? '').trim() || '—',
    format: (r.format ?? '').trim().toUpperCase() || '—',
    sizeBytes: asNumber(r.size),
    lastModified: r.last_modified ?? null,
    datastoreActive: r.datastore_active === true,
  }));

  return {
    sourceId,
    checkedAt,
    reachable: body.success === true && resources.length > 0,
    metadataModified: body.result?.metadata_modified ?? null,
    resources,
    error: null,
  };
}

/**
 * One probe per source, cached an hour. The probe is a small JSON document, so it is
 * cheap enough to run on every status view and never competes with the bulk file.
 */
export async function sourceCatalogue(sourceId: string, datasetSlug: string): Promise<SourceCatalogue> {
  const outcome = await cachedFetch<SourceCatalogue>(`catalogue:${sourceId}`, 3_600, async () => {
    const res = await httpJson(`${CKAN_PACKAGE}${encodeURIComponent(datasetSlug)}`, { timeoutMs: 15_000, maxBytes: 2 * 1024 * 1024 });
    if (!res.ok) {
      // Unreachable is a finding, reported with its code. The cached wrapper drops the
      // failure rather than storing it, so the next view asks again instead of repeating
      // an outage for the rest of the hour.
      return {
        ok: false,
        error: res.error,
      };
    }
    return { ok: true, value: describe(res.json, sourceId) };
  });

  const value = outcome.value;
  if (value.ok) return value.value;
  return {
    sourceId,
    checkedAt: new Date(outcome.storedAt).toISOString(),
    reachable: false,
    metadataModified: null,
    resources: [],
    error: value.error,
  };
}
