import type { SourceRef } from '@/lib/crops/types';

export type SoilGuidanceItem = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  /** Which observed climate signal makes this practice timely. */
  watchIndicator: string | null;
  sources: SourceRef[];
};

const FANYA_JUU: SourceRef = {
  name: 'Falta, Fakana & Kassie, PLOS One (PMC12919830)',
  title: 'Restoring degraded soils: Fanya Juu terraces and soil characteristics in the erosion-prone Magera watershed, Southern Ethiopia (2026)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12919830/',
};

const BERESSA: SourceRef = {
  name: 'Wageningen University & Research — edepot',
  title: 'Best practices in soil and water conservation in the Beressa watershed, Ethiopian highlands',
  url: 'https://edepot.wur.nl/121822',
};

const HIGHLAND_PRACTICES: SourceRef = {
  name: 'Cat et al., ScienceDirect',
  title: 'A critical analysis of soil (and water) conservation practices in the Ethiopian Highlands: implications for future research and modelling (2023)',
  url: 'https://www.sciencedirect.com/science/article/abs/pii/S0341816223006306',
};

const LAND_USE: SourceRef = {
  name: 'MDPI Land 11(12):2187',
  title: 'Evaluating biophysical conservation practices with dynamic land use and land cover in the highlands of Ethiopia',
  url: 'https://www.mdpi.com/2073-445X/11/12/2187',
};

/**
 * Practices are documented conservation measures from Ethiopian highland research,
 * not measurements of any field. Effects reported in a study are stated as that
 * study's finding at that site, never as a promise for the reader's farm.
 */
export const SOIL_GUIDANCE: SoilGuidanceItem[] = [
  {
    id: 'fanya-juu',
    title: 'Fanya Juu terraces',
    summary:
      'A ditch dug along the contour with a bund raised upslope of it, slowing and spreading runoff before it can cut a gully.',
    detail:
      'Documented in the Magera watershed study of southern Ethiopia, which measured improved soil characteristics under these terraces compared with unterraced ground. The study reported higher organic carbon, total nitrogen and available phosphorus on terraced plots at that site. These are findings from one watershed, not a guarantee for yours, and IRSHAYE cannot measure your soil to confirm any of them.',
    watchIndicator: 'Build or repair before the heavy-rain days of kiremt, not during them.',
    sources: [FANYA_JUU, HIGHLAND_PRACTICES],
  },
  {
    id: 'contour-bunds',
    title: 'Contour physical structures',
    summary: 'Bunds and channels laid along the contour so water is moved sideways, away from a growing point, instead of downhill.',
    detail:
      'A standard element of the Ethiopian highland conservation packages reviewed in the literature. Combined with vegetation it holds better than structures alone, which is the point the critical review of highland practices emphasises.',
    watchIndicator: 'Check bund integrity after any day at or above 12 mm of observed rain.',
    sources: [HIGHLAND_PRACTICES, LAND_USE],
  },
  {
    id: 'vegetative-cover',
    title: 'Vegetative strips and grass lines',
    summary: 'Grass or legume lines planted with or above physical structures to hold the soil the structures slow.',
    detail:
      'Recorded among best practices in the Beressa watershed work and in the highland conservation reviews, where physical measures and biological measures are treated as one system. Establishing vegetation before the intense rains is what makes the difference.',
    watchIndicator: 'Plant or reinforce grass lines when the observed record shows the first sustained rain of the season.',
    sources: [BERESSA, HIGHLAND_PRACTICES],
  },
  {
    id: 'runoff-timing',
    title: 'Working with heavy-rain days',
    summary: 'Erosion is driven by the few intense days, not by the season total — so the platform reports heavy-rain days in the observed record.',
    detail:
      'IRSHAYE counts days at or above 12 mm from the NASA POWER observed daily record, because surface runoff and soil loss concentrate in high-intensity events. This is an observed rainfall figure with its own provenance; it is a proxy for erosion pressure, not a measurement of soil loss, and no gully in your field has been observed by this platform.',
    watchIndicator: 'The rainfall driver panel above shows the heavy-rain count for the last 90 days.',
    sources: [HIGHLAND_PRACTICES],
  },
  {
    id: 'no-diagnosis',
    title: 'What IRSHAYE will not tell you about your soil',
    summary: 'Fertility, acidity, and organic matter content require sampling and laboratory analysis. This platform does not have them.',
    detail:
      'Nothing in the open data IRSHAYE reads measures your soil. Satellite vegetation indices describe plant cover, not soil quality, and they are never presented here as soil data. If you see signs of poor soil — stunting, poor establishment, crusting — the documented next step is a soil test through your woreda agricultural office, not an inference from this screen.',
    watchIndicator: null,
    sources: [HIGHLAND_PRACTICES],
  },
];
