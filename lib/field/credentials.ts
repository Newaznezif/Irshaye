import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Device credential mechanics. SERVER-ONLY.
 *
 * This module imports `node:crypto` and must never be reachable from a browser bundle. It
 * holds the one copy of the rule that a device secret exists in exactly two places: the
 * provisioning response, once, and the memory of the device that received it. In the database
 * there is only its SHA-256 digest, and `field.hardware_node_credentials` refuses anything else
 * by CHECK constraint (`hardware_credential_hash_is_sha256_hex`), so an accidental plaintext
 * write is a failed insert rather than a leaked table.
 *
 * Why SHA-256 and not bcrypt/scrypt: the secret is 256 bits from the CSPRNG, not a human
 * password, so there is no guessable space for a slow KDF to defend. The hash exists to make a
 * stolen row useless, which one fast pre-image-resistant digest already does, and to keep an
 * ingestion endpoint that legitimately runs several times a minute cheap.
 */

/** 32 bytes = 256 bits, the level ESP32 firmware can carry in a JSON field without ceremony. */
export const DEVICE_TOKEN_BYTES = 32;

/** Base64url, unpadded: 43 characters, no `+`/`/` to corrupt in a query string or a config file. */
export function generateDeviceToken(): string {
  return randomBytes(DEVICE_TOKEN_BYTES).toString('base64url');
}

export function hashDeviceToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** The shape `token_hash` is stored in and that the CHECK constraint requires. */
export const TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Constant-time comparison of a candidate secret against the stored digest.
 *
 * Both sides are hashed FIRST and compared as equal-length buffers: comparing the plaintext to
 * a hex digest would be a length-mismatch check that leaks how long the digest is, and
 * `timingSafeEqual` throws when the lengths differ at all, so the guard below is load-bearing,
 * not defensive padding.
 */
export function tokenMatches(token: string, storedHash: string): boolean {
  if (!TOKEN_HASH_PATTERN.test(storedHash)) return false;
  const candidate = Buffer.from(hashDeviceToken(token), 'ascii');
  const stored = Buffer.from(storedHash, 'ascii');
  return timingSafeEqual(candidate, stored);
}

/**
 * Is this credential row usable right now?
 *
 * `revoked_at` and `expires_at` are both lifecycle facts the database records and the database
 * does not police: a row can be unrevoked and still expired, because expiry is a deadline rather
 * than an event. So the check lives here, in one place, and takes `now` for the same reason
 * `classifyFreshness` does — a test must be able to ask about a Tuesday in March.
 */
export function credentialIsUsable(
  credential: { revoked_at: string | null; expires_at: string | null },
  now: Date = new Date(),
): { ok: true } | { ok: false; reason: 'revoked' | 'expired' } {
  if (credential.revoked_at !== null) return { ok: false, reason: 'revoked' };
  if (credential.expires_at === null) return { ok: true };
  const expiry = Date.parse(credential.expires_at);
  if (!Number.isFinite(expiry)) return { ok: false, reason: 'expired' };
  return now.getTime() >= expiry ? { ok: false, reason: 'expired' } : { ok: true };
}

/**
 * The digest that identifies a submission. Over the canonical string built by
 * `canonicalPayload` in lib/field/ingest.ts, so a byte-identical retry produces a byte-identical
 * hash and `field.sensor_logs` refuses it with its unique index.
 */
export function payloadDigest(canonical: string): string {
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
