import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { IconType } from '@/components/ui/Card';

/**
 * The single page-header anatomy every module uses: eyebrow, title, one-sentence
 * description, optional live status, and a right-aligned action slot. Keeping it in
 * one place is what makes the eight pages read as one product.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  status,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  icon?: IconType;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 gap-4">
        {Icon && (
          <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-700 ring-1 ring-inset ring-brand/15 sm:grid dark:text-brand-300">
            <Icon size={21} strokeWidth={2.1} />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-bold tracking-[0.2em] text-brand-700 uppercase dark:text-brand-300">
              {eyebrow}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] text-ink md:text-[30px]">
              {title}
            </h1>
            {status}
          </div>
          {description && (
            <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-ink-muted">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
