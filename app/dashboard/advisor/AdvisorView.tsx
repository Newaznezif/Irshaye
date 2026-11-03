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

type AskResponse =
  | { ok: true; answer: AdvisorAnswer; evidence: { items: EvidenceItem[]; gaps: EvidenceGap[] } }
  | { ok: false; error: { code: string; message: string } };

const EXAMPLE_QUESTIONS = [
  'Is it a good time to prepare land and plant?',
  'What weather risks should I plan around this week?',
  'How should I time inputs given the rainfall outlook?',
];

export default function AdvisorPage() {
  const { place, setPlace, cropId, setCropId } = useWorkbench();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const ask = async () => {
    if (!question.trim() || busy) return;
    setBusy(true);
    setNetworkError(null);
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
      setNetworkError('This service could not be reached. No answer is shown rather than a guess.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Advisory"
        title="AI Agricultural Advisor"
        icon={Bot}
        description="The advisor may reason only over evidence the platform has assembled and traced to a publisher. It cites its inputs, states uncertainty and limitations, and stays silent when the evidence is insufficient. It will never promise yields or diagnose your soil."
        status={<Badge tone="neutral">Reasons over platform evidence only</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <LocationPicker value={place} onChange={setPlace} label="Your location" />
        <CropPicker value={cropId} onChange={setCropId} />
      </div>

      <Panel
        title="Ask about your season"
        icon={Sparkles}
        hint={`The question is answered for ${place.name} and the selected crop, using only the evidence listed under the answer.`}
      >
        <Field label="Your question" htmlFor="advisor-question" hint={`${question.length}/900 characters`}>
          <Textarea
            id="advisor-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={900}
            placeholder="Example: rain is expected in the next few days — should I wait to sow, and what should I prepare meanwhile?"
          />
        </Field>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestion(q)}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:bg-brand-soft/60 hover:text-ink"
            >
              {q}
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
            {busy ? 'Assembling evidence…' : 'Get an evidence-based answer'}
          </Button>
          {busy && <Loading label="" className="py-0" />}
        </div>
      </Panel>

      {networkError && (
        <StateNotice tone="clay" title="Advisor unavailable" icon={CircleAlert}>
          {networkError}
        </StateNotice>
      )}

      {response && !response.ok && (
        <StateNotice
          tone={response.error.code === 'advisor_not_configured' ? 'info' : 'clay'}
          title="Advisor unavailable"
          code={response.error.code}
          icon={CircleAlert}
        >
          {response.error.code === 'advisor_not_configured'
            ? 'This deployment has no GEMINI_API_KEY configured, so the advisor cannot run. Everything else on the platform works without it — no fabricated answer is produced.'
            : response.error.message}
        </StateNotice>
      )}

      {response && response.ok && (
        <>
          <Panel
            title="Advisor response"
            icon={Bot}
            right={
              response.answer.abstained ? (
                <Badge tone="gold" dot>
                  Insufficient evidence
                </Badge>
              ) : (
                <Badge tone="brand" dot>
                  Evidence-backed
                </Badge>
              )
            }
          >
            {/* The headline is model prose: it reads as content, never as an uppercase panel eyebrow. */}
            <p className="text-[19px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
              {response.answer.abstained ? 'The advisor abstains' : response.answer.headline}
            </p>

            <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap text-ink">
              {response.answer.recommendation}
            </p>

            <div className="mt-6 grid gap-5 border-t border-line pt-5 md:grid-cols-2">
              <div>
                <SectionLabel>Uncertainty</SectionLabel>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{response.answer.uncertainty}</p>
              </div>
              {response.answer.limitations.length > 0 && (
                <div>
                  <SectionLabel>Limitations</SectionLabel>
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

          <Panel
            title="Evidence behind this answer"
            icon={ListChecks}
            hint="Exactly what the advisor was allowed to use, with each value’s classification and publisher."
          >
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
                    <Badge tone={KIND_TONE[item.kind] ?? 'neutral'}>{item.kind}</Badge>
                    <span className="text-[11px] font-semibold text-ink-faint">{item.source}</span>
                  </span>
                </li>
              ))}
            </ul>
            {response.evidence.gaps.length > 0 && (
              <StateNotice tone="gold" title="Known gaps the advisor considered" className="mt-5">
                {response.evidence.gaps.map((g) => `${g.area} (${g.reason})`).join('; ')}
              </StateNotice>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
