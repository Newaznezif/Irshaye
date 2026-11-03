import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconType = LucideIcon;

/** Plain bordered surface — the container every other card is built from. */
export function Card({ className, children, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface shadow-card', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * The one panel anatomy used across all eight modules: an optional header row with a
 * title, an explanatory hint and a right-aligned action slot, a padded body, and an
 * optional footer strip for provenance. Padding and rhythm are fixed here so pages
 * cannot drift apart.
 */
export function Panel({
  title,
  hint,
  icon: Icon,
  right,
  footer,
  flush = false,
  className,
  bodyClassName,
  children,
  id,
}: {
  title?: ReactNode;
  hint?: ReactNode;
  icon?: IconType;
  right?: ReactNode;
  footer?: ReactNode;
  /** Body carries its own padding — for tables and charts that need to reach the edge. */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  id?: string;
}) {
  const hasHeader = Boolean(title || hint || right || Icon);

  return (
    <section
      id={id}
      className={cn('overflow-hidden rounded-2xl border border-line bg-surface shadow-panel', className)}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-line px-5 py-4 md:px-6">
          <div className="min-w-0 flex-1 basis-[13rem]">
            <div className="flex items-center gap-2.5">
              {Icon && (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-700 ring-1 ring-inset ring-brand/15 dark:text-brand-300">
                  <Icon size={15} strokeWidth={2.2} />
                </span>
              )}
              {title && (
                <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted">{title}</h2>
              )}
            </div>
            {hint && <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-faint">{hint}</p>}
          </div>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </header>
      )}

      <div className={cn(flush ? undefined : 'px-5 py-5 md:px-6', bodyClassName)}>{children}</div>

      {footer && <div className="border-t border-line bg-canvas/50 px-5 py-3.5 md:px-6">{footer}</div>}
    </section>
  );
}

/** Compact inset tile for a single figure. Sits in grids; equal height by design. */
export function Metric({
  label,
  value,
  unit,
  note,
  tone,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  note?: ReactNode;
  tone?: 'good' | 'bad' | 'warn' | 'info';
  className?: string;
}) {
  const valueTone =
    tone === 'good'
      ? 'text-brand-700 dark:text-brand-300'
      : tone === 'bad'
        ? 'text-clay-600 dark:text-clay-300'
        : tone === 'warn'
          ? 'text-gold-700 dark:text-gold-300'
          : tone === 'info'
            ? 'text-slate-blue-600 dark:text-slate-blue-400'
            : 'text-ink';

  return (
    <div
      className={cn(
        'flex h-full flex-col justify-between rounded-xl border border-line bg-canvas/70 p-3.5 transition-colors hover:border-line-strong',
        className,
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className="mt-2 flex items-baseline gap-1">
        <span className={cn('tabular text-xl leading-none font-extrabold tracking-tight', valueTone)}>{value}</span>
        {unit && <span className="text-[11px] font-semibold text-ink-faint">{unit}</span>}
      </p>
      {note && <p className="mt-2 text-[11px] leading-snug text-ink-faint">{note}</p>}
    </div>
  );
}

/** KPI tile for the overview band: icon, label, value and one supporting line. */
export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  supporting,
  tone = 'brand',
  className,
}: {
  icon: IconType;
  label: string;
  value: ReactNode;
  unit?: string;
  supporting?: ReactNode;
  tone?: 'brand' | 'gold' | 'clay' | 'info';
  className?: string;
}) {
  const tint =
    tone === 'brand'
      ? 'bg-brand-soft text-brand-700 dark:text-brand-300'
      : tone === 'gold'
        ? 'bg-gold-soft text-gold-700 dark:text-gold-300'
        : tone === 'clay'
          ? 'bg-clay-soft text-clay-700 dark:text-clay-300'
          : 'bg-info-soft text-slate-blue-600 dark:text-slate-blue-400';

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', tint)}>
          <Icon size={17} strokeWidth={2.2} />
        </span>
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="tabular text-[28px] leading-none font-extrabold tracking-tight text-ink">{value}</span>
        {unit && <span className="text-xs font-bold text-ink-faint">{unit}</span>}
      </p>
      {supporting && <div className="mt-auto text-[12px] leading-snug text-ink-muted">{supporting}</div>}
    </div>
  );
}

/** Two-column definition row used for settings, source metadata and evidence lists. */
export function DataRow({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-b border-line py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6',
        className,
      )}
    >
      <dt className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">{label}</dt>
      <dd className="min-w-0 text-sm font-semibold text-ink sm:text-right">{children}</dd>
    </div>
  );
}
