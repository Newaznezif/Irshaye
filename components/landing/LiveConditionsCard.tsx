'use client';

import { CloudRain, Droplets, MapPin, Thermometer } from 'lucide-react';
import { ProvenanceLabel, type ProvenanceView } from '@/components/data/ProvenanceLabel';
import { Badge, Skeleton } from '@/components/ui';
import { fmt } from '@/components/ui/format';
import { useLiveData } from '@/hooks/useLiveData';
import type { WeatherSeries } from '@/lib/data/types';

/**
 * A real request to a real publisher, rendered on the landing page. It is the
 * product's own claim demonstrated rather than asserted: if the source does not
 * answer, the card says so instead of showing a placeholder.
 */
export function LiveConditionsCard() {
  const weather = useLiveData<WeatherSeries, ProvenanceView>(
    '/api/data/weather?lat=9.0204&lon=38.7468&days=7&pastDays=0&hourly=0',
  );

  const daily = weather.data?.daily ?? [];
  const forecast = daily.filter((d) => d.isForecast);
  const rainNext7 = forecast.reduce((sum, d) => sum + (d.precipitationSumMm ?? 0), 0);
  const current = weather.data?.current ?? null;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 p-5 shadow-[0_30px_70px_-30px_oklch(0.1_0.02_160/85%)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-brand-50/90 uppercase">
          <MapPin size={13} />
          Addis Ababa, right now
        </p>
        <Badge tone="brand" dot className="border border-white/20 bg-white/15 text-white ring-0 dark:text-white">
          live
        </Badge>
      </div>

      {weather.loading && (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-10 w-32 bg-white/20" />
          <Skeleton className="h-4 w-full bg-white/15" />
          <Skeleton className="h-4 w-2/3 bg-white/15" />
        </div>
      )}

      {!weather.loading && weather.data === null && (
        <p className="mt-4 text-[13px] leading-relaxed text-brand-50/90">
          {weather.error?.message ?? 'The weather publisher did not answer.'} No substitute reading is shown.
        </p>
      )}

      {current && (
        <>
          <p className="mt-4 flex items-end gap-2">
            <span className="tabular text-[46px] leading-none font-extrabold tracking-tight text-white">
              {fmt(current.temperatureC, 0)}
            </span>
            <span className="pb-1.5 text-sm font-bold text-brand-100">°C</span>
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-white/12 bg-white/8 px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-brand-100/80 uppercase">
                <Droplets size={11} /> Humidity
              </dt>
              <dd className="tabular mt-1 text-[15px] font-extrabold text-white">
                {fmt(current.relativeHumidityPct, 0)}%
              </dd>
            </div>
            <div className="rounded-xl border border-white/12 bg-white/8 px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-brand-100/80 uppercase">
                <CloudRain size={11} /> Rain, 7-day outlook
              </dt>
              <dd className="tabular mt-1 text-[15px] font-extrabold text-white">
                {forecast.length > 0 ? `${fmt(rainNext7, 1)} mm` : '—'}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center gap-2 border-t border-white/12 pt-3 text-[11px] text-brand-50/80">
            <Thermometer size={12} className="shrink-0" />
            <ProvenanceLabel provenance={weather.provenance} compact onDark />
          </div>
        </>
      )}
    </div>
  );
}
