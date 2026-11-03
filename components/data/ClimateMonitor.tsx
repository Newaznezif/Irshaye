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
import { Badge, Button, Loading, Metric, PageHeader, Panel, Refreshing, StateNotice, fmt, dayLabel } from '@/components/ui';
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

  const chartRows = useMemo(
    () =>
      daily.map((d) => ({
        day: dayLabel(d.date),
        'Rain, observed': d.isForecast ? null : d.precipitationSumMm,
        'Rain, forecast': d.isForecast ? d.precipitationSumMm : null,
        'Max °C': d.temperatureMaxC,
        'Min °C': d.temperatureMinC,
      })),
    [daily],
  );

  const agroDays = agro.data?.daily ?? [];
  const rainSeries = agroDays.map((d) => ({ day: dayLabel(d.date), 'Rain mm': d.precipitationMm }));
  const normalPerDay = agro.data?.annualNormalMmPerDay ?? null;

  const current = weather.data?.current ?? null;
  const todayEt0 = daily.find((d) => d.date === new Date().toISOString().slice(0, 10))?.et0Mm ?? forecast[0]?.et0Mm ?? null;
  const rainWindow = agroDays.reduce((sum, d) => sum + (d.precipitationMm ?? 0), 0);
  const anomaly = agro.data?.derived ?? null;

  const anyRefreshing = weather.refreshing || agro.refreshing || ndvi.refreshing || imerg.refreshing;
  const hasLive = weather.data !== null || agro.data !== null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Climate Intelligence"
        icon={CloudSun}
        description="Live conditions and forecast from Open-Meteo, rainfall history and 30-year normals from NASA POWER, and satellite readings for the same point. Observed, forecast, modelled and derived values are always labelled as what they are."
        status={
          anyRefreshing ? (
            <Refreshing />
          ) : hasLive ? (
            <Badge tone="brand" dot>
              Live
            </Badge>
          ) : (
            <Badge tone="clay" dot>
              No live reading
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
            Refresh all
          </Button>
        }
      />

      <LocationPicker value={place} onChange={setPlace} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title={`Current conditions · ${place.name}`}
          hint="Open-Meteo’s analysed now-time for the grid cell, with the station-independent elevation the publisher reports."
        >
          {weather.loading && <Loading label="Reading Open-Meteo" />}
          {!weather.loading && weather.error && <SourceUnavailable error={weather.error} source="Open-Meteo" />}
          {current && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric label="Temperature" value={fmt(current.temperatureC, 1)} unit="°C" />
                <Metric label="Humidity" value={fmt(current.relativeHumidityPct, 0)} unit="%" />
                <Metric label="Wind" value={fmt(current.windSpeedKmh, 1)} unit="km/h" />
                <Metric label="Rain this hour" value={fmt(current.precipitationMm, 1)} unit="mm" />
              </div>
              <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
                Grid elevation{' '}
                <span className="tabular font-bold text-ink-muted">
                  {weather.data?.elevationM === null || weather.data?.elevationM === undefined
                    ? 'not reported'
                    : `${fmt(weather.data.elevationM, 0)} m`}
                </span>{' '}
                · timezone <span className="font-bold text-ink-muted">{weather.data?.timezone}</span>.{' '}
                {weather.data &&
                  !weather.data.withinEthiopia &&
                  'This point falls outside Ethiopia’s published extent, so national sources may not cover it.'}
              </p>
              <div className="mt-4 border-t border-line pt-3.5">
                <ProvenanceLabel provenance={weather.provenance} context={weather.data?.location.admin1 ?? undefined} />
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="The week just past and the week ahead"
          hint="Green bars are analysed observations, violet bars are the forecast. One chart, two different kinds of number — never blended into one series."
        >
          {weather.loading && <Loading label="Building the outlook" />}
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
                        x={dayLabel(firstForecastDay)}
                        stroke={theme.reference}
                        strokeDasharray="4 4"
                        label={{ value: 'today →', position: 'top', fontSize: 9, fill: theme.reference }}
                      />
                    )}
                    <Bar
                      yAxisId="rain"
                      dataKey="Rain, observed"
                      stackId="rain"
                      fill={KIND_COLORS.observed}
                      radius={[3, 0, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      yAxisId="rain"
                      dataKey="Rain, forecast"
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
                      stroke={SERIES_COLORS[1]}
                      strokeWidth={1.8}
                      dot={false}
                    />
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="Min °C"
                      stroke={SERIES_COLORS[2]}
                      strokeWidth={1.8}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <ChartKey
                items={[
                  { color: KIND_COLORS.observed, label: `Rain — observed (${observed.length} days)` },
                  { color: KIND_COLORS.forecast, label: `Rain — forecast (${forecast.length} days)` },
                  { color: SERIES_COLORS[1], label: 'Daily maximum temperature' },
                  { color: SERIES_COLORS[2], label: 'Daily minimum temperature' },
                ]}
              />

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric label={`Rain past ${observed.length} d`} value={fmt(sum(observed.map((d) => d.precipitationSumMm)), 1)} unit="mm" />
                <Metric
                  label={`Rain next ${forecast.length} d`}
                  value={fmt(sum(forecast.map((d) => d.precipitationSumMm)), 1)}
                  unit="mm"
                  tone="warn"
                  note="Sum of modelled daily totals."
                />
                <Metric label="ET0 today" value={fmt(todayEt0, 1)} unit="mm" note="FAO-56 reference evapotranspiration." />
                <Metric
                  label="Rain prob today"
                  value={fmt((observed.at(-1) ?? forecast[0])?.precipitationProbabilityMaxPct, 0)}
                  unit="%"
                />
              </div>

              <div className="mt-6 -mx-5 overflow-x-auto border-t border-line md:-mx-6">
                <div className="px-5 pt-4 md:px-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Daily detail</p>
                </div>
                <table className="mt-2 w-full min-w-[640px] text-[12.5px]">
                  <thead>
                    <tr className="border-y border-line text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                      <th scope="col" className="py-2 pr-3 pl-5 font-bold md:pl-6">Date</th>
                      <th scope="col" className="py-2 pr-3 font-bold">Kind</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">Rain mm</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">Prob %</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">Max / min °C</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">Humidity %</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">Wind km/h</th>
                      <th scope="col" className="py-2 pr-5 text-right font-bold md:pr-6">ET0 mm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {daily.slice(0, 15).map((d) => (
                      <tr key={d.date} className="transition-colors hover:bg-canvas/70">
                        <td className="tabular py-2 pr-3 pl-5 font-bold whitespace-nowrap text-ink md:pl-6">{d.date}</td>
                        <td className="py-2 pr-3">
                          <Badge tone={d.isForecast ? 'plum' : 'brand'}>
                            {d.isForecast ? 'Forecast' : 'Observed'}
                          </Badge>
                        </td>
                        <td className="tabular py-2 pr-3 text-right text-ink-muted">{fmt(d.precipitationSumMm, 1)}</td>
                        <td className="tabular py-2 pr-3 text-right text-ink-muted">
                          {fmt(d.precipitationProbabilityMaxPct, 0)}
                        </td>
                        <td className="tabular py-2 pr-3 whitespace-nowrap text-right text-ink-muted">
                          {fmt(d.temperatureMaxC, 1)} / {fmt(d.temperatureMinC, 1)}
                        </td>
                        <td className="tabular py-2 pr-3 text-right text-ink-muted">{fmt(d.relativeHumidityMeanPct, 0)}</td>
                        <td className="tabular py-2 pr-3 text-right text-ink-muted">{fmt(d.windSpeedMaxKmh, 1)}</td>
                        <td className="tabular py-2 pr-5 text-right text-ink-muted md:pr-6">{fmt(d.et0Mm, 1)}</td>
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
          title={`Agroclimatology · ${place.name}`}
          hint="NASA POWER daily surface values for this grid cell. The window ends yesterday because POWER publishes reanalysis with a 1–3 day lag."
        >
          {agro.loading && <Loading label="Reading NASA POWER" />}
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
                        label={{ value: 'normal mm/day', position: 'insideTopRight', fontSize: 9, fill: KIND_COLORS.estimated }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="Rain mm"
                      stroke={KIND_COLORS.observed}
                      strokeWidth={1.8}
                      fill="url(#rainFill)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <ChartKey
                items={[
                  { color: KIND_COLORS.observed, label: 'Daily rainfall — POWER observations' },
                  { color: KIND_COLORS.estimated, label: 'Climatological normal mm/day (dashed)' },
                ]}
              />

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric label={`Rain ${agro.data?.window.days ?? 0} d`} value={fmt(rainWindow, 1)} unit="mm" />
                <Metric label="Mean daily max" value={fmt(meanOf(agroDays.map((d) => d.temperatureMaxC)), 1)} unit="°C" />
                <Metric label="Mean daily min" value={fmt(meanOf(agroDays.map((d) => d.temperatureMinC)), 1)} unit="°C" />
                <Metric label="Mean shortwave" value={fmt(meanOf(agroDays.map((d) => d.shortwaveRadiationMjPerM2)), 1)} unit="MJ/m²" />
              </div>

              {anomaly ? (
                <StateNotice tone="gold" title="Rainfall anomaly — computed here, not published" className="mt-5">
                  <p>
                    {fmt(anomaly.observedMm, 1)} mm fell against {fmt(anomaly.expectedMm, 1)} mm of climatology for{' '}
                    {anomaly.period}: <strong>
                      {anomaly.anomalyPct === null
                        ? 'not computable from the data returned'
                        : `${anomaly.anomalyPct > 0 ? '+' : ''}${fmt(anomaly.anomalyPct, 0)}%`}
                    </strong>
                    .
                  </p>
                  <p className="mt-2">
                    Ratio of two published quantities (POWER daily against POWER 30-year normals for the same cell).
                    Coverage {anomaly.daysWithData}/{anomaly.daysRequested} days
                    {anomaly.sufficientCoverage ? '' : ' — too sparse to present as a season total'}.
                  </p>
                </StateNotice>
              ) : (
                agro.data?.normalsUnavailableReason && (
                  <StateNotice tone="gold" title="No anomaly shown" className="mt-5">
                    The climatology request failed ({agro.data.normalsUnavailableReason}). The observed rainfall above
                    is still real.
                  </StateNotice>
                )
              )}

              <div className="mt-4 border-t border-line pt-3.5">
                <ProvenanceLabel provenance={agro.provenance} />
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="Satellite reading for this point"
          icon={Satellite}
          hint="A physical value read out of the published tile for this exact coordinate, decoded with the publisher’s own colour map."
        >
          <div className="space-y-4">
            <SampleCard title="Vegetation greenness (NDVI, 8-day composite)" icon={Sprout} state={ndvi} />
            <SampleCard title="Precipitation rate (GPM IMERG)" icon={Satellite} state={imerg} />
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
            The sampled footprint is one tile pixel — hundreds of metres across — not the farmer’s plot. Neither
            product measures yield or soil conditions; the band wording above is the publisher’s own.
          </p>
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
  const sample = state.data;
  return (
    <div className="rounded-xl border border-line bg-canvas/60 p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-soft text-brand-700 dark:text-brand-300">
          <Icon size={13} strokeWidth={2.2} />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">{title}</p>
      </div>

      {state.loading && <Loading label="Fetching tile" className="py-4" />}
      {!state.loading && state.error && (
        <div className="mt-3">
          <SourceUnavailable error={state.error} source="NASA GIBS" />
        </div>
      )}

      {sample && (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="tabular text-[26px] leading-none font-extrabold tracking-tight text-ink">
              {sample.value === null ? 'no value' : fmt(sample.value, 3)}
            </p>
            <span className="text-[11px] font-bold text-ink-faint">{sample.layer?.units}</span>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
            {sample.band ? `Published band: “${sample.band}”. ` : 'This pixel carries no mapped value, so none is claimed. '}
            Scene date <span className="tabular font-semibold text-ink-muted">{sample.tileDate}</span> · pixel ≈{' '}
            <span className="tabular font-semibold text-ink-muted">{fmt(sample.pixelSizeMeters, 0)} m</span> · (
            <span className="tabular">{sample.latitude.toFixed(3)}, {sample.longitude.toFixed(3)}</span>)
            {sample.withinEthiopia ? '' : ' — outside Ethiopia'}.
          </p>
          {sample.layer && (
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-muted">
              <strong className="font-bold text-ink">What it means:</strong> {sample.layer.meaning}
            </p>
          )}
          {sample.layer && (
            <p className="mt-2 text-[11.5px] leading-relaxed text-clay-700 dark:text-clay-300">
              <strong className="font-bold">Limit:</strong> {sample.layer.caveat}
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
