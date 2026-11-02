import type { CropProfile } from './types';

/**
 * Coarse suitability comparison between a crop's documented requirements and
 * live climate evidence. The result is modelled guidance, never a measurement,
 * and it states its own limits. Altitude is the main driver this platform cannot
 * observe from open data, so any altitude band note is shown alongside.
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

const MONTH_NAME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A single documented point (e.g. "ideal mean daily 13 °C") must not render as a fake range. */
export function rangeText(min: number, max: number, unit: string): string {
  return min === max ? `${min} ${unit} (documented single point)` : `${min}–${max} ${unit}`;
}

export function assessSeason(crop: CropProfile, month: number): SuitabilityPoint {
  if (crop.plantingWindows.length === 0 && crop.harvestWindows.length === 0)
    return {
      aspect: 'season',
      verdict: 'unknown',
      detail: `No citable month calendar was found in the curated sources for ${crop.name}, so IRSHAYE shows no planting or harvest window rather than guessing one.`,
    };
  const inPlanting = crop.plantingWindows.some((w) => inWindow(w.startMonth, w.endMonth, month));
  const inHarvest = crop.harvestWindows.some((w) => inWindow(w.startMonth, w.endMonth, month));
  if (inPlanting)
    return {
      aspect: 'season',
      verdict: 'within',
      detail: `${MONTH_NAME[month - 1]} falls inside a documented planting window for ${crop.name}.`,
    };
  if (inHarvest)
    return {
      aspect: 'season',
      verdict: 'within',
      detail: `${MONTH_NAME[month - 1]} falls inside a documented harvest window for ${crop.name}.`,
    };
  return {
    aspect: 'season',
    verdict: 'watch',
    detail: `${MONTH_NAME[month - 1]} is outside the documented planting and harvest windows for ${crop.name}.`,
  };
}

function inWindow(start: number, end: number, month: number): boolean {
  return start <= end ? month >= start && month <= end : month >= start || month <= end;
}

export function assessRainfall(
  crop: CropProfile,
  recentObservedMm: number | null,
  forecastNext7Mm: number | null,
): SuitabilityPoint {
  if (crop.rainfall.mmMin === null || crop.rainfall.mmMax === null)
    return {
      aspect: 'rainfall',
      verdict: 'unknown',
      detail: 'No citable seasonal rainfall range was found for this crop, so no comparison is made.',
    };
  if (recentObservedMm === null && forecastNext7Mm === null)
    return {
      aspect: 'rainfall',
      verdict: 'unknown',
      detail: 'Live rainfall data is unavailable right now, so the seasonal range cannot be compared.',
    };
  const dry = (forecastNext7Mm !== null && forecastNext7Mm < 1) || (recentObservedMm !== null && recentObservedMm === 0);
  if (dry)
    return {
      aspect: 'rainfall',
      verdict: 'watch',
      detail: `Documented need is ${crop.rainfall.mmMin}–${crop.rainfall.mmMax} mm per season, but the near-term rain signal is weak (${forecastNext7Mm !== null ? `${forecastNext7Mm.toFixed(1)} mm forecast in 7 days` : 'no measurable rain in the recent record'}). Delay rain-dependent operations where possible.`,
    };
  return {
    aspect: 'rainfall',
    verdict: 'within',
    detail: `Documented need is ${crop.rainfall.mmMin}–${crop.rainfall.mmMax} mm per season. Near-term rain: ${forecastNext7Mm !== null ? `${forecastNext7Mm.toFixed(1)} mm forecast in 7 days` : 'not available'}; recent observed ${recentObservedMm !== null ? `${recentObservedMm.toFixed(1)} mm` : 'not available'}.`,
  };
}

export function assessTemperature(crop: CropProfile, tempMaxC: number | null, tempMinC: number | null): SuitabilityPoint {
  if (crop.temperature.minC === null || crop.temperature.maxC === null)
    return {
      aspect: 'temperature',
      verdict: 'unknown',
      detail: 'No citable temperature range was found for this crop.',
    };
  if (tempMaxC === null || tempMinC === null)
    return {
      aspect: 'temperature',
      verdict: 'unknown',
      detail: 'Live temperature readings are unavailable, so no comparison is made.',
    };
  if (tempMaxC > crop.temperature.maxC + 3 || tempMinC < crop.temperature.minC - 3)
    return {
      aspect: 'temperature',
      verdict: 'outside',
      detail: `Current readings (${tempMinC.toFixed(1)}–${tempMaxC.toFixed(1)} °C) sit beyond the documented comfort range ${crop.temperature.minC}–${crop.temperature.maxC} °C for ${crop.name}. ${crop.temperature.notes}`,
    };
  if (tempMaxC > crop.temperature.maxC || tempMinC < crop.temperature.minC)
    return {
      aspect: 'temperature',
      verdict: 'watch',
      detail: `Readings brush the edge of the documented range (${crop.temperature.minC}–${crop.temperature.maxC} °C). ${crop.temperature.notes}`,
    };
  return {
    aspect: 'temperature',
    verdict: 'within',
    detail: `Current readings ${tempMinC.toFixed(1)}–${tempMaxC.toFixed(1)} °C sit inside the documented range ${crop.temperature.minC}–${crop.temperature.maxC} °C.`,
  };
}

export function overallOf(points: SuitabilityPoint[]): SuitabilityAssessment['overall'] {
  const known = points.filter((p) => p.verdict !== 'unknown');
  if (known.length === 0) return 'insufficient-data';
  if (known.some((p) => p.verdict === 'outside')) return 'weak';
  if (known.some((p) => p.verdict === 'watch')) return 'mixed';
  return known.length < 2 ? 'mixed' : 'supported';
}
