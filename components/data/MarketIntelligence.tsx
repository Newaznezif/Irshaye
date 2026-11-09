'use client';
import React, { useState } from 'react';
import { RefreshCw, Store } from 'lucide-react';

import { SourceUnavailable, type ProvenanceView } from '@/components/data/ProvenanceLabel';
import { Badge, Button, PageHeader, Panel, Refreshing, SegmentedControl } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { useLiveData } from '@/hooks/useLiveData';
import { MarketExchange } from './market/MarketExchange';
import { MarketExplorer } from './market/MarketExplorer';
import { MarketHistory } from './market/MarketHistory';
import { MarketInsights } from './market/MarketInsights';
import { MarketOverview } from './market/MarketOverview';
import { MarketRegions } from './market/MarketRegions';
import { MarketSources } from './market/MarketSources';
import type { MarketCatalogView, MarketSourcesExtra, MarketSummaryView } from './market/types';

/**
 * Market Intelligence: Ethiopian agricultural prices as published, with the publisher,
 * survey date, unit, currency and freshness travelling with every figure.
 *
 * One `mode=summary` request at the top of the page supplies both the overview and the
 * catalogue the other views build their filter lists from — so a filter can only ever name
 * a commodity, region, market or unit a survey actually reported. The commodity list is
 * therefore read from live rows, never hardcoded: a target commodity no publisher surveyed
 * does not appear as a clickable option, and no price is invented for it.
 *
 * Each tab fetches only when it is shown, which keeps the number of upstream reads bounded,
 * and every view keeps its own unavailable state. One publisher failing never takes the
 * module down: `lib/data/marketService.ts` loads each survey independently and reports the
 * answer per publisher, which the Sources tab renders.
 */

type Tab = 'overview' | 'prices' | 'history' | 'regions' | 'insights' | 'exchange' | 'sources';

interface SummaryPayload {
  summary: MarketSummaryView;
  catalog: MarketCatalogView;
}

export const MarketIntelligence = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('overview');

  const root = useLiveData<SummaryPayload, ProvenanceView, MarketSourcesExtra>('/api/data/markets?mode=summary&movers=4');
  const reports = root.extra?.sources ?? [];

  const hasData = root.data !== null;
  const anyRefreshing = root.refreshing;

  const tabs: { value: Tab; label: string }[] = [
    { value: 'overview', label: t('markets.tab.overview') },
    { value: 'prices', label: t('markets.tab.prices') },
    { value: 'history', label: t('markets.tab.history') },
    { value: 'regions', label: t('markets.tab.regions') },
    { value: 'insights', label: t('markets.tab.insights') },
    { value: 'exchange', label: t('markets.tab.exchange') },
    { value: 'sources', label: t('markets.tab.sources') },
  ];

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
          ) : hasData ? (
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
            onClick={root.reload}
            disabled={root.loading || anyRefreshing}
            leading={<RefreshCw size={14} className={anyRefreshing ? 'animate-spin' : undefined} />}
          >
            {t('common.refreshAll')}
          </Button>
        }
      />

      {hasData && (
        <SegmentedControl
          label={t('markets.sectionPicker')}
          value={tab}
          onChange={setTab}
          options={tabs}
          className="w-full justify-start overflow-x-auto"
        />
      )}

      {root.loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      )}

      {!root.loading && root.error && (
        <>
          <Panel title={t('markets.unavailableTitle')}>
            <SourceUnavailable error={root.error} source={t('markets.publishers')} />
            <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">{t('markets.unavailableBody')}</p>
          </Panel>
          {reports.length > 0 && <MarketSources reports={reports} />}
        </>
      )}

      {root.data && tab === 'overview' && (
        <MarketOverview
          summary={root.data.summary}
          catalog={root.data.catalog}
          reports={reports}
          provenance={root.provenance}
          refreshing={anyRefreshing}
          onOpen={setTab}
        />
      )}
      {root.data && tab === 'prices' && (
        <MarketExplorer catalog={root.data.catalog} provenance={root.provenance} />
      )}
      {root.data && tab === 'history' && (
        <MarketHistory
          catalog={root.data.catalog}
          supportedGranularity={root.data.summary.supportedGranularity}
          provenance={root.provenance}
        />
      )}
      {root.data && tab === 'regions' && (
        <MarketRegions catalog={root.data.catalog} provenance={root.provenance} />
      )}
      {root.data && tab === 'insights' && <MarketInsights provenance={root.provenance} />}
      {tab === 'exchange' && <MarketExchange />}
      {tab === 'sources' && <MarketSources reports={reports} />}
    </div>
  );
};
