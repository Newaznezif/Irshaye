'use client';

import { CircleSlash, Scale, ScrollText, ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';

const RULES = [
  { icon: Scale, key: 'r1' },
  { icon: CircleSlash, key: 'r2' },
  { icon: ScrollText, key: 'r3' },
  { icon: ShieldCheck, key: 'r4' },
] as const;

export function IntegrityRules() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-line bg-canvas-tint py-16 md:py-20">
      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-8">
        <Reveal>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-brand-700 uppercase dark:text-brand-300">
                {t('rules.eyebrow')}
              </p>
              <h2 className="mt-3.5 max-w-2xl text-[26px] leading-[1.16] font-extrabold tracking-[-0.02em] text-ink md:text-[32px]">
                {t('rules.title')}
              </h2>
            </div>
            <p className="max-w-md text-[13.5px] leading-relaxed text-ink-muted">{t('rules.lede')}</p>
          </div>
        </Reveal>

        <div className="mt-11 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-line bg-line shadow-card sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map(({ icon: Icon, key }, index) => (
            <Reveal key={key} delay={index * 80} className="h-full">
              <article className="flex h-full flex-col bg-surface p-6 transition-colors duration-300 hover:bg-brand-50/50 dark:hover:bg-brand-950/30">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-700 ring-1 ring-inset ring-brand/15 dark:text-brand-300">
                  <Icon size={18} strokeWidth={2.1} />
                </span>
                <h3 className="mt-5 text-[14.5px] font-extrabold leading-snug tracking-tight text-ink">
                  {t(`rules.${key}Title`)}
                </h3>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-muted">{t(`rules.${key}Body`)}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
