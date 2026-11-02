# Irshaye database plan — independent Supabase project

STATUS: PROPOSED. **No migration has been executed anywhere.** Nothing in this
repository connects to a database until a human provisions Irshaye's own
Supabase project and supplies its keys via `.env` (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

## Non-negotiable isolation

- Irshaye uses a **separate Supabase project**. Credentials from any other
  project (including Nexus AgriRise) must never appear in this repository,
  in CI, or in a deployed Irshaye environment.
- No migration in this directory may be run against any project other than the
  Irshaye one. Verify `NEXT_PUBLIC_SUPABASE_URL` points at the Irshaye project
  before the first apply.
- The admin/service-role key is used **server-side only** (`lib/supabaseAdmin.ts`
  refuses to run in a browser) and only by the guarded `/api/data/sync` route.

## What the ported migrations contain

The seven files that came over from the engineering foundation create the
`data` schema for the open-data mirror: observation domains (`value_kind`:
observed / modeled / forecast / estimated / imputed, and a quality domain),
market price observations, daily climate, exchange and economic indicators,
satellite observations, sync bookkeeping (run log + leases), and geospatial
reference layers. All `data.*` tables are RLS-enabled, RLS-forced, carry zero
policies, and are revoked from `anon`/`authenticated` — only the service role
writes and reads them server-side. They intentionally contain no Nexus legacy
objects: the one ported file that referenced legacy tables was removed.

**Known ported-file caveat:** `20261026000300_data_weather_and_agroclimate.sql`
adds columns to `public.environmental_data`, a legacy table that will not exist
in a fresh Irshaye project. This file must be edited to drop that section
before applying (tracked as a required change, not applied silently).

## Irshaye application tables (second wave, after the data layer)

Per the product blueprint (`docs/database-schema.md`), pending its own review:

1. `app.profiles` — one row per auth user; role: `farmer | cooperative | organization`;
   region/woreda preference. (Closes the missing-users gap in the blueprint.)
2. `app.farmers`, `app.cooperatives`, `app.organizations`,
   `app.farmer_cooperative_memberships`
3. `app.advisory_requests`, `app.advisory_responses` — responses store the
   evidence JSON assembled by `/api/advisor` so every past answer stays auditable.
4. `app.soil_records`, `app.yield_batches`, `app.yield_records`
5. `app.risk_alerts`, `app.activity_logs`

RLS for `app.*`: user owns their row; cooperative members read their
cooperative's aggregate; organizations read their own members' consented data.
These policies are drafted per-table before any apply, never blanket-allowed.

## Sync path

`POST /api/data/sync` is the only writer, guarded by `SYNC_SECRET` (constant
time compare, refuses when unset or shorter than 16 chars). Scheduling comes
from an independent Irshaye job (GitHub Actions cron on the Irshaye repo) —
never the other project's scheduler.

## Apply order (once the project exists)

1. Create Supabase project (human action).
2. Edit migration 20261026000300 to remove the legacy-table section.
3. Apply the six data migrations in filename order via `supabase db push` or the SQL editor.
4. Verify with `GET /api/data/sync` (read-only health) and the contract harness `npm run check:data`.
5. Draft + review `app.*` migrations, then apply.
