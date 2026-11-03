import { Badge, Panel } from '@/components/ui';
import type { BadgeTone } from '@/components/ui';

const KINDS: { kind: string; tone: BadgeTone; meaning: string; rule: string }[] = [
  {
    kind: 'observed',
    tone: 'brand',
    meaning: 'A measurement the publisher reports as an observation of the atmosphere or a market survey.',
    rule: 'Shown with its observation date. Never presented as a prediction.',
  },
  {
    kind: 'modeled',
    tone: 'info',
    meaning: 'A reanalysis or model product — physically based, but reconstructed rather than measured at your point.',
    rule: 'Labelled modelled; grid resolution stated when the publisher gives it.',
  },
  {
    kind: 'forecast',
    tone: 'plum',
    meaning: 'A forward run of a numerical weather model.',
    rule: 'Never summed together with observations in the same series.',
  },
  {
    kind: 'estimated',
    tone: 'gold',
    meaning: 'A figure this application computed from published values, such as a rainfall anomaly.',
    rule: 'Marked “derived here”, with its inputs named so it can be recalculated.',
  },
  {
    kind: 'imputed',
    tone: 'neutral',
    meaning: 'A value filled in where the publisher had none.',
    rule: 'IRSHAYE does not impute agricultural data. If this label ever appears, the substitution is stated on screen.',
  },
];

/**
 * The classification rules the whole product is built on, stated where a reader
 * can check them against any figure on any page.
 */
export function ValueKindLegend() {
  return (
    <Panel
      title="How values are classified"
      hint="Every figure on the platform carries one of these kinds. The kind decides the colour, the wording, and which freshness window applies."
    >
      <dl className="space-y-4">
        {KINDS.map((entry) => (
          <div key={entry.kind} className="border-b border-line pb-4 last:border-0 last:pb-0">
            <dt className="flex flex-wrap items-center gap-3">
              <Badge tone={entry.tone} dot>
                {entry.kind}
              </Badge>
            </dt>
            <dd className="mt-2 space-y-1.5">
              <p className="text-[13px] leading-relaxed text-ink-muted">{entry.meaning}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
                <span className="font-bold uppercase tracking-[0.12em]">Rule</span> — {entry.rule}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
