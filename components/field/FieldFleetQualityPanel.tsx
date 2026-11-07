'use client';

import { Server, TriangleAlert } from 'lucide-react';

import { Badge, DataRow, EmptyState, Metric, Panel, SectionLabel, StateNotice, fmt, fmtInt, stamp } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';

import {
  HISTORY_RANGE_KEYS,
  METRIC_KEYS,
  METRIC_UNIT_KEYS,
  OBSERVATION_STATE_KEYS,
  OBSERVATION_STATE_TONE,
  STATUS_KEYS,
  STATUS_TONE,
  ageBuckets,
} from './labels';
import type { DataQualityResponse } from './types';

/**
 * The fleet's reporting health, from `GET /api/field/data-quality`.
 *
 * This is the panel that answers the question a trend chart cannot: is the field quiet because
 * nothing is happening, or because nothing is talking. Its four headline figures are exact count
 * queries against the database; everything under them is computed from a scan of the newest
 * `scan_cap` readings and says so beside the number.
 *
 * The discipline that shapes the whole layout: **a verdict is not a measurement.** "Stale" is
 * measured against the silence allowance an operator wrote into an `offline` alert rule, so with no
 * such rule in scope this panel reports ages, intervals and missing shares and labels nothing. A
 * dashboard that picked its own staleness number would be a fabricated threshold wearing a real
 * chart's clothes — and unlike a fabricated reading, it would look authoritative.
 *
 * The storage-bound block is kept apart from the verdict block for the same reason: a reading parked
 * on the minimum or maximum the schema allows is a hint about a sensor's wiring, not a statement
 * about a field, and the schema's range is not a threshold anybody configured.
 */

/**
 * Devices drawn in the table. The response carries every device in scope — `scopedNodes` bounds that
 * hop — and a table with no end to it is a page nobody reads, so the rest is counted out loud.
 */
const QUALITY_DEVICE_ROWS = 12;

export function FleetQualityPanel({ data }: { data: DataQualityResponse }) {
  const { t, locale } = useLanguage();

  const age = (seconds: number | null): string => {
    if (seconds === null) return '—';
    const bucket = ageBuckets(seconds);
    return t(bucket.key, { value: String(bucket.value) });
  };

  // A share is parts per hundred of the SCANNED rows, never of the window's true total — which is
  // why the basis column names its own denominator instead of leaving it to be assumed.
  const share = (value: number | null): string => (value === null ? '—' : `${fmt(value * 100, 0, locale)} ${t('field.unit.percent')}`);

  const configured = data.reference.basis === 'configured_offline_rule';
  const shownDevices = data.devices.slice(0, QUALITY_DEVICE_ROWS);

  return (
    <Panel
      title={t('field.quality.title')}
      icon={Server}
      hint={t('field.quality.hint')}
      right={<Badge tone="outline">{t(HISTORY_RANGE_KEYS[data.window.range])}</Badge>}
    >
      {data.totals.devices === 0 ? (
        <EmptyState icon={Server} title={t('field.quality.noDevices')} hint={t('field.quality.noDevicesHint')} />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label={t('field.quality.devices')} value={fmtInt(data.totals.devices, locale)} note={t('field.quality.exactNote')} />
            <Metric
              label={t('field.quality.readingsInRange')}
              value={fmtInt(data.totals.observations_in_window, locale)}
              note={t('field.quality.exactNote')}
            />
            <Metric
              label={t('field.quality.neverContacted')}
              value={fmtInt(data.totals.never_contacted, locale)}
              tone={data.totals.never_contacted > 0 ? 'warn' : undefined}
              note={t('field.quality.neverContactedNote')}
            />
            <Metric
              label={t('field.quality.withoutObservations')}
              value={fmtInt(data.totals.without_observations, locale)}
              tone="warn"
              note={data.totals.without_observations_basis === 'exact' ? t('field.quality.exactNote') : t('field.quality.scanOnlyNote')}
            />
          </div>

          <div>
            <SectionLabel>{t('field.quality.verdictTitle')}</SectionLabel>
            <div className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <DataRow label={t('field.quality.silenceAllowance')}>
                {data.reference.offline_window_minutes === null
                  ? t('field.quality.allowanceNone')
                  : `${fmtInt(data.reference.offline_window_minutes, locale)} ${t('field.unit.minutes')}`}
              </DataRow>
              <DataRow label={t('field.quality.staleDevices')}>{fmtInt(data.stale_devices.count, locale)}</DataRow>
              <DataRow label={t('field.quality.verdictCover')}>{fmtInt(data.stale_devices.devices_with_a_verdict, locale)}</DataRow>
              <DataRow label={t('field.quality.gapThreshold')}>
                {data.reporting_gaps.threshold_seconds === null ? t('field.quality.allowanceNone') : age(data.reporting_gaps.threshold_seconds)}
              </DataRow>
              <DataRow label={t('field.quality.gapCount')}>{fmtInt(data.reporting_gaps.count, locale)}</DataRow>
            </div>
            <StateNotice
              tone={configured ? 'info' : 'gold'}
              title={t(configured ? 'field.quality.verdictConfigured' : 'field.quality.verdictMissing')}
              icon={TriangleAlert}
              className="mt-3"
            >
              {configured
                ? t('field.quality.verdictConfiguredBody', { minutes: fmtInt(data.reference.offline_window_minutes, locale) })
                : t('field.quality.verdictMissingBody')}
            </StateNotice>
          </div>

          <div>
            <SectionLabel>{t('field.quality.missingTitle')}</SectionLabel>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{t('field.quality.missingHint')}</p>
            {data.missing_data.length === 0 ? (
              <p className="mt-2 text-[12.5px] text-ink-faint">{t('field.quality.missingNone')}</p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left">
                  <caption className="sr-only">{t('field.quality.missingCaption')}</caption>
                  <thead>
                    <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                      <th className="py-2 pr-3">{t('field.quality.metricColumn')}</th>
                      <th className="py-2 pr-3 text-right">{t('field.quality.scannedColumn')}</th>
                      <th className="py-2 pr-3 text-right">{t('field.quality.missingColumn')}</th>
                      <th className="py-2 pr-3 text-right">{t('field.quality.shareColumn')}</th>
                      <th className="py-2">{t('field.quality.basisColumn')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.missing_data.map((entry) => (
                      <tr key={entry.metric} className="border-b border-line/60 last:border-0">
                        <td className="py-2 pr-3 text-[12.5px] font-semibold text-ink">{t(METRIC_KEYS[entry.metric])}</td>
                        <td className="py-2 pr-3 text-right tabular text-[12.5px]">{fmtInt(entry.readings_scanned, locale)}</td>
                        <td className="py-2 pr-3 text-right tabular text-[12.5px] font-bold text-ink">{fmtInt(entry.readings_missing, locale)}</td>
                        <td className="py-2 pr-3 text-right tabular text-[12.5px]">{share(entry.share)}</td>
                        <td className="py-2 text-[12px] text-ink-faint">
                          {t(entry.basis === 'scanned_rows_in_window' ? 'field.quality.basisScanned' : 'field.quality.basisEmpty')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <SectionLabel>{t('field.quality.integrityTitle')}</SectionLabel>
            <div className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <DataRow label={t('field.quality.serverStamped')}>{`${fmtInt(data.server_stamped.count, locale)} · ${share(data.server_stamped.share)}`}</DataRow>
              <DataRow label={t('field.quality.duplicateInstants')}>{fmtInt(data.duplicates.instants_with_duplicates, locale)}</DataRow>
              <DataRow label={t('field.quality.duplicateRows')}>{fmtInt(data.duplicates.rows_involved, locale)}</DataRow>
              <DataRow label={t('field.quality.unparseable')}>{fmtInt(data.unparseable_timestamps, locale)}</DataRow>
            </div>
            {data.duplicates.instants_with_duplicates > 0 && (
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">{t('field.quality.duplicateBody')}</p>
            )}
          </div>

          <div>
            <SectionLabel>{t('field.quality.boundsTitle')}</SectionLabel>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{t('field.quality.boundsHint')}</p>
            {data.at_store_bounds.length === 0 ? (
              <p className="mt-2 text-[12.5px] text-ink-faint">{t('field.quality.boundsNone')}</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {data.at_store_bounds.map((entry) => {
                  const digits = entry.metric === 'battery_voltage' ? 2 : 1;
                  return (
                    <li key={entry.metric} className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-1.5 text-[12.5px] last:border-0">
                      <span className="font-semibold text-ink">{t(METRIC_KEYS[entry.metric])}</span>
                      <span className="tabular text-ink-muted">
                        {t('field.quality.boundsRow', {
                          count: fmtInt(entry.count, locale),
                          min: fmt(entry.bounds.min, digits, locale),
                          max: fmt(entry.bounds.max, digits, locale),
                          unit: t(METRIC_UNIT_KEYS[entry.metric]),
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <SectionLabel>{t('field.quality.deviceTitle')}</SectionLabel>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{t('field.quality.deviceHint')}</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[52rem] border-collapse text-left">
                <caption className="sr-only">{t('field.quality.deviceCaption')}</caption>
                <thead>
                  <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                    <th className="py-2 pr-3">{t('field.quality.deviceColumn')}</th>
                    <th className="py-2 pr-3">{t('field.quality.statusColumn')}</th>
                    <th className="py-2 pr-3">{t('field.quality.observationColumn')}</th>
                    <th className="py-2 pr-3 text-right">{t('field.quality.heartbeatColumn')}</th>
                    <th className="py-2 pr-3 text-right">{t('field.quality.freshnessColumn')}</th>
                    <th className="py-2">{t('field.quality.verdictColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shownDevices.map((device) => (
                    <tr key={device.node_id} className="border-b border-line/60 last:border-0">
                      <td className="py-2 pr-3 text-[12.5px]">
                        <span className="font-semibold text-ink">{device.name}</span>
                        <span className="ml-1.5 text-[11px] text-ink-faint">{device.node_id}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <Badge tone={STATUS_TONE[device.status]} dot>
                          {t(STATUS_KEYS[device.status])}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <Badge tone={OBSERVATION_STATE_TONE[device.observation_state]}>
                          {t(OBSERVATION_STATE_KEYS[device.observation_state])}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-right text-[12.5px] text-ink-muted">{age(device.heartbeat_age_seconds)}</td>
                      <td className="py-2 pr-3 text-right text-[12.5px] text-ink-muted">{age(device.freshness_seconds)}</td>
                      <td className="py-2 text-[12px]">
                        {device.is_stale === null ? (
                          <span className="text-ink-faint">{t('field.quality.verdictUnknown')}</span>
                        ) : (
                          <Badge tone={device.is_stale ? 'clay' : 'brand'}>
                            {t(device.is_stale ? 'field.quality.verdictStale' : 'field.quality.verdictFresh')}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.devices.length > shownDevices.length && (
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
                {t('field.quality.deviceTruncated', { shown: fmtInt(shownDevices.length, locale), total: fmtInt(data.devices.length, locale) })}
              </p>
            )}
            {data.scanning.coverage === 'partial' && (
              <StateNotice tone="gold" title={t('field.coverage.title')} icon={TriangleAlert} className="mt-3">
                {t('field.quality.scanBody', {
                  rows: fmtInt(data.scanning.rows_scanned, locale),
                  cap: fmtInt(data.scanning.scan_cap, locale),
                  from: stamp(data.scanned_from, locale),
                })}
              </StateNotice>
            )}
            {data.rules_coverage === 'partial' && (
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">{t('field.quality.rulesPartial')}</p>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
