import type { SourceDescriptor } from './types';

/**
 * Freshness as a graded question, not a yes/no.
 *
 * `Provenance.stale` already answers "may this still be presented as current?".
 * A market reader needs the finer version: a price observed last month from a
 * monthly survey is *recent*, one observed fourteen months ago is a real
 * historical record but is not a reading of today, and a row with no usable
 * date must never be dressed up as either.
 *
 * Every threshold is derived from the publisher's own cadence plus its declared
 * release lag. Nothing here picks a nice round number out of the air: an annual
 * indicator is not stale because forty days passed, and a daily rate is.
 */

export type FreshnessTier = 'current' | 'recent' | 'stale' | 'historical' | 'unknown';

/** One publication cycle of the source, in seconds. `null` = the publisher has no fixed cycle. */
const INTERVAL_BY_CADENCE: Record<SourceDescriptor['cadence'], number | null> = {
  realtime: 5 * 60,
  hourly: 3_600,
  daily: 86_400,
  '8daily': 8 * 86_400,
  weekly: 7 * 86_400,
  monthly: 31 * 86_400,
  quarterly: 92 * 86_400,
  annual: 365 * 86_400,
  // Irregular publishers (boundary snapshots, one-off releases) have no cycle to
  // measure against, so their data is classified rather than graded.
  irregular: null,
};

/** Calendar days are counted from midnight UTC of the observation day, the same basis `sources.ts` uses. */
export const parseObservedAt = (observedAt: string | null | undefined): number | null => {
  if (!observedAt) return null;
  const iso = observedAt.length === 10 ? `${observedAt}T00:00:00Z` : observedAt;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

export interface Freshness {
  tier: FreshnessTier;
  /** Seconds between the observation and `now`; null when the observation date is unusable. */
  ageSeconds: number | null;
  /** The one publication cycle this classification is scaled against; null for irregular sources. */
  intervalSeconds: number | null;
}

export type FreshnessInput = Pick<SourceDescriptor, 'cadence' | 'publicationLagSeconds'>;

/**
 * `now` is injectable so the tiers are testable against a fixed clock instead of
 * the wall clock of whoever runs the suite.
 */
export function classifyFreshness(observedAt: string | null | undefined, source: FreshnessInput, now = Date.now()): Freshness {
  const intervalSeconds = INTERVAL_BY_CADENCE[source.cadence];
  const at = parseObservedAt(observedAt);
  if (at === null) return { tier: 'unknown', ageSeconds: null, intervalSeconds };

  const ageSeconds = Math.max(0, (now - at) / 1000);
  // The publisher's own release delay is not the data being old: ERA5 arriving a
  // week later is current data, and calling it stale would teach farmers to
  // distrust the one signal that is actually lagging.
  const lag = source.publicationLagSeconds ?? 0;
  if (intervalSeconds === null) {
    // No cycle to grade against: within the declared freshness contract it is
    // `recent`, beyond it `historical`, and never more than that.
    return { tier: ageSeconds <= lag + 400 * 86_400 ? 'recent' : 'historical', ageSeconds, intervalSeconds };
  }

  const adjusted = ageSeconds - lag;
  if (adjusted <= intervalSeconds) return { tier: 'current', ageSeconds, intervalSeconds };
  if (adjusted <= 2 * intervalSeconds) return { tier: 'recent', ageSeconds, intervalSeconds };
  if (adjusted <= 4 * intervalSeconds) return { tier: 'stale', ageSeconds, intervalSeconds };
  return { tier: 'historical', ageSeconds, intervalSeconds };
}

/**
 * How long our own copy has been sitting in the process cache. Reported apart
 * from observation age so "the publisher is behind" and "we are serving a stale
 * copy" stay distinguishable — they are different problems with different fixes.
 */
export const retrievalAgeSeconds = (retrievedAt: string | null | undefined, now = Date.now()): number | null => {
  const t = retrievedAt ? Date.parse(retrievedAt) : NaN;
  return Number.isNaN(t) ? null : Math.max(0, (now - t) / 1000);
};
