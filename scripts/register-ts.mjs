/**
 * Registers the resolver hook for `npm run test:market`.
 *
 * `--import` runs this before the test file loads, so the TypeScript modules the suite
 * imports are found by their extensionless project specifiers.
 */
import { register } from 'node:module';

register('./ts-resolve-hooks.mjs', import.meta.url);
