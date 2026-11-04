'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { LANGUAGE_META, isLang, richParts, translate } from '@/lib/i18n';
import type { Lang, RichPart, TranslationKey, TranslationVars } from '@/lib/i18n';

/**
 * Language is an external system (localStorage), so it is read through
 * `useSyncExternalStore` exactly like `useTheme` reads the appearance. One store
 * means the header, the sidebar and every module agree on the current language,
 * and the two preferences stay independent of each other.
 *
 * The server cannot know a device preference, so it renders English and the
 * first client commit re-reads the stored value — the same technique that keeps
 * the theme free of hydration mismatch.
 */

const STORAGE_KEY = 'irshaye.lang';

const listeners = new Set<() => void>();

/** An unknown or absent stored value is English, never a crash and never a guess. */
export const parseLang = (value: string | null): Lang => (isLang(value) ? value : 'en');

function resolveLang(): Lang {
  try {
    return parseLang(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'en';
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

const getSnapshot = () => resolveLang();

const getServerSnapshot = (): Lang => 'en';

export function setLanguage(next: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable: the choice still applies for this page view */
  }
  for (const listener of [...listeners]) listener();
}

export function useLanguage(): {
  lang: Lang;
  locale: string;
  setLang: (next: Lang) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
  rich: (key: TranslationKey, vars?: TranslationVars) => RichPart[];
} {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // `<html lang>` drives the Ethiopic font selection and screen-reader language,
  // so it follows the choice rather than being hardcoded in the root layout.
  useEffect(() => {
    document.documentElement.lang = LANGUAGE_META[lang].htmlLang;
  }, [lang]);

  const t = (key: TranslationKey, vars?: TranslationVars) => translate(lang, key, vars);
  const rich = (key: TranslationKey, vars?: TranslationVars) => richParts(lang, key, vars);

  return { lang, locale: LANGUAGE_META[lang].intlLocale, setLang: setLanguage, t, rich };
}
