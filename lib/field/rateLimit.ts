/**
 * Per-device ingestion throttle. PROCESS-LOCAL, AND EXPLICITLY NOT A SHARED LIMIT.
 *
 * What this is: a Map of recent submission timestamps per node id, held in the memory of one
 * running server process. It stops a mis-wired ESP32 in a tight loop from filling the readings
 * table and burning the field device's battery, which is the failure this endpoint actually sees.
 *
 * What this is NOT: a guarantee. On Vercel each concurrent request can be served by a different
 * function instance, so N instances means up to N x the limit reaches the database, and a new
 * deploy empties the counters. Anyone reading this must not call it production-grade rate
 * limiting; the durable bound is elsewhere — `sensor_log_replay_uid` refuses a replayed payload
 * outright, and the CHECK constraints refuse an implausible one, whatever their frequency. A
 * shared limit would need a store every instance agrees on (Postgres counters or an edge KV),
 * and that is a deliberate addition to the migration pack rather than something to assume here.
 *
 * The Map is size-bounded so a flood of unknown node ids cannot grow it without limit: the least
 * recently seen entries are dropped first. That is a memory guard, not fairness.
 */

const WINDOW_MS = 60_000;
const MAX_SUBMISSIONS_PER_WINDOW = 20;
const MAX_TRACKED_DEVICES = 2_000;

const recent = new Map<string, number[]>();

export type RateVerdict = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Records the attempt and answers whether it is allowed. `now` is a parameter for the same
 * reason it is one in `classifyFreshness`: a test must be able to stand at a specific second
 * instead of sleeping for one.
 */
export function checkDeviceRate(nodeId: string, now: number = Date.now()): RateVerdict {
  const windowStart = now - WINDOW_MS;
  const existing = recent.get(nodeId);
  const attempts = existing ? existing.filter((at) => at > windowStart) : [];

  if (attempts.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    const waitMs = attempts[0] + WINDOW_MS - now;
    recent.set(nodeId, attempts);
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) };
  }

  attempts.push(now);
  recent.set(nodeId, attempts);
  evictIfNeeded(now);
  return { ok: true };
}

function evictIfNeeded(now: number): void {
  if (recent.size <= MAX_TRACKED_DEVICES) return;
  for (const [key, attempts] of recent) {
    if (attempts.length === 0 || attempts[attempts.length - 1] <= now - WINDOW_MS) recent.delete(key);
  }
  while (recent.size > MAX_TRACKED_DEVICES) {
    const oldest = recent.keys().next();
    if (oldest.done) break;
    recent.delete(oldest.value);
  }
}

/** Test seam: a suite that measures throttling must be able to start from an empty slate. */
export function resetDeviceRate(): void {
  recent.clear();
}

export const RATE_LIMIT_INFO = {
  windowSeconds: WINDOW_MS / 1000,
  maxSubmissionsPerWindow: MAX_SUBMISSIONS_PER_WINDOW,
  shared: false,
} as const;
