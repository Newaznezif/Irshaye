'use client';

import Link from 'next/link';
import { ArrowRight, Globe, Users, Waypoints } from 'lucide-react';
import { Reveal } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';

const AUDIENCES = [
  { icon: Users, key: 'a1' },
  { icon: Waypoints, key: 'a2' },
  { icon: Globe, key: 'a3' },
] as const;

export function CallToAction() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-line bg-canvas py-20 md:py-24">
      <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-12 px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <Reveal>
          <h2 className="text-[28px] leading-[1.13] font-extrabold tracking-[-0.025em] text-ink md:text-[36px]">
            {t('cta.title')}
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-muted">{t('cta.lede')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-[15px] font-extrabold text-brand-ink shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-hover"
            >
              {t('cta.primary')}
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard/sources"
              className="inline-flex items-center justify-center rounded-xl border border-line-strong bg-surface px-6 py-3.5 text-[15px] font-bold text-ink transition-colors duration-200 hover:border-brand/40 hover:bg-brand-soft/60"
            >
              {t('cta.secondary')}
            </Link>
          </div>
        </Reveal>

        <Reveal delay={110}>
          <p className="text-[11px] font-bold tracking-[0.2em] text-brand-700 uppercase dark:text-brand-300">
            {t('cta.eyebrow')}
          </p>
          <ul className="mt-6 space-y-5">
            {AUDIENCES.map(({ icon: Icon, key }) => (
              <li
                key={key}
                className="flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-700 ring-1 ring-inset ring-brand/15 dark:text-brand-300">
                  <Icon size={17} strokeWidth={2.1} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-extrabold tracking-tight text-ink">{t(`cta.${key}Title`)}</span>
                  <span className="mt-1.5 block text-[12.5px] leading-relaxed text-ink-muted">{t(`cta.${key}Body`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
