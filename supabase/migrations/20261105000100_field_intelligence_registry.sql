-- =========================================================================================
-- 20261105000100 — Field Intelligence: cooperatives, field sites, hardware nodes, credentials
-- =========================================================================================
--
-- STATUS: PROPOSED, NOT APPLIED. Like every other file in this directory, this has never been
-- run against this project's database, and no database is configured for it to run against
-- (see supabase/README.md). Nothing in the application reads or writes these tables until the
-- pack is applied. The write path in app/api/v1/hardware/route.ts reports
-- `database_not_configured` rather than pretending, exactly as the gated sync task in
-- lib/data/sync.ts preflights its table and stays out of the run when it is absent.
--
-- What this is: the operational record of the Field Intelligence module — which cooperative a
-- device belongs to, which field it stands in, what the device is, and how it authenticates.
-- These are facts THIS PROJECT CREATES, not figures a publisher states, which is why they live
-- in their own schema.
--
-- Why a new schema instead of `data`: `data` is documented as "Publisher-faithful copies of
-- open data … Contains no user data", and its whole design (units, value_kind, licence,
-- retrieved_at on every row) exists to carry somebody else's measurement honestly. A soil
-- moisture reading from our own ESP32 has no publisher, no licence and no external methodology
-- to attribute. Forcing it into `data` would either fake provenance columns or make half the
-- schema nullable. `field` holds what the platform observes and configures about its own
-- devices; `data` stays what the world publishes. `docs/database-plan.md` reserves `app` for
-- user identity, which this is not either: a hardware node is not a user.
--
-- Key style follows the repository, not the original feature brief:
--   - `field.hardware_nodes.node_id` is a TEXT primary key holding the hardware's own external
--     identifier (`ESP32_FIELD_NODE_01`). The brief suggested a separate uuid primary key plus
--     a unique external id; this repository has no uuid primary keys anywhere and does use
--     natural text keys for exactly this situation (`data.location.location_key`,
--     `data.satellite_layers.layer_id`). One identity, not two, so nothing can disagree with
--     the other. Consequence: renaming a device's external id is a re-provisioning, not an edit.
--   - `bigint generated always as identity` for the rows with no natural key (cooperatives,
--     field sites, credentials, alerts). No `gen_random_uuid()`, therefore no extension,
--     therefore nothing to enable first — this file has no prerequisite the way the
--     geospatial pack needs PostGIS.
--   - `record_added_at` / `record_replaced_at` plus `data.touch_replaced_at()` for write audit.
--     There is no `created_at` / `updated_at` anywhere in this schema's sibling pack, and the
--     trigger function is reused rather than duplicated.
--
-- This file creates no rows. No DROP, no DELETE, no UPDATE, no TRUNCATE.

-- =========================================================================================
-- 1. The schema
-- =========================================================================================

create schema if not exists field;

comment on schema field is
  'Field Intelligence: registered sensing hardware, the cooperatives and field sites it belongs to, the readings it submits, and the alerts its own thresholds raise. Everything here was produced or configured by this platform, not published by a third party — the publisher-attributed open data stays in schema `data`. Contains no user credentials in plaintext.';

-- =========================================================================================
-- 2. field.cooperatives — who a device belongs to
-- =========================================================================================
--
-- Reuse check, done before writing this: no cooperative, organisation, or membership table
-- exists in any applied-or-authored migration. `docs/database-plan.md:38-48` PLANS
-- `app.cooperatives` and `app.farmer_cooperative_memberships` as second-wave work, and
-- `docs/database-schema.md:34-46` sketches one with `created_at`/`updated_at` columns, but
-- neither was ever created. So there is nothing to reuse and this is the minimum safe
-- extension.
--
-- Deliberately NOT here: a `user_id` column, a membership table, or any role. There is no
-- authentication in this deployment (`docs/api-specification.md` describes none and no `app.*`
-- table exists), and inventing a membership model to satisfy a policy would create an
-- authorization surface nothing populates and nothing tests. Access control is therefore
-- deny-by-default at the schema level, identical to `data` — see section 6.

create table if not exists field.cooperatives (
  cooperative_id bigint generated always as identity primary key,
  name           text not null check (btrim(name) <> ''),
  -- Admin geography as free text, not a foreign key: Ethiopia's published administrative
  -- hierarchy is inconsistent between sources and one of them carries a 2020 vintage that still
  -- publishes SNNPR as one region (see data.geo_vector_layers.publisher_vintage). A point or a
  -- place the platform can stand behind is referenced through field_sites.location_key instead.
  region   text,
  zone     text,
  woreda   text,
  contact_email text,
  record_added_at    timestamptz not null default now(),
  record_replaced_at timestamptz not null default now(),
  constraint cooperative_name_is_meaningful check (char_length(btrim(name)) between 2 and 160),
  -- A shape test, not a delivery mechanism: nothing here sends mail, so this only prevents a
  -- typo from being stored as if it were a contact.
  constraint cooperative_contact_email_shape
    check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

comment on table field.cooperatives is
  'The organisations that field hardware is installed for. Created by an operator on this platform, so there is no provenance bundle; the two record_* columns are the only audit of how a row came to look as it does.';
comment on column field.cooperatives.region is
  'As an operator typed it. Not validated against any gazetteer, so it must never be used to join to a published dataset — join through field_sites.location_key, which carries its own coordinate provenance.';

create index if not exists cooperative_region_idx on field.cooperatives (region);

drop trigger if exists cooperatives_touch on field.cooperatives;
create trigger cooperatives_touch
  before update on field.cooperatives
  for each row execute function data.touch_replaced_at();

-- =========================================================================================
-- 3. field.field_sites — the plot a node stands in
-- =========================================================================================
--
-- The brief proposed a free-text `field_name` column on the device row. It is a table here
-- instead, for two reasons that are both load-bearing: alerts and thresholds have to be
-- configurable PER FIELD (§7.5), which a string repeated on each device cannot express, and a
-- field needs its own crop context before any agronomic statement about it can be made.

create table if not exists field.field_sites (
  field_site_id    bigint generated always as identity primary key,
  cooperative_id   bigint not null references field.cooperatives (cooperative_id),
  name             text not null check (btrim(name) <> ''),
  -- NULL means "we were not told", and the UI renders that as a gap. It is not a wildcard: an
  -- unattributed site must not inherit another crop's thresholds.
  crop             text,
  area_hectares    numeric(8, 2),
  -- Optional link into the publisher-attributed place vocabulary. NULL is normal: most field
  -- sites are not among the market points WFP publishes.
  location_key     text references data.location (location_key),
  record_added_at    timestamptz not null default now(),
  record_replaced_at timestamptz not null default now(),
  constraint field_site_name_is_meaningful check (char_length(btrim(name)) between 2 and 160),
  constraint field_site_area_is_positive
    check (area_hectares is null or (area_hectares > 0 and area_hectares <= 100000))
);

comment on table field.field_sites is
  'Named plots belonging to a cooperative, with the crop context a threshold needs. Carries no coordinates: a site''s position is where its devices are, and those are recorded on the node with their own provenance.';
comment on column field.field_sites.crop is
  'The crop an operator states is growing here. Thresholds are crop- and soil-specific, so a NULL crop means no crop-specific threshold may be claimed for this site, not that a default applies.';
comment on column field.field_sites.location_key is
  'Optional reference into data.location, whose coordinates carry coordinate_source (source-catalogue / user / default). Used to join a site to climate or market observations at a place we can attribute.';

create unique index if not exists field_site_per_cooperative_uid
  on field.field_sites (cooperative_id, name);
create index if not exists field_site_cooperative_idx on field.field_sites (cooperative_id);

drop trigger if exists field_sites_touch on field.field_sites;
create trigger field_sites_touch
  before update on field.field_sites
  for each row execute function data.touch_replaced_at();

-- =========================================================================================
-- 4. field.hardware_nodes — the devices
-- =========================================================================================
--
-- Coordinates are nullable on purpose, and the pairing constraint is the honest part: a
-- reading device that reports a longitude but no latitude has NOT told us where it is, and a
-- half-position plotted at the equator is a fabricated location. Section 7 of the module reads
-- `latitude is null` as "location unknown" and lists the device instead of placing it.

create table if not exists field.hardware_nodes (
  node_id        text primary key,
  name           text not null check (btrim(name) <> ''),
  cooperative_id bigint references field.cooperatives (cooperative_id),
  field_site_id  bigint references field.field_sites (field_site_id),
  status         text not null default 'inactive'
    check (status in ('active', 'inactive', 'maintenance', 'disabled')),
  latitude  double precision,
  longitude double precision,
  -- Where the numbers came from. Without this a map cannot say whether a pin is a surveyed
  -- position or something typed into a form, and the module refuses to imply either.
  coordinate_source text
    check (coordinate_source is null
           or coordinate_source in ('device-gnss', 'surveyed', 'operator-entered', 'imported')),
  hardware_model   text,
  firmware_version text,
  -- Last time this node authenticated successfully. `inactive` until the first such time: the
  -- column is never back-filled from a reading, so it cannot be older than reality.
  last_seen_at timestamptz,
  record_added_at    timestamptz not null default now(),
  record_replaced_at timestamptz not null default now(),
  constraint hardware_node_id_is_stable check (node_id ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{2,62}$'),
  constraint hardware_node_name_is_meaningful check (char_length(btrim(name)) between 2 and 160),
  constraint hardware_node_latitude_range  check (latitude  is null or (latitude  between -90  and 90)),
  constraint hardware_node_longitude_range check (longitude is null or (longitude between -180 and 180)),
  constraint hardware_node_coordinates_are_paired
    check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null)),
  constraint hardware_node_coordinates_are_attributed
    check (latitude is null or coordinate_source is not null),
  constraint hardware_node_site_needs_cooperative
    check (field_site_id is null or cooperative_id is not null)
);

comment on table field.hardware_nodes is
  'Every device the platform knows about, registered or not. node_id is the hardware''s own external identifier and the key the ingestion endpoint authenticates against; there is no separate surrogate key, following data.location and data.satellite_layers.';
comment on column field.hardware_nodes.node_id is
  'The identity printed on the device and written into its firmware (ESP32_FIELD_NODE_01). Immutable in practice: changing it means re-provisioning the device and issuing a new credential, not editing a row.';
comment on column field.hardware_nodes.status is
  'active = expected to report. inactive = registered, never yet authenticated. maintenance = deliberately offline, and its silence raises no offline alert. disabled = refused at ingestion. Status is an operator''s statement of intent, not a measurement of whether the device is up; that is last_seen_at.';
comment on column field.hardware_nodes.last_seen_at is
  'Set only after a successful credential check at ingestion. NULL means this node has never authenticated, which is not the same as being offline.';

create index if not exists hardware_node_cooperative_idx on field.hardware_nodes (cooperative_id);
create index if not exists hardware_node_status_idx       on field.hardware_nodes (status);

drop trigger if exists hardware_nodes_touch on field.hardware_nodes;
create trigger hardware_nodes_touch
  before update on field.hardware_nodes
  for each row execute function data.touch_replaced_at();

-- =========================================================================================
-- 5. field.hardware_node_credentials — hashes only
-- =========================================================================================
--
-- One row per issued credential. A node may hold several rows over its life because rotation
-- revokes the old row rather than rewriting it, and the partial unique index below is what
-- makes "at most one current credential" a database fact rather than a convention in the code.
--
-- The hash is computed in the route handler with `createHash('sha256')` from node:crypto and
-- compared with `timingSafeEqual`. The plaintext exists only in the provisioning response and
-- in the device; it is never stored, never logged, never returned by any read path again.
--
-- SHA-256 rather than bcrypt/scrypt: the secret is 256 bits of fresh CSPRNG output, not a human
-- password, so a per-credential slow KDF buys nothing here while making a 4 Hz ingestion
-- endpoint expensive. The hash is a one-way pre-image guard for the stored value, not a defence
-- against a guessed password; a leaked database row is not a usable credential, and revocation
-- plus rotation bound the damage that a leaked device would cause.

create table if not exists field.hardware_node_credentials (
  credential_id  bigint generated always as identity primary key,
  node_id        text not null references field.hardware_nodes (node_id),
  token_hash     text not null,
  hash_algorithm text not null default 'sha256' check (hash_algorithm = 'sha256'),
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  -- Exactly 64 lowercase hex characters. A plaintext device secret is not that shape, so this
  -- constraint makes "we accidentally stored the token" impossible rather than merely unlikely.
  constraint hardware_credential_hash_is_sha256_hex check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint hardware_credential_expiry_after_issue  check (expires_at is null or expires_at > created_at),
  constraint hardware_credential_revocation_after_issue check (revoked_at is null or revoked_at >= created_at)
);

comment on table field.hardware_node_credentials is
  'Device credentials, stored only as SHA-256 hashes. Readable by the service role on the server and by nobody through the API; no read path in this project returns token_hash.';
comment on column field.hardware_node_credentials.token_hash is
  'hex(sha256(device secret)). The secret itself is shown once at provisioning and never persisted, logged, or re-served. Rotating issues a new row and sets revoked_at on this one.';
comment on column field.hardware_node_credentials.created_at is
  'Issuance time. This table uses created_at/last_used_at rather than the record_* audit pair because a credential row is never updated in place except to stamp last_used_at, revoked_at or expires_at — each of which is a lifecycle event of its own, not an edit of the record.';
comment on column field.hardware_node_credentials.revoked_at is
  'Set once, by rotation or by retiring a device. A row with revoked_at NULL is the node''s current credential; the partial unique index below enforces that.';

create unique index if not exists hardware_credential_single_current_uid
  on field.hardware_node_credentials (node_id)
  where revoked_at is null;
create index if not exists hardware_credential_node_idx
  on field.hardware_node_credentials (node_id, created_at desc);

-- =========================================================================================
-- 6. Rotation is one atomic act, so it lives in the database
-- =========================================================================================
--
-- A rotation has to revoke the current credential AND issue the replacement. Two round trips
-- from the server are not one operation: if the second call fails after the first succeeded,
-- the device holds a secret the database no longer accepts, and it cannot be re-provisioned
-- without physical access to the field. The same reason the sync pack has
-- `data.claim_sync_lease()` rather than a read-then-write in TypeScript is the reason this
-- exists: a multi-step invariant that must not be interruptible belongs where the work is
-- already done, inside one transaction.
--
-- SECURITY INVOKER, which is the default and stated here anyway: the function runs as the
-- caller, so it can only be used by a role that already holds INSERT and UPDATE on this table
-- (file 0003 grants that to `service_role` and to nobody else). It is not a privilege escalator
-- and it does not need to be — no browser reaches it.
--
-- It returns the new row's id and the id it superseded, and nothing else. It never accepts or
-- returns a plaintext secret: the caller hashes first, which is also what makes the hash shape
-- check here redundant-but-kept — defence in depth costs one comparison and the alternative is
-- a table of plaintext tokens.

create or replace function field.rotate_device_credential(p_node_id text, p_token_hash text)
returns table (credential_id bigint, superseded_credential_id bigint)
language plpgsql
as $$
declare
  v_superseded bigint;
  v_issued     bigint;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception
      'ROTATE_REFUSED: p_token_hash must be 64 lowercase hex characters — the sha256 of the new secret, computed by the caller. A plaintext token is never accepted by this function.'
      using hint = 'Hash with createHash("sha256").update(token).digest("hex") before calling.';
  end if;

  if not exists (select 1 from field.hardware_nodes n where n.node_id = p_node_id) then
    raise exception 'ROTATE_REFUSED: no hardware node is registered under node_id "%".', p_node_id;
  end if;

  -- The partial unique index allows at most one current row, so `into` takes at most one value.
  update field.hardware_node_credentials
     set revoked_at = now()
   where node_id = p_node_id and revoked_at is null
   returning hardware_node_credentials.credential_id into v_superseded;

  insert into field.hardware_node_credentials (node_id, token_hash)
       values (p_node_id, p_token_hash)
   returning hardware_node_credentials.credential_id into v_issued;

  return query select v_issued, v_superseded;
end $$;

comment on function field.rotate_device_credential(text, text) is
  'Revokes the node''s current credential and issues the replacement in one transaction. Takes the sha256 hex of the new secret, never the secret itself. Executable only by a role holding INSERT and UPDATE on field.hardware_node_credentials.';

revoke all on function field.rotate_device_credential(text, text) from public, anon, authenticated;

-- =========================================================================================
-- 7. Row level security — deny by default, the way every other table in this repository does
-- =========================================================================================
--
-- RLS is enabled AND forced, with zero policies, and both API roles are revoked. That is the
-- same posture as data.satellite_observations and the rest of the `data` pack: nothing an
-- anonymous visitor or a signed-in farmer's browser session can do reaches these rows. The
-- application reads and writes them only on the server, through the service role held in a
-- NON-`NEXT_PUBLIC` variable (lib/supabaseAdmin.ts), which is the only role that can.
--
-- Why no cooperative-scoped SELECT policies: policies can only filter on an authenticated
-- subject, and this deployment has none — Supabase Auth is not configured and no `app.profiles`,
-- `app.cooperatives` or membership table exists anywhere (docs/database-plan.md:38-48 plans
-- them as unstarted). A policy written against a claim nobody issues is either vacuously true
-- (a hole) or vacuously false (a dead table), and neither can be tested. The brief forbids
-- inventing a role system, so the minimum safe extension is the one above: keep the browser out
-- of these tables entirely, and scope by cooperative in the query layer, where the cooperative
-- id is an explicit argument. When Auth arrives, the policies this section does not write belong
-- in a NEW numbered file — not an edit of this one.

alter table field.cooperatives               enable row level security;
alter table field.field_sites                enable row level security;
alter table field.hardware_nodes             enable row level security;
alter table field.hardware_node_credentials  enable row level security;

alter table field.cooperatives               force row level security;
alter table field.field_sites                force row level security;
alter table field.hardware_nodes             force row level security;
alter table field.hardware_node_credentials  force row level security;

revoke all on field.cooperatives              from anon, authenticated;
revoke all on field.field_sites               from anon, authenticated;
revoke all on field.hardware_nodes            from anon, authenticated;
revoke all on field.hardware_node_credentials from anon, authenticated;

comment on table field.cooperatives is
  'RLS enabled and forced with no policies: readable only by the table owner or a bypassrls role. No anon/authenticated access. See the note in section 7 about why there are no cooperative-scoped policies yet.';
comment on table field.field_sites is
  'RLS enabled and forced with no policies: readable only by the table owner or a bypassrls role. No anon/authenticated access.';
comment on table field.hardware_nodes is
  'RLS enabled and forced with no policies: readable only by the table owner or a bypassrls role. No anon/authenticated access.';
comment on table field.hardware_node_credentials is
  'RLS enabled and forced with no policies. Forced, not merely enabled, so a query by the table owner still passes through policy checks: a credential hash must not be reachable through a connection that holds owner rights but was not meant to read secrets.';
