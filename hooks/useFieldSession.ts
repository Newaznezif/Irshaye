'use client';
import { useCallback, useEffect, useState } from 'react';

import type { Session } from '@supabase/supabase-js';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabaseClient';

/**
 * The signed-in identity behind every Field Intelligence read.
 *
 * Why this exists as a hook rather than as `fetch(path)` calls scattered across the dashboard: the
 * six `/api/field/*` routes authorize on a bearer token the Auth server confirms
 * (`lib/serverSupabase.ts:39`), so a request without one is a 401 by design. The dashboard therefore
 * has to hold a session, and it has to hold it in exactly one place — because the moment a second
 * component starts reading `window.location.search` for a token, or copies the session into its own
 * state, the token is in a URL or in two stores with different lifetimes. This file keeps it in
 * React state and in the Authorization header, nowhere else.
 *
 * What is deliberately NOT here:
 *  - no membership, role or capability is remembered client-side. `app.cooperative_members` is read
 *    per request on the server (`lib/field/managementApi.ts`). A browser that believed it was a
 *    manager would be a browser running its own authorization;
 *  - no password is stored, echoed, or passed onward — it goes into `signInWithPassword` and is
 *    dropped;
 *  - no error prose from the Auth provider reaches the screen. Failures are reported as codes and
 *    translated by the UI, because provider text changes with Supabase versions and sometimes names
 *    internal mechanics.
 *
 * One documented trade-off: supabase-js persists the session in the browser's own storage by
 * default, so a reload keeps you signed in. The alternative (memory-only) logs everyone out on every
 * page refresh for a marginally smaller XSS surface, and the surface that matters — the anon key —
 * is public by design and grants nothing without RLS and these routes' gates.
 */

export type FieldSessionStatus = 'unconfigured' | 'checking' | 'signed_out' | 'signed_in';

/** Codes the UI translates; the provider's own message never renders. */
export type FieldAuthErrorCode =
  | 'not_configured'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'rate_limited'
  | 'unreachable'
  | 'unexpected';

export interface FieldSessionUser {
  id: string;
  /** Null when the identity has no email address; the UI shows the id's tail instead. */
  email: string | null;
}

interface FieldSessionState {
  status: FieldSessionStatus;
  user: FieldSessionUser | null;
  accessToken: string | null;
  errorCode: FieldAuthErrorCode | null;
  busy: boolean;
}

const INITIAL: FieldSessionState = { status: 'checking', user: null, accessToken: null, errorCode: null, busy: false };

function toUser(session: Session | null): FieldSessionUser | null {
  const user = session?.user;
  if (!user) return null;
  return { id: user.id, email: typeof user.email === 'string' && user.email !== '' ? user.email : null };
}

/**
 * Maps an Auth failure onto a code. `code` is what supabase-js v2 sets on an `AuthApiError`; the
 * HTTP status is the fallback, and anything unrecognised becomes `unexpected` rather than the raw
 * message — the point is to tell the operator what to do next, not to mirror the provider.
 */
function errorCodeOf(error: { code?: string; status?: number; name?: string } | undefined): FieldAuthErrorCode {
  const code = error?.code;
  if (code === 'email_not_confirmed') return 'email_not_confirmed';
  if (code === 'invalid_credentials' || code === 'invalid_login_credentials') return 'invalid_credentials';
  if (code === 'over_email_send_rate_limit' || code === 'too_many_requests') return 'rate_limited';
  if (error?.status === 429) return 'rate_limited';
  if (error?.status === 400 || error?.status === 401 || error?.status === 403) return 'invalid_credentials';
  if (error?.name === 'AuthRetryableFetchError' || error?.name === 'FetchError') return 'unreachable';
  return 'unexpected';
}

/**
 * A live view of the caller's session.
 *
 * The subscription matters more than it looks: a token expires, and a manager who leaves the tab
 * open on a shift report would otherwise keep sending a dead bearer string and reading 401s as
 * "the database is empty". `onAuthStateChange` covers SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT and
 * USER_UPDATED, so `accessToken` is whatever the Auth server currently honors — and when it flips to
 * null, every hook that takes it refetches rather than displaying a stale tenant's numbers.
 */
export function useFieldSession() {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<FieldSessionState>(() =>
    configured ? INITIAL : { ...INITIAL, status: 'unconfigured' },
  );

  useEffect(() => {
    if (!configured) return;
    const auth = getSupabase().auth;

    let cancelled = false;
    let settled = false;

    function apply(session: Session | null) {
      if (cancelled) return;
      settled = true;
      const user = toUser(session);
      setState((prev) => ({
        ...prev,
        status: user ? 'signed_in' : 'signed_out',
        user,
        accessToken: session?.access_token ?? null,
        errorCode: null,
        busy: false,
      }));
    }

    auth
      .getSession()
      .then(({ data }) => apply(data.session))
      .catch(() => {
        if (!cancelled) setState((prev) => ({ ...prev, status: 'signed_out' }));
      });

    const { data } = auth.onAuthStateChange((event, session) => {
      // `getSession()` above answers the initial question, so the library's own INITIAL_SESSION is
      // redundant once that has landed. Everything else in this stream is a change that has to
      // reach the dashboard: a refreshed token (same user, new bearer string), a sign-out performed
      // in another tab, a profile edit. Ignoring them is how a tab ends up sending a dead token and
      // reading a 401 as an empty database.
      if (event === 'INITIAL_SESSION' && settled) return;
      apply(session);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [configured]);

  /**
   * Signs in with an email and password. Returns the code so the calling form can render its own
   * message; resolves `null` on success. Nothing about the credential is returned, logged or kept.
   */
  const signIn = useCallback(async (email: string, password: string): Promise<FieldAuthErrorCode | null> => {
    if (!configured) {
      setState((prev) => ({ ...prev, status: 'unconfigured', errorCode: 'not_configured' }));
      return 'not_configured';
    }
    setState((prev) => ({ ...prev, busy: true, errorCode: null }));
    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        const code = errorCodeOf(error);
        setState((prev) => ({ ...prev, busy: false, errorCode: code }));
        return code;
      }
      // The session normally arrives through onAuthStateChange before this resolves; setting it here
      // too means the form cannot flash a signed-out frame on a slow event loop.
      const user = toUser(data.session);
      setState((prev) => ({
        ...prev,
        status: user ? 'signed_in' : prev.status,
        user: user ?? prev.user,
        accessToken: data.session?.access_token ?? prev.accessToken,
        busy: false,
        errorCode: null,
      }));
      return null;
    } catch {
      // An exception is a transport failure, not a wrong password. Say so, because "invalid
      // credentials" would send an operator to reset a password that was never wrong.
      setState((prev) => ({ ...prev, busy: false, errorCode: 'unreachable' }));
      return 'unreachable';
    }
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    setState((prev) => ({ ...prev, busy: true }));
    try {
      await getSupabase().auth.signOut();
    } catch {
      // The local state is cleared below regardless: a sign-out that the server did not confirm
      // still has to stop this tab from sending the old token.
    }
    setState((prev) => ({ ...prev, status: 'signed_out', user: null, accessToken: null, busy: false, errorCode: null }));
  }, [configured]);

  return {
    configured,
    status: state.status,
    user: state.user,
    /** Hand this to `useLiveData` as `accessToken`. Do not put it in a path. */
    accessToken: state.accessToken,
    errorCode: state.errorCode,
    busy: state.busy,
    signIn,
    signOut,
  };
}

export type FieldSession = ReturnType<typeof useFieldSession>;
