-- =========================================================================================
-- 20261105000200 — Field Intelligence: sensor readings, threshold rules, device alerts
-- =========================================================================================
--
-- STATUS: PROPOSED, NOT APPLIED. Parsed and reviewed; never run against a database, because
-- this project has no database configured. Requires 20261105000100 (schema `field`,
-- `field.hardware_nodes`, `field.field_sites`, `field.alert_rules` targets) and 0001 (schema
-- `data`, `data.touch_replaced_at()`).
--
-- What this is: the append-only record of what registered hardware measured, the thresholds an
-- operator configures, and the alerts those thresholds produce.
--
-- Deliberately absent from `field.sensor_logs`:
--   - `value_kind`. Every row here is a direct measurement by a named device, so the kind is
--     'observed' by construction and a column with one legal value would only invite a lie. The
--     readings that are NOT measurements — the comparisons against Open-Meteo, NASA POWER and
--     GIBS in the insights layer — are computed at request time by lib/field/insights.ts and
--     stamped `valueKind = 'estimated'` in the response. They are never written here, because a
--     derived figure stored among measurements would read like one.
--   - `source_*` / `license` / `methodology`. There is no publisher. The device IS the source,
--     and it is a foreign key, which is stronger than a text attribution: a reading cannot
--     outlive its provenance or disagree with it.
--   - `title` / `description` on alerts. Prose stored in one language cannot be translated, and
--     this interface renders in five. An alert carries a type key and its numbers; the sentence
--     comes from the locale dictionaries.

-- =========================================================================================
-- 1. field.sensor_logs — one row per accepted reading
-- =========================================================================================
--
-- Units are encoded in the column names (`_pct`, `_c`, `_v`) exactly as the `data` pack does
-- (`precipitation_mm`, `temperature_max_c`, `wind_speed_ms`), because a number without its unit
-- is the failure mode this project is built to avoid: an Ethiopian retail price published as
-- US dollars per metric tonne is a real historical event in this codebase's analysis, and the
-- defence is never to let a unit be implicit.
--
-- Every measurement is nullable, and the constraint below requires at least one. A device that
-- reports only battery must be storable — that IS a reading — while a row of five NULLs must
-- not be, because the UI would render an empty row and call it data.
--
-- NULL means "this device did not measure that quantity", and is NOT stored as 0. For soil
-- moisture 0 is a claim about bone-dry ground; for battery it is a claim about a dead cell.

create table if not exists field.sensor_logs (
  log_id               bigint generated always as identity primary key,
  node_id              text not null references field.hardware_nodes (node_id),
  soil_moisture_pct    numeric(5, 2),
  ambient_temp_c       numeric(5, 2),
  humidity_pct         numeric(5, 2),
  battery_voltage_v    numeric(6, 3),
  -- The device's own clock, when it has one. `time_source` says whether it did.
  measured_at          timestamptz not null,
  received_at          timestamptz not null default now(),
  time_source          text not null
    check (time_source in ('device', 'server')),
  -- sha256 over the canonical payload (node id, measured_at, the four measurements). The
  -- ingestion endpoint replays this to answer a duplicate submission; the unique index in
  -- section 2 is what actually refuses it.
  payload_hash         text not null,
  -- The request body AS RECEIVED, minus the credential field. Storing the raw body untouched
  -- would copy every device secret into this database in plaintext, which is precisely what
  -- the hash-only rule in file 0001 forbids; the constraint below makes that an insert failure
  -- rather than a code-review item.
  raw_payload          jsonb,
  record_added_at      timestamptz not null default now(),
  record_replaced_at   timestamptz not null default now(),
  constraint sensor_log_soil_moisture_is_a_percentage
    check (soil_moisture_pct is null or (soil_moisture_pct between 0 and 100)),
  constraint sensor_log_humidity_is_a_percentage
    check (humidity_pct is null or (humidity_pct between 0 and 100)),
  -- A plausible-range bound, not a claim about anyone's hardware: -40 °C to 60 °C brackets the
  -- rated window of every temperature sensor this module documents, and a value outside it is
  -- a wiring or firmware fault whatever the part number.
  --
  -- These columns are `numeric`, and numeric DOES have a NaN value — the myth that it does not
  -- is worth stating here because the range checks are what actually stop it. Every comparison
  -- with NaN is false, so `NaN between 0 and 100` fails and the CHECK rejects it; and numeric
  -- has no Infinity at all, so 'Infinity' is refused by the type (`numeric field overflow`)
  -- before any constraint runs. Both were confirmed by executing these statements against a
  -- real PostgreSQL rather than by reasoning about them. The ingestion endpoint also applies
  -- Number.isFinite to the parsed JSON, so a device sending `NaN` through JSON.parse is turned
  -- away at the boundary rather than at the table.
  constraint sensor_log_temperature_is_plausible
    check (ambient_temp_c is null or (ambient_temp_c between -40 and 60)),
  constraint sensor_log_battery_is_a_real_voltage
    check (battery_voltage_v is null or (battery_voltage_v between 0 and 30)),
  constraint sensor_log_carries_a_measurement check (
    soil_moisture_pct   is not null
    or ambient_temp_c   is not null
    or humidity_pct     is not null
    or battery_voltage_v is not null
  ),
  -- A device clock that runs ahead of the server is a device whose timestamps cannot be
  -- trusted. 15 minutes is the same drift allowance the ingestion endpoint accepts, so the
  -- boundary and the database agree rather than one silently overriding the other.
  constraint sensor_log_measured_not_ahead_of_receipt
    check (measured_at <= received_at + interval '15 minutes'),
  constraint sensor_log_payload_is_sha256_hex check (payload_hash ~ '^[0-9a-f]{64}$'),
  constraint sensor_log_raw_is_an_object
    check (raw_payload is null or jsonb_typeof(raw_payload) = 'object'),
  constraint sensor_log_raw_carries_no_credential
    check (raw_payload is null or not (raw_payload ? 'secret_token')),
  constraint sensor_log_server_time_agrees_with_receipt
    check (time_source <> 'server' or abs(extract(epoch from (measured_at - received_at))) < 1)
);

comment on table field.sensor_logs is
  'Append-only sensor readings accepted from authenticated devices. measured_at is the device''s own timestamp when it supplies one; received_at is always this server''s clock. The two are separate columns because a node that reports at midnight for a reading taken at dawn is telling a different story, and only one of them can be checked.';
comment on column field.sensor_logs.time_source is
  'device = the payload carried measured_at. server = the device sent no timestamp, so measured_at was set to the receipt instant and the row says so; the UI must not present such a reading as measured at a time the hardware never reported.';
comment on column field.sensor_logs.payload_hash is
  'hex(sha256(canonical payload)). Exists to make a replayed submission identifiable, and is the replay half of the unique index below. Contains no credential material.';
comment on column field.sensor_logs.raw_payload is
  'What the device sent, with secret_token removed before the row was written — a constraint, not a convention. Kept so a reviewer can reconstruct exactly how a value was read, including fields this schema does not model yet.';
comment on column field.sensor_logs.record_replaced_at is
  'Equals record_added_at on every row that survives, because the mutation trigger below refuses UPDATE. The column exists for consistency with the rest of the schema and because a forced trigger can be lifted by a future deliberate migration, at which point the timestamp tells the truth.';

-- =========================================================================================
-- 2. Indexes — every read path in the module is bounded by node and time
-- =========================================================================================
--
-- The dashboard never asks for "all readings". Sensor Analytics asks for one node inside a
-- window, Field Monitoring asks for the newest row per node, and the overview asks for counts.
-- These four indexes cover those three shapes and nothing else; a wider index here would be
-- write amplification on the one table that grows every few minutes.
--
-- Partitioning: nothing is partitioned, and this is how a later `partition by range (measured_at)`
-- would be added without guessing. PostgreSQL requires a partitioned table's unique indexes to
-- include the partition key, so `sensor_log_replay_uid` already carries `measured_at`, and the
-- single remaining obstacle is `log_id` as primary key — which would become `(log_id, measured_at)`
-- in that future file. Recorded here so the next person inherits the constraint, not the surprise.

create unique index if not exists sensor_log_replay_uid
  on field.sensor_logs (node_id, measured_at, payload_hash);
create index if not exists sensor_log_node_time_idx on field.sensor_logs (node_id, measured_at desc);
create index if not exists sensor_log_time_idx      on field.sensor_logs (measured_at desc);
create index if not exists sensor_log_node_received_idx on field.sensor_logs (node_id, received_at desc);

-- =========================================================================================
-- 3. Readings are append-only as a database fact
-- =========================================================================================
--
-- "Prevent clients from modifying historical readings" is already handled by privilege: anon and
-- authenticated hold no grant on this table at all (section 6), so a browser cannot reach it.
-- This trigger covers the rest — a server-side bug that issues an UPDATE against a reading, or a
-- human with the service-role key, gets a clear refusal instead of a silently edited history.
--
-- DELETE is NOT blocked, because retention is a real operation on a table this busy and pruning
-- old rows must stay possible. It is a deliberate, logged, operator action either way; the
-- difference this guard draws is between fixing a mistake and rewriting the record.

create or replace function field.forbid_sensor_log_update()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'field.sensor_logs is append-only: a reading that was accepted is never edited. Raise a new row, or correct the device, and if the history itself must change, drop this trigger in a reviewed migration that says why.';
end $$;

comment on function field.forbid_sensor_log_update() is
  'Refuses UPDATE on field.sensor_logs. Sensor history is evidence; rewriting it would make every downstream alert and insight unreviewable.';

drop trigger if exists sensor_logs_no_update on field.sensor_logs;
create trigger sensor_logs_no_update
  before update on field.sensor_logs
  for each row execute function field.forbid_sensor_log_update();

drop trigger if exists sensor_logs_touch on field.sensor_logs;
create trigger sensor_logs_touch
  before update on field.sensor_logs
  for each row execute function data.touch_replaced_at();

-- =========================================================================================
-- 4. field.alert_rules — thresholds an operator sets, shipped EMPTY
-- =========================================================================================
--
-- This table is created with no rows, and that is the most important decision in the file.
-- Soil-moisture and temperature thresholds that "should" be seeded are universal agronomic
-- numbers, and a universal number applied to one farmer's black cotton soil is a wrong number
-- presented as a measurement of their field. The module therefore alerts on nothing until an
-- operator configures a threshold for a named scope, and says so on screen. Hardware-state
-- thresholds (battery volts, minutes before a silent node counts as offline) are seeded the same
-- way — by the operator, per deployment — because a battery window depends on the cell chemistry
-- and the solar arrangement of the actual node, which this database does not know.
--
-- Scope is DERIVED from which target column is filled, so there is no `scope` string that can
-- disagree with the ids:
--   both NULL            -> platform-wide rule
--   cooperative_id only  -> every site and node in that cooperative
--   field_site_id only   -> that one field
-- `field_sites` already carries `cooperative_id`, so a field-scoped rule does not need both.

create table if not exists field.alert_rules (
  rule_id          bigint generated always as identity primary key,
  name             text not null check (btrim(name) <> ''),
  cooperative_id   bigint references field.cooperatives (cooperative_id),
  field_site_id    bigint references field.field_sites (field_site_id),
  metric text not null
    check (metric in ('soil_moisture', 'ambient_temp', 'humidity', 'battery_voltage', 'offline', 'reading_change')),
  comparator text not null check (comparator in ('lt', 'gt')),
  threshold_value numeric(8, 3) not null,
  threshold_units text not null,
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  status text not null default 'enabled' check (status in ('enabled', 'disabled')),
  record_added_at    timestamptz not null default now(),
  record_replaced_at timestamptz not null default now(),
  constraint alert_rule_targets_one_scope check (cooperative_id is null or field_site_id is null),
  -- A threshold always carries the unit it is in, and the unit has to match the quantity.
  -- Without this, a `soil_moisture lt 42` rule could be filed under '°C' by whoever typed it.
  constraint alert_rule_units_match_metric check (
    (metric in ('soil_moisture', 'humidity', 'reading_change') and threshold_units = '%')
    or (metric = 'ambient_temp'                               and threshold_units = '°C')
    or (metric = 'battery_voltage'                            and threshold_units = 'V')
    or (metric = 'offline'                                    and threshold_units = 'minutes')
  ),
  constraint alert_rule_threshold_is_finite_number check (threshold_value between -100000 and 100000),
  constraint alert_rule_offline_is_a_wait check (metric <> 'offline' or comparator = 'gt'),
  constraint alert_rule_name_is_meaningful check (char_length(btrim(name)) between 3 and 120)
);

comment on table field.alert_rules is
  'Operator-configured alert thresholds, scoped platform-wide, per cooperative, or per field. Deliberately empty at creation: no universal agronomic threshold is seeded, because a threshold that ignores crop and soil is a guess about somebody''s field.';
comment on column field.alert_rules.metric is
  'reading_change = the size of the jump between two consecutive readings of one quantity, in percent of the previous value. It flags a suspect sensor as surely as a wrong absolute value does, and it is a comparison the platform performs, not something a device measured.';
comment on column field.alert_rules.threshold_units is
  'Stored with the value it belongs to. A rule without a unit is a number waiting to be misread, which is the mistake this whole schema exists to prevent.';
comment on column field.alert_rules.status is
  'disabled = keep the rule and its history, stop evaluating it. Deleting a rule would erase the explanation of alerts already raised, so rules are retired rather than removed.';

create unique index if not exists alert_rule_one_per_metric_and_target_uid
  on field.alert_rules (coalesce(cooperative_id, 0), coalesce(field_site_id, 0), metric);

drop trigger if exists alert_rules_touch on field.alert_rules;
create trigger alert_rules_touch
  before update on field.alert_rules
  for each row execute function data.touch_replaced_at();

-- =========================================================================================
-- 5. field.device_alerts — a condition, not a notification
-- =========================================================================================
--
-- One row per currently-held condition, with `last_observed_at` moving forward each time the
-- condition re-confirms. That is what "avoid duplicate alerts continuously for the same
-- unresolved condition" means as a database fact: the partial unique index below permits at most
-- one open or acknowledged row per (node, type), so the evaluator cannot spam a farmer's
-- screen, and the counter-free design means a repeat never has to be deleted to stay quiet.

create table if not exists field.device_alerts (
  alert_id          bigint generated always as identity primary key,
  node_id           text not null references field.hardware_nodes (node_id),
  -- NULL when the condition came from this platform's own integrity check rather than a
  -- configured threshold — the case where the database refused a payload, which is a fault of
  -- the device and worth reporting even though no rule asked for it.
  alert_rule_id     bigint references field.alert_rules (rule_id),
  alert_type text not null
    check (alert_type in ('low_soil_moisture', 'high_temperature', 'low_battery',
                          'device_offline', 'abnormal_reading', 'sensor_failure')),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  first_raised_at   timestamptz not null default now(),
  last_observed_at  timestamptz not null default now(),
  resolved_at       timestamptz,
  -- The numbers behind the claim: the metric, the observed value, its unit, the threshold and
  -- the reading it came from. An alert that shows only its own sentence is not evidence.
  detail jsonb,
  record_added_at    timestamptz not null default now(),
  record_replaced_at timestamptz not null default now(),
  constraint device_alert_closed_only_with_timestamp
    check ((status in ('resolved', 'dismissed')) = (resolved_at is not null)),
  constraint device_alert_last_observation_not_before_first
    check (last_observed_at >= first_raised_at),
  constraint device_alert_resolution_not_before_first
    check (resolved_at is null or resolved_at >= first_raised_at),
  constraint device_alert_detail_is_an_object
    check (detail is null or jsonb_typeof(detail) = 'object')
);

comment on table field.device_alerts is
  'Conditions the platform has raised about a device or its readings. Automated threshold output only: no agronomic advice is stored here, and the UI keeps the two apart, because a low soil-moisture threshold is a statement about a configured number, not a recommendation to irrigate.';
comment on column field.device_alerts.alert_type is
  'A stable rendering key, never a sentence. Titles come from the locale dictionaries in five languages; prose in a table cannot be translated and would freeze English into the interface.';
comment on column field.device_alerts.last_observed_at is
  'Advanced every time the condition re-confirms. This is why there is no alert count: repeats update this column, and the partial unique index below is what stops a second row existing.';
comment on column field.device_alerts.status is
  'acknowledged = a human has seen it, the condition still holds. Only open or acknowledged rows block a duplicate of the same type for the same node.';

create unique index if not exists device_alert_one_open_per_node_and_type_uid
  on field.device_alerts (node_id, alert_type)
  where status in ('open', 'acknowledged');
create index if not exists device_alert_node_time_idx on field.device_alerts (node_id, first_raised_at desc);
create index if not exists device_alert_unresolved_idx
  on field.device_alerts (first_raised_at desc)
  where status in ('open', 'acknowledged');

drop trigger if exists device_alerts_touch on field.device_alerts;
create trigger device_alerts_touch
  before update on field.device_alerts
  for each row execute function data.touch_replaced_at();

-- =========================================================================================
-- 6. Row level security — same posture as file 0001, same reasons
-- =========================================================================================
--
-- Enabled and forced with zero policies, both API roles revoked. No cooperative-scoped SELECT
-- policies exist because no authenticated subject exists to scope them against; see the note in
-- 20261105000100 section 7. When Supabase Auth and an `app.profiles` table arrive, the policies
-- belong in a new numbered file, never in an edit of this one.

alter table field.sensor_logs  enable row level security;
alter table field.alert_rules  enable row level security;
alter table field.device_alerts enable row level security;

alter table field.sensor_logs  force row level security;
alter table field.alert_rules  force row level security;
alter table field.device_alerts force row level security;

revoke all on field.sensor_logs   from anon, authenticated;
revoke all on field.alert_rules   from anon, authenticated;
revoke all on field.device_alerts from anon, authenticated;

comment on table field.sensor_logs is
  'RLS enabled and forced with no policies: readable only by the table owner or a bypassrls role. No anon/authenticated access. Writes arrive only through the server-side ingestion endpoint.';
comment on table field.alert_rules is
  'RLS enabled and forced with no policies: readable only by the table owner or a bypassrls role. No anon/authenticated access.';
comment on table field.device_alerts is
  'RLS enabled and forced with no policies: readable only by the table owner or a bypassrls role. No anon/authenticated access.';
