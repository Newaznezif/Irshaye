'use client';

import { useState } from 'react';
import { Bot, CircleAlert, ListChecks, Send, Sparkles } from 'lucide-react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { CropPicker } from '@/components/CropPicker';
import {
  Badge,
  Button,
  Field,
  Loading,
  PageHeader,
  Panel,
  SectionLabel,
  StateNotice,
  Textarea,
} from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';
import type { EvidenceGap, EvidenceItem } from '@/lib/advisor/evidence';
import type { AdvisorAnswer } from '@/lib/advisor/answer';
import type { BadgeTone } from '@/components/ui';

/** Same kind→meaning mapping the provenance labels use, extended for reference material. */
const KIND_TONE: Record<EvidenceItem['kind'], BadgeTone> = {
  observed: 'brand',
  modeled: 'info',
  forecast: 'plum',
  estimated: 'gold',
  imputed: 'neutral',
  reference: 'outline',
};

/** The classification words already exist for provenance badges; `reference` is advisor-only. */
const KIND_LABEL: Record<EvidenceItem['kind'], TranslationKey> = {
  observed: 'prov.kind.observed',
  modeled: 'prov.kind.modeled',
  forecast: 'prov.kind.forecast',
  estimated: 'prov.kind.estimated',
  imputed: 'prov.kind.imputed',
  reference: 'advisor.kind.reference',
};

type AskResponse =
  | { ok: true; answer: AdvisorAnswer; evidence: { items: EvidenceItem[]; gaps: EvidenceGap[] } }
  | { ok: false; error: { code: string; message: string } };

export default function AdvisorPage() {
  const { t, locale } = useLanguage();
  const { place, setPlace, cropId, setCropId } = useWorkbench();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  /** A flag, not a sentence: the wording must follow the language chosen after the failure. */
  const [networkFailed, setNetworkFailed] = useState(false);

  const ask = async () => {
    if (!question.trim() || busy) return;
    setBusy(true);
    setNetworkFailed(false);
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          latitude: place.latitude,
          longitude: place.longitude,
          placeName: place.name,
          cropId,
          question,
        }),
      });
      setResponse((await res.json()) as AskResponse);
    } catch {
      setNetworkFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.group.Advisory')}
        title={t('module.advisor.label')}
        icon={Bot}
        description={t('advisor.pageDescription')}
        status={<Badge tone="neutral">{t('advisor.badgeEvidenceOnly')}</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <LocationPicker value={place} onChange={setPlace} label={t('overview.yourLocation')} />
        <CropPicker value={cropId} onChange={setCropId} />
      </div>

      <Panel
        title={t('advisor.askTitle')}
        icon={Sparkles}
        hint={t('advisor.askHint', { place: place.name })}
      >
        <Field
          label={t('advisor.questionLabel')}
          htmlFor="advisor-question"
          hint={t('advisor.charCount', { count: question.length.toLocaleString(locale) })}
        >
          <Textarea
            id="advisor-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={900}
            placeholder={t('advisor.questionPlaceholder')}
          />
        </Field>

        <div className="mt-4 flex flex-wrap gap-2">
          {(['advisor.example1', 'advisor.example2', 'advisor.example3'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setQuestion(t(key))}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:bg-brand-soft/60 hover:text-ink"
            >
              {t(key)}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-line pt-5">
          <Button
            onClick={ask}
            disabled={busy || !question.trim()}
            aria-busy={busy}
            leading={busy ? undefined : <Send size={15} />}
          >
            {busy ? t('advisor.assembling') : t('advisor.submit')}
          </Button>
          {busy && <Loading label="" className="py-0" />}
        </div>
      </Panel>

      {networkFailed && (
        <StateNotice tone="clay" title={t('advisor.unavailableTitle')} icon={CircleAlert}>
          {t('advisor.networkError')}
        </StateNotice>
      )}

      {response && !response.ok && (
        <StateNotice
          tone={response.error.code === 'advisor_not_configured' ? 'info' : 'clay'}
          title={t('advisor.unavailableTitle')}
          code={response.error.code}
          icon={CircleAlert}
        >
          {response.error.code === 'advisor_not_configured' ? t('advisor.notConfigured') : response.error.message}
        </StateNotice>
      )}

      {response && response.ok && (
        <>
          <Panel
            title={t('advisor.responseTitle')}
            icon={Bot}
            right={
              response.answer.abstained ? (
                <Badge tone="gold" dot>
                  {t('advisor.badgeInsufficient')}
                </Badge>
              ) : (
                <Badge tone="brand" dot>
                  {t('advisor.badgeBacked')}
                </Badge>
              )
            }
          >
            {/* The headline is model prose: it reads as content, never as an uppercase panel eyebrow. */}
            <p className="text-[19px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
              {response.answer.abstained ? t('advisor.abstains') : response.answer.headline}
            </p>

            <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap text-ink">
              {response.answer.recommendation}
            </p>

            <div className="mt-6 grid gap-5 border-t border-line pt-5 md:grid-cols-2">
              <div>
                <SectionLabel>{t('advisor.uncertainty')}</SectionLabel>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{response.answer.uncertainty}</p>
              </div>
              {response.answer.limitations.length > 0 && (
                <div>
                  <SectionLabel>{t('advisor.limitations')}</SectionLabel>
                  <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-muted">
                    {response.answer.limitations.map((l, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>

          <Panel title={t('advisor.evidenceTitle')} icon={ListChecks} hint={t('advisor.evidenceHint')}>
            <ul className="divide-y divide-line border-y border-line">
              {response.evidence.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-3"
                >
                  <span className="min-w-0">
                    <span className="text-[13px] font-bold text-ink">{item.label}</span>
                    <span className="tabular ml-2 text-[12.5px] text-ink-muted">
                      {item.value} {item.units}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone={KIND_TONE[item.kind] ?? 'neutral'}>{t(KIND_LABEL[item.kind])}</Badge>
                    <span className="text-[11px] font-semibold text-ink-faint">{item.source}</span>
                  </span>
                </li>
              ))}
            </ul>
            {response.evidence.gaps.length > 0 && (
              <StateNotice tone="gold" title={t('advisor.gapsTitle')} className="mt-5">
                {response.evidence.gaps.map((g) => `${g.area} (${g.reason})`).join('; ')}
              </StateNotice>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
