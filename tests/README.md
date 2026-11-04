# Tests

**No unit-test runner is installed.** Stating that plainly is better than implying coverage that does not exist.

## What validates the code today

| check | command | what it proves |
| --- | --- | --- |
| types | `npm run typecheck` | the provenance and connector unions compile under `strict` |
| lint | `npm run lint` | ESLint plus the React Compiler rules; 0 errors, 0 warnings |
| build | `npm run build` | every route prerenders or compiles for real |
| live contracts | `npm run check:data` | every data route against a running server: response shapes, provenance fields, value kinds, units and dates present, invalid input rejected without leaking data, no credentials or signed upstream URLs in any response, sync guarded |

`scripts/check-data-routes.mjs` is the integration layer. It is a contract checker rather than a unit suite because the risk in this product is not arithmetic — it is a value arriving without a source, or a failed publisher being dressed up as data. It currently asserts 1,540 checks against live upstreams.

## What still needs tests

Pure functions with no network dependency, exported specifically so they can be tested:

- `lib/crops/suitability.ts` — verdict boundaries, `unknown` when a calendar is missing
- `lib/data/worldBank.ts` — `parseWbIndicator`, `parseWbCurrencyCsv`
- `lib/data/openMeteo.ts`, `lib/data/nasaPower.ts` — response parsing and failure mapping
- `lib/advisor/evidence.ts` — that a failed connector yields a gap, never a fact
- `lib/advisor/server.ts` — that abstention happens locally, before a paid call

First step: add a runner (Vitest is the natural fit) and a `test` script. Until then, `npm run check:data` plus typecheck/lint/build is the verification story, and no screen should claim more.
