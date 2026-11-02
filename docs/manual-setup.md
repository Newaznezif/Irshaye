# Manual setup

## Zero-configuration path

```bash
npm install
npm run dev
```

Open `http://localhost:3000/dashboard`. Climate, agroclimate, geospatial, market, and exchange data all work: Open-Meteo, NASA POWER, NASA GIBS, ArcGIS, WFP rEMS via HDX, NBE, and World Bank publish without keys. The crop and soil reference layers are in the repository.

Two things are unavailable by default and say so on screen:

- **AI Agricultural Advisor** — `GET /api/advisor/status` returns `{"configured": false}` and the page explains that no answer will be invented.
- **Accounts and saved records** — no Supabase project is connected; nothing is persisted beyond this browser's workbench context.

## Gemini (enables the advisor)

1. Create a key in Google AI Studio.
2. Add `GEMINI_API_KEY=...` to `.env.local`.
3. Restart `npm run dev` and confirm `/api/advisor/status` now returns `{"configured": true}`.

`lib/advisor/server.ts` calls `gemini-1.5-flash-latest` with `responseMimeType: application/json`, and the reply is validated before display; a shape it cannot verify becomes a `502 advisor_failed` rather than a partial answer.

## Supabase (enables accounts — not yet provisioned)

**IRSHAYE needs its own Supabase project.** Do not reuse another application's URL or keys, and do not run a migration against any project you did not create for IRSHAYE.

Required steps, in order, when the project is ready:

1. Create the project; note its ref, region, URL, and anon key.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (server-only) `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, then in the deployment's environment.
3. Review `docs/database-plan.md`. It describes six ported `data.*` migrations plus a proposed `app.*` wave.
4. **Before applying anything:** edit `supabase/migrations/20261026000300_data_weather_and_agroclimate.sql` — it adds columns to `public.environmental_data`, a legacy table from the donor project that will not exist in a fresh IRSHAYE database. Applying it as written will fail.
5. Apply migrations to the new project only, then run `npm run check:data` with `persisted=1` to confirm the pipeline reads back what it wrote.

No migration has been executed anywhere as of this writing.

## Scheduled sync (optional, needs a database)

`POST /api/data/sync` runs the publisher → database pipeline and requires `SYNC_SECRET` in the environment plus `SUPABASE_SERVICE_ROLE_KEY`. Point a scheduler (Vercel Cron, GitHub Actions, a systemd timer) at it with `authorization: Bearer <SYNC_SECRET>`. `GET /api/data/sync` reports whether it is configured and which task is gated on a table.

## Deployment (needs its own project)

Create a **new** Vercel project from `Newaznezif/Irshaye`. Never add IRSHAYE to another application's project, domains, or environment. Fonts are self-hosted deliberately (`app/fonts.css`, `components/FontPreload.tsx`); do not switch to `next/font`, which broke the Turbopack build in the sibling project.

## Deferred by decision

Telegram, SMS, and USSD. There is no bot code, no BotFather setup, and no `TELEGRAM_BOT_TOKEN`. `python`/`FastAPI`/Render are not part of the MVP; route handlers are the service layer.

## Rules that stay true

- Secrets live in `.env.local` and platform secret stores only. `.env*` is gitignored; only `.env.example` is committed.
- Agents must not invent credentials, project URLs, or service configuration.
- An integration counts as connected only after a request against it has actually succeeded in this deployment — which is why Settings probes rather than asserts.
