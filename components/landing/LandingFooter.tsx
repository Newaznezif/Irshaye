import Link from 'next/link';
import { Sprout } from 'lucide-react';
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
  return (
    <footer className="bg-brand-950 text-brand-50">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-16 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="IRSHAYE home">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white">
                <Sprout size={17} strokeWidth={2.4} />
              </span>
              <span className="text-[16px] font-extrabold tracking-[-0.01em] text-white">IRSHAYE</span>
            </Link>
            <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-brand-100/65">
              An AI-assisted digital platform for climate-smart agriculture in Ethiopia. Location-based
              climate intelligence, crop and soil guidance, and market prices — with the evidence attached.
            </p>
            <p className="mt-4 text-[10px] font-bold tracking-[0.18em] text-brand-300 uppercase">
              AgroInnovation Festival 2026
            </p>
          </div>

          <nav aria-label="Platform modules">
            <h2 className="text-[10px] font-bold tracking-[0.18em] text-brand-200/70 uppercase">Modules</h2>
            <ul className="mt-4 space-y-2.5">
              {MODULES.map((module) => (
                <li key={module.href}>
                  <Link
                    href={module.href}
                    className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white"
                  >
                    {module.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Data publishers">
            <h2 className="text-[10px] font-bold tracking-[0.18em] text-brand-200/70 uppercase">Publishers</h2>
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

          <nav aria-label="On this page">
            <h2 className="text-[10px] font-bold tracking-[0.18em] text-brand-200/70 uppercase">Overview</h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a href="#how-it-works" className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white">
                  How IRSHAYE works
                </a>
              </li>
              <li>
                <a href="#intelligence" className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white">
                  Climate, crops, soil, markets
                </a>
              </li>
              <li>
                <a href="#advisory" className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white">
                  The AI layer
                </a>
              </li>
              <li>
                <a href="#data" className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white">
                  Source registry
                </a>
              </li>
              <li>
                <Link
                  href="/dashboard/settings"
                  className="text-[12.5px] font-semibold text-brand-50/75 transition-colors hover:text-white"
                >
                  Saved place and crop
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-7">
          <p className="max-w-4xl text-[11.5px] leading-relaxed text-brand-100/55">
            IRSHAYE provides agricultural decision support, not guarantees. Recommendations do not claim
            yield, income or water-savings outcomes that have not been measured on the ground, and no
            module diagnoses soil conditions without measurement. Literature-based crop ranges are
            documented preferences, not readings of your field. Satellite vegetation indices describe
            canopy greenness, not soil quality. Where a publisher does not return data, the platform
            reports the gap instead of substituting a value.
          </p>
          <p className="mt-4 text-[11.5px] text-brand-100/45">
            Weather and climate: Open-Meteo (CC BY 4.0) and NASA POWER. Rainfall and temperature normals:
            ERA5 reanalysis via Open-Meteo. Market prices: WFP Ethiopia rEMS and World Bank real-time
            series via HDX. Exchange rates: National Bank of Ethiopia and World Bank. Boundaries and
            satellite layers: geoBoundaries, NASA GIBS, Ethiopia.GeoPortal on ArcGIS, GRID3/WorldPop and
            CDE — licences as stated on the Data Sources page.
          </p>
        </div>
      </div>
    </footer>
  );
}
