# Database schema blueprint

This document is a planning blueprint only. It is intentionally lightweight and subject to review during the main architecture phase.

## Purpose

The database should support core agricultural workflows for farmers, cooperatives, advisory services, weather/risk insights, and organization operations with a minimal but practical MVP structure.

## Core entity model

### farmers

Purpose: Represents individual farmers and their farm context.

Primary key: id

Important fields:
- id
- user_id
- full_name
- phone_number
- region
- woreda
- kebele
- farm_size
- created_at
- updated_at

Relationships:
- belongs to a user actor record when implemented
- may belong to one or more cooperatives through an explicit membership relationship
- may have many advisory requests, soil records, yield batches, and alerts

### cooperatives

Purpose: Represents farmer groups, producer groups, or cooperative organizations.

Primary key: id

Important fields:
- id
- organization_id
- name
- location
- created_at
- updated_at

Relationships:
- belongs to an organization
- may have many farmer memberships
- may aggregate yield and activity data for reporting

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
- may manage many cooperatives
- may view dashboard activity and alerts across associated groups

### farmer_cooperative_memberships

Purpose: Represents the explicit farmer-to-cooperative relationship.

Primary key: id

Important fields:
- id
- farmer_id
- cooperative_id
- membership_status
- joined_at
- created_at
- updated_at

Relationships:
- links farmers to cooperatives without overloading the farmer record itself

### advisory_requests

Purpose: Stores advisory service requests from farmers or organizations.

Primary key: id

Important fields:
- id
- farmer_id
- cooperative_id (optional)
- request_type
- priority
- status
- description
- created_at
- updated_at

Relationships:
- belongs to a farmer
- may optionally be associated with a cooperative
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
- source_context
- review_status
- created_at
- updated_at

Relationships:
- belongs to one advisory request
- may retain source or evidence context for auditability and cautious recommendations

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
- observation_notes
- created_at
- updated_at

Relationships:
- belongs to a farmer
- used as contextual input for advisory workflows

### yield_batches

Purpose: Represents a seasonal or operational collection of yield data for a farmer, cooperative, or group.

Primary key: id

Important fields:
- id
- farmer_id
- cooperative_id (optional)
- season
- crop_type
- batch_status
- sync_status
- sync_last_attempted_at
- sync_last_success_at
- created_at
- updated_at

Relationships:
- may contain many yield records
- supports cooperative synchronization and ledger-style reporting

### yield_records

Purpose: Captures individual yield records associated with a batch.

Primary key: id

Important fields:
- id
- yield_batch_id
- farmer_id
- crop_type
- harvest_quantity
- unit
- harvest_date
- created_at
- updated_at

Relationships:
- belongs to a farmer
- belongs to one yield batch

### weather_records

Purpose: Stores weather observations or provider-fetched weather data for a region or farmer context.

Primary key: id

Important fields:
- id
- region
- date
- temperature
- rainfall
- forecast_summary
- source_provider
- source_reference
- created_at

Relationships:
- may be used in advisory and risk workflows
- identifies the external provider used

### risk_alerts

Purpose: Stores agricultural risks, hazards, or alerts.

Primary key: id

Important fields:
- id
- farmer_id
- cooperative_id (optional)
- region
- risk_type
- severity
- message
- status
- enabled
- created_at
- updated_at

Relationships:
- may belong to a farmer, cooperative, or region
- uses severity, status, and enabled flags for alert lifecycle management

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
- may reference farmers, cooperatives, organizations, requests, or system events

## Notes on model clarity

- The farmer-to-cooperative relationship is explicit through farmer_cooperative_memberships rather than a hidden or overloaded field.
- Yield data is represented through yield_batches and yield_records instead of a single flat yield table.
- Weather data is provider-aware and should not be treated as a proprietary single-source dataset without source metadata.
- Advisory responses support evidence and review context to avoid presenting uncertain information as certain.
- Risk alerts include severity, status, and enabled fields so they can be active or disabled without deleting records.

## Timestamps

The initial database design should include timestamps on most records:

- created_at
- updated_at
- deleted_at only if soft-delete is eventually adopted

## Review note

This schema is meant as a candidate set of entities only. It is not a final production schema and should be reviewed again during the main architecture phase before implementation.
