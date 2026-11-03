import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-ink shadow-[0_1px_2px_oklch(0.2_0.03_155/20%)] hover:bg-brand-hover hover:shadow-brand active:translate-y-px',
  secondary: 'border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-sunken',
  accent: 'border border-gold/30 bg-gold-soft text-gold-700 hover:border-gold/50 dark:text-gold-300',
  ghost: 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
  quiet: 'bg-brand-soft text-brand-800 hover:bg-brand-100 dark:text-brand-200 dark:hover:bg-brand-soft/70',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
  icon: 'h-10 w-10',
};

export const buttonClasses = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string): string =>
  cn(BASE, VARIANTS[variant], SIZES[size], className);

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  trailing?: ReactNode;
  leading?: ReactNode;
};

export function Button({ variant = 'primary', size = 'md', className, leading, trailing, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {leading}
      {children}
      {trailing}
    </button>
  );
}

export type ButtonLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, 'className'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  leading,
  trailing,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {leading}
      {children}
      {trailing}
    </Link>
  );
}
