# Database schema blueprint

This document is a planning blueprint only. It is intentionally lightweight and subject to review during the main architecture phase.

## Purpose

The database should support core agricultural workflows for farmers, cooperatives, advisory services, weather/risk insights, and organization operations.

## Candidate entities

### users

Purpose: Core identity and access information for all system actors.

Primary key: id

Important fields:
- id
- email
- phone_number
- role
- created_at
- updated_at

Relationships:
- one-to-one or one-to-many with farmers and organizations

### farmers

Purpose: Represents individual farmers and their farm context.

Primary key: id

Important fields:
- id
- user_id
- full_name
- region
- woreda
- kebele
- farm_size
- created_at
- updated_at

Relationships:
- belongs to a user
- may belong to a cooperative
- may have many advisory requests and yield records

### organizations

Purpose: Represents agricultural organizations or partner institutions.

Primary key: id

Important fields:
- id
- name
- type
- contact_email
- contact_phone
- created_at
- updated_at

Relationships:
- may manage many cooperatives or farmers

### cooperatives

Purpose: Represents farmer groups or cooperatives.

Primary key: id

Important fields:
- id
- organization_id
- name
- location
- created_at
- updated_at

Relationships:
- many farmers may belong to one cooperative

### farmer_requests

Purpose: Stores farmer-initiated requests and inquiries.

Primary key: id

Important fields:
- id
- farmer_id
- request_type
- description
- status
- created_at
- updated_at

Relationships:
- belongs to a farmer
- may be linked to advisory responses or activity logs

### advisory_requests

Purpose: Stores advisory service requests from farmers or organizations.

Primary key: id

Important fields:
- id
- farmer_id
- request_type
- priority
- status
- created_at
- updated_at

Relationships:
- many advisory responses may be linked to one advisory request

### advisory_responses

Purpose: Stores generated or human-reviewed guidance returned to the farmer.

Primary key: id

Important fields:
- id
- advisory_request_id
- advisor_type
- response_text
- confidence_score
- created_at
- updated_at

Relationships:
- belongs to one advisory request

### soil_records

Purpose: Stores soil-related observations and recommendation inputs.

Primary key: id

Important fields:
- id
- farmer_id
- soil_type
- ph_level
- moisture_level
- nutrient_notes
- created_at
- updated_at

Relationships:
- belongs to a farmer

### yield_records

Purpose: Captures yield or production data used for analytics and cooperative reporting.

Primary key: id

Important fields:
- id
- farmer_id
- crop_type
- harvest_quantity
- unit
- season
- created_at
- updated_at

Relationships:
- belongs to a farmer

### weather_records

Purpose: Stores weather observations or app-consumed weather data for a region or farmer context.

Primary key: id

Important fields:
- id
- region
- date
- temperature
- rainfall
- forecast_summary
- created_at

Relationships:
- may be used in advisory and risk workflows

### risk_alerts

Purpose: Stores agricultural risks, hazards, or alerts.

Primary key: id

Important fields:
- id
- farmer_id
- risk_type
- severity
- message
- status
- created_at
- updated_at

Relationships:
- may belong to a farmer or a region

### activity_logs

Purpose: Captures operational activity and important system events.

Primary key: id

Important fields:
- id
- actor_type
- actor_id
- action
- entity_type
- entity_id
- created_at

Relationships:
- may reference farmers, organizations, requests, or system events

## Timestamps

The initial database design should include timestamps on most records:

- created_at
- updated_at
- deleted_at only if soft-delete is eventually adopted

## Review note

This schema is meant as a candidate set of entities only. It is not a final production schema and should be reviewed again during the main architecture phase before implementation.
