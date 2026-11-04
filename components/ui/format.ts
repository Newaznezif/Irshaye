/**
 * Formatting shared by every module.
 *
 * `null` never becomes `0`: an absent measurement must render as an em dash so it
 * cannot be mistaken for a reading of zero.
 *
 * Every helper takes an optional BCP-47 locale so digits, month names and date
 * order follow the selected interface language. Time stays in Africa/Addis_Ababa
 * regardless of locale: the platform's figures are read in Ethiopian time.
 */
const FALLBACK = 'en-GB';

const localeOf = (locale?: string) => locale ?? FALLBACK;

export const fmt = (value: number | null | undefined, digits = 1, locale?: string): string =>
  value === null || value === undefined || Number.isNaN(value)
    ? '—'
    : value.toLocaleString(localeOf(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtInt = (value: number | null | undefined, locale?: string): string =>
  value === null || value === undefined || Number.isNaN(value)
    ? '—'
    : Math.round(value).toLocaleString(localeOf(locale));

export const monthLabel = (isoMonthOrDate: string, locale?: string): string => {
  const t = Date.parse(isoMonthOrDate.length === 7 ? `${isoMonthOrDate}-01T00:00:00Z` : isoMonthOrDate);
  if (Number.isNaN(t)) return isoMonthOrDate;
  return new Intl.DateTimeFormat(localeOf(locale), {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(t));
};

export const dayLabel = (isoDate: string, locale?: string): string => {
  const t = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(t)) return isoDate;
  return new Intl.DateTimeFormat(localeOf(locale), { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(t),
  );
};

export const monthName = (month: number, locale?: string): string => {
  if (month < 1 || month > 12) return String(month);
  return new Intl.DateTimeFormat(localeOf(locale), { month: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, month - 1, 15)),
  );
};

export const monthLong = (date: Date, locale?: string): string =>
  new Intl.DateTimeFormat(localeOf(locale), { month: 'long' }).format(date);

/** Stamp in Ethiopia local time, the timezone every figure on this platform is read in. */
export const stamp = (iso: string | null | undefined, locale?: string): string => {
  if (!iso) return '—';
  const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat(localeOf(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Addis_Ababa',
  }).format(new Date(t));
};
