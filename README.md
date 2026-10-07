# Irshaye

Irshaye is an agricultural technology platform for rural Ethiopian farmers, cooperatives, and agricultural organizations.

This repository is intentionally limited to the project foundation and documentation phase. It does not implement the complete product yet. Instead, it provides a clean, organized, GitHub-ready base for future development.

## Scope of this phase

This phase includes:

- repository structure
- architecture documentation
- product requirements
- demo flow documentation
- database and API blueprints
- environment variable template
- setup and deployment planning

This phase does not include:

- full frontend implementation
- full backend implementation
- production Telegram bot
- AI integration
- weather integration
- authentication implementation
- production CI/CD
- deployment configuration

## Architecture guardrails

Irshaye is designed as an API-first, channel-agnostic agricultural platform. Telegram is only a temporary MVP interface and is not the product architecture. Future channels such as USSD, SMS, web, and mobile clients must connect through the same API and the same core business logic.

Core business logic must not depend on Telegram-specific code. No channel-specific business logic should be embedded inside the core services layer. AI and weather capabilities are external provider-backed services behind an abstraction layer, not custom hardcoded logic.

The current intended providers are Gemini for AI and Open-Meteo for weather. These are initial providers and must be isolated behind service adapters so they can be replaced later without rewriting business logic.

## Intended stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Python, FastAPI
- Database: Supabase, PostgreSQL
- AI: Gemini API
- Weather: Open-Meteo
- MVP farmer channel: Telegram Bot API

## Repository structure

- docs/ — architecture, API, database, workflow, setup, product, and demo docs
- frontend/ — future frontend workspace
- backend/ — future backend workspace
- telegram-bot/ — future Telegram MVP workspace
- supabase/ — Supabase setup and migration notes
- tests/ — future validation and test docs
- .github/workflows/ — placeholder workflow documentation

## Manual setup required

Human-authenticated actions are required for:

- GitHub sign-in and push permissions
- Supabase project creation and keys
- Telegram BotFather setup
- Gemini API key generation
- Vercel/Render deployment setup when the product is ready

Do not store secrets in the repository.

## Git status

This repo is initialized as a local Git repository. GitHub authentication must be completed manually before any push operation.

## License

This project is licensed under the MIT License.
