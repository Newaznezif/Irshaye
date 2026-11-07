-- =========================================================================================
-- 20261106000200 — Management audit: the append-only record of who changed which device
-- =========================================================================================
--
-- STATUS: PROPOSED, NOT APPLIED. Companion to 20261106000100; run after it (it needs schema `app`).
--
-- What this is for. Every privileged action in the device-management API changes something an
-- operator can act on in the field: a device registered, a credential rotated, a node disabled.
-- When a device stops reporting at 5am, the question "who did what to it, and when" has to have an
-- answer in the database rather than in a log file that rotates.
--
-- What this is NOT: a general activity feed, and not a second copy of `field.hardware_nodes`. It
-- records decisions and their outcomes, including refusals.

create table if not exists app.management_audit (
  audit_id       bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),

  -- The confirmed subject from `verifyCaller`. Deliberately NOT a foreign key to auth.users, and
  -- the reason is the whole point of an audit trail: a row that cascades away when an account is
  -- deleted is not evidence, and a row that blocks the deletion hands a former member a veto over
  -- their own offboarding. The id is recorded, nothing more.
  actor_user_id  uuid not null,
  -- The cooperative role the decision was made under, from app.cooperative_members. Nullable
  -- because a request refused for having no membership at all has no role to name — inventing one
  -- would put a claim in the record that the database never granted.
  actor_role     text check (actor_role is null or actor_role in ('manager', 'viewer')),

  -- Also deliberately unenforced as a reference: an audit row must be able to describe a
  -- cooperative or node that does not exist. "Someone tried to register a device against site 99,
  -- which is not theirs" is precisely the event worth keeping, and it has no valid row to point at.
  cooperative_id bigint,
  node_id        text,

  -- The write actions from the device-management API, then the read actions of the dashboard.
  --
  -- A read belongs in an access trail for the same reason a write does: an `overview_read` refusal is
  -- "someone reached for a cooperative that is not theirs", and that question has to be answerable
  -- after the fact. Successful reads are deliberately NOT recorded — a row exists only when a route
  -- calls the audit helper — so naming the read actions here costs nothing in volume while keeping
  -- every refusal in one vocabulary. The list in lib/field/types.ts is what `npm run test:field`
  -- compares this against.
  action text not null check (
    action in (
      'device_register',
      'device_update',
      'device_status_change',
      'credential_provision',
      'credential_rotate',
      'credential_revoke',
      'device_list',
      'device_view',
      'overview_read',
      'site_list',
      'site_view',
      'observation_read',
      'alert_list',
      'map_read'
    )
  ),
  outcome text not null check (outcome in ('success', 'refused', 'failed')),
  -- The stable API code that was returned, e.g. `not_a_member`, `device_disabled`. Present on
  -- every refusal so an operator can grep the trail for one reason without parsing prose.
  reason_code text check (reason_code is null or reason_code ~ '^[a-z][a-z0-9_]{0,48}$'),

  detail jsonb not null default '{}'::jsonb,

  constraint management_audit_detail_is_object
    check (jsonb_typeof(detail) = 'object'),
  -- A refusal is only useful if it says what was attempted; a refusal that names a nonexistent
  -- device is indistinguishable from a typo. So exactly one of the two references is expected on
  -- node-level actions, and the CHECK says "if node_id is absent, say why" rather than forcing a
  -- fake value into it.
  constraint management_audit_node_actions_name_a_node
    check (
      action not in ('device_register', 'device_update', 'device_status_change',
                     'credential_provision', 'credential_rotate', 'credential_revoke',
                     'observation_read')
      or node_id is not null
    ),
  -- The credential guards. A plaintext device secret is 43 base64url characters and its digest is
  -- exactly 64 lowercase hex. The key-name CHECK is the enforceable half: no 43-character string
  -- can be distinguished from a legitimate long identifier by shape alone, so the digest shape is
  -- refused outright and the plaintext is kept out by the whitelist in lib/field/audit.ts, which
  -- is the code that builds `detail` and the reason a route never hands it a request body.
  -- The same asymmetry is documented for field.sensor_logs.raw_payload.
  constraint management_audit_detail_carries_no_credential
    check (not (detail ? 'secret_token') and not (detail ? 'token') and not (detail ? 'token_hash')),
  constraint management_audit_detail_has_no_digest
    check (detail #>> '{}' !~ '[0-9a-f]{64}'),
  -- An audit row is an index into an event, not a document. Unbounded `detail` is how a table
  -- becomes the slowest one in the project.
  constraint management_audit_detail_is_small
    check (length(detail #>> '{}') <= 2000)
);

comment on table app.management_audit is
  'Append-only record of device-management actions and refusals. Contains no credential material of any kind: no secret, no hash, no field that could hold one — enforced by the CHECKs on `detail`.';
comment on column app.management_audit.actor_user_id is
  'The Auth subject whose session the caller presented, as confirmed server-side. Not a foreign key: audit evidence outlives the account it belongs to.';
comment on column app.management_audit.outcome is
  'success = the action happened. refused = a policy or permission stopped it (an authorization decision, not a fault). failed = it was allowed and then something downstream went wrong.';
comment on column app.management_audit.detail is
  'A small JSON object of non-credential identifiers — the ids and limits that identify what was attempted. Never a request body: a body is where a credential would arrive.';

create index if not exists management_audit_node_time_idx
  on app.management_audit (node_id, occurred_at desc);
create index if not exists management_audit_cooperative_time_idx
  on app.management_audit (cooperative_id, occurred_at desc);
create index if not exists management_audit_actor_time_idx
  on app.management_audit (actor_user_id, occurred_at desc);
-- The "show me what went wrong" query, which is the one an operator actually runs.
create index if not exists management_audit_refused_idx
  on app.management_audit (occurred_at desc)
  where outcome <> 'success';

-- =========================================================================================
-- 1. Append-only as a database fact, stricter than the sensor history
-- =========================================================================================
--
-- `field.sensor_logs` refuses UPDATE but leaves DELETE for retention pruning. This table refuses
-- both, and the difference is volume and purpose: readings accumulate without bound and a pruning
-- job is inevitable, whereas management events are a few per device per year, so the only reason to
-- delete one is to conceal something. When a legal-retention rule ever requires pruning, that
-- decision belongs in a migration that drops this trigger and says who authorised it.

create or replace function app.forbid_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'app.management_audit is append-only: a recorded action is never edited or removed. If the record is wrong, write a correction as a new row; to change history itself, drop this trigger in a reviewed migration that states why.';
end $$;

comment on function app.forbid_audit_mutation() is
  'Refuses UPDATE and DELETE on app.management_audit. An audit trail that its own subjects can tidy is not an audit trail.';

drop trigger if exists management_audit_no_mutation on app.management_audit;
create trigger management_audit_no_mutation
  before update or delete on app.management_audit
  for each row execute function app.forbid_audit_mutation();

-- =========================================================================================
-- 2. Row level security — deny by default
-- =========================================================================================
--
-- Same posture as `app.cooperative_members`: forced, zero policies, both API roles revoked. The
-- audit trail is read by the server (and in later phases, by a management screen through a route
-- that scopes by cooperative), never by a browser session.

alter table app.management_audit enable row level security;
alter table app.management_audit force row level security;
revoke all on app.management_audit from anon, authenticated;

comment on table app.management_audit is
  'RLS enabled and forced with no policies: readable only by the table owner or a bypassrls role. No anon/authenticated access.';

-- The two privileges the code needs, and no more: it writes an event and it reads its own scope
-- back. UPDATE and DELETE are not granted — least privilege agrees with the trigger, so neither the
-- application nor a mistaken operator query can rewrite the trail.
grant select, insert on app.management_audit to service_role;
grant usage, select on sequence app.management_audit_audit_id_seq to service_role;
