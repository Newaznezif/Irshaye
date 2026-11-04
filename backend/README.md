# Backend

**Not implemented, and not planned for the MVP.**

This folder is a placeholder left from the planning phase, which assumed a separate Python/FastAPI service. The approved architecture is Next.js-first: the route handlers under `app/api/` are the platform's service layer and `lib/` holds the business logic.

Nothing here should be mistaken for a backend. If a requirement eventually needs something a route handler cannot provide — a long-running worker, a socket, a Python-only model — it will be proposed with that reason stated, not added by default.

The rule that survives either way: business logic must not depend on a channel or a transport. `lib/advisor`, `lib/crops`, `lib/soil`, and everything in `lib/data` are plain TypeScript modules with no HTTP or React imports, so any future process can call them directly.
