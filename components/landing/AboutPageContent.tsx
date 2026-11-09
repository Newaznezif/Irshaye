'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

const PRINCIPLES = [
  { title: 'about.principleEvidenceTitle', body: 'about.principleEvidenceBody', number: '01' },
  { title: 'about.principleHonestyTitle', body: 'about.principleHonestyBody', number: '02' },
  { title: 'about.principleUtilityTitle', body: 'about.principleUtilityBody', number: '03' },
] as const;

export function AboutPageContent() {
  const { t } = useLanguage();

  return (
    <main id="main">
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
          <div className="absolute -right-24 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-48 left-0 h-[26rem] w-[26rem] rounded-full bg-emerald-400/15 blur-3xl" />
        </div>
        <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.22em] text-brand-300 uppercase">{t('about.eyebrow')}</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {t('about.title')}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-brand-100/75 sm:text-lg">{t('about.intro')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-brand-100">{t('about.role')}</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-brand-100">{t('about.location')}</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[390px]">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-2 shadow-2xl shadow-black/30">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-brand-900">
                <Image
                  src="/images/founder-profile.jpg"
                  alt={t('about.photoAlt')}
                  fill
                  priority
                  sizes="(max-width: 768px) 90vw, 390px"
                  className="object-cover object-center"
                />
              </div>
              <div className="px-5 py-5">
                <p className="text-xl font-bold tracking-tight">Newaz Nezif Abagero</p>
                <p className="mt-1 text-sm text-brand-200">{t('about.role')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-12 md:grid-cols-[0.72fr_1.28fr] md:gap-20">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-brand-700 uppercase">{t('about.backgroundTitle')}</p>
            <div className="mt-5 h-1 w-14 rounded-full bg-brand-600" />
          </div>
          <p className="max-w-3xl text-lg leading-9 text-ink-muted">{t('about.backgroundBody')}</p>
        </div>
      </section>

      <section className="border-y border-line bg-surface-subtle">
        <div className="mx-auto grid w-full max-w-[1180px] gap-12 px-5 py-16 md:grid-cols-2 md:gap-20 md:px-8 md:py-20">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-brand-700 uppercase">{t('about.motivationTitle')}</p>
            <p className="mt-5 text-2xl font-bold leading-snug tracking-tight text-ink sm:text-3xl">Agriculture deserves decision tools grounded in evidence.</p>
          </div>
          <p className="text-base leading-8 text-ink-muted">{t('about.motivationBody')}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-12 md:grid-cols-[0.72fr_1.28fr] md:gap-20">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-brand-700 uppercase">{t('about.platformTitle')}</p>
            <div className="mt-5 h-1 w-14 rounded-full bg-brand-600" />
          </div>
          <div>
            <p className="text-lg leading-9 text-ink-muted">{t('about.platformBody')}</p>
            <Link href="/" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition-colors hover:text-brand-900">
              Explore IRSHAYE <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-brand-950 text-white">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-16 md:px-8 md:py-20">
          <p className="text-[11px] font-bold tracking-[0.2em] text-brand-300 uppercase">{t('about.principlesTitle')}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <article key={principle.number} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
                <p className="text-xs font-bold tracking-[0.18em] text-brand-300">{principle.number}</p>
                <h2 className="mt-6 text-xl font-bold tracking-tight">{t(principle.title)}</h2>
                <p className="mt-3 text-sm leading-7 text-brand-100/65">{t(principle.body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-8 md:py-20">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">{t('about.connectTitle')}</h2>
          <p className="mt-3 text-sm leading-7 text-ink-muted">{t('about.connectBody')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="https://www.linkedin.com/in/newaz-nezif-285439262/" target="_blank" rel="noreferrer noopener" className="rounded-xl border border-line px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-brand-500 hover:text-brand-700">{t('about.linkedin')}</a>
          <a href="https://github.com/NewazNezif" target="_blank" rel="noreferrer noopener" className="rounded-xl border border-line px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-brand-500 hover:text-brand-700">{t('about.github')}</a>
          <a href="https://newaznezif.netlify.app/" target="_blank" rel="noreferrer noopener" className="rounded-xl border border-line px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-brand-500 hover:text-brand-700">{t('about.portfolio')}</a>
          <a href="mailto:newaznezif@gmail.com" className="rounded-xl bg-brand-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800">{t('about.email')}</a>
        </div>
      </section>
    </main>
  );
}
