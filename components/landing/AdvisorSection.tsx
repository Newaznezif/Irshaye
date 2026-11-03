import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bot, CircleCheck, ListChecks, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Reveal } from '@/components/ui';

/**
 * Describes the advisor’s response contract rather than demonstrating an answer:
 * showing an invented recommendation here would break the same rule the product
 * enforces, so the card is labelled as the structure, with no fabricated values.
 */
const CONTRACT = [
  {
    icon: ListChecks,
    label: 'evidence_used',
    body: 'The specific platform records the answer relies on — each one traceable to a publisher and an observation date.',
  },
  {
    icon: Bot,
    label: 'recommendation',
    body: 'Guidance framed as agricultural decision support. It does not claim to diagnose soil, guarantee a harvest, or promise an income.',
  },
  {
    icon: TriangleAlert,
    label: 'uncertainty + limitations',
    body: 'What the evidence cannot settle, including literature-based ranges, survey lag and missing months, stated in the answer itself.',
  },
  {
    icon: CircleCheck,
    label: 'abstained',
    body: 'When the assembled evidence cannot support an answer, the advisor returns no recommendation and names the gap instead.',
  },
];

export function AdvisorSection() {
  return (
    <section id="advisory" className="relative overflow-hidden border-b border-line bg-brand-950">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_60%_at_15%_20%,oklch(0.35_0.09_155/55%),transparent_70%)]"
      />
      <div className="relative mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-24">
        <Reveal>
          <p className="text-[11px] font-bold tracking-[0.2em] text-brand-300 uppercase">The AI layer</p>
          <h2 className="mt-4 text-[29px] leading-[1.12] font-extrabold tracking-[-0.025em] text-white md:text-[38px]">
            An assistant that is only allowed to reason over what the platform can prove
          </h2>
          <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-brand-50/80">
            The advisor receives the evidence bundle the other modules assembled — live climate for your
            coordinates, the cited crop profile, soil-management practices, surveyed prices with their
            observation months — and answers in a fixed structure. It is not connected to a farm, a soil
            lab, or a futures exchange, and it says so.
          </p>
          <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-brand-100/60">
            Answers require a model key on the deployment. Without one, the module reports itself
            unavailable and leaves every other module working — it does not fall back to invented advice.
          </p>

          <Link
            href="/dashboard/advisor"
            className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[14px] font-extrabold text-brand-800 transition-all duration-200 hover:-translate-y-0.5"
          >
            Open the AI Agricultural Advisor
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <Reveal delay={120}>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-start">
            <figure className="relative overflow-hidden rounded-2xl border border-white/12">
              <Image
                src="/images/advisor-farmer.jpg"
                alt="An Ethiopian farmer in a white netala shawl holding a basic mobile phone, listening to an advisory conversation"
                width={900}
                height={1200}
                sizes="(max-width: 639px) 100vw, 340px"
                className="aspect-[3/4] h-full w-full object-cover"
              />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-950/85 to-transparent" />
            </figure>

            <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-xl">
              <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-brand-200 uppercase">
                <ShieldCheck size={13} />
                Response contract
              </p>
              <ul className="mt-4 space-y-4">
                {CONTRACT.map(({ icon: Icon, label, body }) => (
                  <li key={label} className="flex gap-3">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-brand-200 ring-1 ring-white/12 ring-inset">
                      <Icon size={14} strokeWidth={2.1} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[12px] font-bold text-white">{label}</span>
                      <span className="mt-1 block text-[12.5px] leading-relaxed text-brand-50/70">{body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
