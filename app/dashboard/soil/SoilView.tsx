'use client';

import { useMemo } from 'react';
import { CloudRain, Layers, Sprout, TriangleAlert } from 'lucide-react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { Badge, Loading, Metric, PageHeader, Panel, SectionLabel, StateNotice } from '@/components/ui';
import { ProvenanceLabel, SourceUnavailable, SourcesList } from '@/components/data/ProvenanceLabel';
import { useLanguage } from '@/hooks/useLanguage';
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
  const { t, rich, locale } = useLanguage();
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
        eyebrow={t('nav.group.Advisory')}
        title={t('module.soil.label')}
        icon={Layers}
        description={t('soil.pageDescription')}
        status={
          agro.data !== null ? (
            <Badge tone="brand" dot>
              {t('soil.badgeRainfallObserved')}
            </Badge>
          ) : (
            <Badge tone="neutral">{t('overview.badgeNoReading')}</Badge>
          )
        }
      />

      <StateNotice tone="info" title={t('soil.measuredTitle')} icon={TriangleAlert}>
        <p>
          {rich('soil.measuredBody').map((part, i) =>
            part.accent ? <strong key={i}>{part.text}</strong> : <span key={i}>{part.text}</span>,
          )}
        </p>
        <p className="mt-2">{t('soil.measuredBodySecond')}</p>
      </StateNotice>

      <LocationPicker value={place} onChange={setPlace} label={t('overview.yourLocation')} />

      <Panel
        title={t('soil.rainfallDriversTitle', { place: place.name })}
        icon={CloudRain}
        hint={t('soil.rainfallDriversHint')}
        footer={agro.data !== null ? <ProvenanceLabel provenance={agro.provenance} compact /> : undefined}
      >
        {agro.loading && <Loading label={t('soil.loadingRainfall')} />}
        {!agro.loading && agro.data === null && (
          <SourceUnavailable error={agro.error ?? { code: 'network', message: 'unreachable' }} source="NASA POWER" />
        )}
        {agro.data !== null && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label={t('soil.heavyRainDays')}
              value={rainDays.withData > 0 ? rainDays.heavy.toLocaleString(locale) : '—'}
              unit={t('soil.ofDaysWithData')}
              tone={rainDays.heavy >= 8 ? 'warn' : undefined}
              note={t('soil.heavyRainNote')}
            />
            <Metric
              label={t('soil.totalRainfall')}
              value={rainDays.withData > 0 ? rainDays.total.toFixed(0) : '—'}
              unit="mm"
              note={t('soil.totalRainfallNote', { count: rainDays.withData })}
            />
            <Metric
              label={t('soil.recordCoverage')}
              value={`${rainDays.withData}/${rainDays.days}`}
              unit="days"
              note={t('soil.recordCoverageNote')}
            />
          </div>
        )}
      </Panel>

      {SOIL_GUIDANCE.length === 0 ? (
        <Panel title={t('soil.guidanceTitle')}>
          <p className="text-[13.5px] leading-relaxed text-ink-muted">{t('soil.guidanceEmpty')}</p>
        </Panel>
      ) : (
        <>
          <SectionLabel>{t('soil.practicesLabel')}</SectionLabel>
          <div className="grid gap-5 md:grid-cols-2">
            {SOIL_GUIDANCE.map((g) => (
              <Panel key={g.id} title={g.title} icon={Sprout} hint={g.summary} className="h-full">
                <p className="text-[13px] leading-relaxed text-ink-muted">{g.detail}</p>
                {g.watchIndicator && (
                  <p className="mt-4 rounded-xl border border-gold/25 bg-gold-soft/50 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-muted">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-300">
                      {t('soil.whenToAct')}
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
