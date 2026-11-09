'use client';

import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, TriangleAlert } from 'lucide-react';

import { Badge, Button, DataRow, StateNotice } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * The one screen that shows a device secret, and the only place it exists in the browser.
 *
 * A credential is stored as a digest (`field.hardware_node_credentials.token_hash`) and the API
 * returns the plaintext exactly once, in the `device_secret` field of the issue or rotation response
 * (`issued()` in `lib/field/managementApi.ts`). Everything the rest of the product does with that
 * value is wrong, so this component is deliberately awkward to use:
 *
 *  - it renders only what its parent hands it, and the parent keeps that string in one piece of
 *    state that this component clears. It is never written to localStorage, never appended to a URL,
 *    never logged, never sent to analytics, and never included in a list or a chart payload;
 *  - the value starts masked. The secret is the argument for clicking "show", not a fact the page
 *    assumes the operator wanted;
 *  - copying is explicit and reports whether the browser actually accepted it. A clipboard call that
 *    silently failed would leave an operator with a device that cannot be configured;
 *  - closing it is permanent and says so. There is no "view again", because there is nothing to view
 *    again — and a UI that implies otherwise is how a fleet ends up reflashed from a guess.
 *
 * The panel is also where the firmware instruction lives: the token goes in `secret_token`, and a
 * rotated secret means the device must be reflashed before it reports again.
 */

export function FieldCredentialDisclosure({
  nodeId,
  credentialId,
  secret,
  rotated,
  onDismiss,
}: {
  nodeId: string;
  credentialId: number;
  secret: string;
  rotated: boolean;
  onDismiss: () => void;
}) {
  const { t } = useLanguage();
  // Both start closed. The panel is keyed by the credential it shows, so a rotation remounts it
  // rather than leaving a dead secret revealed on screen — see `FieldDeviceManagementSection`.
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<'idle' | 'ok' | 'failed'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied('ok');
    } catch {
      // A refused clipboard is common over plain HTTP and on a locked-down browser. Saying so keeps
      // the operator typing it into firmware by hand instead of believing the copy worked.
      setCopied('failed');
    }
  }

  return (
    <div className="rounded-2xl border border-gold/40 bg-gold-soft/60 p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-700 dark:text-gold-300">
          <KeyRound size={14} />
          {t('field.credential.title')}
        </p>
        <Badge tone="gold">{rotated ? t('field.credential.rotated') : t('field.credential.issued')}</Badge>
      </div>

      <StateNotice tone="clay" title={t('field.credential.onceTitle')} icon={TriangleAlert} className="mt-3">
        {t('field.credential.onceBody')}
      </StateNotice>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 font-mono text-[13px] break-all text-ink"
          aria-label={t('field.credential.valueLabel')}
        >
          {revealed ? secret : '•'.repeat(Math.min(secret.length, 40))}
        </code>
        <Button variant="secondary" size="sm" onClick={() => setRevealed((v) => !v)} leading={revealed ? <EyeOff size={14} /> : <Eye size={14} />}>
          {revealed ? t('field.credential.hide') : t('field.credential.show')}
        </Button>
        <Button variant="secondary" size="sm" onClick={copy} leading={copied === 'ok' ? <Check size={14} /> : <Copy size={14} />}>
          {copied === 'ok' ? t('field.credential.copied') : t('field.credential.copy')}
        </Button>
      </div>

      {copied === 'failed' && <p className="mt-2 text-[12px] font-semibold text-clay-700 dark:text-clay-300">{t('field.credential.copyFailed')}</p>}

      <div className="mt-4 space-y-0">
        <DataRow label={t('field.credential.device')}>
          <span className="font-mono text-[12.5px]">{nodeId}</span>
        </DataRow>
        <DataRow label={t('field.credential.credentialId')}>{String(credentialId)}</DataRow>
        <DataRow label={t('field.credential.firmwareField')}>
          <span className="font-mono text-[12.5px]">secret_token</span>
        </DataRow>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
        {rotated ? t('field.credential.reflash') : t('field.credential.firstIssue')}
      </p>

      <Button className="mt-4" size="sm" onClick={onDismiss}>
        {t('field.credential.dismiss')}
      </Button>
    </div>
  );
}
