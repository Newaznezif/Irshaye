import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Database, Radio } from 'lucide-react';
import { LiveConditionsCard } from './LiveConditionsCard';

const TRUST = [
  { icon: BadgeCheck, label: 'No account, no API key to start' },
  { icon: Database, label: 'Open data only, licence stated' },
  { icon: Radio, label: 'Live publishers, probed on demand' },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-950">
      <Image
        src="/images/hero-highlands.jpg"
        alt="Terraced smallholder farmland in the Ethiopian highlands at sunrise, with stone contour bunds and traditional thatched farmsteads"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-[0.55]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/80 to-brand-950/25" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-950 via-transparent to-brand-950/60" />

      <div className="relative mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-28">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/12 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-brand-100 uppercase backdrop-blur-sm">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            AgroInnovation Festival 2026 · Ethiopia
          </p>

          <h1 className="mt-6 text-[40px] leading-[1.04] font-extrabold tracking-[-0.03em] text-white sm:text-[54px] lg:text-[62px]">
            Climate-smart farming,
            <br />
            decided on{' '}
            <span className="bg-gradient-to-r from-brand-200 via-brand-300 to-gold-300 bg-clip-text text-transparent">
              evidence
            </span>
            .
          </h1>

          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-brand-50/85 md:text-[17.5px]">
            IRSHAYE is an AI-assisted digital platform for climate-smart agriculture in Ethiopia. Choose a
            place and a crop, and it assembles live climate intelligence, source-cited crop guidance,
            soil-management practices and real market prices — then explains what they mean, where every
            number came from, and how much to trust it.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-extrabold text-brand-800 shadow-[0_18px_45px_-18px_oklch(0.9_0.05_150/45%)] transition-all duration-200 hover:-translate-y-0.5"
            >
              Start with your location and crop
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="#data"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-[15px] font-bold text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/10"
            >
              See the data behind it
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[12.5px] font-semibold text-brand-100/80">
                <Icon size={14} className="text-brand-300" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-start lg:justify-end">
          <LiveConditionsCard />
        </div>
      </div>
    </section>
  );
}
