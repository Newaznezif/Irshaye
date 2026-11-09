'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { useLanguage } from '@/hooks/useLanguage';
import { MODULES } from '@/lib/modules';

const PUBLISHERS = [
  { label: 'Open-Meteo', href: 'https://open-meteo.com/' },
  { label: 'NASA POWER', href: 'https://power.larc.nasa.gov/' },
  { label: 'WFP via HDX', href: 'https://data.humdata.org/dataset/wfp-food-prices-for-ethiopia' },
  { label: 'National Bank of Ethiopia', href: 'https://nbe.gov.et/exchange/' },
  { label: 'World Bank Open Data', href: 'https://data.worldbank.org/country/ethiopia' },
  { label: 'NASA GIBS', href: 'https://worldview.earthdata.nasa.gov/' },
];

export function LandingFooter() {
  const { t } = useLanguage();
  return (
    <footer className="bg-brand-950 text-brand-50">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-16 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label={t('a11y.landingHome')}>
              <BrandLogo size="footer" />
            </Link>
            <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-brand-100/65">{t('footer.about')}</p>
            <p className="mt-4 text-[10px] font-bold tracking-[0.18em] text-brand-300 uppercase">
              AgroInnovation Festival 2026
            </p>
          </div>

          <nav aria-label={t('a11y.footerModules')}>
            <h2 className="text-[10px] font-bold tracking-[0.18em] text-brand-200/70 uppercase">
              {t('footer.modules')}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {MODULES.map((module) => (
                <li key={module.href}>
                  <Link
                    href={module.href}
                    className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white"
                  >
                    {t(`module.${module.id}.label`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t('a11y.footerPublishers')}>
            <h2 className="text-[10px] font-bold tracking-[0.18em] text-brand-200/70 uppercase">
              {t('footer.publishers')}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {PUBLISHERS.map((publisher) => (
                <li key={publisher.href}>
                  <a
                    href={publisher.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white"
                  >
                    {publisher.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t('a11y.footerPage')}>
            <h2 className="text-[10px] font-bold tracking-[0.18em] text-brand-200/70 uppercase">
              {t('footer.overview')}
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href="#how-it-works"
                  className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white"
                >
                  {t('footer.linkHow')}
                </a>
              </li>
              <li>
                <a
                  href="#intelligence"
                  className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white"
                >
                  {t('footer.linkIntelligence')}
                </a>
              </li>
              <li>
                <a
                  href="#advisory"
                  className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white"
                >
                  {t('footer.linkAdvisory')}
                </a>
              </li>
              <li>
                <a
                  href="#data"
                  className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white"
                >
                  {t('footer.linkRegistry')}
                </a>
              </li>
              <li>
                <Link
                  href="/dashboard/settings"
                  className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white"
                >
                  {t('footer.linkSaved')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-7">
          <p className="max-w-4xl text-[11.5px] leading-relaxed text-brand-100/55">{t('footer.disclaimer')}</p>
          <p className="mt-4 text-[11.5px] text-brand-100/45">{t('footer.attributions')}</p>
        </div>
      </div>
    </footer>
  );
}
