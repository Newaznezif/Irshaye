import { am } from './locales/am';
import { en } from './locales/en';
import { om } from './locales/om';
import { ru } from './locales/ru';
import { sw } from './locales/sw';
import { LANGUAGES } from './types';
import type { Dictionary, Lang, LanguageMeta, TranslationVars } from './types';

export { LANGUAGES };
export type { Dictionary, Lang, LanguageMeta, TranslationVars };
export type { TranslationKey } from './locales/en';

import type { TranslationKey } from './locales/en';

/**
 * Order here is the order of the selector. English leads because it is the
 * default for a first visit, not because it ranks above the others.
 */
export const LANGUAGE_META: Record<Lang, LanguageMeta> = {
  en: { code: 'en', nativeName: 'English', englishName: 'English', htmlLang: 'en', intlLocale: 'en-GB', short: 'EN' },
  ru: { code: 'ru', nativeName: 'Русский', englishName: 'Russian', htmlLang: 'ru', intlLocale: 'ru', short: 'RU' },
  am: { code: 'am', nativeName: 'አማርኛ', englishName: 'Amharic', htmlLang: 'am', intlLocale: 'am', short: 'አማ' },
  om: { code: 'om', nativeName: 'Afaan Oromoo', englishName: 'Afaan Oromoo', htmlLang: 'om', intlLocale: 'om', short: 'OM' },
  sw: { code: 'sw', nativeName: 'Kiswahili', englishName: 'Kiswahili', htmlLang: 'sw', intlLocale: 'sw', short: 'SW' },
};

export const LANGUAGE_ORDER: readonly Lang[] = LANGUAGES;

const DICTIONARIES: Record<Lang, Dictionary> = { en, ru, am, om, sw };

export const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);

/** `{placeholders}` survive when a caller has no value for them: a missing
 *  variable must show as a gap, not silently drop a unit or a number. */
const interpolate = (template: string, vars?: TranslationVars): string =>
  vars === undefined
    ? template
    : template.replace(/\{([A-Za-z0-9_]+)\}/g, (match, name: string) =>
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
      );

/** English is the fallback for a key a locale has not reached yet. */
export function translate(lang: Lang, key: TranslationKey, vars?: TranslationVars): string {
  const template = DICTIONARIES[lang][key] ?? en[key] ?? key;
  return interpolate(template, vars);
}

/** Keys a locale has not translated, for the parity checker and the honest report. */
export const missingKeys = (lang: Lang): TranslationKey[] =>
  (Object.keys(en) as TranslationKey[]).filter((key) => typeof DICTIONARIES[lang][key] !== 'string');

/**
 * Headings that carry a highlighted word are stored as one string with the
 * emphasis marked by `[[double brackets]]`, so a translator can move the
 * emphasised word wherever their language puts it instead of inheriting English
 * word order. The marker is stripped before rendering.
 */
export type RichPart = { text: string; accent: boolean };

const ACCENT = /\[\[([\s\S]*?)\]\]/g;

export function richParts(lang: Lang, key: TranslationKey, vars?: TranslationVars): RichPart[] {
  const template = translate(lang, key, vars);
  const parts: RichPart[] = [];
  let cursor = 0;
  for (const match of template.matchAll(ACCENT)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ text: template.slice(cursor, index), accent: false });
    parts.push({ text: match[1], accent: true });
    cursor = index + match[0].length;
  }
  if (cursor < template.length) parts.push({ text: template.slice(cursor), accent: false });
  return parts.length > 0 ? parts : [{ text: '', accent: false }];
}

export const localeOf = (lang: Lang): string => LANGUAGE_META[lang].intlLocale;
