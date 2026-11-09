# API specification

The routes in the sections marked *implemented* exist and are exercised by `npm run check:data`
(publisher reads), `npm run check:field` (the device ingestion route) and `npm run check:management`
(the device-management routes). The final section lists the record-oriented routes that are still
only designed — they need a provisioned Supabase project (see `docs/database-plan.md`) and are **not
implemented**.

## Conventions (implemented)

- JSON bodies, REST-style paths under `/api`, standard status codes.
- Every successful response is `{ ok: true, data, provenance }` — with one exception, the device
  route below, whose envelope carries no `provenance`.
- Every failure is `{ ok: false, error: { code, message, status?, retryAfterSeconds? }, provenance }`.
  `provenance` is `null` only when the request was rejected before any upstream call, so there is genuinely no publisher behind the answer.
- The upstream response body is never forwarded. Messages are status-only and capped at 200 characters.
- Error codes map to stable statuses (`lib/data/api.ts`):

| code | status | meaning |
| --- | --- | --- |
| `bad_input` | 400 | rejected before any upstream call |
| `no_data` | 404 | publisher has nothing for this place/window |
| `rate_limited` | 429 | upstream 429 after retries |
| `timeout` | 504 | upstream did not answer in time |
| `network` | 502 | transport failure |
| `http_status` | 502 | unexpected upstream status |
| `payload_too_large` | 502 | response exceeded the byte cap |
| `parse_failed` | 502 | response was not the published shape |
| `auth_required` | 502 upstream credentials missing / 401 for the sync caller's own secret |
| `not_configured` | 502 | this deployment lacks the variable |

- The read-only routes take no credentials on purpose: they expose published figures only. Anything a
  farmer owns sits behind `verifyCaller` — which today means the device-management surface below, and
  the dashboard routes that will reuse it.

## Implemented routes

### `GET /api/data/locations`

Selectable places. `regions=1` adds geoBoundaries ADM1 outlines.

Returns `places`, `marketCatalogue`, `default`, `regionNames`. Names and coordinates are WFP's own, so a selected point is a real market centre rather than a guessed pin.

### `GET /api/data/weather`

Open-Meteo. Location comes from `lat`+`lon` (both or neither) or `place` or `market`.

| param | default | notes |
| --- | --- | --- |
| `mode` | `forecast` | `history` switches to the ERA5 daily archive and requires `start`/`end` as `YYYY-MM-DD` |
| `days` | `7` | forecast days, 0–7 |
| `pastDays` | `7` | analysed past days, 0–92 |
| `hourly` | on | `hourly=0` drops the hourly series |

Response adds `withinEthiopia` (the platform's own coverage flag, not a publisher claim). Cache: 15 minutes forecast, 24 hours history.

### `GET /api/data/agroclimate`

NASA POWER daily series and the 30-year normals. `lat`/`lon` or `place`/`market`, `days` window length. Rows carry `sufficientCoverage`; when coverage is insufficient the derived comparisons are withheld instead of computed on thin data.

### `GET /api/data/markets`

WFP rEMS grain prices via HDX.

| param | notes |
| --- | --- |
| `mode` | `overview` \| `market` \| `timeseries` (publisher's own shapes) |
| `market`, `commodity`, `region` | filter to a published market, product, or region |
| `months`, `limit` | window and row cap |
| `priceType`, `grainsOnly` | publisher's price type; grain-only filter |

Prices are the publisher's figures with the publisher's observation dates. IRSHAYE never interpolates a missing price.

### `GET /api/data/exchange`

NBE official rates and the World Bank parallel-rate benchmark. `focus` (`all` | `official` | `parallel`), `codes`, `date`, `months`, `points`.

### `GET /api/data/geospatial`

NASA GIBS layers and ArcGIS boundaries. `view` selects `layers` | `vectors` | `vector`; `layer`, `date`, `lat`/`lon`, `bbox`, `level`, `detail`, `limit`, `offset` refine it. NDVI/EVI responses state that they describe plant cover, not soil quality.

### `GET /api/data/status`

Per-publisher probe results — who answered, how fast, what the provenance said. `sources=light` runs the cheap subset; an explicit `sources`/`ids` list selects specific publishers (unknown ids are a 400 `bad_input` with no data leaked). `persisted=1` adds the sync pipeline state when a database is configured.

### `GET` / `POST /api/data/sync`

`GET` reports whether the pipeline is configured, the five live tasks plus the one gated on a database table, and the table it waits on — never any secret material.
`POST` runs the publisher → database sync and is the only data route that writes; it requires `authorization: Bearer $SYNC_SECRET`, compared in constant time, answering `401` with `no-store` when absent or wrong. Concurrent runs return `skipped_overlap`. It needs `SUPABASE_SERVICE_ROLE_KEY` and therefore has no effect until a database exists.

### `GET /api/advisor/status`

`{ "configured": boolean }` — whether this deployment holds a `GEMINI_API_KEY`. Reported live, so the Settings page cannot claim an integration that is not there.

### `POST /api/advisor`

Request:

```json
{ "latitude": 9.02, "longitude": 38.75, "placeName": "Addis Ababa", "cropId": "teff", "question": "..." }
```

`cropId` is required; `question` must be at least a few words; `placeName` is truncated to 120 characters.

Response `200`:

```json
{ "ok": true, "answer": { "abstained": false, "headline": "...", "recommendation": "...", "evidenceUsed": ["w-1"], "uncertainty": "...", "limitations": ["..."] }, "evidence": { "items": [...], "gaps": [...] } }
```

- `answer.abstained` is `true` when the evidence could not support a reply. Abstention happens locally, before a model call is spent.
- `evidence.items[]` each carry `kind` (`observed` | `forecast` | `modeled` | `estimated` | `reference`), the value, units, publisher, and retrieval time; `evidence.gaps[]` name what was missing.
- `503 advisor_not_configured` when the key is absent, `502 advisor_failed` when the provider's reply could not be validated. Neither produces a substitute answer.
- The route writes nothing and stores nothing.

## Device ingestion (implemented, storage pending a database)

### `POST /api/v1/hardware/logs`

The only route a physical sensor calls. It is deliberately outside the publisher conventions:
its envelope is `{ ok, message, error, timestamp, data }` **without** `provenance`, because the
device is the source — there is no upstream publisher to attribute, and a fabricated provenance
block would be a lie about where the number came from.

Request: `content-type: application/json`, body at most 8 KiB, read as a capped stream (an
oversize body is refused at 413 before it is ever parsed).

```json
{
  "node_id": "ESP32_FIELD_NODE_01",
  "secret_token": "<issued once at provisioning>",
  "measured_at": "2026-11-05T09:40:00Z",
  "soil_moisture": 31.4,
  "ambient_temp": 24.8,
  "humidity": 55.2,
  "battery_voltage": 4.18
}
```

Rules enforced before anything is inserted:
- `node_id` is 3–63 characters of `[A-Za-z0-9._:-]`, starting with a letter or digit; `secret_token`
  is the 16–128 character credential issued at provisioning.
- `measured_at` is optional. When present it must be parseable ISO-8601 and is normalised to UTC;
  it may be up to 15 minutes ahead of the server clock (device clocks drift) and up to 72 hours
  behind (a node that missed its window). Outside that it is `400 timestamp_out_of_window` rather
  than a silently backdated row. When absent, the receipt time is used and the row records
  `time_source: server` so the UI can say the measurement time is ours, not the device's.
- The four measurement fields are each optional but must be a finite JSON number inside its
  physical range when present (`soil_moisture` 0–100 %, `ambient_temp` −40–60 °C, `humidity` 0–100
  %, `battery_voltage` 0–30 V). Out of range is rejected, not clamped; a string `"42.5"` is
  rejected, not coerced. At least one of the four must be reported.
- `secret_token` is matched against the node's stored SHA-256 digest in constant time. The plaintext
  is scrubbed recursively from the body before it is stored in `raw_payload`, so the database cannot
  acquire a credential by accident.
- Replay protection: the canonical form of the payload is hashed and
  `(node_id, measured_at, payload_hash)` is unique, so an identical resend is `409
  duplicate_reading`, not a second row.
- Per-device throttle: 20 submissions per 60 seconds per node, per server process. The `GET`
  descriptor says `shared: false` — this is not a production-grade distributed limiter, and the
  durable bound is the database constraint, not the memory.

`GET /api/v1/hardware/logs` returns the self-descriptor: accepted method, content type, byte cap,
required and optional fields, the rules above, and whether the database is configured. It is the
documentation an installer can read from the device firmware's point of view.

These codes map to statuses in `lib/field/authorize.ts`, entry by entry, and `npm run test:field`
asserts the whole map:

| code | status | meaning |
| --- | --- | --- |
| `invalid_content_type` | 400 | body was not JSON |
| `payload_too_large` | 413 | body exceeded 8 KiB |
| `malformed_json` | 400 | not parseable |
| `invalid_payload` | 400 | shape, length, range or timestamp-format violation |
| `timestamp_out_of_window` | 400 | too far ahead of the clock, or older than 72 h |
| `invalid_credentials` | 401 | digest mismatch, or the credential was revoked |
| `not_provisioned` | 401 | node is registered but holds no credential yet |
| `credential_expired` | 403 | lifecycle end date passed |
| `device_disabled` | 403 | node status is `disabled` |
| `unknown_node` | 404 | no such `node_id` |
| `duplicate_reading` | 409 | replay of an identical reading |
| `rate_limited` | 429 | over the per-device budget; `retry-after` set |
| `database_not_configured` | 503 | the deployment lacks the Supabase variables |
| `database_unavailable` | 503 | configured, but the database did not answer |
| `internal_error` | 500 | anything else; detail stays in the server log |

`node_id` is treated as **not** a secret — it is printed on the device label — which is why
`unknown_node`, `not_provisioned` and `credential_expired` are distinguishable for a field
installer. `secret_token` is the only secret, and no response, log line or stored row carries it.

Once a reading is stored and the heartbeat stamped, the alert rules covering that device are evaluated
in the same request and the outcome is reported additively in `data.alert_evaluation`: `performed`,
`rules_considered`, `raised[]`, `confirmed[]`, `resolved[]`, `suppressed[]`, `skipped[]`, `failures[]`,
`triggered_by` and a `note`. When the evaluation could not run at all the object is exactly
`{ performed: false, reason }` — the reason being the refusal code, or `evaluation_threw`.

**Nothing in that step changes this response.** A stored reading is accepted with 201 even when
alerting cannot run at all. The reasoning is the one an operator needs after an alerting failure: the
stored row is the field's own data, while an alert is a derived *judgement* about it, and refusing a
valid reading because the judgement could not be computed would destroy the evidence that answers
"what did it actually report". A failure inside the evaluator is caught, logged server-side with the
node id and never with a driver string, and answered as `performed: false` with a reason — never as a
5xx at the device, and never as silence. `npm run test:fieldintel` grades the ordering (evaluation
strictly after the insert, no refusal path after it) and the published descriptor restates it in words,
so a firmware build written before alerting exists is unaffected by the fields it ignores.

Authentication is server-side only: the route uses the non-public service-role client
(`lib/supabaseAdmin.ts`), which refuses to run in a browser. No device credential is ever returned
by a public read, and the row shape the dashboard layer will use (`toDeviceSummary`,
`lib/field/deviceService.ts`) omits `token_hash` by construction — an assertion in
`npm run test:field`, not a convention.

## Device management (implemented, storage pending a database)

Eight endpoint/method pairs across seven route files under `/api/hardware/devices`, all requiring a
session. None of them is reachable
without one: `openManagement()` (`lib/field/managementApi.ts`) confirms the bearer token with the
Auth server **before** it reads a body, resolves a path segment, or queries anything, so an
unauthenticated call is a `401 unauthenticated` with `www-authenticate: Bearer realm="irshaye-session"`
and `data: null` — never a validation message that would map the API for free. `npm run
check:management` asserts that gate on every one of the eight; `npm run test:management` grades the
authorization decisions it cannot reach without real memberships.

**What a caller must hold.** Three things, all checked server-side, in this order:

1. a confirmed session — `verifyCaller` (`lib/serverSupabase.ts`) asks Supabase Auth who the token
   belongs to. A user id in a header, cookie or body is not consulted;
2. a current row in `app.cooperative_members` for the cooperative that **the database** says owns
   the device — read by `resolveMemberships`, never supplied by the request;
3. that row's role must carry the capability for the action, per the table below.

| capability | viewer | manager |
| --- | --- | --- |
| `device_list`, `device_view` | yes | yes |
| `device_register`, `device_status_change` | no | yes |
| `credential_list`, `credential_provision`, `credential_rotate`, `credential_revoke` | no | yes |

The alert actions (`alert_list`, `alert_view`, `alert_acknowledge`, `alert_resolve`) live in the same
vocabulary and the same gate, and are documented with the alerting surface below.

The owner is never taken from a body. Registration names a `field_site_id` and the cooperative comes
from `getFieldSite()`; a body carrying `cooperative_id`, `role`, `secret_token`, `token` or
`token_hash` is refused `400 invalid_payload` rather than silently stripped, so a form that tries to
claim an owner learns that it failed instead of watching the claim get ignored.

**Non-disclosure.** A device, site or credential the caller cannot see is answered as
`unknown_node` / `unknown_site` / `unknown_credential` (404) with "… available to this caller", while
the audit row records the true reason (`not_a_member`). Existence is not leaked to a
cross-cooperative probe. A caller who *names* a cooperative in a query parameter is in a different
position — that id is their own claim about their own membership, so it is answered plainly as
`403 not_a_member`. `insufficient_role` (a viewer reaching a manager action) is `403`.

### `GET /api/hardware/devices`

Lists the devices in the caller's scope. Query: `cooperative_id` (narrows the scope or is refused —
it cannot widen it), `status` (one of the five lifecycle values), `limit` (default 25, max 100),
`offset` (max 10 000). Returns `devices[]`, `total`, `page`, and `visible_cooperatives` — the scope
echoed so a dashboard can state what the view covers without inferring it from the rows. A caller
with no membership gets an empty list plus a message saying so, not an error.

### `POST /api/hardware/devices`

Body: `node_id`, `name`, `field_site_id`, optionally `latitude`+`longitude`+`coordinate_source`
(all three or none), `hardware_model`, `firmware_version`. Requires `device_register` on the site's
cooperative. Creates the node `inactive` and unprovisioned; `409 device_exists` on a taken id.

### `GET /api/hardware/devices/[nodeId]`

Metadata, lifecycle state, credential *status* (`provisioned`, expiry — never a digest), and
`capabilities` for the role the database gave the caller. A successful read is not audited; a
refused one is.

### `PATCH /api/hardware/devices/[nodeId]`

Body: exactly `{ "status": "active" | "maintenance" | "disabled" }`. Anything else in the body is
refused. `inactive` is not settable — it means "this device has never authenticated", which is
history rather than intent. The response states the consequence of the new state: `disabled` means
ingestion will answer `403 device_disabled`, `maintenance` means no offline alert while readings are
still accepted.

### `GET /api/hardware/devices/[nodeId]/credentials`

The credential *history* of one device, as metadata only. Query: `limit` (1–100, default 25).
Returns `credentials[]` of `{ credential_id, hash_algorithm, issued_at, last_used_at, expires_at,
revoked_at, state }`, `returned`, `limit`, `coverage` (`partial` when the page is exactly full, so an
operator knows retired rows may sit below it), `current_credential_id` and a `note` restating that a
secret is shown once and is not retrievable.

It exists to close a real gap: `POST …/credentials/revoke` names a `credential_id`, and until now the
only ids an operator could cite were the ones an issuance or rotation response happened to return. A
retired row on a device that has since been re-provisioned was invisible.

Manager-only — `capabilityOf('credential_list')` is `manage`, so a viewer who may read the device may
not enumerate its secrets. The guarantee is structural rather than a filter that could be forgotten:
`CREDENTIAL_METADATA_COLUMNS` (`lib/field/managementService.ts`) does not name `token_hash`, so the
digest is never fetched, let alone serialised. `state` is derived because the schema holds no state
column — `retired` is `revoked_at IS NOT NULL`, `expired` is a current row whose `expires_at` passed,
`current` is the database's own one-row-per-node definition.

### `POST /api/hardware/devices/[nodeId]/credentials`

Issues the device's **first** credential. No body. `409 credential_exists` if one is already current,
with a pointer to `/rotate` — a node with two live secrets is a node whose rotation cannot be
verified.

### `POST /api/hardware/devices/[nodeId]/credentials/rotate`

Replaces the secret. No body. Revokes the current row and inserts the new one inside
`field.rotate_device_credential()`, so there is no moment with two live paths. **No grace period:**
the old secret stops working when this returns, and the response says the device must be reflashed
before its next report.

### `POST /api/hardware/devices/[nodeId]/credentials/revoke`

Body: `{ "credential_id": <positive integer>, "force": <boolean, default false> }`. Ends a specific
credential; `force: true` is the operator's acknowledgement that revoking the *current* credential
makes the device unable to report. The row survives with `revoked_at` set, because history needs to
say what was valid when. A credential id belonging to another node is answered exactly like a
credential the caller cannot see.

`device_secret` in these three responses is **the only place in this project a plaintext credential
is ever emitted**, and it is emitted once per issuance. Nothing reads it back: no log line, no audit
`detail`, no list response, and `app.management_audit` has CHECK constraints that refuse the field
names `secret_token`, `token` and `token_hash` plus any 64-hex digest. Losing a secret means rotating
it, and the message says so.

### Management codes

`MANAGEMENT_STATUS_BY_CODE` (`lib/field/access.ts`) extends the ingestion table above; a code
without an entry is a compile error rather than an undocumented 200.

| code | status | meaning |
| --- | --- | --- |
| `unauthenticated` | 401 | no bearer token, or Auth did not confirm it |
| `auth_unavailable` | 503 | Auth could not be asked — a denial, never a pass |
| `not_a_member` | 403 | caller named a cooperative they are not in |
| `insufficient_role` | 403 | viewer asked for a manager action |
| `unknown_site` | 404 | no such field site, or not yours |
| `unknown_node` | 404 | no such device, or not yours |
| `unknown_credential` | 404 | no such credential, or not on your device |
| `device_exists` | 409 | `node_id` already registered |
| `credential_exists` | 409 | the device already holds a current secret |

`invalid_payload` (400) and the two database states carry over from the ingestion table above rather
than being re-invented: revoking a node's only current credential without `force`, a `PATCH` body
with a second key, and a registration naming an owner are all the same answer for the same reason —
the request asked for something the schema does not permit.

Every one of these responses is `cache-control: no-store`, and the failure envelope is always
`{ ok: false, message, error: { code, message }, data: null }` — a cached device list is a cached
view of another cooperative's hardware.

### Audit

`app.management_audit` records actor id, role, cooperative id, node id, action, outcome
(`success` / `refused` / `failed`), reason code and a small sanitised `detail` object. It is
append-only at the database level (`before update or delete` trigger), has no foreign keys — an
audit row must be able to describe a nonexistent site, and must outlive the account it names — and
is granted `select, insert` only. The known limit: a request refused before a session was confirmed
has no actor to record, so those refusals are not in the trail; they are in the access log.

## Field Intelligence reads and alert management (implemented, storage pending a database)

Nine dashboard reads under `/api/field`, plus two alert actions. They share the session gate, the
membership resolution and the failure envelope described above — `openScopedRead(request, action)`
adds one thing on top: it turns the caller's memberships into a **scope** (the list of cooperative ids
this request may touch) and lets `?cooperative_id=` narrow that scope, never widen it. Naming a
cooperative you are not in is your own relationship to talk about, so it is answered plainly as
`403 not_a_member` and audited; a device you cannot see is answered as `404 unknown_node`.

| action | capability | used by |
| --- | --- | --- |
| `overview_read`, `map_read`, `site_list`, `site_view`, `observation_read`, `alert_list`, `alert_view` | read — viewer and manager | the nine GETs |
| `alert_acknowledge`, `alert_resolve` | manage — manager only | the two POSTs |

Every response is `cache-control: no-store`, every failure is
`{ ok: false, message, error: { code, message }, data: null }`, and every code in
`MANAGEMENT_STATUS_BY_CODE` (`lib/field/access.ts`) has a row above or below — a code without an entry
is a compile error rather than an undocumented 200.

| code | status | meaning |
| --- | --- | --- |
| `unknown_alert` | 404 | no alert with that id **available to this caller** |
| `database_not_configured` / `database_unavailable` | 503 | the deployment lacks the Supabase variables, or the database did not answer |

`unknown_alert` is 404 rather than 403 for a foreign id on purpose. An `alert_id` is a small integer
handed out in order — the easiest thing in this API to enumerate — so a nonexistent id and another
cooperative's id get a byte-identical answer, while `app.management_audit` records the true reason
(`not_a_member`).

### `GET /api/field/alerts`

The conditions the platform has already raised, and the rules that raised them. Query: `status`
(`open` | `acknowledged` | `resolved` | `dismissed`), `severity` (`info` | `warning` | `critical`),
`limit` (1–100, default 25), `offset` (0–10 000), `cooperative_id`. Returns `alerts[]`, `total`,
`page`, `coverage`, `configured_rules[]`, `rules_coverage`, `visible_cooperatives`.

`total` is counted with the same predicate as the rows, so a footer cannot say something the list does
not contain. `coverage` is `partial` when the scoped node list hit `SCOPE_NODE_CAP` (200) — the count
is then a floor, and the UI says so.

**This route evaluates nothing.** An alert is a row `field.device_alerts` holds and a threshold is a
number an operator wrote into `field.alert_rules`; inventing a limit in a browser tab would be an
agronic opinion wearing IRSHAYE's interface about soil this deployment knows nothing about. The rules
are returned beside the alerts so a farmer can read the number that fired and who chose it.

### `GET /api/field/alerts/[alertId]`

One condition and its evidence. Scope is established by walking `alert_id` → `node_id` →
`cooperative_id`, because `field.device_alerts` carries no cooperative column of its own. Returns
`alert`, `device` (the six fields the node row was read for), `rule`, `rule_note`, `evidence` (the
stored `detail` object), `evidence_note`, `status`, `allowed_transitions`, `capabilities`.

`rule_note` distinguishes the two kinds of blank: a rule id that resolves, and a null `alert_rule_id`,
which is the platform's own integrity check — a row with no rule behind it was not raised by a
threshold. `allowed_transitions` is a hint for the UI, not a permission; the action routes re-run
`decideAccess` and re-read the row, so a button built from a stale list still gets the honest answer.

### `POST /api/field/alerts/[alertId]/acknowledge`

No body. `open` → `acknowledged`: a person has seen it and the condition still holds. Returns `alert`,
`previous_status`, `changed`, `allowed_transitions`.

Three properties worth stating, because they are what makes the endpoint safe to retry:

- the write is a **compare-and-set on the status the read saw**, so two managers clicking at once
  produce one change and one honest `changed: false` rather than a lost update;
- if the row already says `acknowledged`, that is a successful no-op with nothing written — an
  acknowledgement is a statement that can be repeated;
- a row in `resolved` or `dismissed` cannot move back, and says so as `400 invalid_payload` instead of
  pretending.

Audited on success, on refusal (with the reason code) and as `failed` when the database did not answer.

### `POST /api/field/alerts/[alertId]/resolve`

No body. `open` **or** `acknowledged` → `resolved`. Manager-only: closing an incident record is a
statement about the field, and a viewer's role does not carry it.

`status` and `resolved_at` are written in the same statement because
`device_alert_closed_only_with_timestamp` makes them one fact. The caller supplies no timestamp — this
is when the platform was told, and letting a client set it would be a way to backdate who fixed what.

The response carries `if_the_condition_returns`, because this is the surprise the endpoint would
otherwise cause: **resolving does not silence a rule.** If the condition still holds, the next reading
that breaches it raises a NEW alert — the partial unique index guarantees one *open* row per device and
type, not one row forever. An alert that keeps coming back is not a duplicate; it is the sensor still
saying the same thing.

### `GET /api/field/devices/[nodeId]/history`

One device's stored past, as statistics rather than as rows. The device is authorized first, exactly as
`/readings` does it — `field.sensor_logs` has no cooperative column, which makes the device's ownership
the only thing between a caller and another farm's field history.

Query is the window grammar: `range` (`24h` | `7d` | `30d` | `custom`), or `from`+`to` for `custom`
(both or neither). A custom window may span at most **366 days**, `from` must precede `to`, and `to`
may not sit in the future beyond the same 15-minute clock skew the ingestion route allows.

Returns `device`, `window`, `scanned_window`, `coverage`, `total_in_range`, `rows_scanned`,
`scan_cap` (2000), `all_time_observations`, `offline_window_minutes`, `basis`, `rules_coverage`, and
`summary` — `{ window, bucket_size, rows_scanned, metrics[], reporting, quality, buckets[] }`.

- `metrics[]` is per quantity: `samples`, `missing`, `reporting_rate`, `minimum`, `maximum`, `mean`,
  `median`, `latest_value`, `latest_measured_at`, `first_measured_at`, `at_range_edge`. A quantity the
  device never sent comes back `samples: 0` with null statistics — never 0, never interpolated, never
  zero-filled.
- `reporting` is the cadence: `observation_count`, `first/last_measured_at`, `freshness_seconds`,
  `receipt_freshness_seconds` (they differ whenever a device backfills), `mean/median_interval_seconds`,
  `largest_gap_seconds`, `gap_threshold_seconds`, `unexpected_gap_count`, `reference`.
- `quality` is `server_stamped_count`, `duplicate_instants[]`, `duplicate_instant_count`,
  `unparseable_timestamp_count`, `is_stale`, `stale_after_seconds`, `no_readings_in_window`,
  `missing_by_metric`.
- `buckets[]` is the trend: `bucket_start`, `bucket_end`, `readings`, and the four units-suffixed means
  (`soil_moisture_pct`, `ambient_temp_c`, `humidity_pct`, `battery_voltage_v`). Hour buckets up to a
  3-day span, day buckets beyond, capped at 700 points, and aligned to **Africa/Addis_Ababa** (UTC+3,
  no DST) so an operator's day opens at 04:00 UTC the evening before rather than at a UTC midnight they
  never experience. An hour nobody reported in holds nulls and is drawn as a gap, not a zero.

`basis` and `coverage` say which numbers are exact counts and which come from the capped newest-first
scan; when the window holds more readings than the cap, `scanned_window` names the span the statistics
actually describe.

### `GET /api/field/data-quality`

How well the fleet is reporting, before anyone asks what it said. A dashboard that only shows readings
cannot answer the question an operator starts with: is the field quiet because nothing is happening, or
because nothing is talking.

Query: `cooperative_id`, and the same `range`/`from`/`to` grammar. Returns `window`, `scanned_from`,
`totals` (`devices`, `never_contacted`, `without_observations`, `without_observations_basis`,
`observations_in_window`), `scanning`, `reference`, `stale_devices`, `missing_data[]`,
`at_store_bounds[]`, `duplicates`, `server_stamped`, `unparseable_timestamps`, `reporting_gaps`,
`devices[]`, `rules_coverage`, `store_bounds_are_not_thresholds`.

Three things it deliberately does not do:

- **It does not judge.** "Stale" is measured against an `offline` rule a manager configured. With no
  such rule the response returns ages, intervals and counts with `reference.basis: 'not_configured'`
  and null verdicts — how long a farm's sensor may be silent is a fact about that farm's power supply
  and network, not about this code.
- **It does not present a scan as a total.** Every headline number is an exact count query; per-device
  detail comes from a capped scan (2 000 readings, 200 nodes) whose `coverage` travels with it. Where
  the scan cannot prove an absence the answer is null, not zero. `reporting_gaps.covers_from` names the
  instant below which the gap count is silent rather than empty.
- **It does not evaluate rules or write alerts.** Read-only, like every other endpoint here.

`at_store_bounds` counts readings sitting exactly on a bound of the range `field.sensor_logs` enforces.
A value outside those bounds could not have been stored, so a reading parked on one is a hint about a
sensor's wiring or clipping. That is why the flag `store_bounds_are_not_thresholds: true` is in the
body: these are the schema's storage limits, not an agronomic recommendation, and no consumer may
render them as one.

### The already-documented reads

`GET /api/field/overview`, `/api/field/sites`, `/api/field/sites/[siteId]`,
`/api/field/devices/[nodeId]/readings` and `/api/field/map` share this gate and this envelope; they
were delivered in Phase 5 and are described in `docs/field-intelligence-setup.md`. The map returns
stored coordinates only, and a device with no coordinate is counted as unmapped rather than placed.

## Planned, not implemented

`/api/farmers`, `/api/cooperatives`, `/api/organizations`, `/api/advisory/*`, `/api/soil/*`, `/api/yields*`, `/api/activity`, `/api/dashboard/*`, `/api/health`.

Alerting is **not** on this list any more: `/api/field/alerts`, `/api/field/alerts/[alertId]` and its
two actions are implemented above. What is still missing is the authoring side — no endpoint writes
`field.alert_rules`, so thresholds can only be configured by someone with database access. That is the
honest gap, and the read routes say so rather than papering over it.

These depend on application schema beyond the device-management minimum (`app.cooperative_members`
and `app.management_audit` exist as SQL, and no migration has been applied to any database).
`docs/database-plan.md` records the wider table design and the policy intent.

