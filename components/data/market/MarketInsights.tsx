'use client';
import React from 'react';
import { Lightbulb } from 'lucide-react';

import { ProvenanceLabel, SourceUnavailable, type ProvenanceView } from '@/components/data/ProvenanceLabel';
import { Badge, Panel, Refreshing, SectionLabel, StateNotice, dayLabel, fmt, fmtInt, monthLabel } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { useLiveData } from '@/hooks/useLiveData';
import { ContributingSources } from './parts';
import type { InsightKind, InsightsBundleView, MarketInsightView, MarketSourcesExtra } from './types';

/**
 * What the observations support saying (§5E).
 *
 * Each finding is a fact with its evidence attached: the commodity, unit and price type it
 * was computed on, the markets involved, how many published rows stand behind it, and the
 * period. The limitation line is not decoration — a spread between two markets is a fact
 * about transport, season and local supply at the same time, so the panel says the gap and
 * stops there instead of naming a cause. Nothing here predicts a price.
 *
 * The wording lives in the locale files, so all five languages carry the same confidence
 * level rather than five different ones.
 */

interface Props {
  provenance: ProvenanceView | null;
}

const KIND_TONE: Record<InsightKind, 'clay' | 'brand' | 'gold' | 'info' | 'neutral'> = {
  'price-rise': 'clay',
  'price-fall': 'brand',
  'market-spread': 'gold',
  'seasonal-coverage': 'info',
  'market-outdated': 'neutral',
  'thin-coverage': 'neutral',
};

export const MarketInsights = ({ provenance }: Props) => {
  const { t, locale } = useLanguage();
  const { data, extra, loading, refreshing, error } = useLiveData<InsightsBundleView, ProvenanceView, MarketSourcesExtra>(
    '/api/data/markets?mode=insights&limit=8',
  );
  const reports = extra?.sources ?? [];
  const insights = data?.insights ?? [];

  return (
    <Panel
      title={t('markets.ins.title')}
      icon={Lightbulb}
      hint={t('markets.ins.hint')}
      right={refreshing ? <Refreshing /> : undefined}
    >
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      )}
      {!loading && error && <SourceUnavailable error={error} source={t('markets.ex.sourceLabel')} />}

      {!loading && !error && data && insights.length === 0 && (
        <StateNotice tone="info" title={t('markets.ins.noneTitle')}>
          {t('markets.ins.noneBody')}
        </StateNotice>
      )}

      {insights.length > 0 && (
        <ul className="space-y-3">
          {insights.map((insight, index) => (
            <InsightCard key={`${insight.kind}-${index}`} insight={insight} />
          ))}
        </ul>
      )}

      {data && data.seasonal.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <SectionLabel>{t('markets.ins.seasonalTitle')}</SectionLabel>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">{t('markets.ins.seasonalHint')}</p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[520px] text-[12.5px]">
              <thead className="bg-canvas">
                <tr className="border-b border-line text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                  <th scope="col" className="px-4 py-2.5 font-bold">{t('markets.commodity')}</th>
                  <th scope="col" className="px-4 py-2.5 font-bold">{t('common.unit')}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.col.months')}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.col.markets')}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.ins.wetVsDry')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.seasonal.slice(0, 10).map((s) => (
                  <tr key={`${s.commodity}|${s.unit}|${s.retail}`} className="transition-colors hover:bg-canvas/70">
                    <td className="px-4 py-2.5 font-bold text-ink">{s.commodity}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{s.unit}</td>
                    <td className="tabular px-4 py-2.5 text-right text-ink">{fmtInt(s.months, locale)}</td>
                    <td className="tabular px-4 py-2.5 text-right text-ink-muted">{fmtInt(s.markets, locale)}</td>
                    <td className="tabular px-4 py-2.5 text-right text-ink-muted">
                      {s.wetVsDryPct === null ? '—' : `${s.wetVsDryPct > 0 ? '+' : '−'}${fmt(Math.abs(s.wetVsDryPct), 1, locale)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">{t('markets.ins.seasonalLimitation')}</p>
        </div>
      )}

      <div className="mt-5 space-y-2 border-t border-line pt-3.5">
        <ProvenanceLabel provenance={provenance} />
        <ContributingSources reports={reports} />
      </div>
    </Panel>
  );
};

const InsightCard = ({ insight }: { insight: MarketInsightView }) => {
  const { t, locale } = useLanguage();
  const p = insight.params;
  const month = (value: string | number | undefined) => monthLabel(String(value ?? ''), locale);
  const day = (value: string | number | undefined) => (String(value ?? '').length === 10 ? dayLabel(String(value), locale) : '—');
  const pct = (value: string | number | undefined) => fmt(Number(value), 1, locale);

  const vars: Record<string, string | number> = { ...p };
  if (insight.kind === 'price-rise' || insight.kind === 'price-fall') {
    vars.pct = pct(p.pct);
    vars.from = month(p.from);
    vars.to = month(p.to);
    vars.price = `${fmt(Number(p.price), 0, locale)} ${String(p.currency)}`;
  }
  if (insight.kind === 'market-spread') {
    vars.pct = pct(p.pct);
    vars.month = month(p.month);
    vars.markets = fmtInt(Number(p.markets), locale);
  }
  if (insight.kind === 'seasonal-coverage') {
    vars.months = fmtInt(Number(p.months), locale);
    vars.markets = fmtInt(Number(p.markets), locale);
    vars.series = fmtInt(Number(p.series), locale);
  }
  if (insight.kind === 'market-outdated') {
    vars.months = fmtInt(Number(p.months), locale);
    vars.lastMonth = month(p.lastMonth);
    vars.latestMonth = month(p.latestMonth);
  }

  const tone = KIND_TONE[insight.kind] ?? 'neutral';
  const badgeTone = tone === 'neutral' ? ('outline' as const) : tone;

  return (
    <li className="rounded-xl border border-line bg-canvas/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <Badge tone={badgeTone}>{t(`markets.ins.kind.${insight.kind}`)}</Badge>
        {(insight.period.from || insight.period.to) && (
          <span className="tabular text-[11px] text-ink-faint">
            {day(insight.period.from)} – {day(insight.period.to)}
          </span>
        )}
      </div>
      <p className="mt-2.5 text-[13.5px] leading-relaxed font-semibold text-ink">{t(`markets.ins.${insight.kind}`, vars)}</p>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[11.5px] sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold uppercase tracking-[0.1em] text-ink-faint">{t('markets.ins.evidenceSeries')}</dt>
          <dd className="text-ink-muted">
            {insight.evidence.commodity} · {insight.evidence.unit} · {insight.evidence.retail}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold uppercase tracking-[0.1em] text-ink-faint">{t('markets.ins.evidenceRows')}</dt>
          <dd className="tabular text-ink-muted">{fmtInt(insight.evidence.observations, locale)}</dd>
        </div>
        {insight.evidence.markets.length > 0 && (
          <div className="flex gap-2 sm:col-span-2">
            <dt className="shrink-0 font-bold uppercase tracking-[0.1em] text-ink-faint">{t('markets.thMarket')}</dt>
            <dd className="text-ink-muted">{insight.evidence.markets.slice(0, 8).join(', ')}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold uppercase tracking-[0.1em] text-ink-faint">{t('common.source')}</dt>
          <dd className="text-ink-muted">{insight.evidence.sourceName}</dd>
        </div>
      </dl>
      <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] leading-relaxed text-ink-faint">
        <span className="font-bold uppercase tracking-[0.1em]">{t('markets.ins.limitLabel')} </span>
        {t(insight.limitationKey)}
      </p>
    </li>
  );
};
