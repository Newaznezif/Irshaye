'use client';
import React from 'react';
import { ArrowRight, Coins, MapPin, Store, Table, TrendingUp } from 'lucide-react';

import { ProvenanceLabel, type ProvenanceView } from '@/components/data/ProvenanceLabel';
import { Badge, Button, Metric, Panel, SectionLabel, StatCard, StateNotice, dayLabel, fmtInt, monthLabel } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { ContributingSources, FreshnessBadge } from './parts';
import type { CatalogCommodityView, MarketCatalogView, MarketSourceReport, MarketSummaryView } from './types';

/**
 * The overview answers §5A: what market data actually exists, at what depth, and how old it
 * is. Every figure here is a count of published rows — no average, no index and no commodity
 * appears that a survey did not record. A commodity the brief asks for that no publisher
 * surveyed is simply absent, and the panel says so rather than filling the row.
 */

interface Props {
  summary: MarketSummaryView;
  catalog: MarketCatalogView;
  reports: MarketSourceReport[];
  provenance: ProvenanceView | null;
  refreshing: boolean;
  onOpen: (tab: 'prices' | 'history' | 'regions' | 'insights' | 'sources') => void;
}

const byDepth = (a: CatalogCommodityView, b: CatalogCommodityView): number =>
  b.markets - a.markets || b.observations - a.observations || a.name.localeCompare(b.name);

export const MarketOverview = ({ summary, catalog, reports, provenance, refreshing, onOpen }: Props) => {
  const { t, locale } = useLanguage();
  const covered = [...catalog.commodities].sort(byDepth);
  const deepest = covered.slice(0, 10);
  const spanFrom = summary.earliestObservation;
  const spanTo = summary.latestObservation;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Table}
          label={t('markets.ov.observations')}
          value={fmtInt(summary.rowsWithPrice, locale)}
          supporting={t('markets.ov.observationsNote', {
            rows: fmtInt(summary.rowsWithoutPrice, locale),
          })}
        />
        <StatCard
          icon={Store}
          label={t('markets.ov.commodities')}
          value={fmtInt(summary.commoditiesWithData, locale)}
          supporting={t('markets.ov.commoditiesNote', { units: summary.units.length })}
        />
        <StatCard
          icon={MapPin}
          label={t('markets.ov.markets')}
          value={fmtInt(summary.marketsMonitored, locale)}
          supporting={t('markets.ov.marketsNote', {
            regions: summary.regionsMonitored,
            mapped: summary.marketsWithCoordinates,
          })}
        />
        <StatCard
          icon={TrendingUp}
          label={t('markets.ov.periods')}
          value={fmtInt(summary.surveyDates, locale)}
          tone="gold"
          supporting={t('markets.ov.periodsNote', { months: summary.surveyMonths })}
        />
      </div>

      <Panel
        title={t('markets.ov.coverageTitle')}
        hint={t('markets.ov.coverageHint')}
        right={
          <div className="flex items-center gap-2">
            <FreshnessBadge tier={summary.freshness} />
            {refreshing && <Badge tone="neutral">{t('common.updating')}</Badge>}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label={t('markets.ov.newest')}
            value={spanTo ? dayLabel(spanTo, locale) : '—'}
            note={t('markets.ov.newestNote', { tier: t(`freshness.${summary.freshness}`) })}
          />
          <Metric
            label={t('markets.ov.oldest')}
            value={spanFrom ? dayLabel(spanFrom, locale) : '—'}
            note={spanFrom && spanTo ? t('markets.ov.span', { from: monthLabel(spanFrom, locale), to: monthLabel(spanTo, locale) }) : t('markets.noSpan')}
          />
          <Metric
            label={t('markets.ov.publishers')}
            value={fmtInt(reports.filter((r) => r.rows > 0).length, locale)}
            unit={t('markets.ofCount', { total: reports.length })}
            note={t('markets.ov.publishersNote')}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <SectionLabel>{t('markets.ov.currencies')}</SectionLabel>
            <p className="mt-2 font-mono text-[12.5px] font-bold text-ink">{summary.currencies.join(' · ') || '—'}</p>
          </div>
          <div>
            <SectionLabel>{t('markets.ov.units')}</SectionLabel>
            <p className="mt-2 text-[12.5px] font-semibold text-ink">{summary.units.join(' · ') || '—'}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">{t('markets.ov.unitsNote')}</p>
          </div>
          <div>
            <SectionLabel>{t('markets.ov.priceTypes')}</SectionLabel>
            <p className="mt-2 text-[12.5px] font-semibold text-ink">{summary.priceTypes.join(' · ') || '—'}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">{t('markets.ov.granularities', {
              list: summary.supportedGranularity.map((g) => t(`markets.granularity.${g}`)).join(' · '),
            })}</p>
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <ProvenanceLabel provenance={provenance} />
          <ContributingSources reports={reports} />
        </div>
      </Panel>

      <Panel
        title={t('markets.ov.catalogTitle')}
        icon={Coins}
        hint={t('markets.ov.catalogHint')}
        right={
          <Button variant="secondary" size="sm" onClick={() => onOpen('prices')} trailing={<ArrowRight size={14} />}>
            {t('markets.tab.prices')}
          </Button>
        }
        flush
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-[12.5px]">
            <thead className="bg-canvas">
              <tr className="border-b border-line text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                <th scope="col" className="px-5 py-2.5 font-bold md:px-6">{t('markets.commodity')}</th>
                <th scope="col" className="px-4 py-2.5 font-bold">{t('common.unit')}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.col.markets')}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.col.periods')}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.col.rows')}</th>
                <th scope="col" className="px-5 py-2.5 text-right font-bold md:px-6">{t('common.newestObservation')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {deepest.map((c) => (
                <tr key={`${c.name}|${c.units.join('+')}`} className="transition-colors hover:bg-canvas/70">
                  <td className="px-5 py-2.5 font-bold text-ink md:px-6">{c.name}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-ink-muted">{c.units.join(' / ')}</td>
                  <td className="tabular px-4 py-2.5 text-right text-ink">{fmtInt(c.markets, locale)}</td>
                  <td className="tabular px-4 py-2.5 text-right text-ink-muted">{fmtInt(c.months, locale)}</td>
                  <td className="tabular px-4 py-2.5 text-right text-ink-muted">{fmtInt(c.observations, locale)}</td>
                  <td className="tabular px-5 py-2.5 text-right whitespace-nowrap text-ink-muted md:px-6">
                    {dayLabel(c.latestObservedOn, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {covered.length > deepest.length && (
          <p className="border-t border-line px-5 py-3 text-[11.5px] leading-relaxed text-ink-faint md:px-6">
            {t('markets.ov.catalogTruncated', { shown: deepest.length, total: covered.length })}
          </p>
        )}
      </Panel>

      <Panel title={t('markets.ov.qualityTitle')} hint={t('markets.ov.qualityHint')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label={t('markets.ov.gaps')}
            value={fmtInt(summary.rowsWithoutPrice, locale)}
            note={t('markets.ov.gapsNote')}
          />
          <Metric
            label={t('markets.ov.duplicates')}
            value={fmtInt(summary.duplicateRows, locale)}
            note={t('markets.ov.duplicatesNote')}
          />
          <Metric
            label={t('markets.ov.unmapped')}
            value={fmtInt(summary.marketsMonitored - summary.marketsWithCoordinates, locale)}
            note={t('markets.ov.unmappedNote', { mapped: summary.marketsWithCoordinates })}
          />
          <Metric
            label={t('markets.ov.seasonal')}
            value={fmtInt(summary.seasonalSeries, locale)}
            note={t('markets.ov.seasonalNote')}
          />
        </div>
        <StateNotice tone="info" title={t('markets.ov.limitTitle')} className="mt-4">
          {t('markets.ov.limitBody')}
        </StateNotice>
      </Panel>
    </div>
  );
};
