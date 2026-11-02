'use client';

import { useState } from 'react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { LocationPicker } from '@/components/data/LocationPicker';
import { CropPicker } from '@/components/CropPicker';
import { Panel, Loading } from '@/components/data/ui';
import type { EvidenceGap, EvidenceItem } from '@/lib/advisor/evidence';
import type { AdvisorAnswer } from '@/lib/advisor/answer';

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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">AI Agricultural Advisor</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">
          The advisor may reason only over evidence the platform has assembled and traced to a
          publisher. It cites its inputs, states uncertainty and limitations, and stays silent when
          the evidence is insufficient. It will never promise yields or diagnose your soil.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LocationPicker value={place} onChange={setPlace} label="Your location" />
        <CropPicker value={cropId} onChange={setCropId} />
      </div>

      <Panel title="Ask about your season">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={900}
          placeholder="Example: rain is expected in the next few days — should I wait to sow, and what should I prepare meanwhile?"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestion(q)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              {q}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={ask}
          disabled={busy || !question.trim()}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loading label="" />}
          {busy ? 'Assembling evidence…' : 'Get an evidence-based answer'}
        </button>
      </Panel>

      {networkError && (
        <Panel title="Advisor unavailable">
          <p className="text-sm text-orange-700 dark:text-orange-400">{networkError}</p>
        </Panel>
      )}

      {response && !response.ok && (
        <Panel title="Advisor unavailable">
          <p className="text-sm text-orange-700 dark:text-orange-400">
            {response.error.code === 'advisor_not_configured'
              ? 'This deployment has no GEMINI_API_KEY configured, so the advisor cannot run. Everything else on the platform works without it — no fabricated answer is produced.'
              : response.error.message}
          </p>
        </Panel>
      )}

      {response && response.ok && (
        <>
          <Panel
            title={response.answer.abstained ? 'Advisor abstains' : response.answer.headline}
            right={
              response.answer.abstained ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  Insufficient evidence
                </span>
              ) : undefined
            }
          >
            <p className="text-sm leading-relaxed text-gray-800 dark:text-zinc-200 whitespace-pre-wrap">
              {response.answer.recommendation}
            </p>

            <h3 className="mt-5 text-xs font-black uppercase tracking-widest text-gray-400">
              Uncertainty
            </h3>
            <p className="mt-1.5 text-sm text-gray-600 dark:text-zinc-400">{response.answer.uncertainty}</p>

            {response.answer.limitations.length > 0 && (
              <>
                <h3 className="mt-4 text-xs font-black uppercase tracking-widest text-gray-400">
                  Limitations
                </h3>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-zinc-400">
                  {response.answer.limitations.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          <Panel
            title="Evidence behind this answer"
            hint="Exactly what the advisor was allowed to use, with each value's classification and publisher."
          >
            <ul className="space-y-2">
              {response.evidence.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 dark:border-zinc-800"
                >
                  <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    {item.label}
                    <span className="ml-2 text-xs text-gray-500 dark:text-zinc-400">
                      {item.value} {item.units}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {item.kind} · {item.source}
                  </span>
                </li>
              ))}
            </ul>
            {response.evidence.gaps.length > 0 && (
              <p className="mt-3 text-xs text-gray-500 dark:text-zinc-400">
                Known gaps considered: {response.evidence.gaps.map((g) => `${g.area} (${g.reason})`).join('; ')}.
              </p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
