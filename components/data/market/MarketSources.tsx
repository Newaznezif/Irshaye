'use client';
import React from 'react';
import { Database, ExternalLink, ShieldAlert } from 'lucide-react';

import { Badge, DataRow, Panel, SectionLabel, StateNotice, stamp } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { SourceStateBadge } from './parts';
import type { MarketSourceReport } from './types';

/**
 * Source transparency (§5G), stated per publisher rather than per module.
 *
 * The distinction this panel exists to make is the one a status code cannot: a source can be
 * answering and behind schedule, reachable and refusing our automated download, or offline.
 * Those three need different responses from a reader, and only the first of them is a data
 * problem. Nothing here is a configuration flag — every line is what this deployment's own
 * request to that publisher returned.
 */

interface Props {
  reports: MarketSourceReport[];
}

const days = (seconds: number | null): string | null =>
  seconds === null ? null : `${Math.max(0, Math.round(seconds / 86_400))}`;

const bytes = (size: number | null, locale: string): string => {
  if (size === null || !Number.isFinite(size)) return '—';
  const mb = size / 1_048_576;
  if (mb < 1) return `${Math.round(size / 1_024).toLocaleString(locale)} KB`;
  return `${mb.toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
};

export const MarketSources = ({ reports }: Props) => {
  const { t, locale } = useLanguage();
  const answering = reports.filter((r) => r.rows > 0);
  const refusing = reports.filter((r) => r.accessChallenged);
  const silent = reports.filter((r) => r.rows === 0 && !r.accessChallenged);

  return (
    <Panel
      title={t('markets.src.title')}
      icon={Database}
      hint={t('markets.src.hint')}
      right={
        <div className="flex items-center gap-2">
          <Badge tone="brand">{t('markets.src.answering', { count: answering.length })}</Badge>
          <Badge tone="clay">{t('markets.src.refusing', { refused: refusing.length, silent: silent.length })}</Badge>
        </div>
      }
    >
      {reports.length === 0 && <p className="text-[12.5px] text-ink-muted">{t('markets.src.none')}</p>}

      <div className="space-y-4">
        {reports.map((report) => {
          const observationAge = days(report.observationAgeSeconds);
          const retrievalAge = days(report.retrievalAgeSeconds);
          const catalogue = report.catalogue;

          return (
            <article key={report.sourceId} className="rounded-2xl border border-line bg-canvas/60 p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-ink">
                    {report.sourceName}
                    {report.accessChallenged && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-clay-700 dark:text-clay-300">
                        <ShieldAlert size={12} />
                        {t('markets.src.chip')}
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{report.license}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <SourceStateBadge report={report} />
                  <a
                    href={report.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-700 underline decoration-brand/30 underline-offset-2 hover:text-brand-hover dark:text-brand-300"
                  >
                    {t('markets.src.publisherSite')}
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              {report.rows === 0 && (
                <StateNotice
                  tone={report.accessChallenged ? 'gold' : 'clay'}
                  title={report.accessChallenged ? t('markets.src.challengeTitle') : t('markets.src.outageTitle')}
                  className="mt-4"
                  code={report.code ?? undefined}
                >
                  {report.accessChallenged ? t('markets.src.challengeBody') : t('markets.src.outageBody')}
                </StateNotice>
              )}

              <dl className="mt-4">
                <DataRow label={t('common.cadence')}>
                  <span className="text-[12.5px]">{t(`cadence.${report.cadence}`)}</span>
                </DataRow>
                <DataRow label={t('markets.src.rows')}>
                  <span className="tabular text-[12.5px]">
                    {report.rows.toLocaleString(locale)}
                    {report.publishedRows !== null && report.publishedRows !== report.rows
                      ? ` / ${report.publishedRows.toLocaleString(locale)} ${t('markets.src.publishedCount')}`
                      : ''}
                    {report.truncated && <span className="ml-2 text-clay-600 dark:text-clay-300">{t('markets.src.truncated')}</span>}
                  </span>
                </DataRow>
                {report.excludedRows !== null && (
                  <DataRow label={t('markets.src.excluded')}>
                    <span className="tabular text-[12.5px] text-ink-muted">
                      {report.excludedRows.toLocaleString(locale)}
                      <span className="ml-2 text-[11px] text-ink-faint">{t('markets.src.excludedNote')}</span>
                    </span>
                  </DataRow>
                )}
                <DataRow label={t('markets.src.coverage')}>
                  <span className="text-[12.5px] text-ink-muted">{report.coverage}</span>
                </DataRow>
                <DataRow label={t('common.newestObservation')}>
                  <span className="tabular text-[12.5px]">
                    {report.latestObservation ?? '—'}
                    {observationAge !== null && (
                      <span className="ml-2 text-[11px] text-ink-faint">
                        {t('markets.src.ageDays', { days: observationAge })}
                      </span>
                    )}
                  </span>
                </DataRow>
                {report.earliestObservation && (
                  <DataRow label={t('markets.src.oldestObservation')}>
                    <span className="tabular text-[12.5px] text-ink-muted">{report.earliestObservation}</span>
                  </DataRow>
                )}
                <DataRow label={t('markets.src.retrieved')}>
                  <span className="text-[12.5px] text-ink-muted">
                    {stamp(report.retrievedAt, locale)}
                    {retrievalAge !== null && (
                      <span className="ml-2 text-[11px]">
                        {t('markets.src.retrievalAge', { days: retrievalAge })}
                      </span>
                    )}
                  </span>
                </DataRow>
                <DataRow label={t('markets.src.dataType')}>
                  <span className="text-[12.5px] text-ink-muted">{t(`dataType.${report.dataType}`)}</span>
                </DataRow>
              </dl>

              {catalogue && (
                <div className="mt-4 border-t border-line pt-4">
                  <SectionLabel>{t('markets.src.catalogue')}</SectionLabel>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">
                    {catalogue.reachable
                      ? t('markets.src.catalogueReachable', {
                          modified: catalogue.metadataModified ? stamp(catalogue.metadataModified, locale) : t('common.unknown'),
                        })
                      : t('markets.src.catalogueUnreachable')}
                  </p>
                  {catalogue.resources.length > 0 && (
                    <ul className="mt-2.5 space-y-1.5">
                      {catalogue.resources.slice(0, 6).map((r) => (
                        <li key={r.name} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[11.5px] text-ink-muted">
                          <span className="font-bold text-ink">{r.name}</span>
                          <span className="font-mono text-[10px] uppercase text-ink-faint">{r.format}</span>
                          <span className="tabular">{bytes(r.sizeBytes, locale)}</span>
                          <span className="tabular text-ink-faint">
                            {r.lastModified ? stamp(r.lastModified, locale) : t('markets.src.notStated')}
                          </span>
                          <span className="text-ink-faint">
                            {r.datastoreActive ? t('markets.src.rowPaging') : t('markets.src.fileOnly')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <StateNotice tone="info" title={t('markets.src.httpTitle')} className="mt-5">
        {t('markets.src.httpBody')}
      </StateNotice>
    </Panel>
  );
};
