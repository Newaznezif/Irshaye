'use client';

import { Compass, CloudSun, Sprout, Layers, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';

const STEPS = [
  { icon: Compass, key: '1' },
  { icon: Sprout, key: '2' },
  { icon: CloudSun, key: '3' },
  { icon: Layers, key: '4' },
  { icon: Sparkles, key: '5' },
] as const;

export function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="relative border-b border-line bg-canvas py-20 md:py-28">
      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-8">
        <Reveal>
          <p className="text-[11px] font-bold tracking-[0.2em] text-brand-700 uppercase dark:text-brand-300">
            {t('how.eyebrow')}
          </p>
          <h2 className="mt-4 max-w-2xl text-[30px] leading-[1.12] font-extrabold tracking-[-0.025em] text-ink md:text-[40px]">
            {t('how.title')}
          </h2>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-muted">{t('how.lede')}</p>
        </Reveal>

        <div className="relative mt-14">
          <div
            aria-hidden
            className="absolute top-[38px] right-10 left-10 hidden h-px bg-gradient-to-r from-brand-200 via-gold-200 to-brand-200 lg:block dark:from-brand-800 dark:via-gold-700 dark:to-brand-800"
          />
          <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.key} delay={index * 90} className="h-full">
                  <li className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift">
                    <div className="flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-700 ring-1 ring-inset ring-brand/15 dark:text-brand-300">
                        <Icon size={21} strokeWidth={2} />
                      </span>
                      <span className="tabular text-[11px] font-extrabold tracking-[0.14em] text-ink-faint">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[15.5px] font-extrabold tracking-tight text-ink">
                      {t(`how.step${step.key}Title`)}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{t(`how.step${step.key}Body`)}</p>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
