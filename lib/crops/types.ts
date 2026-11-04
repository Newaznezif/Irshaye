/**
 * Curated crop-reference data model for IRSHAYE.
 *
 * Every field must carry a source. A figure with no citable source stays null and
 * is rendered as a gap — the platform never fills agricultural ranges from memory.
 */

export type SourceRef = {
  /** Publisher name as it should appear to users, e.g. "FAO". */
  name: string;
  title: string;
  url: string;
};

export type SeasonWindow = {
  /** Ethiopian month names are avoided in data; ISO month numbers 1-12. */
  startMonth: number;
  endMonth: number;
  /** Which season this window belongs to. */
  season: 'belg' | 'kiremt' | 'harvest' | 'dry';
};

export type AltitudeBand = 'lowland' | 'midland' | 'highland';

export type RainfallRequirement = {
  /** Crop water need for the season, mm — null when sources disagree and no safe range exists. */
  mmMin: number | null;
  mmMax: number | null;
  seasonDependence: string;
  sources: SourceRef[];
};

export type TemperatureRequirement = {
  /** Growth optimum, °C. */
  minC: number | null;
  maxC: number | null;
  /** Cardinal thresholds worth warning about (e.g. heat at flowering). */
  notes: string;
  sources: SourceRef[];
};

export type SoilPreference = {
  phMin: number | null;
  phMax: number | null;
  drainage: string;
  notes: string;
  sources: SourceRef[];
};

export type ClimateRisk = {
  risk: string;
  /** When it bites, e.g. "long dry spell at flowering". */
  when: string;
  /** What the platform can watch for, e.g. "7-day rain deficit in forecast". */
  indicator: string;
  sources: SourceRef[];
};

export type CropProfile = {
  id: string;
  name: string;
  amharicName: string | null;
  summary: string;
  altitudeBands: AltitudeBand[];
  plantingWindows: SeasonWindow[];
  harvestWindows: SeasonWindow[];
  rainfall: RainfallRequirement;
  temperature: TemperatureRequirement;
  soil: SoilPreference;
  risks: ClimateRisk[];
  practices: { practice: string; detail: string; sources: SourceRef[] }[];
  /** Overall citations for the profile block. */
  sources: SourceRef[];
};
