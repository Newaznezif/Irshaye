'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { LANGUAGE_META, LANGUAGE_ORDER } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * The language control that sits beside the theme toggle.
 *
 * A menu of radio items rather than a native `<select>`: the native control
 * cannot show each language in its own script alongside its English name, and
 * its popup is styled by the operating system, which would break the design
 * system in five different ways.
 *
 * Focus follows the arrow keys inside the open menu, Escape returns focus to the
 * trigger, and the trigger keeps its own tab stop — so the control is reachable
 * and operable without a pointer.
 */
export function LanguageSelector({
  className,
  tone = 'default',
}: {
  className?: string;
  /** `onDark` is for the landing header, which sits on the brand-950 hero. */
  tone?: 'default' | 'onDark';
}) {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Anything outside the control dismisses the menu, including a click on the
  // trigger itself, which its own handler then reopens.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[active]?.focus();
  }, [open, active]);

  const openMenu = () => {
    const index = LANGUAGE_ORDER.indexOf(lang);
    setActive(index === -1 ? 0 : index);
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const choose = (code: (typeof LANGUAGE_ORDER)[number]) => {
    setLang(code);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const last = LANGUAGE_ORDER.length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(active >= last ? 0 : active + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(active <= 0 ? last : active - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(last);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  const current = LANGUAGE_META[lang];

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openMenu();
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="irshaye-language-menu"
        aria-label={t('a11y.chooseLanguage')}
        title={`${t('shell.language')}: ${current.englishName}`}
        className={cn(
          'flex h-9 items-center gap-2 rounded-xl border px-2.5 text-[12.5px] font-bold transition-colors',
          tone === 'onDark'
            ? 'border-white/20 bg-white/10 text-brand-50 hover:border-white/45 hover:text-white'
            : 'bg-surface text-ink-muted hover:border-line-strong hover:text-brand-700 dark:hover:text-brand-300',
          tone === 'onDark' ? (open ? 'border-white/50 text-white' : '') : open ? 'border-brand/60 text-ink' : 'border-line',
        )}
      >
        <Globe size={16} className="shrink-0" aria-hidden />
        <span className="hidden min-w-0 truncate text-[12.5px] font-bold sm:inline">{current.nativeName}</span>
        <span className="text-[11.5px] font-bold sm:hidden">{current.short}</span>
        <ChevronDown
          size={13}
          aria-hidden
          className={cn('shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          id="irshaye-language-menu"
          role="menu"
          aria-label={t('a11y.chooseLanguage')}
          onKeyDown={onKeyDown}
          className="animate-rise absolute right-0 z-40 mt-2 w-[min(15rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-1 shadow-lift"
        >
          {LANGUAGE_ORDER.map((code, index) => {
            const meta = LANGUAGE_META[code];
            const selected = code === lang;
            return (
              <button
                key={code}
                type="button"
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                role="menuitemradio"
                aria-checked={selected}
                tabIndex={-1}
                onClick={() => choose(code)}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-brand/60',
                  active === index ? 'bg-brand-soft/70' : '',
                  selected ? 'text-brand-900 dark:text-brand-100' : 'text-ink',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold leading-tight">{meta.nativeName}</span>
                  {meta.englishName !== meta.nativeName && (
                    <span className="block truncate text-[10.5px] font-semibold text-ink-faint">
                      {meta.englishName}
                    </span>
                  )}
                </span>
                {selected && <Check size={15} className="shrink-0 text-brand-700 dark:text-brand-300" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
