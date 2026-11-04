# AGENTS.md

## Purpose

This repository is the working codebase for **IRSHAYE — an AI-assisted digital platform for climate-smart agriculture in Ethiopia**. It is an implemented Next.js application, not a planning-only repository.

## Current architecture decisions

These were decided and approved; do not silently reverse them.

1. **Next.js-first.** The application is the service layer. Route handlers under `app/api/` are the platform's API.
2. **No separate FastAPI backend in the MVP.** `backend/` is a placeholder from the planning phase. Do not add a Python service without a stated requirement it solves that route handlers cannot.
3. **Channels are deferred.** Telegram, SMS, and USSD are not implemented. Farmer-facing work happens in the web application.
4. **Business logic stays channel-independent.** Advisory logic, evidence assembly, and data connectors are plain modules with no transport coupling, so a later channel reuses them rather than duplicating them.
5. **Independent infrastructure.** IRSHAYE runs against its own Supabase project and its own deployment. Nexus AgriRise is a separate, live product: never reuse its credentials, connection strings, secrets, or deployments, and never point IRSHAYE at any Nexus production service.

## Data integrity rules

These are product requirements, not style preferences.

- Every value shown to a user carries its publisher, retrieval time, units, and `valueKind` (`observed` | `forecast` | `modeled` | `estimated` | `imputed`).
- A failed or slow source renders an explicit unavailable state. **Never substitute fabricated, cached-forever, or placeholder data.**
- Do not present derived or modelled figures as measurements. IRSHAYE-computed values are labelled as derived.
- Do not claim yield, income, or water-savings outcomes; those need field validation the platform does not have.
- Do not imply that satellite vegetation indices measure soil quality or that climate data diagnoses a specific field. Crop and soil reference content is curated literature with citations; when a source is missing, the field stays `null` and the UI shows the gap.
- The AI advisor reasons only over assembled evidence, cites evidence by id, states uncertainty and limitations, and abstains — locally, before any model call — when the evidence cannot support an answer.
- Settings and status screens report live probe results. An integration is "connected" only when a request against it actually succeeded in this deployment.

## Stack

- Next.js 16 App Router (no `src/`), React 19, TypeScript strict, path alias `@/* → ./*`
- Tailwind CSS v4 (CSS-first `@theme`), self-hosted Inter + Noto Sans Ethiopic via `app/fonts.css`; do not switch to `next/font`, which broke the Turbopack build in the sibling project
- `@google/generative-ai`, `@supabase/supabase-js`, `recharts`, `lucide-react`, `papaparse`
- No `openai`, `sonner`, `axios`, `framer-motion`, or demo-data modules

## Working rules

1. Keep environment variables in `.env.example` only; `.env*` stays out of version control.
2. Prefer editing existing modules over adding parallel abstractions; the data layer already has one HTTP client, one cache, and one source registry.
3. `metadata` exports are illegal in `"use client"` files: pages that need metadata are thin server `page.tsx` wrappers around a `*View.tsx` client component.
4. The React Compiler lint rules are enforced. Do not add `useMemo`/`useCallback` the compiler already handles, and do not suppress `react-hooks/set-state-in-effect` when an external store (`useSyncExternalStore`) or an event handler is the actual fix.
5. Never pipe a long-running dev server (`npm run dev | head -n`) — the pipe kills it.
6. Run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run check:data` before declaring work done.
7. Do not invent telecom, USSD short-code, or Ethio Telecom integration.
8. Do not run database migrations. `docs/database-plan.md` is a proposal; nothing has been applied, and a Supabase project must be provisioned separately first.
9. If an external service needs human authentication, stop and ask rather than simulating success.
10. Do not push or deploy without reporting the change set and verifying the destination remote and branch first.

## Repository map

- `app/` — routes, dashboard pages, API handlers
- `components/` — shell and shared UI; `components/data/` — provenance-aware data UI
- `lib/data/` — open-data connectors, source registry, HTTP client, cache, sync
- `lib/crops/`, `lib/soil/` — cited reference layers
- `lib/advisor/` — evidence assembly and the Gemini advisory path
- `context/`, `hooks/` — workbench state and live-data hooks
- `docs/` — architecture, API, database plan, product, workflow
- `scripts/` — live contract checker and the (inert until a database exists) sync runner
- `backend/`, `frontend/`, `telegram-bot/`, `tests/` — planning-phase placeholders

## Expected handoff

A future agent should be able to run `npm install && npm run dev` with no keys and see a working, honest product: real climate, real market prices, cited crop references, an advisor that abstains rather than invents, and a settings screen that tells the truth about what is configured.
