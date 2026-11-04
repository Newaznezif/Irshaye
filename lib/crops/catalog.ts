import type { CropProfile, SourceRef } from './types';

/**
 * Curated Ethiopian crop reference profiles.
 *
 * Rules applied when building this file:
 * - Every range comes from a document that was actually retrieved; the citation sits next to it.
 * - Where publishers disagree, BOTH ranges are shown rather than a blended average.
 * - Anything not found is left null so the UI renders an explicit gap. No figure here is memory.
 * - PROTA4U chapters are Africa-wide syntheses authored by Ethiopian specialists; several
 *   (teff, coffee, wheat, faba, chickpea, noug, khat, maize, sorghum, barley) are the
 *   Ethiopia-referencing chapters. They are documented preference, not field measurement.
 * - Ethiopia's MoA/ATI "Standard Agricultural Guidelines" and AGP crop-suitability minutes are
 *   the intended primary sources and were NOT retrievable in machine-readable form. Until they
 *   are obtained by a human, these profiles must be presented as literature-based reference,
 *   which is how the UI labels them.
 */

const PROTA = (title: string, url: string, author: string): SourceRef => ({
  name: 'PROTA4U / Wageningen University',
  title: `${title} — ${author}, PROTA 2006 (SeedforAfrica synthesis)`,
  url,
});

const IGC: SourceRef = {
  name: 'International Growth Centre',
  title: 'The economic and environmental future of Ethiopian coffee — Tamru, Minten & Kassa (2024)',
  url: 'https://www.theigc.org/blogs/climate-priorities-developing-countries/economic-and-environmental-future-ethiopian-coffee',
};

const PETTAZZONI: SourceRef = {
  name: 'Pettazzoni et al., Plant Biology (PMC)',
  title: 'Climate and Ethiopian arabica quality growing ranges (2025)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12884032/',
};

const CHEMURA: SourceRef = {
  name: 'Chemura et al., Scientific Reports (PMC)',
  title: 'Climate change and specialty coffee potential in Ethiopia (2021)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8046822/',
};

const INFONET_COFFEE: SourceRef = {
  name: 'Infonet-BioVision',
  title: 'Coffee (Revised) — growing conditions and disease context',
  url: 'https://infonet-biovision.org/crops-fruits-vegetables/coffee-revised',
};

const TEFERA: SourceRef = {
  name: 'PROTA4U / Wageningen University',
  title: 'Eragrostis tef (Teff) — Tefera & Belay, PROTA 2006',
  url: 'https://prota.prota4u.org/protav8.asp?g=pe&p=Eragrostis%20tef',
};

const PMC7996070: SourceRef = {
  name: 'Teff habitat-suitability study (PMC7996070)',
  title: 'Teff habitat suitability including Rosegrant et al. 2005 thresholds',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7996070/',
};

const INFONET_TEFF: SourceRef = {
  name: 'Infonet-BioVision',
  title: 'Teff — rainfall and temperature ranges for smallholder guidance',
  url: 'https://infonet-biovision.org/crops-fruits-vegetables/teff',
};

const TESFA: SourceRef = {
  name: 'Tesfa, Belete & Woldemariyam, PLOS One',
  title: 'Teff cultivation elevation range (2026)',
  url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0360297',
};

const PLOS_MAIZE: SourceRef = {
  name: 'Markos, Worku & Mamo, PLOS Climate',
  title: 'Rainfall trend and seasonal calendar of maize in southern central Rift Valley (2023)',
  url: 'https://journals.plos.org/climate/article?id=10.1371/journal.pclm.0000218',
};

const MERGA: SourceRef = {
  name: 'Merga et al., International Journal of Agricultural Science and Food Technology',
  title: 'Meta-analysis of maize response to rainfall depth in Ethiopia (2022)',
  url: 'https://www.agriscigroup.us/articles/IJASFT-8-263.php',
};

const OLANA: SourceRef = {
  name: 'Olana & Kitila, IJASFT',
  title: 'Mid-altitude maize trial conditions in Ethiopia (2022)',
  url: 'https://www.agriscigroup.us/articles/IJASFT-8-266.php',
};

const ECOCROP: SourceRef = {
  name: 'FAO Ecocrop (OpenCLIM mirror)',
  title: 'FAO Ecocrop species requirement tables',
  url: 'https://github.com/OpenCLIM/ecocrop',
};

const TADESSE: SourceRef = {
  name: 'Tadesse et al., Crop Breeding, Genetics & Genomics',
  title: 'Wheat production and breeding in Ethiopia: retrospect and prospects (2022)',
  url: 'https://cbgg.hapres.com/htmls/CBGG_1490_Detail.html',
};

const PMC12161582: SourceRef = {
  name: 'Negeri, Bai & Moisa, PLOS One (PMC12161582)',
  title: 'Wheat suitability mapping in southwestern Ethiopia (2025)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12161582/',
};

const AREBU: SourceRef = {
  name: 'Arebu Hussen Yimer, Agricultural Reviews',
  title: 'Status, opportunities and challenges of malt barley production in Ethiopia (2025)',
  url: 'https://arccjournals.com/journal/agricultural-reviews/DF-534',
};

const PMC9441066: SourceRef = {
  name: 'Wada et al., Journal of Ethnobiology and Ethnomedicine (PMC9441066)',
  title: 'Barley growing conditions and farmer-observed rainfall shortage (2022)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9441066/',
};

const ADUNA: SourceRef = {
  name: 'Aduna, SpringerPlus (PMC4033718)',
  title: 'Sorghum altitude and rainfall ranges in Ethiopian production areas (2014)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4033718/',
};

const PMC10457510: SourceRef = {
  name: 'Climate variability and sorghum review (PMC10457510)',
  title: 'Drought, locust damage and projected yield pressure on sorghum',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10457510/',
};

const YEMATA: SourceRef = {
  name: 'Yemata, The Scientific World Journal (PMC7199586)',
  title: 'Ensete ventricosum: a multipurpose crop against hunger in Ethiopia (2020)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7199586/',
};

const DEMPEWOLF: SourceRef = {
  name: 'Dempewolf et al., Evolutionary Applications (PMC4430770)',
  title: 'Noug (Guizotia abyssinica) germplasm environment ranges (2015)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4430770/',
};

const BAHIRU: SourceRef = {
  name: 'Bahiru et al., International Journal of Earth Sciences and Geophysics',
  title: 'June–September share of annual rainfall in Ethiopian districts (2020)',
  url: 'https://vibgyorpublishers.org/content/ijesg/fulltext.php?aid=ijesg-6-042',
};

const FAO_GIEWS: SourceRef = {
  name: 'FAO GIEWS',
  title: 'Foodcrops and Shortages No. 3 — Ethiopia seasonal definition (Oct 2004)',
  url: 'https://www.fao.org/4/j2969e/j2969e04.htm',
};

const PMC10999880: SourceRef = {
  name: 'Rainfall/temperature variability study, Sidama Zone (PMC10999880)',
  title: 'Kiremt June–mid-September share and Belg March–May share (2024)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10999880/',
};

export const CROP_PROFILES: CropProfile[] = [
  {
    id: 'teff',
    name: 'Teff',
    amharicName: 'ጠፍ',
    summary:
      'Ethiopia’s staple cereal, grown mainly in the kiremt season on the highlands. Source ranges differ, so IRSHAYE shows both rather than picking one.',
    altitudeBands: ['midland', 'highland'],
    plantingWindows: [{ startMonth: 6, endMonth: 9, season: 'kiremt' }],
    harvestWindows: [{ startMonth: 9, endMonth: 12, season: 'harvest' }],
    rainfall: {
      mmMin: 450,
      mmMax: 550,
      seasonDependence: 'Kiremt-dependent; sown with the main rains, harvested into the dry season.',
      sources: [TEFERA, PMC7996070],
    },
    temperature: {
      minC: 15,
      maxC: 27,
      notes:
        'Sources disagree and both are shown: PROTA gives 15–27 °C average daily with pollination impaired above about 22 °C; Rosegrant (via PMC7996070) gives 10–30 °C; Infonet gives 10–27 °C.',
      sources: [TEFERA, PMC7996070, INFONET_TEFF],
    },
    soil: {
      phMin: null,
      phMax: null,
      drainage: 'Vertisols and Andosols; tolerates both drought and brief waterlogging, but not prolonged waterlogging.',
      notes:
        'PROTA records a preference for neutral pH with tolerance below pH 5. No single citable numeric range was found, so pH is left as a stated gap.',
      sources: [TEFERA, PMC7996070],
    },
    risks: [
      {
        risk: 'Seasonal drought and moisture stress',
        when: 'Late kiremt onset or an early cessation of rain',
        indicator: '7-day forecast rain deficit and the length of the dry spell',
        sources: [PMC7996070, TESFA],
      },
      {
        risk: 'Waterlogging from excess rain',
        when: 'Heavy sustained rain during growth',
        indicator: 'Days above 12 mm in the observed record',
        sources: [TEFERA],
      },
      {
        risk: 'Lodging',
        when: 'Late season, especially with dense canopy',
        indicator: 'Not observable from open data — a field judgement',
        sources: [TESFA],
      },
    ],
    practices: [
      {
        practice: 'Seed rate',
        detail: 'Recommended 15–30 kg/ha; PROTA notes farmers commonly use 40–50 kg/ha. A central-highlands trial reported 10 kg/ha with 20 cm row spacing.',
        sources: [TEFERA, TESFA],
      },
      {
        practice: 'Varieties',
        detail: 'Dene, Quncho and Kora are named improved types in the retrieved literature.',
        sources: [TESFA],
      },
    ],
    sources: [TEFERA, PMC7996070, INFONET_TEFF, TESFA, BAHIRU],
  },
  {
    id: 'maize',
    name: 'Maize',
    amharicName: 'በቆሎ',
    summary:
      'Grown across Ethiopian agroecologies, including bimodal belg and kiremt zones in the rift valley and lowlands.',
    altitudeBands: ['lowland', 'midland', 'highland'],
    plantingWindows: [{ startMonth: 3, endMonth: 5, season: 'belg' }],
    harvestWindows: [],
    rainfall: {
      mmMin: 600,
      mmMax: 900,
      seasonDependence:
        'Rift-valley and lowland maize follows bimodal rain: belg planting with March moisture, sowing around end of April; rainfed maize also grown in the main (kiremt/meher) season.',
      sources: [PROTA('Zea mays — Maize', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Zea%20mays', 'Badu-Apraku & Fakorede'), PLOS_MAIZE],
    },
    temperature: {
      minC: 25,
      maxC: 30,
      notes:
        'PROTA gives 25–30 °C as the growth optimum; FAO Ecocrop lists a germination minimum near 10 °C and a tolerated span of 10–47 °C. Optimum and tolerance are different things and are kept apart.',
      sources: [PROTA('Zea mays — Maize', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Zea%20mays', 'Badu-Apraku & Fakorede'), ECOCROP],
    },
    soil: {
      phMin: 5,
      phMax: 8,
      drainage: 'Prefers well-drained soils; optimum pH 5.5–7 per PROTA.',
      notes: 'High rainfall on light soils drives nitrogen leaching and runoff (documented risk).',
      sources: [PROTA('Zea mays — Maize', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Zea%20mays', 'Badu-Apraku & Fakorede'), MERGA],
    },
    risks: [
      {
        risk: 'Irregular rain and water shortage',
        when: 'Onset variability of 17.5–29.2% recorded in the rift-valley belg calendar',
        indicator: 'Rainfall departure from the 30-year normal',
        sources: [PLOS_MAIZE, MERGA],
      },
      {
        risk: 'Nitrogen loss and runoff after heavy rain',
        when: 'After fertiliser application in high-rainfall zones',
        indicator: 'Days above 12 mm in the observed record',
        sources: [MERGA],
      },
    ],
    practices: [
      {
        practice: 'Seed rate',
        detail: 'Up to 25 kg/ha sole crop; 10–15 kg/ha intercrop (PROTA).',
        sources: [PROTA('Zea mays — Maize', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Zea%20mays', 'Badu-Apraku & Fakorede')],
      },
      {
        practice: 'Spacing and planting depth',
        detail: '75–90 cm between rows × 25–50 cm in the row; planting depth 3–8 cm; a common stand is 75 × 30 cm (about 44,000 plants/ha).',
        sources: [PROTA('Zea mays — Maize', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Zea%20mays', 'Badu-Apraku & Fakorede'), OLANA],
      },
    ],
    sources: [
      PROTA('Zea mays — Maize', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Zea%20mays', 'Badu-Apraku & Fakorede'),
      PLOS_MAIZE,
      MERGA,
      OLANA,
      ECOCROP,
    ],
  },
  {
    id: 'wheat',
    name: 'Wheat',
    amharicName: 'ማሙድ',
    summary: 'A highland and midland cereal grown on the main rains, and under irrigation in the lowlands.',
    altitudeBands: ['midland', 'highland'],
    plantingWindows: [{ startMonth: 6, endMonth: 10, season: 'kiremt' }],
    harvestWindows: [],
    rainfall: {
      mmMin: 250,
      mmMax: 750,
      seasonDependence:
        'Rainfed wheat is sown with the main rains June–October; irrigated wheat runs November–April in lowlands (Tadesse et al.).',
      sources: [
        PROTA('Triticum aestivum (Wheat)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Triticum%20aestivum', 'Belay'),
        TADESSE,
      ],
    },
    temperature: {
      minC: 10,
      maxC: 24,
      notes: 'PROTA gives 10–24 °C as optimum; FAO Ecocrop lists 5–27 °C tolerated. Both are shown rather than merged.',
      sources: [PROTA('Triticum aestivum (Wheat)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Triticum%20aestivum', 'Belay'), ECOCROP],
    },
    soil: {
      phMin: 5.5,
      phMax: 7.5,
      drainage: 'Sandy loam preference recorded in the southwestern Ethiopia suitability study.',
      notes: 'Ethiopia-specific seed-rate guidance was not retrievable and is left as a gap.',
      sources: [PROTA('Triticum aestivum (Wheat)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Triticum%20aestivum', 'Belay'), PMC12161582],
    },
    risks: [
      {
        risk: 'Terminal moisture stress',
        when: 'High-altitude sites late in the season',
        indicator: 'Rainfall departure from normal in the closing weeks',
        sources: [TADESSE],
      },
      {
        risk: 'Yellow and stem rust epidemics',
        when: 'Humid periods in the growing season',
        indicator: 'Not observable from open data — depends on local surveillance',
        sources: [TADESSE],
      },
    ],
    practices: [
      {
        practice: 'Seed rate and rows',
        detail: 'PROTA: 150–200 kg/ha broadcast or 75–120 kg/ha in rows at 10–35 cm; depth 2–5 cm; harvest at 25–35% grain moisture.',
        sources: [PROTA('Triticum aestivum (Wheat)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Triticum%20aestivum', 'Belay')],
      },
    ],
    sources: [PROTA('Triticum aestivum (Wheat)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Triticum%20aestivum', 'Belay'), TADESSE, PMC12161582, ECOCROP],
  },
  {
    id: 'barley',
    name: 'Barley',
    amharicName: 'ገብስ',
    summary: 'A cool-highland cereal, including the malt barley belt; adaptation spans a wide altitude range.',
    altitudeBands: ['midland', 'highland'],
    plantingWindows: [],
    harvestWindows: [],
    rainfall: {
      mmMin: 500,
      mmMax: 800,
      seasonDependence:
        'A main-rain (meher) crop. Explicit sown and harvest months were not found in retrievable sources, so no month window is shown.',
      sources: [
        AREBU,
        PROTA('Hordeum vulgare (Barley)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Hordeum%20vulgare', 'Ceccarelli & Grando'),
      ],
    },
    temperature: {
      minC: 18,
      maxC: 25,
      notes:
        'Misha district malt zone is reported at 18–25 °C; site means across three districts ran 10.25–22.5 °C. PROTA notes winter types need 3–12 °C vernalisation.',
      sources: [PMC9441066, PROTA('Hordeum vulgare (Barley)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Hordeum%20vulgare', 'Ceccarelli & Grando')],
    },
    soil: {
      phMin: 5.5,
      phMax: 7.3,
      drainage: 'PROTA lists 6.0–8.5; Arebu gives 5.5–7.3. Both are shown because they disagree.',
      notes: 'Altitude in Ethiopia: 1,500–3,500 m (PROTA via Berhane et al.), main malt zone 2,000–3,000 m.',
      sources: [AREBU, PROTA('Hordeum vulgare (Barley)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Hordeum%20vulgare', 'Ceccarelli & Grando')],
    },
    risks: [
      {
        risk: 'Rainfall shortage / moisture stress',
        when: 'Low-rain years, recorded by farmers in the retrieved study',
        indicator: 'Observed 30-day rainfall against the seasonal need',
        sources: [PMC9441066],
      },
    ],
    practices: [
      {
        practice: 'Seed rate, rows and harvest',
        detail: 'PROTA: 50–150 kg/ha, rows 15–35 cm, depth 2–6 cm, harvest at 35–40% kernel moisture. Rotation with other crops is recorded from farmers.',
        sources: [
          PROTA('Hordeum vulgare (Barley)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Hordeum%20vulgare', 'Ceccarelli & Grando'),
          PMC9441066,
        ],
      },
    ],
    sources: [AREBU, PMC9441066, PROTA('Hordeum vulgare (Barley)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Hordeum%20vulgare', 'Ceccarelli & Grando')],
  },
  {
    id: 'sorghum',
    name: 'Sorghum',
    amharicName: 'ማረብ',
    summary: 'The cereal of the drought-prone lowlands, grown across both belg and main rain.',
    altitudeBands: ['lowland', 'midland'],
    plantingWindows: [],
    harvestWindows: [],
    rainfall: {
      mmMin: 500,
      mmMax: 800,
      seasonDependence:
        'Grown across belg and the main rains in drought-prone agroecologies; a production-area split is recorded (Wollo 600–700 mm, Metekel/Gibe above 1,000 mm). An explicit Ethiopian month calendar was not found.',
      sources: [
        PROTA('Sorghum bicolor', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Sorghum%20bicolor', 'Balole & Legwaila'),
        ADUNA,
      ],
    },
    temperature: {
      minC: 25,
      maxC: 31,
      notes: 'PROTA optimum 25–31 °C; FAO Ecocrop lists a tolerated 8–40 °C.',
      sources: [PROTA('Sorghum bicolor', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Sorghum%20bicolor', 'Balole & Legwaila'), ECOCROP],
    },
    soil: {
      phMin: 5,
      phMax: 8.5,
      drainage: 'Drought-tolerant and tolerant of poor soils (PROTA).',
      notes: 'Ethiopian altitude range about 500–2,400 m (Aduna); up to 2,300 m in the tropics (PROTA).',
      sources: [PROTA('Sorghum bicolor', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Sorghum%20bicolor', 'Balole & Legwaila'), ADUNA],
    },
    risks: [
      {
        risk: 'Recurrent drought',
        when: 'Any stage; the defining constraint of the lowland sorghum zones',
        indicator: 'Longest dry spell in the forecast and observed record',
        sources: [PMC10457510],
      },
      {
        risk: 'Desert locust damage',
        when: 'Outbreak years; one recorded event damaged 112,476 quintals of sorghum',
        indicator: 'Not observable from this platform — outbreak reporting is external',
        sources: [PMC10457510],
      },
    ],
    practices: [
      {
        practice: 'Seed rate, rows and harvest',
        detail: 'PROTA: broadcast 6 kg/ha, rows 45–75 cm, depth 2.5–5 cm, harvest below 20% grain moisture.',
        sources: [PROTA('Sorghum bicolor', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Sorghum%20bicolor', 'Balole & Legwaila')],
      },
    ],
    sources: [PROTA('Sorghum bicolor', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Sorghum%20bicolor', 'Balole & Legwaila'), ADUNA, PMC10457510, ECOCROP],
  },
  {
    id: 'coffee',
    name: 'Coffee (arabica)',
    amharicName: 'ቡና',
    summary: 'A perennial cash crop of the western and southern highlands, sensitive to temperature and disease pressure.',
    altitudeBands: ['midland', 'highland'],
    plantingWindows: [],
    harvestWindows: [],
    rainfall: {
      mmMin: 1200,
      mmMax: 2000,
      seasonDependence:
        'Flowering is triggered by the first rains after the dry period. IGC reports 1,400–2,000 mm/yr; Pettazzoni reports 1,200–2,200 mm/yr — both shown.',
      sources: [IGC, PETTAZZONI],
    },
    temperature: {
      minC: 18,
      maxC: 22,
      notes:
        'IGC gives 18–22 °C; Pettazzoni gives 15–24 °C; Infonet links a 15–27.7 °C stress band to coffee berry disease. Sources disagree and are kept separate.',
      sources: [IGC, PETTAZZONI, INFONET_COFFEE],
    },
    soil: {
      phMin: null,
      phMax: null,
      drainage: 'Acid soils predispose plants to disease (Infonet). No numeric pH range was retrieved.',
      notes: 'Ethiopian quality growing: 950–1,950 m (Pettazzoni); arabica globally 700–2,000 m (Chemura).',
      sources: [INFONET_COFFEE, PETTAZZONI, CHEMURA],
    },
    risks: [
      {
        risk: 'Coffee berry disease after rainstorms',
        when: 'Storms of 7.5 mm or more',
        indicator: 'Days above 12 mm and forecast rain totals',
        sources: [INFONET_COFFEE],
      },
      {
        risk: 'Loss of suitable area under climate change',
        when: 'Long-term: suitability was lost in 5 of 6 modelled specialty areas by the 2090s',
        indicator: 'Temperature readings against the documented range',
        sources: [CHEMURA],
      },
    ],
    practices: [
      {
        practice: 'Integrated pest management',
        detail: 'Infonet records thresholds (e.g. more than 4 capsid bugs per tree), copper sprays, and fortnightly picking during peaks.',
        sources: [INFONET_COFFEE],
      },
    ],
    sources: [IGC, PETTAZZONI, CHEMURA, INFONET_COFFEE],
  },
  {
    id: 'faba-bean',
    name: 'Faba bean',
    amharicName: 'ጣምባሳ',
    summary: 'A cool-highland pulse grown on the main rains, often in rotation with cereals.',
    altitudeBands: ['midland', 'highland'],
    plantingWindows: [{ startMonth: 6, endMonth: 6, season: 'kiremt' }],
    harvestWindows: [],
    rainfall: {
      mmMin: 700,
      mmMax: 1000,
      seasonDependence: 'In Ethiopia sown mid-June; harvested when seed moisture reaches 16–18% (the month was not found).',
      sources: [PROTA('Vicia faba (Faba bean)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Vicia%20faba', 'Jarso & Keneni')],
    },
    temperature: {
      minC: 13,
      maxC: 13,
      notes: 'PROTA gives an ideal mean daily temperature around 13 °C. It is a single point, not a range, and is labelled as such.',
      sources: [PROTA('Vicia faba (Faba bean)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Vicia%20faba', 'Jarso & Keneni')],
    },
    soil: {
      phMin: 6.5,
      phMax: 7.5,
      drainage: 'Almost neutral soil preferred; best on deep Vertisols (PROTA).',
      notes: 'Altitude range 1,300–3,800 m (PROTA). Climate-risk specifics were not retrievable and are omitted rather than guessed.',
      sources: [PROTA('Vicia faba (Faba bean)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Vicia%20faba', 'Jarso & Keneni')],
    },
    risks: [],
    practices: [
      {
        practice: 'Seed rate and rows',
        detail: 'PROTA records recommendations up to 150–200 kg/ha in Ethiopia, with rows at 40 cm.',
        sources: [PROTA('Vicia faba (Faba bean)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Vicia%20faba', 'Jarso & Keneni')],
      },
    ],
    sources: [PROTA('Vicia faba (Faba bean)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Vicia%20faba', 'Jarso & Keneni')],
  },
  {
    id: 'chickpea',
    name: 'Chickpea',
    amharicName: 'ሽንብራ',
    summary: 'A pulse that uses residual moisture late in the rainy season; drainage matters on Vertisols.',
    altitudeBands: ['midland', 'highland'],
    plantingWindows: [],
    harvestWindows: [],
    rainfall: {
      mmMin: 500,
      mmMax: 1800,
      seasonDependence:
        'Grown towards the end of the rainy season on residual moisture (PROTA). Explicit Ethiopian months were not found, so no calendar window is shown.',
      sources: [PROTA('Cicer arietinum (Chickpea)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Cicer%20arietinum', 'Bejiga & van der Maesen')],
    },
    temperature: {
      minC: 10,
      maxC: 25,
      notes: 'PROTA: 10–25 °C during growth.',
      sources: [PROTA('Cicer arietinum (Chickpea)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Cicer%20arietinum', 'Bejiga & van der Maesen')],
    },
    soil: {
      phMin: 5,
      phMax: 7,
      drainage: 'pH 5 to 7 or more (PROTA). Waterlogging is the documented constraint on Vertisols.',
      notes: 'Sea level to above 2,500 m; East Africa 1,200–2,700 m (PROTA).',
      sources: [PROTA('Cicer arietinum (Chickpea)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Cicer%20arietinum', 'Bejiga & van der Maesen')],
    },
    risks: [
      {
        risk: 'Waterlogging and terminal drought',
        when: 'Poor drainage on heavy soils, or a dry finish to the season',
        indicator: 'Days above 12 mm in the observed record',
        sources: [PROTA('Cicer arietinum (Chickpea)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Cicer%20arietinum', 'Bejiga & van der Maesen')],
      },
    ],
    practices: [
      {
        practice: 'Seed rate and spacing',
        detail: 'PROTA: 30–40 kg/ha for small-seeded types up to 90–100 kg/ha; rows 25–30 cm with 10–30 cm in the row.',
        sources: [PROTA('Cicer arietinum (Chickpea)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Cicer%20arietinum', 'Bejiga & van der Maesen')],
      },
    ],
    sources: [PROTA('Cicer arietinum (Chickpea)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Cicer%20arietinum', 'Bejiga & van der Maesen')],
  },
  {
    id: 'noug',
    name: 'Noug (niger seed)',
    amharicName: 'ነውጥ',
    summary: 'An oilseed endemic to Ethiopia, tolerant of wet conditions and grown over a wide altitude range.',
    altitudeBands: ['midland', 'highland'],
    plantingWindows: [{ startMonth: 5, endMonth: 7, season: 'kiremt' }],
    harvestWindows: [],
    rainfall: {
      mmMin: 1000,
      mmMax: 1300,
      seasonDependence: 'Main planting in Ethiopia May–July; harvest about three weeks after 50% of florets drop (the month was not stated).',
      sources: [PROTA('Guizotia abyssinica (Noug)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Guizotia%20abyssinica', 'Bulcha 2007')],
    },
    temperature: {
      minC: 16,
      maxC: 20,
      notes: 'PROTA: optimum mean daily 16–20 °C. 500 mm may suffice where 1,000–1,300 mm is the optimum band.',
      sources: [PROTA('Guizotia abyssinica (Noug)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Guizotia%20abyssinica', 'Bulcha 2007')],
    },
    soil: {
      phMin: 5.2,
      phMax: 7.3,
      drainage: 'Clay loams and sandy loams; PROTA records notable waterlogging tolerance.',
      notes: 'Grown from 500 m to above 2,500 m; germplasm collected between 896 and 3,199 m.',
      sources: [PROTA('Guizotia abyssinica (Noug)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Guizotia%20abyssinica', 'Bulcha 2007'), DEMPEWOLF],
    },
    risks: [
      {
        risk: 'Waterlogging',
        when: 'Waterlogged soils — though PROTA records tolerance, and Dempewolf notes it grows well in adverse conditions',
        indicator: 'Days above 12 mm in the observed record',
        sources: [DEMPEWOLF],
      },
    ],
    practices: [
      {
        practice: 'Seed rate and rows',
        detail: 'PROTA: 5–15 kg/ha in Ethiopia, rows at 30–50 cm.',
        sources: [PROTA('Guizotia abyssinica (Noug)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Guizotia%20abyssinica', 'Bulcha 2007')],
      },
    ],
    sources: [PROTA('Guizotia abyssinica (Noug)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Guizotia%20abyssinica', 'Bulcha 2007'), DEMPEWOLF],
  },
  {
    id: 'enset',
    name: 'Enset',
    amharicName: 'እንሰት',
    summary: 'The "false banana" — a vegetative staple crop of the southern and western highlands, harvested year-round.',
    altitudeBands: ['midland', 'highland'],
    plantingWindows: [],
    harvestWindows: [{ startMonth: 11, endMonth: 12, season: 'harvest' }],
    rainfall: {
      mmMin: 1100,
      mmMax: 1500,
      seasonDependence: 'Corm harvested year-round; processing concentrated November–March (Yemata).',
      sources: [YEMATA],
    },
    temperature: {
      minC: 18,
      maxC: 28,
      notes: 'Yemata gives 18–28 °C with 60–80% humidity.',
      sources: [YEMATA],
    },
    soil: {
      phMin: 5.6,
      phMax: 7.3,
      drainage: 'Well-drained soils of various types with 2–3% organic matter (Yemata).',
      notes:
        'Cultivated 1,100–3,000 m with an optimal belt at 1,700–2,450 m. Seed rate and spacing do not apply: this is a vegetative crop, so no agronomic practice entry is made up.',
      sources: [YEMATA],
    },
    risks: [
      {
        risk: 'Drought reduces starch content',
        when: 'Extended dry periods, even though the plant survives drought, heavy rain and flooding',
        indicator: 'Longest dry spell in the forecast and observed record',
        sources: [YEMATA],
      },
    ],
    practices: [],
    sources: [YEMATA],
  },
  {
    id: 'khat',
    name: 'Khat (chat)',
    amharicName: 'ጫት',
    summary: 'A perennial leaf crop of the mid-highlands, harvested by repeated cutting rather than a single season.',
    altitudeBands: ['midland', 'highland'],
    plantingWindows: [],
    harvestWindows: [],
    rainfall: {
      mmMin: 800,
      mmMax: 1000,
      seasonDependence: 'A cutting crop: shoots are taken two to three times per week in early morning. No month calendar was found.',
      sources: [PROTA('Catha edulis (Khat)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Catha%20edulis', 'van der Vossen 2002')],
    },
    temperature: {
      minC: 16,
      maxC: 22,
      notes: 'PROTA optimum mean 16–22 °C, tolerating 6–32 °C.',
      sources: [PROTA('Catha edulis (Khat)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Catha%20edulis', 'van der Vossen 2002')],
    },
    soil: {
      phMin: null,
      phMax: null,
      drainage: 'Moderately acid to alkaline; sandy loam to heavy clay, deep and well drained.',
      notes: 'Altitude 1,500–2,500 m. Ethiopia-specific climate risks were not retrievable and are omitted.',
      sources: [PROTA('Catha edulis (Khat)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Catha%20edulis', 'van der Vossen 2002')],
    },
    risks: [],
    practices: [
      {
        practice: 'Planting material and spacing',
        detail: 'PROTA: cuttings of 30–50 cm planted at 1.5–2.5 m; trees kept at 2.5–5 m by pruning; harvested stems 40–100 cm.',
        sources: [PROTA('Catha edulis (Khat)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Catha%20edulis', 'van der Vossen 2002')],
      },
    ],
    sources: [PROTA('Catha edulis (Khat)', 'https://prota.prota4u.org/protav8.asp?g=pe&p=Catha%20edulis', 'van der Vossen 2002')],
  },
];

export const SEASON_CALENDAR: { id: string; title: string; detail: string; sources: SourceRef[] }[] = [
  {
    id: 'kiremt',
    title: 'Kiremt (meher) — the main rains',
    detail:
      'June to mid-September, carrying about 51–54% of annual rain in the Sidama Zone study area; this is the season the main cereal crop depends on.',
    sources: [PMC10999880, FAO_GIEWS],
  },
  {
    id: 'belg',
    title: 'Belg — the short rains',
    detail: 'February/March to May, carrying about 33–34% of annual rain in the same study; FAO GIEWS extends belg rain from February to May.',
    sources: [PMC10999880, FAO_GIEWS],
  },
];

export const getCrop = (cropId: string): CropProfile | undefined =>
  CROP_PROFILES.find((c) => c.id === cropId);

/** Documents the reference layer itself, so the UI can state its limits honestly. */
export const CATALOG_LIMITATIONS: string[] = [
  'Ranges are literature-based documented preference (PROTA4U species chapters, peer-reviewed Ethiopian studies, FAO). They are not measurements of your field.',
  'Ethiopia’s MoA/ATI Standard Agricultural Guidelines and the AGP crop-suitability minutes were not retrievable in machine-readable form; official per-crop thresholds are pending primary-source verification.',
  'Where sources disagree (teff temperature, wheat rainfall, barley pH and temperature, coffee rainfall and temperature) both figures are shown instead of a merged average.',
  'Several harvest-month calendars were not found in retrievable sources and are shown as gaps rather than filled in: maize kiremt harvest, barley, sorghum, chickpea, faba-bean harvest month, coffee picking months, khat calendar, noug harvest month.',
  'PROTA4U chapters cover Africa broadly; figures may reflect conditions outside Ethiopia.',
];
