# Architecture

## Product intent

Irshaye is a multi-channel agricultural platform for rural Ethiopian farmers, cooperatives, and agricultural organizations. The product is designed to be API-first and channel-agnostic so that the same business logic can support multiple farmer access modes.

## High-level architecture

```text
                        IRSHAYE
                     ┌────────────┐
                     │  Channel    │
                     │  Adapters   │
                     └────┬────────┘
                          │
      ┌──────────────────────┼──────────────────────┐
      │                      │                      │
Telegram MVP         USSD / SMS / Web / Mobile   Other future clients
      │                      │                      │
      └──────────────┬───────┴──────────────┬───────┘
                     │                      │
                     ▼                      ▼
              Irshaye API (core)      Organization Web Dashboard
                     │
                     ▼
               FastAPI backend
                     │
      ┌──────────────┼──────────────────────┐
      │              │                      │
      │     Business Services               │
      │  - advisory                          │
      │  - soil                              │
      │  - risk/weather                      │
      │  - farmer/cooperative records        │
      │  - yield ledger                      │
      │  - alerts                            │
      │  - activity dashboard                │
      │                                      │
      └──────────────┼──────────────────────┘
                     │
                     ▼
          External provider adapters
        - AI provider adapter (Gemini initial)
        - Weather provider adapter (Open-Meteo initial)
                     │
                     ▼
                  Supabase
                PostgreSQL
```

## Channel model

```text
Telegram ───┐
USSD ───────┤
SMS ────────┤──→ Irshaye API → Shared business services → Supabase
Web ────────┘
```

Telegram is a temporary MVP channel adapter only. It is not the Irshaye product architecture. The core business logic must never depend on Telegram-specific code. No channel-specific business logic should exist inside core services.

## Design principles

- All channels should use the same backend business logic.
- The API should be the central integration layer.
- Telegram is a temporary MVP interface, not the core product.
- User-facing channels should not duplicate business rules.
- Supabase is the managed PostgreSQL platform that stores the core production data.
- AI and weather providers are external service integrations behind adapters or interfaces.
- The system must not claim real telecom integration or live external configuration unless the human has authenticated setup and validated it.

## Core backend domains

- farmer profiles and cooperative membership
- advisory requests and responses with evidence/source context
- soil and crop guidance
- weather and agricultural risk intelligence from provider-backed sources
- cooperative yield ledger and batch synchronization
- organization activity tracking and dashboard data
- AI-supported advisory workflows with cautious, evidence-based outputs
- notifications and alerts

## External service boundaries

- AI provider: Gemini is the initial provider, but it must be isolated behind an AI service abstraction so another provider can replace it later without changing business logic.
- Weather provider: Open-Meteo is the initial provider, and weather must be fetched through an external provider adapter/service rather than being hardcoded as the production data source.
- Provider changes should be isolated to the adapter layer, not the core domain logic.

## Current scope boundary

This repository is intentionally limited to a project foundation and planning phase. The full application architecture, business logic, deployment model, and integrations are intentionally not implemented here.

## Planned future evolution

The long-term system may evolve into a more complete platform with:

- web dashboard for organizations
- role-based access for farmers and cooperatives
- mobile-friendly data collection flows
- automated advisory workflows
- alert generation and response tracking
- analytics for yield and activity monitoring
