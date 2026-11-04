'use client';

import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export type SegmentOption<T extends string> = { value: T; label: string };

/**
 * The one segmented filter in the system — commodity, source scope and any other
 * small mutually exclusive choice. `role=radiogroup` is only honest if the group
 * behaves like one: a single tab stop, arrows to move, and the move commits the
 * choice, which is what WAI-ARIA says a radio does.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group. */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const refs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});
  const activeIndex = options.findIndex((o) => o.value === value);

  const select = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    refs.current[option.value]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = options.length - 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      select(index >= last ? 0 : index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      select(index <= 0 ? last : index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(last);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-canvas/70 p-1', className)}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        // A value outside the list (an empty filter, for instance) must not leave
        // the group with no tab stop at all.
        const tabStop = activeIndex === -1 ? index === 0 : index === activeIndex;
        return (
          <button
            key={option.value}
            type="button"
            ref={(el) => {
              refs.current[option.value] = el;
            }}
            role="radio"
            aria-checked={active}
            tabIndex={tabStop ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'rounded-lg font-bold transition-all duration-200',
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-[12.5px]',
              active
                ? 'bg-brand text-brand-ink shadow-[0_1px_2px_oklch(0.2_0.03_155/25%)]'
                : 'text-ink-muted hover:bg-surface hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
