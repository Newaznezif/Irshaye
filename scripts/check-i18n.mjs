#!/usr/bin/env node
/**
 * Locale integrity checker for the i18n layer.
 *
 * Answers one question honestly: is every interface key translated in every
 * language, with the interpolation tokens and emphasis markers it needs?
 * A key that drifted, a `{count}` renamed, or a `[[ ]]` pair dropped would all
 * silently break the rendered sentence, so all three are compared against the
 * English source of truth here rather than in a browser.
 *
 * Run with `npm run check:i18n`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'i18n', 'locales');
const LOCALES = ['en', 'ru', 'am', 'om', 'sw'];

/**
 * Entries are read from the source text, not by importing it: these files are
 * TypeScript with a `Dictionary` annotation, and the checker must run without a
 * build step. A key starts a line at two-space indent, so entries split there.
 */
function parse(source) {
  const body = source.slice(source.indexOf('= {'));
  const chunks = body.split(/(?=^\s{2}')/m).filter((chunk) => /^\s{2}'/.test(chunk));
  const entries = [];
  for (const chunk of chunks) {
    const key = chunk.match(/^\s{2}'((?:[^'\\]|\\.)+)':/);
    if (!key) throw new Error(`Unparseable entry: ${chunk.slice(0, 60).trim()}`);
    // Everything after `':` up to the final `,` of the entry is the value.
    const value = chunk
      .slice(key[0].length)
      .replace(/,\s*$/, '')
      .trim();
    entries.push({ key: key[1], value });
  }
  return entries;
}

const tokens = (text, re) => (text.match(re) ?? []).sort();
const PLACEHOLDER = /\{[A-Za-z0-9_]+\}/g;

const dictionaries = new Map();
for (const code of LOCALES) {
  const entries = parse(readFileSync(join(ROOT, `${code}.ts`), 'utf8'));
  const seen = new Set();
  for (const { key } of entries) {
    if (seen.has(key)) console.error(`✗ ${code}: duplicate key ${key}`);
    seen.add(key);
  }
  dictionaries.set(code, entries);
}

const en = dictionaries.get('en');
const enKeys = en.map((entry) => entry.key);
const problems = [];

for (const code of LOCALES.filter((c) => c !== 'en')) {
  const entries = dictionaries.get(code);
  const byKey = new Map(entries.map((entry) => [entry.key, entry.value]));

  if (entries.length !== en.length) {
    problems.push(`${code}: ${entries.length} entries, en has ${en.length}`);
  }

  en.forEach((source, index) => {
    const value = byKey.get(source.key);
    if (value === undefined) {
      problems.push(`${code}: missing key ${source.key}`);
      return;
    }
    if (value === "''" || value === '""') problems.push(`${code}: empty value for ${source.key}`);
    const mine = tokens(value, PLACEHOLDER);
    const theirs = tokens(source.value, PLACEHOLDER);
    if (mine.join() !== theirs.join()) {
      problems.push(`${code}: ${source.key} placeholders ${JSON.stringify(mine)} ≠ ${JSON.stringify(theirs)}`);
    }
    const accentMine = (value.match(/\[\[/g) ?? []).length;
    const accentTheirs = (source.value.match(/\[\[/g) ?? []).length;
    if (accentMine !== accentTheirs) problems.push(`${code}: ${source.key} emphasis markers ${accentMine} ≠ ${accentTheirs}`);
    for (const glue of [/^\s/, /\s$/, /^[;,.\-–—]/, /[;,.\-–—]$/]) {
      if (glue.test(source.value) !== glue.test(value)) {
        problems.push(`${code}: ${source.key} leading/trailing glue differs from en (${JSON.stringify(source.value)} / ${JSON.stringify(value)})`);
      }
    }
    // Same key order is not required, but a drifted entry usually means a copy-paste slip.
    if (entries[index]?.key !== source.key) problems.push(`${code}: ${source.key} is out of en order`);
  });

  for (const entry of entries) {
    if (!enKeys.includes(entry.key)) problems.push(`${code}: unknown key ${entry.key}`);
  }
}

const coverage = LOCALES.map((code) => {
  const translated = dictionaries
    .get(code)
    .filter((entry) => byKeyDiffers(entry, code));
  return `${code} ${translated.length}/${en.length}`;
});

/** An entry counts as translated when its value is not the English string verbatim. */
function byKeyDiffers(entry, code) {
  if (code === 'en') return true;
  const source = en.find((candidate) => candidate.key === entry.key);
  return source !== undefined && source.value !== entry.value;
}

console.log(`Locale files: ${LOCALES.join(', ')}`);
console.log(`English keys: ${en.length}`);
console.log(`Translated (not English-verbatim): ${coverage.join(' · ')}`);

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} locale problem(s):`);
  for (const problem of problems.slice(0, 60)) console.error(`  ${problem}`);
  if (problems.length > 60) console.error(`  … ${problems.length - 60} more`);
  process.exit(1);
}

console.log('\n✓ All locales carry every key, every placeholder, and every emphasis marker.');
