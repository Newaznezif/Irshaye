'use client';

import { useEffect, useState } from 'react';
import { Bot, Database, MapPin, Moon, Settings, Sprout, Sun, User } from 'lucide-react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { useTheme } from '@/hooks/useTheme';
import { Badge, Button, DataRow, PageHeader, Panel, SkeletonPanel } from '@/components/ui';
import { getCrop } from '@/lib/crops/catalog';

type AdvisorStatus = { configured: boolean };
type DataStatus = { ok: boolean; data?: { sources?: { id: string; status: string }[] } | null };

function IntegrationRow({
  icon: Icon,
  name,
  state,
  detail,
}: {
  icon: typeof Bot;
  name: string;
  state: string;
  detail: string;
}) {
  const tone =
    state === 'connected' ? 'brand' : state === 'not_configured' ? 'gold' : 'clay';
  return (
    <div className="flex items-start justify-between gap-5 border-b border-line py-4 last:border-0">
      <div className="flex min-w-0 gap-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-700 ring-1 ring-inset ring-brand/15 dark:text-brand-300">
          <Icon size={16} strokeWidth={2.1} />
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-extrabold tracking-tight text-ink">{name}</p>
          <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-ink-muted">{detail}</p>
        </div>
      </div>
      <Badge tone={tone} className="mt-1 shrink-0">
        {state.replaceAll('_', ' ')}
      </Badge>
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        icon={Settings}
        description="Every control on this page does something real. Accounts and shared workspaces arrive once the independent Irshaye Supabase project is provisioned — until then preferences are stored on this device only."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title="Your saved context"
          icon={MapPin}
          hint="Stored in this browser. It drives the Overview workflow and every module’s default location."
        >
          <dl className="divide-y divide-line">
            <DataRow label="Location">
              {place.name}
              {place.admin1 ? ` — ${place.admin1}` : ''}{' '}
              <span className="tabular text-ink-faint">
                ({place.latitude.toFixed(3)}, {place.longitude.toFixed(3)})
              </span>
            </DataRow>
            <DataRow label="Crop">
              {crop ? (
                <>
                  {crop.name}
                  {crop.amharicName && (
                    <span lang="am" className="ethiopic ml-1.5 text-brand-700 dark:text-brand-300">
                      — {crop.amharicName}
                    </span>
                  )}
                </>
              ) : (
                'No curated profile yet'
              )}
            </DataRow>
            <DataRow label="Storage">
              <span className="text-[12.5px] font-semibold text-ink-muted">
                This device only — no account is created
              </span>
            </DataRow>
          </dl>
        </Panel>

        <Panel
          title="Appearance"
          icon={dark ? Sun : Moon}
          hint="The dark canvas keeps the same value-kind colours, so a forecast stays violet and an observation stays green either way."
        >
          <Button
            variant="secondary"
            onClick={toggle}
            leading={dark ? <Sun size={15} /> : <Moon size={15} />}
          >
            {dark ? 'Switch to light' : 'Switch to dark'}
          </Button>
          <p className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-[11.5px] text-ink-faint">
            <Badge tone="brand" dot>
              observed
            </Badge>
            <Badge tone="info" dot>
              modelled
            </Badge>
            <Badge tone="plum" dot>
              forecast
            </Badge>
            <Badge tone="gold" dot>
              derived here
            </Badge>
            <span>— the same colour semantics in both canvases.</span>
          </p>
        </Panel>
      </div>

      <Panel
        title="Integration status"
        icon={Database}
        hint="What this deployment can actually reach right now. Nothing here is decorative."
      >
        {!advisor || !dataStatus ? (
          <SkeletonPanel rows={4} />
        ) : (
          <div className="divide-y divide-line">
            <IntegrationRow
              icon={Database}
              name="Open data publishers (weather, climate, prices, satellite)"
              state={dataStatus.ok ? 'connected' : 'unavailable'}
              detail="Key-free public APIs probed live via /api/data/status."
            />
            <IntegrationRow
              icon={Bot}
              name="AI Agricultural Advisor (Gemini)"
              state={advisor.configured ? 'connected' : 'not_configured'}
              detail="Requires GEMINI_API_KEY in this environment. The advisor degrades to an honest unavailable state without it."
            />
            <IntegrationRow
              icon={Sprout}
              name="Crop and soil reference library"
              state="connected"
              detail="Curated, citation-backed profiles shipped with the application; not a live publisher."
            />
            <IntegrationRow
              icon={User}
              name="Accounts & saved records (Supabase)"
              state="not_configured"
              detail="Irshaye needs its own Supabase project before accounts are enabled. No shared credentials with any other application."
            />
          </div>
        )}
      </Panel>
    </div>
  );
}
