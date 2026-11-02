# Architecture

## Product intent

IRSHAYE is a climate-smart agriculture platform for rural Ethiopian farmers, cooperatives, and agricultural organizations. The design goal is that the same decision-support logic serves any channel — web today, Telegram/USSD/SMS later — without duplication.

## What is implemented

The application is a single Next.js 16 (App Router) project. Route handlers are the service layer; there is no separate Python backend.

```text
                    ┌─────────────────────────────────────┐
  Browser ─────────▶│ app/dashboard/*  (client views)     │
                    │  Overview · Climate · Crops · Soil  │
                    │  Markets · Advisor · Sources · Set. │
                    └───────────────┬─────────────────────┘
                                    │ fetch /api/...
                    ┌───────────────▼─────────────────────┐
                    │ app/api/*  (route handlers)         │
                    │  /api/data/{weather,agroclimate,    │
                    │   markets,exchange,geospatial,      │
                    │   locations,status,sync}            │
                    │  /api/advisor, /api/advisor/status  │
                    └───────────────┬─────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐        ┌───────────────────┐      ┌────────────────────┐
│ lib/data/*    │        │ lib/advisor/*     │      │ lib/crops, lib/soil│
│ connectors    │◀──────▶│ evidence assembly │◀────▶│ cited reference    │
│ http, cache   │        │ Gemini call       │      │ layers             │
│ source registry│       │ abstention        │      │                    │
└───────┬───────┘        └─────────┬─────────┘      └─────────┬──────────┘
        │                          │                          │
        ▼                          ▼                          ▼
  Open-Meteo, NASA POWER,    Gemini API              literature with
  NASA GIBS, ArcGIS,                               citations (no call)
  WFP rEMS / HDX, NBE,
  World Bank
```

Persistence (Supabase) is planned and isolated; **no migration has been executed** — see `docs/database-plan.md`.

## Layers and their contracts

**Connectors — `lib/data/`.** One module per publisher. Each returns a discriminated result:

```ts
{ ok: true,  data, provenance }
{ ok: false, error, provenance }
```

`provenance` carries `source`, `sourceUrl`, `retrievedAt`, `observedAt`, `valueKind`, `units`, `methodology`, `quality`, `coverage`, and age limits. A connector never throws a bare error at a caller it could answer with a typed failure, and never logs or echoes upstream URLs with credentials.

**HTTP — `lib/data/http.ts`.** Every upstream call goes through one client with a timeout, bounded retries with jitter and `Retry-After` handling, a maximum response size, and status-only error messages.

**Cache — `lib/data/cache.ts`.** Process-local TTL cache with single-flight de-duplication. It is a cost and latency device, not a data source: cached responses are marked `servedFromCache` and stale data is flagged rather than hidden.

**Source registry — `lib/data/sources.ts`.** Publisher identity, licence, cadence, and publication lag in one place, so the Data Sources page and every provenance label agree about who published what and when.

**Reference layers — `lib/crops/`, `lib/soil/`.** Curated literature. Every figure has a citation; unknown values stay `null` and render as an explicit gap. The suitability comparison is labelled as modelled guidance, never as a measurement of the user's field.

**Advisor — `lib/advisor/`.** `assembleEvidence()` calls connectors directly and collects both evidence items and gaps. `advise()` abstains locally when fewer than two measured facts are available or no crop is selected, then makes one JSON-constrained Gemini call, then validates the shape. A rejected or failed call returns a structured failure — the platform does not print an invented answer.

**Client data hooks — `hooks/useLiveData.ts`.** Keeps `{ ok, data, provenance, error }` intact through loading and refresh, aborts superseded requests, and never collapses a failure into an empty array.

## Channel model

Business logic has no transport dependency. `lib/advisor`, `lib/crops`, `lib/soil`, and every connector are plain TypeScript modules importable from a route handler, a script, or a future bot process. A Telegram, SMS, or USSD adapter will call those modules directly; nothing in them knows about HTTP or React.

Channels are **deferred by decision**, not missing: no `telegram-bot/` code exists, and none is scheduled for the MVP.

## External service boundaries

- **AI:** Gemini is the current provider, reached only from `lib/advisor/server.ts`. Replacing it means changing that module, not the pages or the evidence model.
- **Weather and climate:** Open-Meteo (forecast + ERA5 archive) and NASA POWER (daily + 30-year normals), each behind its own connector.
- **Markets and FX:** WFP rEMS via HDX, NBE, World Bank. Prices are published figures; the platform never estimates a price it does not have.
- **Geospatial:** NASA GIBS imagery/indices and ArcGIS boundaries.
- **Persistence:** Supabase, with browser-anon, request-scoped JWT verification, and service-role clients kept separate. Service-role code refuses to run in a browser bundle.

## Infrastructure isolation

IRSHAYE is expected to run against its own Supabase project, its own Vercel (or equivalent) project, and its own secrets. Nexus AgriRise is a separate live product; no credential, connection string, or storage target is shared, and nothing in this codebase is configured to write to a Nexus service.

## Deliberately absent

Investor analytics, cross-border trade modelling, uploaded-dataset insight generation, demo/mock charting, a floating chat assistant, and any fabricated sample data. Their absence is a scope decision, not a backlog item.
