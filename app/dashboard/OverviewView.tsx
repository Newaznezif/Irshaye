'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, CloudRain, Thermometer, Wind, Droplets } from 'lucide-react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { CropPicker } from '@/components/CropPicker';
import { ProvenanceLabel, SourceUnavailable } from '@/components/data/ProvenanceLabel';
import { Loading, Metric, Panel, fmt } from '@/components/data/ui';
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
  const crop = getCrop(cropId);
  const now = new Date();
  const month = now.getMonth() + 1;

  const plantingNow = crop?.plantingWindows.some(
    (w) => w.startMonth <= month && month <= w.endMonth,
  );
  const harvestNow = crop?.harvestWindows.some(
    (w) => w.startMonth <= month && month <= w.endMonth,
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Farm overview</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">
          Pick your place and your crop. Everything below is live data with its source attached —
          and the platform tells you plainly when a number is forecast or modelled rather than
          measured.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LocationPicker value={place} onChange={setPlace} label="Your location" />
        <CropPicker value={cropId} onChange={setCropId} />
      </div>

      <Panel
        title={`Season context — ${place.name}`}
        hint={`Month of ${MONTH_NAME.format(now)}. Guidance compares the live forecast with your crop's reference requirements.`}
      >
        {weather.loading && <Loading label="Loading live weather" />}
        {!weather.loading && weather.data === null && weather.error && (
          <SourceUnavailable error={weather.error} source="Open-Meteo" />
        )}
        {weather.data !== null && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Now · temp"
                value={fmt(weather.data?.current?.temperatureC, 1)}
                unit="°C"
              />
              <Metric
                label="7-day rain (forecast)"
                value={forecast.length > 0 ? fmt(rainNext7, 1) : '—'}
                unit="mm"
                tone={rainNext7 > 25 ? 'good' : rainNext7 > 0 ? 'warn' : undefined}
              />
              <Metric
                label="Next rain ≥1 mm"
                value={
                  nextRainDay
                    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
                        new Date(`${nextRainDay.date}T00:00:00`),
                      )
                    : 'none in 7d'
                }
              />
              <Metric
                label="Humidity now"
                value={fmt(weather.data?.current?.relativeHumidityPct, 0)}
                unit="%"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <WeatherStamp place={place.name} weather={weather} />
            </div>

            <div className="rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 p-4">
              {crop ? (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">
                      {crop.name}
                      {crop.amharicName ? ` — ${crop.amharicName}` : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                      {plantingNow
                        ? 'This month sits inside a documented planting window for this crop.'
                        : harvestNow
                          ? 'This month sits inside a documented harvest window for this crop.'
                          : 'This month is outside the documented planting and harvest windows — see the crop profile.'}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/crops"
                    className="inline-flex items-center gap-1.5 self-start rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white hover:bg-emerald-500 md:self-auto"
                  >
                    Open Crop Advisory <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Crop reference profiles are being curated with sources. Until a profile exists
                  for this crop, no planting guidance is shown — the platform will not guess.
                </p>
              )}
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.filter((m) => m.href !== '/dashboard').map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-black text-gray-900 dark:text-white">{m.label}</span>
              <ArrowRight
                size={15}
                className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:text-zinc-600"
              />
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-zinc-400">
              {m.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function WeatherStamp({
  place,
  weather,
}: {
  place: string;
  weather: { provenance: ProvenanceView | null; data: WeatherPayload | null };
}) {
  const current = weather.data?.current ?? null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-zinc-400">
      <span className="inline-flex items-center gap-1">
        <Thermometer size={12} /> {place}
      </span>
      {current && (
        <>
          <span className="inline-flex items-center gap-1">
            <CloudRain size={12} /> rain now {fmt(current.precipitationMm, 1)} mm
          </span>
          <span className="inline-flex items-center gap-1">
            <Wind size={12} /> {fmt(current.windSpeedKmh, 0)} km/h
          </span>
          <span className="inline-flex items-center gap-1">
            <Droplets size={12} /> {fmt(current.relativeHumidityPct, 0)}%
          </span>
        </>
      )}
      <ProvenanceLabel provenance={weather.provenance} compact />
    </div>
  );
}
