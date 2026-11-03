import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'brand' | 'gold' | 'clay' | 'info' | 'plum' | 'neutral' | 'outline';

const TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-soft text-brand-800 ring-brand/20 dark:text-brand-200',
  gold: 'bg-gold-soft text-gold-700 ring-gold/25 dark:text-gold-300',
  clay: 'bg-clay-soft text-clay-700 ring-clay/25 dark:text-clay-300',
  info: 'bg-info-soft text-slate-blue-700 ring-slate-blue-500/25 dark:text-info',
  plum: 'bg-plum-soft text-plum ring-plum/25',
  neutral: 'bg-surface-sunken text-ink-muted ring-line-strong/60',
  outline: 'bg-transparent text-ink-muted ring-line-strong',
};

const DOT_TONES: Partial<Record<BadgeTone, string>> = {
  brand: 'bg-brand',
  gold: 'bg-gold',
  clay: 'bg-clay',
  info: 'bg-info',
  plum: 'bg-plum',
  neutral: 'bg-ink-faint',
};

export function Badge({
  tone = 'neutral',
  dot,
  className,
  children,
  title,
}: {
  tone?: BadgeTone;
  /** Renders a status dot before the label; pass a colour class or omit for the tone colour. */
  dot?: boolean | string;
  className?: string;
  children: ReactNode;
  title?: string;
}) {
  const dotClass = typeof dot === 'string' ? dot : (DOT_TONES[tone] ?? 'bg-ink-faint');

  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClass)} />}
      {children}
    </span>
  );
}

/** Micro section label used above grouped content; the one typographic voice of the system. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint', className)}>{children}</p>
  );
}
