# Product requirements

## Product vision

Irshaye is an agricultural technology platform designed to support farmers, cooperatives, and agricultural organizations in Ethiopia by making agricultural guidance, records, and operational insight more accessible and actionable.

The platform must help farmers receive practical agricultural advice, understand local weather and risk conditions, and connect with support systems that improve crop planning and farm productivity.

## Target users

### Farmers

Farmers need simple, accessible, and practical support. They may be operating in rural areas, may have limited digital literacy, and may rely on mobile-first experiences or message-based interfaces.

### Cooperatives

Cooperatives need a way to track member activity, field conditions, cropping patterns, yields, and service requests across groups of farmers.

### Agricultural organizations

Organizations need visibility into field activity, advisory requests, risks, adoption trends, and operational monitoring.

## Core problems addressed

- limited access to timely agricultural advice
- lack of structured farm record keeping
- disconnected communication channels for farmers
- difficulty understanding weather and risk conditions
- poor visibility into yield and operations across communities
- limited digital support options for rural agricultural ecosystems

## Core product features

- farmer profile and record management
- advisory request intake
- AI-assisted agricultural guidance
- weather and risk overview
- soil and crop data tracking
- cooperative and yield records
- organization dashboard activity
- alerts and notifications

## MVP scope

The first MVP will use Telegram as a temporary farmer interface because real telecom integration is outside the current scope. Telegram is only a prototype channel adapter and not the product architecture.

The MVP should demonstrate:

- farmer message-based interaction
- advisory request capture
- API-driven response flow
- storage of relevant records
- AI-assisted advisory generation
- weather/risk contextualization
- organization-side visibility

## Future direction

The long-term vision is to support:

- USSD for voice and mobile keypad users
- SMS for low-bandwidth communication
- web dashboard for organizations and cooperatives
- API-driven backend services shared across channels

The same core business logic should serve farmers regardless of access channel. Future USSD, SMS, web, or mobile clients must connect through the same API and reuse the same business services.

## Hard implementation constraints

- Telegram is a temporary MVP channel adapter, not the ultimate product identity.
- The system must remain API-first.
- The core business logic must not depend on Telegram-specific code.
- No channel-specific business logic should exist inside core services.
- Gemini is the initial AI provider and must be isolated behind an AI provider abstraction.
- Open-Meteo is the initial weather provider and must be accessed through an external provider adapter/service.
- Weather and AI must never invent facts or guaranteed outcomes.
- Never invent weather conditions, forecasts, soil lab results, farmer measurements, yield guarantees, or agricultural policies.
- If laboratory soil data is unavailable, describe possible causes and recommend verification instead of claiming a diagnosis.
- Never present uncertain information as certain.
- Advisory responses should retain relevant source or evidence context where applicable.
- Rural environments require communication simplicity and low-friction flows.
- The design should prioritize usable farmer experiences over overly complex dashboards.
- Data should be structured in a way that supports future analytics and reporting.
- The project should remain modular enough for future agent-driven implementation.

## Non-goals for this setup phase

This phase does not implement:

- complete frontend UI
- complete backend services
- final AI pipeline
- final weather integration
- production deployment
- production Kubernetes or cloud delivery setup
