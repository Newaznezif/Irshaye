'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, FolderTree, MapPin, Radio, Sprout, TriangleAlert } from 'lucide-react';

import { Badge, Button, DataRow, Panel, SectionLabel, SkeletonPanel, StateNotice, fmt, fmtInt, stamp } from '@/components/ui';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';
import { useLanguage } from '@/hooks/useLanguage';
import type { FieldSessionStatus } from '@/hooks/useFieldSession';
import { useLiveData } from '@/hooks/useLiveData';
import type { TranslationKey, TranslationVars } from '@/lib/i18n';

import { FieldSectionState, reasonFor } from './FieldSectionState';
import { METRIC_KEYS, METRIC_UNIT_KEYS, NODE_STATUSES, STATUS_KEYS, STATUS_TONE, ageBuckets } from './labels';
import type { SensorMetric } from './labels';
import type { DeviceRow, ReadingRow, SiteDetailResponse, SiteRow, SitesResponse } from './types';

/**
 * Field Monitoring: the sites this caller's cooperatives hold, and the devices under one of them.
 *
 * Two rules shape this panel more than its layout does.
 *
 * **Location comes from relationships, not from strings.** A site's place is its `location_key`
 * joined to `data.location`, and it is descriptive only: `field_sites` has no coordinate columns, so
 * nothing here draws a field on a map. Coordinates belong to devices and are shown in the Map section
 * with their `coordinate_source`. Naming "Bole, Addis Ababa" for a site quotes an operator's
 * reference record; putting a pin on it would be inventing a position.
 *
 * **A contact stamp is not a measurement.** Every row carries both `last_seen_at` (the newest
 * authenticated submission among this site's devices) and `last_observed_at` (the newest measurement
 * in `sensor_logs`). They diverge whenever a device reports more often than it measures, and merging
 * them into one "last activity" column is how a fleet looks healthier than it is.
 *
 * The detail request fires only when a site is opened, so the list costs four queries per page
 * (`fieldSites` in `lib/field/observationService.ts`: sites, their devices, newest readings, reference
 * places) and a twelve-site page never issues twelve detail reads.
 */

const PAGE_SIZE = 12;

type T = (key: TranslationKey, vars?: TranslationVars) => string;

/** The newest reading that actually holds a value, so a row can show a figure with its unit. */
function newestValue(reading: ReadingRow | null): { metric: SensorMetric; value: number } | null {
  if (reading === null) return null;
  if (reading.soil_moisture_pct !== null) return { metric: 'soil_moisture', value: reading.soil_moisture_pct };
  if (reading.ambient_temp_c !== null) return { metric: 'ambient_temp', value: reading.ambient_temp_c };
  if (reading.humidity_pct !== null) return { metric: 'humidity', value: reading.humidity_pct };
  if (reading.battery_voltage_v !== null) return { metric: 'battery_voltage', value: reading.battery_voltage_v };
  return null;
}

/**
 * A stored instant spoken as an age. The instant itself always renders beside it: an age is a
 * convenience derived at display time, and a reader who needs the measurement date has it.
 */
function ageLabel(iso: string | null, now: number, t: T): string | null {
  if (iso === null) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  const bucket = ageBuckets((now - at) / 1000);
  return t(bucket.key, { value: String(bucket.value) });
}

function SiteDeviceList({ devices }: { devices: DeviceRow[] }) {
  const { t, locale } = useLanguage();
  if (devices.length === 0) {
    return <p className="text-[12.5px] leading-relaxed text-ink-faint">{t('field.sites.noSiteDevices')}</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {devices.map((device) => (
        <li key={device.node_id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{device.name}</p>
            <p className="mt-0.5 font-mono text-[11px] text-ink-faint">{device.node_id}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Badge tone={STATUS_TONE[device.status]} dot>
              {t(STATUS_KEYS[device.status])}
            </Badge>
            <Badge tone={device.provisioned ? 'brand' : 'clay'}>
              {device.provisioned ? t('field.devices.provisioned') : t('field.devices.notProvisioned')}
            </Badge>
            <span className="text-[11.5px] text-ink-faint">
              {device.last_seen_at === null ? t('field.sites.neverContacted') : stamp(device.last_seen_at, locale)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function FieldSitesSection({ sessionStatus, accessToken }: { sessionStatus: FieldSessionStatus; accessToken: string | null }) {
  const { t, locale } = useLanguage();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const signedIn = sessionStatus === 'signed_in' || sessionStatus === 'checking';
  const list = useLiveData<SitesResponse, ProvenanceView>(
    signedIn ? `/api/field/sites?limit=${String(PAGE_SIZE)}&offset=${String(offset)}` : null,
    { accessToken },
  );

  // Every age is measured against the instant the rows were read, which `useLiveData` stamps when the
  // response lands. Render time would make the same row age differently on an unrelated re-render,
  // and the page-load clock is not the database clock.
  const readAtMs = list.fetchedAt === null ? null : Date.parse(list.fetchedAt);

  if (!signedIn) {
    return (
      <Panel title={t('field.sites.title')} icon={FolderTree} hint={t('field.sites.hint')}>
        <FieldSectionState reason={reasonFor({ sessionStatus, error: null, isEmpty: false })} />
      </Panel>
    );
  }

  if (list.loading) {
    return (
      <Panel title={t('field.sites.title')} icon={FolderTree} hint={t('field.sites.hint')}>
        <SkeletonPanel rows={6} />
      </Panel>
    );
  }

  if (list.error !== null || list.data === null) {
    return (
      <Panel title={t('field.sites.title')} icon={FolderTree}>
        <FieldSectionState reason={reasonFor({ sessionStatus, error: list.error, isEmpty: false })} code={list.error?.code} />
      </Panel>
    );
  }

  const sites = list.data.sites;
  const total = list.data.total;

  if (sites.length === 0) {
    return (
      <Panel title={t('field.sites.title')} icon={FolderTree} hint={t('field.sites.hint')}>
        <FieldSectionState reason="empty" />
        <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">{t('field.sites.emptyWhy')}</p>
      </Panel>
    );
  }

  const lastOffset = Math.max(0, Math.floor((total - 1) / PAGE_SIZE) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <Panel
        title={t('field.sites.title')}
        icon={FolderTree}
        hint={t('field.sites.hint')}
        right={
          <Badge tone="neutral">
            {t('field.sites.showing', { shown: String(sites.length), total: String(total) })}
          </Badge>
        }
      >
        <ul className="divide-y divide-line">
          {sites.map((site: SiteRow) => {
            const value = newestValue(site.last_observation);
            const age = readAtMs === null || Number.isNaN(readAtMs) ? null : ageLabel(site.last_observed_at, readAtMs, t);
            const open = selected === site.field_site_id;
            return (
              <li key={site.field_site_id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 basis-56 flex-1">
                    <p className="truncate text-[15px] font-extrabold text-ink">{site.name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-muted">
                      {site.place !== null ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-brand-600 dark:text-brand-400" />
                          {site.place.name}
                          {site.place.admin1 !== null && <span className="text-ink-faint">· {site.place.admin1}</span>}
                        </span>
                      ) : (
                        <span className="text-ink-faint">{t('field.sites.noPlace')}</span>
                      )}
                      {site.crop !== null && (
                        <span className="inline-flex items-center gap-1">
                          <Sprout size={12} className="text-brand-600 dark:text-brand-400" />
                          {site.crop}
                        </span>
                      )}
                      {site.area_hectares !== null && <span className="tabular">{fmt(site.area_hectares, 1, locale)} ha</span>}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge tone={site.device_count > 0 ? 'brand' : 'neutral'}>
                      {t('field.sites.deviceCount', { count: String(site.device_count) })}
                    </Badge>
                    {site.last_observed_at === null ? (
                      <span className="text-[11.5px] text-ink-faint">{t('field.sites.noObservation')}</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                        <Radio size={11} className="text-ink-faint" />
                        {stamp(site.last_observed_at, locale)}
                        {age !== null && <span className="text-ink-faint">({age})</span>}
                      </span>
                    )}
                    {value !== null && (
                      <span className="tabular text-[12px] font-bold text-ink">
                        {fmt(value.value, value.metric === 'battery_voltage' ? 2 : 1, locale)}
                        <span className="ml-1 text-[10.5px] font-semibold text-ink-faint">
                          {t(METRIC_UNIT_KEYS[value.metric])}
                        </span>
                        <span className="ml-1.5 text-[10.5px] font-semibold text-ink-faint">{t(METRIC_KEYS[value.metric])}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {NODE_STATUSES.map((status) =>
                    site.devices_by_status[status] === 0 ? null : (
                      <Badge key={status} tone={STATUS_TONE[status]}>
                        {t(STATUS_KEYS[status])} · {String(site.devices_by_status[status])}
                      </Badge>
                    ),
                  )}
                  {site.coverage === 'partial' && (
                    <Badge tone="gold" title={t('field.coverage.devices')}>
                      {t('field.coverage.short')}
                    </Badge>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setSelected(open ? null : site.field_site_id)}
                    aria-expanded={open}
                  >
                    {open ? t('field.sites.hideDevices') : t('field.sites.viewDevices')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
            leading={<ChevronLeft size={14} />}
          >
            {t('field.sites.previous')}
          </Button>
          <p className="tabular text-[11.5px] text-ink-faint">
            {t('field.sites.pageRange', {
              from: String(offset + 1),
              to: String(Math.min(offset + PAGE_SIZE, total)),
              total: String(total),
            })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOffset(Math.min(lastOffset, offset + PAGE_SIZE))}
            disabled={offset >= lastOffset}
            trailing={<ChevronRight size={14} />}
          >
            {t('field.sites.next')}
          </Button>
        </div>
      </Panel>

      {selected !== null && <SiteDetail id={selected} sessionStatus={sessionStatus} accessToken={accessToken} />}
    </div>
  );
}

function SiteDetail({ id, sessionStatus, accessToken }: { id: number; sessionStatus: FieldSessionStatus; accessToken: string | null }) {
  const { t, locale } = useLanguage();
  const detail = useLiveData<SiteDetailResponse, ProvenanceView>(`/api/field/sites/${String(id)}`, { accessToken });
  const body: ReactNode = detail.loading ? (
    <SkeletonPanel rows={3} />
  ) : detail.error !== null || detail.data === null ? (
    <FieldSectionState reason={reasonFor({ sessionStatus, error: detail.error, isEmpty: false })} code={detail.error?.code} />
  ) : (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <SectionLabel>{t('field.sites.siteLabel')}</SectionLabel>
          <div className="mt-1 space-y-0">
            <DataRow label={t('field.sites.siteName')}>{detail.data.site.name}</DataRow>
            <DataRow label={t('field.sites.cooperativeId')}>{fmtInt(detail.data.site.cooperative_id, locale)}</DataRow>
            <DataRow label={t('field.sites.referencePlace')}>{detail.data.site.place?.name ?? t('field.sites.noPlace')}</DataRow>
            <DataRow label={t('field.sites.locationKey')}>
              <span className="font-mono text-[12px]">{detail.data.site.location_key ?? '—'}</span>
            </DataRow>
          </div>
        </div>
        <div>
          <SectionLabel>{t('field.sites.observationLabel')}</SectionLabel>
          <div className="mt-1 space-y-0">
            <DataRow label={t('field.sites.deviceTotal')}>{fmtInt(detail.data.site.device_count, locale)}</DataRow>
            <DataRow label={t('field.sites.lastContact')}>{stamp(detail.data.site.last_seen_at, locale)}</DataRow>
            <DataRow label={t('field.sites.lastMeasurement')}>{stamp(detail.data.site.last_observed_at, locale)}</DataRow>
            <DataRow label={t('field.sites.crop')}>{detail.data.site.crop ?? '—'}</DataRow>
          </div>
        </div>
      </div>
      <div>
        <SectionLabel>{t('field.sites.devicesUnderSite')}</SectionLabel>
        <div className="mt-1">
          <SiteDeviceList devices={detail.data.devices} />
        </div>
      </div>
      {detail.data.site.coverage === 'partial' && (
        <StateNotice tone="gold" title={t('field.coverage.title')} icon={TriangleAlert}>
          {t('field.coverage.devices')}
        </StateNotice>
      )}
    </div>
  );

  return (
    <Panel title={`${t('field.sites.detailTitle')} · ${String(id)}`} icon={FolderTree} hint={t('field.sites.detailHint')}>
      {body}
    </Panel>
  );
}
