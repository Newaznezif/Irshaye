-- =========================================================================================
-- 20261106000100 — Cooperative membership: who may manage which cooperative's devices
-- =========================================================================================
--
-- STATUS: PROPOSED, NOT APPLIED. Forward-only. It creates schema `app`, which does not exist in
-- any other file in this pack, and it changes no existing table. Nothing in this file edits
-- 20261026000100…600 or 20261105000100…300; the objects they create are referenced, never altered.
--
-- WHY THIS FILE EXISTS NOW. `20261105000100` section 2 records that it deliberately shipped
-- without a membership model because no authentication existed in the deployment, and section 7
-- records that the policies it did not write belong "in a NEW numbered file — not an edit of
-- this one". This is that file, and the trigger is the one the earlier comment named: device
-- management endpoints now need to answer "may this caller act on this cooperative's hardware",
-- which cannot be answered without a row that ties a subject to an organisation.
--
-- It is the minimum, and the minimum is a narrow thing: one table, two roles, one lifecycle.
-- `docs/database-plan.md` sketches a wider second wave (`app.profiles`, `app.farmers`,
-- `app.organizations`, `app.farmer_cooperative_memberships`). None of that is needed to authorize
-- a device-management call, and building it here would be the enterprise-RBAC framework the brief
-- forbids. A profile row that stores a display name is not an authorization input; if the wider
-- wave arrives it can read THIS table, not the other way round.

-- =========================================================================================
-- 1. The schema
-- =========================================================================================

create schema if not exists app;

comment on schema app is
  'Application identity and access records this platform owns: which authenticated subject holds which role in which cooperative, and the append-only record of management actions they took. Not publisher data (that is `data`), not field observations (that is `field`).';

-- =========================================================================================
-- 2. app.cooperative_members
-- =========================================================================================
--
-- A membership is a claim THIS platform makes about a subject, and the subject is a Supabase Auth
-- user id. Three rules carry the whole security property, and they are all database rules rather
-- than code conventions:
--
--   a. `user_id` refers to `auth.users`, so a membership cannot point at a subject that does not
--      exist. (Guarded — see section 3, which explains why and what the guard refuses to hide.)
--   b. `cooperative_id` refers to `field.cooperatives`, so a membership cannot invent an
--      organisation. The cooperative a device belongs to and the cooperative a person manages are
--      the same row in the same table; there is no second copy that could disagree.
--   c. at most one current row per (subject, cooperative), so "revoked" can never be ambiguous.

create table if not exists app.cooperative_members (
  member_id      bigint generated always as identity primary key,
  user_id        uuid not null,
  cooperative_id bigint not null references field.cooperatives (cooperative_id),
  -- Two roles, because that is the number the device-management surface needs. See the capability
  -- table below; a third role would need a capability nobody has asked for.
  role           text not null default 'viewer'
    check (role in ('manager', 'viewer')),
  added_at       timestamptz not null default now(),
  added_by       uuid,
  removed_at     timestamptz,
  removed_by     uuid,
  -- Required by the trigger at the foot of this section, and by the pack's convention: a row that
  -- can be updated must say when it last was, separately from the lifecycle stamps. `removed_at`
  -- records when access ENDED; a role change from manager to viewer is neither of those events and
  -- would otherwise be invisible to anyone who is not reading the trigger. Nullable by design — it
  -- is NULL until the first UPDATE, which is exactly what "this grant has never been edited" means.
  record_replaced_at timestamptz,
  constraint cooperative_member_removal_is_not_before_join
    check (removed_at is null or removed_at >= added_at),
  -- A removal names who did it. `removed_at` without `removed_by` would let a membership be ended
  -- anonymously, which is exactly the record an incident review needs.
  constraint cooperative_member_removal_is_attributed
    check (removed_at is null or removed_by is not null),
  -- The same reasoning one step earlier: the row must say who granted access in the first place.
  -- Deliberately nullable, because the very first membership is created by an operator running SQL
  -- (docs/field-intelligence-setup.md) and there is no caller to name yet — inventing a uuid for
  -- "the bootstrap script" would be a fake actor in an audit table.
  constraint cooperative_member_adder_is_not_the_member
    check (added_by is null or added_by <> user_id)
);

comment on table app.cooperative_members is
  'Which authenticated subject holds which role in which cooperative. The only authorization input the device-management API reads; nothing in a request body or header can substitute for it.';
comment on column app.cooperative_members.user_id is
  'A Supabase Auth user id. Taken from a token the Auth server confirmed (lib/serverSupabase.ts), never from the caller''s own claim about who they are.';
comment on column app.cooperative_members.role is
  'manager = may register devices and issue, rotate and revoke credentials, and change device status. viewer = may read device metadata and status only. Capability table: docs/api-specification.md.';
comment on column app.cooperative_members.removed_at is
  'NULL means current. Revocation is a stamp, not a delete, so the history of who could act is still reconstructable after they can''t.';
comment on column app.cooperative_members.added_by is
  'NULL only for a membership an operator inserted by SQL during bootstrap; see docs/field-intelligence-setup.md.';

-- One current membership per subject and cooperative: the same shape as
-- `hardware_credential_single_current_uid`, for the same reason — "the" active row must be a
-- database fact, or two rows with different roles would leave the code choosing, silently.
create unique index if not exists cooperative_member_single_current_uid
  on app.cooperative_members (user_id, cooperative_id)
  where removed_at is null;

-- The authorization hot path is "all current memberships for this user", which is what one request
-- resolves in order to learn the caller's whole cooperative scope.
create index if not exists cooperative_member_user_idx
  on app.cooperative_members (user_id)
  where removed_at is null;
create index if not exists cooperative_member_cooperative_idx
  on app.cooperative_members (cooperative_id)
  where removed_at is null;

-- A membership row is updated twice in its life at most: a role change, and the revocation stamp.
-- Both change who can act, so both need a "last edited" fact that is not the lifecycle column.
-- `data.touch_replaced_at()` writes `new.record_replaced_at`, so this table must carry that column:
-- a trigger function that assigns a missing field is a runtime abort on the first UPDATE, not a
-- create-time error. Validated as such — see the harness note in supabase/migrations/README.md.
drop trigger if exists cooperative_members_touch on app.cooperative_members;
create trigger cooperative_members_touch
  before update on app.cooperative_members
  for each row execute function data.touch_replaced_at();

-- =========================================================================================
-- 3. The foreign key to auth.users, added only where auth.users exists
-- =========================================================================================
--
-- Supabase creates `auth.users` and owns its lifecycle; a plain `references auth.users (id)` in a
-- migration would abort with `relation "auth.users" does not exist` on a project where Auth has
-- been disabled, and on the in-process PostgreSQL this pack is validated with, where it never
-- existed in the first place. `20261026000100` established the pattern for exactly this situation
-- (its `::regclass` guard): attempt the real thing, and make the absence loud and specific instead
-- of an abort.
--
-- The guard is NOT a silent skip. Two things are refused outright:
--   - `auth.users` existing but not being a table or view;
--   - `auth.users` existing with an `id` column that is not `uuid`, which would make the FK
--     undeclarable and the membership table a foreign-key-less pile of claims.
-- When the relation is genuinely absent, the table still gets created, the CHECK still requires a
-- well-formed uuid, and a NOTICE says `SKIP` — and the application code path that grants or reads
-- membership does not depend on the constraint to be safe, because it never inserts a user id
-- without a session-verified subject.

do $$
declare
  v_kind text;
  v_id_type text;
begin
  select case
           when c.relkind in ('r', 'p', 'v', 'm') then 'relation'
           else 'other'
         end
    into v_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'auth' and c.relname = 'users';

  if v_kind is null then
    raise notice
      'SKIP: auth.users does not exist in this database, so app.cooperative_members.user_id carries no foreign key to it. On a Supabase project (where Auth creates that table) re-run this file, or add the constraint with the statement at the foot of this section, so a membership can never point at a deleted subject.';
    return;
  end if;

  if v_kind <> 'relation' then
    raise exception
      'INCOMPATIBLE: "auth.users" exists but is not a table or view. A membership cannot reference it, and refusing here is better than shipping a membership table whose only identity rule is a convention.';
  end if;

  select format_type(a.atttypid, a.atttypmod)
    into v_id_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'auth' and c.relname = 'users' and a.attname = 'id';

  if v_id_type is null then
    raise exception
      'INCOMPATIBLE: auth.users exists but has no "id" column. This pack assumes Supabase''s own Auth schema; reconcile it before granting device access through this table.';
  end if;

  if v_id_type <> 'uuid' then
    raise exception
      'INCOMPATIBLE: auth.users.id is "%", not uuid. app.cooperative_members.user_id is uuid, and a foreign key between different types is impossible — so the membership table would silently hold ids that no session can ever produce.', v_id_type;
  end if;

  alter table app.cooperative_members
    add constraint cooperative_member_user_is_an_auth_user
    foreign key (user_id) references auth.users (id)
    on delete cascade;

  raise notice 'ADDED: app.cooperative_members.user_id -> auth.users (id) on delete cascade.';
end $$;

-- Why `on delete cascade` HERE and not in the audit table: a deleted account must not be able to
-- leave a live grant behind. Access that outlives its subject is a hole. The audit record of what
-- that person did is a different object and deliberately survives them — see 20261106000200.
--
-- The declarable form, for an operator applying this to a project where the block above reported
-- SKIP and Auth was enabled afterwards:
--
--   alter table app.cooperative_members
--     add constraint cooperative_member_user_is_an_auth_user
--     foreign key (user_id) references auth.users (id) on delete cascade;

-- =========================================================================================
-- 4. Row level security — the same deny-by-default posture as every other table here
-- =========================================================================================
--
-- Enabled AND forced, zero policies, both API roles revoked. Read the consequence precisely,
-- because it is the part a reviewer should push on:
--
--   This table does NOT become the enforcement point for a browser session. No code path in this
--   project queries PostgREST as `authenticated`; every management route resolves the caller's
--   identity with Auth (`verifyCaller`), then reads this table as `service_role` on the server and
--   scopes its own queries by the cooperative ids it got back. RLS with policies would be the
--   right instrument for a client that talks to the database directly, and that client does not
--   exist. Writing policies for it would add an attack surface with no test that can reach it.
--
-- So the guarantee is layered differently, and both layers are real:
--   - the database guarantees the SHAPE of access (one current row per subject and cooperative, a
--     role from a closed list, an id that must be an Auth subject where Auth exists);
--   - the query layer guarantees the SCOPE (lib/field/access.ts, whose decisions are pure and
--     covered by npm run test:field, including the cross-cooperative refusals).
--
-- If a future feature ever gives the browser direct table access, the policies belong in a NEW
-- numbered file, reviewed with the code that would rely on them.

alter table app.cooperative_members enable row level security;
alter table app.cooperative_members force row level security;
revoke all on app.cooperative_members from anon, authenticated;

comment on table app.cooperative_members is
  'RLS enabled and forced with no policies: readable only by the table owner or a bypassrls role. No anon/authenticated access. Authorization is resolved server-side against these rows; see section 4 for why there are no policies yet.';

-- The privileges `service_role` needs, named here rather than in a companion file for one reason:
-- unlike schema `field`, this table has exactly one writer and one reader in the codebase
-- (lib/field/access.ts), so the grant and the object can be reviewed in the same screen.
grant usage on schema app to service_role;
grant select on app.cooperative_members to service_role;

-- Inserting and ending a membership is NOT something the application does in this phase: there is
-- no membership-management endpoint, and granting the first one is a reviewed SQL operation by an
-- operator (docs/field-intelligence-setup.md). Therefore no INSERT, UPDATE or DELETE is granted to
-- any API role — a code path that could not write a membership cannot be exploited into writing
-- one.
--
-- When a membership-administration endpoint is built, this grant is the line that changes, and it
-- should change in a new file that also brings the audit and the tests for it:
--
--   grant insert, update on app.cooperative_members to service_role;
--   + the endpoint must write app.management_audit like every other privileged action.
