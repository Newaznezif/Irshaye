'use client';

import { useState } from 'react';
import { Radio } from 'lucide-react';

import { Badge, PageHeader, SegmentedControl } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import type { FieldSessionStatus } from '@/hooks/useFieldSession';
import { useFieldSession } from '@/hooks/useFieldSession';
import type { TranslationKey } from '@/lib/i18n';

import { FieldAlertsSection } from '@/components/field/FieldAlertsSection';
import { FieldAnalyticsSection } from '@/components/field/FieldAnalyticsSection';
import { FieldDeviceManagementSection } from '@/components/field/FieldDeviceManagementSection';
import { FieldMapSection } from '@/components/field/FieldMapSection';
import { FieldOverviewSection } from '@/components/field/FieldOverviewSection';
import { FieldSessionPanel } from '@/components/field/FieldSessionPanel';
import { FieldSitesSection } from '@/components/field/FieldSitesSection';

/**
 * Field Intelligence — the operator's screen for the sensor network.
 *
 * Six sections, one at a time. The tab choice is the fetch policy: a section mounts only when it is
 * opened, so `/api/field/overview`, `/api/field/sites`, `/api/field/map`, `/api/field/alerts` and
 * `/api/hardware/devices` are never all requested to render a page somebody is reading one panel of.
 * That is the difference between a dashboard and a polling job, and it is why the site detail and the
 * sensor series are fetched inside their own children rather than staged here.
 *
 * Nothing on this page decides who may see what. Every panel passes the session's bearer token to a
 * route that resolves the caller's cooperatives on the server (`openScopedRead` /
 * `openManagement` in `lib/field/managementApi.ts`) and answers 401/403/404/503 accordingly; the
 * panels then render that answer as its own state. The one exception is deliberate and stated in
 * `FieldDeviceManagementSection`: management controls appear only when the server has already listed
 * a manage capability for a device this caller can see — and hiding a button is a courtesy, never a
 * permission.
 *
 * The signed-in identity is the only person-shaped fact shown, and it is shown because the operator
 * needs to know which account a refusal applies to. Roles and memberships are not printed: they are
 * per-request answers on the server, and a browser that displayed them as its own state would be a
 * browser running its own authorization.
 */

const SECTIONS = ['overview', 'sites', 'devices', 'analytics', 'alerts', 'map'] as const;

type Section = (typeof SECTIONS)[number];

const SECTION_LABEL_KEYS: Record<Section, TranslationKey> = {
  overview: 'field.tab.overview',
  sites: 'field.tab.sites',
  devices: 'field.tab.devices',
  analytics: 'field.tab.analytics',
  alerts: 'field.tab.alerts',
  map: 'field.tab.map',
};

const SESSION_BADGE: Record<FieldSessionStatus, { tone: 'brand' | 'gold' | 'clay' | 'neutral'; key: TranslationKey }> = {
  signed_in: { tone: 'brand', key: 'field.session.badgeIn' },
  signed_out: { tone: 'clay', key: 'field.session.badgeOut' },
  checking: { tone: 'gold', key: 'field.session.badgeChecking' },
  unconfigured: { tone: 'neutral', key: 'field.session.badgeUnconfigured' },
};

export function FieldIntelligenceView() {
  const { t } = useLanguage();
  const session = useFieldSession();
  const [section, setSection] = useState<Section>('overview');

  const badge = SESSION_BADGE[session.status];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('field.eyebrow')}
        title={t('module.field-intelligence.label')}
        description={t('field.pageDescription')}
        icon={Radio}
        status={
          <Badge tone={badge.tone} dot title={t('field.session.badgeTitle')}>
            {t(badge.key)}
          </Badge>
        }
      />

      <FieldSessionPanel
        status={session.status}
        email={session.user?.email ?? null}
        userId={session.user?.id ?? null}
        errorCode={session.errorCode}
        busy={session.busy}
        onSignIn={session.signIn}
        onSignOut={() => void session.signOut()}
      />

      <SegmentedControl
        label={t('field.sections')}
        value={section}
        onChange={setSection}
        size="sm"
        options={SECTIONS.map((value) => ({ value, label: t(SECTION_LABEL_KEYS[value]) }))}
      />

      {section === 'overview' && (
        <FieldOverviewSection sessionStatus={session.status} accessToken={session.accessToken} />
      )}
      {section === 'sites' && <FieldSitesSection sessionStatus={session.status} accessToken={session.accessToken} />}
      {section === 'devices' && (
        <FieldDeviceManagementSection sessionStatus={session.status} accessToken={session.accessToken} />
      )}
      {section === 'analytics' && (
        <FieldAnalyticsSection sessionStatus={session.status} accessToken={session.accessToken} />
      )}
      {section === 'alerts' && <FieldAlertsSection sessionStatus={session.status} accessToken={session.accessToken} />}
      {section === 'map' && <FieldMapSection sessionStatus={session.status} accessToken={session.accessToken} />}

      <p className="text-[11.5px] leading-relaxed text-ink-faint">{t('field.pageFootnote')}</p>
    </div>
  );
}
