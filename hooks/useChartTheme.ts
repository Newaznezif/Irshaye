'use client';

import { useTheme } from '@/hooks/useTheme';

export interface ChartTheme {
  /** Axis tick and label colour — an SVG attribute, so it must be a literal. */
  tick: string;
  /** Gridline colour. */
  grid: string;
  /** Reference-line colour for published normals and thresholds. */
  reference: string;
  dark: boolean;
}

/**
 * Recharts paints axes through SVG attributes, where `var()` does not resolve, so
 * the axis colours have to be chosen in JavaScript from the applied theme.
 */
export function useChartTheme(): ChartTheme {
  const { dark } = useTheme();
  const isDark = dark === true;
  return {
    dark: isDark,
    tick: isDark ? '#7f8a85' : '#8b9490',
    grid: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(96,110,102,0.16)',
    reference: isDark ? '#9aa39d' : '#a1a8a3',
  };
}
