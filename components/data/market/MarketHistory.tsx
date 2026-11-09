'use client';
import React, { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

import { ProvenanceLabel, SourceUnavailable, type ProvenanceView } from '@/components/data/ProvenanceLabel';
import {
  Badge,
  Field,
  Loading,
  Metric,
  Panel,
  Refreshing,
  SectionLabel,
  SegmentedControl,
  Select,
  StateNotice,
  dayLabel,
  fmt,
  fmtInt,
  monthLabel,
} from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { useLiveData } from '@/hooks/useLiveData';
import { useChartTheme } from '@/hooks/useChartTheme';
import { SERIES_COLORS, tooltipContentStyle } from '@/lib/ui/chart';
import { ContributingSources, FreshnessBadge } from './parts';
import type { CatalogCommodityView, MarketCatalogView, MarketSourcesExtra, SeriesBundleView } from './types';

/**
 * Historical price analysis (§5C).
 *
 * One series at a time — one commodity, one publisher unit, one price type — because the
 * only comparisons these surveys support are inside a single (market, commodity, unit,
 * price type) group. The chart draws three lines the publisher's rows actually contain
 * (mean, lowest and highest figure in the period), and it draws a break where a period has
 * no figure: a gap is plotted as a gap, never joined across.
 *
 * Min, max, mean and percentage change are computed here, so they are labelled as ours.
 * Nothing in this panel projects a price forward.
 */

interface Props {
  catalog: MarketCatalogView;
  supportedGranularity: ('weekly' | 'monthly')[];
  provenance: ProvenanceView | null;
}

const MONTH_WINDOWS = [12, 24, 36, 60];
const WEEK_WINDOWS = [8, 13, 26, 52];

/** A monthly bucket is named by its month, a weekly one by the survey date it came from. */
const periodLabel = (period: string, locale: string): string =>
  period.length === 7 ? monthLabel(period, locale) : dayLabel(period, locale);

export const MarketHistory = ({ catalog, supportedGranularity, provenance }: Props) => {
  const { t, locale } = useLanguage();
  const theme = useChartTheme();

  const deepest = [...catalog.commodities].sort(
    (a, b) => b.markets - a.markets || b.observations - a.observations || a.name.localeCompare(b.name),
  );
  const [chosen, setChosen] = useState<CatalogCommodityView | null>(deepest[0] ?? null);
  const [unit, setUnit] = useState<string>(deepest[0]?.units[0] ?? '');
  const [retail, setRetail] = useState<string>(deepest[0]?.retail.includes('Retail') ? 'Retail' : (deepest[0]?.retail[0] ?? 'Retail'));
  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>(
    supportedGranularity.includes('weekly') ? 'weekly' : 'monthly',
  );
  const [months, setMonths] = useState(36);
  const [weeks, setWeeks] = useState(26);

  const commodity = chosen?.name ?? '';
  const path = commodity
    ? `/api/data/markets?mode=series&commodity=${encodeURIComponent(commodity)}&unit=${encodeURIComponent(unit)}&priceType=${encodeURIComponent(retail)}&granularity=${granularity}&${
        granularity === 'weekly' ? `weeks=${weeks}` : `months=${months}`
      }`
    : null;

  const { data, extra, loading, refreshing, error, reload } = useLiveData<SeriesBundleView, ProvenanceView, MarketSourcesExtra>(path);
  const reports = extra?.sources ?? [];
  const bundle = data;

  const points = bundle?.points ?? [];
  const weekly = bundle?.granularity === 'weekly';

  /**
   * Gap periods become null-valued rows on the shared axis. Recharts leaves a hole where a
   * value is null and `connectNulls` is false, so the survey's silence is visible as a break
   * in the line instead of a straight guess between the two dates around it.
   *
   * Points are labelled with a full date and gaps with a month, so both are normalised to the
   * period the series is actually bucketed by before they share an axis.
   */
  const chartRows = (() => {
    const norm = (period: string) => (weekly ? period : period.slice(0, 7));
    const periods = [...new Set([...points.map((p) => norm(p.observedOn)), ...(bundle?.missingDates ?? [])])].sort();
    return periods.map((period) => {
      const hit = points.find((p) => norm(p.observedOn) === period);
      return {
        period,
        label: weekly ? dayLabel(period, locale) : monthLabel(period, locale),
        average: hit ? Number(hit.average.toFixed(1)) : null,
        minimum: hit ? Number(hit.minimum.toFixed(1)) : null,
        maximum: hit ? Number(hit.maximum.toFixed(1)) : null,
        markets: hit?.markets ?? 0,
      };
    });
  })();

  const stats = bundle?.stats ?? null;

  const pickCommodity = (name: string) => {
    const next = catalog.commodities.find((c) => c.name === name) ?? null;
    setChosen(next);
    setUnit(next?.units[0] ?? '');
    setRetail(next?.retail.includes('Retail') ? 'Retail' : (next?.retail[0] ?? 'Retail'));
  };

  return (
    <Panel
      title={t('markets.historyTitle')}
      icon={TrendingUp}
      hint={t('markets.historyHint')}
      right={
        <div className="flex items-center gap-2">
          {refreshing && <Refreshing />}
          {bundle && <FreshnessBadge tier={bundle.freshness} />}
          <Badge tone="outline">
            {t('markets.lastWindow', { count: weekly ? weeks : months, unit: t(weekly ? 'markets.weeks' : 'markets.months') })}
          </Badge>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t('markets.commodity')} htmlFor="hs-commodity">
          <Select id="hs-commodity" value={commodity} onChange={(e) => pickCommodity(e.target.value)}>
            {catalog.commodities.map((c) => (
              <option key={`${c.name}|${c.units[0]}`} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('common.unit')} htmlFor="hs-unit" hint={t('markets.hist.unitHint')}>
          <Select id="hs-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {(chosen?.units ?? []).map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('markets.ex.priceType')} htmlFor="hs-retail">
          <Select id="hs-retail" value={retail} onChange={(e) => setRetail(e.target.value)}>
            {(chosen?.retail ?? ['Retail']).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('markets.hist.granularity')} htmlFor="hs-granularity">
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              label={t('markets.hist.granularity')}
              size="sm"
              value={granularity}
              onChange={setGranularity}
              options={[
                { value: 'weekly', label: t('markets.granularity.weekly') },
                { value: 'monthly', label: t('markets.granularity.monthly') },
              ]}
            />
            <Select
              value={weekly ? String(weeks) : String(months)}
              onChange={(e) => (weekly ? setWeeks(Number(e.target.value)) : setMonths(Number(e.target.value)))}
              className="h-9 w-24 text-[12.5px]"
              aria-label={t('markets.hist.windowLabel')}
            >
              {(weekly ? WEEK_WINDOWS : MONTH_WINDOWS).map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
        </Field>
      </div>

      {loading && <Loading label={t('markets.loadingHistory', { commodity })} className="mt-5" />}
      {!loading && error && (
        <div className="mt-5">
          <SourceUnavailable error={error} source={t('markets.ex.sourceLabel')} />
        </div>
      )}

      {!weekly && granularity === 'weekly' && bundle && (
        <StateNotice tone="info" title={t('markets.hist.fallbackTitle')} className="mt-5">
          {t('markets.hist.fallbackBody', { commodity: bundle.commodity })}
        </StateNotice>
      )}

      {bundle && points.length === 0 && (
        <StateNotice tone="clay" title={t('markets.noSeriesTitle')} className="mt-5">
          {t('markets.noSeriesBody', { commodity: bundle.commodity })}
        </StateNotice>
      )}

      {bundle && points.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label={t('markets.thLatest')}
              value={fmt(stats?.latest?.value ?? null, 0, locale)}
              unit={stats?.currency ?? undefined}
              note={t('markets.hist.latestNote', {
                when: stats?.latest ? dayLabel(stats.latest.observedOn, locale) : '—',
                markets: fmtInt(points.at(-1)?.markets ?? 0, locale),
              })}
            />
            <Metric
              label={t('markets.hist.average')}
              value={fmt(stats?.average ?? null, 0, locale)}
              note={t('markets.hist.derivedNote')}
            />
            <Metric
              label={t('markets.hist.lowest')}
              value={fmt(stats?.minimum?.value ?? null, 0, locale)}
              tone="good"
              note={t('markets.hist.lowestNote', {
                when: stats?.minimum ? dayLabel(stats.minimum.observedOn, locale) : '—',
              })}
            />
            <Metric
              label={t('markets.hist.highest')}
              value={fmt(stats?.maximum?.value ?? null, 0, locale)}
              tone="bad"
              note={t('markets.hist.highestNote', {
                when: stats?.maximum ? dayLabel(stats.maximum.observedOn, locale) : '—',
              })}
            />
          </div>

          {stats?.changePct !== null && stats?.changePct !== undefined && (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink">
              <Badge tone={stats.changePct > 0 ? 'clay' : 'brand'}>
                {t('markets.hist.change', {
                  pct: fmt(Math.abs(stats.changePct), 1, locale),
                  direction: t(stats.changePct > 0 ? 'markets.hist.up' : 'markets.hist.down'),
                })}
              </Badge>
              <span className="text-[11.5px] font-normal text-ink-faint">
                {t('markets.vs')} {periodLabel(stats.changeFrom ?? '', locale)} · {periodLabel(stats.changeTo ?? '', locale)}
              </span>
            </p>
          )}

          {chartRows.length > 1 ? (
            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows} margin={{ top: 8, right: 10, left: -6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
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
                  <Line
                    type="monotone"
                    dataKey="minimum"
                    name={t('markets.hist.lowest')}
                    stroke={SERIES_COLORS[5]}
                    strokeWidth={1.1}
                    strokeDasharray="4 3"
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    name={t('markets.hist.average')}
                    stroke={SERIES_COLORS[0]}
                    strokeWidth={2.1}
                    dot={{ r: 1.9 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="maximum"
                    name={t('markets.hist.highest')}
                    stroke={SERIES_COLORS[1]}
                    strokeWidth={1.1}
                    strokeDasharray="4 3"
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 text-[12.5px] leading-relaxed text-ink-muted">{t('markets.hist.onePoint', {
              count: points.length,
            })}</p>
          )}

          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
            {t('markets.hist.seriesNote', {
              commodity: bundle.commodity,
              unit: bundle.unit,
              retail: bundle.retail,
              periods: fmtInt(points.length, locale),
              markets: fmtInt(stats?.markets ?? 0, locale),
            })}
          </p>

          {bundle.missingDates.length > 0 && (
            <StateNotice tone="gold" title={t('markets.hist.gapTitle')} className="mt-4">
              <p>{t('markets.hist.gapBody', { count: bundle.missingDates.length })}</p>
              <p className="mt-1.5 font-mono text-[11px]">
                {bundle.missingDates.slice(0, 12).join(', ')}
                {bundle.missingDates.length > 12 ? ', …' : ''}
              </p>
            </StateNotice>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <SectionLabel>{t('markets.hist.byMarketTitle')}</SectionLabel>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">{t('markets.hist.byMarketHint')}</p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[680px] text-[12.5px]">
                <thead className="bg-canvas">
                  <tr className="border-b border-line text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                    <th scope="col" className="px-4 py-2.5 font-bold">{t('markets.thMarket')}</th>
                    <th scope="col" className="px-4 py-2.5 font-bold">{t('markets.region')}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.thLatest')}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.hist.lowest')}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.hist.highest')}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.thChange')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {bundle.byMarket.map((m) => (
                    <tr key={m.market} className="transition-colors hover:bg-canvas/70">
                      <td className="px-4 py-2.5 font-bold whitespace-nowrap text-ink">{m.market}</td>
                      <td className="px-4 py-2.5 text-ink-muted">{m.admin1 ?? '—'}</td>
                      <td className="tabular px-4 py-2.5 text-right whitespace-nowrap text-ink">
                        {fmt(m.stats?.latest?.value ?? null, 0, locale)}
                        <span className="ml-1 text-[10.5px] font-semibold text-ink-faint">{m.stats?.currency}</span>
                      </td>
                      <td className="tabular px-4 py-2.5 text-right text-ink-muted">{fmt(m.stats?.minimum?.value ?? null, 0, locale)}</td>
                      <td className="tabular px-4 py-2.5 text-right text-ink-muted">{fmt(m.stats?.maximum?.value ?? null, 0, locale)}</td>
                      <td className="tabular px-4 py-2.5 text-right whitespace-nowrap">
                        {m.stats?.changePct === null || m.stats?.changePct === undefined ? (
                          <span className="text-ink-faint">—</span>
                        ) : (
                          <span className={m.stats.changePct > 0 ? 'font-extrabold text-clay-600 dark:text-clay-300' : 'font-extrabold text-brand-700 dark:text-brand-300'}>
                            {m.stats.changePct > 0 ? '+' : '−'}
                            {fmt(Math.abs(m.stats.changePct), 1, locale)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">{t('markets.unitsNote')}</p>
          <div className="mt-4 space-y-2 border-t border-line pt-3.5">
            <ProvenanceLabel provenance={provenance} />
            <ContributingSources reports={reports} />
            <p className="text-[11px] text-ink-faint">
              {t('markets.hist.publishersInSeries', {
                list: bundle.sourceIds
                  .map((id) => catalog.sources.find((s) => s.sourceId === id)?.sourceName ?? id)
                  .join(' · '),
              })}
            </p>
          </div>
        </>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={reload}
          disabled={loading || refreshing}
          className="text-[11.5px] font-bold text-ink-muted underline decoration-line-strong underline-offset-2 transition-colors hover:text-brand-hover disabled:opacity-45"
        >
          {t('markets.hist.recheck')}
        </button>
      </div>
    </Panel>
  );
};
