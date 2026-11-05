'use client';
import React from 'react';
import { Badge } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { FRESHNESS_TONE, SOURCE_STATE_TONE, type FreshnessTier, type MarketSourceReport } from './types';

/**
 * Small pieces shared by the market views. Kept here rather than duplicated per panel:
 * a freshness tier must read the same way in the explorer, the chart and the source
 * report, and five locales must translate one string for it, not five.
 */

export const FreshnessBadge = ({ tier }: { tier: FreshnessTier }) => {
  const { t } = useLanguage();
  return (
    <Badge tone={FRESHNESS_TONE[tier]} className="text-[10px]">
      {t(`freshness.${tier}`)}
    </Badge>
  );
};

/**
 * `accessChallenged` gets its own label: a publisher that is reachable and refusing
 * automation is a different fact from one that is offline, and the reader needs the
 * difference to know whether to wait or to go looking for another source.
 */
export const SourceStateBadge = ({ report }: { report: MarketSourceReport }) => {
  const { t } = useLanguage();
  const label = report.accessChallenged ? t('markets.state.access_challenged') : t(`statusLabel.${report.state}`);
  return (
    <Badge tone={SOURCE_STATE_TONE[report.state]} dot title={report.code ?? undefined}>
      {label}
    </Badge>
  );
};

/** Which publishers' rows are in this answer, and where to read their terms. */
export const ContributingSources = ({ reports }: { reports: MarketSourceReport[] }) => {
  const { t } = useLanguage();
  const contributing = reports.filter((r) => r.rows > 0);
  if (contributing.length === 0) return null;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[11px] text-ink-faint">
      <span className="font-bold uppercase tracking-[0.12em]">{t('markets.contributing')}</span>
      {contributing.map((r) => (
        <a
          key={r.sourceId}
          href={r.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-700 underline decoration-brand/30 underline-offset-2 transition-colors hover:text-brand-hover dark:text-brand-300"
        >
          {r.sourceName}
        </a>
      ))}
    </p>
  );
};

/** The row count a filtered answer carries, with the price-less rows named rather than hidden. */
export const CoverageNote = ({ rows, withoutPrice }: { rows: number; withoutPrice: number }) => {
  const { t, locale } = useLanguage();
  return (
    <p className="text-[11.5px] leading-relaxed text-ink-faint">
      {withoutPrice > 0
        ? t('markets.coverageWithGaps', {
            rows: rows.toLocaleString(locale),
            gaps: withoutPrice.toLocaleString(locale),
          })
        : t('markets.coverageClean', { rows: rows.toLocaleString(locale) })}
    </p>
  );
};
