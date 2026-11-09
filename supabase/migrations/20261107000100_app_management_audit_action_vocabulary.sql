-- =========================================================================================
-- 20261107000100 — Management audit: the action vocabulary grows to cover alerts and credentials
-- =========================================================================================
--
-- STATUS: PROPOSED, NOT APPLIED. Companion to Phase 6A (sensor analytics and alert generation);
-- run after `20261106000200_app_management_audit.sql`, which creates the table this file changes.
--
-- What this is for. Phase 6A adds four audited actions to the management API: a dashboard read of
-- one alert's detail (`alert_view`), two manager transitions on a persisted alert
-- (`alert_acknowledge`, `alert_resolve`), and a manager-only listing of a device's credential
-- METADATA (`credential_list`). Every one of them writes a row to `app.management_audit` when it is
-- refused, and the `action` column in `20261106000200` is a CHECK that names exactly fourteen
-- values. Without this file the code is correct and the database rejects the record.
--
-- Why a new file and not an edit of `20261106000200`. The rule in `supabase/migrations/README.md` is
-- that a file which has run somewhere is never edited, and this pack has been executed — twice — in
-- the validation harness. Whether or not a hosted project holds these statements, a forward
-- migration is the only form that is correct in both worlds: a fresh database reaches the same end
-- state by applying the files in order, and a database that already ran `000200` gets the constraint
-- replaced rather than believing it never existed. Editing `000200` in place would fix the first and
-- silently fail the second.
--
-- What it changes the CHECK's NAME to, and why that matters. In `000200` the vocabulary is an inline
-- column constraint, so PostgreSQL invented `management_audit_action_check` for it — a name no file
-- states, which means a later change can only find it by digging through `pg_constraint`. This file
-- gives the constraint an explicit name (`management_audit_action_is_known`) so the next phase that
-- grows the vocabulary can drop it by naming it. That is the whole reason the statements below
-- replace the constraint instead of layering a second one on the column: two CHECKs on `action` would
-- mean the older, narrower one still refuses new actions while `pg_constraint` shows a file having
-- added the wider list.

-- =========================================================================================
-- 1. Replace the action CHECK
-- =========================================================================================
--
-- Two statements, one block and one ALTER, and the block does the finding.
--
-- The target is precise rather than name-based: a CHECK on exactly one column, that column being
-- `action`. That is the vocabulary constraint and nothing else on this table — `actor_role`,
-- `outcome` and `reason_code` are single-column too but on different columns, and
-- `management_audit_node_actions_name_a_node` reads `action` alongside `node_id`, so it has two keys
-- and is left alone. Selecting by shape rather than by name is what makes this correct against a
-- database where the constraint carries the auto-generated name, a hand-typed variant of it, or none
-- an operator renamed.
--
-- Dropping first, then adding, is also what makes the file re-runnable: on a second application the
-- block drops the named constraint this file created and the ALTER puts it back, so the end state is
-- the same and no `add constraint` raises 42710 for a duplicate name. PostgreSQL has no
-- `add constraint if not exists`, which is why idempotency lives in the drop rather than the add.

do $$
declare
  previous_action_check text;
  action_column         smallint;
begin
  -- Not `create table if not exists … then alter`: a missing table here is a wrong apply order, and
  -- the operator needs to read that sentence rather than a cascade of `undefined table` errors from
  -- the statements below.
  if to_regclass('app.management_audit') is null then
    raise exception
      '20261107000100 must run after 20261106000200: table app.management_audit does not exist in this database.';
  end if;

  select a.attnum
    into action_column
    from pg_attribute a
   where a.attrelid = 'app.management_audit'::regclass
     and a.attname  = 'action';

  if action_column is null then
    raise exception '20261107000100: app.management_audit has no column "action" — this file does not match the table it expected.';
  end if;

  for previous_action_check in
    select con.conname
      from pg_constraint con
     where con.conrelid = 'app.management_audit'::regclass
       and con.contype  = 'c'
       and array_length(con.conkey, 1) = 1
       and con.conkey[1] = action_column
     order by con.conname
  loop
    execute format('alter table app.management_audit drop constraint %I', previous_action_check);
    raise notice '20261107000100: dropped previous action CHECK (%)', previous_action_check;
  end loop;
end $$;

-- The vocabulary, in the order `lib/field/types.ts` declares it. The list is a strict superset of the
-- fourteen values in `000200`, so validation of existing rows cannot fail: no row this table has ever
-- accepted is refused by the replacement. Nothing about the column changes either — same type, same
-- `not null` from the original declaration, so no table rewrite and no lock on the history.
--
-- `scripts/test-management-unit.mjs` parses this list and compares it, in both directions and by
-- count, against `ManagementAction` in TypeScript. The assertion is what keeps "the migration extends
-- the vocabulary" from meaning "the migration extends part of it and the code finds out at runtime".
alter table app.management_audit
  add constraint management_audit_action_is_known check (
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
      'map_read',
      'alert_view',
      'alert_acknowledge',
      'alert_resolve',
      'credential_list'
    )
  );

comment on constraint management_audit_action_is_known on app.management_audit is
  'The closed action vocabulary of the management API: six device/credential writes, eight dashboard reads, and Phase 6A''s alert read, alert transitions and credential-metadata listing. Named explicitly so a later migration replaces it by name. The code side is ManagementAction in lib/field/types.ts; npm run test:management asserts the two lists are identical.';

-- The four Phase 6A actions are deliberately NOT added to
-- `management_audit_node_actions_name_a_node`, which still names its seven. An alert action begins
-- with an `alert_id` from a path segment, and the refusal `unknown_alert` is precisely the case where
-- no device is known — the alert may not exist, or may belong to another cooperative, and the trail
-- must record the reach without inventing the thing it reached for. Those rows carry `alert_id` in
-- `detail` instead, which is why the constraint's "if node_id is absent, say why" branch is the one
-- that fires. `credential_list` names a node when it has one, and is refused by `unknown_node` when
-- it does not, so it needs no exemption.

-- =========================================================================================
-- 2. What this file does NOT change, and does not need to
-- =========================================================================================
--
-- - `reason_code`. Its CHECK is a shape (`^[a-z][a-z0-9_]{0,48}$`), not a list, so the new refusal
--   code `unknown_alert` is already legal. Reason codes are bounded by the code that returns them;
--   enumerating them here would mean a migration per error message.
-- - Grants, RLS, indexes, the append-only trigger. `service_role` already holds `select, insert` and
--   the identity sequence, the table is still forced with zero policies, and `DDL` here fires no row
--   trigger — `management_audit_no_mutation` is `for each row` on UPDATE/DELETE and cannot be reached
--   by an ALTER TABLE.
-- - `field.device_alerts` and `field.alert_rules`. Phase 6A writes both, and
--   `20261105000300_field_intelligence_access.sql` already grants `service_role` the select, insert
--   and update it needs, including the partial unique index that keeps one open alert per device and
--   type. No new database object is required for alert generation; the evaluator's requirements are
--   all in the pack that created the tables.

-- =========================================================================================
-- 3. What happens if this file is never applied
-- =========================================================================================
--
-- Recorded because the failure is quiet and one-sided, and an operator who reads only the API would
-- not see it. `writeAudit` in `lib/field/managementService.ts` returns a failure rather than throwing
-- it, on purpose: an audit insert that fails AFTER an alert was resolved must not answer 500 and
-- leave the operator believing the resolution rolled back. So on a database that has not run this
-- file, every alert acknowledgement and resolution succeeds, its audit row is rejected with 23514,
-- the response carries `audit_recorded: false`, and the trail stops covering the alert surface — while
-- continuing to cover everything else. Nothing errors loudly. That is the definition of an audit gap
-- that hides itself, and it is why `docs/field-intelligence-setup.md` lists this file in the apply
-- order rather than as an optional step.
