import { GoogleGenerativeAI } from '@google/generative-ai';

import { getWeatherForecast } from '@/lib/data/openMeteo';
import { getAgroclimateDaily, getAgroclimateNormals } from '@/lib/data/nasaPower';
import { getGrainOverview } from '@/lib/data/wfpMarketPrices';
import { resolveLocation } from '@/lib/data/locations';
import { getCrop } from '@/lib/crops/catalog';
import { SOIL_GUIDANCE } from '@/lib/soil/guidance';
import {
  buildAgroclimateEvidence,
  buildWeatherEvidence,
  type AdvisorEvidence,
  type EvidenceGap,
  type EvidenceItem,
} from './evidence';
import type { AdvisorAnswer } from './answer';

/**
 * The advisor may only reason over assembled evidence. It is given no freedom to
 * introduce prices, weather, or agronomic facts from its own memory, and it must
 * abstain when the evidence cannot support an answer.
 */

export type { AdvisorAnswer };

export class AdvisorNotConfigured extends Error {}

export function isConfigured(): boolean {
  return typeof process.env.GEMINI_API_KEY === 'string' && process.env.GEMINI_API_KEY.length > 0;
}

export async function assembleEvidence(o: {
  latitude: number;
  longitude: number;
  placeName: string;
  cropId: string;
}): Promise<AdvisorEvidence> {
  const resolved = resolveLocation({
    latitude: o.latitude,
    longitude: o.longitude,
    place: null,
    marketId: null,
  });
  const crop = getCrop(o.cropId);

  const items: EvidenceItem[] = [];
  const gaps: EvidenceGap[] = [];

  if (!resolved.ok) {
    return {
      place: o.placeName,
      latitude: o.latitude,
      longitude: o.longitude,
      cropId: o.cropId,
      cropName: crop?.name ?? null,
      items,
      gaps: [{ area: 'location', reason: resolved.error.message }],
    };
  }
  const location = resolved.location;

  const weather = await getWeatherForecast({ location, forecastDays: 7, pastDays: 0, includeHourly: false });
  const weatherEvidence = buildWeatherEvidence(weather);
  items.push(...weatherEvidence.items);
  gaps.push(...weatherEvidence.gaps);

  const agro = await getAgroclimateDaily({ location, start: shift(-30), end: shift(-1) });
  const normals = await getAgroclimateNormals(location);
  items.push(
    ...buildAgroclimateEvidence({
      data: agro.ok ? agro.data : null,
      provenance: agro.provenance,
      error: agro.ok ? null : agro.error,
      extra: {
        annualNormalMmPerDay: normals.ok ? normals.data.annual.precipitationMmPerDay : null,
        derived: null,
      },
    }).items,
  );
  if (!agro.ok) gaps.push({ area: 'agro-climate record', reason: agro.error.message });
  if (!normals.ok || normals.data.annual.precipitationMmPerDay === null)
    gaps.push({ area: 'climatology normals', reason: normals.ok ? 'publisher returned no annual normal' : normals.error.message });

  const markets = await getGrainOverview();
  if (markets.ok) {
    const prov = {
      source: markets.provenance.source,
      sourceUrl: markets.provenance.sourceUrl,
      retrievedAt: markets.provenance.retrievedAt,
    };
    const asOf = markets.data.asOf;
    const firstWord = crop ? crop.name.toLowerCase().split(' ')[0] : '';
    const related = firstWord
      ? markets.data.commodities.filter((c) => c.commodity.toLowerCase().includes(firstWord))
      : [];
    const chosen = (related.length > 0 ? related : markets.data.commodities).slice(0, 4);
    for (const c of chosen) {
      items.push({
        id: `market-${c.commodity.toLowerCase().replace(/\s+/g, '-')}`,
        kind: 'observed',
        label: `National retail average — ${c.commodity}`,
        value: c.avgEtbPerUnit.toFixed(0),
        units: `ETB/${c.unit} across ${c.markets} markets, survey month ${asOf}`,
        observedAt: asOf,
        ...prov,
      });
    }
  } else {
    gaps.push({ area: 'market prices', reason: markets.error.message });
  }

  if (crop) {
    if (crop.rainfall.mmMin !== null && crop.rainfall.mmMax !== null) {
      items.push({
        id: 'crop-rain-need',
        kind: 'reference',
        label: `Documented rainfall requirement for ${crop.name}`,
        value: `${crop.rainfall.mmMin}–${crop.rainfall.mmMax}`,
        units: 'mm per season',
        source: crop.rainfall.sources.map((s) => s.name).join(', ') || 'curated reference',
        sourceUrl: crop.rainfall.sources[0]?.url ?? '',
      });
    } else {
      gaps.push({ area: 'crop rainfall requirement', reason: 'no citable range found in curated sources' });
    }
    if (crop.temperature.minC !== null && crop.temperature.maxC !== null) {
      items.push({
        id: 'crop-temp-need',
        kind: 'reference',
        label: `Documented temperature range for ${crop.name}`,
        value: `${crop.temperature.minC}–${crop.temperature.maxC}`,
        units: '°C',
        source: crop.temperature.sources.map((s) => s.name).join(', ') || 'curated reference',
        sourceUrl: crop.temperature.sources[0]?.url ?? '',
      });
    }
    for (const practice of crop.practices.slice(0, 4)) {
      items.push({
        id: `practice-${practice.practice.toLowerCase().replace(/\s+/g, '-')}`,
        kind: 'reference',
        label: `Extension practice — ${practice.practice}`,
        value: practice.detail,
        source: practice.sources.map((s) => s.name).join(', ') || 'curated reference',
        sourceUrl: practice.sources[0]?.url ?? '',
      });
    }
  } else {
    gaps.push({ area: 'crop reference profile', reason: 'this crop has no curated profile with sources yet' });
  }

  for (const g of SOIL_GUIDANCE.slice(0, 3)) {
    items.push({
      id: `soil-${g.id}`,
      kind: 'reference',
      label: `Soil-management guidance — ${g.title}`,
      value: g.summary,
      source: g.sources.map((s) => s.name).join(', '),
      sourceUrl: g.sources[0]?.url ?? '',
    });
  }

  return {
    place: o.placeName,
    latitude: o.latitude,
    longitude: o.longitude,
    cropId: o.cropId,
    cropName: crop?.name ?? null,
    items,
    gaps,
  };
}

/**
 * Ask Gemini. Throws AdvisorNotConfigured without a key. When the evidence base
 * is too thin, returns a local abstention without spending a call.
 */
export async function advise(o: { question: string; evidence: AdvisorEvidence }): Promise<AdvisorAnswer> {
  if (!isConfigured()) throw new AdvisorNotConfigured('GEMINI_API_KEY is not set for this environment');

  const measured = o.evidence.items.filter((i) => i.kind !== 'reference').length;
  if (measured < 2 || !o.evidence.cropName) {
    return {
      abstained: true,
      headline: 'Not enough validated evidence to answer',
      recommendation:
        'IRSHAYE only recommends when it can cite real data. Live climate or market evidence for this place is unavailable right now' +
        (o.evidence.cropName ? '' : ', and this crop has no sourced reference profile yet') +
        '. Try again shortly or choose a covered crop.',
      evidenceUsed: o.evidence.items.map((i) => i.label),
      uncertainty: 'No recommendation was generated because the evidence base is insufficient.',
      limitations: o.evidence.gaps.map((g) => `${g.area}: ${g.reason}`),
    };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  });

  const result = await model.generateContent(buildPrompt(o.question, o.evidence));
  const text = result.response.text();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {
      abstained: true,
      headline: 'The advisor response could not be verified',
      recommendation:
        'The model returned an answer in an unusable format, so IRSHAYE is not presenting it. Please try again.',
      evidenceUsed: [],
      uncertainty: 'Response rejected at validation, not by the data.',
      limitations: ['technical: advisor response format error'],
    };
  }

  const answer: AdvisorAnswer = {
    abstained: parsed.abstained === true,
    headline: asString(parsed.headline, 'Advisor response'),
    recommendation: asString(parsed.recommendation, ''),
    evidenceUsed: Array.isArray(parsed.evidence_used) ? parsed.evidence_used.map((v) => asString(v, '')) : [],
    uncertainty: asString(parsed.uncertainty, 'Uncertainty was not stated; treat this as general guidance only.'),
    limitations: Array.isArray(parsed.limitations) ? parsed.limitations.map((v) => asString(v, '')) : [],
  };
  if (!answer.recommendation) answer.abstained = true;
  if (answer.abstained && !answer.recommendation) {
    answer.recommendation =
      'The advisor judged the available evidence insufficient for this question. IRSHAYE does not fill the gap with guesses.';
  }
  return answer;
}

function asString(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : fallback;
}

function shift(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

export function buildPrompt(question: string, e: AdvisorEvidence): string {
  const facts = e.items
    .map(
      (i) =>
        `- [${i.id}] (${i.kind}) ${i.label}: ${i.value}${i.units ? ` ${i.units}` : ''}` +
        `${i.observedAt ? ` — as of ${i.observedAt}` : ''} — source: ${i.source}`,
    )
    .join('\n');
  const gaps = e.gaps.map((g) => `- ${g.area}: ${g.reason}`).join('\n') || '- none';

  return `You are the IRSHAYE agricultural advisor, a decision-support tool for climate-smart agriculture in Ethiopia.

FARMER CONTEXT
Place: ${e.place} (${e.latitude.toFixed(3)}, ${e.longitude.toFixed(3)})
Crop: ${e.cropName ?? 'not selected'}
Question: ${question}

VALIDATED EVIDENCE (the ONLY facts you may use)
${facts}

EVIDENCE GAPS (known missing areas)
${gaps}

RULES — non-negotiable:
1. Use only the facts above. Never introduce prices, weather figures, yields, or agronomic numbers from your own knowledge.
2. Cite evidence by its [id] in your recommendation.
3. If the facts cannot support an answer, set "abstained" to true and explain which gap matters.
4. Never claim or promise yield increases, income gains, or water savings. Never diagnose soil conditions — soil status requires local measurement, which this platform does not have.
5. Distinguish clearly between observed, forecast, modelled, derived, and reference (documented guidance) values.
6. Keep language practical and plain; the reader may be a smallholder farmer.

Respond ONLY with JSON:
{"abstained": boolean, "headline": string, "recommendation": string, "evidence_used": [string], "uncertainty": string, "limitations": [string]}`;
}
