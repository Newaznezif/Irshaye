'use client';

import { Badge, Panel } from '@/components/ui';
import type { BadgeTone } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';

const KINDS: { kind: ProvenanceView['valueKind']; tone: BadgeTone }[] = [
  { kind: 'observed', tone: 'brand' },
  { kind: 'modeled', tone: 'info' },
  { kind: 'forecast', tone: 'plum' },
  { kind: 'estimated', tone: 'gold' },
  { kind: 'imputed', tone: 'neutral' },
];

/**
 * The classification rules the whole product is built on, stated where a reader
 * can check them against any figure on any page.
 */
export function ValueKindLegend() {
  const { t } = useLanguage();
  return (
    <Panel title={t('legend.title')} hint={t('legend.hint')}>
      <dl className="space-y-4">
        {KINDS.map((entry) => (
          <div key={entry.kind} className="border-b border-line pb-4 last:border-0 last:pb-0">
            <dt className="flex flex-wrap items-center gap-3">
              <Badge tone={entry.tone} dot>
                {t(`prov.kind.${entry.kind}`)}
              </Badge>
            </dt>
            <dd className="mt-2 space-y-1.5">
              <p className="text-[13px] leading-relaxed text-ink-muted">{t(`legend.${entry.kind}Meaning`)}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
                <span className="font-bold uppercase tracking-[0.12em]">{t('legend.ruleLabel')}</span> —{' '}
                {t(`legend.${entry.kind}Rule`)}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
