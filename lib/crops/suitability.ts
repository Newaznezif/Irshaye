import { translate, type Lang } from '@/lib/i18n';
import type { CropProfile } from './types';

/**
 * Coarse suitability comparison between a crop's documented requirements and
 * live climate evidence. The result is modelled guidance, never a measurement,
 * and it states its own limits. Altitude is the main driver this platform cannot
 * observe from open data, so any altitude band note is shown alongside.
 *
 * The comparison itself is language-independent: wording is resolved from the
 * locale dictionaries through `lang`, so one implementation serves every
 * interface language.
 */

export type SuitabilityPoint = {
  aspect: 'rainfall' | 'temperature' | 'season' | 'altitude';
  verdict: 'within' | 'watch' | 'outside' | 'unknown';
  detail: string;
};

export type SuitabilityAssessment = {
  cropId: string;
  points: SuitabilityPoint[];
  overall: 'supported' | 'mixed' | 'weak' | 'insufficient-data';
};

/** Numbers inside a sentence follow the interface locale's decimal convention. */
const decimal = (value: number, lang: Lang): string => value.toLocaleString(lang, { maximumFractionDigits: 1 });

/** A single documented point (e.g. "ideal mean daily 13 °C") must not render as a fake range. */
export function rangeText(min: number, max: number, unit: string, lang: Lang = 'en'): string {
  return min === max
    ? `${min} ${unit} ${translate(lang, 'suitability.singlePoint')}`
    : `${min}–${max} ${unit}`;
}

export function assessSeason(crop: CropProfile, month: number, lang: Lang, monthLabel: string): SuitabilityPoint {
  if (crop.plantingWindows.length === 0 && crop.harvestWindows.length === 0)
    return {
      aspect: 'season',
      verdict: 'unknown',
      detail: translate(lang, 'suitability.seasonNoCalendar', { crop: crop.name }),
    };
  const inPlanting = crop.plantingWindows.some((w) => inWindow(w.startMonth, w.endMonth, month));
  const inHarvest = crop.harvestWindows.some((w) => inWindow(w.startMonth, w.endMonth, month));
  if (inPlanting)
    return {
      aspect: 'season',
      verdict: 'within',
      detail: translate(lang, 'suitability.seasonPlanting', { month: monthLabel, crop: crop.name }),
    };
  if (inHarvest)
    return {
      aspect: 'season',
      verdict: 'within',
      detail: translate(lang, 'suitability.seasonHarvest', { month: monthLabel, crop: crop.name }),
    };
  return {
    aspect: 'season',
    verdict: 'watch',
    detail: translate(lang, 'suitability.seasonOutside', { month: monthLabel, crop: crop.name }),
  };
}

function inWindow(start: number, end: number, month: number): boolean {
  return start <= end ? month >= start && month <= end : month >= start || month <= end;
}

export function assessRainfall(
  crop: CropProfile,
  recentObservedMm: number | null,
  forecastNext7Mm: number | null,
  lang: Lang,
): SuitabilityPoint {
  if (crop.rainfall.mmMin === null || crop.rainfall.mmMax === null)
    return {
      aspect: 'rainfall',
      verdict: 'unknown',
      detail: translate(lang, 'suitability.rainNoRange'),
    };
  if (recentObservedMm === null && forecastNext7Mm === null)
    return {
      aspect: 'rainfall',
      verdict: 'unknown',
      detail: translate(lang, 'suitability.rainNoData'),
    };
  const dry = (forecastNext7Mm !== null && forecastNext7Mm < 1) || (recentObservedMm !== null && recentObservedMm === 0);
  if (dry)
    return {
      aspect: 'rainfall',
      verdict: 'watch',
      detail: translate(lang, 'suitability.rainDry', {
        need: `${crop.rainfall.mmMin}–${crop.rainfall.mmMax}`,
        signal:
          forecastNext7Mm !== null
            ? translate(lang, 'suitability.rainForecast7', { mm: decimal(forecastNext7Mm, lang) })
            : translate(lang, 'suitability.rainNoMeasurable'),
      }),
    };
  return {
    aspect: 'rainfall',
    verdict: 'within',
    detail: translate(lang, 'suitability.rainWithin', {
      need: `${crop.rainfall.mmMin}–${crop.rainfall.mmMax}`,
      forecast:
        forecastNext7Mm !== null
          ? translate(lang, 'suitability.rainForecast7', { mm: decimal(forecastNext7Mm, lang) })
          : translate(lang, 'suitability.notAvailable'),
      observed:
        recentObservedMm !== null
          ? `${decimal(recentObservedMm, lang)} mm`
          : translate(lang, 'suitability.notAvailable'),
    }),
  };
}

export function assessTemperature(
  crop: CropProfile,
  tempMaxC: number | null,
  tempMinC: number | null,
  lang: Lang,
): SuitabilityPoint {
  if (crop.temperature.minC === null || crop.temperature.maxC === null)
    return {
      aspect: 'temperature',
      verdict: 'unknown',
      detail: translate(lang, 'suitability.tempNoRange'),
    };
  if (tempMaxC === null || tempMinC === null)
    return {
      aspect: 'temperature',
      verdict: 'unknown',
      detail: translate(lang, 'suitability.tempNoData'),
    };
  const readings = `${decimal(tempMinC, lang)}–${decimal(tempMaxC, lang)} °C`;
  const range = `${crop.temperature.minC}–${crop.temperature.maxC} °C`;
  if (tempMaxC > crop.temperature.maxC + 3 || tempMinC < crop.temperature.minC - 3)
    return {
      aspect: 'temperature',
      verdict: 'outside',
      detail: translate(lang, 'suitability.tempOutside', {
        readings,
        range,
        crop: crop.name,
        notes: crop.temperature.notes,
      }),
    };
  if (tempMaxC > crop.temperature.maxC || tempMinC < crop.temperature.minC)
    return {
      aspect: 'temperature',
      verdict: 'watch',
      detail: translate(lang, 'suitability.tempBrush', { range, notes: crop.temperature.notes }),
    };
  return {
    aspect: 'temperature',
    verdict: 'within',
    detail: translate(lang, 'suitability.tempWithin', { readings, range }),
  };
}

export function overallOf(points: SuitabilityPoint[]): SuitabilityAssessment['overall'] {
  const known = points.filter((p) => p.verdict !== 'unknown');
  if (known.length === 0) return 'insufficient-data';
  if (known.some((p) => p.verdict === 'outside')) return 'weak';
  if (known.some((p) => p.verdict === 'watch')) return 'mixed';
  return known.length < 2 ? 'mixed' : 'supported';
}
