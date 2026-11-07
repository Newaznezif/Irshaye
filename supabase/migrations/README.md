# Supabase migrations

Numbered SQL files, applied in filename order. One logical change per file, and a file that has
been applied to a database is never edited — later changes arrive in a new number.

## Status

Twelve files exist. **None has been applied to any database.** No Supabase project is connected to
this repository: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are unset locally and in
the Vercel project, and `docs/manual-setup.md` and `supabase/README.md` both record that no
database has been created for the project.

The pack was validated by applying it to an in-process PostgreSQL in a throwaway directory outside
the repository — two runs, because the harness grew a second half when schema `app` arrived:
82/82 assertions over the `data` + `field` files (constraints, indexes, RLS posture, grants, the
rotation function) and 60/60 over the whole pack grading schema `app` (the membership role vocabulary,
one-current-membership, the attribution CHECKs on grant and revocation, the `auth.users` guard's SKIP
branch, the audit action/outcome/reason CHECKs, the credential-shaped-key refusals, the append-only
trigger bits, and which role holds which grant). That proves the files execute and enforce what they
claim. It is not, and must not be reported as, a migration having been applied to a real project.

`docs/field-intelligence-setup.md` has the apply order, the commands, and the verification queries.

## Files

| file | schema | what it creates |
| --- | --- | --- |
| `20261026000100_data_schema_preparation.sql` | `data` | the `data` schema, the shared domains (`data.value_kind`, `data.quality`), `data.touch_replaced_at()`, and guarded idempotent alignment of the legacy `public.*` tables — it creates no tables and changes no rows |
| `20261026000200_data_market_observations.sql` | `data` | `data.location`, `data.market_price_observations`, `data.market_monthly_summary` |
| `20261026000300_data_weather_and_agroclimate.sql` | `data` | weather and agro-climate series |
| `20261026000400_data_exchange_and_indicators.sql` | `data` | exchange rates and indicators |
| `20261026000500_data_satellite_observations.sql` | `data` | satellite layers and observations |
| `20261026000600_data_sync_bookkeeping.sql` | `data` | sync run/lease bookkeeping |
| `20261030000100_data_geospatial_reference.sql` | `data` | administrative boundaries and reference vectors |
| `20261105000100_field_intelligence_registry.sql` | `field` | `cooperatives`, `field_sites`, `hardware_nodes`, `hardware_node_credentials`, `field.rotate_device_credential()` |
| `20261105000200_field_intelligence_observations.sql` | `field` | `sensor_logs`, `alert_rules`, `device_alerts` |
| `20261105000300_field_intelligence_access.sql` | `field` | grants to `service_role`, and the record of what the pack deliberately does not grant |
| `20261106000100_app_cooperative_membership.sql` | `app` | the `app` schema and `cooperative_members` — the only authorization input the device-management API reads: closed `manager`/`viewer` vocabulary, one current row per subject and cooperative, revocation by attributed stamp, a guarded `auth.users` foreign key where Auth exists |
| `20261106000200_app_management_audit.sql` | `app` | `management_audit` — append-only (`before update or delete` trigger), no foreign keys by design, `detail` refused if it carries `secret_token`/`token`/`token_hash` or any 64-hex digest, granted `select, insert` only |

## A note on `20261026000100`

This file was corrected in place on 2026-11-05, before any database had been created for the
project. Two defects were fixed: a typed column-alias list in a `FROM (VALUES …) AS declared (name
text, allowed text[])` — PostgreSQL accepts column names there but never their types, so the
statement is a syntax error in every released version — and an unguarded `::regclass` cast that
raised `relation "public.environmental_data" does not exist` on any fresh project, because a
`::regclass` cast of a missing relation is an error rather than null.

The judgement call, recorded so it is not a silent rewrite of history:

- **Application status: none established, and none possible.** No Supabase project is configured
  anywhere (see Status above), AGENTS.md forbids an agent from running migrations, and the second
  defect means the file could not have completed anywhere it was ever run: with the SQL runner's
  per-file transaction, the abort rolled the whole file back. `data.location` is created by the
  *next* file, which cannot apply unless this one did, so any database in which `data.location`
  exists already contains a successful application of a corrected version of these statements.
- **Why not a forward-only migration instead.** A later file cannot repair this one, because a
  runner stops at the first failing file, and every subsequent file in the `data` pack — plus the
  sync code that probes `data.*` — depends on the schema and the trigger function this file
  creates. A "migration" that re-runs the corrected statements would be a second file describing
  the same tables, which is the drift we are trying to avoid.
- **What changed behaviourally.** Nothing when the legacy `public.environmental_data` table exists;
  where it does not, an abort became a documented `SKIP`. Both fixes are in the file with comments
  explaining them.
- **If this file has since been applied somewhere unknown**: re-running the edited version is not
  safe to assume. `docs/field-intelligence-setup.md`'s verification queries show whether the
  objects exist; if they do, apply only the corrected statements that are actually missing, in a
  new numbered file.

## A note on `20261106000100`

Corrected in place on 2026-11-06, before any database had been created for the project, immediately
after the file was first executed. The `cooperative_members_touch` trigger calls
`data.touch_replaced_at()`, which assigns `new.record_replaced_at` — and the table did not have that
column. PostgreSQL accepts that at `create trigger` time: a trigger function that writes a missing
field is a **runtime** abort on the first `UPDATE`, so the file applied cleanly in the harness and
only failed when the harness tried the statement `docs/field-intelligence-setup.md` tells an operator
to run. Revoking or re-scoping a membership would have failed in production with
`record "new" … has no field "record_replaced_at"`, in the one operation where an operator is in a
hurry.

The fix adds `record_replaced_at timestamptz` (nullable: NULL until the first update, which is exactly
what "this grant has never been edited" means), because the alternative — dropping the trigger — would
lose the answer to "when did this person stop being a manager", which `removed_at` does not carry. It
also matches this pack's own convention for anything that may be updated. Judgement, same as above:
application status was none established, so this is a correction rather than a rewrite of history, and
the file documents the constraint at the trigger.

What is now asserted so it cannot regress: `app-check.mjs` runs an `UPDATE` on a membership row and
checks the column comes back stamped, before it checks anything else about that table.

## Conventions this directory follows

- Filename `YYYYMMDDNNNNNN_<schema>_<topic>.sql`, the sequence number encoding the apply order.
- A banner comment and a rationale in the file: every constraint, index and grant says why it is
  there, in the same document that creates it.
- `bigint generated always as identity` or a natural `text` key for primary keys — no uuid columns.
  Where a device identifier is the natural key (`hardware_nodes.node_id`), that is deliberate.
- Named CHECK constraints `<object>_<assertion>`, indexes `<topic>_<columns>_idx`, unique natural
  keys `*_uid`.
- `record_added_at` / `record_replaced_at` plus the `data.touch_replaced_at()` trigger on anything
  that may be replaced; units spelled into column names.
- RLS `enable`d and `force`d with zero policies and both API roles revoked, until an authentication
  system exists for policies to filter on. Grants go to `service_role` only, explicitly per table.
- No extensions. TimescaleDB is not used; `sensor_logs` is indexed so range partitioning can be
  added later in a new file if volume ever justifies it.
