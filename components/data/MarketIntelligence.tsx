'use client';
import React, { useMemo, useState } from 'react';
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
import { ArrowDownRight, ArrowUpRight, Coins, RefreshCw, Store, TrendingUp } from 'lucide-react';

import {
  ProvenanceLabel,
  SourceUnavailable,
  type ProvenanceView,
  type SourceErrorView,
} from '@/components/data/ProvenanceLabel';
import { SourceStatusPanel } from '@/components/data/SourceStatusPanel';
import {
  Badge,
  Button,
  Field,
  Loading,
  Metric,
  PageHeader,
  Panel,
  Refreshing,
  SegmentedControl,
  SectionLabel,
  Select,
  StateNotice,
  dayLabel,
  fmt,
  fmtInt,
  monthLabel,
} from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { SERIES_COLORS, tooltipContentStyle } from '@/lib/ui/chart';
import { useChartTheme } from '@/hooks/useChartTheme';
import { useLiveData } from '@/hooks/useLiveData';

/* ------------------------------------------------------------------ *
 * Shapes returned by /api/data/markets and /api/data/exchange
 * ------------------------------------------------------------------ */

interface PriceRow {
  observedOn: string;
  market: string;
  admin1: string | null;
  commodity: string;
  unit: string;
  currency: string;
  price: number | null;
  retail: string;
  priceFlag: string;
}

interface PriceChange {
  commodity: string;
  market: string;
  unit: string;
  currency: string;
  latestObservedOn: string;
  latestPrice: number;
  previousObservedOn: string | null;
  previousPrice: number | null;
  changePct: number | null;
  observations: number;
}

interface OverviewPayload {
  asOf: string;
  commodities: { commodity: string; avgEtbPerUnit: number; unit: string; markets: number }[];
}

interface SnapshotPayload {
  asOfLatestObservation: string | null;
  markets: number;
  commodities: number;
  rows: PriceRow[];
  changes: PriceChange[];
}

interface HistoryPayload {
  series: PriceRow[];
}

interface ExchangePayload {
  categories: string[];
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

/** The combined exchange response answers with one provenance and one error per category. */
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

/**
 * The five commodities this product tracks; every value comes from WFP’s own rows.
 * The list values are query parameters and stay exactly as the publisher spells them;
 * only the displayed label is localised.
 */
const COMMODITIES = ['Teff', 'Maize', 'Wheat', 'Sorghum', 'Coffee'] as const;

/** One series per (commodity, unit, price type): the publisher’s units are never merged. */
interface TrendSeries {
  label: string;
  color: string;
  points: { month: string; avg: number; markets: number }[];
}

function buildTrendSeries(rows: PriceRow[]): TrendSeries[] {
  const byKey = new Map<string, Map<string, { sum: number; n: number; markets: Set<string> }>>();
  for (const r of rows) {
    if (r.price === null) continue;
    const key = `${r.commodity} · ${r.unit} · ${r.retail}`;
    const months = byKey.get(key) ?? new Map<string, { sum: number; n: number; markets: Set<string> }>();
    const month = r.observedOn.slice(0, 7);
    const bucket = months.get(month) ?? { sum: 0, n: 0, markets: new Set<string>() };
    bucket.sum += r.price;
    bucket.n += 1;
    bucket.markets.add(r.market);
    months.set(month, bucket);
    byKey.set(key, months);
  }

  const series: TrendSeries[] = [];
  let i = 0;
  for (const [label, months] of [...byKey.entries()]) {
    const points = [...months.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, b]) => ({ month, avg: b.sum / b.n, markets: b.markets.size }));
    if (points.length < 2) continue;
    series.push({ label, color: SERIES_COLORS[i++ % SERIES_COLORS.length], points });
  }
  return series.sort((a, b) => b.points.length - a.points.length).slice(0, 4);
}

export const MarketIntelligence = () => {
  const { t, locale } = useLanguage();
  const [commodity, setCommodity] = useState<(typeof COMMODITIES)[number]>('Teff');
  const [region, setRegion] = useState('');

  const theme = useChartTheme();

  const overview = useLiveData<OverviewPayload>('/api/data/markets?mode=overview');
  const history = useLiveData<HistoryPayload>(
    `/api/data/markets?mode=history&commodity=${encodeURIComponent(commodity)}&months=36`,
  );
  const snapshot = useLiveData<SnapshotPayload>(
    `/api/data/markets?mode=snapshot&months=6&limit=400${region ? `&region=${encodeURIComponent(region)}` : ''}`,
  );
  const fx = useLiveData<ExchangePayload, ExchangeProvenances, ExchangeExtra>('/api/data/exchange?focus=all&points=8&months=18');

  const series = useMemo(() => buildTrendSeries(history.data?.series ?? []), [history.data]);

  const chartData = useMemo(() => {
    const months = [...new Set(series.flatMap((s) => s.points.map((p) => p.month)))].sort();
    return months.map((month) => {
      const row: Record<string, string | number | null> = { month: monthLabel(month, locale) };
      for (const s of series) {
        const hit = s.points.find((p) => p.month === month);
        row[s.label] = hit ? Number(hit.avg.toFixed(1)) : null;
      }
      return row;
    });
  }, [series, locale]);

  const regions = useMemo(() => {
    const names = new Set<string>();
    for (const r of snapshot.data?.rows ?? []) if (r.admin1) names.add(r.admin1);
    return [...names].sort();
  }, [snapshot.data]);

  const changes = (snapshot.data?.changes ?? [])
    .filter(
      (c): c is PriceChange & { changePct: number; previousObservedOn: string } =>
        c.changePct !== null && c.previousObservedOn !== null,
    )
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 14);

  const officialSeries = (fx.data?.official ?? []).map((p) => ({
    day: dayLabel(p.observedOn, locale),
    'ETB per US$': p.usdToEtb,
  }));
  const unofficialSeries = (fx.data?.unofficial ?? []).map((p) => ({
    month: monthLabel(p.observedOn, locale),
    'ETB per US$': p.unofficialUsdToEtb,
  }));
  const fxErrors = fx.extra?.errors;

  const anyRefreshing = overview.refreshing || history.refreshing || snapshot.refreshing || fx.refreshing;
  const hasLive = overview.data !== null || snapshot.data !== null || fx.data !== null;

  const reloadAll = () => {
    overview.reload();
    history.reload();
    snapshot.reload();
    fx.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.group.Intelligence')}
        title={t('module.markets.label')}
        icon={Store}
        description={t('markets.description')}
        status={
          anyRefreshing ? (
            <Refreshing />
          ) : hasLive ? (
            <Badge tone="brand" dot>
              {t('markets.badgeLiveSurvey')}
            </Badge>
          ) : (
            <Badge tone="clay" dot>
              {t('overview.badgeNoReading')}
            </Badge>
          )
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={reloadAll}
            disabled={anyRefreshing}
            leading={<RefreshCw size={14} className={anyRefreshing ? 'animate-spin' : undefined} />}
          >
            {t('common.refreshAll')}
          </Button>
        }
      />

      <Panel
        title={t('markets.grainPricesTitle')}
        hint={t('markets.grainPricesHint')}
        right={overview.refreshing ? <Refreshing /> : undefined}
      >
        {overview.loading && <Loading label={t('markets.loadingWfp')} />}
        {!overview.loading && overview.error && <SourceUnavailable error={overview.error} source="WFP via HDX" />}
        {overview.data && overview.data.commodities.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {overview.data.commodities.slice(0, 8).map((c) => (
                <Metric
                  key={`${c.commodity}-${c.unit}`}
                  label={`${c.commodity} · ${c.unit}`}
                  value={fmt(c.avgEtbPerUnit, 0, locale)}
                  unit="ETB"
                  note={t('markets.meanAcrossMarkets', { count: c.markets })}
                />
              ))}
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
              {t('markets.surveyMonth')} <span className="tabular font-bold text-ink-muted">{overview.data.asOf}</span>
              {t('markets.grainNote')}
            </p>
            <div className="mt-4 border-t border-line pt-3.5">
              <ProvenanceLabel provenance={overview.provenance} />
            </div>
          </>
        )}
      </Panel>

      <Panel
        title={t('markets.historyTitle')}
        icon={TrendingUp}
        hint={t('markets.historyHint')}
        right={
          history.refreshing ? (
            <Refreshing />
          ) : (
            <span className="text-[11px] font-semibold text-ink-faint">{t('markets.last36Months')}</span>
          )
        }
      >
        <SegmentedControl
          label={t('markets.commodity')}
          value={commodity}
          onChange={(v) => setCommodity(v as (typeof COMMODITIES)[number])}
          options={COMMODITIES.map((c) => ({
            value: c,
            label: t(`commodity.${c.toLowerCase() as Lowercase<(typeof COMMODITIES)[number]>}`),
          }))}
        />

        {history.loading && <Loading label={t('markets.loadingHistory', { commodity })} className="mt-5" />}
        {!history.loading && history.error && (
          <div className="mt-5">
            <SourceUnavailable error={history.error} source="WFP via HDX" />
          </div>
        )}
        {!history.loading && history.data && series.length === 0 && (
          <StateNotice tone="info" title={t('markets.noSeriesTitle')} className="mt-5">
            {t('markets.noSeriesBody', { commodity })}
          </StateNotice>
        )}

        {chartData.length > 1 && (
          <>
            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: theme.tick }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: theme.tick }}
                    tickLine={false}
                    axisLine={false}
                    width={68}
                    tickFormatter={(v: number) => v.toLocaleString(locale)}
                  />
                  <Tooltip contentStyle={tooltipContentStyle} />
                  {series.map((s) => (
                    <Line
                      key={s.label}
                      type="monotone"
                      dataKey={s.label}
                      stroke={s.color}
                      strokeWidth={1.9}
                      dot={{ r: 1.8 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {series.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-[11.5px] font-semibold text-ink-muted">
                  <span aria-hidden className="h-0.5 w-3.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  {t('markets.seriesLegend', {
                    series: s.label,
                    months: s.points.length,
                    markets: Math.max(...s.points.map((p) => p.markets)),
                  })}
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">{t('markets.unitsNote')}</p>
            <div className="mt-4 border-t border-line pt-3.5">
              <ProvenanceLabel provenance={history.provenance} />
            </div>
          </>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title={t('markets.crossMarketTitle')}
          hint={t('markets.crossMarketHint')}
          right={
            <div className="flex items-center gap-2">
              {snapshot.refreshing && <Refreshing />}
              <Field label={t('markets.region')} htmlFor="region-filter" className="w-44">
                <Select
                  id="region-filter"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-9 text-[12.5px]"
                >
                  <option value="">{t('markets.allRegions')}</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          }
        >
          {snapshot.loading && <Loading label={t('markets.loadingLatest')} />}
          {!snapshot.loading && snapshot.error && <SourceUnavailable error={snapshot.error} source="WFP via HDX" />}

          {changes.length > 0 && snapshot.data && (
            <>
              <div className="max-h-[26rem] overflow-auto rounded-xl border border-line">
                <table className="w-full min-w-[520px] text-[12.5px]">
                  <thead className="sticky top-0 z-10 bg-canvas">
                    <tr className="border-b border-line text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                      <th scope="col" className="px-4 py-2.5 font-bold">{t('markets.thMarket')}</th>
                      <th scope="col" className="px-4 py-2.5 font-bold">{t('markets.commodity')}</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.thLatest')}</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.thChange')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {changes.map((c) => (
                      <tr key={`${c.market}-${c.commodity}-${c.unit}`} className="transition-colors hover:bg-canvas/70">
                        <td className="px-4 py-2.5 font-bold whitespace-nowrap text-ink">{c.market}</td>
                        <td className="px-4 py-2.5 text-ink-muted">
                          {c.commodity} <span className="text-ink-faint">({c.unit})</span>
                        </td>
                        <td className="tabular px-4 py-2.5 whitespace-nowrap text-right text-ink">
                          {fmtInt(c.latestPrice, locale)}{' '}
                          <span className="text-[11px] font-semibold text-ink-faint">{c.currency}</span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right">
                          <span
                            className={`tabular inline-flex items-center justify-end gap-1 font-extrabold ${
                              c.changePct > 0 ? 'text-clay-600 dark:text-clay-300' : 'text-brand-700 dark:text-brand-300'
                            }`}
                          >
                            {c.changePct > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            {fmt(Math.abs(c.changePct), 1, locale)}%
                          </span>
                          <span className="tabular ml-1.5 text-[10px] text-ink-faint">
                            {t('markets.vs')} {c.previousObservedOn.slice(0, 7)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
                {t('markets.surveyCoverage', {
                  month: snapshot.data.asOfLatestObservation ?? '—',
                  markets: snapshot.data.markets,
                  commodities: snapshot.data.commodities,
                })}
              </p>
              <div className="mt-4 border-t border-line pt-3.5">
                <ProvenanceLabel provenance={snapshot.provenance} />
              </div>
            </>
          )}
        </Panel>

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
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 9, fill: theme.tick }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            domain={['dataMin - 2', 'dataMax + 2']}
                            tick={{ fontSize: 9, fill: theme.tick }}
                            tickLine={false}
                            axisLine={false}
                            width={54}
                          />
                          <Tooltip contentStyle={tooltipContentStyle} />
                          <Bar
                            dataKey="ETB per US$"
                            name={t('markets.etbPerUsd')}
                            fill={SERIES_COLORS[0]}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={26}
                          />
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
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 9, fill: theme.tick }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            domain={['dataMin - 2', 'dataMax + 2']}
                            tick={{ fontSize: 9, fill: theme.tick }}
                            tickLine={false}
                            axisLine={false}
                            width={54}
                          />
                          <Tooltip contentStyle={tooltipContentStyle} />
                          <Line
                            type="monotone"
                            dataKey="ETB per US$"
                            name={t('markets.etbPerUsd')}
                            stroke={SERIES_COLORS[2]}
                            strokeWidth={1.9}
                            dot={{ r: 1.8 }}
                          />
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
      </div>

      <SourceStatusPanel />
    </div>
  );
};

/** A category with no rows shows the publisher’s actual failure, never a placeholder number. */
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
