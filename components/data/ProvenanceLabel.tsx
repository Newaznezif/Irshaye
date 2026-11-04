'use client';
import React from 'react';
import { CircleAlert, Database } from 'lucide-react';
import { Badge, StateNotice, type BadgeTone } from '@/components/ui';
import { stamp } from '@/components/ui/format';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

/**
 * Client-side mirror of the provenance block every data route returns.
 * Kept structural (not imported from `lib/data`) so page bundles do not pull
 * server code in; the fields are a subset and all optional-tolerant.
 */
export interface ProvenanceView {
  source: string;
  sourceUrl: string;
  retrievedAt: string;
  observedAt: string | null;
  valueKind: 'observed' | 'modeled' | 'forecast' | 'estimated' | 'imputed';
  units: string;
  methodology: string;
  quality: 'high' | 'medium' | 'low';
  coverage: string;
  stale: boolean;
  servedFromCache: boolean;
}

export interface SourceErrorView {
  code: string;
  message: string;
  status?: number;
}

/**
 * The classification is the product's core promise: a farmer must see at a glance
 * whether a number was measured, modelled, forecast, or derived by us. Each kind
 * keeps one colour across the whole application.
 */
const KIND: Record<ProvenanceView['valueKind'], BadgeTone> = {
  observed: 'brand',
  modeled: 'info',
  forecast: 'plum',
  estimated: 'gold',
  imputed: 'neutral',
};

interface Props {
  provenance: ProvenanceView | null;
  /** Short context shown before the source link, e.g. "Dessie · S. WELLO". */
  context?: string;
  compact?: boolean;
  /** For provenance set on a photograph or a dark band. */
  onDark?: boolean;
  className?: string;
}

/**
 * Every figure on the dashboard is followed by this block: who published it, when
 * it was observed, when we fetched it, and what kind of number it is. A cached
 * answer is labelled cached, and a late publication is labelled stale.
 */
export const ProvenanceLabel = ({ provenance, context, compact = false, onDark = false, className }: Props) => {
  const { t, locale } = useLanguage();
  const bodyClass = cn(
    'flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] leading-relaxed',
    onDark ? 'text-brand-50/80' : 'text-ink-faint',
    className,
  );

  if (!provenance) {
    return <p className={bodyClass}>{t('prov.noSource')}</p>;
  }

  const kind = provenance.valueKind ?? 'estimated';
  const separator = <span aria-hidden className={onDark ? 'text-brand-100/40' : 'text-line-strong'}>·</span>;

  return (
    <div className={bodyClass}>
      <Badge tone={KIND[kind] ?? KIND.estimated}>{t(`prov.kind.${kind}`)}</Badge>
      {provenance.stale && (
        <Badge tone="clay">
          <CircleAlert size={11} /> {t('prov.behindSchedule')}
        </Badge>
      )}
      {provenance.servedFromCache && (
        <Badge tone="neutral">
          <Database size={11} /> {t('prov.cachedCopy')}
        </Badge>
      )}
      <span className={cn('font-bold', onDark ? 'text-brand-50' : 'text-ink-muted')}>{provenance.source}</span>
      <a
        href={provenance.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'underline decoration-current/40 underline-offset-2 transition-colors',
          onDark ? 'hover:text-white' : 'hover:text-brand-700 dark:hover:text-brand-300',
        )}
      >
        {t('prov.sourceLink')}
      </a>
      {!compact && (
        <>
          {separator}
          <span>
            {t('prov.observedAt', { when: provenance.observedAt ? stamp(provenance.observedAt, locale) : t('prov.dateNotStated') })}
          </span>
          {separator}
          <span>{t('prov.fetchedAt', { when: stamp(provenance.retrievedAt, locale) })}</span>
          {separator}
          <span title={provenance.methodology}>{provenance.units}</span>
          {context && (
            <>
              {separator}
              <span>{context}</span>
            </>
          )}
        </>
      )}
    </div>
  );
};

/** Honest empty state: the reason, the source, and no invented number. */
export const SourceUnavailable = ({ error, source }: { error: SourceErrorView; source?: string }) => {
  const { t } = useLanguage();
  return (
    <StateNotice tone="clay" title={t('prov.notAvailable')} code={error.code}>
      <p>
        {source ? `${source}: ` : ''}
        {error.message}
      </p>
    </StateNotice>
  );
};

/**
 * Citation strip under any curated reference block: one link per publisher, or the
 * bare name when the reference has no resolvable URL. Callers pass their own
 * spacing so the strip can sit inline or below a divider. Source names are
 * citations and stay exactly as published.
 */
export function SourcesList({
  sources,
  label,
  className,
}: {
  sources: { name: string; url?: string; title?: string }[];
  label?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  if (sources.length === 0) return null;
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] text-ink-faint', className)}>
      <span className="font-bold uppercase tracking-[0.12em]">{label ?? t('common.sources')}</span>
      {sources.map((s, i) => (
        <span key={`${s.name}-${i}`}>
          {s.url ? (
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-700 underline-offset-2 transition-colors hover:text-brand-hover hover:underline dark:text-brand-300"
            >
              {s.title ?? s.name}
            </a>
          ) : (
            <span className="font-semibold text-ink-muted">{s.name}</span>
          )}
        </span>
      ))}
    </p>
  );
}
