'use client';

import { useMemo, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, LineChart as LineChartIcon, BatteryMedium, Server, TriangleAlert } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge, Button, DataRow, EmptyState, Input, Metric, Panel, SectionLabel, Select, SkeletonPanel, StateNotice, fmt, fmtInt, stamp } from '@/components/ui';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';
import { useChartTheme } from '@/hooks/useChartTheme';
import { useLanguage } from '@/hooks/useLanguage';
import type { FieldSessionStatus } from '@/hooks/useFieldSession';
import { useLiveData } from '@/hooks/useLiveData';
import { SERIES_COLORS, tooltipContentStyle } from '@/lib/ui/chart';

import { FieldSectionState, reasonFor } from './FieldSectionState';
import { FleetQualityPanel } from './FieldFleetQualityPanel';
import { dayBounds } from './localTime';
import {
  HISTORY_RANGES,
  HISTORY_RANGE_KEYS,
  METRIC_COLUMN,
  METRIC_KEYS,
  METRIC_UNIT_KEYS,
  SENSOR_METRICS,
  TIME_SOURCE_KEYS,
  ageBuckets,
} from './labels';
import type { SensorMetric } from './labels';
import type { DataQualityResponse, DeviceHistoryResponse, DeviceListResponse, HistoryRange, ReadingsResponse } from './types';

/**
 * Sensor Analytics: one device's stored past, plotted exactly as it was measured, and the fleet's
 * reporting health beside it.
 *
 * The discipline this panel is built around is that a chart is a claim about the past:
 *
 *  - **Nothing is filled in.** A row whose metric is `null` is a gap, and `connectNulls={false}` keeps
 *    it a gap. A line drawn across a missing reading is a measurement no sensor took, and it is the
 *    single most convincing way to fabricate data — the chart looks fine.
 *  - **A statistic says what it was computed from.** The summary comes from `/history`, which counts
 *    the window exactly and scans a capped sample for the arithmetic, so every figure here states
 *    `rows_scanned` beside `total_in_range`. A 30-day summary that silently describes nine days is
 *    the failure the coverage notice exists to prevent.
 *  - **The x-axis is `measured_at`, never "the last 24 hours".** The window the operator asked for is
 *    echoed back from the API's `window` field; a range filter that silently did nothing would be a
 *    lie with a nicer shape than an error.
 *  - **A page is not a series.** The route returns at most `MAX_PAGE_SIZE` (100) rows out of
 *    `total_in_range`, newest first, and says so in `chart_covers`. This panel renders that sentence
 *    above the chart, because a chart of 100 samples titled "November" reads like a chart of all of
 *    November.
 *  - **`time_source` is shown, not smoothed over.** A device that stamps its own measurements and a
 *    platform that stamps them on receipt are different provenances for the same axis, and a mixed
 *    window is called out.
 *  - **A verdict needs a human's number.** "Stale", "an unexpected gap" and "the silence allowance"
 *    are all computed against an `offline` alert rule an operator configured. Where none exists the
 *    panels show ages, intervals and counts with no verdict, because how long a farm's sensor may be
 *    silent is a fact about that farm, not about this code.
 *
 * Agronomy is deliberately absent: no "optimal moisture band", no index, no suggestion. Soil moisture
 * at a depth is a physical quantity; converting it into a statement about a crop's water status
 * requires a calibration and a crop model this platform does not have.
 */

const CHART_LIMIT = 100;
const TABLE_ROWS = 12;

/**
 * `MAX_PAGE_OFFSET` in `lib/field/registration.ts`; mirrored here because the server module that
 * declares it imports the service-role client. A page control that let an operator page past the
 * limit the API enforces would offer a button that always returns an error.
 */
const MAX_OFFSET = 10_000;

/**
 * A picked calendar day is bounded by `dayBounds` in `./localTime`, which is the dashboard's one
 * calendar and is graded by `npm run test:fieldintel`.
 */

/**
 * One device's window statistics, straight from `/history`.
 *
 * Two rules govern what appears. A figure computed from the capped scan is always shown beside the
 * exact count it came from (`rows_scanned` of `total_in_range`), because a mean of 2 000 rows is not a
 * mean of 40 000. And a verdict is only shown when a human configured the number behind it: the
 * silence allowance and the gap threshold come from an `offline` rule, so with none in scope the panel
 * says "no allowance configured" rather than picking one.
 */
function DeviceHistoryPanel({ data, metric }: { data: DeviceHistoryResponse; metric: SensorMetric }) {
  const { t, locale } = useLanguage();
  const theme = useChartTheme();

  const stats = data.summary.metrics.find((entry) => entry.metric === metric) ?? null;
  const reporting = data.summary.reporting;
  const quality = data.summary.quality;
  const decimals = metric === 'battery_voltage' ? 2 : 1;
  const units = t(METRIC_UNIT_KEYS[metric]);

  const age = (seconds: number | null): string => {
    if (seconds === null) return '—';
    const bucket = ageBuckets(seconds);
    return t(bucket.key, { value: String(bucket.value) });
  };
  // `reporting_rate` is a fraction computed by the server (`samples / rows in window`), so the percent
  // sign here is a rendering choice over an upstream number — never a share this file estimated.
  const share = (value: number | null): string => (value === null ? '—' : `${fmt(value * 100, 0, locale)} ${t('field.unit.percent')}`);

  const buckets = data.summary.buckets.map((bucket) => ({ at: bucket.bucket_start, value: bucket[columnFor(metric)] }));

  return (
    <Panel
      title={t('field.analytics.summaryTitle')}
      icon={Activity}
      hint={t('field.analytics.summaryHint')}
      right={
        <div className="flex items-center gap-1.5">
          <Badge tone={data.coverage === 'complete' ? 'brand' : 'gold'}>
            {t('field.analytics.scanned', { scanned: fmtInt(data.rows_scanned, locale), total: fmtInt(data.total_in_range, locale) })}
          </Badge>
          <Badge tone="outline">{t(HISTORY_RANGE_KEYS[data.window.range])}</Badge>
        </div>
      }
      footer={
        <p className="text-[11.5px] leading-relaxed text-ink-faint">
          {t('field.analytics.statisticsFromScan', { scanned: fmtInt(data.summary.rows_scanned, locale) })}
        </p>
      }
    >
      <div className="space-y-4">
        {stats === null ? (
          <EmptyState icon={Activity} title={t('field.analytics.noMetric')} hint={t('field.analytics.noMetricHint')} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label={t('field.analytics.samples')}
                value={fmtInt(stats.samples, locale)}
                note={t('field.analytics.samplesNote', { total: fmtInt(stats.observations_in_window, locale), share: share(stats.reporting_rate) })}
              />
              <Metric label={t('field.analytics.minimum')} value={fmt(stats.minimum, decimals, locale)} unit={units} tone="info" />
              <Metric label={t('field.analytics.mean')} value={fmt(stats.mean, decimals, locale)} unit={units} />
              <Metric label={t('field.analytics.maximum')} value={fmt(stats.maximum, decimals, locale)} unit={units} tone="info" />
            </div>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <DataRow label={t('field.analytics.median')}>{`${fmt(stats.median, decimals, locale)} ${units}`}</DataRow>
              <DataRow label={t('field.analytics.missing')}>{fmtInt(stats.missing, locale)}</DataRow>
              <DataRow label={t('field.analytics.latest')}>
                <span className="flex flex-wrap items-center justify-end gap-2">
                  <span className="tabular font-bold text-ink">{`${fmt(stats.latest_value, decimals, locale)} ${units}`}</span>
                  {stats.latest_measured_at !== null && (
                    <span className="text-[11px] text-ink-faint">{t('field.analytics.latestAt', { at: stamp(stats.latest_measured_at, locale) })}</span>
                  )}
                </span>
              </DataRow>
              <DataRow label={t('field.analytics.atEdge')}>
                <span className="flex flex-wrap items-center justify-end gap-2">
                  <span className="tabular">{fmtInt(stats.at_range_edge, locale)}</span>
                  <Badge tone="outline" title={t('field.analytics.atEdgeExplain')}>
                    {t('field.analytics.atEdgeBadge')}
                  </Badge>
                </span>
              </DataRow>
            </div>
          </>
        )}

        <div>
          <SectionLabel>{t('field.analytics.reportingTitle')}</SectionLabel>
          <div className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <DataRow label={t('field.analytics.readingsInRange')}>{fmtInt(reporting.observation_count, locale)}</DataRow>
            <DataRow label={t('field.analytics.allTimeReadings')}>{fmtInt(data.all_time_observations, locale)}</DataRow>
            <DataRow label={t('field.analytics.firstMeasured')}>{stamp(reporting.first_measured_at, locale)}</DataRow>
            <DataRow label={t('field.analytics.lastMeasured')}>{stamp(reporting.last_measured_at, locale)}</DataRow>
            <DataRow label={t('field.analytics.freshness')}>{age(reporting.freshness_seconds)}</DataRow>
            <DataRow label={t('field.analytics.receiptFreshness')}>{age(reporting.receipt_freshness_seconds)}</DataRow>
            <DataRow label={t('field.analytics.meanInterval')}>{age(reporting.mean_interval_seconds)}</DataRow>
            <DataRow label={t('field.analytics.medianInterval')}>{age(reporting.median_interval_seconds)}</DataRow>
            <DataRow label={t('field.analytics.largestGap')}>{age(reporting.largest_gap_seconds)}</DataRow>
            <DataRow label={t('field.analytics.silenceAllowance')}>
              {reporting.gap_threshold_seconds === null
                ? t('field.analytics.noAllowance')
                : age(reporting.gap_threshold_seconds)}
            </DataRow>
            <DataRow label={t('field.analytics.unexpectedGaps')}>
              {reporting.unexpected_gap_count === null ? '—' : fmtInt(reporting.unexpected_gap_count, locale)}
            </DataRow>
            <DataRow label={t('field.analytics.verdictBasis')}>
              {reporting.reference === 'configured_offline_rule' ? t('field.analytics.basisConfigured') : t('field.analytics.basisNone')}
            </DataRow>
          </div>
        </div>

        <div>
          <SectionLabel>{t('field.analytics.qualityTitle')}</SectionLabel>
          <div className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <DataRow label={t('field.analytics.serverStampedRow')}>{fmtInt(quality.server_stamped_count, locale)}</DataRow>
            <DataRow label={t('field.analytics.duplicateInstants')}>{fmtInt(quality.duplicate_instant_count, locale)}</DataRow>
            <DataRow label={t('field.analytics.unparseable')}>{fmtInt(quality.unparseable_timestamp_count, locale)}</DataRow>
            <DataRow label={t('field.analytics.freshnessVerdict')}>
              {quality.is_stale === null ? t('field.analytics.verdictNone') : quality.is_stale ? t('field.analytics.verdictStale') : t('field.analytics.verdictFresh')}
            </DataRow>
          </div>
          {quality.duplicate_instant_count > 0 && (
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">{t('field.analytics.duplicateNote')}</p>
          )}
        </div>

        {buckets.length === 0 ? (
          <EmptyState icon={Activity} title={t('field.analytics.noBuckets')} hint={t('field.analytics.noBucketsHint')} />
        ) : (
          <div>
            <SectionLabel>{t('field.analytics.bucketsTitle')}</SectionLabel>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
              {t('field.analytics.bucketsDerived', { size: t(data.summary.bucket_size === 'hour' ? 'field.bucketSize.hour' : 'field.bucketSize.day') })}
            </p>
            <div className="mt-3 h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={buckets} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="at"
                    tick={{ fill: theme.tick, fontSize: 10 }}
                    tickFormatter={(value: string) => stamp(value, locale)}
                    minTickGap={48}
                    stroke={theme.tick}
                  />
                  <YAxis tick={{ fill: theme.tick, fontSize: 10 }} stroke={theme.tick} width={48} domain={['auto', 'auto']} unit={units} />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelFormatter={(value) => (typeof value === 'string' ? stamp(value, locale) : '—')}
                    formatter={(value) => [typeof value === 'number' ? `${fmt(value, decimals, locale)} ${units}` : '—', t(METRIC_KEYS[metric])]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={SERIES_COLORS[1]}
                    strokeWidth={1.7}
                    dot={{ r: 1.6, fill: SERIES_COLORS[1], strokeWidth: 0 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {data.coverage === 'partial' && (
          <StateNotice tone="gold" title={t('field.coverage.title')} icon={TriangleAlert}>
            {t('field.coverage.history', {
              rows: fmtInt(data.rows_scanned, locale),
              cap: fmtInt(data.scan_cap, locale),
              from: stamp(data.scanned_window.from, locale),
            })}
          </StateNotice>
        )}
      </div>
    </Panel>
  );
}

/** The bucket column a metric's mean is drawn from — the same map `METRIC_COLUMN` gives the readings. */
function columnFor(metric: SensorMetric) {
  return METRIC_COLUMN[metric];
}

export function FieldAnalyticsSection({
  sessionStatus,
  accessToken,
}: {
  sessionStatus: FieldSessionStatus;
  accessToken: string | null;
}) {
  const { t, locale } = useLanguage();
  const theme = useChartTheme();

  const [nodeId, setNodeId] = useState('');
  const [chosen, setChosen] = useState('');
  const [metric, setMetric] = useState<SensorMetric>('soil_moisture');
  const [range, setRange] = useState<HistoryRange>('24h');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [applied, setApplied] = useState<{ from: string; to: string } | null>(null);
  const [offset, setOffset] = useState(0);

  const devices = useLiveData<DeviceListResponse, ProvenanceView>(
    sessionStatus === 'signed_in' ? '/api/hardware/devices?limit=100&offset=0' : null,
    { accessToken },
  );

  const column = METRIC_COLUMN[metric];
  const query =
    applied === null
      ? ''
      : `${applied.from === '' ? '' : `&from=${dayBounds(applied.from, 'start')}`}${
          applied.to === '' ? '' : `&to=${dayBounds(applied.to, 'end')}`
        }`;

  // The window the statistics describe. `range` keywords are resolved server-side against the
  // request's own instant; `custom` sends the operator's day bounds from the shared Addis calendar.
  // Both halves of a custom pair are required — `resolveHistoryWindow` refuses one — so a half-picked
  // window asks for nothing rather than sending a query the API must answer 400.
  const windowQuery =
    range === 'custom'
      ? applied !== null && applied.from !== '' && applied.to !== ''
        ? `&from=${dayBounds(applied.from, 'start')}&to=${dayBounds(applied.to, 'end')}`
        : null
      : `&range=${range}`;

  const readings = useLiveData<ReadingsResponse, ProvenanceView>(
    sessionStatus === 'signed_in' && chosen !== ''
      ? `/api/field/devices/${encodeURIComponent(chosen)}/readings?limit=${String(CHART_LIMIT)}&offset=${String(offset)}${query}`
      : null,
    { accessToken },
  );

  const history = useLiveData<DeviceHistoryResponse, ProvenanceView>(
    sessionStatus === 'signed_in' && chosen !== '' && windowQuery !== null
      ? `/api/field/devices/${encodeURIComponent(chosen)}/history?${windowQuery.slice(1)}`
      : null,
    { accessToken },
  );

  const quality = useLiveData<DataQualityResponse, ProvenanceView>(
    sessionStatus === 'signed_in' && windowQuery !== null
      ? `/api/field/data-quality?${windowQuery.slice(1)}`
      : null,
    { accessToken },
  );

  // Ascending time for the axis: the API answers newest-first so a page cut drops the oldest rows,
  // and a chart has to draw the other way round.
  const series = useMemo(() => {
    if (readings.data === null) return [];
    return [...readings.data.readings].reverse().map((row) => ({
      at: row.measured_at,
      value: row[column],
    }));
  }, [readings.data, column]);

  const gaps = useMemo(() => series.filter((point) => point.value === null).length, [series]);
  const serverStamped = useMemo(
    () => (readings.data === null ? 0 : readings.data.readings.filter((row) => row.time_source === 'server').length),
    [readings.data],
  );

  if (sessionStatus !== 'signed_in') {
    return (
      <Panel title={t('field.analytics.title')} icon={LineChartIcon} hint={t('field.analytics.hint')}>
        <FieldSectionState reason={reasonFor({ sessionStatus, error: null, isEmpty: false })} />
      </Panel>
    );
  }

  if (devices.loading) {
    return (
      <Panel title={t('field.analytics.title')} icon={LineChartIcon}>
        <SkeletonPanel rows={3} />
      </Panel>
    );
  }

  if (devices.error !== null || devices.data === null) {
    return (
      <Panel title={t('field.analytics.title')} icon={LineChartIcon}>
        <FieldSectionState reason={reasonFor({ sessionStatus, error: devices.error, isEmpty: false })} code={devices.error?.code} />
      </Panel>
    );
  }

  const options = devices.data.devices;
  if (options.length === 0) {
    return (
      <Panel title={t('field.analytics.title')} icon={LineChartIcon} hint={t('field.analytics.hint')}>
        <EmptyState icon={Activity} title={t('field.analytics.noDevices')} hint={t('field.analytics.noDevicesHint')} />
      </Panel>
    );
  }

  const total = readings.data?.total_in_range ?? 0;
  const lastOffset = Math.max(0, Math.min(Math.floor((total - 1) / CHART_LIMIT), Math.floor(MAX_OFFSET / CHART_LIMIT))) * CHART_LIMIT;

  return (
    <div className="space-y-4">
      <Panel title={t('field.analytics.title')} icon={LineChartIcon} hint={t('field.analytics.hint')}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <SectionLabel>{t('field.analytics.device')}</SectionLabel>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Select
                aria-label={t('field.analytics.device')}
                value={nodeId}
                onChange={(event) => setNodeId(event.target.value)}
                className="min-w-0 flex-1"
              >
                <option value="">{t('field.analytics.chooseDevice')}</option>
                {options.map((device) => (
                  <option key={device.node_id} value={device.node_id}>
                    {device.name} · {device.node_id}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                onClick={() => {
                  setChosen(nodeId);
                  setOffset(0);
                }}
                disabled={nodeId === ''}
              >
                {t('field.analytics.load')}
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 xl:col-span-2">
            <SectionLabel>{t('field.analytics.window')}</SectionLabel>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {HISTORY_RANGES.map((option) => (
                <Button key={option} size="sm" variant={option === range ? 'primary' : 'secondary'} onClick={() => setRange(option)}>
                  {t(HISTORY_RANGE_KEYS[option])}
                </Button>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">{t('field.analytics.windowNote')}</p>
          </div>

          <div>
            <SectionLabel>{t('field.analytics.from')}</SectionLabel>
            <Input
              type="date"
              aria-label={t('field.analytics.from')}
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <SectionLabel>{t('field.analytics.to')}</SectionLabel>
            <Input
              type="date"
              aria-label={t('field.analytics.to')}
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="mt-2"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setApplied({ from: fromDate, to: toDate });
                  setOffset(0);
                  // A window only becomes "custom" when both bounds are picked; a half-picked pair is
                  // what the API refuses, and a preset stays the honest label for everything else.
                  if (fromDate !== '' && toDate !== '') setRange('custom');
                }}
                disabled={chosen === ''}
              >
                {t('field.analytics.applyRange')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setApplied({ from: '', to: '' });
                  setRange('24h');
                  setOffset(0);
                }}
                disabled={chosen === ''}
              >
                {t('field.analytics.clearRange')}
              </Button>
              <p className="text-[11.5px] leading-relaxed text-ink-faint">{t('field.analytics.rangeNote')}</p>
            </div>
          </div>
        </div>
      </Panel>

      {chosen === '' ? (
        <Panel title={t('field.analytics.seriesTitle')} icon={Activity}>
          <EmptyState icon={Activity} title={t('field.analytics.pickDevice')} hint={t('field.analytics.pickDeviceHint')} />
        </Panel>
      ) : readings.loading ? (
        <Panel title={t('field.analytics.seriesTitle')} icon={Activity}>
          <SkeletonPanel rows={6} />
        </Panel>
      ) : readings.error !== null || readings.data === null ? (
        <Panel title={t('field.analytics.seriesTitle')} icon={Activity}>
          <FieldSectionState reason={reasonFor({ sessionStatus, error: readings.error, isEmpty: false })} code={readings.error?.code} />
        </Panel>
      ) : (
        <Panel
          title={t('field.analytics.seriesTitle')}
          icon={Activity}
          hint={t(METRIC_KEYS[metric])}
          right={
            <Badge tone="neutral">
              {t('field.analytics.plotted', { plotted: String(readings.data.readings.length), total: String(total) })}
            </Badge>
          }
          footer={<p className="text-[11.5px] leading-relaxed text-ink-faint">{t('field.analytics.covers', { note: readings.data.chart_covers })}</p>}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {SENSOR_METRICS.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={option === metric ? 'primary' : 'secondary'}
                onClick={() => setMetric(option)}
                leading={option === 'battery_voltage' ? <BatteryMedium size={14} /> : undefined}
                aria-pressed={option === metric}
              >
                {t(METRIC_KEYS[option])}
              </Button>
            ))}
          </div>

          {series.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon={Activity} title={t('field.analytics.noReadings')} hint={t('field.analytics.noReadingsHint')} />
            </div>
          ) : (
            <>
              <div className="mt-5 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="at"
                      tick={{ fill: theme.tick, fontSize: 10 }}
                      tickFormatter={(value: string) => stamp(value, locale)}
                      minTickGap={48}
                      stroke={theme.tick}
                    />
                    <YAxis
                      tick={{ fill: theme.tick, fontSize: 10 }}
                      stroke={theme.tick}
                      width={48}
                      domain={['auto', 'auto']}
                      unit={t(METRIC_UNIT_KEYS[metric])}
                    />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      labelFormatter={(value) => (typeof value === 'string' ? stamp(value, locale) : '—')}
                      formatter={(value) => [
                        typeof value === 'number' ? `${fmt(value, metric === 'battery_voltage' ? 2 : 1, locale)} ${t(METRIC_UNIT_KEYS[metric])}` : '—',
                        t(METRIC_KEYS[metric]),
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={SERIES_COLORS[0]}
                      strokeWidth={1.9}
                      dot={{ r: 1.8, fill: SERIES_COLORS[0], strokeWidth: 0 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {gaps > 0 && (
                  <Badge tone="gold" title={t('field.analytics.gapExplain')}>
                    {t('field.analytics.gaps', { count: String(gaps) })}
                  </Badge>
                )}
                {serverStamped > 0 && (
                  <Badge tone="info" title={t('field.analytics.timeSourceExplain')}>
                    {t('field.analytics.serverStamped', { count: String(serverStamped) })}
                  </Badge>
                )}
                {readings.data.window.from !== null && (
                  <Badge tone="outline">
                    {t('field.analytics.windowLabel', {
                      from: stamp(readings.data.window.from, locale),
                      to: readings.data.window.to === null ? '—' : stamp(readings.data.window.to, locale),
                    })}
                  </Badge>
                )}
              </div>

              {gaps > 0 && (
                <StateNotice tone="gold" title={t('field.analytics.gapTitle')} icon={TriangleAlert} className="mt-3">
                  {t('field.analytics.gapBody')}
                </StateNotice>
              )}

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[52rem] border-collapse text-left">
                  <caption className="sr-only">{t('field.analytics.tableCaption')}</caption>
                  <thead>
                    <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                      <th className="py-2 pr-3">{t('field.analytics.measuredAt')}</th>
                      <th className="py-2 pr-3">{t('field.analytics.receivedAt')}</th>
                      <th className="py-2 pr-3 text-right">
                        {t(METRIC_KEYS[metric])} ({t(METRIC_UNIT_KEYS[metric])})
                      </th>
                      <th className="py-2">{t('field.analytics.timeSource')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.data.readings.slice(0, TABLE_ROWS).map((row) => (
                      <tr key={row.log_id} className="border-b border-line/60 last:border-0">
                        <td className="py-2 pr-3 text-[12.5px] font-semibold text-ink">{stamp(row.measured_at, locale)}</td>
                        <td className="py-2 pr-3 text-[12.5px] text-ink-muted">{stamp(row.received_at, locale)}</td>
                        <td className="py-2 pr-3 text-right tabular text-[12.5px] font-bold text-ink">
                          {fmt(row[column], metric === 'battery_voltage' ? 2 : 1, locale)}
                        </td>
                        <td className="py-2">
                          <Badge tone={row.time_source === 'device' ? 'brand' : 'neutral'}>
                            {t(TIME_SOURCE_KEYS[row.time_source])}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11.5px] text-ink-faint">{t('field.analytics.tableNote', { rows: String(TABLE_ROWS) })}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOffset(Math.max(0, offset - CHART_LIMIT))}
                      disabled={offset === 0}
                      leading={<ChevronLeft size={14} />}
                    >
                      {t('field.analytics.newer')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOffset(Math.min(lastOffset, offset + CHART_LIMIT))}
                      disabled={offset >= lastOffset}
                      trailing={<ChevronRight size={14} />}
                    >
                      {t('field.analytics.older')}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Panel>
      )}

      {/* The statistics half of the same question: the rows above are what was measured, this is what
          it adds up to. Both describe one window, so both are driven by the same `windowQuery`. */}
      {chosen === '' ? null : windowQuery === null ? (
        <Panel title={t('field.analytics.summaryTitle')} icon={Activity}>
          <EmptyState icon={Activity} title={t('field.analytics.windowIncomplete')} hint={t('field.analytics.windowIncompleteHint')} />
        </Panel>
      ) : history.loading ? (
        <Panel title={t('field.analytics.summaryTitle')} icon={Activity}>
          <SkeletonPanel rows={6} />
        </Panel>
      ) : history.error !== null || history.data === null ? (
        <Panel title={t('field.analytics.summaryTitle')} icon={Activity}>
          <FieldSectionState reason={reasonFor({ sessionStatus, error: history.error, isEmpty: false })} code={history.error?.code} />
        </Panel>
      ) : (
        <DeviceHistoryPanel data={history.data} metric={metric} />
      )}

      {/* Fleet reporting health, for the operator whose chart is empty and needs to know whether to
          blame the weather or the network. */}
      {windowQuery === null ? (
        <Panel title={t('field.quality.title')} icon={Server}>
          <EmptyState icon={Server} title={t('field.analytics.windowIncomplete')} hint={t('field.analytics.windowIncompleteHint')} />
        </Panel>
      ) : quality.loading ? (
        <Panel title={t('field.quality.title')} icon={Server}>
          <SkeletonPanel rows={6} />
        </Panel>
      ) : quality.error !== null || quality.data === null ? (
        <Panel title={t('field.quality.title')} icon={Server}>
          <FieldSectionState reason={reasonFor({ sessionStatus, error: quality.error, isEmpty: false })} code={quality.error?.code} />
        </Panel>
      ) : (
        <FleetQualityPanel data={quality.data} />
      )}
    </div>
  );
}
