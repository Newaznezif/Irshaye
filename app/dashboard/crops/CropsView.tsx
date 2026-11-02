'use client';

import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { CropPicker } from '@/components/CropPicker';
import { Panel, Loading, Metric } from '@/components/data/ui';
import { ProvenanceLabel, SourceUnavailable } from '@/components/data/ProvenanceLabel';
import { useLiveData } from '@/hooks/useLiveData';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';
import type { AgroclimateSeries, WeatherSeries } from '@/lib/data/types';
import { CATALOG_LIMITATIONS, CROP_PROFILES, SEASON_CALENDAR, getCrop } from '@/lib/crops/catalog';
import type { CropProfile } from '@/lib/crops/types';
import {
  assessRainfall,
  assessSeason,
  assessTemperature,
  overallOf,
  type SuitabilityPoint,
} from '@/lib/crops/suitability';

const OVERALL_LABEL: Record<string, { text: string; cls: string }> = {
  supported: { text: 'Conditions currently fit the documented range', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  mixed: { text: 'Partially supported — watch the flagged factors', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  weak: { text: 'Current readings sit outside the documented range', cls: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  'insufficient-data': { text: 'Not enough data to compare honestly', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
};

function computePoints(
  crop: CropProfile,
  weather: WeatherSeries | null,
  agro: AgroclimateSeries | null,
): SuitabilityPoint[] {
  const month = new Date().getMonth() + 1;
  const daily = weather?.daily ?? [];
  const forecast = daily.filter((d) => d.isForecast);
  const rain7 = forecast.length > 0 ? forecast.reduce((s, d) => s + (d.precipitationSumMm ?? 0), 0) : null;
  const recentObserved = agro ? agro.daily.reduce((s, d) => s + (d.precipitationMm ?? 0), 0) : null;
  const lastObs = [...daily].reverse().find((d) => !d.isForecast);
  const tMaxLive = weather?.current?.temperatureC ?? lastObs?.temperatureMaxC ?? null;
  const tMinLive = lastObs?.temperatureMinC ?? null;
  return [
    assessSeason(crop, month),
    assessRainfall(crop, recentObserved, rain7),
    assessTemperature(crop, tMaxLive, tMinLive),
    {
      aspect: 'altitude',
      verdict: 'unknown',
      detail: crop.altitudeBands.length
        ? `Documented agroecologies: ${crop.altitudeBands.join(', ')}. This platform cannot measure your field's altitude from open data, so treat elevation as your own judgement.`
        : 'No documented altitude band was found for this crop.',
    },
  ];
}

export default function CropsPageClient() {
  const { place, setPlace, cropId, setCropId } = useWorkbench();
  const crop = getCrop(cropId);
  const params = `lat=${place.latitude}&lon=${place.longitude}`;

  const weather = useLiveData<WeatherSeries, ProvenanceView>(
    `/api/data/weather?${params}&days=7&pastDays=0&hourly=0`,
  );
  const agro = useLiveData<AgroclimateSeries, ProvenanceView, { annualNormalMmPerDay?: number | null }>(
    `/api/data/agroclimate?${params}&days=30`,
  );

  const points = crop ? computePoints(crop, weather.data, agro.data) : [];

  const overall = crop ? overallOf(points) : 'insufficient-data';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Crop Advisory</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">
          Crop profiles are curated reference material, each figure cited to its publisher. The
          suitability check compares that documentation with live climate data and is labelled as
          modelled guidance — it is not a measurement of your field.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LocationPicker value={place} onChange={setPlace} label="Your location" />
        <CropPicker value={cropId} onChange={setCropId} />
      </div>

      {!crop && CROP_PROFILES.length === 0 && (
        <Panel title="Crop reference profiles">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Curated, source-cited crop profiles for the covered Ethiopian crops are being assembled.
            Until a profile exists, this module shows no guidance — IRSHAYE does not present
            uncited agronomic figures. Climate and market modules work fully in the meantime.
          </p>
        </Panel>
      )}

      {crop && (
        <>
          <Panel title={`${crop.name}${crop.amharicName ? ` — ${crop.amharicName}` : ''}`} hint={crop.summary}>
            <div className="mb-4">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${OVERALL_LABEL[overall].cls}`}>
                {OVERALL_LABEL[overall].text}
              </span>
            </div>
            {(weather.loading || agro.loading) && <Loading label="Loading live climate for the comparison" />}
            {!weather.loading && weather.data === null && (
              <SourceUnavailable error={weather.error ?? { code: 'network', message: 'unreachable' }} source="Open-Meteo" />
            )}
            <ul className="space-y-2.5">
              {points.map((p) => (
                <li key={p.aspect} className="rounded-xl border border-gray-100 p-3 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">{p.aspect}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                        p.verdict === 'within'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : p.verdict === 'watch'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : p.verdict === 'outside'
                              ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {p.verdict === 'unknown' ? 'no data' : p.verdict}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-gray-700 dark:text-zinc-300">{p.detail}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              <ProvenanceLabel provenance={weather.provenance} compact context="forecast inputs" />
              <ProvenanceLabel provenance={agro.provenance} compact context="observed record" />
            </div>
          </Panel>

          <Panel title="Documented requirements" hint="Reference values with citations — modelled/curated, not live readings.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Seasonal rain need"
                value={
                  crop.rainfall.mmMin !== null && crop.rainfall.mmMax !== null
                    ? `${crop.rainfall.mmMin}–${crop.rainfall.mmMax}`
                    : '—'
                }
                unit="mm"
              />
              <Metric
                label="Temperature range"
                value={
                  crop.temperature.minC !== null && crop.temperature.maxC !== null
                    ? crop.temperature.minC === crop.temperature.maxC
                      ? `${crop.temperature.minC} (single point)`
                      : `${crop.temperature.minC}–${crop.temperature.maxC}`
                    : '—'
                }
                unit={crop.temperature.minC === crop.temperature.maxC ? '' : '°C'}
              />
              <Metric label="Rain season dependence" value={crop.rainfall.seasonDependence || '—'} />
              <Metric label="Soil preference (documented)" value={crop.soil.drainage || '—'} />
            </div>

            <h3 className="mt-5 text-xs font-black uppercase tracking-widest text-gray-400">
              Planting & harvest windows
            </h3>
            <div className="mt-2 grid gap-2 text-sm text-gray-700 dark:text-zinc-300 md:grid-cols-2">
              <div>
                {crop.plantingWindows.length === 0 ? (
                  <p className="text-xs italic text-gray-500 dark:text-zinc-400">
                    No citable planting-month calendar was found for this crop — shown as a gap, not filled in.
                  </p>
                ) : (
                  crop.plantingWindows.map((w) => (
                    <p key={`p-${w.season}-${w.startMonth}`}>
                      Plant: {monthName(w.startMonth)}–{monthName(w.endMonth)} ({w.season})
                    </p>
                  ))
                )}
              </div>
              <div>
                {crop.harvestWindows.length === 0 ? (
                  <p className="text-xs italic text-gray-500 dark:text-zinc-400">
                    No citable harvest-month calendar was found for this crop.
                  </p>
                ) : (
                  crop.harvestWindows.map((w) => (
                    <p key={`h-${w.season}-${w.startMonth}`}>
                      Harvest: {monthName(w.startMonth)}–{monthName(w.endMonth)} ({w.season})
                    </p>
                  ))
                )}
              </div>
            </div>

            <h3 className="mt-5 text-xs font-black uppercase tracking-widest text-gray-400">
              Temperature requirement note
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-zinc-400">
              {crop.temperature.notes}
            </p>

            <h3 className="mt-4 text-xs font-black uppercase tracking-widest text-gray-400">
              Soil preference (documented, not measured)
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-zinc-400">
              {crop.soil.notes}
              {crop.soil.phMin !== null && crop.soil.phMax !== null
                ? ` Documented pH ${crop.soil.phMin}–${crop.soil.phMax}.`
                : ' No citable pH range was found.'}
            </p>

            {crop.practices.length > 0 && (
              <>
                <h3 className="mt-5 text-xs font-black uppercase tracking-widest text-gray-400">
                  Documented practices
                </h3>
                <ul className="mt-2 space-y-2">
                  {crop.practices.map((p) => (
                    <li key={p.practice} className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/60">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{p.practice}</p>
                      <p className="mt-0.5 text-xs text-gray-600 dark:text-zinc-400">{p.detail}</p>
                      <SourcesList sources={p.sources.map((s) => ({ name: s.name, url: s.url }))} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {crop.risks.length > 0 && (
              <>
                <h3 className="mt-5 text-xs font-black uppercase tracking-widest text-gray-400">
                  Climate risks on record
                </h3>
                <ul className="mt-2 space-y-2">
                  {crop.risks.map((r) => (
                    <li key={r.risk} className="rounded-xl border border-amber-200/70 p-3 dark:border-amber-900/40">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{r.risk}</p>
                      <p className="mt-0.5 text-xs text-gray-600 dark:text-zinc-400">
                        {r.when} — platform watch: {r.indicator}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-5">
              <SourcesList sources={crop.sources.map((s) => ({ name: s.name, url: s.url, title: s.title }))} />
            </div>
          </Panel>

          <Panel title="Ethiopian seasonal calendar" hint="Definitions of the seasons the windows above refer to.">
            <ul className="space-y-3">
              {SEASON_CALENDAR.map((s) => (
                <li key={s.id} className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/60">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{s.title}</p>
                  <p className="mt-0.5 text-xs text-gray-600 dark:text-zinc-400">{s.detail}</p>
                  <SourcesList sources={s.sources.map((x) => ({ name: x.name, url: x.url, title: x.title }))} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Limits of this reference layer"
            hint="Stated plainly, because a decision-support tool that hides its own gaps is worse than none."
          >
            <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-gray-600 dark:text-zinc-400">
              {CATALOG_LIMITATIONS.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}

function monthName(m: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] ?? String(m);
}

function SourcesList({ sources }: { sources: { name: string; url?: string; title?: string }[] }) {
  if (sources.length === 0) return null;
  return (
    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 dark:text-zinc-400">
      {sources.map((s, i) => (
        <span key={i}>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
              {s.title ?? s.name}
            </a>
          ) : (
            s.name
          )}
        </span>
      ))}
    </p>
  );
}
