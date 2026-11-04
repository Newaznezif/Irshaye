'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { SelectedPlace } from '@/components/data/LocationPicker';

/**
 * The farmer's working context: which place and which crop the session is about.
 * Persisted locally so the workflow survives a refresh; nothing here is sent
 * anywhere except as an explicit parameter to the data routes.
 */

const DEFAULT_PLACE: SelectedPlace = {
  name: 'Addis Ababa',
  admin1: 'Addis Ababa',
  admin2: null,
  latitude: 9.0204,
  longitude: 38.7468,
};

const STORAGE_KEY = 'irshaye.workbench.v1';

type Stored = { place: SelectedPlace; cropId: string };

const DEFAULTS: Stored = { place: DEFAULT_PLACE, cropId: 'teff' };

function parse(raw: string | null): Stored {
  if (!raw) return DEFAULTS;
  let saved: Partial<Stored> | null = null;
  try {
    saved = JSON.parse(raw) as Partial<Stored>;
  } catch {
    /* a corrupt saved value falls back to defaults; the workflow still works */
    return DEFAULTS;
  }
  const place = saved?.place;
  return {
    place:
      place &&
      typeof place.latitude === 'number' &&
      typeof place.longitude === 'number' &&
      typeof place.name === 'string'
        ? place
        : DEFAULTS.place,
    cropId: typeof saved?.cropId === 'string' ? saved.cropId : DEFAULTS.cropId,
  };
}

/**
 * localStorage is an external store, so the context reads it through
 * useSyncExternalStore rather than copying it into component state after mount.
 * The cached parse keeps the snapshot referentially stable, which is what that
 * hook requires.
 */
let snapshot: Stored = DEFAULTS;
let snapshotRaw: string | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Stored {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return snapshot;
  }
  if (raw !== snapshotRaw) {
    snapshotRaw = raw;
    snapshot = parse(raw);
  }
  return snapshot;
}

function getServerSnapshot(): Stored {
  return DEFAULTS;
}

function writeSnapshot(next: Stored): void {
  snapshot = next;
  snapshotRaw = JSON.stringify(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, snapshotRaw);
  } catch {
    /* private mode or a full quota: the session simply does not persist */
  }
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function subscribeNoop(): () => void {
  return () => {};
}

const getTrue = () => true;
const getFalse = () => false;

type Workbench = {
  place: SelectedPlace;
  cropId: string;
  setPlace: (place: SelectedPlace) => void;
  setCropId: (cropId: string) => void;
  ready: boolean;
};

const WorkbenchContext = createContext<Workbench | null>(null);

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribeNoop, getTrue, getFalse);

  const setPlace = useCallback((place: SelectedPlace) => {
    writeSnapshot({ place, cropId: getSnapshot().cropId });
  }, []);

  const setCropId = useCallback((cropId: string) => {
    writeSnapshot({ place: getSnapshot().place, cropId });
  }, []);

  const value = useMemo(
    () => ({ place: stored.place, cropId: stored.cropId, setPlace, setCropId, ready }),
    [stored.place, stored.cropId, setPlace, setCropId, ready],
  );

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
}

export function useWorkbench(): Workbench {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) throw new Error('useWorkbench must be used inside WorkbenchProvider');
  return ctx;
}
