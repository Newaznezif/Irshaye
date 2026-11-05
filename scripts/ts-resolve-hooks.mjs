/**
 * Lets `node` run the TypeScript modules under test.
 *
 * The project's own imports are extensionless (`./marketModel`), which is what bundlers
 * resolve but plain Node ESM does not, so relative specifiers without an extension get
 * their `.ts` suffix added here. Type stripping itself is built into Node 24.
 */
import { existsSync } from 'node:fs';
import { dirname, extname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && extname(specifier) === '') {
    const parent = context.parentURL ? dirname(fileURLToPath(context.parentURL)) : process.cwd();
    const candidate = resolvePath(parent, `${specifier}.ts`);
    if (existsSync(candidate)) return nextResolve(pathToFileURL(candidate).href, context);
  }
  return nextResolve(specifier, context);
}
