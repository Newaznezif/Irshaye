# Architecture

## Product intent

Irshaye is a multi-channel agricultural platform for rural Ethiopian farmers, cooperatives, and agricultural organizations. The product is designed to be API-first and channel-agnostic so that the same business logic can support multiple farmer access modes.

## High-level architecture

```text
                    IRSHAYE
                       │
          ┌────────────┴────────────┐
          │                         │
     FARMER SIDE              ORGANIZATION SIDE
          │                         │
      Telegram MVP              Web Dashboard
          │                         │
          └────────────┬────────────┘
                       │
                    REST API
                       │
                    FastAPI
                       │
       ┌───────────────┼────────────────┐
       │               │                │
   AI Advisory    Weather/Risk     Core Services
       │               │                │
       └───────────────┼────────────────┘
                       │
                    Supabase
                   PostgreSQL
```

## Future channel model

```text
Telegram ───┐
USSD ───────┤
SMS ────────┤──→ Irshaye API → Supabase
Web ────────┘
```

## Design principles

- All channels should use the same backend business logic.
- The API should be the central integration layer.
- Telegram is a temporary MVP interface, not the core product.
- User-facing channels should not duplicate business rules.
- Supabase is the managed PostgreSQL platform that stores the core production data.

## Core backend domains

- farmer information and profiles
- advisory requests and responses
- soil and crop guidance
- weather and risk intelligence
- cooperative and yield records
- organization activity tracking
- AI-supported advisory workflows
- notifications and alerts

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
