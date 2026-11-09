'use client';

import { Inbox, Lock, PlugZap, ServerOff, TriangleAlert, UserRoundX } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

import { EmptyState, StateNotice } from '@/components/ui';
import type { SourceErrorView } from '@/components/data/ProvenanceLabel';
import { useLanguage } from '@/hooks/useLanguage';
import type { FieldSessionStatus } from '@/hooks/useFieldSession';
import type { TranslationKey } from '@/lib/i18n';

/**
 * The one renderer for "this section is showing you nothing, and here is why".
 *
 * The brief's hardest data-integrity requirement is that a zero and an unavailable look different.
 * Six sections all need the same distinction, so it is decided once, here, from the API's own
 * refusal code rather than from each panel's local guess about what went wrong:
 *
 *  - `signed_out` — no caller, so nothing was asked. Different from an empty fleet;
 *  - `unauthenticated` — the session expired mid-shift. The token, not the data, is the thing to fix;
 *  - `not_a_member`/`insufficient_role` — a real answer about a real person: this view is not
 *    yours, or this action is a manager's;
 *  - `database` — the platform could not ask, which is not the same sentence as "no devices";
 *  - `empty` — the query ran and the answer was zero rows. The only state allowed to say "nothing".
 *
 * Collapsing any of these into a generic "no data" is the failure mode this component exists to
 * prevent, and it is why a refusal also carries the API's code as a visible token.
 */

export type FieldSectionReason =
  | 'signed_out'
  | 'unconfigured'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'database'
  | 'network'
  | 'empty'
  | 'failed';

const CODE_REASONS: Record<string, FieldSectionReason> = {
  unauthenticated: 'unauthenticated',
  auth_unavailable: 'network',
  database_not_configured: 'database',
  database_unavailable: 'database',
  not_a_member: 'forbidden',
  insufficient_role: 'forbidden',
  unknown_site: 'not_found',
  unknown_node: 'not_found',
  unknown_credential: 'not_found',
  // The same sentence as a mistyped device id, which is the point: `alert_id` is a small integer
  // handed out in order, so an id that is not yours and an id that does not exist must be
  // indistinguishable on screen as well as on the wire.
  unknown_alert: 'not_found',
  network: 'network',
};

/** Maps whatever the request produced onto one reason. Order matters: a session state outranks an error. */
export function reasonFor(input: {
  sessionStatus: FieldSessionStatus;
  error: SourceErrorView | null;
  isEmpty: boolean;
}): FieldSectionReason {
  if (input.sessionStatus === 'unconfigured') return 'unconfigured';
  if (input.sessionStatus === 'signed_out') return 'signed_out';
  const code = input.error?.code;
  if (typeof code === 'string' && CODE_REASONS[code] !== undefined) return CODE_REASONS[code];
  if (input.error !== null) return 'failed';
  if (input.isEmpty) return 'empty';
  return 'failed';
}

interface Copy {
  icon: LucideIcon;
  title: TranslationKey;
  body: TranslationKey;
  /** `empty` renders a panel, everything else a notice; only a notice can carry a code. */
  kind: 'empty' | 'notice';
  tone?: 'clay' | 'gold' | 'brand';
}

const COPY: Record<FieldSectionReason, Copy> = {
  signed_out: { icon: UserRoundX, title: 'field.state.signedOutTitle', body: 'field.state.signedOutBody', kind: 'notice', tone: 'brand' },
  unconfigured: { icon: PlugZap, title: 'field.state.unconfiguredTitle', body: 'field.state.unconfiguredBody', kind: 'notice', tone: 'gold' },
  unauthenticated: { icon: Lock, title: 'field.state.expiredTitle', body: 'field.state.expiredBody', kind: 'notice', tone: 'brand' },
  forbidden: { icon: Lock, title: 'field.state.forbiddenTitle', body: 'field.state.forbiddenBody', kind: 'notice', tone: 'brand' },
  not_found: { icon: Inbox, title: 'field.state.notFoundTitle', body: 'field.state.notFoundHint', kind: 'empty' },
  database: { icon: ServerOff, title: 'field.state.databaseTitle', body: 'field.state.databaseBody', kind: 'notice', tone: 'gold' },
  network: { icon: TriangleAlert, title: 'field.state.networkTitle', body: 'field.state.networkBody', kind: 'notice' },
  empty: { icon: Inbox, title: 'field.state.emptyTitle', body: 'field.state.emptyHint', kind: 'empty' },
  failed: { icon: TriangleAlert, title: 'field.state.failedTitle', body: 'field.state.failedBody', kind: 'notice' },
};

export function FieldSectionState({ reason, code }: { reason: FieldSectionReason; code?: string | null }) {
  const { t } = useLanguage();
  const copy = COPY[reason];
  const Icon = copy.icon;

  if (copy.kind === 'empty') {
    return <EmptyState icon={Icon} title={t(copy.title)} hint={t(copy.body)} />;
  }
  return (
    <StateNotice tone={copy.tone ?? 'clay'} title={t(copy.title)} icon={Icon} code={code ?? undefined}>
      {t(copy.body)}
    </StateNotice>
  );
}
