'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'irshaye.theme';

export function applyThemeClass(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
}

/**
 * Dark mode without next-themes. The stored/system preference can only be
 * known on the client, so the first paint uses the light tokens and the class
 * is applied on mount — `<html>` carries suppressHydrationWarning for that
 * single intentional attribute divergence.
 */
export function useTheme(): { dark: boolean | null; toggle: () => void } {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial =
      stored === 'dark' ||
      (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    applyThemeClass(initial);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only preference applied after first paint
    setDark(initial);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      applyThemeClass(next);
      window.localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  return { dark, toggle };
}
