# API specification blueprint

This document defines the proposed API shape for the platform. It is a planning artifact only and does not implement the actual backend yet.

## Base URL

- Development: /api
- Future environment-specific values will be configured later

## Core architecture constraints

- The core API is channel-agnostic.
- Telegram is only a temporary MVP client adapter and not a core business API concern.
- There should be no Telegram-specific business routes in the core API.
- AI and weather functionality are provider-backed services and should be consumed through adapters or service interfaces.
- Advisory responses should retain evidence or source context where applicable.
- Authentication and authorization are design work for the implementation phase and are not being implemented in this repository.

## Core conventions

- JSON request and response bodies
- REST-style endpoints
- standard HTTP status codes
- consistent error envelope for validation and server issues
- health-check endpoint for service readiness

## Proposed endpoints

### Health

- GET /api/health

### Farmers

- GET /api/farmers
- POST /api/farmers
- GET /api/farmers/{id}
- PUT /api/farmers/{id}
- DELETE /api/farmers/{id}

### Organizations

- GET /api/organizations
- POST /api/organizations
- GET /api/organizations/{id}

### Cooperatives

- GET /api/cooperatives
- POST /api/cooperatives
- GET /api/cooperatives/{id}

### Advisory

- POST /api/advisory/request
- GET /api/advisory/requests
- GET /api/advisory/requests/{id}
- POST /api/advisory/response

### Soil

- POST /api/soil/request
- GET /api/soil/requests
- GET /api/soil/requests/{id}

### Yields

- POST /api/yields
- GET /api/yields
- POST /api/yields/sync

### Weather and risk

- GET /api/weather
- GET /api/weather/risk
- GET /api/weather/forecast

### Alerts

- GET /api/alerts
- POST /api/alerts
- PUT /api/alerts/{id}
- DELETE /api/alerts/{id}

### Dashboard

- GET /api/dashboard/summary
- GET /api/dashboard/activity

### Activity logs

- GET /api/activity
- POST /api/activity

## Request and response expectations

Each endpoint should eventually provide:

- clear request validation
- consistent success status codes
- readable error responses
- timestamps for record creation and updates
- consistent field naming conventions
- evidence/source metadata for advisory results when applicable

## Planning note

This specification describes the intended API structure for the next implementation phase. It does not yet capture the full production contract, final authentication model, or final schema details, and it does not assume any external service is configured or live without authenticated human setup and testing.
