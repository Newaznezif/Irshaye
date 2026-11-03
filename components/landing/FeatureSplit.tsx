import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui';

export type FeatureSplitProps = {
  id?: string;
  eyebrow: string;
  title: string;
  lede: string;
  bullets: { icon: LucideIcon; title: string; body: string }[];
  image: { src: string; alt: string };
  href: string;
  ctaLabel: string;
  /** Put the photograph on the left instead of the right. */
  flip?: boolean;
  tone?: 'brand' | 'canvas';
};

export function FeatureSplit({
  id,
  eyebrow,
  title,
  lede,
  bullets,
  image,
  href,
  ctaLabel,
  flip = false,
  tone = 'canvas',
}: FeatureSplitProps) {
  const surface = tone === 'brand' ? 'bg-brand-50/60 dark:bg-brand-950/25' : 'bg-canvas';

  return (
    <section id={id} className={`border-b border-line ${surface}`}>
      <div
        className={`mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-10 px-5 py-16 md:px-8 md:py-20 lg:gap-16 lg:py-24 ${
          flip ? 'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]' : 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]'
        }`}
      >
        <Reveal className={flip ? 'lg:order-2' : undefined}>
          <p className="text-[11px] font-bold tracking-[0.2em] text-brand-700 uppercase dark:text-brand-300">{eyebrow}</p>
          <h2 className="mt-4 text-[27px] leading-[1.14] font-extrabold tracking-[-0.025em] text-ink md:text-[34px]">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted">{lede}</p>

          <ul className="mt-8 space-y-5">
            {bullets.map(({ icon: Icon, title: bulletTitle, body }) => (
              <li key={bulletTitle} className="flex gap-4">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-brand-700 ring-1 ring-line shadow-card dark:text-brand-300">
                  <Icon size={17} strokeWidth={2.1} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-extrabold tracking-tight text-ink">{bulletTitle}</span>
                  <span className="mt-1 block max-w-lg text-[13px] leading-relaxed text-ink-muted">{body}</span>
                </span>
              </li>
            ))}
          </ul>

          <Link
            href={href}
            className="group mt-9 inline-flex items-center gap-2 text-[14px] font-extrabold text-brand-700 transition-colors hover:text-brand-hover dark:text-brand-300"
          >
            {ctaLabel}
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <Reveal delay={120} className={flip ? 'lg:order-1' : undefined}>
          <figure className="relative overflow-hidden rounded-3xl border border-line bg-canvas-tint shadow-panel">
            <Image
              src={image.src}
              alt={image.alt}
              width={1200}
              height={900}
              sizes="(max-width: 1023px) 100vw, 480px"
              className="aspect-[4/3] h-full w-full object-cover"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-ink/5 ring-inset" />
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
