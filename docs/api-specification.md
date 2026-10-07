# API specification blueprint

This document defines the proposed API shape for the platform. It is a planning artifact only and does not implement the actual backend yet.

## Base URL

- Development: /api
- Future environment-specific values will be configured later

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

## Planning note

This specification describes the intended API structure for the next implementation phase. It does not yet capture the full production contract, authentication model, or final schema details.
