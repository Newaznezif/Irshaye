'use client';
import React, { useState } from 'react';
import { Download, Search, SlidersHorizontal } from 'lucide-react';

import { ProvenanceLabel, SourceUnavailable, type ProvenanceView } from '@/components/data/ProvenanceLabel';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Loading,
  Panel,
  Refreshing,
  Select,
  StateNotice,
  dayLabel,
  fmt,
  fmtInt,
} from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { useLiveData } from '@/hooks/useLiveData';
import { csvFileName, downloadCsv, toCsv } from '@/lib/ui/csv';
import { ContributingSources, CoverageNote, FreshnessBadge } from './parts';
import type { MarketCatalogView, MarketRecordPageView, MarketRecordView, MarketSourcesExtra } from './types';

/**
 * The price explorer (§5B and §5F): one page of published rows at a time, filtered
 * server-side, with every row carrying its own publisher, unit, currency, survey date and
 * freshness.
 *
 * Two rules the layout is built around. A null price stays an empty cell — it is a survey
 * that produced no figure, and rendering it as zero would report a free market. And a filter
 * can only ever name a value the data contains: the option lists come from the catalogue, so
 * clicking a commodity always leads to rows rather than to an empty table styled as data.
 */

interface Props {
  catalog: MarketCatalogView;
  provenance: ProvenanceView | null;
}

type SortField = 'observedOn' | 'price' | 'commodity' | 'market';

const EMPTY = '';

const buildQuery = (f: Filters, page: number, pageSize: number, sort: SortField, direction: 'asc' | 'desc'): string => {
  const p = new URLSearchParams({ mode: 'records', page: String(page), pageSize: String(pageSize), sort, direction });
  if (f.commodity) p.set('commodity', f.commodity);
  if (f.unit) p.set('unit', f.unit);
  if (f.retail) p.set('priceType', f.retail);
  if (f.region) p.set('region', f.region);
  if (f.market) p.set('market', f.market);
  if (f.sourceId) p.set('sourceId', f.sourceId);
  if (f.search) p.set('search', f.search);
  if (f.from) p.set('from', f.from);
  if (f.to) p.set('to', f.to);
  if (f.pricedOnly) p.set('pricedOnly', '1');
  return `/api/data/markets?${p.toString()}`;
};

interface Filters {
  commodity: string;
  unit: string;
  retail: string;
  region: string;
  market: string;
  sourceId: string;
  search: string;
  from: string;
  to: string;
  pricedOnly: boolean;
}

const INITIAL: Filters = {
  commodity: EMPTY,
  unit: EMPTY,
  retail: EMPTY,
  region: EMPTY,
  market: EMPTY,
  sourceId: EMPTY,
  search: EMPTY,
  from: EMPTY,
  to: EMPTY,
  pricedOnly: false,
};

export const MarketExplorer = ({ catalog, provenance }: Props) => {
  const { t, locale } = useLanguage();
  const [filters, setFilters] = useState<Filters>(INITIAL);
  const [draft, setDraft] = useState('');
  const [sort, setSort] = useState<SortField>('observedOn');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const path = buildQuery(filters, page, pageSize, sort, direction);
  const { data, extra, loading, refreshing, error, reload } = useLiveData<MarketRecordPageView, ProvenanceView, MarketSourcesExtra>(path);

  const reports = extra?.sources ?? [];
  const records = data?.records ?? [];

  /** Selecting a commodity resets the unit and market, which belong to it. */
  const patch = (next: Partial<Filters>, toPage = 1) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(toPage);
  };

  const selectedCommodity = catalog.commodities.find((c) => c.name === filters.commodity) ?? null;
  const unitOptions = selectedCommodity ? selectedCommodity.units : [...new Set(catalog.commodities.flatMap((c) => c.units))].sort();
  const retailOptions = selectedCommodity ? selectedCommodity.retail : ['Retail', 'Wholesale'];
  const marketOptions = filters.region ? catalog.markets.filter((m) => m.admin1 === filters.region) : catalog.markets;

  const sortBy = (field: SortField) => {
    if (field === sort) setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(field);
      setDirection(field === 'observedOn' || field === 'price' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const exportCsv = () => {
    if (records.length === 0) return;
    const columns = [
      { header: 'commodity', value: (r: MarketRecordView) => r.commodity },
      { header: 'market', value: (r: MarketRecordView) => r.market },
      { header: 'region', value: (r: MarketRecordView) => r.admin1 },
      { header: 'zone', value: (r: MarketRecordView) => r.admin2 },
      { header: 'price', value: (r: MarketRecordView) => r.price },
      { header: 'currency', value: (r: MarketRecordView) => r.currency },
      { header: 'unit', value: (r: MarketRecordView) => r.unit },
      { header: 'price_type', value: (r: MarketRecordView) => r.retail },
      { header: 'data_quality', value: (r: MarketRecordView) => r.priceFlag },
      { header: 'observed_on', value: (r: MarketRecordView) => r.observedOn },
      { header: 'latitude', value: (r: MarketRecordView) => r.latitude },
      { header: 'longitude', value: (r: MarketRecordView) => r.longitude },
      { header: 'source', value: (r: MarketRecordView) => r.sourceName },
      { header: 'source_url', value: (r: MarketRecordView) => r.sourceUrl },
      { header: 'data_type', value: (r: MarketRecordView) => r.dataType },
      { header: 'retrieved_at', value: (r: MarketRecordView) => r.retrievedAt },
    ];
    downloadCsv(
      csvFileName('irshaye-market-prices', {
        commodity: filters.commodity,
        region: filters.region,
        page,
      }),
      toCsv(columns, records),
    );
  };

  const activeFilters = [
    filters.commodity,
    filters.unit,
    filters.retail,
    filters.region,
    filters.market,
    filters.sourceId,
    filters.search,
    filters.from,
    filters.to,
  ].filter((v) => v !== '').length + (filters.pricedOnly ? 1 : 0);

  return (
    <Panel
      title={t('markets.ex.title')}
      icon={SlidersHorizontal}
      hint={t('markets.ex.hint')}
      right={
        <div className="flex items-center gap-2">
          {refreshing && <Refreshing />}
          <Button
            variant="secondary"
            size="sm"
            onClick={exportCsv}
            disabled={records.length === 0}
            leading={<Download size={14} />}
            title={t('markets.ex.exportHint', { rows: records.length, page, pages: data?.pages ?? 1 })}
          >
            {t('markets.ex.export')}
          </Button>
          <Button variant="ghost" size="sm" onClick={reload} disabled={loading || refreshing}>
            {t('common.refresh')}
          </Button>
        </div>
      }
    >
      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          patch({ search: draft.trim() });
        }}
      >
        <Field label={t('markets.ex.search')} htmlFor="mk-search" className="sm:col-span-2 lg:col-span-1">
          <div className="relative">
            <Search size={14} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
            <Input
              id="mk-search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('markets.ex.searchPlaceholder')}
              className="pl-9"
            />
          </div>
        </Field>
        <Field label={t('markets.commodity')} htmlFor="mk-commodity">
          <Select
            id="mk-commodity"
            value={filters.commodity}
            onChange={(e) => patch({ commodity: e.target.value, unit: EMPTY, market: EMPTY })}
          >
            <option value="">{t('markets.ex.allCommodities')}</option>
            {[...new Set(catalog.commodities.map((c) => c.name))].map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('common.unit')} htmlFor="mk-unit">
          <Select id="mk-unit" value={filters.unit} onChange={(e) => patch({ unit: e.target.value })}>
            <option value="">{t('markets.ex.anyUnit')}</option>
            {unitOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('markets.ex.priceType')} htmlFor="mk-retail">
          <Select id="mk-retail" value={filters.retail} onChange={(e) => patch({ retail: e.target.value })}>
            <option value="">{t('markets.ex.anyPriceType')}</option>
            {retailOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('markets.region')} htmlFor="mk-region">
          <Select
            id="mk-region"
            value={filters.region}
            onChange={(e) => patch({ region: e.target.value, market: EMPTY })}
          >
            <option value="">{t('markets.allRegions')}</option>
            {catalog.regions.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('markets.thMarket')} htmlFor="mk-market">
          <Select id="mk-market" value={filters.market} onChange={(e) => patch({ market: e.target.value })}>
            <option value="">{t('markets.ex.allMarkets')}</option>
            {marketOptions.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('common.source')} htmlFor="mk-source">
          <Select id="mk-source" value={filters.sourceId} onChange={(e) => patch({ sourceId: e.target.value })}>
            <option value="">{t('markets.ex.allSources')}</option>
            {catalog.sources.map((s) => (
              <option key={s.sourceId} value={s.sourceId}>
                {s.sourceName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('markets.ex.surveyRange')} htmlFor="mk-from" hint={t('markets.ex.surveyRangeHint')}>
          <div className="flex items-center gap-2">
            <Input
              id="mk-from"
              type="date"
              value={filters.from}
              onChange={(e) => patch({ from: e.target.value })}
              className="h-10 text-[12.5px]"
              aria-label={t('markets.ex.fromDate')}
            />
            <span aria-hidden className="text-ink-faint">
              –
            </span>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => patch({ to: e.target.value })}
              className="h-10 text-[12.5px]"
              aria-label={t('markets.ex.toDate')}
            />
          </div>
        </Field>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" variant="quiet" size="sm">
            {t('common.apply')}
          </Button>
          <label className="flex items-center gap-2 text-[12px] font-semibold text-ink-muted">
            <input
              type="checkbox"
              checked={filters.pricedOnly}
              onChange={(e) => patch({ pricedOnly: e.target.checked })}
              className="h-4 w-4 rounded border-line-strong text-brand focus-visible:ring-2 focus-visible:ring-brand/60"
            />
            {t('markets.ex.pricedOnly')}
          </label>
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters(INITIAL);
                setDraft('');
              }}
            >
              {t('markets.ex.clear', { count: activeFilters })}
            </Button>
          )}
        </div>
      </form>

      {loading && <Loading label={t('markets.ex.loading')} className="mt-5" />}
      {!loading && error && (
        <div className="mt-5">
          <SourceUnavailable error={error} source={t('markets.ex.sourceLabel')} />
        </div>
      )}

      {!loading && !error && data && records.length === 0 && (
        <EmptyState
          icon={Search}
          title={t('markets.ex.emptyTitle')}
          hint={t('markets.ex.emptyHint')}
          className="mt-5"
          action={
            <Button variant="secondary" size="sm" onClick={() => { setFilters(INITIAL); setDraft(''); }}>
              {t('markets.ex.clearAll')}
            </Button>
          }
        />
      )}

      {data && records.length > 0 && (
        <>
          <div className="mt-5 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[900px] text-[12.5px]">
              <caption className="sr-only">{t('markets.ex.tableCaption')}</caption>
              <thead className="bg-canvas">
                <tr className="border-b border-line text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                  <SortHeader label={t('markets.commodity')} field="commodity" active={sort} direction={direction} onSort={sortBy} />
                  <SortHeader label={t('markets.thMarket')} field="market" active={sort} direction={direction} onSort={sortBy} />
                  <th scope="col" className="px-3 py-2.5 font-bold">{t('markets.ex.price')}</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">{t('markets.ex.quality')}</th>
                  <SortHeader label={t('common.newestObservation')} field="observedOn" active={sort} direction={direction} onSort={sortBy} />
                  <th scope="col" className="px-3 py-2.5 font-bold">{t('common.source')}</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">{t('markets.ex.freshness')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {records.map((r) => (
                  <tr key={r.id} className="align-top transition-colors hover:bg-canvas/70">
                    <td className="px-4 py-2.5 font-bold text-ink">
                      {r.commodity}
                      <span className="mt-0.5 block text-[10.5px] font-semibold text-ink-faint">{r.admin2 ?? r.category ?? '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted">
                      {r.market}
                      <span className="mt-0.5 block text-[10.5px] text-ink-faint">{r.admin1 ?? '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {r.price === null ? (
                        <span className="font-bold text-ink-faint" title={t('markets.ex.noFigure')}>
                          —
                        </span>
                      ) : (
                        <span className="tabular font-extrabold text-ink">
                          {fmt(r.price, r.price < 100 ? 1 : 0, locale)}{' '}
                          <span className="text-[11px] font-semibold text-ink-faint">{r.currency}</span>
                        </span>
                      )}
                      <span className="mt-0.5 block text-[10.5px] font-semibold text-ink-faint">
                        {t('markets.ex.perUnit', { unit: r.unit })}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-[11.5px] font-semibold text-ink-muted">{r.retail}</span>
                      <span className="mt-1 block">
                        <Badge tone={r.priceFlag === 'actual' ? 'brand' : 'gold'} className="text-[10px]">
                          {t(`markets.flag.${r.priceFlag}`)}
                        </Badge>
                      </span>
                    </td>
                    <td className="tabular px-3 py-2.5 whitespace-nowrap text-ink-muted">
                      {dayLabel(r.observedOn, locale)}
                      <span className="mt-0.5 block text-[10.5px] text-ink-faint">{r.observedOn}</span>
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted">
                      <a
                        href={r.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline decoration-line-strong underline-offset-2 hover:text-brand-hover"
                      >
                        {r.sourceName}
                      </a>
                      <span className="mt-0.5 block text-[10.5px] text-ink-faint">{t(`dataType.${r.dataType}`)}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <FreshnessBadge tier={r.freshness} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
              >
                {t('markets.ex.prev')}
              </Button>
              <span className="tabular text-[12px] font-bold text-ink-muted">
                {t('markets.ex.pageOf', { page: data.page, pages: data.pages })}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={data.page >= data.pages}
              >
                {t('markets.ex.next')}
              </Button>
            </div>
            <Field label={t('markets.ex.perPage')} htmlFor="mk-page-size" className="w-32">
              <Select
                id="mk-page-size"
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-9 text-[12.5px]"
              >
                {[25, 50, 100, 200].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-4 space-y-2.5 border-t border-line pt-4">
            <p className="tabular text-[12px] font-bold text-ink-muted">
              {t('markets.ex.matched', { total: fmtInt(data.total, locale) })}
            </p>
            <CoverageNote rows={data.total} withoutPrice={data.matchedWithoutPrice} />
            <p className="text-[11.5px] leading-relaxed text-ink-faint">
              {t('markets.ex.window', {
                newest: data.latestObservation ? dayLabel(data.latestObservation, locale) : '—',
                oldest: data.oldestObservation ? dayLabel(data.oldestObservation, locale) : '—',
              })}
            </p>
            <p className="text-[11.5px] leading-relaxed text-ink-faint">
              {t('markets.ex.exportHint', { rows: records.length, page: data.page, pages: data.pages })}
            </p>
            {data.records.some((r) => r.freshness === 'stale' || r.freshness === 'historical') && (
              <StateNotice tone="gold" title={t('markets.ex.staleTitle')}>
                {t('markets.ex.staleBody')}
              </StateNotice>
            )}
            <ProvenanceLabel provenance={provenance} />
            <ContributingSources reports={reports} />
          </div>
        </>
      )}
    </Panel>
  );
};

const SortHeader = ({
  label,
  field,
  active,
  direction,
  onSort,
}: {
  label: string;
  field: SortField;
  active: SortField;
  direction: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}) => {
  const { t } = useLanguage();
  const isActive = active === field;
  return (
    <th scope="col" className="px-3 py-2.5 font-bold first:pl-4">
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-ink"
        aria-label={t('markets.ex.sortAria', { label })}
      >
        {label}
        <span aria-hidden className={isActive ? 'text-brand-700 dark:text-brand-300' : 'opacity-30'}>
          {isActive && direction === 'asc' ? '↑' : '↓'}
        </span>
      </button>
    </th>
  );
};
