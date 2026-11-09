/**
 * One place where a browser sends a Field Intelligence request.
 *
 * GETs go through `hooks/useLiveData.ts` (cancellation, stale-response protection, the documented
 * envelope). This file covers what that hook is not for: the Phase 4 management calls, which change
 * state and answer once with something that must not be kept.
 *
 * The rules this file exists to enforce:
 *  - the bearer token travels in the `Authorization` header and nowhere else. It is not appended to
 *    a path, not returned in a result, not written to a log — a token in a URL lands in browser
 *    history and in every proxy and analytics dump that reads one;
 *  - nothing here throws on an HTTP error. A 403 is an answer, and a component that has to
 *    try/catch a fetch cannot tell "you are not a member" from "the network died";
 *  - `device_secret` is returned as a separate field precisely so the caller can hold it in one
 *    piece of state, render it once, and clear it — rather than leaving it inside a data object that
 *    a list keeps rendering.
 */

export interface CallResult<D> {
  ok: boolean;
  status: number;
  data: D | null;
  /**
   * The API's own refusal code (`insufficient_role`, `unknown_site`, …). The UI translates this and
   * never renders the server's sentence, which is written for an operator reading a log.
   */
  code: string | null;
  message: string;
  /** Present only on a credential issue or rotation. Display once, then drop. */
  deviceSecret: string | null;
}

interface Body {
  ok?: boolean;
  message?: string;
  error?: { code?: string; message?: string } | null;
  device_secret?: string;
}

export async function managementCall<D>(
  path: string,
  options: { method: 'POST' | 'PATCH'; body?: Record<string, unknown>; accessToken: string | null },
): Promise<CallResult<D>> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (options.accessToken !== null) headers.authorization = `Bearer ${options.accessToken}`;

  let res: Response;
  try {
    res = await fetch(path, {
      method: options.method,
      headers: { ...headers, ...(options.body === undefined ? {} : { 'content-type': 'application/json' }) },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
  } catch {
    // No status, no code from the server: say only that this service was not reachable. A network
    // failure must not be rendered as a permission failure, and the reverse is equally wrong.
    return { ok: false, status: 0, data: null, code: 'network', message: '', deviceSecret: null };
  }

  const parsed = (await res.json().catch(() => null)) as (Body & Partial<Record<string, unknown>>) | null;
  const envelopeOk = parsed?.ok === true && res.ok;

  return {
    ok: envelopeOk,
    status: res.status,
    data: (envelopeOk ? ((parsed as { data?: D }).data ?? null) : null) as D | null,
    code: envelopeOk ? null : (parsed?.error?.code ?? (res.ok ? 'unexpected_response' : `http_${String(res.status)}`)),
    message: parsed?.message ?? parsed?.error?.message ?? '',
    deviceSecret: typeof parsed?.device_secret === 'string' ? parsed.device_secret : null,
  };
}
