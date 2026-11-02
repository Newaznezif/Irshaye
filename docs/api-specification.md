# API specification

The routes in the first section exist and are exercised by `npm run check:data`. The second section lists the record-oriented routes that are still only designed — they need a provisioned Supabase project (see `docs/database-plan.md`) and are **not implemented**.

## Conventions (implemented)

- JSON bodies, REST-style paths under `/api`, standard status codes.
- Every successful response is `{ ok: true, data, provenance }`.
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

- The read-only routes take no credentials on purpose: they expose published figures only. Anything a farmer owns will sit behind `verifyCaller`.

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

## Planned, not implemented

`/api/farmers`, `/api/cooperatives`, `/api/organizations`, `/api/advisory/*`, `/api/soil/*`, `/api/yields*`, `/api/alerts*`, `/api/activity`, `/api/dashboard/*`, `/api/health`.

These depend on the `app.*` schema and on authentication, both deliberately postponed. `docs/database-plan.md` records the table design and the policy intent; no migration has been applied to any database.
