'use client';

import { useMemo } from 'react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { Panel, Loading, Metric } from '@/components/data/ui';
import { ProvenanceLabel } from '@/components/data/ProvenanceLabel';
import { useLiveData } from '@/hooks/useLiveData';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';
import type { AgroclimateSeries } from '@/lib/data/types';
import { SOIL_GUIDANCE } from '@/lib/soil/guidance';

/**
 * Soil Management shows two clearly separate things: (1) observed climate
 * drivers at the chosen place that make soil practices timely — rain intensity
 * is a real, published measurement; (2) documented conservation guidance.
 * The platform has no soil measurements and says so: satellite vegetation
 * indices are not soil quality, and nothing here diagnoses a field.
 */
export default function SoilView() {
  const { place, setPlace } = useWorkbench();
  const agro = useLiveData<AgroclimateSeries, ProvenanceView>(
    `/api/data/agroclimate?lat=${place.latitude}&lon=${place.longitude}&days=90`,
  );

  const rainDays = useMemo(() => {
    const daily = agro.data?.daily ?? [];
    const heavy = daily.filter((d) => (d.precipitationMm ?? 0) >= 12).length;
    const total = daily.reduce((s, d) => s + (d.precipitationMm ?? 0), 0);
    const withData = daily.filter((d) => d.precipitationMm != null).length;
    return { heavy, total, withData, days: daily.length };
  }, [agro.data]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Soil Management</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">
          Soil conservation and erosion-prevention guidance for Ethiopian farms, paired with the
          observed rainfall that makes each practice timely.
        </p>
      </div>

      <div className="rounded-2xl border border-sky-200/70 bg-sky-50/60 p-4 text-sm leading-relaxed text-sky-900 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-200">
        <p className="font-black">Measured vs modelled — what this module can and cannot tell you.</p>
        <p className="mt-1.5">
          IRSHAYE has <strong>no soil measurements</strong> for your field. Rainfall figures below
          are observations from NASA POWER with their dates attached; the practices are documented
          extension guidance with citations. Nothing here diagnoses soil fertility or acidity —
          that requires local sampling and a laboratory. Satellite vegetation indices describe
          plant cover, not soil quality, and are never presented as soil data.
        </p>
      </div>

      <LocationPicker value={place} onChange={setPlace} label="Your location" />

      <Panel
        title={`Rainfall drivers at ${place.name} — last 90 days`}
        hint="Observed daily precipitation (NASA POWER). Heavy-rain days are the practical trigger for erosion-prevention work."
      >
        {agro.loading && <Loading label="Loading observed rainfall" />}
        {!agro.loading && agro.data === null && (
          <p className="text-sm text-orange-700 dark:text-orange-400">
            The rainfall publisher did not answer ({agro.error?.code ?? 'unreachable'}). No
            substitute values are shown.
          </p>
        )}
        {agro.data !== null && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric
                label="Heavy-rain days (≥12 mm)"
                value={rainDays.withData > 0 ? String(rainDays.heavy) : '—'}
                unit="of days with data"
                tone={rainDays.heavy >= 8 ? 'warn' : undefined}
              />
              <Metric label="Total rainfall in window" value={rainDays.withData > 0 ? rainDays.total.toFixed(0) : '—'} unit="mm" />
              <Metric label="Record coverage" value={`${rainDays.withData}/${rainDays.days}`} unit="days" />
            </div>
            <div className="mt-3">
              <ProvenanceLabel provenance={agro.provenance} compact />
            </div>
          </>
        )}
      </Panel>

      {SOIL_GUIDANCE.length === 0 ? (
        <Panel title="Conservation guidance">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            The curated, source-cited practice library for this module is being assembled now.
            Until each entry carries a citable source, it is not shown — IRSHAYE will not present
            uncited agronomic instructions. The rainfall context above works in the meantime.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {SOIL_GUIDANCE.map((g) => (
            <Panel key={g.id} title={g.title} hint={g.summary}>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-zinc-300">{g.detail}</p>
              {g.watchIndicator && (
                <p className="mt-3 rounded-xl bg-gray-50 p-2.5 text-xs text-gray-600 dark:bg-zinc-800/60 dark:text-zinc-400">
                  <span className="font-black uppercase tracking-wider text-gray-400">When to act · </span>
                  {g.watchIndicator}
                </p>
              )}
              <p className="mt-3 flex flex-wrap gap-x-3 text-[11px] text-gray-500 dark:text-zinc-400">
                {g.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                    {s.title ?? s.name}
                  </a>
                ))}
              </p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
