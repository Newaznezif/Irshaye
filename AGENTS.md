# AGENTS.md

## Purpose

This repository is the project foundation for Irshaye, an agricultural technology platform for rural Ethiopian farmers, cooperatives, and agricultural organizations.

This is not a full application implementation repository. It is a structured setup and planning repository intended to support later coding agents such as Antigravity, Cursor, or Qoder.

## Core principles

- Do not build the complete application in this phase.
- Do not implement the full frontend, backend, Telegram bot, AI integration, weather integration, or deployment stack.
- Keep the scope limited to architecture planning, documentation, repository structure, and project setup.
- Make decisions that support later development without locking the team into a premature production implementation.
- Treat Supabase as the managed PostgreSQL platform, not as a separate database service requiring a second account.
- Do not store secrets or credentials in the repository.
- Do not claim external services are connected unless authenticated access is actually available.

## Product direction

Irshaye should be built as an API-first agricultural platform. Telegram will be used as a temporary MVP farmer interface, but the long-term design is channel-agnostic:

- Telegram → API
- USSD → API
- SMS → API
- Web → API

All channels should reuse the same backend business logic.

## Intended stack

Frontend:
- Next.js
- TypeScript
- Tailwind CSS

Backend:
- Python
- FastAPI

Database:
- Supabase
- PostgreSQL

AI:
- Gemini API

Weather:
- Open-Meteo

MVP farmer interface:
- Telegram Bot API

## Working rules for future agents

1. Keep the project foundation clean and understandable.
2. Prefer documentation and architecture clarity over speculative implementation.
3. Mark any schema or API designs as subject to review during the main architecture phase.
4. Use a minimal and disciplined structure.
5. Keep environment variables in .env.example only.
6. Ensure .env is excluded from version control.
7. If authentication or external setup is required, stop and ask for human action instead of pretending it succeeded.
8. Do not repeatedly retry failed commands.

## Repository scope

The following are in scope for this setup phase:
- repository structure
- documentation
- architecture notes
- database blueprint
- API blueprint
- environment variable templates
- Git workflow guidance
- setup instructions

The following are out of scope for this phase:
- production frontend implementation
- production backend implementation
- Telegram real bot deployment
- AI integration
- weather integration
- deployment workflows
- full authentication system

## Expected handoff

This repository should be clear and usable by larger coding agents in the next stage of product development. The goal is to avoid wasted effort and to preserve a clean technical foundation.
