'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Satellite, TriangleAlert } from 'lucide-react';

import { Badge, Button, DataRow, EmptyState, Panel, SectionLabel, SkeletonPanel, StateNotice, stamp } from '@/components/ui';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';
import { EthiopiaRegionMap } from '@/components/data/EthiopiaRegionMap';
import type { MapMarker } from '@/components/data/EthiopiaRegionMap';
import { useLanguage } from '@/hooks/useLanguage';
import type { FieldSessionStatus } from '@/hooks/useFieldSession';
import { useLiveData } from '@/hooks/useLiveData';
import type { TranslationKey, TranslationVars } from '@/lib/i18n';

import { FieldSectionState, reasonFor } from './FieldSectionState';
import { COORDINATE_SOURCE_KEYS, STATUS_KEYS, STATUS_TONE } from './labels';
import type { MapPosition, MapResponse, NodeStatus } from './types';

/**
 * Field Map: the devices whose coordinates the database actually holds.
 *
 * The map is `components/data/EthiopiaRegionMap` — the same tile, outline and vector scene the Geo
 * Intelligence module uses — given one new optional prop, `markers`. No second map component was
 * written, because two maps in one product is two projections to keep in agreement and two places
 * for a position to be invented.
 *
 * The invention is precisely what this panel has to prevent, and the API is built for it
 * (`app/api/field/map/route.ts`): a device with no `latitude`/`longitude` arrives as a **count**, not
 * as a point. So the honest sentences here are these:
 *
 *  - `without_coordinates` devices are not drawn, and no town, site centroid or "roughly there" is
 *    substituted for them. A pin placed by a guess is a coordinate nobody measured, and on an
 *    agricultural map it can be acted on;
 *  - `field_sites` have no coordinate columns at all, so a site is never a pin — only a device can
 *    be one, and only when its row carries a position;
 *  - `coordinate_source` rides with every marker and is listed beside it, because a device's own GNSS
 *    fix and a value an operator typed into a form are different kinds of fact and must not look
 *    identical on screen;
 *  - the marker colours describe the device's lifecycle status, which is what the register says, not
 *    what its readings imply.
 */

type T = (key: TranslationKey, vars?: TranslationVars) => string;

/** An unrecognised `coordinate_source` token is shown as itself, never as a friendly guess. */
function sourceLabel(source: string, t: T): string {
  const key = (COORDINATE_SOURCE_KEYS as Record<string, TranslationKey | undefined>)[source];
  return key === undefined ? source : t(key);
}

/** The lifecycle → colour decision, kept next to the map so the legend cannot drift from the dots. */
const MARKER_TONE: Record<NodeStatus, MapMarker['tone']> = {
  active: 'brand',
  maintenance: 'gold',
  disabled: 'clay',
  inactive: 'neutral',
};

/** Rows per page in the position table. The route returns the whole scoped list, so paging is here. */
const ROWS = 12;

export function FieldMapSection({
  sessionStatus,
  accessToken,
}: {
  sessionStatus: FieldSessionStatus;
  accessToken: string | null;
}) {
  const { t, locale } = useLanguage();
  const [offset, setOffset] = useState(0);

  const live = useLiveData<MapResponse, ProvenanceView>(
    sessionStatus === 'signed_in' ? '/api/field/map' : null,
    { accessToken },
  );

  const shell = (body: ReactNode) => (
    <Panel
      title={t('field.map.title')}
      icon={Satellite}
      hint={t('field.map.hint')}
      right={
        live.data === null ? undefined : (
          <Badge tone="neutral">{t('field.map.plotted', { count: String(live.data.positions.length) })}</Badge>
        )
      }
    >
      {body}
    </Panel>
  );

  if (sessionStatus !== 'signed_in') {
    return shell(<FieldSectionState reason={reasonFor({ sessionStatus, error: null, isEmpty: false })} />);
  }
  if (live.loading) return shell(<SkeletonPanel rows={6} />);
  if (live.error !== null || live.data === null) {
    return shell(<FieldSectionState reason={reasonFor({ sessionStatus, error: live.error, isEmpty: false })} code={live.error?.code} />);
  }

  const data = live.data;
  const positions = data.positions;

  if (positions.length === 0) {
    return shell(
      <div className="space-y-4">
        <EmptyState icon={MapPin} title={t('field.map.empty')} hint={t('field.map.emptyHint')} />
        <div className="space-y-1">
          <DataRow label={t('field.map.totalDevices')}>{String(data.total_devices)}</DataRow>
          <DataRow label={t('field.map.withoutCoordinates')}>{String(data.without_coordinates)}</DataRow>
        </div>
        <p className="text-[11.5px] leading-relaxed text-ink-faint">{t('field.map.emptyWhy')}</p>
      </div>,
    );
  }

  const markers: MapMarker[] = positions.map((point) => ({
    id: point.node_id,
    label: point.name,
    latitude: point.latitude,
    longitude: point.longitude,
    tone: MARKER_TONE[point.status],
    detail: point.node_id,
  }));

  const sources = Object.entries(data.coordinates_by_source);
  const page = positions.slice(offset, offset + ROWS);
  const lastOffset = Math.max(0, Math.ceil((positions.length - ROWS) / ROWS) * ROWS);

  return (
    <div className="space-y-4">
      {shell(
        <div className="space-y-4">
          <EthiopiaRegionMap markers={markers} />

          <div className="flex flex-wrap items-center gap-1.5">
            <SectionLabel>{t('field.map.legend')}</SectionLabel>
            {(Object.keys(MARKER_TONE) as NodeStatus[]).map((status) => (
              <Badge key={status} tone={STATUS_TONE[status]} dot>
                {t(STATUS_KEYS[status])}
              </Badge>
            ))}
          </div>

          <p className="text-[11.5px] leading-relaxed text-ink-faint">{t('field.map.clickHint')}</p>

          {data.without_coordinates > 0 && (
            <StateNotice tone="gold" title={t('field.map.unpositionedTitle')} icon={TriangleAlert}>
              {t('field.map.unpositionedBody', { count: String(data.without_coordinates) })}
            </StateNotice>
          )}

          {data.coverage === 'partial' && (
            <StateNotice tone="gold" title={t('field.coverage.title')} icon={TriangleAlert}>
              {t('field.coverage.devices')}
            </StateNotice>
          )}

          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <DataRow label={t('field.map.totalDevices')}>{String(data.total_devices)}</DataRow>
            <DataRow label={t('field.map.plottedCount')}>{String(positions.length)}</DataRow>
            <DataRow label={t('field.map.withoutCoordinates')}>{String(data.without_coordinates)}</DataRow>
            <DataRow label={t('field.map.cooperatives', { count: String(data.visible_cooperatives.length) })}>
              {data.visible_cooperatives.join(', ')}
            </DataRow>
          </div>

          <div>
            <SectionLabel>{t('field.map.sources')}</SectionLabel>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {sources.map(([source, count]) => (
                <li key={source}>
                  <Badge tone="outline">
                    {source === 'unattributed' ? t('field.map.unattributed') : sourceLabel(source, t)} · {String(count)}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">{t('field.map.sourcesNote')}</p>
          </div>
        </div>,
      )}

      <Panel title={t('field.map.positionsTitle')} icon={MapPin} hint={t('field.map.positionsHint')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <caption className="sr-only">{t('field.map.positionsCaption')}</caption>
            <thead>
              <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                <th className="py-2 pr-3">{t('field.map.device')}</th>
                <th className="py-2 pr-3 text-right">{t('field.map.latitude')}</th>
                <th className="py-2 pr-3 text-right">{t('field.map.longitude')}</th>
                <th className="py-2 pr-3">{t('field.map.coordinateSource')}</th>
                <th className="py-2 pr-3">{t('field.map.status')}</th>
                <th className="py-2">{t('field.map.lastSeen')}</th>
              </tr>
            </thead>
            <tbody>
              {page.map((point: MapPosition) => (
                <tr key={point.node_id} className="border-b border-line/60 last:border-0">
                  <td className="py-2 pr-3">
                    <p className="text-[12.5px] font-bold text-ink">{point.name}</p>
                    <p className="font-mono text-[11px] text-ink-faint">{point.node_id}</p>
                  </td>
                  <td className="py-2 pr-3 text-right tabular text-[12.5px]">{point.latitude.toFixed(5)}</td>
                  <td className="py-2 pr-3 text-right tabular text-[12.5px]">{point.longitude.toFixed(5)}</td>
                  <td className="py-2 pr-3 text-[12px] text-ink-muted">
                    {point.coordinate_source === null ? t('field.map.unattributed') : sourceLabel(point.coordinate_source, t)}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge tone={STATUS_TONE[point.status]}>{t(STATUS_KEYS[point.status])}</Badge>
                  </td>
                  <td className="py-2 text-[12px] text-ink-muted">{stamp(point.last_seen_at, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="tabular text-[11.5px] text-ink-faint">
            {t('field.map.pageRange', {
              from: String(offset + 1),
              to: String(Math.min(offset + ROWS, positions.length)),
              total: String(positions.length),
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - ROWS))}
              disabled={offset === 0}
              leading={<ChevronLeft size={14} />}
            >
              {t('field.map.previous')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset(Math.min(lastOffset, offset + ROWS))}
              disabled={offset >= lastOffset}
              trailing={<ChevronRight size={14} />}
            >
              {t('field.map.next')}
            </Button>
          </div>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">{t('field.map.tableNote')}</p>
      </Panel>
    </div>
  );
}
