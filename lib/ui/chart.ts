/**
 * Chart colour registry.
 *
 * Recharts writes these into SVG presentation attributes, where CSS custom
 * properties do not resolve, so the series colours are literal values chosen to
 * read correctly on both the ivory and the dark canvas. Container chrome (tooltip,
 * legend) is styled inline and can use the token variables.
 */
export const SERIES_COLORS = ['#1c7d4d', '#d19b22', '#4178b4', '#7b5fd0', '#c05f3c', '#2f9e8f'] as const;

/** Value-kind colours stay tied to meaning, not to series order. */
export const KIND_COLORS = {
  observed: '#1c7d4d',
  forecast: '#7b5fd0',
  modeled: '#4178b4',
  estimated: '#d19b22',
  imputed: '#8b9490',
} as const;

export const tooltipContentStyle = {
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontSize: 12,
  fontWeight: 600,
  boxShadow: '0 12px 30px -12px oklch(0.2 0.03 155 / 30%)',
  padding: '8px 10px',
} as const;
