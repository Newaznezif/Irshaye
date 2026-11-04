'use client';

import { useEffect, useState } from 'react';
import { Bot, Database, MapPin, Moon, Settings, Sprout, Sun, User } from 'lucide-react';
import { useWorkbench } from '@/context/WorkbenchContext';
import { useTheme } from '@/hooks/useTheme';
import { Badge, Button, DataRow, PageHeader, Panel, SkeletonPanel } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { getCrop } from '@/lib/crops/catalog';

type AdvisorStatus = { configured: boolean };
type DataStatus = { ok: boolean; data?: { sources?: { id: string; status: string }[] } | null };

/** Only these three states are reportable here, so the badge wording stays a closed set. */
type IntegrationState = 'connected' | 'unavailable' | 'not_configured';

function IntegrationRow({
  icon: Icon,
  name,
  state,
  detail,
}: {
  icon: typeof Bot;
  name: string;
  state: IntegrationState;
  detail: string;
}) {
  const { t } = useLanguage();
  const tone = state === 'connected' ? 'brand' : state === 'not_configured' ? 'gold' : 'clay';
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
        {t(`statusLabel.${state}`)}
      </Badge>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useLanguage();
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
        eyebrow={t('nav.group.Platform')}
        title={t('module.settings.label')}
        icon={Settings}
        description={t('settings.pageDescription')}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel title={t('settings.savedContext')} icon={MapPin} hint={t('settings.savedContextHint')}>
          <dl className="divide-y divide-line">
            <DataRow label={t('picker.location')}>
              {place.name}
              {place.admin1 ? ` — ${place.admin1}` : ''}{' '}
              <span className="tabular text-ink-faint">
                ({place.latitude.toFixed(3)}, {place.longitude.toFixed(3)})
              </span>
            </DataRow>
            <DataRow label={t('settings.crop')}>
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
                t('settings.noCuratedProfile')
              )}
            </DataRow>
            <DataRow label={t('settings.storage')}>
              <span className="text-[12.5px] font-semibold text-ink-muted">{t('settings.storageDeviceOnly')}</span>
            </DataRow>
          </dl>
        </Panel>

        <Panel
          title={t('shell.appearance')}
          icon={dark ? Sun : Moon}
          hint={t('settings.appearanceHint')}
        >
          <Button
            variant="secondary"
            onClick={toggle}
            leading={dark ? <Sun size={15} /> : <Moon size={15} />}
          >
            {dark ? t('settings.switchToLight') : t('settings.switchToDark')}
          </Button>
          <p className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-[11.5px] text-ink-faint">
            <Badge tone="brand" dot>
              {t('prov.kind.observed')}
            </Badge>
            <Badge tone="info" dot>
              {t('prov.kind.modeled')}
            </Badge>
            <Badge tone="plum" dot>
              {t('prov.kind.forecast')}
            </Badge>
            <Badge tone="gold" dot>
              {t('common.derivedHere')}
            </Badge>
            <span>{t('settings.colourSemantics')}</span>
          </p>
        </Panel>
      </div>

      <Panel title={t('settings.integrationStatus')} icon={Database} hint={t('settings.integrationHint')}>
        {!advisor || !dataStatus ? (
          <SkeletonPanel rows={4} />
        ) : (
          <div className="divide-y divide-line">
            <IntegrationRow
              icon={Database}
              name={t('settings.openDataName')}
              state={dataStatus.ok ? 'connected' : 'unavailable'}
              detail={t('settings.openDataDetail')}
            />
            <IntegrationRow
              icon={Bot}
              name={t('settings.advisorName')}
              state={advisor.configured ? 'connected' : 'not_configured'}
              detail={t('settings.advisorDetail')}
            />
            <IntegrationRow
              icon={Sprout}
              name={t('settings.referenceName')}
              state="connected"
              detail={t('settings.referenceDetail')}
            />
            <IntegrationRow
              icon={User}
              name={t('settings.accountsName')}
              state="not_configured"
              detail={t('settings.accountsDetail')}
            />
          </div>
        )}
      </Panel>
    </div>
  );
}
