import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sprout } from 'lucide-react';
import { MODULES } from '@/lib/modules';

export const metadata: Metadata = {
  title: 'IRSHAYE — Climate-Smart Agricultural Intelligence for Ethiopia',
};

const PRINCIPLES = [
  {
    title: 'Evidence first',
    body: 'Every figure carries its source, its units, and the date it was observed or retrieved. Nothing is presented as a measurement when it is a model output.',
  },
  {
    title: 'Honest about gaps',
    body: 'When a publisher does not answer, the platform says so. IRSHAYE never substitutes invented weather, prices, or agronomic facts for missing data.',
  },
  {
    title: 'Built for Ethiopian farms',
    body: 'Real market centres from the WFP price survey, kiremt/belg rainfall context, and crop guidance for Ethiopian agroecologies.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Sprout size={20} strokeWidth={2.4} />
          </span>
          <span className="text-xl font-black tracking-wide text-emerald-800 dark:text-emerald-300">
            IRSHAYE
          </span>
        </span>
        <Link
          href="/dashboard"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-500"
        >
          Open the platform
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5">
        <section className="py-12 md:py-20">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
            AgroInnovation Festival 2026
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Climate-smart agricultural decisions,{' '}
            <span className="text-emerald-700 dark:text-emerald-400">grounded in evidence.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-zinc-300 md:text-lg">
            IRSHAYE is an AI-assisted digital platform for climate-smart agriculture in Ethiopia. A
            farmer picks a place and a crop; the platform assembles live climate intelligence, crop
            guidance, soil-management practices, and real market prices — then explains what they
            mean, where each number came from, and how certain it is.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-emerald-500"
            >
              Start with your location and crop <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard/sources"
              className="text-sm font-bold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              See every data source and its license
            </Link>
          </div>
        </section>

        <section aria-label="Principles" className="grid gap-4 pb-12 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="text-sm font-black text-emerald-800 dark:text-emerald-300">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{p.body}</p>
            </div>
          ))}
        </section>

        <section aria-label="Modules" className="pb-16">
          <h2 className="text-lg font-black">The eight modules</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {MODULES.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="group rounded-2xl border border-gray-200/70 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="flex items-center justify-between">
                  <span className="text-sm font-black text-gray-900 dark:text-white">{m.label}</span>
                  <ArrowRight
                    size={15}
                    className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:text-zinc-600"
                  />
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-zinc-400">
                  {m.description}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200/70 py-6 dark:border-zinc-800">
        <p className="mx-auto max-w-6xl px-5 text-xs text-gray-500 dark:text-zinc-500">
          IRSHAYE provides decision support, not guarantees. Recommendations do not claim yield,
          income, or water-savings outcomes, and never diagnose soil conditions without
          measurement. Weather: Open-Meteo · Climate normals: NASA POWER · Satellite: NASA GIBS ·
          Prices: WFP rEMS via HDX · FX: NBE and World Bank.
        </p>
      </footer>
    </div>
  );
}
