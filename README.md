# IRSHAYE

**An AI-Assisted Digital Platform for Climate-Smart Agriculture in Ethiopia.**

IRSHAYE helps a farmer answer one question with evidence: *given my place and my crop, what should I do now, and how sure is the platform about that?*

It is a working Next.js application, not a mockup. Every figure on screen is fetched from a named open-data publisher at request time, carries its source, units, and date, and is labelled as observed, forecast, modelled, or derived. Where a source has nothing to give, the interface says so instead of inventing a number.

## What runs today

```
Location → Crop → Climate context → Agricultural information → Evidence-based recommendation
```

| Area | Status |
| --- | --- |
| Farmer workbench (place + crop context, persisted locally) | implemented |
| Climate Intelligence — Open-Meteo forecast and ERA5 archive, NASA POWER daily and 30-year normals | implemented, live |
| Crop Advisory — 11 cited Ethiopian crop profiles with a live suitability comparison | implemented |
| Soil Management — erosion-pressure signals from measured rainfall plus cited practice guidance | implemented, explicitly non-diagnostic |
| Market Intelligence — WFP rEMS grain prices for 65 Ethiopian markets, NBE exchange rates | implemented, live |
| AI Agricultural Advisor — Gemini over assembled evidence only, with citations, uncertainty and abstention | implemented; needs `GEMINI_API_KEY` |
| Data Sources — per-publisher status, licence, cadence and staleness | implemented |
| Settings — integration status read from live probes | implemented |
| Accounts, saved records, offline sync (Supabase) | planned, see `docs/database-plan.md` — no migration has been run |
| Telegram, SMS, USSD channels | deliberately deferred |

`backend/`, `frontend/`, and `telegram-bot/` are placeholders from the pre-implementation planning phase. The application lives at the repository root (`app/`, `components/`, `lib/`, `hooks/`, `context/`).

## Architecture

Next.js-first. Route handlers under `app/api/` are the platform's service layer; there is no separate Python backend in the MVP, and none is planned until a requirement actually needs one.

Two rules survive that decision and are non-negotiable:

1. **Business logic does not depend on a channel.** Advisory, evidence assembly, and data connectors are plain TypeScript modules with no request or UI coupling. A later Telegram, SMS, or USSD front end calls the same functions the web pages call.
2. **External providers stay behind adapters.** Open-Meteo, NASA POWER, NASA GIBS, ArcGIS, WFP/HDX, NBE, World Bank, and Gemini are each reached through one module that returns `{ ok, data, provenance }` or `{ ok, false, error, provenance }`. A provider can be swapped without touching a page.

Data integrity is a feature, not a policy document:

- provenance is attached to every value and rendered next to it;
- `valueKind` distinguishes `observed`, `forecast`, `modeled`, `estimated`, `imputed`;
- a failed source produces an honest unavailable state — never a placeholder;
- the advisor abstains locally when the evidence cannot support an answer, before spending a model call;
- nothing claims yield, income, or water-savings outcomes, and nothing claims to diagnose soil from satellite vegetation.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript, strict
- Tailwind CSS v4, self-hosted Inter and Noto Sans Ethiopic
- `@google/generative-ai` for the advisor
- `@supabase/supabase-js` for the (planned) persistence layer
- No chart of anything the platform does not actually have data for

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: every open-data route works with no keys
npm run dev
```

Open `http://localhost:3000`. The dashboard works with zero configuration; `GEMINI_API_KEY` and a Supabase project add the advisor and accounts respectively.

**Never reuse credentials from another application.** IRSHAYE is expected to run against its own Supabase project and its own deployment.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm run start` | serve the production build |
| `npm run lint` | ESLint, including the React Compiler rules |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:data` | live contract check against every data route |

## Documentation

- `docs/architecture.md` — layering, provenance model, connector design
- `docs/api-specification.md` — the route handlers that exist
- `docs/database-plan.md` — proposed schema and migration order; **nothing applied**
- `docs/product-requirements.md` — the farmer problem being solved
- `docs/development-workflow.md`, `docs/manual-setup.md`, `docs/deployment.md` — how to work on and ship it

## Licence

MIT.
