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

The MVP is the **farmer-facing web application**. Telegram, SMS, and USSD are deferred by decision: they remain the long-term reach strategy for feature-phone users, but no channel work happens before the web decision-support workflow is solid.

The MVP must deliver:

- a place → crop → climate → information → recommendation workflow with no decorative steps
- live weather, agroclimate, market, and exchange context from named open-data publishers
- cited crop and soil reference layers, with gaps shown as gaps
- an AI advisor that reasons only over assembled evidence, cites it, states uncertainty, and abstains when the evidence cannot support an answer
- honest unavailability: a source that fails produces a stated gap, never a substitute value

Record storage, cooperative dashboards, alerts, and channel adapters follow once independent infrastructure is provisioned (see `docs/database-plan.md`).

## Future direction

In rough order:

- accounts, farmer and cooperative records, advisory request history (Supabase, own project)
- Telegram as a thin adapter over the existing advisory modules
- SMS and USSD for low-bandwidth and keypad users
- organization dashboards for cooperatives and agricultural organizations
- analytics over accumulated, consented records

The same core business logic must serve farmers regardless of access channel. Future Telegram, SMS, USSD, or mobile clients connect through the same service layer and reuse the same business modules — which is why nothing in `lib/advisor`, `lib/crops`, `lib/soil`, or `lib/data` imports React or a route handler.

## Hard implementation constraints

- Telegram, SMS, and USSD are channel adapters, deferred in the MVP and never the product identity.
- The service layer is API-first: route handlers today, and any future channel calls the same modules.
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

## Out of scope for the current build

Implemented: the farmer-facing web workflow, live open-data connectors, cited crop and soil reference layers, the evidence-only advisor, market intelligence, and source status.

Not built in this phase, on purpose:

- accounts, authentication, and stored farmer records (needs its own Supabase project)
- cooperative and organization dashboards
- alerts, notifications, and yield ledgers
- Telegram, SMS, and USSD adapters
- IoT sensors and any sensor-driven claims
- deployment to any hosting environment
- a separate Python backend, which the Next.js service layer makes unnecessary for the MVP
