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

/*
 * A string a locale writes exactly as English does is one of two things: a copy somebody forgot, or
 * something that has no other form. The first is a defect; the second is correct and must be
 * *declared*, because the difference between them is invisible in the data and a list without reasons
 * is how "we'll localise it later" becomes permanent.
 *
 * `IRSHAYE` is the product's name and `AgroInnovation 2026` is the event's own printed title — a
 * brand translated is a brand lost. `%`, `°C` and `V` are unit marks: the Cyrillic locales genuinely
 * write `В` and Amharic `ቮ`, so those are translations, and the Latin-script locales writing `V` is
 * the same symbol, not an English word left behind. `ET0 mm` is a scientific symbol for reference
 * evapotranspiration with an SI unit attached; Russian localises it only by its own decimal comma.
 * Swahili `Data` is the accepted loanword in the language's own technical usage — `Takwimu` would say
 * "statistics" and change what the navigation item points at.
 */
const VERBATIM_ALLOWED = new Map([
  ['*', ['shell.moduleFallback', 'landing.eventTag', 'field.unit.percent', 'field.unit.celsius']],
  ['am', ['climate.thEt0Mm']],
  ['om', ['climate.thEt0Mm', 'field.unit.volts']],
  ['sw', ['climate.thEt0Mm', 'field.unit.volts', 'landing.navData']],
]);

const allowedVerbatim = (code, key) => {
  for (const scope of ['*', code]) {
    if ((VERBATIM_ALLOWED.get(scope) ?? []).includes(key)) return true;
  }
  return false;
};

const copied = [];
const honoured = [];
for (const code of LOCALES.filter((c) => c !== 'en')) {
  for (const entry of dictionaries.get(code)) {
    if (byKeyDiffers(entry, code)) continue;
    if (allowedVerbatim(code, entry.key)) {
      honoured.push(`${code}:${entry.key}`);
      continue;
    }
    copied.push(`${code}: ${entry.key} = "${String(entry.value).slice(0, 40)}"`);
  }
}

// The other direction matters as much: an exemption that no longer describes reality is a claim about
// a locale that has stopped being true, and it would hide the next copy under the same name.
const stale = [];
for (const [scope, keys] of VERBATIM_ALLOWED) {
  for (const key of keys) {
    for (const locale of LOCALES.filter((c) => c !== 'en' && (scope === '*' || scope === c))) {
      const entry = dictionaries.get(locale).find((candidate) => candidate.key === key);
      if (entry !== undefined && byKeyDiffers(entry, locale)) stale.push(`${locale}: ${key} is no longer verbatim`);
    }
  }
}

console.log(`Locale files: ${LOCALES.join(', ')}`);
console.log(`English keys: ${en.length}`);
console.log(`Translated (not English-verbatim): ${coverage.join(' · ')}`);
console.log(`Verbatim by design (${honoured.length} strings, declared): ${honoured.join(' · ') || 'none'}`);

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} locale problem(s):`);
  for (const problem of problems.slice(0, 60)) console.error(`  ${problem}`);
  if (problems.length > 60) console.error(`  … ${problems.length - 60} more`);
  process.exit(1);
}

if (copied.length > 0) {
  console.error(`\n✗ ${copied.length} string(s) copied from English with no declared reason:`);
  for (const item of copied.slice(0, 40)) console.error(`  ${item}`);
  if (copied.length > 40) console.error(`  … ${copied.length - 40} more`);
  console.error('  Translate them, or add the key to VERBATIM_ALLOWED with the reason it has no other form.');
  process.exit(1);
}

if (stale.length > 0) {
  console.error(`\n✗ ${stale.length} declared exemption(s) no longer describes a verbatim string:`);
  for (const item of stale.slice(0, 20)) console.error(`  ${item}`);
  console.error('  Remove it — a reason that no longer applies would excuse the next copy under the same name.');
  process.exit(1);
}

console.log('\n✓ All locales carry every key, every placeholder, and every emphasis marker.');
console.log('✓ Every string that equals the English one is either a declared brand, unit mark or symbol, or it is translated.');
