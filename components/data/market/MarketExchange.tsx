'use client';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Coins } from 'lucide-react';

import {
  ProvenanceLabel,
  SourceUnavailable,
  type ProvenanceView,
  type SourceErrorView,
} from '@/components/data/ProvenanceLabel';
import { Loading, Panel, Refreshing, SectionLabel, StateNotice, dayLabel, fmt, monthLabel } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { useChartTheme } from '@/hooks/useChartTheme';
import { useLiveData } from '@/hooks/useLiveData';
import { SERIES_COLORS, tooltipContentStyle } from '@/lib/ui/chart';

/**
 * The exchange panel the module already had, kept as its own view.
 *
 * It stays three separate categories on purpose: a central-bank reference rate, a monthly
 * parallel-market average and an annual World Bank indicator are three different kinds of
 * number, and merging them into one "ETB per US$" figure would be a fabrication. A category
 * that returns no rows shows that publisher's own failure, never a substituted value.
 */

interface ExchangePayload {
  official: { observedOn: string; usdToEtb: number | null }[] | null;
  unofficial: { observedOn: string; unofficialUsdToEtb: number }[] | null;
  benchmarks: {
    code: string;
    name: string;
    frequency: string;
    unit: string;
    observations: { period: string; value: number | null }[];
  }[] | null;
}

interface ExchangeProvenances {
  official: ProvenanceView | null;
  unofficial: ProvenanceView | null;
  benchmark: ProvenanceView | null;
}

interface ExchangeErrors {
  official: SourceErrorView | null;
  unofficial: SourceErrorView | null;
  benchmark: SourceErrorView | null;
}

type ExchangeExtra = Partial<{ errors: ExchangeErrors }>;

/** A category with no rows shows the publisher's actual failure, never a placeholder number. */
const CategoryFailure = ({ label, error }: { label: string; error?: SourceErrorView | null }) => {
  const { t } = useLanguage();
  return error ? (
    <div className="mt-3">
      <SourceUnavailable error={error} source={label} />
    </div>
  ) : (
    <StateNotice tone="clay" title={t('markets.noRowsTitle')} className="mt-3">
      {t('markets.noRowsBody', { label })}
    </StateNotice>
  );
};

export const MarketExchange = () => {
  const { t, locale } = useLanguage();
  const theme = useChartTheme();
  const fx = useLiveData<ExchangePayload, ExchangeProvenances, ExchangeExtra>('/api/data/exchange?focus=all&points=8&months=18');

  const officialSeries = (fx.data?.official ?? []).map((p) => ({
    day: dayLabel(p.observedOn, locale),
    rate: p.usdToEtb,
  }));
  const unofficialSeries = (fx.data?.unofficial ?? []).map((p) => ({
    month: monthLabel(p.observedOn, locale),
    rate: p.unofficialUsdToEtb,
  }));
  const fxErrors = fx.extra?.errors;

  return (
    <Panel
      title={t('markets.fxTitle')}
      icon={Coins}
      hint={t('markets.fxHint')}
      right={fx.refreshing ? <Refreshing /> : undefined}
    >
      {fx.loading && <Loading label={t('markets.loadingFx')} />}
      {!fx.loading && fx.error && <SourceUnavailable error={fx.error} source="NBE / World Bank" />}

      {fx.data && (
        <div className="space-y-6">
          <div>
            <SectionLabel>{t('markets.officialLabel')}</SectionLabel>
            {officialSeries.length > 0 ? (
              <>
                <div className="mt-3 h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={officialSeries} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: theme.tick }} tickLine={false} axisLine={false} />
                      <YAxis
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tick={{ fontSize: 9, fill: theme.tick }}
                        tickLine={false}
                        axisLine={false}
                        width={54}
                      />
                      <Tooltip contentStyle={tooltipContentStyle} />
                      <Bar dataKey="rate" name={t('markets.etbPerUsd')} fill={SERIES_COLORS[0]} radius={[3, 3, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">{t('markets.officialNote')}</p>
                {fx.provenance?.official && (
                  <div className="mt-2.5">
                    <ProvenanceLabel provenance={fx.provenance.official} compact />
                  </div>
                )}
              </>
            ) : (
              <CategoryFailure label="National Bank of Ethiopia" error={fxErrors?.official} />
            )}
          </div>

          <div className="border-t border-line pt-5">
            <SectionLabel>{t('markets.parallelLabel')}</SectionLabel>
            {unofficialSeries.length > 0 ? (
              <>
                <div className="mt-3 h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={unofficialSeries} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: theme.tick }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tick={{ fontSize: 9, fill: theme.tick }}
                        tickLine={false}
                        axisLine={false}
                        width={54}
                      />
                      <Tooltip contentStyle={tooltipContentStyle} />
                      <Line type="monotone" dataKey="rate" name={t('markets.etbPerUsd')} stroke={SERIES_COLORS[2]} strokeWidth={1.9} dot={{ r: 1.8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">{t('markets.parallelNote')}</p>
                {fx.provenance?.unofficial && (
                  <div className="mt-2.5">
                    <ProvenanceLabel provenance={fx.provenance.unofficial} compact />
                  </div>
                )}
              </>
            ) : (
              <CategoryFailure label="World Bank currency series" error={fxErrors?.unofficial} />
            )}
          </div>

          <div className="border-t border-line pt-5">
            <SectionLabel>{t('markets.benchmarkLabel')}</SectionLabel>
            {fx.data.benchmarks && fx.data.benchmarks.length > 0 ? (
              <div className="mt-3 space-y-2.5">
                {fx.data.benchmarks.map((ind) => {
                  const latest = ind.observations.filter((o) => o.value !== null).at(-1);
                  return (
                    <div
                      key={ind.code}
                      className="flex items-start justify-between gap-4 rounded-xl border border-line bg-canvas/60 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-ink">{ind.name}</p>
                        <p className="mt-1 text-[11px] text-ink-faint">
                          <span className="font-mono">{ind.code}</span> ·{' '}
                          {t('markets.publishedFrequency', { frequency: ind.frequency })} · {ind.unit}
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-right text-[15px] font-extrabold whitespace-nowrap text-ink">
                        {fmt(latest?.value ?? null, 2, locale)}
                        <span className="mt-0.5 block text-[10px] font-semibold text-ink-faint">
                          {t('markets.referencePeriod', { period: latest?.period ?? '—' })}
                        </span>
                      </p>
                    </div>
                  );
                })}
                {fx.provenance?.benchmark && <ProvenanceLabel provenance={fx.provenance.benchmark} compact />}
                <StateNotice tone="gold" title={t('markets.annualTitle')}>
                  {t('markets.annualBody')}
                </StateNotice>
              </div>
            ) : (
              <CategoryFailure label="World Bank indicators" error={fxErrors?.benchmark} />
            )}
          </div>
        </div>
      )}
    </Panel>
  );
};
