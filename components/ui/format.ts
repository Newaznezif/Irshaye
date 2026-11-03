/**
 * Locale-stable formatting shared by every module.
 *
 * `null` never becomes `0`: an absent measurement must render as an em dash so it
 * cannot be mistaken for a reading of zero.
 */
export const fmt = (value: number | null | undefined, digits = 1): string =>
  value === null || value === undefined || Number.isNaN(value)
    ? '—'
    : value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtInt = (value: number | null | undefined): string =>
  value === null || value === undefined || Number.isNaN(value)
    ? '—'
    : Math.round(value).toLocaleString('en-US');

export const monthLabel = (isoMonthOrDate: string): string => {
  const t = Date.parse(isoMonthOrDate.length === 7 ? `${isoMonthOrDate}-01T00:00:00Z` : isoMonthOrDate);
  if (Number.isNaN(t)) return isoMonthOrDate;
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(t));
};

export const dayLabel = (isoDate: string): string => {
  const t = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(t)) return isoDate;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(t));
};

export const monthName = (month: number): string =>
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1] ?? String(month);

/** Stamp in Ethiopia local time, the timezone every figure on this platform is read in. */
export const stamp = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Addis_Ababa',
  }).format(new Date(t));
};
