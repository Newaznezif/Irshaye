'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, Moon, Sprout, Sun, X } from 'lucide-react';
import { MODULES } from '@/lib/modules';
import { useTheme } from '@/hooks/useTheme';

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
        <Sprout size={18} strokeWidth={2.4} />
      </span>
      <span className={compact ? '' : 'leading-tight'}>
        <span className="block text-lg font-black tracking-wide text-emerald-800 dark:text-emerald-300">
          IRSHAYE
        </span>
        {!compact && (
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
            Climate-Smart Agriculture
          </span>
        )}
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Modules" className="flex flex-col gap-1">
      {MODULES.map((m) => {
        const active =
          m.href === '/dashboard' ? pathname === m.href : pathname.startsWith(m.href);
        return (
          <Link
            key={m.href}
            href={m.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              active
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200/70 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 lg:hidden">
        <Brand compact />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="grid h-9 w-9 place-items-center rounded-xl border border-gray-200 text-gray-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open module menu"
            className="grid h-9 w-9 place-items-center rounded-xl border border-gray-200 text-gray-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Modules">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white p-4 shadow-xl dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-xl border border-gray-200 text-gray-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1500px]">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-gray-200/70 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950 lg:flex">
          <Brand />
          <div className="mt-6 flex-1 overflow-y-auto">
            <NavLinks />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 dark:border-zinc-800">
            <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Appearance</span>
            <button
              type="button"
              onClick={toggle}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
              {dark ? 'Light' : 'Dark'}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
