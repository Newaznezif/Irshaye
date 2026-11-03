'use client';

import { BookOpen, CalendarRange, CloudSun, Sprout, TriangleAlert } from 'lucide-react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { CropPicker } from '@/components/CropPicker';
import { Badge, Loading, Metric, PageHeader, Panel, SectionLabel, StateNotice } from '@/components/ui';
import { ProvenanceLabel, SourceUnavailable, SourcesList } from '@/components/data/ProvenanceLabel';
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
import { monthName } from '@/components/ui/format';

/** The header pill stays short: a nowrap badge of a full sentence overflows a phone. */
const OVERALL_LABEL: Record<string, { text: string; tone: 'brand' | 'gold' | 'clay' | 'neutral' }> = {
  supported: { text: 'Fits documented range', tone: 'brand' },
  mixed: { text: 'Partially supported', tone: 'gold' },
  weak: { text: 'Outside documented range', tone: 'clay' },
  'insufficient-data': { text: 'Not enough data', tone: 'neutral' },
};

const VERDICT_TONE: Record<string, 'brand' | 'gold' | 'clay' | 'neutral'> = {
  within: 'brand',
  watch: 'gold',
  outside: 'clay',
  unknown: 'neutral',
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Advisory"
        title="Crop Advisory"
        icon={Sprout}
        description="Crop profiles are curated reference material, each figure cited to its publisher. The suitability check compares that documentation with live climate data and is labelled as modelled guidance — it is not a measurement of your field."
        status={
          crop ? (
            <Badge tone={OVERALL_LABEL[overall].tone}>{OVERALL_LABEL[overall].text}</Badge>
          ) : (
            <Badge tone="neutral">No profile selected</Badge>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <LocationPicker value={place} onChange={setPlace} label="Your location" />
        <CropPicker value={cropId} onChange={setCropId} />
      </div>

      {!crop && CROP_PROFILES.length === 0 && (
        <Panel title="Crop reference profiles">
          <p className="text-[13.5px] leading-relaxed text-ink-muted">
            Curated, source-cited crop profiles for the covered Ethiopian crops are being assembled. Until a
            profile exists, this module shows no guidance — IRSHAYE does not present uncited agronomic figures.
            Climate and market modules work fully in the meantime.
          </p>
        </Panel>
      )}

      {crop && (
        <>
          <Panel
            title="Live comparison"
            icon={CloudSun}
            hint={`Documented requirements for ${crop.name} compared with live readings for ${place.name}. Every verdict names the input it used.`}
            footer={
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <ProvenanceLabel provenance={weather.provenance} compact context="forecast inputs" />
                <ProvenanceLabel provenance={agro.provenance} compact context="observed record" />
              </div>
            }
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-[22px] leading-tight font-extrabold tracking-[-0.02em] text-ink">{crop.name}</h3>
              {crop.amharicName && (
                <span lang="am" className="ethiopic text-[16px] font-bold text-brand-700 dark:text-brand-300">
                  — {crop.amharicName}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-ink-muted">{crop.summary}</p>

            {(weather.loading || agro.loading) && (
              <Loading label="Loading live climate for the comparison" className="mt-5" />
            )}
            {!weather.loading && weather.data === null && (
              <div className="mt-5">
                <SourceUnavailable
                  error={weather.error ?? { code: 'network', message: 'unreachable' }}
                  source="Open-Meteo"
                />
              </div>
            )}

            <ul className="mt-6 space-y-3">
              {points.map((p) => (
                <li
                  key={p.aspect}
                  className="flex flex-col gap-2 rounded-xl border border-line bg-canvas/60 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <SectionLabel>{p.aspect}</SectionLabel>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{p.detail}</p>
                  </div>
                  <Badge tone={VERDICT_TONE[p.verdict] ?? 'neutral'} className="shrink-0">
                    {p.verdict === 'unknown' ? 'no data' : p.verdict}
                  </Badge>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Panel
              title="Documented requirements"
              icon={BookOpen}
              hint="Reference values with citations — curated and literature-based, not live readings of your field."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric
                  label="Seasonal rain need"
                  value={
                    crop.rainfall.mmMin !== null && crop.rainfall.mmMax !== null
                      ? `${crop.rainfall.mmMin}–${crop.rainfall.mmMax}`
                      : '—'
                  }
                  unit="mm"
                  note="Documented total across the cycle."
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
                <Metric
                  label="Soil preference"
                  value={crop.soil.drainage || '—'}
                  note="Documented drainage preference, not a soil test."
                />
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <SectionLabel>Planting & harvest windows</SectionLabel>
                <div className="mt-3 grid gap-x-6 gap-y-2 text-[13px] text-ink-muted md:grid-cols-2">
                  <div className="space-y-1.5">
                    {crop.plantingWindows.length === 0 ? (
                      <p className="text-[12px] leading-relaxed text-ink-faint italic">
                        No citable planting-month calendar was found for this crop — shown as a gap, not filled in.
                      </p>
                    ) : (
                      crop.plantingWindows.map((w) => (
                        <p key={`p-${w.season}-${w.startMonth}`} className="flex items-baseline gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
                            Plant
                          </span>
                          <span className="font-semibold text-ink">
                            {monthName(w.startMonth)}–{monthName(w.endMonth)}
                          </span>
                          <span className="text-ink-faint">({w.season})</span>
                        </p>
                      ))
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {crop.harvestWindows.length === 0 ? (
                      <p className="text-[12px] leading-relaxed text-ink-faint italic">
                        No citable harvest-month calendar was found for this crop.
                      </p>
                    ) : (
                      crop.harvestWindows.map((w) => (
                        <p key={`h-${w.season}-${w.startMonth}`} className="flex items-baseline gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold-700 dark:text-gold-300">
                            Harvest
                          </span>
                          <span className="font-semibold text-ink">
                            {monthName(w.startMonth)}–{monthName(w.endMonth)}
                          </span>
                          <span className="text-ink-faint">({w.season})</span>
                        </p>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-5 border-t border-line pt-5">
                <div>
                  <SectionLabel>Temperature requirement note</SectionLabel>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{crop.temperature.notes}</p>
                </div>
                <div>
                  <SectionLabel>Soil preference — documented, not measured</SectionLabel>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
                    {crop.soil.notes}
                    {crop.soil.phMin !== null && crop.soil.phMax !== null
                      ? ` Documented pH ${crop.soil.phMin}–${crop.soil.phMax}.`
                      : ' No citable pH range was found.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-line pt-3.5">
                <SourcesList className="mt-2.5" sources={crop.sources.map((s) => ({ name: s.name, url: s.url, title: s.title }))} />
              </div>
            </Panel>

            <div className="space-y-5">
              {crop.practices.length > 0 && (
                <Panel
                  title="Documented practices"
                  icon={CalendarRange}
                  hint="Management practices named in the cited sources for this crop."
                >
                  <ul className="space-y-3">
                    {crop.practices.map((p) => (
                      <li key={p.practice} className="rounded-xl border border-line bg-canvas/60 p-4">
                        <p className="text-[13.5px] font-extrabold tracking-tight text-ink">{p.practice}</p>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{p.detail}</p>
                        <SourcesList className="mt-2.5" sources={p.sources.map((s) => ({ name: s.name, url: s.url }))} />
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}

              {crop.risks.length > 0 && (
                <Panel
                  title="Climate risks on record"
                  icon={TriangleAlert}
                  hint="Hazard descriptions from the cited literature, with the platform indicator that watches for them."
                >
                  <ul className="space-y-3">
                    {crop.risks.map((r) => (
                      <li key={r.risk} className="rounded-xl border border-gold/25 bg-gold-soft/50 p-4">
                        <p className="text-[13.5px] font-extrabold tracking-tight text-ink">{r.risk}</p>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                          <span className="font-bold text-ink">When:</span> {r.when}
                          <br />
                          <span className="font-bold text-ink">Platform watch:</span> {r.indicator}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}

              <Panel title="Ethiopian seasonal calendar" hint="Definitions of the seasons the windows above refer to.">
                <ul className="space-y-3">
                  {SEASON_CALENDAR.map((s) => (
                    <li key={s.id} className="rounded-xl border border-line bg-canvas/60 p-4">
                      <p className="text-[13.5px] font-extrabold tracking-tight text-ink">{s.title}</p>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{s.detail}</p>
                      <SourcesList className="mt-2.5" sources={s.sources.map((x) => ({ name: x.name, url: x.url, title: x.title }))} />
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>

          <StateNotice tone="clay" title="Limits of this reference layer" icon={TriangleAlert}>
            <ul className="mt-1 space-y-1.5 text-[12.5px] leading-relaxed">
              {CATALOG_LIMITATIONS.map((l) => (
                <li key={l}>· {l}</li>
              ))}
            </ul>
          </StateNotice>
        </>
      )}
    </div>
  );
}
