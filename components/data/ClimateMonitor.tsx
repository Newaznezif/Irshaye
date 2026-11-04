'use client';
import React, { useMemo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CloudSun, RefreshCw, Satellite, Sprout } from 'lucide-react';

import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { ProvenanceLabel, SourceUnavailable } from '@/components/data/ProvenanceLabel';
import { SourceStatusPanel } from '@/components/data/SourceStatusPanel';
import {
  Badge,
  Button,
  Loading,
  Metric,
  PageHeader,
  Panel,
  Refreshing,
  StateNotice,
  dayLabel,
  fmt,
} from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { KIND_COLORS, SERIES_COLORS, tooltipContentStyle } from '@/lib/ui/chart';
import { useChartTheme } from '@/hooks/useChartTheme';
import { useLiveData, type LiveDataState } from '@/hooks/useLiveData';

/** Catalogue places are addressed by name so the publisher's own coordinates and region labels are used. */
function locationParams(place: { name: string; admin1: string | null; latitude: number; longitude: number }): string {
  return place.admin1
    ? `place=${encodeURIComponent(place.name)}`
    : `lat=${place.latitude.toFixed(4)}&lon=${place.longitude.toFixed(4)}`;
}

/**
 * A tile sample is read out of a pixel, so it needs a coordinate: the route rejects a place
 * name for `view=sample` rather than guessing which of two markets of the same name was meant.
 */
function coordinateParams(place: { latitude: number; longitude: number }): string {
  return `lat=${place.latitude.toFixed(4)}&lon=${place.longitude.toFixed(4)}`;
}

interface CurrentWeather {
  observedAt: string;
  temperatureC: number | null;
  relativeHumidityPct: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
  weatherCode: number | null;
}

interface DailyRow {
  date: string;
  isForecast: boolean;
  precipitationSumMm: number | null;
  precipitationProbabilityMaxPct: number | null;
  temperatureMaxC: number | null;
  temperatureMinC: number | null;
  relativeHumidityMeanPct: number | null;
  windSpeedMaxKmh: number | null;
  et0Mm: number | null;
}

interface WeatherPayload {
  location: { name: string; admin1: string | null; admin2: string | null; latitude: number; longitude: number };
  timezone: string;
  elevationM: number | null;
  current: CurrentWeather | null;
  daily: DailyRow[];
  withinEthiopia: boolean;
}

interface AgroRow {
  date: string;
  temperatureMaxC: number | null;
  temperatureMinC: number | null;
  relativeHumidityPct: number | null;
  windSpeedMs: number | null;
  precipitationMm: number | null;
  shortwaveRadiationMjPerM2: number | null;
}

interface AgroPayload {
  location: WeatherPayload['location'];
  daily: AgroRow[];
  normals: { month: string; parameter: string; units: string; value: number | null }[];
  window: { start: string; end: string; days: number };
  annualNormalMmPerDay: number | null;
  normalsUnavailableReason: string | null;
  derived: {
    period: string;
    observedMm: number;
    expectedMm: number;
    anomalyPct: number | null;
    daysWithData: number;
    daysRequested: number;
    sufficientCoverage: boolean;
    valueKind: 'estimated';
  } | null;
}

interface SamplePayload {
  layerId: string;
  tileDate: string;
  latitude: number;
  longitude: number;
  value: number | null;
  band: string | null;
  pixelSizeMeters: number;
  layer: { title: string; meaning: string; caveat: string; units: string; cadence: string; resolution: string } | null;
  withinEthiopia: boolean;
}

export const ClimateMonitor = () => {
  const { t, locale } = useLanguage();
  const { place, setPlace } = useWorkbench();
  const base = locationParams(place);
  const coords = coordinateParams(place);

  const weather = useLiveData<WeatherPayload>(`/api/data/weather?${base}&days=7&pastDays=7`);
  const agro = useLiveData<AgroPayload>(`/api/data/agroclimate?${base}&days=45`);
  const ndvi = useLiveData<SamplePayload>(`/api/data/geospatial?view=sample&layer=VIIRS_SNPP_NDVI_8Day&${coords}`);
  const imerg = useLiveData<SamplePayload>(`/api/data/geospatial?view=sample&layer=IMERG_Precipitation_Rate&${coords}`);

  const theme = useChartTheme();

  const daily = useMemo(() => weather.data?.daily ?? [], [weather.data]);
  const observed = daily.filter((d) => !d.isForecast);
  const forecast = daily.filter((d) => d.isForecast);
  const firstForecastDay = forecast[0]?.date;

  // Series keys stay English: they are the chart's data contract. The rendered
  // names come from `name` props, which recharts shows in tooltips and legends.
  const chartRows = useMemo(
    () =>
      daily.map((d) => ({
        day: dayLabel(d.date, locale),
        'Rain, observed': d.isForecast ? null : d.precipitationSumMm,
        'Rain, forecast': d.isForecast ? d.precipitationSumMm : null,
        'Max °C': d.temperatureMaxC,
        'Min °C': d.temperatureMinC,
      })),
    [daily, locale],
  );

  const agroDays = agro.data?.daily ?? [];
  const rainSeries = agroDays.map((d) => ({ day: dayLabel(d.date, locale), 'Rain mm': d.precipitationMm }));
  const normalPerDay = agro.data?.annualNormalMmPerDay ?? null;

  const current = weather.data?.current ?? null;
  const todayEt0 =
    daily.find((d) => d.date === new Date().toISOString().slice(0, 10))?.et0Mm ?? forecast[0]?.et0Mm ?? null;
  const rainWindow = agroDays.reduce((sum, d) => sum + (d.precipitationMm ?? 0), 0);
  const anomaly = agro.data?.derived ?? null;

  const anyRefreshing = weather.refreshing || agro.refreshing || ndvi.refreshing || imerg.refreshing;
  const hasLive = weather.data !== null || agro.data !== null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.group.Intelligence')}
        title={t('module.climate.label')}
        icon={CloudSun}
        description={t('climate.description')}
        status={
          anyRefreshing ? (
            <Refreshing />
          ) : hasLive ? (
            <Badge tone="brand" dot>
              {t('common.liveBadge')}
            </Badge>
          ) : (
            <Badge tone="clay" dot>
              {t('overview.badgeNoReading')}
            </Badge>
          )
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              weather.reload();
              agro.reload();
              ndvi.reload();
              imerg.reload();
            }}
            disabled={anyRefreshing}
            leading={<RefreshCw size={14} className={anyRefreshing ? 'animate-spin' : undefined} />}
          >
            {t('common.refreshAll')}
          </Button>
        }
      />

      <LocationPicker value={place} onChange={setPlace} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title={t('climate.currentConditions', { place: place.name })}
          hint={t('climate.currentHint')}
        >
          {weather.loading && <Loading label={t('climate.loadingWeather')} />}
          {!weather.loading && weather.error && <SourceUnavailable error={weather.error} source="Open-Meteo" />}
          {current && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric label={t('climate.temperature')} value={fmt(current.temperatureC, 1, locale)} unit="°C" />
                <Metric label={t('hero.humidity')} value={fmt(current.relativeHumidityPct, 0, locale)} unit="%" />
                <Metric label={t('climate.wind')} value={fmt(current.windSpeedKmh, 1, locale)} unit="km/h" />
                <Metric label={t('climate.rainThisHour')} value={fmt(current.precipitationMm, 1, locale)} unit="mm" />
              </div>
              <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
                {t('climate.gridElevation')}{' '}
                <span className="tabular font-bold text-ink-muted">
                  {weather.data?.elevationM === null || weather.data?.elevationM === undefined
                    ? t('climate.notReported')
                    : `${fmt(weather.data.elevationM, 0, locale)} m`}
                </span>{' '}
                · {t('climate.timezoneLabel')} <span className="font-bold text-ink-muted">{weather.data?.timezone}</span>
                . {weather.data && !weather.data.withinEthiopia && t('climate.outsideEthiopia')}
              </p>
              <div className="mt-4 border-t border-line pt-3.5">
                <ProvenanceLabel provenance={weather.provenance} context={weather.data?.location.admin1 ?? undefined} />
              </div>
            </>
          )}
        </Panel>

        <Panel
          title={t('climate.weekAround')}
          hint={t('climate.weekHint')}
        >
          {weather.loading && <Loading label={t('climate.buildingOutlook')} />}
          {!weather.loading && weather.error && <SourceUnavailable error={weather.error} source="Open-Meteo" />}
          {chartRows.length > 0 && (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartRows} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: theme.tick }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="rain"
                      tick={{ fontSize: 10, fill: theme.tick }}
                      tickLine={false}
                      axisLine={false}
                      width={46}
                      unit="mm"
                    />
                    <YAxis
                      yAxisId="temp"
                      orientation="right"
                      tick={{ fontSize: 10, fill: theme.tick }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                      unit="°C"
                    />
                    <Tooltip contentStyle={tooltipContentStyle} />
                    {firstForecastDay && (
                      <ReferenceLine
                        yAxisId="rain"
                        x={dayLabel(firstForecastDay, locale)}
                        stroke={theme.reference}
                        strokeDasharray="4 4"
                        label={{ value: t('climate.todayMarker'), position: 'top', fontSize: 9, fill: theme.reference }}
                      />
                    )}
                    <Bar
                      yAxisId="rain"
                      dataKey="Rain, observed"
                      name={t('climate.rainObserved')}
                      stackId="rain"
                      fill={KIND_COLORS.observed}
                      radius={[3, 0, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      yAxisId="rain"
                      dataKey="Rain, forecast"
                      name={t('climate.rainForecast')}
                      stackId="rain"
                      fill={KIND_COLORS.forecast}
                      fillOpacity={0.8}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={22}
                    />
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="Max °C"
                      name={t('climate.maxTemp')}
                      stroke={SERIES_COLORS[1]}
                      strokeWidth={1.8}
                      dot={false}
                    />
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="Min °C"
                      name={t('climate.minTemp')}
                      stroke={SERIES_COLORS[2]}
                      strokeWidth={1.8}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <ChartKey
                items={[
                  { color: KIND_COLORS.observed, label: t('climate.keyRainObserved', { count: observed.length }) },
                  { color: KIND_COLORS.forecast, label: t('climate.keyRainForecast', { count: forecast.length }) },
                  { color: SERIES_COLORS[1], label: t('climate.keyMaxTemp') },
                  { color: SERIES_COLORS[2], label: t('climate.keyMinTemp') },
                ]}
              />

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric
                  label={t('climate.rainPastDays', { count: observed.length })}
                  value={fmt(sum(observed.map((d) => d.precipitationSumMm)), 1, locale)}
                  unit="mm"
                />
                <Metric
                  label={t('climate.rainNextDays', { count: forecast.length })}
                  value={fmt(sum(forecast.map((d) => d.precipitationSumMm)), 1, locale)}
                  unit="mm"
                  tone="warn"
                  note={t('climate.rainNextNote')}
                />
                <Metric label={t('climate.et0Today')} value={fmt(todayEt0, 1, locale)} unit="mm" note={t('climate.et0Note')} />
                <Metric
                  label={t('climate.rainProbToday')}
                  value={fmt((observed.at(-1) ?? forecast[0])?.precipitationProbabilityMaxPct, 0, locale)}
                  unit="%"
                />
              </div>

              <div className="mt-6 -mx-5 overflow-x-auto border-t border-line md:-mx-6">
                <div className="px-5 pt-4 md:px-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                    {t('climate.dailyDetail')}
                  </p>
                </div>
                <table className="mt-2 w-full min-w-[640px] text-[12.5px]">
                  <thead>
                    <tr className="border-y border-line text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                      <th scope="col" className="py-2 pr-3 pl-5 font-bold md:pl-6">{t('climate.thDate')}</th>
                      <th scope="col" className="py-2 pr-3 font-bold">{t('climate.thKind')}</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">{t('climate.thRainMm')}</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">{t('climate.thProbPct')}</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">{t('climate.thMaxMin')}</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">{t('climate.thHumidityPct')}</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">{t('climate.thWindKmh')}</th>
                      <th scope="col" className="py-2 pr-5 text-right font-bold md:pr-6">{t('climate.thEt0Mm')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {daily.slice(0, 15).map((d) => (
                      <tr key={d.date} className="transition-colors hover:bg-canvas/70">
                        <td className="tabular py-2 pr-3 pl-5 font-bold whitespace-nowrap text-ink md:pl-6">{d.date}</td>
                        <td className="py-2 pr-3">
                          <Badge tone={d.isForecast ? 'plum' : 'brand'}>
                            {d.isForecast ? t('prov.kind.forecast') : t('prov.kind.observed')}
                          </Badge>
                        </td>
                        <td className="tabular py-2 pr-3 text-right text-ink-muted">{fmt(d.precipitationSumMm, 1, locale)}</td>
                        <td className="tabular py-2 pr-3 text-right text-ink-muted">
                          {fmt(d.precipitationProbabilityMaxPct, 0, locale)}
                        </td>
                        <td className="tabular py-2 pr-3 whitespace-nowrap text-right text-ink-muted">
                          {fmt(d.temperatureMaxC, 1, locale)} / {fmt(d.temperatureMinC, 1, locale)}
                        </td>
                        <td className="tabular py-2 pr-3 text-right text-ink-muted">{fmt(d.relativeHumidityMeanPct, 0, locale)}</td>
                        <td className="tabular py-2 pr-3 text-right text-ink-muted">{fmt(d.windSpeedMaxKmh, 1, locale)}</td>
                        <td className="tabular py-2 pr-5 text-right text-ink-muted md:pr-6">{fmt(d.et0Mm, 1, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <ProvenanceLabel provenance={weather.provenance} />
              </div>
            </>
          )}
        </Panel>

        <Panel
          title={t('climate.agroTitle', { place: place.name })}
          hint={t('climate.agroHint')}
        >
          {agro.loading && <Loading label={t('climate.loadingPower')} />}
          {!agro.loading && agro.error && <SourceUnavailable error={agro.error} source="NASA POWER" />}
          {rainSeries.length > 0 && (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={rainSeries} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rainFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={KIND_COLORS.observed} stopOpacity={0.32} />
                        <stop offset="100%" stopColor={KIND_COLORS.observed} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: theme.tick }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10, fill: theme.tick }} tickLine={false} axisLine={false} width={46} unit="mm" />
                    <Tooltip contentStyle={tooltipContentStyle} />
                    {normalPerDay !== null && (
                      <ReferenceLine
                        y={Number(normalPerDay.toFixed(1))}
                        stroke={KIND_COLORS.estimated}
                        strokeDasharray="4 4"
                        ifOverflow="extendDomain"
                        label={{
                          value: t('climate.normalMarker'),
                          position: 'insideTopRight',
                          fontSize: 9,
                          fill: KIND_COLORS.estimated,
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="Rain mm"
                      name={t('climate.rainObserved')}
                      stroke={KIND_COLORS.observed}
                      strokeWidth={1.8}
                      fill="url(#rainFill)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <ChartKey
                items={[
                  { color: KIND_COLORS.observed, label: t('climate.keyDailyRain') },
                  { color: KIND_COLORS.estimated, label: t('climate.keyNormal') },
                ]}
              />

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric
                  label={t('climate.rainWindowDays', { count: agro.data?.window.days ?? 0 })}
                  value={fmt(rainWindow, 1, locale)}
                  unit="mm"
                />
                <Metric
                  label={t('climate.meanDailyMax')}
                  value={fmt(meanOf(agroDays.map((d) => d.temperatureMaxC)), 1, locale)}
                  unit="°C"
                />
                <Metric
                  label={t('climate.meanDailyMin')}
                  value={fmt(meanOf(agroDays.map((d) => d.temperatureMinC)), 1, locale)}
                  unit="°C"
                />
                <Metric
                  label={t('climate.meanShortwave')}
                  value={fmt(meanOf(agroDays.map((d) => d.shortwaveRadiationMjPerM2)), 1, locale)}
                  unit="MJ/m²"
                />
              </div>

              {anomaly ? (
                <StateNotice tone="gold" title={t('climate.anomalyTitle')} className="mt-5">
                  <p>
                    {t('climate.anomalyBody', {
                      observed: fmt(anomaly.observedMm, 1, locale),
                      expected: fmt(anomaly.expectedMm, 1, locale),
                      period: anomaly.period,
                    })}{' '}
                    <strong>
                      {anomaly.anomalyPct === null
                        ? t('climate.anomalyNotComputable')
                        : `${anomaly.anomalyPct > 0 ? '+' : ''}${fmt(anomaly.anomalyPct, 0, locale)}%`}
                    </strong>
                    .
                  </p>
                  <p className="mt-2">
                    {t('climate.anomalyRatio', { has: anomaly.daysWithData, requested: anomaly.daysRequested })}
                    {anomaly.sufficientCoverage ? '' : t('climate.anomalySparse')}
                  </p>
                </StateNotice>
              ) : (
                agro.data?.normalsUnavailableReason && (
                  <StateNotice tone="gold" title={t('climate.noAnomalyTitle')} className="mt-5">
                    {t('climate.noAnomalyBody', { reason: agro.data.normalsUnavailableReason })}
                  </StateNotice>
                )
              )}

              <div className="mt-4 border-t border-line pt-3.5">
                <ProvenanceLabel provenance={agro.provenance} />
              </div>
            </>
          )}
        </Panel>

        <Panel title={t('climate.satelliteTitle')} icon={Satellite} hint={t('climate.satelliteHint')}>
          <div className="space-y-4">
            <SampleCard title={t('climate.ndviTitle')} icon={Sprout} state={ndvi} />
            <SampleCard title={t('climate.imergTitle')} icon={Satellite} state={imerg} />
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">{t('climate.satelliteFootnote')}</p>
        </Panel>
      </div>

      <SourceStatusPanel />
    </div>
  );
};

function meanOf(values: (number | null)[]): number | null {
  const clean = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  return clean.length === 0 ? null : clean.reduce((a, b) => a + b, 0) / clean.length;
}

function sum(values: (number | null)[]): number {
  return values.reduce<number>((total, v) => total + (v ?? 0), 0);
}

function ChartKey({ items }: { items: { color: string; label: string }[] }) {
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-[11px] font-semibold text-ink-muted">
          <span aria-hidden className="h-2 w-2.5 shrink-0 rounded-sm" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

const SampleCard = ({
  title,
  icon: Icon,
  state,
}: {
  title: string;
  icon: typeof Sprout;
  state: LiveDataState<SamplePayload>;
}) => {
  const { t, locale } = useLanguage();
  const sample = state.data;
  return (
    <div className="rounded-xl border border-line bg-canvas/60 p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-soft text-brand-700 dark:text-brand-300">
          <Icon size={13} strokeWidth={2.2} />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">{title}</p>
      </div>

      {state.loading && <Loading label={t('climate.fetchingTile')} className="py-4" />}
      {!state.loading && state.error && (
        <div className="mt-3">
          <SourceUnavailable error={state.error} source="NASA GIBS" />
        </div>
      )}

      {sample && (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="tabular text-[26px] leading-none font-extrabold tracking-tight text-ink">
              {sample.value === null ? t('climate.noValue') : fmt(sample.value, 3, locale)}
            </p>
            <span className="text-[11px] font-bold text-ink-faint">{sample.layer?.units}</span>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
            {sample.band ? t('climate.publishedBand', { band: sample.band }) : t('climate.noMappedValue')}{' '}
            {t('climate.sceneDate')} <span className="tabular font-semibold text-ink-muted">{sample.tileDate}</span> ·{' '}
            {t('climate.pixelSize')}{' '}
            <span className="tabular font-semibold text-ink-muted">{fmt(sample.pixelSizeMeters, 0, locale)} m</span> · (
            <span className="tabular">{sample.latitude.toFixed(3)}, {sample.longitude.toFixed(3)}</span>)
            {sample.withinEthiopia ? '' : t('climate.outsideEthiopiaSuffix')}.
          </p>
          {sample.layer && (
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-muted">
              <strong className="font-bold text-ink">{t('climate.whatItMeans')}</strong> {sample.layer.meaning}
            </p>
          )}
          {sample.layer && (
            <p className="mt-2 text-[11.5px] leading-relaxed text-clay-700 dark:text-clay-300">
              <strong className="font-bold">{t('climate.limitLabel')}</strong> {sample.layer.caveat}
            </p>
          )}
          <div className="mt-3 border-t border-line pt-2.5">
            <ProvenanceLabel provenance={state.provenance} compact />
          </div>
        </>
      )}
    </div>
  );
};
