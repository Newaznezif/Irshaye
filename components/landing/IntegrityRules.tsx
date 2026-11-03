import { CircleSlash, Scale, ScrollText, ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/ui';

const RULES = [
  {
    icon: Scale,
    title: 'A model output is never drawn as a measurement',
    body: 'Every value carries a kind — observed, modelled, forecast, derived here, or filled in. Colour and label make the difference visible instead of smoothing it away.',
  },
  {
    icon: CircleSlash,
    title: 'A gap is shown as a gap',
    body: 'When a publisher returns nothing, the module reports the failure and its code. No substitute weather, price, or agronomic figure is generated to fill the space.',
  },
  {
    icon: ScrollText,
    title: 'No outcome claims without field validation',
    body: 'The platform does not state yield gains, income uplift, or water savings it has not measured on real farms, and does not present satellite vegetation indices as a soil test.',
  },
  {
    icon: ShieldCheck,
    title: 'Guidance, not a guarantee',
    body: 'Advice is decision support with named sources and stated uncertainty. It does not diagnose soil conditions without measurement, and it abstains when the evidence is thin.',
  },
];

export function IntegrityRules() {
  return (
    <section className="border-b border-line bg-canvas-tint py-16 md:py-20">
      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-8">
        <Reveal>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-brand-700 uppercase dark:text-brand-300">
                The evidence rules
              </p>
              <h2 className="mt-3.5 max-w-2xl text-[26px] leading-[1.16] font-extrabold tracking-[-0.02em] text-ink md:text-[32px]">
                Four promises the interface enforces, not just claims
              </h2>
            </div>
            <p className="max-w-md text-[13.5px] leading-relaxed text-ink-muted">
              An advisory tool earns trust by what it refuses to say. These rules are implemented in the
              rendering layer — you can see them working on any page, including when the data is
              inconvenient.
            </p>
          </div>
        </Reveal>

        <div className="mt-11 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-line bg-line shadow-card sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 80} className="h-full">
              <article className="flex h-full flex-col bg-surface p-6 transition-colors duration-300 hover:bg-brand-50/50 dark:hover:bg-brand-950/30">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-700 ring-1 ring-inset ring-brand/15 dark:text-brand-300">
                  <Icon size={18} strokeWidth={2.1} />
                </span>
                <h3 className="mt-5 text-[14.5px] font-extrabold leading-snug tracking-tight text-ink">{title}</h3>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-muted">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
