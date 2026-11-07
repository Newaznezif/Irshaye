-- =========================================================================================
-- 20261105000300 — Field Intelligence: the service role's privileges on schema `field`
-- =========================================================================================
--
-- STATUS: PROPOSED, NOT APPLIED. Companion to 20261105000100 and 000200; run after both.
--
-- The pattern is the one `20261026000600_data_sync_bookkeeping.sql` establishes for schema
-- `data`: RLS is enabled, forced, and carries zero policies, so the only role that can reach
-- these rows at all is one that either owns the table or holds BYPASSRLS. In this project that
-- is `service_role`, used exclusively from the server through lib/supabaseAdmin.ts, which reads
-- the key from a NON-`NEXT_PUBLIC` variable so Next.js cannot inline it into a browser bundle.
--
-- Without the statements below the module does nothing and reports nothing: `usage` on the
-- schema is checked before any table, so every request through PostgREST would fail with 42501
-- at the first hop, and each table keys on `bigint generated always as identity`, so an insert
-- takes its next value from the owned sequence and would fail on the SEQUENCE rather than the
-- table if `usage` were missing there.
--
-- Nothing here widens access for `anon` or `authenticated`. Both roles are revoked in the files
-- that create each table, and no grant in this pack names them.

-- =========================================================================================
-- 1. The schema itself
-- =========================================================================================
--
-- lib/field/* opens these tables through PostgREST as `service_role`, which first needs USAGE
-- on the schema. `owner` rights do not substitute for this in a hosted Supabase project, where
-- the API role is not the owner.

grant usage on schema field to service_role;

-- =========================================================================================
-- 2. Tables, listed one by one rather than mass-granted
-- =========================================================================================
--
-- Why not `grant … on all tables in schema field to service_role;`, which is what the `data`
-- pack does: that form applies to every table that exists when the statement runs, including
-- any table a later, unrelated file adds to `field` before this pack is re-run. In `data` the
-- mass grant is safe because the pack creates all of its own tables and nothing else; here the
-- module is new and its table set will grow (a device-event archive, a firmware registry). A
-- privilege that a future file inherits silently is a privilege nobody reviewed, so each table
-- is named with the code path that needs it.

-- app/api/v1/hardware/logs/route.ts inserts readings and stamps last_seen_at on the node that
-- authenticated, and reads the node's status plus its current credential hash to verify it.
grant select, insert, update on field.hardware_nodes to service_role;

-- The same route: reads the node's one current credential, inserts a credential at
-- provisioning, and stamps last_used_at on each accepted reading. It never reads token_hash
-- into a response; the value is compared in process and discarded.
grant select, insert, update on field.hardware_node_credentials to service_role;

-- The ingestion route inserts accepted readings. `select` is for the bounded history and
-- newest-per-node reads the dashboard and the reading_change rule need; `update` exists only
-- so record_replaced_at cannot be silently unreachable — the mutation trigger in file 0002
-- refuses UPDATE on this table regardless of who asks. `delete` is retention pruning by an
-- operator, NOT something the application does: no code path in app/, lib/ or scripts/ issues
-- a DELETE against this table, and least-privilege review may reasonably drop it.
grant select, insert, update, delete on field.sensor_logs to service_role;

-- lib/field/deviceService.ts registers and edits devices, sites and cooperatives from the
-- Device Management section, and the Alerts section evaluates rules. Rules are read by the
-- evaluator and written only by an operator through the management routes.
grant select, insert, update, delete on field.cooperatives to service_role;
grant select, insert, update, delete on field.field_sites to service_role;
grant select, insert, update on field.alert_rules to service_role;

-- The evaluator reads the node's recent state and raises or closes conditions here.
-- `delete` is again operator cleanup of stale history, not application behaviour.
grant select, insert, update, delete on field.device_alerts to service_role;

-- =========================================================================================
-- 3. Identity sequences
-- =========================================================================================
--
-- Every table in `field` except hardware_nodes keys on `bigint generated always as identity`,
-- so an insert calls nextval() on the owned sequence. `usage` is what permits nextval;
-- `select` lets a diagnostic read last_value. Listed explicitly for the same reason as the
-- tables above.
--
-- Views need no grant here and cannot be given one this way: PostgreSQL has no
-- `ON ALL VIEWS` mass-privilege form, and this pack creates no views — the module's read paths
-- are ordinary bounded queries, not saved joins.

grant usage, select on sequence field.cooperatives_cooperative_id_seq,
                     field.field_sites_field_site_id_seq,
                     field.hardware_node_credentials_credential_id_seq,
                     field.sensor_logs_log_id_seq,
                     field.alert_rules_rule_id_seq,
                     field.device_alerts_alert_id_seq to service_role;

-- =========================================================================================
-- 4. Functions
-- =========================================================================================
--
-- `field.rotate_device_credential(text, text)` revokes the current credential and issues its
-- replacement in one transaction (file 0001 section 6). It is SECURITY INVOKER, so this grant is
-- the whole of its access: a role that cannot INSERT or UPDATE
-- `field.hardware_node_credentials` cannot rotate through it either. That is why the grant names
-- `service_role` alone, and why 0001_revokes from `public`, `anon` and `authenticated` —
-- Postgres grants EXECUTE to PUBLIC by default for functions, and a device credential that any
-- database role can rotate is not a credential.

grant execute on function field.rotate_device_credential(text, text) to service_role;

-- =========================================================================================
-- 5. What this pack does NOT do
-- =========================================================================================
--
-- It does not grant anything to `anon` or `authenticated`, does not create a policy, does not
-- give any role BYPASSRLS, and does not touch schema `data`. A browser bundle that somehow
-- held this project's service-role key would still be unable to read a device credential
-- through the API without the operator having configured PostgREST that way — and the anon key
-- is the one this project ships to clients, which is why the service-role key lives in a
-- variable with no NEXT_PUBLIC prefix at all.
