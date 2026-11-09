'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound, LogOut, Mail, ShieldAlert, Unplug, UserRound } from 'lucide-react';

import { Badge, Button, Field, Input, Panel, StateNotice } from '@/components/ui';
import type { FieldAuthErrorCode, FieldSessionStatus } from '@/hooks/useFieldSession';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';

/**
 * The sign-in half of Field Intelligence.
 *
 * Everything this module shows is scoped to a person, so the panel above the data is not decoration
 * — it is the reason the six `/api/field/*` reads can answer at all. Three states are drawn
 * separately because they are three different sentences a cooperative needs to hear:
 *
 *  - **unconfigured**: the deployment has no Auth server. Saying this is the difference between an
 *    operator waiting for a device to report and an operator learning the platform was never
 *    connected. Only the NAMES of the environment variables appear, never values, and never a
 *    suggestion to paste one into this page.
 *  - **signed out**: nothing is fetched. The panels below show their own signed-out notice rather
 *    than an empty list, because "no rows" and "no caller" must not look identical.
 *  - **signed in**: the identity is displayed and nothing else. No role, no cooperative, no
 *    membership — those are resolved per request on the server (`lib/field/managementApi.ts`), and a
 *    dashboard that printed a client-side guess about them would be a dashboard authorizing itself.
 *
 * The password goes from this component's state into `signInWithPassword` and is cleared on the next
 * line, in both directions of the result. It is never written to storage, never echoed back, and
 * never part of an error message.
 */

const ERROR_KEYS: Record<FieldAuthErrorCode, TranslationKey> = {
  not_configured: 'field.error.notConfigured',
  invalid_credentials: 'field.error.invalidCredentials',
  email_not_confirmed: 'field.error.emailNotConfirmed',
  rate_limited: 'field.error.rateLimited',
  unreachable: 'field.error.authUnreachable',
  unexpected: 'field.error.authUnexpected',
};

interface Props {
  status: FieldSessionStatus;
  email: string | null;
  userId: string | null;
  errorCode: FieldAuthErrorCode | null;
  busy: boolean;
  onSignIn: (email: string, password: string) => Promise<FieldAuthErrorCode | null>;
  onSignOut: () => void;
}

export function FieldSessionPanel({ status, email, userId, errorCode, busy, onSignIn, onSignOut }: Props) {
  const { t } = useLanguage();
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const sent = password;
    setPassword('');
    await onSignIn(address, sent);
  }

  if (status === 'unconfigured') {
    return (
      <Panel title={t('field.session.title')} icon={Unplug}>
        <StateNotice tone="gold" title={t('field.session.unconfiguredTitle')} icon={ShieldAlert}>
          {t('field.session.unconfiguredBody')}
        </StateNotice>
        <ul className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-ink-faint">
          <li className="font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_URL</li>
          <li className="font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li className="font-mono text-[11px]">SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">{t('field.session.variableNames')}</p>
      </Panel>
    );
  }

  if (status === 'signed_in') {
    return (
      <Panel
        title={t('field.session.title')}
        icon={UserRound}
        hint={t('field.session.signedInHint')}
        right={
          <Badge tone="brand" dot>
            {t('field.session.signedInBadge')}
          </Badge>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 text-sm font-semibold text-ink break-all">
            {email ?? `${t('field.session.idLabel')} ${userId?.slice(0, 8) ?? '—'}`}
          </p>
          <Button variant="secondary" size="sm" onClick={onSignOut} leading={<LogOut size={14} />} disabled={busy}>
            {t('field.session.signOut')}
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={t('field.session.title')} icon={KeyRound} hint={t('field.session.signedOutHint')}>
      {status === 'checking' ? (
        <p className="text-[13px] font-semibold text-ink-muted">{t('field.session.checking')}</p>
      ) : (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <Field label={t('field.session.emailLabel')} htmlFor="field-signin-email" icon={Mail}>
            <Input
              id="field-signin-email"
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="manager@cooperative.example"
              required
            />
          </Field>
          <Field label={t('field.session.passwordLabel')} htmlFor="field-signin-password">
            <Input
              id="field-signin-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" size="sm" disabled={busy || address.trim() === '' || password === ''}>
              {busy ? t('field.session.signingIn') : t('field.session.signIn')}
            </Button>
            {errorCode !== null && (
              <p role="alert" className="text-[12.5px] font-semibold text-clay-700 dark:text-clay-300">
                {t(ERROR_KEYS[errorCode])}
              </p>
            )}
          </div>
          <p className="text-[11.5px] leading-relaxed text-ink-faint sm:col-span-2">{t('field.session.accountNote')}</p>
        </form>
      )}
    </Panel>
  );
}
