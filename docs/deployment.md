# Deployment

**Nothing is deployed.** This repository builds and runs locally; no IRSHAYE environment exists in any hosting project yet, and none should be created until the independent infrastructure below is provisioned.

## Shape of a deployment

IRSHAYE is one Next.js application. There is no separate backend service to host, so a deployment is:

1. a Vercel project connected to `Newaznezif/Irshaye`;
2. its own Supabase project;
3. its own environment variables.

Route handlers run on the same platform as the pages. `scripts/run-sync.mjs` exists for a scheduler that prefers a process over an HTTP call, and is inert until a database exists.

## Environment variables

| variable | scope | needed for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | accounts, saved records |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | accounts, saved records |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | the sync writer |
| `SYNC_SECRET` | server only | guarding `POST /api/data/sync` |
| `SYNC_URL` | scheduler | the URL a cron job calls |
| `GEMINI_API_KEY` | server only | the AI advisor |

Open-data routes need no variables at all, so a deployment with an empty environment still serves climate, market, and reference content — it simply reports the advisor as not configured.

## Isolation requirements (blocking)

- Create a **new** Vercel project from the IRSHAYE repository. Do not add IRSHAYE to another application's project, domains, or environment.
- Create a **new** Supabase project. Never reuse another application's URL or keys, and never run an IRSHAYE migration against a database that is not IRSHAYE's.
- The service-role key must never reach a browser bundle; `lib/supabaseAdmin.ts` refuses to run there by design.
- Nexus AgriRise is a live product on other infrastructure. No credential, connection string, webhook, or storage bucket is shared with it, and IRSHAYE is not configured to write to any Nexus service.

## Before the first deploy

1. `npm run typecheck && npm run lint && npm run build` clean.
2. `npm run check:data` green against the production build (`npm run start`).
3. `docs/database-plan.md` reviewed and the legacy-table section of `20261026000300_data_weather_and_agroclimate.sql` removed, then migrations applied **to the new project only**.
4. Environment variables set in the platform, not committed.
5. Settings page probes confirm what is actually configured.

## After a deploy

Verify the routes that matter on the live URL: `/dashboard`, `/api/data/status?sources=light`, `/api/advisor/status`. Then, and only then, may the deployment be described as live.
