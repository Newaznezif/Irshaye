'use client';

import type { ReactNode } from 'react';
import { Activity, Antenna, CalendarClock, Radio, Satellite, TriangleAlert } from 'lucide-react';

import { Badge, DataRow, Metric, Panel, SkeletonPanel, StateNotice, StatCard, fmtInt, stamp } from '@/components/ui';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';
import { useLanguage } from '@/hooks/useLanguage';
import type { FieldSessionStatus } from '@/hooks/useFieldSession';
import { useLiveData } from '@/hooks/useLiveData';

import { FieldSectionState, reasonFor } from './FieldSectionState';
import { NODE_STATUSES, STATUS_KEYS, ageBuckets } from './labels';
import type { OverviewResponse } from './types';

/**
 * The Overview band: every figure on this screen is one authorized query, and each says how
 * complete it is.
 *
 * Three properties this panel is built to keep.
 *
 *  1. **A device count is not an alert count.** `devices.by_status` comes from four exact
 *     `count: 'exact', head: true` queries against `hardware_nodes.status`; `alerts.unresolved`
 *     counts `device_alerts` rows whose status is `open` or `acknowledged`. Neither is inferred from
 *     the other, and neither is inferred from the observations table.
 *  2. **There is no `offline` value in the schema.** `hardware_nodes.status` is
 *     active|inactive|maintenance|disabled, so "offline" is a heartbeat question answered from
 *     `last_seen_at` — and the window that turns a heartbeat into a verdict is an operator's own
 *     enabled `offline` alert rule. When none is configured this panel states the newest contact and
 *     its age and refuses to call anything offline. Inventing a reporting cadence here would be a
 *     silent opinion about hardware IRSHAYE does not own, and it would decide on somebody's shift
 *     report when a device looks dead.
 *  3. **A floor is labelled as a floor.** Any section reporting `coverage: 'partial'` means a bounded
 *     scan hit its cap (`SCOPE_NODE_CAP`, `OBSERVATION_SCAN_CAP`), so the figure below it is stated
 *     as "at least". Presenting a floor as a count is the same class of error as a placeholder
 *     number, and much quieter.
 *
 * Freshness is aged against each row's own stored instant — the server computes `age_seconds` once
 * against a single `now` for the whole response, so two lines on this panel can never disagree about
 * how old the same reading is. The page-load time is never used as a stand-in for a measurement time.
 *
 * No request is issued until the Auth server has confirmed a session: an anonymous call to
 * `/api/field/overview` is a 401 by design, and letting it land would render "signed out" as a data
 * error.
 */

export function FieldOverviewSection({
  sessionStatus,
  accessToken,
}: {
  sessionStatus: FieldSessionStatus;
  accessToken: string | null;
}) {
  const { t, locale } = useLanguage();
  const live = useLiveData<OverviewResponse, ProvenanceView>(
    sessionStatus === 'signed_in' ? '/api/field/overview' : null,
    { accessToken },
  );

  const shell = (title: string, body: ReactNode, hint?: string) => (
    <Panel title={title} icon={Radio} hint={hint}>
      {body}
    </Panel>
  );

  if (sessionStatus !== 'signed_in') {
    return shell(
      t('field.overview.title'),
      <FieldSectionState reason={reasonFor({ sessionStatus, error: null, isEmpty: false })} />,
    );
  }
  if (live.loading) return shell(t('field.overview.title'), <SkeletonPanel rows={5} />);
  if (live.error !== null || live.data === null) {
    return shell(
      t('field.overview.title'),
      <FieldSectionState reason={reasonFor({ sessionStatus, error: live.error, isEmpty: false })} code={live.error?.code} />,
    );
  }

  const overview = live.data;
  const ageOf = (seconds: number | null): string | null => {
    if (seconds === null) return null;
    const bucket = ageBuckets(seconds);
    return t(bucket.key, { value: String(bucket.value) });
  };

  const deviceAge = ageOf(overview.devices.heartbeat.age_seconds);
  const observationAge = ageOf(overview.observations.age_seconds);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Antenna}
          label={t('field.overview.devices')}
          value={fmtInt(overview.devices.total, locale)}
          supporting={overview.devices.coverage === 'partial' ? t('field.overview.atLeast') : t('field.overview.exact')}
        />
        <StatCard
          icon={Satellite}
          label={t('field.overview.sites')}
          value={fmtInt(overview.field_sites.total, locale)}
          tone="info"
          supporting={t('field.overview.sitesSupporting')}
        />
        <StatCard
          icon={Activity}
          label={t('field.overview.observations')}
          value={fmtInt(overview.observations.total, locale)}
          supporting={overview.observations.coverage === 'partial' ? t('field.overview.atLeast') : t('field.overview.exact')}
        />
        <StatCard
          icon={TriangleAlert}
          label={t('field.overview.unresolved')}
          value={fmtInt(overview.alerts.unresolved, locale)}
          tone={overview.alerts.unresolved > 0 ? 'clay' : 'info'}
          supporting={overview.alerts.coverage === 'partial' ? t('field.overview.atLeast') : t('field.overview.exact')}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t('field.overview.statusTitle')} icon={Radio} hint={t('field.overview.statusHint')}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {NODE_STATUSES.map((status) => (
              <Metric
                key={status}
                label={t(STATUS_KEYS[status])}
                value={fmtInt(overview.devices.by_status[status], locale)}
                tone={status === 'active' ? 'good' : status === 'disabled' ? 'bad' : status === 'maintenance' ? 'warn' : 'info'}
              />
            ))}
          </div>

          <div className="mt-4 space-y-0">
            <DataRow label={t('field.overview.neverSeen')}>
              <span className="tabular">{fmtInt(overview.devices.never_seen, locale)}</span>
            </DataRow>
            <DataRow label={t('field.overview.newestContact')}>
              <span className="flex flex-wrap items-center justify-end gap-2">
                {overview.devices.heartbeat.newest_last_seen_at === null ? (
                  <Badge tone="neutral">{t('field.overview.noContactYet')}</Badge>
                ) : (
                  <>
                    <span className="text-[13px] font-semibold text-ink">
                      {stamp(overview.devices.heartbeat.newest_last_seen_at, locale)}
                    </span>
                    {deviceAge !== null && <Badge tone="outline">{deviceAge}</Badge>}
                  </>
                )}
              </span>
            </DataRow>
            <DataRow label={t('field.overview.offlineRule')}>
              <span className="text-[13px] font-semibold text-ink">
                {overview.configured_offline_window_minutes === null
                  ? t('field.overview.offlineNone')
                  : t('field.overview.offlineWindow', { minutes: String(overview.configured_offline_window_minutes) })}
              </span>
            </DataRow>
          </div>

          {overview.devices.coverage === 'partial' && (
            <StateNotice tone="gold" title={t('field.coverage.title')} icon={TriangleAlert} className="mt-4">
              {t('field.coverage.devices')}
            </StateNotice>
          )}
        </Panel>

        <Panel title={t('field.overview.freshnessTitle')} icon={CalendarClock} hint={t('field.overview.freshnessHint')}>
          <div className="space-y-0">
            <DataRow label={t('field.overview.newestMeasurement')}>
              <span className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-[13px] font-semibold text-ink">{stamp(overview.observations.newest_measured_at, locale)}</span>
                {observationAge !== null && <Badge tone="outline">{observationAge}</Badge>}
              </span>
            </DataRow>
            <DataRow label={t('field.overview.lastIngestion')}>
              <span className="text-[13px] font-semibold text-ink">{stamp(overview.observations.newest_received_at, locale)}</span>
            </DataRow>
            <DataRow label={t('field.overview.visibleCoops')}>
              {overview.cooperatives.length === 0 ? (
                <Badge tone="neutral">{t('field.overview.noCooperative')}</Badge>
              ) : (
                <span className="flex flex-wrap justify-end gap-1.5">
                  {overview.cooperatives.map((coop) => (
                    <Badge key={coop.cooperative_id} tone="brand">
                      {coop.name}
                    </Badge>
                  ))}
                </span>
              )}
            </DataRow>
          </div>

          <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">{t('field.overview.ingestionNote')}</p>

          {overview.observations.coverage === 'partial' && (
            <StateNotice tone="gold" title={t('field.coverage.title')} icon={TriangleAlert} className="mt-3">
              {t('field.coverage.observations')}
            </StateNotice>
          )}
        </Panel>
      </div>
    </div>
  );
}
