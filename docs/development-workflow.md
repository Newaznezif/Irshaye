# Development workflow

## Daily loop

```bash
npm install
npm run dev            # http://localhost:3000 — no keys required
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint incl. the React Compiler rules
npm run build          # production build
npm run check:data     # live contract check against the running server
```

`npm run check:data` needs a server on port 3000 (`npm run dev` or `npm run start`). It calls every data route with valid and invalid parameters, asserts the provenance envelope, asserts that failures carry no leaked data or credentials, and finishes with a pass count. Treat a red assertion as a product bug, not a test flake: each one encodes a promise made to a farmer.

Do not pipe a long-running server (`npm run dev | head -n`). The pipe closes and kills the server with `SIGPIPE`.

## Branching

- `main` — the pushed baseline.
- `feat/irshaye-core-platform` — the current implementation branch.
- `feature/*`, `fix/*`, `docs/*` for subsequent work.

Pull before starting significant work. Commit small, coherent changes; the message should say why, not what.

## Before calling a change done

1. `typecheck`, `lint`, and `build` are clean. Do not add `eslint-disable` unless the rule is genuinely wrong here, and say why in the comment.
2. `check:data` passes.
3. Any new value shown to a user carries source, units, and date, and states its `valueKind`.
4. Every failure path renders an honest unavailable state. No placeholder, no silent zero, no cached-forever fallback.
5. A reference figure without a citable source stays `null` and renders as a gap.
6. Nothing claims yield, income, water savings, or a soil diagnosis.
7. Screens that report integration status probe the integration; they do not echo configuration.

## Reviews should catch

- a connector returning invented data when the publisher failed;
- modelled or derived numbers presented as measurements;
- business logic that reaches into a channel or UI layer;
- `useMemo`/`useCallback` added where the React Compiler already handles it, or a lint rule suppressed instead of the effect restructured (the correct shape for a client-only store read is `useSyncExternalStore`);
- a `metadata` export inside a `"use client"` file (it must be a server `page.tsx` wrapper around a `*View.tsx`);
- a credential or upstream URL with a signature reaching a response.

## Testing status, stated honestly

There is **no unit-test runner installed** in this repository. Validation today is: the live route contract checker, the TypeScript compiler, ESLint with the React Compiler rules, the production build, and manual page checks against the running app. Pure parsers (`parseWbIndicator`, `parseWbCurrencyCsv`, the crop suitability functions) are exported for tests specifically so a runner can cover them later — adding Vitest (or similar) is the first step of that work.

Nothing in this document, and nothing in the app, may claim an integration works without a successful request against it in this deployment.

## Infrastructure isolation

This project runs on its own infrastructure. Nexus AgriRise is a separate live product on another machine: never reuse its credentials or connection strings, never add it as a remote, never run a migration or a sync against its database, and never deploy IRSHAYE into its Vercel project. Verify `git remote -v` and the current branch before any push, and report the change set first.
