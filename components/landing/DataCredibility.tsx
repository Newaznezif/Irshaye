import Link from 'next/link';
import { ArrowRight, ExternalLink, Landmark, Layers, Satellite, Sprout, Store, Sun } from 'lucide-react';
import type { SourceDescriptor } from '@/lib/data/types';
import { SOURCES } from '@/lib/data/sources';
import { Badge, Reveal, SectionLabel } from '@/components/ui';

const CATEGORY_META: Record<
  SourceDescriptor['category'],
  { label: string; icon: typeof Sun; order: number }
> = {
  weather: { label: 'Weather & forecasts', icon: Sun, order: 1 },
  agroclimatology: { label: 'Agroclimatology', icon: Sprout, order: 2 },
  market_prices: { label: 'Market prices', icon: Store, order: 3 },
  exchange_rates: { label: 'Exchange rates', icon: Landmark, order: 4 },
  economic_benchmarks: { label: 'Economic benchmarks', icon: Landmark, order: 5 },
  geospatial: { label: 'Boundaries & satellite', icon: Satellite, order: 6 },
};

const CADENCE_LABEL: Record<SourceDescriptor['cadence'], string> = {
  realtime: 'real-time',
  hourly: 'hourly',
  daily: 'daily',
  '8daily': '8-day composite',
  monthly: 'monthly',
  quarterly: 'quarterly',
  annual: 'annual',
  irregular: 'irregular',
};

/**
 * Driven by the same registry the application reads, so the landing page cannot
 * advertise a publisher the product does not actually use.
 */
const ALL = Object.values(SOURCES);
const GROUPED = ALL.reduce<Record<string, SourceDescriptor[]>>((acc, source) => {
  (acc[source.category] ??= []).push(source);
  return acc;
}, {});
const CATEGORY_ORDER = (Object.keys(GROUPED) as SourceDescriptor['category'][]).sort(
  (a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order,
);

const KEY_COUNT = ALL.filter((s) => s.requiresKey).length;

export function DataCredibility() {
  return (
    <section id="data" className="border-b border-line bg-canvas py-20 md:py-24">
      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-16">
          <Reveal>
            <p className="text-[11px] font-bold tracking-[0.2em] text-brand-700 uppercase dark:text-brand-300">
              Data credibility
            </p>
            <h2 className="mt-4 text-[29px] leading-[1.12] font-extrabold tracking-[-0.025em] text-ink md:text-[36px]">
              {ALL.length} publishers, each named, licensed and time-stamped
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">
              IRSHAYE does not have a private data advantage. Its advantage is that every number on
              screen can be traced to a public publisher, a licence, a cadence, and a moment of
              observation — and that the interface distinguishes an observed value from a model output,
              a forecast, and a figure we derived here.
            </p>
            <ul className="mt-7 space-y-3 text-[13.5px] text-ink-muted">
              <li className="flex items-start gap-2.5">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {KEY_COUNT === 0
                  ? 'No upstream in this list needs an API key, so nothing is hidden behind a credential.'
                  : 'Publishers that need a credential are marked; the product degrades honestly without one.'}
              </li>
              <li className="flex items-start gap-2.5">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                Each source has its own freshness window — ERA5, POWER and 8-day satellite composites
                lag by design.
              </li>
              <li className="flex items-start gap-2.5">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                Two datasets state no licence from their publisher. They are shown for reading with
                attribution, and that limitation is written on screen.
              </li>
            </ul>

            <Link
              href="/dashboard/sources"
              className="group mt-8 inline-flex items-center gap-2 text-[14px] font-extrabold text-brand-700 transition-colors hover:text-brand-hover dark:text-brand-300"
            >
              Open live source status
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-panel md:p-7">
              <div className="flex items-center justify-between gap-4">
                <SectionLabel>Source registry</SectionLabel>
                <Badge tone="brand" dot>
                  Live from {ALL.length} publishers
                </Badge>
              </div>

              <div className="mt-5 space-y-7">
                {CATEGORY_ORDER.map((category) => {
                  const meta = CATEGORY_META[category];
                  const Icon = meta.icon;
                  return (
                    <div key={category}>
                      <p className="flex items-center gap-2 text-[12px] font-extrabold tracking-tight text-ink">
                        <Icon size={14} className="text-brand-700 dark:text-brand-300" />
                        {meta.label}
                      </p>
                      <ul className="mt-2.5 divide-y divide-line border-y border-line">
                        {GROUPED[category].map((source) => (
                          <li key={source.id} className="flex items-baseline justify-between gap-4 py-2.5">
                            <span className="min-w-0">
                              <a
                                href={source.homeUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="group inline-flex items-start gap-1.5 text-[13px] font-bold text-ink transition-colors hover:text-brand-hover"
                              >
                                <span className="min-w-0">{source.name}</span>
                                <ExternalLink
                                  size={12}
                                  className="mt-1 shrink-0 text-ink-faint transition-colors group-hover:text-brand"
                                />
                              </a>
                              <span className="mt-0.5 block max-w-xl text-[11.5px] leading-relaxed text-ink-faint">
                                {source.license}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-ink-muted">
                              <Layers size={11} className="text-ink-faint" />
                              {CADENCE_LABEL[source.cadence]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
