'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import type { IconType } from '@/components/ui/Card';

/** Shimmer block shaped like the content that will replace it. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('skeleton rounded-lg', className)} style={style} />;
}

/** Skeleton sized like a panel body, so a loading page keeps its layout. */
export function SkeletonPanel({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-3.5" style={{ width: `${92 - i * 9}%` }} />
      ))}
    </div>
  );
}

export function Loading({ label, className }: { label?: string; className?: string }) {
  const { t } = useLanguage();
  return (
    <div className={cn('flex items-center gap-2.5 py-6 text-[13px] font-semibold text-ink-muted', className)}>
      <Loader2 size={15} className="animate-spin text-brand-600 dark:text-brand-400" />
      {(label ?? t('common.loading')) + '…'}
    </div>
  );
}

export function Refreshing({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-700 uppercase dark:text-brand-300',
        className,
      )}
    >
      <Loader2 size={10} className="animate-spin" />
      {t('common.updating')}
    </span>
  );
}

/**
 * Nothing to show, stated plainly. Used when a publisher genuinely has no rows —
 * the alternative is an empty box that looks broken.
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: {
  icon: IconType;
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong bg-canvas/60 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface text-ink-faint ring-1 ring-line">
        <Icon size={20} />
      </span>
      <p className="text-sm font-bold text-ink">{title}</p>
      {hint && <p className="max-w-md text-[12px] leading-relaxed text-ink-faint">{hint}</p>}
      {action}
    </div>
  );
}

/**
 * A callout that carries a real state: unavailable source, missing configuration,
 * a computed value the platform derived rather than received. Never decorative.
 */
export function StateNotice({
  tone = 'clay',
  title,
  icon: Icon,
  code,
  children,
  className,
}: {
  tone?: 'clay' | 'gold' | 'brand' | 'info';
  title: string;
  icon?: IconType;
  code?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { t } = useLanguage();
  const map = {
    clay: 'border-clay/30 bg-clay-soft/70 text-clay-700 dark:text-clay-300',
    gold: 'border-gold/30 bg-gold-soft/70 text-gold-700 dark:text-gold-300',
    brand: 'border-brand/25 bg-brand-soft/70 text-brand-800 dark:text-brand-200',
    info: 'border-slate-blue-500/25 bg-info-soft/70 text-slate-blue-700 dark:text-slate-blue-300',
  } as const;

  const bodyTone =
    tone === 'clay'
      ? 'text-clay-800/90 dark:text-clay-200'
      : tone === 'gold'
        ? 'text-gold-700 dark:text-gold-200'
        : tone === 'brand'
          ? 'text-brand-900 dark:text-brand-100'
          : 'text-slate-blue-700 dark:text-slate-blue-200';

  return (
    <div className={cn('rounded-xl border px-4 py-3.5', map[tone], className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="shrink-0" />}
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{title}</p>
      </div>
      {children && <div className={cn('mt-2 text-[13px] leading-relaxed', bodyTone)}>{children}</div>}
      {code && (
        <p className="mt-2 text-[11px] text-ink-faint">
          {t('states.codeLabel')} <code className="rounded bg-surface/70 px-1 py-0.5 font-mono text-[10px]">{code}</code>.{' '}
          {t('states.codeNoSubstitute')}
        </p>
      )}
    </div>
  );
}
