/**
 * CSV serialisation for exported records.
 *
 * Two rules shape this file. The first is honest export: a downloaded row carries
 * the publisher's unit, currency, survey date, retrieval timestamp, price type
 * and quality flag with it, because a bare "1840" torn away from "ETB per 100 KG,
 * Mekele, retail, surveyed 2026-10-01, WFP" is a number that will eventually be
 * quoted as something it never claimed to be. Dates stay ISO for the same
 * reason — an export is a record, not a screen.
 *
 * The second is the formula-injection guard. A spreadsheet evaluates a cell that
 * begins with `=`, `+`, `-`, `@`, or a tab/CR, so a commodity or market name
 * crafted upstream as `=HYPERLINK(...)` would run on the reader's machine. These
 * fields come from a publisher we do not control, which makes them attacker-
 * influenceable input even though nobody means them that way. Neutralising the
 * leading character keeps the value readable and stops it executing.
 */

const RISKY_LEAD = /^[=+\-@\t\r]/;

/** Cells that are dates, numbers or ISO timestamps must not be quoted-neutralised. */
const isNumeric = (value: unknown) => typeof value === 'number' && Number.isFinite(value);

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (isNumeric(value)) return String(value);
  const text = String(value);
  // A leading apostrophe is how a spreadsheet stores text-as-text; prefixing the
  // raw payload would change the value, so the quote goes in front of the marker.
  const guarded = RISKY_LEAD.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const head = columns.map((c) => sanitizeCsvCell(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => sanitizeCsvCell(c.value(row))).join(',')).join('\r\n');
  // The BOM is what makes Excel read UTF-8 Amharic market names correctly instead
  // of mojibake — an export that arrives broken is an export that gets ignored.
  return rows.length === 0 ? `${head}\r\n` : `\ufeff${head}\r\n${body}\r\n`;
}

export function csvFileName(prefix: string, parts: Record<string, string | number | null | undefined>): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const suffix = Object.entries(parts)
    .filter(([, v]) => v !== null && v !== undefined && String(v) !== '')
    .map(([k, v]) => `${k}-${String(v).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')}`)
    .join('_');
  return `${prefix}${suffix ? `_${suffix}` : ''}_${stamp}.csv`;
}

/**
 * Trigger a browser download from a string built on the client.
 *
 * The object URL is revoked on the next tick: a blob URL left alive is a copy of
 * the whole dataset retained in memory until the page navigates away.
 */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
