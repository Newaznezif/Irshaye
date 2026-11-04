export const LANGUAGES = ['en', 'ru', 'am', 'om', 'sw'] as const;

export type Lang = (typeof LANGUAGES)[number];

export type TranslationVars = Record<string, string | number>;

/** A locale's strings. `en` is complete; the others may be partial and fall back per key. */
export type Dictionary = Record<string, string>;

export type LanguageMeta = {
  code: Lang;
  /** What speakers of the language call it, written in its own script. */
  nativeName: string;
  englishName: string;
  /** BCP 47 tag written to `<html lang>` so screen readers and fonts agree. */
  htmlLang: string;
  /** Tag passed to `Intl`, which is not always the same as the UI tag. */
  intlLocale: string;
  /** Compact label for the header chip, where the full name would overflow. */
  short: string;
};
