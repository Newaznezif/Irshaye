'use client';

import { useMemo } from 'react';
import { CloudRain, Layers, Sprout, TriangleAlert } from 'lucide-react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { Badge, Loading, Metric, PageHeader, Panel, SectionLabel, StateNotice } from '@/components/ui';
import { ProvenanceLabel, SourceUnavailable, SourcesList } from '@/components/data/ProvenanceLabel';
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Advisory"
        title="Soil Management"
        icon={Layers}
        description="Soil conservation and erosion-prevention guidance for Ethiopian farms, paired with the observed rainfall that makes each practice timely."
        status={agro.data !== null ? <Badge tone="brand" dot>Rainfall observed</Badge> : <Badge tone="neutral">No live reading</Badge>}
      />

      <StateNotice tone="info" title="Measured vs modelled — what this module can and cannot tell you" icon={TriangleAlert}>
        <p>
          IRSHAYE has <strong>no soil measurements</strong> for your field. Rainfall figures below are
          observations from NASA POWER with their dates attached; the practices are documented extension
          guidance with citations. Nothing here diagnoses soil fertility or acidity — that requires local
          sampling and a laboratory.
        </p>
        <p className="mt-2">
          Satellite vegetation indices describe plant cover, not soil quality, and are never presented as
          soil data.
        </p>
      </StateNotice>

      <LocationPicker value={place} onChange={setPlace} label="Your location" />

      <Panel
        title={`Rainfall drivers at ${place.name} — last 90 days`}
        icon={CloudRain}
        hint="Observed daily precipitation (NASA POWER). Heavy-rain days are the practical trigger for erosion-prevention work."
        footer={agro.data !== null ? <ProvenanceLabel provenance={agro.provenance} compact /> : undefined}
      >
        {agro.loading && <Loading label="Loading observed rainfall" />}
        {!agro.loading && agro.data === null && (
          <SourceUnavailable error={agro.error ?? { code: 'network', message: 'unreachable' }} source="NASA POWER" />
        )}
        {agro.data !== null && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Heavy-rain days (≥12 mm)"
              value={rainDays.withData > 0 ? String(rainDays.heavy) : '—'}
              unit="of days with data"
              tone={rainDays.heavy >= 8 ? 'warn' : undefined}
              note="Threshold used to flag runoff risk; not a soil measurement."
            />
            <Metric
              label="Total rainfall in window"
              value={rainDays.withData > 0 ? rainDays.total.toFixed(0) : '—'}
              unit="mm"
              note={`Sum over ${rainDays.withData} days the publisher returned.`}
            />
            <Metric
              label="Record coverage"
              value={`${rainDays.withData}/${rainDays.days}`}
              unit="days"
              note="Days with a published value over days requested."
            />
          </div>
        )}
      </Panel>

      {SOIL_GUIDANCE.length === 0 ? (
        <Panel title="Conservation guidance">
          <p className="text-[13.5px] leading-relaxed text-ink-muted">
            The curated, source-cited practice library for this module is being assembled now. Until each
            entry carries a citable source, it is not shown — IRSHAYE will not present uncited agronomic
            instructions. The rainfall context above works in the meantime.
          </p>
        </Panel>
      ) : (
        <>
          <SectionLabel>Documented conservation practices</SectionLabel>
          <div className="grid gap-5 md:grid-cols-2">
            {SOIL_GUIDANCE.map((g) => (
              <Panel
                key={g.id}
                title={g.title}
                icon={Sprout}
                hint={g.summary}
                className="h-full"
              >
                <p className="text-[13px] leading-relaxed text-ink-muted">{g.detail}</p>
                {g.watchIndicator && (
                  <p className="mt-4 rounded-xl border border-gold/25 bg-gold-soft/50 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-muted">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-300">
                      When to act
                    </span>
                    <br />
                    {g.watchIndicator}
                  </p>
                )}
                <SourcesList className="mt-4 border-t border-line pt-3" sources={g.sources} />
              </Panel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
