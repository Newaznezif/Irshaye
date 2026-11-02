'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { useTheme } from '@/hooks/useTheme';
import { Panel, Loading } from '@/components/data/ui';
import { getCrop } from '@/lib/crops/catalog';

type AdvisorStatus = { configured: boolean };
type DataStatus = { ok: boolean; data?: { sources?: { id: string; status: string }[] } | null };

function IntegrationRow({ name, state, detail }: { name: string; state: string; detail: string }) {
  const tone =
    state === 'connected'
      ? 'text-emerald-600 dark:text-emerald-400'
      : state === 'not_configured'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-gray-500 dark:text-zinc-400';
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2.5 last:border-0 dark:border-zinc-800">
      <div>
        <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>
        <p className="text-xs text-gray-500 dark:text-zinc-400">{detail}</p>
      </div>
      <span className={`text-xs font-black uppercase tracking-wider ${tone}`}>
        {state.replaceAll('_', ' ')}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const { place, cropId } = useWorkbench();
  const { dark, toggle } = useTheme();
  const [advisor, setAdvisor] = useState<AdvisorStatus | null>(null);
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/advisor/status')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: AdvisorStatus) => {
        if (!cancelled) setAdvisor(body);
      })
      .catch(() => {
        if (!cancelled) setAdvisor({ configured: false });
      });
    fetch('/api/data/status?sources=light')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: DataStatus) => {
        if (!cancelled) setDataStatus(body);
      })
      .catch(() => {
        if (!cancelled) setDataStatus({ ok: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const crop = getCrop(cropId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">
          Every control on this page does something real. Accounts and shared workspaces arrive
          once the independent Irshaye Supabase project is provisioned — until then preferences are
          stored on this device only.
        </p>
      </div>

      <Panel title="Your saved context" hint="Stored in this browser. It drives the Overview workflow.">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/60">
            <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Location</dt>
            <dd className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
              {place.name}
              {place.admin1 ? ` — ${place.admin1}` : ''} ({place.latitude.toFixed(3)},{' '}
              {place.longitude.toFixed(3)})
            </dd>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/60">
            <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Crop</dt>
            <dd className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
              {crop ? `${crop.name}${crop.amharicName ? ` — ${crop.amharicName}` : ''}` : 'No curated profile yet'}
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Appearance">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          {dark ? 'Switch to light' : 'Switch to dark'}
        </button>
      </Panel>

      <Panel
        title="Integration status"
        hint="What this deployment can actually reach right now. Nothing here is decorative."
      >
        {!advisor && <Loading label="Checking integrations" />}
        {advisor && (
          <>
            <IntegrationRow
              name="Open data publishers (weather, climate, prices, satellite)"
              state={dataStatus?.ok ? 'connected' : 'unavailable'}
              detail="Key-free public APIs probed live via /api/data/status."
            />
            <IntegrationRow
              name="AI Agricultural Advisor (Gemini)"
              state={advisor.configured ? 'connected' : 'not_configured'}
              detail="Requires GEMINI_API_KEY in this environment. The advisor degrades to an honest unavailable state without it."
            />
            <IntegrationRow
              name="Accounts & saved records (Supabase)"
              state="not_configured"
              detail="Irshaye needs its own Supabase project before accounts are enabled. No shared credentials with any other application."
            />
          </>
        )}
      </Panel>
    </div>
  );
}
