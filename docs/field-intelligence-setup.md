# Field Intelligence — device setup

How to connect a real sensor node to IRSHAYE: which variables the deployment needs, which
migrations to apply, in what order, how a device credential is issued, and what is verified versus
what is not.

Read the status box first. It is the difference between "the code is written" and "the platform is
collecting data", and this module must never be described as the second until a device has actually
submitted authenticated readings that the application then retrieved and displayed.

## Status of this feature

| step | state | evidence |
| --- | --- | --- |
| Migration files written | **done** | `supabase/migrations/20261105000100`, `20261105000200`, `20261105000300`, `20261106000100`, `20261106000200` |
| Migrations executed against a real PostgreSQL | **done, in a throwaway in-process server** | 82/82 (schema `field`) + 60/60 (schema `app`), see "Re-running the SQL harness" below. No project database was touched. |
| Migrations applied to a Supabase project | **not done — no project is connected** | `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are unset locally and on Vercel |
| Ingestion API reachable and answering | **done** | `npm run check:field` → 45/45 against a local dev server |
| Ingestion API storing a reading end to end | **not done** | requires the two variables above plus the applied migrations |
| Device-management API reachable, and denying every caller without a confirmed session | **done** | `npm run check:management` → 49/49 against a local dev server |
| Device-management API authorizing a real member of a real cooperative | **not done** | requires a project with Auth, two cooperatives and two users; the decisions are graded offline by `npm run test:management` (190/190), the wire path is not |
| Dashboard, map, alerts reading these tables | **not built** | Phases 5-6 |
| A physical ESP32 submitting readings | **never attempted** | no hardware was connected, so no claim of live monitoring is made anywhere in this module |

Until the row "Ingestion API storing a reading end to end" turns green, `/dashboard/field-intelligence`
must show a setup state. It must not show numbers.

## What exists in code

| file | role |
| --- | --- |
| `lib/field/types.ts` | the vocabulary: node/credential row shapes, the `IngestErrorCode` union |
| `lib/field/credentials.ts` | token generation, SHA-256 hashing, constant-time verification, lifecycle. Server-only (`node:crypto`) |
| `lib/field/ingest.ts` | the request-body contract: content type, byte ceiling, ranges, timestamps, canonical digest, credential stripping |
| `lib/field/authorize.ts` | the decision table — node status, credential lifecycle, digest match — and the code→HTTP-status map |
| `lib/field/rateLimit.ts` | per-device budget. **Process-local**, explicitly not a shared guarantee |
| `lib/field/deviceService.ts` | the only path into schema `field`, and the only place the service-role key is used |
| `app/api/v1/hardware/logs/route.ts` | `POST` ingest, `GET` self-descriptor |
| `lib/field/registration.ts` | the management request contract: registration fields, status changes, revocation, page bounds, path-segment shape |
| `lib/field/access.ts` | the capability table and the access decision — pure, no I/O, which is why tenant isolation is testable without a database |
| `lib/field/audit.ts` | builds an audit entry from a closed key allow-list; the reason a route cannot hand the trail a request body |
| `lib/field/managementService.ts` | membership resolution, site lookup, device listing/registration, scope queries — all server-side, all service-role |
| `lib/field/managementApi.ts` | the shared gate: session first, database second, memberships third, decision fourth. `openManagement` returns a context that cannot exist unless all four passed |
| `lib/serverSupabase.ts` | `verifyCaller` — asks Supabase Auth who a bearer token belongs to. 401 when not confirmed, 503 when Auth could not be asked |
| `app/api/hardware/devices/route.ts` | `GET` list in scope, `POST` register under a site |
| `app/api/hardware/devices/[nodeId]/route.ts` | `GET` one device + capabilities, `PATCH` status |
| `app/api/hardware/devices/[nodeId]/credentials/route.ts` | `POST` first credential |
| `app/api/hardware/devices/[nodeId]/credentials/rotate/route.ts` | `POST` replace it |
| `app/api/hardware/devices/[nodeId]/credentials/revoke/route.ts` | `POST` end one by id |

## Environment variables

Names only. Never paste a value into the chat, into a commit, into an issue, or into a screenshot.

| variable | scope | read by | needed for |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public, inlined into the browser bundle | `lib/supabaseAdmin.ts`, `lib/supabaseClient.ts` | everything database-side |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** — must not be `NEXT_PUBLIC` | `lib/supabaseAdmin.ts` | device lookups, reading inserts, provisioning, rotation |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | `lib/supabaseClient.ts` | the browser client; not used by ingestion, which is server-side |
| `SYNC_SECRET` | server only | `app/api/data/sync/route.ts` | the publisher sync, unrelated to sensors |

Two rules the code enforces rather than assumes:

- The service-role key is read from a variable with no `NEXT_PUBLIC_` prefix, so Next.js cannot
  inline it into a client bundle, and `lib/supabaseAdmin.ts` refuses to run where `window` exists.
- Missing variables are reported as `database_not_configured` with the **names** in the message.
  No code path prints a value.

Local file (never committed):

```ini
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

Vercel: project → Settings → Environment Variables. `NEXT_PUBLIC_*` must be set for Production,
Preview and Development; the service-role key for Production and Preview only.

What each state does:

| state | ingestion answers | module page shows |
| --- | --- | --- |
| no `NEXT_PUBLIC_SUPABASE_URL` | `503 database_not_configured` | setup instructions, no figures |
| URL but no service-role key | `503 database_not_configured` (names the missing variable) | setup instructions, no figures |
| both set, migrations not applied | `503 database_unavailable`, and the detail stays in the server log | error state with the reason |
| both set, migrations applied, node provisioned | `201` | live readings |

## Database setup

The `field` files assume the `data` pack is already applied, because
`field.field_sites.location_key` is a foreign key to `data.location` (created by
`20261026000200`) and the audit trigger `data.touch_replaced_at()` lives in schema `data` (created
by `20261026000100`). The two `app` files assume the `field` pack, because a membership references
`field.cooperatives`. Apply in this order:

```
20261026000100_data_schema_preparation.sql
20261026000200_data_market_observations.sql
20261026000300_data_weather_and_agroclimate.sql
20261026000400_data_exchange_and_indicators.sql
20261026000500_data_satellite_observations.sql
20261026000600_data_sync_bookkeeping.sql
20261030000100_data_geospatial_reference.sql
20261105000100_field_intelligence_registry.sql      -- cooperatives, field_sites, hardware_nodes, credentials
20261105000200_field_intelligence_observations.sql  -- sensor_logs, alert_rules, device_alerts
20261105000300_field_intelligence_access.sql        -- grants to service_role, and nothing else
20261106000100_app_cooperative_membership.sql      -- schema app: who may manage which cooperative
20261106000200_app_management_audit.sql            -- the append-only record of management actions
```

Any of these work, from the repository root:

```bash
npx supabase link --project-ref <ref> && npx supabase db push
# or
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261105000100_field_intelligence_registry.sql
```

Or paste each file into the Supabase SQL editor, one at a time, in the order above. Each file is a
single transaction, so a failure part-way leaves the previous files applied and the failed one not
applied at all — there is no half-created table to clean up.

`20261106000100` behaves differently on a real project than in the harness, and says so out loud:
where `auth.users` exists it adds `cooperative_member_user_is_an_auth_user` (a foreign key with
`on delete cascade`, so a deleted account cannot leave a live grant behind) and raises
`NOTICE: ADDED: …`; where it does not, it raises `NOTICE: SKIP: …` and the membership table ships
without that reference. Check which notice your project printed (query 6 below) — a membership table
with no link to Auth is a table of unverifiable claims.

Migrations are run by the operator, never by an agent working in this repository (AGENTS.md rule
8). Applying them is the point of no return for the data model, and it changes a shared system.

### Verify what landed

```sql
-- 1. the six tables exist in schema field
select table_name from information_schema.tables
 where table_schema = 'field' order by table_name;
-- expect: alert_rules, cooperatives, device_alerts, field_sites, hardware_node_credentials,
--         hardware_nodes, sensor_logs

-- 2. RLS is enabled AND forced everywhere, and no policies exist yet
select relname, relrowsecurity, relforcerowsecurity,
       (select count(*) from pg_policy p where p.relid = c.oid) as policies
  from pg_class c where c.relnamespace = 'field'::regnamespace and c.relkind = 'r' order by relname;

-- 3. only the service role can reach them
select grantee, table_name, privilege_type
  from information_schema.role_table_grants where table_schema = 'field' order by table_name, grantee;
-- expect: rows for service_role only. anon/authenticated must not appear.

-- 4. the security-definer function is granted to nobody else
select proname, pg_get_function_arguments(oid) from pg_proc
 where pronamespace = 'field'::regnamespace;

-- 5. the two app tables, same posture, and no policies
select relname, relrowsecurity, relforcerowsecurity,
       (select count(*) from pg_policy p where p.relid = c.oid) as policies
  from pg_class c where c.relnamespace = 'app'::regnamespace and c.relkind = 'r' order by relname;
-- expect: cooperative_members t/t/0, management_audit t/t/0

select grantee, table_name, privilege_type
  from information_schema.role_table_grants where table_schema = 'app' order by 2, 1;
-- expect: service_role SELECT on both, service_role INSERT on management_audit, nothing else.
-- A membership INSERT grant here would mean an endpoint can grant access; there is none in this phase.

-- 6. did the auth.users reference land, or did the guard report SKIP?
select conname, confdeltype from pg_constraint
 where conrelid = 'app.cooperative_members'::regclass and contype = 'f';
-- expect on a Supabase project: cooperative_member_user_is_an_auth_user with confdeltype 'c'
-- (on delete cascade), plus cooperative_members_cooperative_id_fkey.

-- 7. the trail is append-only even for the bypassrls role
select tgname from pg_trigger where tgrelid = 'app.management_audit'::regclass and not tgisinternal;
-- expect: management_audit_no_mutation. Test it:
--   update app.management_audit set outcome = 'success' where true;   → must raise "append-only"
```

If query 2 shows a policy, or query 3 shows `anon`, something else created it — the intended
posture is deny-by-default with zero policies (see the rationale in section 6 of
`20261105000100_field_intelligence_registry.sql`: with no Supabase Auth configured there is no
authenticated subject for a policy to filter on, so a "cooperative-scoped policy" would be either
a hole or a dead table). When Auth arrives, its policies belong in a **new** numbered migration,
not an edit of these files. The same reasoning still applies to schema `app`: the management routes
resolve identity with Auth and then read these tables as `service_role`, scoping their own queries by
the cooperative ids they got back — so the guarantee is split between the database (the SHAPE of
access: closed role vocabulary, one current row per subject and cooperative, an id that must be a real
Auth subject) and `lib/field/access.ts` (the SCOPE, which is where cross-cooperative refusal lives).

### Seeding a cooperative, a site and the first manager

There is no membership-management endpoint in this phase, deliberately: the code that reads
`app.cooperative_members` is granted no `INSERT`, so a first grant of access is a reviewed SQL
operation by an operator rather than something an API call can do. Sign the person in through the
browser first (Supabase Auth must have a user row), then:

```sql
-- 1. the organisation, and a site inside it
insert into field.cooperatives (name, region, contact_email)
values ('Bahir Dar Smallholders', 'Amhara', 'coord@example.et');

insert into field.field_sites (cooperative_id, name, area_hectares)
values (1, 'Plot 3', 2.4);

-- 2. the person's Auth uid — read it, do not type it from memory
select id, email from auth.users where email = 'coord@example.et';

-- 3. the membership. role is 'manager' or 'viewer'; nothing else exists.
--    added_by is NULL only for this bootstrap row, and that is why the column is nullable.
insert into app.cooperative_members (user_id, cooperative_id, role)
values ('<the uuid from step 2>', 1, 'manager');

-- 4. confirm what this caller can now do, before handing them the dashboard
select cooperative_id, role from app.cooperative_members
 where user_id = '<the uuid>' and removed_at is null;
```

Revoking access is a stamp, not a delete — the history of who could act has to survive the person who
acted. Both statements below are ordinary UPDATEs, which is why the table carries
`record_replaced_at` and its trigger; a membership row that could not be updated could not be
revoked:

```sql
update app.cooperative_members
   set removed_at = now(), removed_by = '<the uid of whoever is doing the removing>'
 where user_id = '<the uuid>' and cooperative_id = 1 and removed_at is null;
```

A `role` change is the same shape (`set role = 'viewer'`) and is recorded in `record_replaced_at`,
which is the answer to "when did this person stop being a manager" if the stamp itself was reused.

### Reading the trail

The queries an operator actually runs, and the reason the indexes exist:

```sql
-- what happened to this device, newest first
select occurred_at, actor_user_id, actor_role, action, outcome, reason_code, detail
  from app.management_audit where node_id = 'ESP32_FIELD_01' order by occurred_at desc limit 50;

-- everything that was refused, and why — the "someone tried" query
select occurred_at, actor_user_id, action, reason_code, cooperative_id, node_id
  from app.management_audit where outcome <> 'success' order by occurred_at desc limit 50;

-- one person's whole record
select occurred_at, action, outcome, node_id from app.management_audit
 where actor_user_id = '<the uuid>' order by occurred_at desc;
```

`detail` is built by `lib/field/audit.ts` from a closed allow-list of identifier keys, with strings
truncated to 120 characters, and the table's CHECK constraints refuse `secret_token`, `token`,
`token_hash` and any 64-hex digest inside it. What you will not find in the trail is the plaintext of
anything. One limit is structural and worth stating: a request refused **before** the session was
confirmed has no actor id to record, so anonymous probing appears in the access log, not here.

## Device credentials

A device secret is 32 random bytes, base64url-encoded (43 characters). The database stores only its
SHA-256 digest as 64 lowercase hex characters, and `hardware_credential_hash_is_sha256_hex` refuses
anything else — so a plaintext write fails rather than leaking. The secret is shown once, at
issuance, and is not recoverable afterwards: rotation issues a new one, it does not reveal the old.

Why SHA-256 rather than bcrypt: the secret comes from a CSPRNG, not from a human, so there is no
guessable space for a slow KDF to defend; the hash exists to make a stolen row useless and to keep
an endpoint that legitimately runs several times a minute cheap.

### Provisioning through the API (the normal path)

With a session, a membership, and the two Supabase variables set, the sequence an operator follows is
four calls. The secret is generated inside the server process, only its digest is sent to the
database, and it is printed in exactly one response — nothing in this project will show it again.

```bash
H=https://<host>; A='authorization: Bearer <the signed-in user access token>'

# 1. register the unit under a field site THIS COOPERATIVE owns.
#    No cooperative_id in the body: the owner comes from the site the server looked up.
curl -sS -X POST $H/api/hardware/devices -H "$A" -H 'content-type: application/json' \
  -d '{"node_id":"ESP32_FIELD_01","name":"Demonstration node","field_site_id":1,"hardware_model":"ESP32-WROOM-32"}'

# 2. issue the first credential. The response carries device_secret ONCE.
curl -sS -X POST $H/api/hardware/devices/ESP32_FIELD_01/credentials -H "$A"

# 3. write that value into the firmware as secret_token, then mark the node active.
curl -sS -X PATCH $H/api/hardware/devices/ESP32_FIELD_01 -H "$A" -H 'content-type: application/json' \
  -d '{"status":"active"}'

# 4. the device now reports to POST /api/v1/hardware/logs by itself.
```

A `viewer` is refused every step after the first read; a manager of a *different* cooperative is
refused with `404 unknown_site`, which does not confirm that the site exists.

Rotation replaces the secret and the old one stops working immediately — there is no grace period,
because a rotation that leaves the previous digest valid cannot be verified as done. Reflash the
device before its next report or it will be refused `401 invalid_credentials`:

```bash
curl -sS -X POST $H/api/hardware/devices/ESP32_FIELD_01/credentials/rotate -H "$A"
curl -sS -X POST $H/api/hardware/devices/ESP32_FIELD_01/credentials/revoke -H "$A" \
  -H 'content-type: application/json' -d '{"credential_id":7}'
# revoking the node's only current credential needs "force": true — that is the acknowledgement
# that the device goes dark until a new credential is issued
```

### Provisioning by SQL (bootstrap, or a device with no session yet)

This is still the way to provision when the management API is not deployed. Generate a secret and
hash it in the same shell, so the value never lands in a file. `read -s` keeps it out of the
history:

```bash
read -s -p "new device secret (shown once, keep it out of the chat): " S; echo
# print ONLY the hash; the secret stays in $S until you close the shell
node -e 'const c=require("crypto");process.stdout.write(c.createHash("sha256").update(process.env.S,"utf8").digest("hex"))' 
```

Then, with the service role (SQL editor or `psql`):

```sql
-- one-time registration of the physical unit
insert into field.hardware_nodes (node_id, name, cooperative_id, field_site_id, status, hardware_model)
values ('ESP32_FIELD_01', 'Demonstration node', 1, 1, 'active', 'ESP32-WROOM-32');

-- its credential: hash only
insert into field.hardware_node_credentials (node_id, token_hash)
values ('ESP32_FIELD_01', '<the 64 hex characters printed above>');

-- optional, for a shared or loaned device
update field.hardware_node_credentials set expires_at = now() + interval '180 days'
 where node_id = 'ESP32_FIELD_01' and revoked_at is null;
```

Copy the secret into the device configuration now. It cannot be read back out of IRSHAYE later.

### Rotation and revocation by SQL

```sql
select * from field.rotate_device_credential('ESP32_FIELD_01', '<new hash>');
-- one transaction: the current row is superseded and the new one issued, so a device can never be
-- left holding a secret the database does not recognise. Returns the new and superseded ids.

update field.hardware_node_credentials set revoked_at = now()
 where node_id = 'ESP32_FIELD_01' and revoked_at is null;   -- do this only with a replacement issued
```

`hardware_credential_single_current_uid` (a partial unique index) makes "the device's current
credential" exactly one row, at the database level. `service_role` is the only role granted
`execute` on the rotation function, and the API's rotate route is the only caller of it.

## Submitting a reading

```bash
curl -sS -X POST https://<host>/api/v1/hardware/logs \
  -H 'content-type: application/json' \
  -d '{"node_id":"ESP32_FIELD_01","secret_token":"<the secret>","soil_moisture":38.2,"ambient_temp":24.7,"humidity":61,"battery_voltage":12.6,"measured_at":"2026-11-06T07:45:00Z"}'
```

`GET /api/v1/hardware/logs` returns the same contract as a document: the field names, the ranges,
the byte ceiling, the drift allowance, the rate-limit figures, and whether this deployment has a
database. `docs/field-intelligence-iot-setup.md` (Phase 8) will add the ESP32 sketch.

Rules, and why each one is there:

- **At least one measurement.** A row of nothing is not a reading, and charting one produces an
  empty line that gets called data.
- **Ranges**: soil moisture 0-100 %, ambient temperature −40…60 °C, humidity 0-100 %, battery
  0-30 V. A missing sensor is omitted or sent as `null` — never `0`, which would be plotted as a
  real value.
- **JSON numbers only.** `"soil_moisture": "38.2"` is refused. A firmware that stringifies floats
  usually also mis-scales them, and coercion would hide that in plausible-looking rows.
- **Timestamps.** `measured_at` is optional; without it the server stamps the receipt time and
  records `time_source = 'server'`, so the UI can say the measurement time is ours rather than the
  device's. A device clock up to 15 minutes ahead is tolerated (the same 15 minutes the table's
  CHECK allows — change one, change both); further ahead is refused, because a future-dated reading
  sorts after every real one. Backlog up to 72 hours old is accepted, which is what a node in deep
  sleep needs; older than that is refused rather than charted as though it had just arrived.
- **Replay.** `sensor_logs` has a unique index on `(node_id, measured_at, payload_hash)`. A device
  that retried after a timeout it did not actually suffer gets `409 duplicate_reading` and stops
  resending.
- **No secret in the stored copy.** `raw_payload` is the request body with `secret_token` removed at
  every depth, plus any string equal to the submitted secret. The table's
  `sensor_log_raw_carries_no_credential` CHECK is the backstop for the top-level key.
- **Statuses.**

| HTTP | code | when |
| --- | --- | --- |
| 201 | — | stored; echoes `log_id`, `measured_at`, `received_at`, `time_source`, the fields that landed |
| 400 | `invalid_content_type`, `malformed_json`, `invalid_payload`, `timestamp_out_of_window` | the body is not what was asked for |
| 401 | `invalid_credentials`, `not_provisioned` | the secret is wrong, or the node has no credential |
| 403 | `credential_expired`, `device_disabled` | the secret is known and the submission is refused anyway |
| 404 | `unknown_node` | no device is registered under that `node_id` |
| 409 | `duplicate_reading` | already stored; do not resend |
| 413 | `payload_too_large` | over 8 KiB |
| 429 | `rate_limited` | over 20 submissions per 60 s for that device, in that server process |
| 500 | `internal_error` | an unexpected fault |
| 503 | `database_not_configured`, `database_unavailable` | this deployment cannot check anything, or storage failed |

Every answer carries `cache-control: no-store`. Nothing is ever echoed with the secret, its digest,
a credential id, a stack trace, or a database message.

## Tests

```bash
npm run test:field       # 179 assertions: tokens, validation, ranges, the decision order,
                         # the status table, stripping, the throttle, plus cross-checks that the
                         # validator and the migration agree on drift, hex shape and node-id shape
npm run check:field      # 45 assertions over HTTP against `npm run dev`
npm run test:management  # 190 assertions: capabilities, tenant isolation, refusal non-disclosure,
                         # the registration/status/revocation contracts, audit sanitising, and
                         # cross-checks that both app migrations agree with the code lists
npm run check:management # 49 assertions over HTTP: every management route denies a stranger
npm run check:data       # the open-data routes, unchanged — the IoT module must not disturb them
npm run test:market      # 133 assertions, unchanged
```

The two `test:*` commands need no database and no network; that is deliberate, because until a
Supabase project is connected they are the only way the ingestion and authorization rules can be
graded at all. The two `check:*` commands send only requests that must be refused before any insert
or any privileged write, so running them against a live deployment writes nothing — which is also why
they can only prove the *denial* half. The half that needs a real cooperative, a real member and a
real device is listed under "What is still not verified" below, and no local run of any of these
commands changes that.

### Re-running the SQL harness

The migration pack was validated by applying it to an in-process PostgreSQL (PGlite, WASM) in a
scratch directory **outside the repository**, creating the `anon`, `authenticated` and `service_role`
roles, and then asserting that each bad row is refused by the constraint named for it — including RLS
denials for both API roles, the replay index, the single-current-credential and
single-current-membership indexes, both append-only triggers, the rotation function, and the
credential-shape refusals on `app.management_audit.detail`. Two runs, two schemas:

| run | files | result |
| --- | --- | --- |
| `check.mjs` | the seven `data` + `field` files the ingestion path needs | 82/82 |
| `app-check.mjs` | all twelve, grading schema `app` (membership, audit, grants, trigger bits) | 60/60 |

It is scratch tooling rather than repo tooling on purpose: it must not become a way of touching a
real database. To recreate it, in an empty directory of your own:

```bash
npm init -y && npm install @electric-sql/pglite
```

then a `check.mjs` that `readFileSync`s each migration in order into `db.exec()`, `create role`s the
three Supabase roles, and probes each constraint with a value that must be rejected. Note the
details that cost time to learn: multi-statement text must go through `db.exec()` rather than
`db.query()`; `information_schema.role_table_grants` has no `acl` column and does list the **owner's**
privileges, so a grant assertion must name the roles it means; a `::regclass` cast of a missing
relation raises instead of returning null; identity sequences consume values even for inserts that
fail, so foreign-key fixtures must use subqueries rather than hard-coded ids; `numeric` does store
NaN, which only the range CHECK rejects; a `CHECK` on a column only fires once that column's
`NOT NULL` is satisfied, so a probe that omits a required column proves nothing; `pg_trigger.tgtype`
is a bit mask (row 1, insert 4, delete 8, update 16); and a trigger function that assigns a column
the table does not have is a **runtime** abort on the first UPDATE, not a create-time error — which is
how `app.cooperative_members` shipped a `data.touch_replaced_at()` trigger before it had
`record_replaced_at`, and why the harness runs an UPDATE rather than only an INSERT.

## What is still not verified

Nothing below can be closed by a local run, and none of it is claimed anywhere in the module.

- **Cross-tenant isolation over the wire.** `npm run test:management` grades the decision for a
  manager of Cooperative A acting on a Cooperative B device; proving the HTTP path needs a project
  with two cooperatives, two users and two memberships seeded.
- **One-time disclosure of a real secret**, and that no later read of the same device ever returns it.
- **That a revoked or rotated credential stops being accepted** by `POST /api/v1/hardware/logs`, and
  that a `disabled` node is refused `403 device_disabled` — both need the migrations applied.
- **That `app.management_audit` holds a row** for a real registration, provision, rotation and
  revocation. Locally the database is unconfigured, so the trail writes nothing anywhere.
- **A physical device.** No ESP32 has been connected, so this module does not claim live IoT
  monitoring. The ingestion contract is documented for a device that has not been pointed at it yet.

## Limitations that are part of the design

- **The rate limiter is process-local.** On serverless each instance keeps its own counters, so the
  real bound is the database: the replay index refuses duplicates and the CHECK constraints refuse
  implausible values regardless of frequency. A shared limit needs a store every instance agrees on
  (Postgres counters or edge KV) and would be an explicit addition, not an assumption.
- **RLS has no policies.** Deny-by-default with service-role grants, in all three schemas. Cooperative
  scoping currently happens in the query layer, where the cooperative id is an explicit argument,
  because there is no authenticated subject for a policy to filter on yet. The management routes do
  have an authenticated subject — but they read `app.cooperative_members` as `service_role` and scope
  themselves, so adding policies would not change what any browser can reach. See section 4 of
  `20261106000100` for why that is a deliberate layering rather than an omission.
- **There is no membership endpoint.** Granting, changing and revoking access is reviewed SQL run by
  an operator (`docs/field-intelligence-setup.md`, "Seeding a cooperative, a site and the first
  manager"). `service_role` holds no `INSERT` or `UPDATE` on `app.cooperative_members`, so no code
  path in this repository can hand itself a role. When that endpoint is built it must arrive with its
  own audit action and its own tests, in a new migration that changes the grant line.
- **The management surface has no rate limiter of its own.** It is bounded by the Auth server (every
  request must be confirmed there first) and by `no-store`, not by a counter in this process. Adding
  one would repeat the mistake the ingestion limiter documents: a per-process budget is not a
  platform guarantee, and claiming it as one would be a lie about serverless.
- **A refusal before the session is confirmed cannot be audited.** `actor_user_id` is `NOT NULL` by
  design — an anonymous row in the trail would be an entry nobody can attribute. Probing attempts are
  in the access log; the audit table records what identified people did.
- **`node_id` is not a secret.** It is printed on the device and appears in every provisioning
  sheet, so refusals name it (`unknown_node` vs `not_provisioned` vs `credential_expired`) to make
  field installation possible. `secret_token` is the only secret.
- **Ingestion does not degrade the rest of the app.** The route touches no publisher, no cache, and
  no table outside schema `field`; the queries it runs are indexed lookups by natural key.
- **Nothing is simulated.** No code path generates a reading, a device, or a metric. With no
  database the module reports that; it does not fill the gap with placeholders.
- **Partitioning is not enabled.** `sensor_logs` is a plain table with a replay index designed to be
  partition-compatible (`(node_id, measured_at, payload_hash)`), so range partitioning by
  `measured_at` can be added later in a new migration if volume ever justifies it. TimescaleDB is
  not used and not required.
