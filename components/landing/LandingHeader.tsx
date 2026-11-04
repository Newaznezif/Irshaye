'use client';

import Link from 'next/link';
import { Sprout } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/LanguageSelector';

const SECTION_KEYS = [
  { href: '#how-it-works', key: 'landing.navHow' },
  { href: '#intelligence', key: 'landing.navIntelligence' },
  { href: '#advisory', key: 'landing.navAdvisory' },
  { href: '#data', key: 'landing.navData' },
] as const;

export function LandingHeader() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-4 px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 outline-offset-4" aria-label={t('a11y.landingHome')}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-[0_8px_20px_-10px_oklch(0.6_0.13_155/90%)]">
            <Sprout size={17} strokeWidth={2.4} />
          </span>
          <span className="leading-none">
            <span className="block text-[16px] font-extrabold tracking-[-0.01em] text-white">IRSHAYE</span>
            <span className="mt-1 block text-[9px] font-bold tracking-[0.2em] text-brand-200 uppercase">
              {t('landing.eventTag')}
            </span>
          </span>
        </Link>

        <nav aria-label={t('a11y.landingSections')} className="hidden items-center gap-1 md:flex">
          {SECTION_KEYS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-brand-100/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              {t(section.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector tone="onDark" />
          <Link
            href="/dashboard/sources"
            className="hidden rounded-xl px-3 py-2 text-[13px] font-bold text-brand-100 transition-colors hover:bg-white/10 hover:text-white sm:block"
          >
            {t('landing.sourceStatus')}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-white px-4 py-2.5 text-[13px] font-extrabold text-brand-800 shadow-[0_10px_28px_-14px_oklch(0_0_0/80%)] transition-all duration-200 hover:-translate-y-px hover:shadow-lift"
          >
            {t('landing.openPlatform')}
          </Link>
        </div>
      </div>
    </header>
  );
}
