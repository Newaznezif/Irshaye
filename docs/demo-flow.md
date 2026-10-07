# Demo flow

## Product demonstration concept

The MVP should demonstrate a simple end-to-end agricultural assistance flow using Telegram as the temporary farmer interface. This flow is a prototype demonstration only and must not be interpreted as live telecom integration or a production deployment of the Telegram bot.

## End-to-end flow

```text
Farmer
  ↓
Telegram message / command (prototype adapter)
  ↓
Irshaye API
  ↓
Database + AI + weather/risk services
  ↓
Advice / alert / record response
  ↓
Organization dashboard
```

## Example scenario

1. A farmer sends a crop question via Telegram.
2. The Telegram bot forwards the request to the backend API.
3. The API validates the farmer context and request type.
4. Relevant data is retrieved from the database.
5. Weather and risk context is requested from relevant provider-backed services.
6. AI advisory logic generates a response or recommendation using cautious, source-aware guidance.
7. The response is saved as an advisory output with source or evidence context when available.
8. The farmer receives a concise guidance response in Telegram.
9. The organization dashboard shows the request, status, and emerging activity.

## Business flow objective

This demonstration shows how all channels eventually connect to a single backend system, with Telegram acting only as a simple temporary interface for MVP testing. It must not imply live telecom integration, actual Ethio Telecom USSD integration, production Telegram deployment, or live provider configuration unless the human has authenticated and validated those systems separately.

## What this phase should document

- request intake from the farmer
- backend processing workflow
- database persistence
- AI advisory generation
- weather/risk enrichment
- organization visibility

## What this phase should not do

This phase does not implement production-grade Telegram handling, AI orchestration, or live external integrations. It does not claim that the bot, AI provider, weather provider, or telecom layer is connected unless a human has performed authenticated setup and test verification.
