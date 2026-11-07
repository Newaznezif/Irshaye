#!/usr/bin/env node
/**
 * Unit tests for the device-management surface: cooperative authorization, tenant isolation, the
 * non-disclosure rule on refusals, registration and lifecycle payload rules, audit-record
 * sanitising, and the code→status table.
 *
 * These grade the DECISIONS, not the database. Nothing here needs a Supabase project, and that is
 * the point: "a manager of Cooperative A cannot rotate a device in Cooperative B" has to be provable
 * in a process with no rows in it, because the same bug found through a route is an incident report
 * rather than a failing assertion. `npm run check:management` grades the HTTP layer (what an
 * unauthenticated caller is answered with), and the migration cross-checks at the bottom compare
 * these TypeScript rules with the CHECK constraints in `20261106000100`, `000200` and the vocabulary
 * file `20261107000100`, so the two halves cannot drift apart unnoticed.
 *
 * What these CANNOT prove, and no local run can: that a real session is verified against a real
 * Auth server, that the membership rows are the ones a real operator granted, and that an audit row
 * actually lands in a real table. Those need a configured Supabase project — see
 * docs/field-intelligence-setup.md.
 *
 * Run with `npm run test:management`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MANAGEMENT_STATUS_BY_CODE,
  capabilityOf,
  decideAccess,
  narrowScope,
  refusalFor,
  roleAllows,
  scopedCooperativeIds,
} from '../lib/field/access.ts';
import {
  AUDIT_DETAIL_KEYS,
  auditEntry,
  auditRow,
  detailOf,
  isNodeLevelAction,
} from '../lib/field/audit.ts';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_OFFSET,
  MAX_PAGE_SIZE,
  OPERATOR_SETTABLE_STATUSES,
  isWellFormedNodeId,
  parseCooperativeFilter,
  validateRegistration,
  validateRevocation,
  validateStatusChange,
} from '../lib/field/registration.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The action vocabulary, read out of `lib/field/types.ts` instead of restated here.
 *
 * A list duplicated in a test is a list that can agree with a stale copy of itself: the assertion at
 * the bottom of this file is meant to compare what the CODE says against what the DATABASE allows,
 * and it proves nothing once the code side is a second hand-typed copy.
 *
 * Read line by line, member line by member line, rather than by one regex over the whole file. The
 * difference is a comment: `/export type ManagementAction = ([\s\S]*?);/` stops at the FIRST
 * semicolon it finds, which is inside a `//` note as readily as at the end of the union, and a
 * truncated read silently returns a shorter vocabulary that still agrees with the older migration.
 * That is a test passing because it read half the file. Prose is skipped; only lines beginning with
 * `|` contribute names, so nothing but a union member can enter the list.
 */
const typesLines = readFileSync(join(HERE, '..', 'lib', 'field', 'types.ts'), 'utf8').split('\n');
const unionStart = typesLines.findIndex((line) => line.startsWith('export type ManagementAction ='));
const codeActions = [];
for (let index = unionStart + 1; unionStart >= 0 && index < typesLines.length; index += 1) {
  const line = typesLines[index].trim();
  if (line === '' || line.startsWith('//')) continue;
  if (line.startsWith('|')) codeActions.push(...[...line.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]));
  if (line.endsWith(';')) break;
}

/* ------------------------------------------------------------------ *
 * Harness (same shape as scripts/test-field-unit.mjs)
 * ------------------------------------------------------------------ */

const results = [];
let group = 'general';
const section = (name) => {
  group = name;
};
const yes = (label, condition, detail = '') => results.push({ group, label, pass: condition === true, detail: condition === true ? '' : detail });
const show = (value) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text === undefined ? String(value) : text.slice(0, 200);
};
const same = (label, actual, expected) => yes(label, show(actual) === show(expected), `got ${show(actual)} · want ${show(expected)}`);
const refusedWith = (label, result, code) =>
  yes(label, result.ok === false && result.error?.code === code, `got ${result.ok === true ? 'ok' : `${result.error?.code}: ${show(result.error?.message)}`} · want ${code}`);
/** The access decision refuses with a REASON, not an error body — the reason is what the trail records. */
const deniedWith = (label, decision, reason) =>
  yes(label, decision.ok === false && decision.reason === reason, `got ${decision.ok === true ? `ok as ${decision.role}` : decision.reason} · want ${reason}`);
const accepted = (label, result) => yes(label, result.ok === true, result.ok === true ? '' : `rejected: ${result.error?.code} — ${show(result.error?.message)}`);

/* ------------------------------------------------------------------ *
 * Fixtures — the rows `resolveMemberships` would hand the decision layer
 * ------------------------------------------------------------------ */

const ACTOR = '0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0';
const NOW = new Date('2026-11-06T09:00:00.000Z');

/** Two cooperatives, one device each. The whole test surface is the line between them. */
const COOP_A = 1;
const COOP_B = 2;

const managerOfA = [{ cooperative_id: COOP_A, role: 'manager' }];
const viewerOfA = [{ cooperative_id: COOP_A, role: 'viewer' }];
const managerOfBoth = [{ cooperative_id: COOP_A, role: 'manager' }, { cooperative_id: COOP_B, role: 'viewer' }];
const nobody = [];

/** `decideAccess` for a caller holding `memberships`, acting on a device owned by `owner`. */
const ask = (memberships, owner, action) => decideAccess(memberships, owner, action);

/* ------------------------------------------------------------------ *
 * 1. The capability table
 * ------------------------------------------------------------------ */

section('Capabilities — what each action needs');
// Phase 6A's split is deliberate and is the security property the alert surfaces rest on: reading an
// alert is a viewer capability, while acknowledging, resolving, and listing a device's credential
// metadata are not. `credential_list` returns metadata only, but metadata is still more than a viewer
// was ever given, so it is a manage action rather than a read.
const WRITE_ACTIONS = ['device_register', 'device_update', 'device_status_change', 'credential_provision', 'credential_rotate', 'credential_revoke', 'alert_acknowledge', 'alert_resolve', 'credential_list'];
const READ_ACTIONS = ['device_list', 'device_view', 'overview_read', 'site_list', 'site_view', 'observation_read', 'alert_list', 'map_read', 'alert_view'];
for (const action of READ_ACTIONS) {
  same(`${action} is a read`, capabilityOf(action), 'read');
}
for (const action of WRITE_ACTIONS) {
  same(`${action} needs manage`, capabilityOf(action), 'manage');
}
// The direction an unclassified action falls in is the whole point of `capabilityOf`'s default, so it
// is asserted rather than trusted: a new action that forgets to declare itself must be refused to a
// viewer, not inherit `manage` through a read route. (Runtime JS can name an action the union does
// not contain; that is exactly the mistake this checks for.)
same('an action nobody declared falls to the safe side', capabilityOf('next_release_action'), 'manage');
yes('the read and write lists are disjoint', READ_ACTIONS.every((a) => !WRITE_ACTIONS.includes(a)));
same('…and together they are the vocabulary types.ts declares', [...READ_ACTIONS, ...WRITE_ACTIONS].sort().join(','), [...codeActions].sort().join(','));
yes('a manager may read', roleAllows('manager', 'read'));
yes('a manager may manage', roleAllows('manager', 'manage'));
yes('a viewer may read', roleAllows('viewer', 'read'));
yes('a viewer may NOT manage', !roleAllows('viewer', 'manage'));

/* ------------------------------------------------------------------ *
 * 2. Tenant isolation — the assertion this phase exists for
 * ------------------------------------------------------------------ */

section('Tenant isolation — Cooperative A versus Cooperative B');
for (const action of codeActions) {
  deniedWith(`a manager of A may not ${action} a resource owned by B`, ask(managerOfA, COOP_B, action), 'not_a_member');
}
deniedWith('a MANAGER of A is still refused on B (role cannot substitute for membership)', ask(managerOfA, COOP_B, 'device_view'), 'not_a_member');
deniedWith('a viewer of A cannot manage A either', ask(viewerOfA, COOP_A, 'credential_rotate'), 'insufficient_role');
accepted('a viewer of A may read A', ask(viewerOfA, COOP_A, 'device_view'));
// The dashboard's own reads, checked one by one: a viewer who cannot watch a chart is a viewer who
// will be given `manager` "just to make it work", and that is how this vocabulary rots.
for (const action of ['overview_read', 'site_list', 'site_view', 'observation_read', 'alert_list', 'alert_view', 'map_read']) {
  accepted(`a viewer of A may ${action} A's data`, ask(viewerOfA, COOP_A, action));
  deniedWith(`a viewer of A may not ${action} B's data`, ask(viewerOfA, COOP_B, action), 'not_a_member');
}
// …and the mirror image, asserted per action rather than inherited from `capabilityOf`'s default: a
// viewer who can close an alert has write access to the incident record, and a viewer who can list
// credentials holds the inventory a rotation would target.
for (const action of ['alert_acknowledge', 'alert_resolve', 'credential_list']) {
  deniedWith(`a viewer of A may not ${action} A's data`, ask(viewerOfA, COOP_A, action), 'insufficient_role');
  accepted(`a manager of A may ${action} A's data`, ask(managerOfA, COOP_A, action));
}
accepted('a manager of A may manage A', ask(managerOfA, COOP_A, 'credential_rotate'));
accepted('a manager of A and viewer of B may manage A', ask(managerOfBoth, COOP_A, 'device_register'));
accepted('…and read B, because that is what a viewer holds', ask(managerOfBoth, COOP_B, 'device_list'));
deniedWith('…but not touch B, whatever they hold elsewhere', ask(managerOfBoth, COOP_B, 'credential_revoke'), 'insufficient_role');
yes('no membership at all denies every action in the vocabulary', codeActions.every((action) => ask(nobody, COOP_A, action).ok === false));

section('Tenant isolation — the NULL owner is the safe direction');
for (const action of codeActions) {
  deniedWith(`an unassigned resource (cooperative_id NULL) is not reachable via ${action}`, ask(managerOfA, null, action), 'not_a_member');
}

/* ------------------------------------------------------------------ *
 * 3. Scope — what a list may query
 * ------------------------------------------------------------------ */

section('Scope — membership-derived, never caller-derived');
same('a manager of A sees only A in read scope', scopedCooperativeIds(managerOfA, 'read'), [COOP_A]);
same('a viewer of A has no manage scope at all', scopedCooperativeIds(viewerOfA, 'manage'), []);
same('dual membership yields both, sorted', scopedCooperativeIds([{ cooperative_id: 9, role: 'manager' }, { cooperative_id: 3, role: 'viewer' }], 'read'), [3, 9]);
same('narrowScope with no request is the whole scope', narrowScope(managerOfBoth, null, 'read'), [COOP_A, COOP_B]);
same('narrowScope on a held cooperative is that one', narrowScope(managerOfBoth, COOP_B, 'read'), [COOP_B]);
same('narrowScope on an unheld cooperative is null, not an empty widening', narrowScope(managerOfA, COOP_B, 'read'), null);
same('narrowScope cannot widen a manage query through a read-only membership', narrowScope(viewerOfA, COOP_A, 'manage'), null);
yes('a null narrowScope is distinguishable from "no rows"', narrowScope(managerOfA, COOP_A, 'read') !== null && narrowScope(managerOfA, COOP_B, 'read') === null);

/* ------------------------------------------------------------------ *
 * 4. Refusals — what they may say
 * ------------------------------------------------------------------ */

section('Refusals — existence is not disclosed, the trail is not dimmed');
const strangerOnDevice = refusalFor({ ok: false, reason: 'not_a_member' }, 'device', 'node-7');
same('a stranger to a device is told the device is unavailable, not that they are', strangerOnDevice.answer.code, 'unknown_node');
same('and the trail records the real reason', strangerOnDevice.auditReason, 'not_a_member');
yes('the answer never contains the phrase "member"', !/member/i.test(strangerOnDevice.answer.message));
yes('the answer names no cooperative id', !/\bcooperative\b|\b2\b/.test(strangerOnDevice.answer.message));

const strangerOnSite = refusalFor({ ok: false, reason: 'not_a_member' }, 'field site', 99);
same('a stranger to a field site gets the site-specific 404 code', strangerOnSite.answer.code, 'unknown_site');
same('…and the same internal reason', strangerOnSite.auditReason, 'not_a_member');

const strangerOnCredential = refusalFor({ ok: false, reason: 'not_a_member' }, 'credential', 12);
same('a stranger to a credential gets the credential-specific 404 code', strangerOnCredential.answer.code, 'unknown_credential');

const viewerAnswer = refusalFor({ ok: false, reason: 'insufficient_role' }, 'device');
same('a viewer is told their role plainly (403, and no existence claimed)', viewerAnswer.answer.code, 'insufficient_role');
same('…and the trail agrees', viewerAnswer.auditReason, 'insufficient_role');
yes('the viewer message says what to do about it', /manager/i.test(viewerAnswer.answer.message));
const credentialViewer = refusalFor({ ok: false, reason: 'insufficient_role' }, 'credential');
yes('the credential wording names the credential actions, not "change them"', /issue, rotate or revoke/i.test(credentialViewer.answer.message) && !/change them/.test(credentialViewer.answer.message));

// Phase 6A's alert surface, where the same non-disclosure rule has to hold for an id a caller can
// guess: `alert_id` is a small integer handed out in order, so "not yours" and "does not exist" must
// be one answer.
const strangerOnAlert = refusalFor({ ok: false, reason: 'not_a_member' }, 'alert', 41);
same('a stranger to an alert gets the alert-specific 404', strangerOnAlert.answer.code, 'unknown_alert');
same('…and the trail still records the internal reason', strangerOnAlert.auditReason, 'not_a_member');
yes('…and the answer does not repeat the id back, so it cannot be used to confirm one', !/\b41\b/.test(strangerOnAlert.answer.message));
const alertViewer = refusalFor({ ok: false, reason: 'insufficient_role' }, 'alert');
yes('a viewer told about an alert names acknowledge and resolve, not "change them"', /acknowledge/i.test(alertViewer.answer.message) && /resolve/i.test(alertViewer.answer.message) && !/change them/.test(alertViewer.answer.message));
yes('…and that answer is a 403, because the viewer IS a member', MANAGEMENT_STATUS_BY_CODE[alertViewer.answer.code] === 403);

const coopAnswer = refusalFor({ ok: false, reason: 'not_a_member' }, 'cooperative', 12);
same('a caller naming a cooperative IS told they are not a member — that is their own information', coopAnswer.answer.code, 'not_a_member');
yes('…and the message quotes the cooperative they asked about', coopAnswer.answer.message.includes('12'));
yes('…but a missing id degrades to "?" rather than fabricating one', refusalFor({ ok: false, reason: 'not_a_member' }, 'cooperative').answer.message.includes('?'));

section('Refusals — the two answers a route must not confuse');
yes('not-a-member on a resource is a 404, indistinguishable from a typo', MANAGEMENT_STATUS_BY_CODE[refusalFor({ ok: false, reason: 'not_a_member' }, 'device').answer.code] === 404);
yes('insufficient role is a 403 — the caller is in, and that is not a secret', MANAGEMENT_STATUS_BY_CODE.insufficient_role === 403);
yes('a named cooperative the caller is not in is a 403 about their own membership', MANAGEMENT_STATUS_BY_CODE.not_a_member === 403);

/* ------------------------------------------------------------------ *
 * 5. The code → status table
 * ------------------------------------------------------------------ */

section('Status codes — every management code has one');
const MANAGEMENT_ADDITIONS = ['unauthenticated', 'auth_unavailable', 'not_a_member', 'insufficient_role', 'unknown_site', 'unknown_alert', 'device_exists', 'credential_exists'];
const unmapped = MANAGEMENT_ADDITIONS.filter((code) => MANAGEMENT_STATUS_BY_CODE[code] === undefined);
same('no management code is unmapped', unmapped.length ? unmapped.join(', ') : 'none', 'none');
yes('nothing is a 2xx: the table is a failure table', Object.values(MANAGEMENT_STATUS_BY_CODE).every((s) => s >= 400 && s <= 599));
for (const [code, status] of [
  ['unauthenticated', 401],
  ['auth_unavailable', 503],
  ['not_a_member', 403],
  ['insufficient_role', 403],
  ['unknown_site', 404],
  ['unknown_alert', 404],
  ['device_exists', 409],
  ['credential_exists', 409],
  ['unknown_node', 404],
  ['device_disabled', 403],
  ['database_not_configured', 503],
]) {
  same(`${code} answers ${status}`, MANAGEMENT_STATUS_BY_CODE[code], status);
}
yes('a failed session check denies: 401 and 503 are the only session answers', MANAGEMENT_STATUS_BY_CODE.unauthenticated === 401 && MANAGEMENT_STATUS_BY_CODE.auth_unavailable === 503);

/* ------------------------------------------------------------------ *
 * 6. Registration payload rules
 * ------------------------------------------------------------------ */

section('Registration — accepted shapes');
const goodRegistration = {
  node_id: 'ESP32_AGRIS_0142',
  name: 'Baile 01 — teff trial',
  field_site_id: 7,
  latitude: 9.02,
  longitude: 38.75,
  coordinate_source: 'surveyed',
  hardware_model: 'ESP32-WROOM-32 + CAP100',
  firmware_version: '0.4.0',
};
const registered = validateRegistration(goodRegistration);
accepted('a complete registration is accepted', registered);
same('the site id passes through as a number', registered.value?.fieldSiteId, 7);
same('whitespace is trimmed off the hardware id', validateRegistration({ ...goodRegistration, node_id: '  ESP32_AGRIS_0142  ' }).value?.nodeId, 'ESP32_AGRIS_0142');
same('a device with no position is legal', validateRegistration({ ...goodRegistration, latitude: undefined, longitude: undefined, coordinate_source: undefined }).value?.latitude, null);
yes('the output has NO cooperative_id field for a route to pass on', !('cooperativeId' in (registered.value ?? {})) && !('cooperative_id' in (registered.value ?? {})));

section('Registration — owner claims are refused, not ignored');
for (const key of ['cooperative_id', 'cooperative', 'role', 'secret_token', 'token', 'token_hash']) {
  refusedWith(`a body carrying ${key} is refused by name`, validateRegistration({ ...goodRegistration, [key]: key === 'cooperative_id' ? 12 : 'x' }), 'invalid_payload');
}
yes('the refusal explains where an owner actually comes from', /field site/i.test(validateRegistration({ ...goodRegistration, cooperative_id: 12 }).error.message));
yes('and the explanation never echoes the claimed value', !validateRegistration({ ...goodRegistration, cooperative_id: 12 }).error.message.includes('12'));

section('Registration — field rules');
refusedWith('an array body is refused', validateRegistration([goodRegistration]), 'invalid_payload');
refusedWith('a null body is refused', validateRegistration(null), 'invalid_payload');
refusedWith('a missing name is refused', validateRegistration({ ...goodRegistration, name: undefined }), 'invalid_payload');
refusedWith('a one-character name is refused', validateRegistration({ ...goodRegistration, name: 'x' }), 'invalid_payload');
refusedWith('a 161-character name is refused', validateRegistration({ ...goodRegistration, name: 'x'.repeat(161) }), 'invalid_payload');
refusedWith('a missing site id is refused (an unassigned device is unmanageable)', validateRegistration({ ...goodRegistration, field_site_id: undefined }), 'invalid_payload');
refusedWith('a site id as a string is refused, not coerced', validateRegistration({ ...goodRegistration, field_site_id: '7' }), 'invalid_payload');
refusedWith('a site id of 0 is refused', validateRegistration({ ...goodRegistration, field_site_id: 0 }), 'invalid_payload');
refusedWith('a fractional site id is refused', validateRegistration({ ...goodRegistration, field_site_id: 7.5 }), 'invalid_payload');
refusedWith('a site id beyond 2^53 is refused rather than rounded', validateRegistration({ ...goodRegistration, field_site_id: Number.MAX_SAFE_INTEGER + 10 }), 'invalid_payload');
refusedWith('a latitude with no longitude is refused', validateRegistration({ ...goodRegistration, longitude: undefined }), 'invalid_payload');
refusedWith('a latitude of 91 is refused', validateRegistration({ ...goodRegistration, latitude: 91 }), 'invalid_payload');
refusedWith('a longitude of 181 is refused', validateRegistration({ ...goodRegistration, longitude: 181 }), 'invalid_payload');
refusedWith('coordinates with no provenance are refused', validateRegistration({ ...goodRegistration, coordinate_source: undefined }), 'invalid_payload');
refusedWith('provenance with no coordinates is refused rather than dropped', validateRegistration({ ...goodRegistration, latitude: undefined, longitude: undefined, coordinate_source: 'surveyed' }), 'invalid_payload');
refusedWith('an invented provenance is refused', validateRegistration({ ...goodRegistration, coordinate_source: 'vibes' }), 'invalid_payload');
accepted('the extremes of the coordinate ranges are accepted', validateRegistration({ ...goodRegistration, latitude: -90, longitude: -180 }));
accepted('…and both poles-adjacent values', validateRegistration({ ...goodRegistration, latitude: 90, longitude: 180 }));
yes('a refusal names the field so a form can be fixed', /coordinate_source/.test(validateRegistration({ ...goodRegistration, coordinate_source: 'vibes' }).error.message));

/* ------------------------------------------------------------------ *
 * 7. Lifecycle rules
 * ------------------------------------------------------------------ */

section('Status change — the lifecycle the database supports');
for (const status of OPERATOR_SETTABLE_STATUSES) {
  accepted(`"${status}" is settable`, validateStatusChange({ status }));
}
refusedWith('"inactive" is NOT settable — it means never-authenticated, which is history', validateStatusChange({ status: 'inactive' }), 'invalid_payload');
refusedWith('an invented status is refused', validateStatusChange({ status: 'retired' }), 'invalid_payload');
refusedWith('a second key is refused, not ignored', validateStatusChange({ status: 'disabled', cooperative_id: 3 }), 'invalid_payload');
refusedWith('a body that is an empty object is refused', validateStatusChange({}), 'invalid_payload');
yes('the refusal for an extra key says what PATCH accepts', /Only "status"/.test(validateStatusChange({ status: 'active', name: 'x' }).error.message));

section('Revocation — a credential id, and the operator\'s acknowledgement');
accepted('an id alone is a valid request', validateRevocation({ credential_id: 41 }));
same('force defaults to false', validateRevocation({ credential_id: 41 }).value?.force, false);
same('force:true is read as the acknowledgement', validateRevocation({ credential_id: 41, force: true }).value?.force, true);
refusedWith('a missing credential_id is refused', validateRevocation({}), 'invalid_payload');
refusedWith('a credential id as a string is refused', validateRevocation({ credential_id: '41' }), 'invalid_payload');
refusedWith('a secret sent as the credential id is refused (it is not a revocation handle)', validateRevocation({ credential_id: 'YWJjZGVmZ2hpamtsbW5vcA' }), 'invalid_payload');
refusedWith('a fractional id is refused', validateRevocation({ credential_id: 41.5 }), 'invalid_payload');
refusedWith('a negative id is refused', validateRevocation({ credential_id: -41 }), 'invalid_payload');
refusedWith('force as a string is refused', validateRevocation({ credential_id: 41, force: 'true' }), 'invalid_payload');

/* ------------------------------------------------------------------ *
 * 8. Path segments, filters and page bounds
 * ------------------------------------------------------------------ */

section('Query and path bounds');
yes('a well-formed node id in a path is accepted', isWellFormedNodeId('ESP32_AGRIS_0142'));
yes('a path traversal in a node id is refused before the lookup', !isWellFormedNodeId('../../etc/passwd'));
yes('a node id with a slash is refused', !isWellFormedNodeId('a/b'));
yes('an empty node id is refused', !isWellFormedNodeId(''));
yes('a node id of 64 characters is refused', !isWellFormedNodeId(`A${'b'.repeat(63)}`));
yes('undefined is not a node id', !isWellFormedNodeId(undefined));
same('no cooperative filter means the whole scope', parseCooperativeFilter(null), null);
same('an empty filter means the whole scope too', parseCooperativeFilter('  '), null);
same('"7" is cooperative 7', parseCooperativeFilter('7'), 7);
same('a negative is not a cooperative id', parseCooperativeFilter('-7'), 'invalid');
same('a word is not a cooperative id', parseCooperativeFilter('seven'), 'invalid');
same('a float is not a cooperative id', parseCooperativeFilter('7.5'), 'invalid');
same('an absurd digit run is refused rather than truncated', parseCooperativeFilter('9'.repeat(19)), 'invalid');
same('the default page is 25', DEFAULT_PAGE_SIZE, 25);
same('the largest page is 100', MAX_PAGE_SIZE, 100);
yes('the offset is capped so a paging bug reads short rather than wide', MAX_PAGE_OFFSET === 10_000);

/* ------------------------------------------------------------------ *
 * 9. Audit records — what the trail may hold
 * ------------------------------------------------------------------ */

section('Audit — the shape of a record');
const entry = auditEntry({
  actorUserId: ACTOR,
  action: 'credential_rotate',
  outcome: 'success',
  actorRole: 'manager',
  cooperativeId: COOP_A,
  nodeId: 'ESP32_AGRIS_0142',
  reasonCode: null,
  detail: { credential_id: 41, superseded_credential_id: 40 },
}, NOW);
same('the instant is the one the caller supplied', entry.occurredAt, '2026-11-06T09:00:00.000Z');
same('the action is recorded', entry.action, 'credential_rotate');
same('the role the decision was made under', entry.actorRole, 'manager');
same('detail keeps both ids', entry.detail, { credential_id: 41, superseded_credential_id: 40 });
const row = auditRow(entry);
same('the row uses the column names app.management_audit declares', Object.keys(row).sort().join(','), 'action,actor_role,actor_user_id,cooperative_id,detail,node_id,occurred_at,outcome,reason_code');
yes('a row has no field that could hold a secret', !Object.keys(row).some((k) => /token|secret|hash|password/i.test(k)));

section('Audit — sanitising, which is where a leak would happen');
const leaked = auditEntry({
  actorUserId: ACTOR,
  action: 'credential_provision',
  outcome: 'success',
  nodeId: 'ESP32_AGRIS_0142',
  cooperativeId: COOP_A,
  // A route that tried to be helpful by passing "the body, for context".
  detail: {
    credential_id: 42,
    secret_token: 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY',
    token: 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY',
    token_hash: 'a'.repeat(64),
    password: 'hunter2',
    device_secret: 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY',
    some_other_key: 'invented',
  },
}, NOW);
const leakedText = JSON.stringify(leaked);
yes('the allowed key survives', leaked.detail.credential_id === 42);
yes('secret_token is gone', !('secret_token' in leaked.detail));
yes('token is gone', !('token' in leaked.detail));
yes('token_hash is gone', !('token_hash' in leaked.detail));
yes('a key nobody allowed is dropped rather than trusted', !('some_other_key' in leaked.detail));
yes('no serialised audit record contains the plaintext secret', !leakedText.includes('YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY'));
yes('…or its digest', !leakedText.includes('a'.repeat(64)));
yes('…or a password', !leakedText.includes('hunter2'));
yes('detail is small enough for the column CHECK', leakedText.length < 2000);

same('a long string value is truncated, not dropped', auditEntry({ actorUserId: ACTOR, action: 'device_register', outcome: 'success', nodeId: 'N_1', detail: { status: 'x'.repeat(400) } }, NOW).detail.status.length, 120);
same('a malformed reason code is discarded rather than repaired', auditEntry({ actorUserId: ACTOR, action: 'device_view', outcome: 'refused', reasonCode: 'Not A Member!!' }, NOW).reasonCode, null);
same('a 49-character reason code is refused (the column pattern caps at 49)', auditEntry({ actorUserId: ACTOR, action: 'device_view', outcome: 'refused', reasonCode: 'a'.repeat(50) }, NOW).reasonCode, null);
same('a well-formed reason code is kept', auditEntry({ actorUserId: ACTOR, action: 'device_view', outcome: 'refused', reasonCode: 'not_a_member' }, NOW).reasonCode, 'not_a_member');
same('an over-long actor id is truncated to the uuid column width plus slack', auditEntry({ actorUserId: 'u'.repeat(200), action: 'device_view', outcome: 'success' }, NOW).actorUserId.length, 64);
same('an over-long node id from a path segment is truncated, not dropped', auditEntry({ actorUserId: ACTOR, action: 'device_view', outcome: 'refused', nodeId: 'N'.repeat(300) }, NOW).nodeId.length, 120);
same('a null nodeId stays null (the column is nullable for scope refusals)', auditEntry({ actorUserId: ACTOR, action: 'device_list', outcome: 'refused' }, NOW).nodeId, null);
yes('the trail does not invent a role for a caller with none', auditEntry({ actorUserId: ACTOR, action: 'device_list', outcome: 'refused' }, NOW).actorRole === null);
same('detail of an omitted object is an empty object, not null', auditEntry({ actorUserId: ACTOR, action: 'device_view', outcome: 'success' }, NOW).detail, {});
same('detailOf is the same filter, so a route cannot bypass it', Object.keys(detailOf({ secret_token: 'x', force: true })).join(','), 'force');
yes('node-level actions require a node name', isNodeLevelAction('credential_revoke') && !isNodeLevelAction('device_list'));
for (const action of ['device_register', 'device_update', 'device_status_change', 'credential_provision', 'credential_rotate', 'credential_revoke']) {
  yes(`${action} is node-level, so the CHECK in 000200 will accept its row`, isNodeLevelAction(action));
}

/* ------------------------------------------------------------------ *
 * 10. Cross-checks against the migration pack
 * ------------------------------------------------------------------ */

section('Migration cross-checks — the code and the schema agree');
const sql = (name) => readFileSync(join(HERE, '..', 'supabase', 'migrations', name), 'utf8');
const membership = sql('20261106000100_app_cooperative_membership.sql');
const audit = sql('20261106000200_app_management_audit.sql');

yes('the role vocabulary in app.cooperative_members is exactly manager|viewer', membership.includes("check (role in ('manager', 'viewer'))"));
yes('the audit role CHECK agrees', audit.includes("actor_role in ('manager', 'viewer')"));
yes('revocation is a stamp, and the code reads it as one', membership.includes('removed_at') && !/delete from app\.cooperative_members/i.test(membership));
yes('one current membership per subject and cooperative is a database rule', membership.includes('cooperative_member_single_current_uid') && membership.includes('where removed_at is null'));
// The bug this guards: a trigger function that assigns a column the table does not have is accepted
// at create-trigger time and aborts on the FIRST UPDATE — which is how a membership gets revoked.
yes('the touch trigger has the column it writes, so revocation cannot abort at runtime',
  membership.includes('for each row execute function data.touch_replaced_at()') && /record_replaced_at\s+timestamptz/.test(membership));
yes('a membership cannot invent a cooperative', membership.includes('references field.cooperatives (cooperative_id)'));
yes('the auth.users foreign key is attempted and its absence is made loud', membership.includes('cooperative_member_user_is_an_auth_user') && membership.includes('SKIP') && membership.includes('on delete cascade'));
yes('membership is readable by the service role and writable by nothing in this phase', membership.includes('grant select on app.cooperative_members to service_role;') && !/^grant insert on app\.cooperative_members/m.test(membership));
yes('both app tables are RLS-forced with no policies', membership.includes('force row level security') && audit.includes('force row level security') && !/create policy/.test(membership + audit));
yes('both app tables are revoked from anon and authenticated', membership.includes('revoke all on app.cooperative_members from anon, authenticated;') && audit.includes('revoke all on app.management_audit from anon, authenticated;'));

// The action vocabulary a database holds after the whole pack has run is the LAST declaration in
// apply order, not the first file that mentions `action`: `000200` creates the column with fourteen
// values and `20261107000100` replaces that CHECK with Phase 6A's eighteen. Two ways this comparison
// could be wrong in opposite directions — graded against the older list, a correct pack fails; graded
// against the two lists concatenated, a pack that layers a second CHECK instead of replacing the
// first passes, and the narrow constraint keeps refusing the new audit rows. So each declaration is
// parsed on its own, the newest is what the code is compared against, and the older one is checked
// for the property that makes the replacement safe to run.
const vocabularyDeclarations = [
  { file: '20261106000200_app_management_audit.sql', marker: 'action text not null check', end: "outcome text not null check" },
  { file: '20261107000100_app_management_audit_action_vocabulary.sql', marker: 'management_audit_action_is_known check', end: '\n  );' },
];
// Comment lines are dropped before the tokens are read: prose inside a CHECK region otherwise
// looks like vocabulary, and a test that compares the code's action list against a sentence in the
// migration would pass or fail for reasons nobody can explain.
const namesIn = (source, marker, end) => {
  const start = source.indexOf(marker);
  if (start < 0) return null;
  const stop = source.indexOf(end, start);
  if (stop < 0) return null;
  const block = source.slice(start, stop);
  return (block.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n').match(/'([a-z_]+)'/g) ?? []).map((s) => s.replace(/'/g, ''));
};
const declared = vocabularyDeclarations.map((declaration) => ({
  ...declaration,
  names: namesIn(sql(declaration.file), declaration.marker, declaration.end),
}));
yes('every action-vocabulary declaration in the pack was found', declared.every((d) => Array.isArray(d.names) && d.names.length > 0),
  declared.map((d) => `${d.file}:${d.names?.length ?? 'unparsed'}`).join(' '));
const sqlActions = declared[declared.length - 1].names ?? [];
const originalActions = declared[0].names ?? [];
const vocabulary = sql('20261107000100_app_management_audit_action_vocabulary.sql');

same('every audited action in TypeScript is legal in the CHECK', codeActions.filter((a) => !sqlActions.includes(a)).join(',') || 'none', 'none');
same('and the CHECK accepts nothing the code never emits', sqlActions.filter((a) => !codeActions.includes(a)).join(',') || 'none', 'none');
same('the action list parsed from the migration is the whole vocabulary', sqlActions.length, codeActions.length);
// A replacement that narrows the vocabulary would make previously-recordable actions unrecordable,
// which on an append-only table means the CHECK itself is the incident.
yes('the replacement vocabulary is a superset of the one it replaces', originalActions.every((a) => sqlActions.includes(a)));
// The failure this guards: `add constraint` with no drop leaves BOTH CHECKs on the column, the old
// fourteen-value one keeps refusing, and nothing in the migration says the vocabulary did not grow.
yes('the vocabulary file replaces the previous CHECK rather than layering a second one',
  /drop constraint/.test(vocabulary) && /array_length\(con\.conkey, 1\) = 1/.test(vocabulary) && /con\.conkey\[1\] = action_column/.test(vocabulary));
yes('the vocabulary file finds the previous CHECK by shape, not by its auto-generated name',
  !/drop constraint if exists management_audit_action_check/.test(vocabulary) && /contype\s*=\s*'c'/.test(vocabulary));
yes('the vocabulary file runs after the table exists', vocabulary.includes("to_regclass('app.management_audit') is null") && vocabulary.includes('must run after 20261106000200'));
same('the new vocabulary is the old one plus Phase 6A, in declaration order', sqlActions.slice(originalActions.length).join(','), 'alert_view,alert_acknowledge,alert_resolve,credential_list');
same('the node-level list in audit.ts mirrors management_audit_node_actions_name_a_node', AUDIT_DETAIL_KEYS.length > 0 && codeActions.filter(isNodeLevelAction).join(','), 'device_register,device_update,device_status_change,credential_provision,credential_rotate,credential_revoke,observation_read');

yes('the audit trail refuses UPDATE and DELETE, not just UPDATE', audit.includes('before update or delete on app.management_audit') && audit.includes('forbid_audit_mutation'));
yes('the trail cannot hold a credential field', audit.includes("not (detail ? 'secret_token')") && audit.includes("not (detail ? 'token')") && audit.includes("not (detail ? 'token_hash')"));
yes('the trail cannot hold a 64-hex digest anywhere in detail', audit.includes("detail #>> '{}' !~ '[0-9a-f]{64}'"));
yes('the trail bounds detail size', audit.includes("check (length(detail #>> '{}') <= 2000)"));
yes('the reason code pattern in audit.ts is the column pattern', audit.includes("reason_code ~ '^[a-z][a-z0-9_]{0,48}$'"));
yes('the audit table has NO foreign key on actor_user_id, so a refusal is always recordable', audit.includes('actor_user_id  uuid not null') && !audit.includes('references auth.users'));
yes('the trail is granted insert and select only', audit.includes('grant select, insert on app.management_audit to service_role;') && !/grant update/i.test(audit));
yes('the audit sequence is granted, or every insert fails on the identity column', audit.includes('grant usage, select on sequence app.management_audit_audit_id_seq to service_role;'));
yes('the refusal index exists, so "what went wrong" is a cheap query', audit.includes('management_audit_refused_idx') && audit.includes("where outcome <> 'success'"));
yes('all three app-schema files are marked not applied', /NOT APPLIED/.test(membership) && /NOT APPLIED/.test(audit) && /NOT APPLIED/.test(vocabulary));

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const failures = results.filter((r) => !r.pass);
let lastGroup = '';
for (const result of results) {
  if (result.group !== lastGroup) {
    console.log(`\n${result.group}`);
    lastGroup = result.group;
  }
  console.log(`${result.pass ? '  ✓' : '  ✗'} ${result.label}${result.pass ? '' : ` — ${result.detail}`}`);
}
console.log(`\n${results.length - failures.length}/${results.length} assertions passed.`);
if (failures.length > 0) {
  console.error(`✗ ${failures.length} failed`);
  process.exit(1);
}
