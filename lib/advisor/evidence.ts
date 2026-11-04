import type { ConnectorResult, Provenance, SourceError, WeatherSeries } from '@/lib/data/types';

/**
 * Evidence collection for the AI Agricultural Advisor.
 *
 * The advisor may only reason over facts assembled here. Each evidence item
 * carries its own provenance mirror (source, dates, value kind), so the model
 * cites what the platform actually verified, and the UI can show the same list
 * to the farmer. When a connector fails, its error is recorded — the advisor
 * is told which evidence is missing and is expected to abstain if the gaps are
 * material. Nothing is ever substituted or invented for a failed source.
 */

export type EvidenceItem = {
  id: string;
  kind: 'observed' | 'modeled' | 'forecast' | 'estimated' | 'imputed' | 'reference';
  label: string;
  value: string;
  units?: string;
  observedAt?: string | null;
  retrievedAt?: string | null;
  source: string;
  sourceUrl: string;
};

export type EvidenceGap = {
  area: string;
  reason: string;
};

export type AdvisorEvidence = {
  place: string;
  latitude: number;
  longitude: number;
  cropId: string;
  cropName: string | null;
  items: EvidenceItem[];
  gaps: EvidenceGap[];
};

function provenanceOf(p: Provenance | null | undefined): Pick<EvidenceItem, 'source' | 'sourceUrl' | 'retrievedAt'> {
  return {
    source: p?.source ?? 'unknown publisher',
    sourceUrl: p?.sourceUrl ?? '',
    retrievedAt: p?.retrievedAt ?? null,
  };
}

const fmt = (v: number | null | undefined, digits = 1): string | null =>
  v === null || v === undefined || Number.isNaN(v) ? null : v.toFixed(digits);

export function buildWeatherEvidence(result: ConnectorResult<WeatherSeries>): {
  items: EvidenceItem[];
  gaps: EvidenceGap[];
} {
  const items: EvidenceItem[] = [];
  const gaps: EvidenceGap[] = [];
  const prov = provenanceOf(result.provenance);
  const data = result.ok ? result.data : null;

  if (!data) {
    gaps.push({ area: 'current weather', reason: result.ok ? 'no data' : result.error.message });
    return { items, gaps };
  }

  const current = data.current;
  if (current) {
    const temp = fmt(current.temperatureC);
    if (temp !== null)
      items.push({
        id: 'weather-current-temp',
        kind: 'observed',
        label: 'Current temperature',
        value: temp,
        units: '°C',
        observedAt: current.observedAt,
        ...prov,
      });
    const rain = fmt(current.precipitationMm);
    if (rain !== null)
      items.push({
        id: 'weather-current-rain',
        kind: 'observed',
        label: 'Current precipitation',
        value: rain,
        units: 'mm',
        observedAt: current.observedAt,
        ...prov,
      });
  }

  const forecast = data.daily.filter((d) => d.isForecast);
  if (forecast.length > 0) {
    const total = forecast.reduce((s, d) => s + (d.precipitationSumMm ?? 0), 0);
    items.push({
      id: 'weather-forecast-rain-7d',
      kind: 'forecast',
      label: 'Total precipitation, next 7 days',
      value: total.toFixed(1),
      units: 'mm',
      ...prov,
    });
    const dryRun = (() => {
      let run = 0;
      let best = 0;
      for (const d of forecast) {
        run = (d.precipitationSumMm ?? 0) < 0.5 ? run + 1 : 0;
        best = Math.max(best, run);
      }
      return best;
    })();
    items.push({
      id: 'weather-forecast-dry-run',
      kind: 'forecast',
      label: 'Longest dry spell in forecast (days with <0.5 mm)',
      value: String(dryRun),
      units: 'days',
      ...prov,
    });
  } else {
    gaps.push({ area: '7-day forecast', reason: 'no forecast days returned' });
  }
  return { items, gaps };
}

export function buildAgroclimateEvidence(result: {
  data: import('@/lib/data/types').AgroclimateSeries | null;
  provenance: Provenance | null;
  error: SourceError | null;
  extra: {
    annualNormalMmPerDay?: number | null;
    derived?: {
      observedMm?: number;
      expectedMm?: number;
      anomalyPct?: number | null;
      sufficientCoverage?: boolean;
    } | null;
  } | null;
}): { items: EvidenceItem[]; gaps: EvidenceGap[] } {
  const items: EvidenceItem[] = [];
  const gaps: EvidenceGap[] = [];
  const prov = provenanceOf(result.provenance);
  const data = result.data;

  if (!data) {
    gaps.push({ area: 'agro-climate record', reason: result.error?.message ?? 'source unavailable' });
    return { items, gaps };
  }

  const annual = result.extra?.annualNormalMmPerDay;
  if (annual != null)
    items.push({
      id: 'agro-normal-rain',
      kind: 'modeled',
      label: '30-year precipitation normal (NASA POWER climatology)',
      value: String(annual),
      units: 'mm/day',
      ...prov,
    });
  else gaps.push({ area: 'climatology normals', reason: result.extra ? 'publisher returned no normals' : 'agroclimate request incomplete' });

  const derived = result.extra?.derived;
  if (derived && derived.sufficientCoverage !== false && derived.observedMm != null && derived.expectedMm != null) {
    const anomaly = derived.observedMm - derived.expectedMm;
    items.push({
      id: 'agro-rain-anomaly',
      kind: 'estimated',
      label: 'Rainfall departure from normal over the recent window (derived by IRSHAYE, not published)',
      value: `${anomaly >= 0 ? '+' : ''}${anomaly.toFixed(1)}`,
      units: 'mm vs normal',
      ...prov,
    });
  }

  const recent = data.daily.filter((d) => d.precipitationMm != null);
  if (recent.length >= 7) {
    const last30 = recent.slice(-30).reduce((s, d) => s + (d.precipitationMm ?? 0), 0);
    items.push({
      id: 'agro-recent-rain',
      kind: 'observed',
      label: 'Observed precipitation, last 30 days of the POWER record',
      value: last30.toFixed(1),
      units: 'mm',
      observedAt: data.daily.at(-1)?.date ?? null,
      ...prov,
    });
  }
  return { items, gaps };
}
