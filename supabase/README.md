# Supabase

Supabase is the managed PostgreSQL platform for this project.

`supabase/migrations/` holds the numbered SQL pack and its README, which is the authoritative list
of what each file creates and what has been applied. Read that file before touching this directory.

Current status:
- **not configured** — `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are unset locally
  and in the Vercel project. No `.env` file with real values is committed, and none should be.
- **no database created for this project**, therefore no migration in the pack has been applied
  anywhere. The pack has only ever been executed against a throwaway in-process PostgreSQL used to
  check that it parses and enforces what it claims.
- **no production credentials committed**, and none requested in a chat, a log, or source.

Consequences you should expect while the credentials stay unset:
- Reads that would come from the database cannot be served. The routes say so and the UI renders an
  explicit setup state instead of invented numbers.
- The device ingestion endpoint (`POST /api/v1/hardware/logs`) is reachable and validates requests,
  but refuses to store with `503 database_not_configured`.
- The device-management endpoints (`/api/hardware/devices*`) are reachable and deny every caller who
  cannot present a session the Auth server confirms — `401 unauthenticated`, before any body, path or
  query is read. With no project there is no Auth and no membership table, so nothing beyond that
  gate can be exercised locally; `npm run check:management` proves the gate and
  `npm run test:management` grades the decisions, and neither claims the rest.
- `docs/field-intelligence-setup.md` documents the exact variables, the apply order for all twelve
  files, the operator SQL that seeds a cooperative and its first manager, and the verification
  queries for when a project is created.

One rule from AGENTS.md is worth repeating here: migrations are run by a human, not by an agent.
This repository can prepare SQL and prove it valid; it does not apply it.
