import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IconType } from '@/components/ui/Card';

const CONTROL =
  'w-full rounded-xl border border-line bg-surface text-sm font-semibold text-ink transition-colors placeholder:font-normal placeholder:text-ink-faint hover:border-line-strong focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60';

/** Label + control + hint, aligned the same way wherever a form appears. */
export function Field({
  label,
  htmlFor,
  hint,
  icon: Icon,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  icon?: IconType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint"
      >
        {Icon && <Icon size={12} className="text-brand-600 dark:text-brand-400" />}
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">{hint}</p>}
    </div>
  );
}

export type SelectProps = ComponentPropsWithoutRef<'select'>;

export function Select({ className, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select className={cn(CONTROL, 'h-10 appearance-none pr-9 pl-3', className)} {...rest} />
      <ChevronDown
        size={15}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-faint"
      />
    </div>
  );
}

export type InputProps = ComponentPropsWithoutRef<'input'>;

export function Input({ className, ...rest }: InputProps) {
  return <input className={cn(CONTROL, 'h-10 px-3 tabular', className)} {...rest} />;
}

export type TextareaProps = ComponentPropsWithoutRef<'textarea'>;

export function Textarea({ className, ...rest }: TextareaProps) {
  return <textarea className={cn(CONTROL, 'resize-y px-3.5 py-3 leading-relaxed', className)} {...rest} />;
}
