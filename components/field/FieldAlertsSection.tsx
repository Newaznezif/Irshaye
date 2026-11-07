'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { BellRing, ChevronLeft, ChevronRight, CircleCheck, Eye, Ruler, TriangleAlert } from 'lucide-react';

import { Badge, Button, DataRow, EmptyState, Panel, SectionLabel, SkeletonPanel, StateNotice, fmt, fmtInt, stamp } from '@/components/ui';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';
import { useLanguage } from '@/hooks/useLanguage';
import type { FieldSessionStatus } from '@/hooks/useFieldSession';
import { useLiveData } from '@/hooks/useLiveData';
import type { TranslationKey } from '@/lib/i18n';

import { FieldSectionState, reasonFor } from './FieldSectionState';
import { managementCall } from './api';
import {
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  ALERT_STATUS_KEYS,
  ALERT_STATUS_TONE,
  ALERT_TYPE_KEYS,
  METRIC_KEYS,
  RULE_STATUS_KEYS,
  SCOPE_ORIGIN_KEYS,
  SEVERITY_KEYS,
  SEVERITY_TONE,
  STATUS_KEYS,
  STATUS_TONE,
} from './labels';
import type { AlertActionResponse, AlertDetailResponse, AlertsResponse, AlertRow, AlertSeverity, AlertStatus, RuleRow } from './types';

/**
 * Alerts: the rows `field.device_alerts` holds, the rules that raised them, and the two things a
 * manager may do to one of them.
 *
 * **Nothing here evaluates anything.** That is the requirement rather than a gap. An alert on this
 * screen is a persisted row with a rule id, a severity and two timestamps, and the only thresholds it
 * mentions are the ones an operator wrote into `field.alert_rules`. Inventing a rule in a browser tab
 * — "below 30 % is dry" — would be an agronomic opinion wearing IRSHAYE's interface, and it would
 * arrive with no scope, no owner and no way to audit it. Rows get here in exactly two ways, both on
 * the server: the ingestion path evaluated a stored reading against the rules that cover that device,
 * or the platform raised a row for a payload the database refused.
 *
 * **Actions are statements about an incident record, not about a field.** Acknowledging says a person
 * has seen the row; the condition underneath it is untouched and the next confirming reading still
 * advances `last_observed_at`. Resolving says a person closed it; a later reading that breaches the
 * rule raises a *new* row rather than reopening this one, so closing an alert never suppresses the
 * condition. Both are audited, and both are refused for a viewer with `insufficient_role` — which is
 * why the buttons come from the `allowed_transitions` the detail response computed from the caller's
 * own role, and why clicking one still runs `decideAccess` again on the server.
 *
 * `unresolved` means `open` or `acknowledged` — the two statuses that still describe a live condition.
 * `dismissed` is not unresolved: a human closed it, and treating a dismissal as an active problem would
 * re-raise a decision the cooperative already made.
 */

const PAGE_SIZE = 25;

type AlertAction = 'acknowledge' | 'resolve';

type Result = { ok: true; action: AlertAction; changed: boolean } | { ok: false; action: AlertAction; code: string };

/**
 * The refusal codes an alert read or an alert action can answer with, each with the sentence an
 * operator needs. The server's own message is written for a log and is English-only, so it is not
 * rendered; an unmapped code falls back to a generic notice rather than being silently swallowed.
 */
const REFUSAL_KEYS: Record<string, TranslationKey> = {
  network: 'field.result.network',
  unauthenticated: 'field.result.unauthenticated',
  auth_unavailable: 'field.result.authUnavailable',
  not_a_member: 'field.result.notAMember',
  insufficient_role: 'field.result.insufficientRole',
  unknown_alert: 'field.result.unknownAlert',
  invalid_payload: 'field.result.invalidPayload',
  database_unavailable: 'field.result.databaseUnavailable',
  database_not_configured: 'field.result.databaseNotConfigured',
  internal_error: 'field.result.internalError',
};

const SUCCESS_NOTE: Record<AlertAction, TranslationKey> = {
  acknowledge: 'field.alerts.acknowledgedNote',
  resolve: 'field.alerts.resolvedNote',
};

/** The numbers behind an alert, rendered key by key. Nothing here dumps a JSON blob at an operator. */
function alertFacts(detail: Record<string, unknown> | null, locale: string): ReactNode {
  if (detail === null) return null;
  const observed = typeof detail.observed_value === 'number' ? detail.observed_value : null;
  const threshold = typeof detail.threshold_value === 'number' ? detail.threshold_value : null;
  const units = typeof detail.units === 'string' ? detail.units : null;
  const metric = typeof detail.metric === 'string' ? detail.metric : null;

  const facts: ReactNode[] = [];
  if (metric !== null) facts.push(<span key="m">{metric}</span>);
  if (observed !== null) facts.push(<span key="o" className="tabular">{`${fmt(observed, 1, locale)}${units === null ? '' : ` ${units}`}`}</span>);
  if (threshold !== null) facts.push(<span key="t" className="tabular">{`${fmt(threshold, 1, locale)}${units === null ? '' : ` ${units}`}`}</span>);
  if (facts.length === 0) return null;

  return <span className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-semibold text-ink-muted">{facts}</span>;
}

function RuleCard({ rule }: { rule: RuleRow }) {
  const { t, locale } = useLanguage();
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink">{rule.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-muted">
          <span>{t(METRIC_KEYS[rule.metric])}</span>
          <span className="tabular font-bold text-ink">
            {rule.comparator === 'lt' ? '<' : '>'} {rule.threshold_value === null ? '—' : fmt(rule.threshold_value, 1, locale)}
          </span>
          <span className="text-ink-faint">{rule.threshold_units}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Badge tone={SEVERITY_TONE[rule.severity]}>{t(SEVERITY_KEYS[rule.severity])}</Badge>
        <Badge tone={rule.status === 'enabled' ? 'brand' : 'neutral'}>{t(RULE_STATUS_KEYS[rule.status])}</Badge>
        <Badge tone="outline" title={t('field.alerts.scopeExplain')}>
          {t(SCOPE_ORIGIN_KEYS[rule.scope_origin])}
        </Badge>
      </div>
    </li>
  );
}

function ResultNotice({ result }: { result: Result }) {
  const { t } = useLanguage();
  if (result.ok) {
    return (
      <StateNotice tone="brand" title={result.changed ? t(SUCCESS_NOTE[result.action]) : t('field.alerts.unchanged')} icon={CircleCheck}>
        {t('field.alerts.serverRecheck')}
      </StateNotice>
    );
  }
  const key = REFUSAL_KEYS[result.code] ?? 'field.result.generic';
  return (
    <StateNotice tone="clay" title={t('field.result.refused')} icon={TriangleAlert} code={result.code}>
      {t(key)}
    </StateNotice>
  );
}

/**
 * One alert, the rule behind it, and the actions the server offered for it.
 *
 * The detail is a separate request from the list on purpose: scope is established server-side by
 * walking `alert_id` → `node_id` → `cooperative_id`, because `device_alerts` has no cooperative column
 * of its own. A viewer who may read this row is refused the two buttons below it — the same answer
 * `decideAccess` gives the route, whether or not this screen hid anything.
 */
function AlertDetail({ alertId, accessToken, onChanged }: { alertId: number; accessToken: string | null; onChanged: () => void }) {
  const { t, locale } = useLanguage();
  const [busy, setBusy] = useState<AlertAction | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const live = useLiveData<AlertDetailResponse, ProvenanceView>(`/api/field/alerts/${String(alertId)}`, { accessToken });

  async function run(action: AlertAction) {
    if (busy !== null) return;
    setBusy(action);
    // Spelled out per action rather than interpolated from the action name: the two paths are the two
    // routes that exist, and a path assembled from a variable is a path a documentation list cannot
    // check against.
    const call = await managementCall<AlertActionResponse>(
      action === 'acknowledge'
        ? `/api/field/alerts/${String(alertId)}/acknowledge`
        : `/api/field/alerts/${String(alertId)}/resolve`,
      { method: 'POST', accessToken },
    );
    setBusy(null);
    if (!call.ok) {
      setResult({ ok: false, action, code: call.code ?? 'unexpected' });
      return;
    }
    // The response carries the row as the server now holds it, so an idempotent retry reports
    // `changed: false` rather than claiming a second write.
    setResult({ ok: true, action, changed: call.data?.changed === true });
    live.reload();
    onChanged();
  }

  const title = t('field.alerts.detailTitle', { id: String(alertId) });

  if (live.loading) {
    return (
      <Panel title={title} icon={BellRing}>
        <SkeletonPanel rows={4} />
      </Panel>
    );
  }
  if (live.error !== null || live.data === null) {
    return (
      <Panel title={title} icon={BellRing}>
        <FieldSectionState reason={reasonFor({ sessionStatus: 'signed_in', error: live.error, isEmpty: false })} code={live.error?.code} />
      </Panel>
    );
  }

  const detail = live.data;
  const allowed = detail.allowed_transitions;

  return (
    <Panel
      title={t('field.alerts.detailTitle', { id: String(detail.alert.alert_id) })}
      icon={BellRing}
      hint={t('field.alerts.detailHint')}
      right={
        <div className="flex items-center gap-1.5">
          <Badge tone={SEVERITY_TONE[detail.alert.severity]} dot>
            {t(SEVERITY_KEYS[detail.alert.severity])}
          </Badge>
          <Badge tone={ALERT_STATUS_TONE[detail.alert.status]}>{t(ALERT_STATUS_KEYS[detail.alert.status])}</Badge>
        </div>
      }
    >
      <div className="space-y-4">
        {result !== null && <ResultNotice result={result} />}

        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <DataRow label={t('field.alerts.type')}>
            {detail.alert.alert_type in ALERT_TYPE_KEYS ? t(ALERT_TYPE_KEYS[detail.alert.alert_type]) : detail.alert.alert_type}
          </DataRow>
          <DataRow label={t('field.alerts.statusLabel')}>{t(ALERT_STATUS_KEYS[detail.alert.status])}</DataRow>
          <DataRow label={t('field.alerts.firstRaisedShort')}>{stamp(detail.alert.first_raised_at, locale)}</DataRow>
          <DataRow label={t('field.alerts.lastObservedShort')}>{stamp(detail.alert.last_observed_at, locale)}</DataRow>
          <DataRow label={t('field.alerts.resolvedLabel')}>
            {detail.alert.resolved_at === null ? t('field.alerts.notClosed') : stamp(detail.alert.resolved_at, locale)}
          </DataRow>
          <DataRow label={t('field.alerts.device')}>
            {detail.device === null ? t('field.alerts.deviceGone') : `${detail.device.name} · ${detail.device.node_id}`}
          </DataRow>
          {detail.device !== null && (
            <>
              <DataRow label={t('field.alerts.deviceStatus')}>
                <Badge tone={STATUS_TONE[detail.device.status]}>{t(STATUS_KEYS[detail.device.status])}</Badge>
              </DataRow>
              <DataRow label={t('field.alerts.deviceLastSeen')}>{stamp(detail.device.last_seen_at, locale)}</DataRow>
              <DataRow label={t('field.alerts.deviceSite')}>{detail.device.field_site_id === null ? '—' : String(detail.device.field_site_id)}</DataRow>
              <DataRow label={t('field.alerts.deviceCooperative')}>{detail.device.cooperative_id === null ? '—' : String(detail.device.cooperative_id)}</DataRow>
            </>
          )}
        </div>

        <div>
          <SectionLabel>{t('field.alerts.ruleTitle')}</SectionLabel>
          {detail.rule === null ? (
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{t('field.alerts.noRuleBehind')}</p>
          ) : (
            <ul className="mt-1">
              <RuleCard rule={detail.rule} />
            </ul>
          )}
        </div>

        <div>
          <SectionLabel>{t('field.alerts.evidenceTitle')}</SectionLabel>
          {detail.evidence === null ? (
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{t('field.alerts.evidenceNone')}</p>
          ) : (
            <>
              <div className="mt-1.5">{alertFacts(detail.evidence, locale)}</div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">{t('field.alerts.evidenceStored')}</p>
            </>
          )}
        </div>

        <div>
          <SectionLabel>{t('field.alerts.actionsTitle')}</SectionLabel>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {allowed.includes('alert_acknowledge') && (
              <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void run('acknowledge')} leading={<Eye size={14} />}>
                {t('field.alerts.acknowledge')}
              </Button>
            )}
            {allowed.includes('alert_resolve') && (
              <Button size="sm" variant="primary" disabled={busy !== null} onClick={() => void run('resolve')} leading={<CircleCheck size={14} />}>
                {t('field.alerts.resolve')}
              </Button>
            )}
            {allowed.length === 0 && <p className="text-[11.5px] leading-relaxed text-ink-faint">{t('field.alerts.noTransition')}</p>}
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
            {detail.capabilities.includes('alert_acknowledge')
              ? t('field.alerts.actionsManager')
              : t('field.alerts.actionsViewer')}
          </p>
        </div>
      </div>
    </Panel>
  );
}

export function FieldAlertsSection({
  sessionStatus,
  accessToken,
}: {
  sessionStatus: FieldSessionStatus;
  accessToken: string | null;
}) {
  const { t, locale } = useLanguage();
  const [status, setStatus] = useState<AlertStatus | ''>('');
  const [severity, setSeverity] = useState<AlertSeverity | ''>('');
  const [offset, setOffset] = useState(0);
  // The alert whose detail is open. An id rather than a row: the detail panel re-reads from the
  // server, so a stale list row can never be rendered as a current one.
  const [openId, setOpenId] = useState<number | null>(null);

  const params = `${status === '' ? '' : `&status=${status}`}${severity === '' ? '' : `&severity=${severity}`}`;
  const live = useLiveData<AlertsResponse, ProvenanceView>(
    sessionStatus === 'signed_in' ? `/api/field/alerts?limit=${String(PAGE_SIZE)}&offset=${String(offset)}${params}` : null,
    { accessToken },
  );
  const data = live.data;

  const shell = (body: ReactNode, right?: ReactNode) => (
    <Panel title={t('field.alerts.title')} icon={BellRing} hint={t('field.alerts.hint')} right={right}>
      {body}
    </Panel>
  );

  if (sessionStatus !== 'signed_in') {
    return shell(<FieldSectionState reason={reasonFor({ sessionStatus, error: null, isEmpty: false })} />);
  }
  if (live.loading) return shell(<SkeletonPanel rows={4} />);
  if (live.error !== null || data === null) {
    return shell(<FieldSectionState reason={reasonFor({ sessionStatus, error: live.error, isEmpty: false })} code={live.error?.code} />);
  }

  const lastOffset = Math.max(0, Math.floor((data.total - 1) / PAGE_SIZE) * PAGE_SIZE);

  const alerts: ReactNode = data.alerts.length === 0 ? (
    <div className="space-y-3">
      <EmptyState icon={BellRing} title={t('field.alerts.emptyTitle')} hint={t('field.alerts.emptyHint')} />
      <p className="text-[11.5px] leading-relaxed text-ink-faint">{t('field.alerts.emptyWhy')}</p>
    </div>
  ) : (
    <>
      <ul className="divide-y divide-line">
        {data.alerts.map((alert: AlertRow) => (
          <li key={alert.alert_id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 basis-60 flex-1">
                <p className="text-sm font-extrabold text-ink">
                  {alert.alert_type in ALERT_TYPE_KEYS ? t(ALERT_TYPE_KEYS[alert.alert_type]) : alert.alert_type}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-muted">
                  <span className="font-semibold text-ink">{alert.device_name ?? t('field.alerts.unknownDevice')}</span>
                  <span className="font-mono text-[11px] text-ink-faint">{alert.node_id}</span>
                  {alert.site_id !== null && (
                    <span className="text-[11px] text-ink-faint">{t('field.alerts.siteRef', { id: String(alert.site_id) })}</span>
                  )}
                </p>
                <div className="mt-1.5">{alertFacts(alert.detail, locale)}</div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Badge tone={SEVERITY_TONE[alert.severity]} dot>
                    {t(SEVERITY_KEYS[alert.severity])}
                  </Badge>
                  <Badge tone={ALERT_STATUS_TONE[alert.status]}>{t(ALERT_STATUS_KEYS[alert.status])}</Badge>
                </div>
                <p className="text-[11.5px] text-ink-faint">
                  {t('field.alerts.firstRaised', { at: stamp(alert.first_raised_at, locale) })}
                </p>
                <p className="text-[11.5px] text-ink-faint">
                  {t('field.alerts.lastObserved', { at: stamp(alert.last_observed_at, locale) })}
                </p>
                {alert.resolved_at !== null && (
                  <p className="text-[11.5px] font-semibold text-brand-700 dark:text-brand-300">
                    {t('field.alerts.resolvedAt', { at: stamp(alert.resolved_at, locale) })}
                  </p>
                )}
                <Button size="sm" variant="ghost" onClick={() => setOpenId(alert.alert_id)} leading={<Eye size={14} />}>
                  {t('field.alerts.viewDetails')}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
        <p className="tabular text-[11.5px] text-ink-faint">
          {t('field.alerts.pageRange', { from: String(offset + 1), to: String(Math.min(offset + PAGE_SIZE, data.total)), total: String(data.total) })}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0} leading={<ChevronLeft size={14} />}>
            {t('field.alerts.previous')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOffset(Math.min(lastOffset, offset + PAGE_SIZE))} disabled={offset >= lastOffset} trailing={<ChevronRight size={14} />}>
            {t('field.alerts.next')}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      {shell(
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>{t('field.alerts.filterStatus')}</SectionLabel>
            <Button size="sm" variant={status === '' ? 'primary' : 'secondary'} onClick={() => { setStatus(''); setOffset(0); }}>
              {t('field.alerts.anyStatus')}
            </Button>
            {ALERT_STATUSES.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={status === option ? 'primary' : 'secondary'}
                onClick={() => { setStatus(option); setOffset(0); }}
              >
                {t(ALERT_STATUS_KEYS[option])}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>{t('field.alerts.filterSeverity')}</SectionLabel>
            <Button size="sm" variant={severity === '' ? 'primary' : 'secondary'} onClick={() => { setSeverity(''); setOffset(0); }}>
              {t('field.alerts.anySeverity')}
            </Button>
            {ALERT_SEVERITIES.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={severity === option ? 'primary' : 'secondary'}
                onClick={() => { setSeverity(option); setOffset(0); }}
              >
                {t(SEVERITY_KEYS[option])}
              </Button>
            ))}
          </div>
          {alerts}
          {data.coverage === 'partial' && (
            <StateNotice tone="gold" title={t('field.coverage.title')} icon={TriangleAlert}>
              {t('field.coverage.alerts')}
            </StateNotice>
          )}
        </div>,
        <Badge tone="neutral">{t('field.alerts.total', { count: fmtInt(data.total, locale) })}</Badge>,
      )}

      {/* One instance per id, so a detail panel never shows the previous alert's rule while its own
          request is still in flight. */}
      {openId !== null && (
        <div className="space-y-2">
          <AlertDetail key={openId} alertId={openId} accessToken={accessToken} onChanged={live.reload} />
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => setOpenId(null)}>
              {t('field.alerts.closeDetail')}
            </Button>
          </div>
        </div>
      )}

      <Panel title={t('field.alerts.rulesTitle')} icon={Ruler} hint={t('field.alerts.rulesHint')}>
        {data.configured_rules.length === 0 ? (
          <div className="space-y-3">
            <EmptyState icon={Ruler} title={t('field.alerts.noRules')} hint={t('field.alerts.noRulesHint')} />
            <p className="text-[11.5px] leading-relaxed text-ink-faint">{t('field.alerts.rulesNotInvented')}</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {data.configured_rules.map((rule) => (
                <RuleCard key={rule.rule_id} rule={rule} />
              ))}
            </ul>
            <div className="mt-3 space-y-0">
              <DataRow label={t('field.alerts.rulesCoverage')}>
                {data.rules_coverage === 'partial' ? t('field.coverage.short') : t('field.alerts.rulesComplete')}
              </DataRow>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">{t('field.alerts.rulesAreTheOperators')}</p>
          </>
        )}
      </Panel>
    </div>
  );
}
