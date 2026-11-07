'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, KeyRound, Radar, Satellite, TriangleAlert, Unplug } from 'lucide-react';

import { Badge, Button, DataRow, EmptyState, Field, Input, Panel, SectionLabel, Select, SkeletonPanel, StateNotice, stamp } from '@/components/ui';
import type { ProvenanceView } from '@/components/data/ProvenanceLabel';
import { useLanguage } from '@/hooks/useLanguage';
import type { FieldSessionStatus } from '@/hooks/useFieldSession';
import { useLiveData } from '@/hooks/useLiveData';
import type { TranslationKey } from '@/lib/i18n';

import { FieldCredentialDisclosure } from './FieldCredentialDisclosure';
import { FieldSectionState, reasonFor } from './FieldSectionState';
import { managementCall } from './api';
import { COORDINATE_SOURCE_KEYS, CREDENTIAL_STATE_KEYS, CREDENTIAL_STATE_TONE, NODE_STATUSES, STATUS_KEYS, STATUS_TONE } from './labels';
import type { CoordinateSource, CredentialListResponse, DeviceDetailResponse, DeviceListResponse, NodeStatus, SitesResponse } from './types';

/**
 * Device Management: the register, and the actions on one device in it.
 *
 * Everything here goes through the Phase 4 endpoints — `POST /api/hardware/devices`,
 * `GET|PATCH /api/hardware/devices/[nodeId]`, `/credentials`, `/credentials/rotate`,
 * `/credentials/revoke` — and none of them is bypassed, mirrored or re-checked in the browser. Two
 * consequences shape the code:
 *
 * **Controls are shown from evidence, not from a guess about the role.** `GET /api/hardware/devices/{id}`
 * answers with `capabilities`, computed server-side from the caller's membership (`capabilitiesFor`
 * in that route). A manage capability appears in that list only for a manager, so the buttons below
 * light up from what the server said about a device the caller can see. A viewer sees the register
 * and no controls, which is the requirement in §3 of the brief.
 *
 * **Hiding is not authorization.** Every call is still refused server-side, and the refusal is
 * rendered: `insufficient_role` and `not_a_member` arrive as their own messages rather than as a
 * generic failure, because an operator who was told "you may not" needs to know who may. And where
 * there is no evidence to gate on — a cooperative with zero devices, whose first device can only be
 * registered — the form is shown anyway and the server decides. Without that exception the module
 * could never be used for the first device, and the alternative (guessing the role client-side) is
 * the thing the brief forbids.
 *
 * **The secret exists for exactly one render.** `device_secret` comes back from `issued()` as a
 * top-level envelope field and is kept in one piece of state, handed to `FieldCredentialDisclosure`,
 * and cleared when that panel closes. It never enters a list, a chart payload, a URL, `localStorage`,
 * or an error message. The credential id, which is safe and auditable, is a different kind of fact:
 * revocation addresses a credential by id, so `GET /api/hardware/devices/{id}/credentials` lists the
 * device's credential *metadata* — id, dates, hash algorithm, derived state — for a manager whose
 * `credential_list` capability the server granted. That closes the gap this panel used to describe:
 * before it, a secret issued before the page load could only be revoked by an operator who had that
 * id from the issue record or from `app.management_audit`. The listing never carries a digest or a
 * plaintext, and the route's column list cannot select one.
 */

const PAGE_SIZE = 25;

/** Mirrors `MAX_PAGE_OFFSET` in `lib/field/registration.ts`; the server module imports the service-role client. */
const MAX_OFFSET = 10_000;

/** The credential page this panel asks for. `MAX_PAGE_SIZE` on the server is 100; a device rarely has twenty rows. */
const CREDENTIAL_LIST_LIMIT = 20;

/** Mirrors `OPERATOR_SETTABLE_STATUSES`. `inactive` is absent on purpose: it is history, not intent. */
const SETTABLE_STATUSES: readonly NodeStatus[] = ['active', 'maintenance', 'disabled'];

type ActionKind = 'register' | 'provision' | 'rotate' | 'revoke' | 'status';

type Result =
  | { ok: true; action: ActionKind; note: string | null }
  | { ok: false; action: ActionKind; code: string };

/**
 * Refusal codes this panel can receive, each with the sentence an operator needs. The server's own
 * message is written for a log and is English-only, so it is not rendered; an unmapped code falls
 * back to a generic failure notice rather than being silently swallowed.
 */
const REFUSAL_KEYS: Record<string, TranslationKey> = {
  network: 'field.result.network',
  unauthenticated: 'field.result.unauthenticated',
  auth_unavailable: 'field.result.authUnavailable',
  not_a_member: 'field.result.notAMember',
  insufficient_role: 'field.result.insufficientRole',
  unknown_site: 'field.result.unknownSite',
  unknown_node: 'field.result.unknownDevice',
  device_exists: 'field.result.deviceExists',
  credential_exists: 'field.result.credentialExists',
  unknown_credential: 'field.result.unknownCredential',
  invalid_payload: 'field.result.invalidPayload',
  database_unavailable: 'field.result.databaseUnavailable',
  database_not_configured: 'field.result.databaseNotConfigured',
  internal_error: 'field.result.internalError',
};

const SUCCESS_KEYS: Record<ActionKind, TranslationKey> = {
  register: 'field.result.registered',
  provision: 'field.result.provisioned',
  rotate: 'field.result.rotated',
  revoke: 'field.result.revoked',
  status: 'field.result.statusChanged',
};

/**
 * The manage capabilities this screen offers, copied from the server's own classification
 * (`capabilityOf` in `lib/field/access.ts`). `credential_list` is in it because that function says it
 * is: listing a device's credential records is manager-only, even though it changes nothing.
 */
const MANAGE_CAPABILITIES = ['device_status_change', 'credential_provision', 'credential_rotate', 'credential_revoke', 'credential_list'];

function hasCapability(capabilities: string[], action: string): boolean {
  return capabilities.includes(action);
}

function ResultNotice({ result }: { result: Result }) {
  const { t } = useLanguage();
  if (result.ok) {
    return (
      <StateNotice tone="brand" title={t(SUCCESS_KEYS[result.action])} icon={Radar}>
        {result.note ?? t('field.result.noNote')}
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

/** The registration form. It sends no cooperative id, because the site carries the owner. */
function RegisterForm({ accessToken, onDone }: { accessToken: string | null; onDone: (result: Result, nodeId: string) => void }) {
  const { t } = useLanguage();
  const [nodeId, setNodeId] = useState('');
  const [name, setName] = useState('');
  const [siteId, setSiteId] = useState('');
  const [model, setModel] = useState('');
  const [firmware, setFirmware] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [coordSource, setCoordSource] = useState<CoordinateSource | ''>('');
  const [busy, setBusy] = useState(false);

  const sites = useLiveData<SitesResponse, ProvenanceView>('/api/field/sites?limit=100&offset=0', { accessToken });
  const options = sites.data?.sites ?? [];

  const bothCoordinates = latitude.trim() !== '' && longitude.trim() !== '';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || siteId === '') return;
    setBusy(true);

    const body: Record<string, unknown> = {
      node_id: nodeId.trim(),
      name: name.trim(),
      field_site_id: Number(siteId),
    };
    if (model.trim() !== '') body.hardware_model = model.trim();
    if (firmware.trim() !== '') body.firmware_version = firmware.trim();
    // Paired or absent: `validateRegistration` refuses one axis, and sending it would be asking the
    // platform to plot a position it has to invent half of.
    if (bothCoordinates) {
      body.latitude = Number(latitude);
      body.longitude = Number(longitude);
      if (coordSource !== '') body.coordinate_source = coordSource;
    }

    const call = await managementCall<{ device: { node_id: string } }>(`/api/hardware/devices`, {
      method: 'POST',
      body,
      accessToken,
    });
    setBusy(false);
    if (call.ok) {
      onDone({ ok: true, action: 'register', note: nodeId.trim() }, nodeId.trim());
      setNodeId('');
      setName('');
      setLatitude('');
      setLongitude('');
      setCoordSource('');
      setModel('');
      setFirmware('');
      setSiteId('');
      return;
    }
    onDone({ ok: false, action: 'register', code: call.code ?? 'unexpected' }, '');
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <Field label={t('field.devices.nodeId')} htmlFor="field-node-id" hint={t('field.devices.nodeIdHint')}>
        <Input
          id="field-node-id"
          value={nodeId}
          onChange={(event) => setNodeId(event.target.value)}
          placeholder="esp32-a4-c1-38-9f-2c"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </Field>
      <Field label={t('field.devices.nameLabel')} htmlFor="field-device-name">
        <Input
          id="field-device-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
          required
        />
      </Field>

      <Field
        label={t('field.devices.site')}
        htmlFor="field-device-site"
        hint={sites.error !== null ? t('field.devices.siteUnavailable') : t('field.devices.siteHint')}
        className="sm:col-span-2"
      >
        <Select id="field-device-site" value={siteId} onChange={(event) => setSiteId(event.target.value)} required>
          <option value="">{sites.loading ? t('field.devices.sitesLoading') : t('field.devices.chooseSite')}</option>
          {options.map((site) => (
            <option key={site.field_site_id} value={String(site.field_site_id)}>
              {site.name}
              {site.place === null ? '' : ` · ${site.place.name}`}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t('field.devices.hardwareModel')} htmlFor="field-device-model">
        <Input
          id="field-device-model"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          placeholder="ESP32-S3 + AGR-I2C"
          autoComplete="off"
        />
      </Field>
      <Field label={t('field.devices.firmwareVersion')} htmlFor="field-device-firmware">
        <Input
          id="field-device-firmware"
          value={firmware}
          onChange={(event) => setFirmware(event.target.value)}
          placeholder="0.1.0"
          autoComplete="off"
        />
      </Field>

      <div className="sm:col-span-2">
        <SectionLabel>{t('field.devices.coordinates')}</SectionLabel>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{t('field.devices.coordinatesHint')}</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <Field label={t('field.devices.latitude')} htmlFor="field-device-lat">
            <Input
              id="field-device-lat"
              type="number"
              step="any"
              min={-90}
              max={90}
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label={t('field.devices.longitude')} htmlFor="field-device-lng">
            <Input
              id="field-device-lng"
              type="number"
              step="any"
              min={-180}
              max={180}
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label={t('field.devices.coordinateSource')} htmlFor="field-device-coord-source">
            <Select
              id="field-device-coord-source"
              value={coordSource}
              onChange={(event) => setCoordSource(event.target.value as CoordinateSource | '')}
              disabled={!bothCoordinates}
            >
              <option value="">{t('field.devices.chooseCoordSource')}</option>
              {(Object.keys(COORDINATE_SOURCE_KEYS) as CoordinateSource[]).map((source) => (
                <option key={source} value={source}>
                  {t(COORDINATE_SOURCE_KEYS[source])}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button
          type="submit"
          size="sm"
          disabled={busy || nodeId.trim() === '' || name.trim() === '' || siteId === '' || (latitude === '') !== (longitude === '')}
        >
          {busy ? t('field.devices.registering') : t('field.devices.register')}
        </Button>
        <p className="text-[11.5px] leading-relaxed text-ink-faint">{t('field.devices.registerNote')}</p>
      </div>
    </form>
  );
}

/** One device: what the register holds about it, and the actions the server says this caller may take. */
function DevicePanel({
  nodeId,
  accessToken,
  credentialId,
  onResult,
  onIssued,
  onChanged,
  onCapabilities,
}: {
  nodeId: string;
  accessToken: string | null;
  credentialId: number | null;
  onResult: (result: Result) => void;
  onIssued: (nodeId: string, credentialId: number, secret: string, rotated: boolean) => void;
  onChanged: () => void;
  onCapabilities: (nodeId: string, capabilities: string[]) => void;
}) {
  const { t, locale } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [revokeId, setRevokeId] = useState('');
  const [force, setForce] = useState(false);

  const detail = useLiveData<DeviceDetailResponse, ProvenanceView>(
    `/api/hardware/devices/${encodeURIComponent(nodeId)}`,
    { accessToken },
  );

  const capabilities = detail.data?.capabilities ?? [];
  const device = detail.data?.device ?? null;
  const mayManage = MANAGE_CAPABILITIES.some((action) => hasCapability(capabilities, action));

  // Credential metadata, listed only for a caller the server granted `credential_list`. The path is
  // null otherwise, so a viewer's session never issues the request at all — the same policy the
  // server enforces, applied to the traffic rather than to the button.
  const listing = useLiveData<CredentialListResponse, ProvenanceView>(
    hasCapability(capabilities, 'credential_list')
      ? `/api/hardware/devices/${encodeURIComponent(nodeId)}/credentials?limit=${String(CREDENTIAL_LIST_LIMIT)}`
      : null,
    { accessToken },
  );

  // The parent gates the registration form on this, so it has to be the server's own answer about a
  // real device rather than a second guess made in the browser.
  useEffect(() => {
    const reported = detail.data?.capabilities;
    if (reported !== undefined) onCapabilities(nodeId, reported);
  }, [detail.data, nodeId, onCapabilities]);

  async function run(action: ActionKind, path: string, method: 'POST' | 'PATCH', body?: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    const call = await managementCall<Record<string, unknown>>(path, { method, ...(body === undefined ? {} : { body }), accessToken });
    setBusy(false);

    if (!call.ok) {
      onResult({ ok: false, action, code: call.code ?? 'unexpected' });
      return;
    }
    if (action === 'provision' || action === 'rotate') {
      const issuedId = typeof call.data?.credential_id === 'number' ? call.data.credential_id : 0;
      const secret = call.deviceSecret ?? '';
      onIssued(nodeId, issuedId, secret, action === 'rotate');
      onResult({ ok: true, action, note: null });
    } else if (action === 'revoke') {
      onResult({
        ok: true,
        action,
        note: call.data?.was_the_current_credential === true ? t('field.devices.revokedCurrent') : t('field.devices.revokedHistoric'),
      });
    } else if (action === 'status') {
      onResult({
        ok: true,
        action,
        note: `${String(call.data?.previous_status ?? '—')} → ${String((body?.status as string | undefined) ?? '—')}`,
      });
    } else {
      onResult({ ok: true, action, note: null });
    }
    detail.reload();
    // A provision, rotation or revocation changes the credential inventory this panel just listed, so
    // the list is re-read rather than patched from the action's response — the server's page stays the
    // source of the ids an operator picks.
    listing.reload();
    onChanged();
  }

  const shell = (body: ReactNode) => (
    <Panel
      title={device === null ? nodeId : `${device.name} · ${nodeId}`}
      icon={Satellite}
      hint={t('field.devices.detailsHint')}
      right={device === null ? undefined : <Badge tone={STATUS_TONE[device.status]} dot>{t(STATUS_KEYS[device.status])}</Badge>}
    >
      {body}
    </Panel>
  );

  if (detail.loading) return shell(<SkeletonPanel rows={5} />);
  if (detail.error !== null || device === null) {
    return shell(<FieldSectionState reason={reasonFor({ sessionStatus: 'signed_in', error: detail.error, isEmpty: false })} code={detail.error?.code} />);
  }

  const coordinates =
    device.latitude !== null && device.longitude !== null
      ? `${device.latitude.toFixed(5)}, ${device.longitude.toFixed(5)}`
      : t('field.devices.noCoordinates');

  const targetRevokeId = credentialId ?? (revokeId.trim() === '' ? null : Number(revokeId));

  return shell(
    <div className="space-y-5">
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <DataRow label={t('field.devices.fieldSite')}>{device.field_site_id === null ? '—' : String(device.field_site_id)}</DataRow>
        <DataRow label={t('field.devices.cooperative')}>{device.cooperative_id === null ? '—' : String(device.cooperative_id)}</DataRow>
        <DataRow label={t('field.devices.lastSeen')}>{stamp(device.last_seen_at, locale)}</DataRow>
        <DataRow label={t('field.devices.credential')}>
          {device.provisioned ? t('field.devices.provisioned') : t('field.devices.notProvisioned')}
        </DataRow>
        <DataRow label={t('field.devices.expires')}>{stamp(device.credential_expires_at, locale)}</DataRow>
        <DataRow label={t('field.devices.hardwareModel')}>{device.hardware_model ?? '—'}</DataRow>
        <DataRow label={t('field.devices.firmwareVersion')}>{device.firmware_version ?? '—'}</DataRow>
        <DataRow label={t('field.devices.coordinates')}>
          <span className="tabular">{coordinates}</span>
          {device.coordinate_source !== null && (
            <Badge tone="outline" className="ml-2">
              {t(COORDINATE_SOURCE_KEYS[device.coordinate_source])}
            </Badge>
          )}
        </DataRow>
      </div>

      <div>
        <SectionLabel>{t('field.devices.capabilities')}</SectionLabel>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
          {mayManage ? t('field.devices.capabilitiesManager') : t('field.devices.capabilitiesViewer')}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {capabilities.map((capability) => (
            <Badge key={capability} tone={MANAGE_CAPABILITIES.includes(capability) ? 'brand' : 'neutral'}>
              {capability}
            </Badge>
          ))}
        </div>
      </div>

      {mayManage && (
        <div className="space-y-4 rounded-2xl border border-line bg-brand-soft/40 p-4">
          <div>
            <SectionLabel>{t('field.devices.credentialActions')}</SectionLabel>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{t('field.devices.credentialActionsHint')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!device.provisioned && hasCapability(capabilities, 'credential_provision') && (
              <Button
                size="sm"
                variant="primary"
                disabled={busy}
                onClick={() => void run('provision', `/api/hardware/devices/${encodeURIComponent(nodeId)}/credentials`, 'POST')}
                leading={<KeyRound size={14} />}
              >
                {t('field.devices.provision')}
              </Button>
            )}
            {hasCapability(capabilities, 'credential_rotate') && (
              <Button
                size="sm"
                variant="accent"
                disabled={busy}
                onClick={() => void run('rotate', `/api/hardware/devices/${encodeURIComponent(nodeId)}/credentials/rotate`, 'POST')}
              >
                {t('field.devices.rotate')}
              </Button>
            )}
            {hasCapability(capabilities, 'credential_revoke') && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy || targetRevokeId === null}
                onClick={() =>
                  void run('revoke', `/api/hardware/devices/${encodeURIComponent(nodeId)}/credentials/revoke`, 'POST', {
                    credential_id: targetRevokeId,
                    ...(force ? { force: true } : {}),
                  })
                }
                leading={<Unplug size={14} />}
              >
                {t('field.devices.revoke')}
              </Button>
            )}
          </div>

          {credentialId === null && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('field.devices.revokeIdLabel')} htmlFor="field-revoke-id" hint={t('field.devices.revokeIdHint')}>
                <Input
                  id="field-revoke-id"
                  type="number"
                  min={1}
                  step={1}
                  value={revokeId}
                  onChange={(event) => setRevokeId(event.target.value)}
                  inputMode="numeric"
                />
              </Field>
              <label className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-muted">
                <input
                  id="field-revoke-force"
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-brand"
                  checked={force}
                  onChange={(event) => setForce(event.target.checked)}
                />
                <span>{t('field.devices.forceHint')}</span>
              </label>
            </div>
          )}

          {hasCapability(capabilities, 'credential_list') && (
            <div className="rounded-xl border border-line bg-surface/60 p-3">
              <SectionLabel>{t('field.devices.credentialListTitle')}</SectionLabel>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{t('field.devices.credentialListHint')}</p>

              {listing.loading ? (
                <div className="mt-3">
                  <SkeletonPanel rows={2} />
                </div>
              ) : listing.error !== null || listing.data === null ? (
                <div className="mt-3">
                  <FieldSectionState
                    reason={reasonFor({ sessionStatus: 'signed_in', error: listing.error, isEmpty: false })}
                    code={listing.error?.code}
                  />
                </div>
              ) : listing.data.credentials.length === 0 ? (
                <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">{t('field.devices.credentialListNone')}</p>
              ) : (
                <>
                  <ul className="mt-2 divide-y divide-line">
                    {listing.data.credentials.map((credential) => (
                      <li key={credential.credential_id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                        <div className="min-w-0 basis-52 flex-1">
                          <p className="tabular text-[12.5px] font-extrabold text-ink">
                            {t('field.devices.credentialListId', { id: String(credential.credential_id) })}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-ink-faint">
                            <span>{t('field.devices.credentialListIssued')}: {stamp(credential.issued_at, locale)}</span>
                            <span>{t('field.devices.credentialListLastUsed')}: {stamp(credential.last_used_at, locale)}</span>
                            <span>{t('field.devices.credentialListExpires')}: {stamp(credential.expires_at, locale)}</span>
                            <span className="font-mono">{credential.hash_algorithm}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Badge tone={CREDENTIAL_STATE_TONE[credential.state]}>{t(CREDENTIAL_STATE_KEYS[credential.state])}</Badge>
                          {hasCapability(capabilities, 'credential_revoke') &&
                            (targetRevokeId === credential.credential_id ? (
                              <Badge tone="outline">{t('field.devices.credentialListChosen')}</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busy || credential.state === 'retired'}
                                onClick={() => setRevokeId(String(credential.credential_id))}
                              >
                                {t('field.devices.credentialListChoose')}
                              </Button>
                            ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
                    {t('field.devices.credentialListCount', { returned: String(listing.data.returned), limit: String(listing.data.limit) })}
                  </p>
                  {listing.data.coverage === 'partial' && (
                    <StateNotice tone="gold" title={t('field.coverage.title')} icon={TriangleAlert} className="mt-3">
                      {t('field.devices.credentialListPartial')}
                    </StateNotice>
                  )}
                  {listing.data.current_credential_id === null && (
                    <StateNotice tone="clay" title={t('field.devices.credentialListNoCurrent')} icon={TriangleAlert} className="mt-3">
                      {t('field.devices.credentialListNoCurrentBody')}
                    </StateNotice>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {hasCapability(capabilities, 'device_status_change') && (
        <div>
          <SectionLabel>{t('field.devices.statusActions')}</SectionLabel>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{t('field.devices.statusActionsHint')}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {SETTABLE_STATUSES.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === 'disabled' ? 'ghost' : 'secondary'}
                disabled={busy || device.status === status}
                onClick={() => void run('status', `/api/hardware/devices/${encodeURIComponent(nodeId)}`, 'PATCH', { status })}
              >
                {t(STATUS_KEYS[status])}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11.5px] leading-relaxed text-ink-faint">{t('field.devices.serverDecides')}</p>
    </div>
  );
}

export function FieldDeviceManagementSection({
  sessionStatus,
  accessToken,
}: {
  sessionStatus: FieldSessionStatus;
  accessToken: string | null;
}) {
  const { t, locale } = useLanguage();
  const [status, setStatus] = useState<NodeStatus | ''>('');
  const [offset, setOffset] = useState(0);
  const [openId, setOpenId] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [issued, setIssued] = useState<{ nodeId: string; credentialId: number; secret: string; rotated: boolean } | null>(null);
  // A credential id this session produced, so the disclosure panel and the revoke target agree
  // without asking the listing endpoint. The listing itself is what makes an id from before this
  // page load reachable; this is only the one that was issued here.
  const [credentialIds, setCredentialIds] = useState<Record<string, number>>({});
  // Capabilities the server reported per device. This is the only role-shaped fact the UI holds, and
  // it is a copy of an answer, never a premise.
  const [capsByNode, setCapsByNode] = useState<Record<string, string[]>>({});

  const reportCapabilities = useCallback((nodeId: string, capabilities: string[]) => {
    setCapsByNode((prev) => {
      const before = prev[nodeId];
      if (before !== undefined && before.length === capabilities.length && before.every((value, index) => value === capabilities[index])) {
        return prev;
      }
      return { ...prev, [nodeId]: capabilities };
    });
  }, []);

  const params = status === '' ? '' : `&status=${status}`;
  const live = useLiveData<DeviceListResponse, ProvenanceView>(
    sessionStatus === 'signed_in' ? `/api/hardware/devices?limit=${String(PAGE_SIZE)}&offset=${String(offset)}${params}` : null,
    { accessToken },
  );

  if (sessionStatus !== 'signed_in') {
    return (
      <Panel title={t('field.devices.title')} icon={Satellite} hint={t('field.devices.hint')}>
        <FieldSectionState reason={reasonFor({ sessionStatus, error: null, isEmpty: false })} />
      </Panel>
    );
  }

  const data = live.data;
  const devices = data?.devices ?? [];
  const total = data?.total ?? 0;
  // Evidence of a manage capability anywhere. It only comes from a device detail read, so a fleet
  // with no devices cannot produce it — which is precisely the case where the registration form has
  // to be offered anyway, or the first device could never be added. See the header.
  const manageEvidence = Object.values(capsByNode).some((capabilities) =>
    MANAGE_CAPABILITIES.some((action) => capabilities.includes(action)),
  );
  const mayRegister = manageEvidence || total === 0;
  const lastOffset = Math.max(
    0,
    Math.min(Math.floor((total - 1) / PAGE_SIZE), Math.floor(MAX_OFFSET / PAGE_SIZE)) * PAGE_SIZE,
  );

  const shell = (body: ReactNode) => (
    <div className="space-y-4">
      <Panel
        title={t('field.devices.title')}
        icon={Satellite}
        hint={t('field.devices.hint')}
        right={
          data === null ? undefined : (
            <Badge tone="neutral">{t('field.devices.total', { count: String(total) })}</Badge>
          )
        }
      >
        <div className="space-y-4">
          {result !== null && <ResultNotice result={result} />}

          {issued !== null && (
            <FieldCredentialDisclosure
              key={`${issued.nodeId}-${String(issued.credentialId)}`}
              nodeId={issued.nodeId}
              credentialId={issued.credentialId}
              secret={issued.secret}
              rotated={issued.rotated}
              onDismiss={() => {
                setIssued(null);
                live.reload();
              }}
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>{t('field.devices.statusFilter')}</SectionLabel>
            <Button
              size="sm"
              variant={status === '' ? 'primary' : 'secondary'}
              onClick={() => {
                setStatus('');
                setOffset(0);
              }}
            >
              {t('field.devices.anyStatus')}
            </Button>
            {NODE_STATUSES.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={status === option ? 'primary' : 'secondary'}
                onClick={() => {
                  setStatus(option);
                  setOffset(0);
                }}
              >
                {t(STATUS_KEYS[option])}
              </Button>
            ))}
          </div>

          {body}
        </div>
      </Panel>

      <Panel
        title={t('field.devices.registerTitle')}
        icon={KeyRound}
        hint={t('field.devices.registerHint')}
        right={
          mayRegister ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowRegister((v) => !v)}
              trailing={<ChevronDown size={14} className={showRegister ? 'rotate-180 transition-transform' : 'transition-transform'} />}
            >
              {showRegister ? t('field.devices.hideRegister') : t('field.devices.showRegister')}
            </Button>
          ) : undefined
        }
      >
        {!mayRegister ? (
          <p className="text-[12.5px] leading-relaxed text-ink-muted">{t('field.devices.registerLocked')}</p>
        ) : !showRegister ? (
          <p className="text-[12.5px] leading-relaxed text-ink-muted">{t('field.devices.registerLead')}</p>
        ) : (
          <RegisterForm
            accessToken={accessToken}
            onDone={(next, nodeId) => {
              setResult(next);
              if (next.ok && nodeId !== '') {
                setOpenId(nodeId);
                live.reload();
              }
            }}
          />
        )}
      </Panel>

      {openId !== '' && (
        <DevicePanel
          nodeId={openId}
          accessToken={accessToken}
          credentialId={credentialIds[openId] ?? null}
          onResult={setResult}
          onChanged={() => live.reload()}
          onCapabilities={reportCapabilities}
          onIssued={(nodeId, credentialId, secret, rotated) => {
            setCredentialIds((prev) => ({ ...prev, [nodeId]: credentialId }));
            setIssued({ nodeId, credentialId, secret, rotated });
          }}
        />
      )}
    </div>
  );

  if (live.loading) return shell(<SkeletonPanel rows={4} />);
  if (live.error !== null || data === null) {
    return shell(<FieldSectionState reason={reasonFor({ sessionStatus, error: live.error, isEmpty: false })} code={live.error?.code} />);
  }

  const list =
    devices.length === 0 ? (
      <EmptyState icon={Satellite} title={t('field.devices.empty')} hint={t('field.devices.emptyHint')} />
    ) : (
      <>
        <ul className="divide-y divide-line">
          {devices.map((device) => (
            <li key={device.node_id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 basis-64 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">{device.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-ink-faint">{device.node_id}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-ink-muted">
                    <span>{t('field.devices.siteLabel')} {device.field_site_id === null ? '—' : String(device.field_site_id)}</span>
                    <span>{t('field.devices.lastSeenLabel')} {stamp(device.last_seen_at, locale)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Badge tone={STATUS_TONE[device.status]} dot>
                      {t(STATUS_KEYS[device.status])}
                    </Badge>
                    <Badge tone={device.provisioned ? 'brand' : 'neutral'}>{device.provisioned ? t('field.devices.provisioned') : t('field.devices.notProvisioned')}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant={openId === device.node_id ? 'primary' : 'ghost'}
                    onClick={() => setOpenId(openId === device.node_id ? '' : device.node_id)}
                    aria-expanded={openId === device.node_id}
                  >
                    {openId === device.node_id ? t('field.devices.close') : t('field.devices.manage')}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
          <p className="tabular text-[11.5px] text-ink-faint">
            {t('field.devices.pageRange', { from: String(offset + 1), to: String(Math.min(offset + PAGE_SIZE, total)), total: String(total) })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              leading={<ChevronLeft size={14} />}
            >
              {t('field.devices.previous')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset(Math.min(lastOffset, offset + PAGE_SIZE))}
              disabled={offset >= lastOffset}
              trailing={<ChevronRight size={14} />}
            >
              {t('field.devices.next')}
            </Button>
          </div>
        </div>
      </>
    );

  return shell(
    <>
      {list}
      {!manageEvidence && total > 0 && (
        <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-faint">
          <TriangleAlert size={14} className="mt-0.5 shrink-0 text-gold-600 dark:text-gold-400" />
          {t('field.devices.evidenceNote')}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        {data.visible_cooperatives.length === 0 ? (
          <Badge tone="clay" title={t('field.devices.noCooperativeTitle')}>
            {t('field.devices.noCooperative')}
          </Badge>
        ) : (
          <Badge tone="outline">
            {t('field.devices.cooperatives', { count: String(data.visible_cooperatives.length) })}
          </Badge>
        )}
        {data.filtered_by_status !== undefined && (
          <Badge tone="info">{t('field.devices.filterEcho', { status: String(data.filtered_by_status) })}</Badge>
        )}
      </div>
    </>,
  );
}
