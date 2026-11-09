/**
 * Lets `node` run the TypeScript modules under test.
 *
 * The project's own imports are extensionless (`./marketModel`), which is what bundlers
 * resolve but plain Node ESM does not, so relative specifiers without an extension get
 * their `.ts` suffix added here. The tsconfig `@/*` alias is mapped to the repository root
 * for the same reason: a module that imports `@/lib/supabaseAdmin` has to stay importable
 * from a test, not only from a bundler. Type stripping itself is built into Node 24.
 */
import { existsSync } from 'node:fs';
import { dirname, extname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/') && extname(specifier) === '') {
    const candidate = resolvePath(ROOT, specifier.slice(2));
    for (const path of [candidate, `${candidate}.ts`]) {
      if (existsSync(path)) return nextResolve(pathToFileURL(path).href, context);
    }
  }
  if (specifier.startsWith('.') && extname(specifier) === '') {
    const parent = context.parentURL ? dirname(fileURLToPath(context.parentURL)) : process.cwd();
    const candidate = resolvePath(parent, `${specifier}.ts`);
    if (existsSync(candidate)) return nextResolve(pathToFileURL(candidate).href, context);
  }
  return nextResolve(specifier, context);
}
