'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CloudRain,
  Droplets,
  LayoutDashboard,
  RefreshCw,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { CropPicker } from '@/components/CropPicker';
import { ProvenanceLabel, SourceUnavailable } from '@/components/data/ProvenanceLabel';
import {
  Badge,
  Button,
  ButtonLink,
  Loading,
  Metric,
  PageHeader,
  Panel,
  Refreshing,
  SectionLabel,
  StatCard,
  fmt,
  stamp,
} from '@/components/ui';
import { useLiveData } from '@/hooks/useLiveData';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';
import type { WeatherSeries } from '@/lib/data/types';
import { getCrop } from '@/lib/crops/catalog';
import { MODULES } from '@/lib/modules';

type WeatherPayload = WeatherSeries;

const MONTH_NAME = new Intl.DateTimeFormat('en', { month: 'long' });

export default function OverviewPage() {
  const { place, cropId, setPlace, setCropId, ready } = useWorkbench();

  const params = `lat=${place.latitude}&lon=${place.longitude}`;
  const weather = useLiveData<WeatherPayload, ProvenanceView>(
    ready ? `/api/data/weather?${params}&days=7&pastDays=0&hourly=0` : null,
  );

  const daily = useMemo(() => weather.data?.daily ?? [], [weather.data]);
  const forecast = daily.filter((d) => d.isForecast);
  const rainNext7 = forecast.reduce((sum, d) => sum + (d.precipitationSumMm ?? 0), 0);
  const nextRainDay = forecast.find((d) => (d.precipitationSumMm ?? 0) >= 1);
  const outlookMaxTemps = forecast.map((d) => d.temperatureMaxC).filter((v): v is number => v !== null);
  const outlookMinTemps = forecast.map((d) => d.temperatureMinC).filter((v): v is number => v !== null);
  const maxOutlookTemp = outlookMaxTemps.length > 0 ? Math.max(...outlookMaxTemps) : null;
  const minOutlookTemp = outlookMinTemps.length > 0 ? Math.min(...outlookMinTemps) : null;
  const crop = getCrop(cropId);
  const now = new Date();
  const month = now.getMonth() + 1;

  const plantingNow = crop?.plantingWindows.some(
    (w) => w.startMonth <= month && month <= w.endMonth,
  );
  const harvestNow = crop?.harvestWindows.some(
    (w) => w.startMonth <= month && month <= w.endMonth,
  );

  const current = weather.data?.current ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Today"
        title="Farm overview"
        icon={LayoutDashboard}
        description="Pick your place and your crop. Everything below is live data with its source attached, and the platform says plainly when a figure is a forecast or a model output rather than a measurement."
        status={
          weather.data !== null ? (
            <Badge tone="brand" dot>
              Live
            </Badge>
          ) : weather.loading ? (
            <Badge tone="neutral">Connecting</Badge>
          ) : (
            <Badge tone="clay" dot>
              No live reading
            </Badge>
          )
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={weather.reload}
              disabled={weather.loading || weather.refreshing}
              leading={<RefreshCw size={14} className={weather.refreshing ? 'animate-spin' : undefined} />}
            >
              Refresh
            </Button>
            <ButtonLink variant="ghost" size="sm" href="/dashboard/settings" className="hidden sm:inline-flex">
              Change saved context
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <LocationPicker value={place} onChange={setPlace} label="Your location" />
        <CropPicker value={cropId} onChange={setCropId} />
      </div>

      <Panel
        title={`Season context — ${place.name}`}
        icon={CloudRain}
        hint={`Month of ${MONTH_NAME.format(now)}. Guidance compares the live forecast with your crop’s documented reference requirements.`}
        right={weather.refreshing ? <Refreshing /> : undefined}
        footer={
          weather.data !== null ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-ink-faint">
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink-muted">
                <Thermometer size={12} className="text-brand-600 dark:text-brand-400" />
                {place.name}
              </span>
              {current && (
                <>
                  <span className="tabular inline-flex items-center gap-1.5">
                    <CloudRain size={12} /> rain now {fmt(current.precipitationMm, 1)} mm
                  </span>
                  <span className="tabular inline-flex items-center gap-1.5">
                    <Wind size={12} /> {fmt(current.windSpeedKmh, 0)} km/h
                  </span>
                  <span className="tabular inline-flex items-center gap-1.5">
                    <Droplets size={12} /> {fmt(current.relativeHumidityPct, 0)}%
                  </span>
                </>
              )}
              <ProvenanceLabel provenance={weather.provenance} compact />
            </div>
          ) : undefined
        }
      >
        {weather.loading && <Loading label="Loading live weather" />}

        {!weather.loading && weather.data === null && weather.error && (
          <SourceUnavailable error={weather.error} source="Open-Meteo" />
        )}

        {weather.data !== null && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Thermometer}
                label="Temperature now"
                value={fmt(current?.temperatureC, 1)}
                unit="°C"
                supporting={
                  current ? `Observed ${stamp(current.observedAt ?? weather.fetchedAt ?? '')}` : 'No observation returned'
                }
              />
              <StatCard
                icon={CloudRain}
                label="Rain, 7-day outlook"
                value={forecast.length > 0 ? fmt(rainNext7, 1) : '—'}
                unit="mm"
                tone={rainNext7 > 25 ? 'brand' : rainNext7 > 0 ? 'gold' : 'clay'}
                supporting={
                  forecast.length > 0
                    ? 'Sum of forecast daily totals — a modelled outlook, not a measurement.'
                    : 'No forecast days were returned.'
                }
              />
              <StatCard
                icon={CalendarClock}
                label="Next day ≥ 1 mm"
                value={
                  nextRainDay
                    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
                        new Date(`${nextRainDay.date}T00:00:00`),
                      )
                    : 'None in 7d'
                }
                supporting="First forecast day reaching one millimetre of rainfall."
                tone="info"
              />
              <StatCard
                icon={Droplets}
                label="Humidity now"
                value={fmt(current?.relativeHumidityPct, 0)}
                unit="%"
                supporting="Relative humidity from the same observation as the temperature."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Forecast days shown" value={forecast.length} note="Open-Meteo horizon for this point." />
              <Metric
                label="Warmest outlook"
                value={fmt(maxOutlookTemp, 1)}
                unit="°C"
                note="Highest daily maximum among the forecast days returned."
              />
              <Metric
                label="Cooliest outlook"
                value={fmt(minOutlookTemp, 1)}
                unit="°C"
                note="Lowest daily minimum among the forecast days returned."
              />
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-4">
              {crop ? (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-2.5 text-[15px] font-extrabold tracking-tight text-ink">
                      {crop.name}
                      {crop.amharicName && (
                        <span lang="am" className="ethiopic text-[13px] font-bold text-brand-700 dark:text-brand-300">
                          — {crop.amharicName}
                        </span>
                      )}
                      <Badge tone={plantingNow ? 'brand' : harvestNow ? 'gold' : 'neutral'}>
                        {plantingNow ? 'Planting window' : harvestNow ? 'Harvest window' : 'Outside documented windows'}
                      </Badge>
                    </p>
                    <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
                      {plantingNow
                        ? 'This month sits inside a documented planting window for this crop.'
                        : harvestNow
                          ? 'This month sits inside a documented harvest window for this crop.'
                          : 'This month is outside the documented planting and harvest windows — the crop profile shows which months the sources name.'}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/crops"
                    className="group inline-flex items-center gap-1.5 self-start rounded-xl bg-brand px-3.5 py-2 text-[13px] font-bold text-brand-ink transition-colors hover:bg-brand-hover md:self-auto"
                  >
                    Open Crop Advisory
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ) : (
                <p className="text-[12.5px] leading-relaxed text-ink-muted">
                  Crop reference profiles are curated with sources. Until a profile exists for this crop, no
                  planting guidance is shown — the platform will not guess.
                </p>
              )}
            </div>
          </div>
        )}
      </Panel>

      <section aria-label="Modules">
        <SectionLabel>Go deeper</SectionLabel>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.filter((m) => m.href !== '/dashboard').map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-700 ring-1 ring-inset ring-brand/15 dark:text-brand-300">
                  <Icon size={18} strokeWidth={2.1} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-extrabold tracking-tight text-ink">{m.label}</span>
                    <ArrowRight
                      size={15}
                      className="shrink-0 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-brand"
                    />
                  </span>
                  <span className="mt-1.5 block text-[12px] leading-relaxed text-ink-muted">{m.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
