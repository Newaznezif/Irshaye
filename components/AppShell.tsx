'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Moon, Sprout, Sun, X } from 'lucide-react';
import { MODULE_GROUPS, MODULES, moduleByHref } from '@/lib/modules';
import { useTheme } from '@/hooks/useTheme';
import { useWorkbench } from '@/context/WorkbenchContext';
import { getCrop } from '@/lib/crops/catalog';
import { SectionLabel } from '@/components/ui';
import { cn } from '@/lib/utils';

const CONTENT_WIDTH = 'mx-auto w-full max-w-[1280px]';

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-xl px-1 py-1 outline-offset-4"
      aria-label="IRSHAYE home"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink shadow-[0_8px_18px_-8px_oklch(0.5_0.112_155/70%)] transition-transform duration-300 group-hover:-translate-y-0.5">
        <Sprout size={19} strokeWidth={2.3} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[17px] font-extrabold tracking-[-0.01em] text-ink">IRSHAYE</span>
        <span className="block text-[9.5px] font-bold tracking-[0.19em] text-brand-700 uppercase dark:text-brand-300">
          Climate-Smart Agriculture
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      {MODULE_GROUPS.map((group) => {
        const items = MODULES.filter((m) => m.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <SectionLabel className="px-3 pb-2">{group}</SectionLabel>
            <nav aria-label={group} className="flex flex-col gap-0.5">
              {items.map((m) => {
                const active =
                  m.href === '/dashboard' ? pathname === m.href : pathname.startsWith(m.href);
                const Icon = m.icon;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-200 outline-offset-2',
                      active
                        ? 'bg-brand text-brand-ink shadow-[0_10px_22px_-14px_oklch(0.3_0.06_155/90%)]'
                        : 'text-ink-muted hover:bg-brand-soft/70 hover:text-brand-900 dark:hover:text-brand-100',
                    )}
                  >
                    <Icon
                      size={17}
                      strokeWidth={2.1}
                      className={cn(
                        'shrink-0 transition-colors',
                        active ? 'text-brand-ink' : 'text-ink-faint group-hover:text-brand-600 dark:group-hover:text-brand-300',
                      )}
                    />
                    <span className="truncate">{m.label}</span>
                    {active && <span aria-hidden className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-75" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        );
      })}
    </div>
  );
}

function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-ink-muted transition-colors hover:border-line-strong hover:text-brand-700 dark:hover:text-brand-300"
    >
      {dark === null ? <span className="h-3.5 w-3.5 rounded-full bg-line-strong" /> : dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function SavedContext() {
  const { place, cropId } = useWorkbench();
  const crop = getCrop(cropId);
  return (
    <Link
      href="/dashboard"
      className="group block rounded-xl border border-line bg-canvas/70 px-3 py-2.5 transition-colors hover:border-brand/40 hover:bg-brand-soft/50"
    >
      <p className="text-[9.5px] font-bold tracking-[0.16em] text-ink-faint uppercase">Working context</p>
      <p className="mt-1 truncate text-[13px] font-bold text-ink">{place.name}</p>
      <p className="mt-0.5 truncate text-[11.5px] font-semibold text-ink-muted">
        {crop ? crop.name : 'No curated crop profile yet'}
      </p>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = moduleByHref(pathname);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-brand-ink"
      >
        Skip to content
      </a>

      <div className="mx-auto flex w-full max-w-[1640px]">
        <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
          <Brand />
          <div className="scroll-slim mt-7 flex-1 overflow-y-auto pr-1">
            <NavLinks />
          </div>
          <div className="mt-5 space-y-3 border-t border-line pt-4">
            <SavedContext />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-wide text-ink-faint uppercase">Appearance</span>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
            <div className={cn('flex h-14 items-center gap-3 px-4 md:px-6 lg:px-8', CONTENT_WIDTH)}>
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
                className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-ink-muted transition-colors hover:text-ink lg:hidden"
              >
                <Menu size={17} />
              </button>

              <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="IRSHAYE home">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-ink">
                  <Sprout size={15} strokeWidth={2.3} />
                </span>
                <span className="text-[15px] font-extrabold tracking-tight text-ink">IRSHAYE</span>
              </Link>

              <div className="hidden min-w-0 items-center gap-2 lg:flex">
                <span className="text-[11px] font-bold tracking-[0.16em] text-ink-faint uppercase">
                  {current?.group ?? 'Platform'}
                </span>
                <span aria-hidden className="text-ink-faint">
                  /
                </span>
                <span className="truncate text-[13.5px] font-bold text-ink">{current?.label ?? 'IRSHAYE'}</span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Link
                  href="/dashboard/sources"
                  className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-bold text-ink-muted transition-colors hover:border-brand/40 hover:text-brand-700 sm:inline-flex dark:hover:text-brand-300"
                >
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  Open data, live
                </Link>
                <div className="lg:hidden">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          {open && (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
              <button
                type="button"
                aria-label="Close navigation"
                className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              <div className="animate-rise absolute inset-y-0 left-0 flex w-[290px] max-w-[86vw] flex-col border-r border-line bg-surface px-4 py-5 shadow-lift">
                <div className="flex items-start justify-between gap-2">
                  <Brand onNavigate={() => setOpen(false)} />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close navigation"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-ink-muted"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="scroll-slim mt-6 flex-1 overflow-y-auto pr-1">
                  <NavLinks />
                </div>
                <div className="mt-4 border-t border-line pt-4">
                  <SavedContext />
                </div>
              </div>
            </div>
          )}

          <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8">
            <div className={cn('space-y-6', CONTENT_WIDTH)}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
