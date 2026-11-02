'use client';

import { useEffect, useSyncExternalStore } from 'react';

/**
 * Theme preference is an external system (localStorage plus the OS media query),
 * so it is read through useSyncExternalStore rather than copied into each
 * component's own state. Two earlier copies of this hook drifted apart: the
 * settings panel rendered the class before the shell had applied it and reported
 * the wrong appearance. One store means every consumer sees the same truth.
 */

const STORAGE_KEY = 'irshaye.theme';

const listeners = new Set<() => void>();

function storedPreference(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveDark(): boolean {
  const stored = storedPreference();
  return stored === 'dark' || (stored !== 'light' && systemPrefersDark());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onMedia = () => listener();
  const onStorage = () => listener();
  media.addEventListener('change', onMedia);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', onMedia);
    window.removeEventListener('storage', onStorage);
  };
}

const getSnapshot = () => resolveDark();

/** The server cannot know a device preference, so it renders the light tokens. */
const getServerSnapshot = () => false;

function toggleTheme(): void {
  const next = !resolveDark();
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  } catch {
    /* storage unavailable: the toggle still applies for this page view */
  }
  for (const listener of [...listeners]) listener();
}

export function useTheme(): { dark: boolean; toggle: () => void } {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return { dark, toggle: toggleTheme };
}
