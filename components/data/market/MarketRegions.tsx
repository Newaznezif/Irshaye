'use client';
import React, { useState } from 'react';
import { MapPinned } from 'lucide-react';

import { ProvenanceLabel, SourceUnavailable, type ProvenanceView } from '@/components/data/ProvenanceLabel';
import {
  Badge,
  Field,
  Loading,
  Metric,
  Panel,
  Refreshing,
  SectionLabel,
  Select,
  StateNotice,
  dayLabel,
  fmt,
  fmtInt,
  monthLabel,
} from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { useLiveData } from '@/hooks/useLiveData';
import { ContributingSources } from './parts';
import type { CompareBundleView, MarketCatalogView, MarketSourcesExtra, SpreadRowView } from './types';

/**
 * Regional comparison (§5D).
 *
 * One survey month, one commodity, one publisher unit, one price type — that lock is what
 * makes "dearest" and "cheapest" mean the same good bought in two towns rather than two
 * different questions. The spread and the "percent above cheapest" column are computed by
 * `lib/data/marketModel.ts` from published rows and are labelled as ours.
 *
 * The map plots a market only where the publisher supplies a coordinate for it. Markets
 * without one stay in the table and are counted in the legend; they are never placed by
 * guess, and the administrative outlines behind them come from geoBoundaries, not from us.
 */

interface Props {
  catalog: MarketCatalogView;
  provenance: ProvenanceView | null;
}

interface RegionOutline {
  id: string;
  name: string;
  rings: [number, number][][];
}

interface LocationsPayload {
  regions?: RegionOutline[];
}

const ENVELOPE = { minLongitude: 32.9, minLatitude: 3.3, maxLongitude: 48.1, maxLatitude: 15.1 };
const MAP_W = 620;

const TILE = 256;
const worldPx = (z: number) => TILE * 2 ** z;
const xOf = (lon: number, z: number) => ((lon + 180) / 360) * worldPx(z);
const yOf = (lat: number, z: number) => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * worldPx(z);
};

const Z = 6;
const ORIGIN = { x: xOf(ENVELOPE.minLongitude, Z), y: yOf(ENVELOPE.maxLatitude, Z) };
const SCALE = MAP_W / (xOf(ENVELOPE.maxLongitude, Z) - ORIGIN.x);
const MAP_H = (yOf(ENVELOPE.minLatitude, Z) - ORIGIN.y) * SCALE;

const px = (lon: number) => (xOf(lon, Z) - ORIGIN.x) * SCALE;
const py = (lat: number) => (yOf(lat, Z) - ORIGIN.y) * SCALE;

const outlinePath = (rings: [number, number][][]): string =>
  rings
    .map((ring) => ring.map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'}${px(lon).toFixed(1)} ${py(lat).toFixed(1)}`).join(' ') + ' Z')
    .join(' ');

/** Cheapest to dearest along one green-to-clay ramp; the ramp is a scale, not a value. */
const rampColor = (t: number): string => {
  const from = [28, 125, 77];
  const to = [192, 95, 60];
  const mix = from.map((c, i) => Math.round(c + (to[i] - c) * t));
  return `rgb(${mix[0]} ${mix[1]} ${mix[2]})`;
};

export const MarketRegions = ({ catalog, provenance }: Props) => {
  const { t, locale } = useLanguage();
  const [commodity, setCommodity] = useState(
    catalog.commodities.find((c) => c.markets >= 2)?.name ?? (catalog.commodities[0]?.name ?? ''),
  );
  const [unit, setUnit] = useState(
    catalog.commodities.find((c) => c.name === commodity)?.units[0] ?? '',
  );
  const [retail, setRetail] = useState('Retail');
  const [month, setMonth] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const chosen = catalog.commodities.find((c) => c.name === commodity) ?? null;
  const path = commodity
    ? `/api/data/markets?mode=compare&commodity=${encodeURIComponent(commodity)}&unit=${encodeURIComponent(unit)}&priceType=${encodeURIComponent(retail)}${
        month ? `&month=${encodeURIComponent(month)}` : ''
      }`
    : null;

  const { data, extra, loading, refreshing, error } = useLiveData<CompareBundleView, ProvenanceView, MarketSourcesExtra>(path);
  const geo = useLiveData<LocationsPayload>('/api/data/locations?regions=1');

  const reports = extra?.sources ?? [];
  const spread = data?.spread ?? null;
  const rows = spread?.markets ?? [];
  const outlines = geo.data?.regions ?? [];

  const priced = rows.filter((r) => Number.isFinite(r.price));
  const lowest = priced.length > 0 ? Math.min(...priced.map((r) => r.price)) : 0;
  const highest = priced.length > 0 ? Math.max(...priced.map((r) => r.price)) : 0;
  const positionOf = (price: number): number => (highest > lowest ? (price - lowest) / (highest - lowest) : 0);

  const pickCommodity = (name: string) => {
    setCommodity(name);
    setUnit(catalog.commodities.find((c) => c.name === name)?.units[0] ?? '');
    setSelected(null);
  };

  const regionMax = data && data.byRegion.length > 0 ? Math.max(...data.byRegion.map((r) => r.average)) : 0;

  return (
    <Panel
      title={t('markets.crossMarketTitle')}
      icon={MapPinned}
      hint={t('markets.crossMarketHint')}
      right={
        <div className="flex items-center gap-2">
          {refreshing && <Refreshing />}
          {spread && <Badge tone="neutral">{t('markets.reg.marketsShown', { count: rows.length })}</Badge>}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t('markets.commodity')} htmlFor="rg-commodity">
          <Select id="rg-commodity" value={commodity} onChange={(e) => pickCommodity(e.target.value)}>
            {catalog.commodities.map((c) => (
              <option key={`${c.name}|${c.units[0]}`} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('common.unit')} htmlFor="rg-unit">
          <Select
            id="rg-unit"
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              setSelected(null);
            }}
          >
            {(chosen?.units ?? []).map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('markets.ex.priceType')} htmlFor="rg-retail">
          <Select
            id="rg-retail"
            value={retail}
            onChange={(e) => {
              setRetail(e.target.value);
              setSelected(null);
            }}
          >
            {(chosen?.retail ?? ['Retail', 'Wholesale']).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('markets.surveyMonth')} htmlFor="rg-month" hint={data ? t('markets.reg.monthHint') : undefined}>
          <Select id="rg-month" value={data?.month ?? month} onChange={(e) => setMonth(e.target.value)}>
            {(data?.monthsAvailable ?? catalog.months).map((m) => (
              <option key={m} value={m}>
                {monthLabel(m, locale)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {loading && <Loading label={t('markets.loadingLatest')} className="mt-5" />}
      {!loading && error && (
        <div className="mt-5">
          <SourceUnavailable error={error} source={t('markets.ex.sourceLabel')} />
        </div>
      )}

      {!loading && data && spread === null && (
        <StateNotice tone="gold" title={t('markets.reg.noneTitle')} className="mt-5">
          {t('markets.reg.noneBody', { month: monthLabel(data.month, locale), commodity: data.commodity, unit: data.unit })}
        </StateNotice>
      )}

      {data && spread && rows.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric
              label={t('markets.reg.cheapest')}
              value={fmt(spread.cheapest?.price ?? spread.markets.at(-1)?.price ?? null, 0, locale)}
              unit={spread.currency}
              note={t('markets.reg.atMarket', { market: spread.cheapest?.market ?? spread.markets.at(-1)?.market ?? '—' })}
              tone="good"
            />
            <Metric
              label={t('markets.reg.dearest')}
              value={fmt(spread.dearest?.price ?? spread.markets[0]?.price ?? null, 0, locale)}
              unit={spread.currency}
              note={t('markets.reg.atMarket', { market: spread.dearest?.market ?? spread.markets[0]?.market ?? '—' })}
              tone="bad"
            />
            <Metric
              label={t('markets.reg.spread')}
              value={spread.spreadPct === null ? '—' : `${fmt(spread.spreadPct, 1, locale)}%`}
              note={t('markets.reg.spreadNote')}
              tone={spread.spreadPct === null ? undefined : 'warn'}
            />
          </div>
          {spread.spreadPct === null && (
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-faint">{t('markets.reg.singleMarket')}</p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <SectionLabel>{t('markets.reg.mapTitle')}</SectionLabel>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">{t('markets.reg.mapHint')}</p>
              <div className="mt-3 overflow-hidden rounded-xl border border-line bg-canvas/60">
                <svg
                  viewBox={`0 0 ${MAP_W} ${MAP_H.toFixed(0)}`}
                  className="h-auto w-full"
                  role="img"
                  aria-label={t('markets.reg.mapAria', { count: spread.mappable })}
                >
                  {outlines.map((r) => (
                    <path
                      key={r.id}
                      d={outlinePath(r.rings)}
                      fill="rgba(28,125,77,.06)"
                      stroke="var(--line-strong)"
                      strokeWidth={0.7}
                    >
                      <title>{r.name}</title>
                    </path>
                  ))}
                  {rows
                    .filter((r) => r.latitude !== null && r.longitude !== null)
                    .map((r) => (
                      <g key={r.market}>
                        <circle
                          cx={px(r.longitude as number)}
                          cy={py(r.latitude as number)}
                          r={selected === r.market ? 8 : 5.5}
                          fill={rampColor(positionOf(r.price))}
                          fillOpacity={0.85}
                          stroke={selected === r.market ? 'var(--brand)' : 'rgba(255,255,255,.8)'}
                          strokeWidth={selected === r.market ? 2 : 1}
                          className="cursor-pointer"
                          onClick={() => setSelected(selected === r.market ? null : r.market)}
                        >
                          <title>{`${r.market} · ${fmt(r.price, 0, locale)} ${r.currency} / ${r.unit}`}</title>
                        </circle>
                      </g>
                    ))}
                </svg>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-8 rounded-full" style={{ background: `linear-gradient(90deg, ${rampColor(0)}, ${rampColor(1)})` }} />
                  {t('markets.reg.ramp', {
                    low: fmt(lowest, 0, locale),
                    high: fmt(highest, 0, locale),
                    currency: spread.currency,
                    unit: spread.unit,
                  })}
                </span>
                <span>{t('markets.reg.plotted', { plotted: spread.mappable, total: rows.length })}</span>
                {rows.length > spread.mappable && (
                  <span className="text-ink-faint">{t('markets.reg.unplottedNote')}</span>
                )}
              </div>
              {geo.loading && <p className="mt-2 text-[11px] text-ink-faint">{t('markets.reg.loadingOutlines')}</p>}
              {geo.error && (
                <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">{t('markets.reg.outlineNote')}</p>
              )}
            </div>

            <div>
              <SectionLabel>{t('markets.reg.byRegionTitle')}</SectionLabel>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">{t('markets.reg.byRegionHint')}</p>
              <ul className="mt-3 space-y-2.5">
                {data.byRegion.map((r) => (
                  <li key={r.region}>
                    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                      <span className="min-w-0 truncate font-bold text-ink">{r.region}</span>
                      <span className="tabular shrink-0 font-extrabold text-ink">
                        {fmt(r.average, 0, locale)} <span className="text-[10.5px] font-semibold text-ink-faint">{r.currency}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${regionMax > 0 ? Math.max(4, (r.average / regionMax) * 100) : 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10.5px] text-ink-faint">
                      {t('markets.reg.regionMarkets', { count: r.markets, unit: r.unit })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel>{t('markets.reg.tableTitle')}</SectionLabel>
            <div className="mt-3 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[640px] text-[12.5px]">
                <caption className="sr-only">{t('markets.reg.tableCaption')}</caption>
                <thead className="bg-canvas">
                  <tr className="border-b border-line text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                    <th scope="col" className="px-4 py-2.5 font-bold">{t('markets.thMarket')}</th>
                    <th scope="col" className="px-4 py-2.5 font-bold">{t('markets.region')}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.reg.price')}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('markets.reg.aboveCheapest')}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">{t('common.newestObservation')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r: SpreadRowView) => (
                    <tr
                      key={r.market}
                      className={`align-top transition-colors hover:bg-canvas/70 ${selected === r.market ? 'bg-brand-soft/50' : ''}`}
                    >
                      <td className="px-4 py-2.5 font-bold text-ink">
                        <button
                          type="button"
                          onClick={() => setSelected(selected === r.market ? null : r.market)}
                          className="text-left font-bold text-ink underline decoration-transparent underline-offset-2 transition-colors hover:decoration-line-strong"
                        >
                          {r.market}
                        </button>
                        <span className="mt-0.5 block text-[10.5px] text-ink-faint">
                          {r.latitude !== null && r.longitude !== null ? t('markets.reg.hasCoords') : t('markets.reg.noCoords')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-ink-muted">{r.admin1 ?? '—'}</td>
                      <td className="tabular px-4 py-2.5 text-right whitespace-nowrap font-extrabold text-ink">
                        {fmt(r.price, 0, locale)}{' '}
                        <span className="text-[10.5px] font-semibold text-ink-faint">
                          {r.currency} / {r.unit}
                        </span>
                      </td>
                      <td className="tabular px-4 py-2.5 text-right whitespace-nowrap">
                        {r.aboveCheapestPct === null ? (
                          <span className="text-ink-faint">—</span>
                        ) : (
                          <span className={r.aboveCheapestPct > 0 ? 'font-bold text-clay-600 dark:text-clay-300' : 'font-bold text-ink-muted'}>
                            +{fmt(r.aboveCheapestPct, 1, locale)}%
                          </span>
                        )}
                      </td>
                      <td className="tabular px-4 py-2.5 text-right whitespace-nowrap text-ink-muted">{dayLabel(r.observedOn, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
              {t('markets.reg.tableNote', {
                month: monthLabel(data.month, locale),
                markets: fmtInt(rows.length, locale),
              })}
            </p>
          </div>

          <div className="mt-5 space-y-2 border-t border-line pt-3.5">
            <ProvenanceLabel provenance={provenance} />
            <ContributingSources reports={reports} />
            <p className="text-[11px] leading-relaxed text-ink-faint">
              {t('markets.reg.publisherNote', {
                list: data.sourceIds.map((id) => catalog.sources.find((s) => s.sourceId === id)?.sourceName ?? id).join(' · '),
              })}
            </p>
          </div>
        </>
      )}
    </Panel>
  );
};
