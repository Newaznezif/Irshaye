/**
 * English is the source of truth for the key set: every other locale is partial
 * and falls back to the string defined here, key by key.
 */
export const en = {
  // --- Brand and application shell ---
  'brand.tagline': 'Climate-Smart Agriculture',
  'shell.openDataLive': 'Open data, live',
  'shell.workingContext': 'Working context',
  'shell.noCropProfile': 'No curated crop profile yet',
  'shell.appearance': 'Appearance',
  'shell.language': 'Language',
  'shell.breadcrumbPlatform': 'Platform',
  'shell.moduleFallback': 'IRSHAYE',

  // --- Accessibility ---
  'a11y.skip': 'Skip to content',
  'a11y.openNavigation': 'Open navigation',
  'a11y.closeNavigation': 'Close navigation',
  'a11y.navigation': 'Navigation',
  'a11y.chooseLanguage': 'Choose language',
  'a11y.currentLanguage': 'Current language: {language}',
  'a11y.themeToLight': 'Switch to light theme',
  'a11y.themeToDark': 'Switch to dark theme',

  // --- Sidebar groups ---
  'nav.group.Today': 'Today',
  'nav.group.Intelligence': 'Intelligence',
  'nav.group.Advisory': 'Advisory',
  'nav.group.Platform': 'Platform',

  // --- Modules (single source for sidebar, tiles and page headers) ---
  'module.overview.label': 'Overview',
  'module.overview.short': 'Overview',
  'module.overview.description': 'Your location, crop, and the season context that matters right now.',
  'module.climate.label': 'Climate Intelligence',
  'module.climate.short': 'Climate',
  'module.climate.description': 'Current weather, forecasts, rainfall patterns, and climate-risk indicators.',
  'module.markets.label': 'Market Intelligence',
  'module.markets.short': 'Markets',
  'module.markets.description': 'Ethiopian commodity prices with sources and observation dates.',
  'module.crops.label': 'Crop Advisory',
  'module.crops.short': 'Crops',
  'module.crops.description': 'Crop profiles, planting guidance, and climate suitability for your area.',
  'module.soil.label': 'Soil Management',
  'module.soil.short': 'Soil',
  'module.soil.description': 'Soil conservation and erosion-prevention guidance for Ethiopian farms.',
  'module.advisor.label': 'AI Agricultural Advisor',
  'module.advisor.short': 'AI Advisor',
  'module.advisor.description': 'Evidence-based recommendations built from validated platform data.',
  'module.sources.label': 'Data Sources',
  'module.sources.short': 'Sources',
  'module.sources.description': 'Every data publisher, its license, freshness, and value classification.',
  'module.settings.label': 'Settings',
  'module.settings.short': 'Settings',
  'module.settings.description': 'Your saved location and crop, appearance, and integration status.',

  // --- Shared interface words ---
  'common.retry': 'Retry',
  'common.refresh': 'Refresh',
  'common.loading': 'Loading',
  'common.close': 'Close',
  'common.apply': 'Apply',
  'common.cancel': 'Cancel',
  'common.change': 'Change',
  'common.source': 'Source',
  'common.sources': 'Sources',
  'common.detail': 'Detail',
  'common.state': 'State',
  'common.cadence': 'Cadence',
  'common.newestObservation': 'Newest observation',
  'common.unavailable': 'Unavailable',
  'common.connected': 'Connected',
  'common.notConfigured': 'not configured',
  'common.noData': 'No data',
  'common.rows': 'rows',
  'common.derivedHere': 'derived here',
  'common.live': 'live',
  'common.stale': 'stale',
  'common.fromCache': 'from cache',
  'common.probeFailed': 'Probe failed',
  'common.unknown': 'Unknown',
  'common.allSources': 'All sources',
  'common.coreSources': 'Core sources',
  'common.sourceStatus': 'Source status',
  'common.units.etbPerKg': 'ETB per kg',
  'common.updating': 'updating',
  'common.refreshAll': 'Refresh all',
  'common.liveBadge': 'Live',

  // --- Value kinds: how a figure was produced ---
  'valueKind.observed': 'observed',
  'valueKind.forecast': 'forecast',
  'valueKind.modeled': 'modeled',
  'valueKind.estimated': 'estimated',
  'valueKind.imputed': 'imputed',

  // --- Shared data vocabulary (landing registry and the Data Sources page) ---
  'cadence.realtime': 'real-time',
  'cadence.hourly': 'hourly',
  'cadence.daily': 'daily',
  'cadence.8daily': '8-day composite',
  'cadence.weekly': 'weekly',
  'cadence.monthly': 'monthly',
  'cadence.quarterly': 'quarterly',
  'cadence.annual': 'annual',
  'cadence.irregular': 'irregular',
  'category.weather': 'Weather & forecasts',
  'category.agroclimatology': 'Agroclimatology',
  'category.market_prices': 'Market prices',
  'category.exchange_rates': 'Exchange rates',
  'category.economic_benchmarks': 'Economic benchmarks',
  'category.geospatial': 'Boundaries & satellite',

  // --- Landing header ---
  'landing.eventTag': 'AgroInnovation 2026',
  'landing.navHow': 'How it works',
  'landing.navIntelligence': 'Intelligence',
  'landing.navAdvisory': 'Advisory',
  'landing.navData': 'Data',
  'landing.sourceStatus': 'Source status',
  'landing.openPlatform': 'Open the platform',
  'landing.openModule': 'Open {module}',
  'a11y.landingSections': 'Landing sections',
  'a11y.landingHome': 'IRSHAYE home',
  'a11y.footerModules': 'Platform modules',
  'a11y.footerPublishers': 'Data publishers',
  'a11y.footerPage': 'On this page',

  // --- Landing hero ---
  'hero.festival': 'AgroInnovation Festival 2026 · Ethiopia',
  'hero.title': 'Climate-smart farming,\ndecided on [[evidence]].',
  'hero.lede':
    'IRSHAYE is an AI-assisted digital platform for climate-smart agriculture in Ethiopia. Choose a place and a crop, and it assembles live climate intelligence, source-cited crop guidance, soil-management practices and real market prices — then explains what they mean, where every number came from, and how much to trust it.',
  'hero.ctaPrimary': 'Start with your location and crop',
  'hero.ctaSecondary': 'See the data behind it',
  'hero.trustNoAccount': 'No account, no API key to start',
  'hero.trustOpenData': 'Open data only, licence stated',
  'hero.trustLive': 'Live publishers, probed on demand',
  'hero.imageAlt':
    'Terraced smallholder farmland in the Ethiopian highlands at sunrise, with stone contour bunds and traditional thatched farmsteads',
  'hero.placeNow': 'Addis Ababa, right now',
  'hero.humidity': 'Humidity',
  'hero.rainOutlook': 'Rain, 7-day outlook',
  'hero.publisherSilent': 'The weather publisher did not answer.',
  'hero.noSubstitute': 'No substitute reading is shown.',

  // --- How it works ---
  'how.eyebrow': 'The working method',
  'how.title': 'Five steps from a location to a recommendation you can audit',
  'how.lede':
    'Nothing here is a chat window with a farm label on it. The platform assembles a defined body of evidence first, and only then reasons over it — which is what makes every answer traceable back to a publisher and a date.',
  'how.step1Title': 'Pick your place',
  'how.step1Body':
    'A market town from the WFP survey register — with the publisher’s own coordinates — or the latitude and longitude of your own field.',
  'how.step2Title': 'Pick your crop',
  'how.step2Body':
    'Eleven curated Ethiopian crop profiles, each requirement cited to an extension or research source rather than asserted.',
  'how.step3Title': 'Read the climate context',
  'how.step3Body':
    'Live observations, the seven-day outlook, the 45-day record and 30-year normals for the same grid cell, kept apart by kind.',
  'how.step4Title': 'Get agricultural information',
  'how.step4Body':
    'Planting and harvest windows, documented practices, erosion triggers and surveyed prices — the inputs a decision actually needs.',
  'how.step5Title': 'One evidence-based recommendation',
  'how.step5Body':
    'The advisor may reason only over the evidence above. It cites its inputs, states uncertainty, and abstains when the evidence is thin.',

  // --- Feature sections ---
  'features.climate.title': 'Live weather, the week ahead, and the 30-year context — kept apart by kind',
  'features.climate.lede':
    'The climate module reads four publishers for the same grid cell and never blends them into a single confident number. An observation, a model output, and a forecast are different claims, and IRSHAYE shows them with different labels, colours and freshness rules.',
  'features.climate.alt':
    'Heavy rain clouds building over green Ethiopian farmland, with shafts of light across the valley',
  'features.climate.b1Title': 'Current conditions and a 7-day outlook',
  'features.climate.b1Body':
    'Open-Meteo forecasts for your coordinates, refreshed on the source’s own hourly cadence and stamped with the retrieval time.',
  'features.climate.b2Title': 'Rainfall against the season calendar',
  'features.climate.b2Body':
    'The recent daily record next to kiremt and belg expectations, so a late start is visible rather than merely reported.',
  'features.climate.b3Title': 'Drought and heat indicators',
  'features.climate.b3Body':
    'Derived from NASA POWER agroclimatology for the same cell, with the derived values labelled as derived instead of measured.',
  'features.climate.b4Title': 'Freshness that tells the truth',
  'features.climate.b4Body':
    'ERA5 reanalysis arrives about a week late. The interface says so instead of presenting a lagging number as current.',

  'features.crops.title': 'Eleven Ethiopian crop profiles, each figure tied to a named source',
  'features.crops.lede':
    'Teff, maize, wheat, barley, sorghum, coffee, faba bean, chickpea, noug, enset and khat. Temperature, rainfall, altitude and soil-pH ranges are transcribed from PROTA4U species chapters, Ecocrop, FAO and peer-reviewed Ethiopian studies — with the citation attached to the number.',
  'features.crops.alt':
    'A ripe stand of ethiopian teff grain with seed heads catching low evening light',
  'features.crops.b1Title': 'Planting and harvest windows',
  'features.crops.b1Body':
    'Season guidance per crop and agroecology. Where a retrievable source gave no calendar, the profile shows a gap rather than inventing one.',
  'features.crops.b2Title': 'Suitability for your place',
  'features.crops.b2Body':
    'The selected location’s altitude and rainfall are compared against the documented range, and the match is graded — not asserted.',
  'features.crops.b3Title': 'Sources you can open',
  'features.crops.b3Body':
    'Every profile links to its citation. Where PROTA and a field study disagree, both figures appear side by side instead of a quiet average.',
  'features.crops.b4Title': 'Stated limitations',
  'features.crops.b4Body':
    'Ranges are literature-based documented preferences, not measurements of your field, and the module says that in its own header.',

  'features.soil.title': 'Conservation practices for erosion-prone Ethiopian farmland',
  'features.soil.lede':
    'Fanya juu trenches, contour bunds, compost and manure handling, crop rotation, residue and cover management, integrated soil and water conservation. Each practice comes from published Ethiopian land-use and highland conservation research, with the conditions it applies under and the sources that describe it.',
  'features.soil.alt': 'Stone bunds and terraced slopes holding soil on a cultivated Ethiopian hillside',
  'features.soil.b1Title': 'Practice guidance, not a soil test',
  'features.soil.b1Body':
    'The module manages risk on documented slopes and rainfall. It never claims to know your soil’s nutrient status, because it has not measured it.',
  'features.soil.b2Title': 'Slope and erosion context',
  'features.soil.b2Body':
    'Rainfall intensity and terrain are used to flag where runoff and soil loss are the binding constraint.',
  'features.soil.b3Title': 'Sequencing that respects the season',
  'features.soil.b3Body':
    'Structural works before the long rains, vegetative bunds after — timed against the same calendar the climate module uses.',

  'features.markets.title': 'Real Ethiopian market prices, with the survey date attached',
  'features.markets.lede':
    'Prices come from the WFP Ethiopia rEMS survey and the World Bank real-time price series via HDX, read for the selected market centre. Monthly survey cadence means the newest figure is usually weeks old, so the module shows the observation month rather than implying today’s price.',
  'features.markets.alt':
    'Jute sacks of maize, teff and other grains stacked at an Ethiopian market, with measuring baskets on top',
  'features.markets.b1Title': 'Market centres from the survey register',
  'features.markets.b1Body':
    'Locations are drawn from the published price datasets, so a price is always tied to the market it was collected in.',
  'features.markets.b2Title': 'Trend without invention',
  'features.markets.b2Body':
    'Series are rendered from returned observations only. A missing month is a gap in the line, never an interpolated point.',
  'features.markets.b3Title': 'Visibility of the lag',
  'features.markets.b3Body':
    'Survey prices are monthly, and NBE indicative rates are daily — both freshness windows are shown on the numbers.',

  // --- Data credibility ---
  'data.eyebrow': 'Data credibility',
  'data.title': '{count} publishers, each named, licensed and time-stamped',
  'data.lede':
    'IRSHAYE does not have a private data advantage. Its advantage is that every number on screen can be traced to a public publisher, a licence, a cadence, and a moment of observation — and that the interface distinguishes an observed value from a model output, a forecast, and a figure we derived here.',
  'data.pointNoKeys': 'No upstream in this list needs an API key, so nothing is hidden behind a credential.',
  'data.pointMarkedKeys': 'Publishers that need a credential are marked; the product degrades honestly without one.',
  'data.pointFreshness':
    'Each source has its own freshness window — ERA5, POWER and 8-day satellite composites lag by design.',
  'data.pointLicence':
    'Two datasets state no licence from their publisher. They are shown for reading with attribution, and that limitation is written on screen.',
  'data.cta': 'Open live source status',
  'data.registry': 'Source registry',
  'data.registryBadge': 'Live from {count} publishers',

  // --- Integrity rules ---
  'rules.eyebrow': 'The evidence rules',
  'rules.title': 'Four promises the interface enforces, not just claims',
  'rules.lede':
    'An advisory tool earns trust by what it refuses to say. These rules are implemented in the rendering layer — you can see them working on any page, including when the data is inconvenient.',
  'rules.r1Title': 'A model output is never drawn as a measurement',
  'rules.r1Body':
    'Every value carries a kind — observed, modelled, forecast, derived here, or filled in. Colour and label make the difference visible instead of smoothing it away.',
  'rules.r2Title': 'A gap is shown as a gap',
  'rules.r2Body':
    'When a publisher returns nothing, the module reports the failure and its code. No substitute weather, price, or agronomic figure is generated to fill the space.',
  'rules.r3Title': 'No outcome claims without field validation',
  'rules.r3Body':
    'The platform does not state yield gains, income uplift, or water savings it has not measured on real farms, and does not present satellite vegetation indices as a soil test.',
  'rules.r4Title': 'Guidance, not a guarantee',
  'rules.r4Body':
    'Advice is decision support with named sources and stated uncertainty. It does not diagnose soil conditions without measurement, and it abstains when the evidence is thin.',

  // --- AI layer ---
  'ai.eyebrow': 'The AI layer',
  'ai.title': 'An assistant that is only allowed to reason over what the platform can prove',
  'ai.lede':
    'The advisor receives the evidence bundle the other modules assembled — live climate for your coordinates, the cited crop profile, soil-management practices, surveyed prices with their observation months — and answers in a fixed structure. It is not connected to a farm, a soil lab, or a futures exchange, and it says so.',
  'ai.keyNote':
    'Answers require a model key on the deployment. Without one, the module reports itself unavailable and leaves every other module working — it does not fall back to invented advice.',
  'ai.cta': 'Open the AI Agricultural Advisor',
  'ai.imageAlt':
    'An Ethiopian farmer in a white netala shawl holding a basic mobile phone, listening to an advisory conversation',
  'ai.contract': 'Response contract',
  'ai.contract1Body':
    'The specific platform records the answer relies on — each one traceable to a publisher and an observation date.',
  'ai.contract2Body':
    'Guidance framed as agricultural decision support. It does not claim to diagnose soil, guarantee a harvest, or promise an income.',
  'ai.contract3Body':
    'What the evidence cannot settle, including literature-based ranges, survey lag and missing months, stated in the answer itself.',
  'ai.contract4Body':
    'When the assembled evidence cannot support an answer, the advisor returns no recommendation and names the gap instead.',

  // --- Audience / call to action ---
  'cta.title': 'Open the platform and pick a place. The rest is live.',
  'cta.lede':
    'No signup, no demo data, no seeded numbers. Choose an Ethiopian market centre or type your own coordinates, and IRSHAYE reads the same public publishers you can read — then shows you exactly what it got, when, and what it could not get.',
  'cta.primary': 'Start in the Overview',
  'cta.secondary': 'Check source status first',
  'cta.eyebrow': 'Who it is for',
  'cta.a1Title': 'Farmers and household plots',
  'cta.a1Body':
    'Opens in a browser with no account and no key. Ge’ez crop names render properly, and figures are stated in units a decision uses — millimetres, metres above sea level, quintal prices.',
  'cta.a2Title': 'Development agents and cooperatives',
  'cta.a2Body':
    'One screen holds the climate context, the cited crop requirements, the conservation practices and the surveyed prices for the same location, so an advisory visit starts from shared evidence.',
  'cta.a3Title': 'Programmes, NGOs and researchers',
  'cta.a3Body':
    'Every publisher, licence and freshness window is declared, and derived values are labelled — so numbers taken out of the platform arrive with their provenance attached.',

  // --- Landing footer ---
  'footer.about':
    'An AI-assisted digital platform for climate-smart agriculture in Ethiopia. Location-based climate intelligence, crop and soil guidance, and market prices — with the evidence attached.',
  'footer.modules': 'Modules',
  'footer.publishers': 'Publishers',
  'footer.overview': 'Overview',
  'footer.linkHow': 'How IRSHAYE works',
  'footer.linkIntelligence': 'Climate, crops, soil, markets',
  'footer.linkAdvisory': 'The AI layer',
  'footer.linkRegistry': 'Source registry',
  'footer.linkSaved': 'Saved place and crop',
  'footer.disclaimer':
    'IRSHAYE provides agricultural decision support, not guarantees. Recommendations do not claim yield, income or water-savings outcomes that have not been measured on the ground, and no module diagnoses soil conditions without measurement. Literature-based crop ranges are documented preferences, not readings of your field. Satellite vegetation indices describe canopy greenness, not soil quality. Where a publisher does not return data, the platform reports the gap instead of substituting a value.',
  'footer.attributions':
    'Weather and climate: Open-Meteo (CC BY 4.0) and NASA POWER. Rainfall and temperature normals: ERA5 reanalysis via Open-Meteo. Market prices: WFP Ethiopia rEMS and World Bank real-time series via HDX. Exchange rates: National Bank of Ethiopia and World Bank. Boundaries and satellite layers: geoBoundaries, NASA GIBS, Ethiopia.GeoPortal on ArcGIS, GRID3/WorldPop and CDE — licences as stated on the Data Sources page.',

  // --- Loading and notice primitives ---
  'states.codeLabel': 'Code',
  'states.codeNoSubstitute': 'No substitute value is shown for this source.',

  // --- Provenance blocks ---
  'prov.kind.observed': 'Observed',
  'prov.kind.modeled': 'Modelled',
  'prov.kind.forecast': 'Forecast',
  'prov.kind.estimated': 'Derived here',
  'prov.kind.imputed': 'Filled in',
  'prov.noSource': 'No source available for this figure.',
  'prov.behindSchedule': 'Behind schedule',
  'prov.cachedCopy': 'Cached copy',
  'prov.sourceLink': 'source',
  'prov.observedAt': 'observed {when}',
  'prov.fetchedAt': 'fetched {when} (EAT)',
  'prov.dateNotStated': 'date not stated',
  'prov.notAvailable': 'Not available',

  // --- Value-kind legend (Data Sources) ---
  'legend.title': 'How values are classified',
  'legend.hint':
    'Every figure on the platform carries one of these kinds. The kind decides the colour, the wording, and which freshness window applies.',
  'legend.ruleLabel': 'Rule',
  'legend.observedMeaning':
    'A measurement the publisher reports as an observation of the atmosphere or a market survey.',
  'legend.observedRule': 'Shown with its observation date. Never presented as a prediction.',
  'legend.modeledMeaning':
    'A reanalysis or model product — physically based, but reconstructed rather than measured at your point.',
  'legend.modeledRule': 'Labelled modelled; grid resolution stated when the publisher gives it.',
  'legend.forecastMeaning': 'A forward run of a numerical weather model.',
  'legend.forecastRule': 'Never summed together with observations in the same series.',
  'legend.estimatedMeaning':
    'A figure this application computed from published values, such as a rainfall anomaly.',
  'legend.estimatedRule': 'Marked “derived here”, with its inputs named so it can be recalculated.',
  'legend.imputedMeaning': 'A value filled in where the publisher had none.',
  'legend.imputedRule':
    'IRSHAYE does not impute agricultural data. If this label ever appears, the substitution is stated on screen.',

  // --- Source status panel ---
  'sources.title': 'Source status',
  'sources.hint':
    'Each row is one live probe of the publisher itself. A source we cannot reach is reported as unreachable with the reason, never hidden or replaced.',
  'sources.recheck': 'Re-check',
  'sources.recheckAria': 'Re-check sources',
  'sources.probeScope': 'Probe scope',
  'sources.probing': 'Probing sources…',
  'sources.probeFailed': 'Status probe failed',
  'sources.apiKeyRequired': 'API key required',
  'sources.ranAt': 'Probes ran at {when} EAT.',
  'sources.allHint': '“All sources” also checks the large price and indicator feeds, which take longer.',
  'sources.storedPipeline': 'Stored pipeline',
  'sources.noSync':
    'No sync run has been recorded for this database, so nothing above is served from storage — every figure on this dashboard came from the publisher in this request. That is the working configuration; the sync only adds history and survives a publisher outage.',
  'sources.unfinished': 'unfinished',
  'sources.pageDescription':
    'IRSHAYE serves open data from named publishers and nothing else. An empty card means the publisher did not answer — there are no fixtures, examples, or placeholder values in the serving path.',
  'statusLabel.connected': 'Connected',
  'statusLabel.stale': 'Behind schedule',
  'statusLabel.unavailable': 'Unavailable',
  'statusLabel.auth_required': 'Credentials needed',
  'statusLabel.disabled': 'Turned off',
  'statusLabel.not_configured': 'Not configured',
  'syncLabel.succeeded': 'last run wrote everything',
  'syncLabel.partial': 'last run wrote some publishers',
  'syncLabel.failed': 'last run wrote nothing',
  'syncLabel.skipped_overlap': 'skipped, another run was active',

  // --- Location and crop pickers ---
  'picker.location': 'Location',
  'picker.surveyMarket': 'Survey market',
  'picker.ownPoint': 'Own point',
  'picker.hint':
    'Towns come from WFP’s published market reference table, so a selection carries the publisher’s own coordinates and region labels.',
  'picker.marketCentre': 'Market centre',
  'picker.customCoordinate': 'Custom coordinate',
  'picker.ownPointField': 'Or type your own point',
  'picker.ownPointHint': 'Used as given; no administrative names are attached to a typed coordinate.',
  'picker.latitude': 'Latitude',
  'picker.longitude': 'Longitude',
  'picker.selectedCoordinate': 'Selected coordinate',
  'picker.summaryWfp': '. Region and zone names are as published by WFP.',
  'picker.summaryOwn': '— {name}, your own point.',
  'picker.checkCoordinates': 'Check the coordinates',
  'picker.errorBlank': 'Enter a latitude and a longitude as numbers.',
  'picker.errorRange': 'Latitude must be between −90 and 90, longitude between −180 and 180.',
  'picker.listUnavailable': 'Location list unavailable',
  'picker.listFailed': 'Location list could not be loaded; the coordinate box still works.',
  'crops.yourCrop': 'Your crop',
  'crops.cropProfile': 'Crop profile',
  'crops.pickerHint':
    'Guidance is curated reference material with citations. Suitability compares it with live climate data and is labelled as modelled guidance, never as a measurement.',

  // --- Crop advisory module ---
  'crops.pageDescription':
    'Crop profiles are curated reference material, each figure cited to its publisher. The suitability check compares that documentation with live climate data and is labelled as modelled guidance — it is not a measurement of your field.',
  'crops.badgeNoProfile': 'No profile selected',
  'crops.overall.supported': 'Fits documented range',
  'crops.overall.mixed': 'Partially supported',
  'crops.overall.weak': 'Outside documented range',
  'crops.overall.insufficient-data': 'Not enough data',
  'crops.aspect.season': 'Season',
  'crops.aspect.rainfall': 'Rainfall',
  'crops.aspect.temperature': 'Temperature',
  'crops.aspect.altitude': 'Altitude',
  'crops.verdict.within': 'within',
  'crops.verdict.watch': 'watch',
  'crops.verdict.outside': 'outside',
  'crops.verdict.unknown': 'no data',
  'crops.noData': 'no data',
  'crops.noProfileTitle': 'Crop reference profiles',
  'crops.noProfileBody':
    'Curated, source-cited crop profiles for the covered Ethiopian crops are being assembled. Until a profile exists, this module shows no guidance — IRSHAYE does not present uncited agronomic figures. Climate and market modules work fully in the meantime.',
  'crops.liveComparison': 'Live comparison',
  'crops.liveComparisonHint':
    'Documented requirements for {crop} compared with live readings for {place}. Every verdict names the input it used.',
  'crops.provenanceForecast': 'forecast inputs',
  'crops.provenanceObserved': 'observed record',
  'crops.loadingComparison': 'Loading live climate for the comparison',
  'crops.altitudeDetail':
    "Documented agroecologies: {bands}. This platform cannot measure your field's altitude from open data, so treat elevation as your own judgement.",
  'crops.altitudeMissing': 'No documented altitude band was found for this crop.',
  'crops.requirementsTitle': 'Documented requirements',
  'crops.requirementsHint':
    'Reference values with citations — curated and literature-based, not live readings of your field.',
  'crops.seasonRainNeed': 'Seasonal rain need',
  'crops.documentedTotal': 'Documented total across the cycle.',
  'crops.tempRange': 'Temperature range',
  'crops.singlePoint': ' (single point)',
  'crops.seasonDependence': 'Rain season dependence',
  'crops.soilPreference': 'Soil preference',
  'crops.soilPreferenceNote': 'Documented drainage preference, not a soil test.',
  'crops.plantingHarvest': 'Planting & harvest windows',
  'crops.noPlantingCalendar':
    'No citable planting-month calendar was found for this crop — shown as a gap, not filled in.',
  'crops.plantLabel': 'Plant',
  'crops.harvestLabel': 'Harvest',
  'crops.noHarvestCalendar': 'No citable harvest-month calendar was found for this crop.',
  'crops.tempNoteTitle': 'Temperature requirement note',
  'crops.soilNoteTitle': 'Soil preference — documented, not measured',
  'crops.phDocumented': 'Documented pH {min}–{max}.',
  'crops.phMissing': 'No citable pH range was found.',
  'crops.practicesTitle': 'Documented practices',
  'crops.practicesHint': 'Management practices named in the cited sources for this crop.',
  'crops.risksTitle': 'Climate risks on record',
  'crops.risksHint':
    'Hazard descriptions from the cited literature, with the platform indicator that watches for them.',
  'crops.whenLabel': 'When:',
  'crops.watchLabel': 'Platform watch:',
  'crops.seasonTitle': 'Ethiopian seasonal calendar',
  'crops.seasonHint': 'Definitions of the seasons the windows above refer to.',
  'crops.limitsTitle': 'Limits of this reference layer',

  // --- Suitability sentences (generated by lib/crops/suitability.ts) ---
  'suitability.singlePoint': '(documented single point)',
  'suitability.seasonNoCalendar':
    'No citable month calendar was found in the curated sources for {crop}, so IRSHAYE shows no planting or harvest window rather than guessing one.',
  'suitability.seasonPlanting': '{month} falls inside a documented planting window for {crop}.',
  'suitability.seasonHarvest': '{month} falls inside a documented harvest window for {crop}.',
  'suitability.seasonOutside': '{month} is outside the documented planting and harvest windows for {crop}.',
  'suitability.rainNoRange': 'No citable seasonal rainfall range was found for this crop, so no comparison is made.',
  'suitability.rainNoData': 'Live rainfall data is unavailable right now, so the seasonal range cannot be compared.',
  'suitability.rainDry':
    'Documented need is {need} mm per season, but the near-term rain signal is weak ({signal}). Delay rain-dependent operations where possible.',
  'suitability.rainForecast7': '{mm} mm forecast in 7 days',
  'suitability.rainNoMeasurable': 'no measurable rain in the recent record',
  'suitability.rainWithin':
    'Documented need is {need} mm per season. Near-term rain: {forecast}; recent observed {observed}.',
  'suitability.notAvailable': 'not available',
  'suitability.tempNoRange': 'No citable temperature range was found for this crop.',
  'suitability.tempNoData': 'Live temperature readings are unavailable, so no comparison is made.',
  'suitability.tempOutside':
    'Current readings ({readings}) sit beyond the documented comfort range {range} for {crop}. {notes}',
  'suitability.tempBrush': 'Readings brush the edge of the documented range ({range}). {notes}',
  'suitability.tempWithin': 'Current readings {readings} sit inside the documented range {range}.',

  // --- Overview module ---
  'overview.title': 'Farm overview',
  'overview.description':
    'Pick your place and your crop. Everything below is live data with its source attached, and the platform says plainly when a figure is a forecast or a model output rather than a measurement.',
  'overview.badgeLive': 'Live',
  'overview.badgeConnecting': 'Connecting',
  'overview.badgeNoReading': 'No live reading',
  'overview.changeContext': 'Change saved context',
  'overview.yourLocation': 'Your location',
  'overview.seasonContext': 'Season context — {place}',
  'overview.seasonHint':
    'Month of {month}. Guidance compares the live forecast with your crop’s documented reference requirements.',
  'overview.rainNow': 'rain now {value} mm',
  'overview.loadingWeather': 'Loading live weather',
  'overview.tempNow': 'Temperature now',
  'overview.observedAt': 'Observed {when}',
  'overview.noObservation': 'No observation returned',
  'overview.rainOutlookNote': 'Sum of forecast daily totals — a modelled outlook, not a measurement.',
  'overview.noForecastDays': 'No forecast days were returned.',
  'overview.nextRainDay': 'Next day ≥ 1 mm',
  'overview.noneIn7d': 'None in 7d',
  'overview.nextRainDayNote': 'First forecast day reaching one millimetre of rainfall.',
  'overview.humidityNow': 'Humidity now',
  'overview.humidityNote': 'Relative humidity from the same observation as the temperature.',
  'overview.forecastDays': 'Forecast days shown',
  'overview.forecastDaysNote': 'Open-Meteo horizon for this point.',
  'overview.warmest': 'Warmest outlook',
  'overview.warmestNote': 'Highest daily maximum among the forecast days returned.',
  'overview.cooliest': 'Cooliest outlook',
  'overview.cooliestNote': 'Lowest daily minimum among the forecast days returned.',
  'overview.plantingWindow': 'Planting window',
  'overview.harvestWindow': 'Harvest window',
  'overview.outsideWindows': 'Outside documented windows',
  'overview.plantingNowNote': 'This month sits inside a documented planting window for this crop.',
  'overview.harvestNowNote': 'This month sits inside a documented harvest window for this crop.',
  'overview.outsideWindowsNote':
    'This month is outside the documented planting and harvest windows — the crop profile shows which months the sources name.',
  'overview.openCrops': 'Open Crop Advisory',
  'overview.noCropProfileNote':
    'Crop reference profiles are curated with sources. Until a profile exists for this crop, no planting guidance is shown — the platform will not guess.',
  'overview.modulesAria': 'Modules',
  'overview.goDeeper': 'Go deeper',

  // --- Climate module ---
  'climate.description':
    'Live conditions and forecast from Open-Meteo, rainfall history and 30-year normals from NASA POWER, and satellite readings for the same point. Observed, forecast, modelled and derived values are always labelled as what they are.',
  'climate.currentConditions': 'Current conditions · {place}',
  'climate.currentHint':
    'Open-Meteo’s analysed now-time for the grid cell, with the station-independent elevation the publisher reports.',
  'climate.loadingWeather': 'Reading Open-Meteo',
  'climate.temperature': 'Temperature',
  'climate.wind': 'Wind',
  'climate.rainThisHour': 'Rain this hour',
  'climate.gridElevation': 'Grid elevation',
  'climate.notReported': 'not reported',
  'climate.timezoneLabel': 'timezone',
  'climate.outsideEthiopia':
    'This point falls outside Ethiopia’s published extent, so national sources may not cover it.',
  'climate.weekAround': 'The week just past and the week ahead',
  'climate.weekHint':
    'Green bars are analysed observations, violet bars are the forecast. One chart, two different kinds of number — never blended into one series.',
  'climate.buildingOutlook': 'Building the outlook',
  'climate.todayMarker': 'today →',
  'climate.rainObserved': 'Rain, observed',
  'climate.rainForecast': 'Rain, forecast',
  'climate.maxTemp': 'Max °C',
  'climate.minTemp': 'Min °C',
  'climate.keyRainObserved': 'Rain — observed ({count} days)',
  'climate.keyRainForecast': 'Rain — forecast ({count} days)',
  'climate.keyMaxTemp': 'Daily maximum temperature',
  'climate.keyMinTemp': 'Daily minimum temperature',
  'climate.rainPastDays': 'Rain past {count} d',
  'climate.rainNextDays': 'Rain next {count} d',
  'climate.rainNextNote': 'Sum of modelled daily totals.',
  'climate.et0Today': 'ET0 today',
  'climate.et0Note': 'FAO-56 reference evapotranspiration.',
  'climate.rainProbToday': 'Rain prob today',
  'climate.dailyDetail': 'Daily detail',
  'climate.thDate': 'Date',
  'climate.thKind': 'Kind',
  'climate.thRainMm': 'Rain mm',
  'climate.thProbPct': 'Prob %',
  'climate.thMaxMin': 'Max / min °C',
  'climate.thHumidityPct': 'Humidity %',
  'climate.thWindKmh': 'Wind km/h',
  'climate.thEt0Mm': 'ET0 mm',
  'climate.agroTitle': 'Agroclimatology · {place}',
  'climate.agroHint':
    'NASA POWER daily surface values for this grid cell. The window ends yesterday because POWER publishes reanalysis with a 1–3 day lag.',
  'climate.loadingPower': 'Reading NASA POWER',
  'climate.normalMarker': 'normal mm/day',
  'climate.keyDailyRain': 'Daily rainfall — POWER observations',
  'climate.keyNormal': 'Climatological normal mm/day (dashed)',
  'climate.rainWindowDays': 'Rain {count} d',
  'climate.meanDailyMax': 'Mean daily max',
  'climate.meanDailyMin': 'Mean daily min',
  'climate.meanShortwave': 'Mean shortwave',
  'climate.anomalyTitle': 'Rainfall anomaly — computed here, not published',
  'climate.anomalyBody': '{observed} mm fell against {expected} mm of climatology for {period}:',
  'climate.anomalyNotComputable': 'not computable from the data returned',
  'climate.anomalyRatio':
    'Ratio of two published quantities (POWER daily against POWER 30-year normals for the same cell). Coverage {has}/{requested} days',
  'climate.anomalySparse': ' — too sparse to present as a season total',
  'climate.noAnomalyTitle': 'No anomaly shown',
  'climate.noAnomalyBody':
    'The climatology request failed ({reason}). The observed rainfall above is still real.',
  'climate.satelliteTitle': 'Satellite reading for this point',
  'climate.satelliteHint':
    'A physical value read out of the published tile for this exact coordinate, decoded with the publisher’s own colour map.',
  'climate.ndviTitle': 'Vegetation greenness (NDVI, 8-day composite)',
  'climate.imergTitle': 'Precipitation rate (GPM IMERG)',
  'climate.satelliteFootnote':
    'The sampled footprint is one tile pixel — hundreds of metres across — not the farmer’s plot. Neither product measures yield or soil conditions; the band wording above is the publisher’s own.',
  'climate.fetchingTile': 'Fetching tile',
  'climate.noValue': 'no value',
  'climate.publishedBand': 'Published band: “{band}”.',
  'climate.noMappedValue': 'This pixel carries no mapped value, so none is claimed.',
  'climate.sceneDate': 'Scene date',
  'climate.pixelSize': 'pixel ≈',
  'climate.outsideEthiopiaSuffix': ' — outside Ethiopia',
  'climate.whatItMeans': 'What it means:',
  'climate.limitLabel': 'Limit:',

  // --- Markets module ---
  'markets.description':
    'Prices surveyed in Ethiopian markets by the WFP rEMS monitoring programme and the FEWS NET weekly market survey, in the currency and unit each publisher recorded. Nothing is modelled, projected or filled in here: a source that does not answer is shown as unavailable.',
  'markets.badgeLiveSurvey': 'Live survey',
  'markets.surveyMonth': 'Survey month',
  'markets.historyTitle': 'Price history in Ethiopian markets',
  'markets.historyHint':
    'One series at a time — a commodity, the publisher’s unit and one price type. The mean, lowest and highest lines are computed here from the rows that carry figures; where a period has no published figure the line breaks instead of joining across it.',
  'markets.commodity': 'Commodity',
  'markets.loadingHistory': 'Loading {commodity} history',
  'markets.noSeriesTitle': 'No series drawn',
  'markets.noSeriesBody':
    'No survey published a figure for {commodity} in this unit, price type and window, so no line is drawn and no price is invented.',
  'markets.unitsNote':
    'Prices are in the currency and unit the surveyor recorded. Retail and wholesale are never averaged together, and two units of the same commodity stay two separate series.',
  'markets.crossMarketTitle': 'Regions and markets · one survey month',
  'markets.crossMarketHint':
    'One commodity, one unit, one price type, one month — the only comparison these surveys support. The spread and the percent above cheapest are our arithmetic on published market means.',
  'markets.region': 'Region',
  'markets.allRegions': 'All regions',
  'markets.loadingLatest': 'Loading latest survey month',
  'markets.thMarket': 'Market',
  'markets.thLatest': 'Latest',
  'markets.thChange': 'Change',
  'markets.vs': 'vs',
  'markets.fxTitle': 'Ethiopian foreign exchange — three separate categories',
  'markets.fxHint':
    'The official rate is a daily NBE publication, the parallel rate is a World Bank monthly national average and the benchmark rate is an annual figure. They are different kinds of number and are shown apart.',
  'markets.loadingFx': 'Loading NBE and World Bank',
  'markets.officialLabel': 'Official · NBE daily indicative',
  'markets.parallelLabel': 'Parallel market · World Bank monthly national average',
  'markets.benchmarkLabel': 'Benchmarks · World Bank annual indicators',
  'markets.etbPerUsd': 'ETB per US$',
  'markets.officialNote':
    'One bar per published trading date. This is a reference rate set by the central bank, not a rate a bureau quotes you.',
  'markets.parallelNote':
    'A monthly survey average, not a daily quotation: the newest point is the latest month the World Bank has compiled, which may be months behind today.',
  'markets.publishedFrequency': 'published {frequency}',
  'markets.referencePeriod': 'reference {period}',
  'markets.annualTitle': 'Annual series, published in arrears',
  'markets.annualBody': 'Context only — these are not current-month figures.',
  'markets.noRowsTitle': 'No rows returned',
  'markets.noRowsBody': '{label}: this response carried no rows, and nothing was substituted for them.',

  // --- Markets module · shared registries ---
  'markets.sectionPicker': 'Module view',
  'markets.publishers': 'Ethiopian market surveys',
  'markets.unavailableTitle': 'No market publisher answered',
  'markets.unavailableBody':
    'Every figure on this page is read from a survey at request time, so when no publisher answers there is nothing to display. Nothing has been substituted, and the report underneath names each publisher and what its own request returned.',
  'markets.contributing': 'In this answer',
  'markets.coverageClean': '{rows} rows matched, every one carrying a published figure.',
  'markets.coverageWithGaps':
    '{rows} rows matched, of which {gaps} carry no published figure — the empty cells are survey gaps, not zero prices.',
  'markets.ofCount': 'of {total}',
  'markets.noSpan': 'A single survey date only.',
  'markets.months': 'months',
  'markets.weeks': 'weeks',
  'markets.lastWindow': 'last {count} {unit}',
  'markets.col.markets': 'Markets',
  'markets.col.months': 'Months',
  'markets.col.periods': 'Periods',
  'markets.col.rows': 'Rows',
  'common.unit': 'Unit',
  'dataType.market-survey': 'market survey',
  'dataType.reference-price': 'reference price',
  'dataType.projection': 'projection',
  'dataType.administrative': 'administrative boundary',
  'freshness.current': 'Current',
  'freshness.recent': 'Recent',
  'freshness.stale': 'Behind schedule',
  'freshness.historical': 'Historical record',
  'freshness.unknown': 'No usable date',
  'statusLabel.historical': 'Historical record',
  'markets.state.access_challenged': 'Access challenged',
  'markets.granularity.weekly': 'Weekly',
  'markets.granularity.monthly': 'Monthly',
  'markets.flag.actual': 'Observed',
  'markets.flag.aggregate': 'Aggregated',
  'markets.flag.replaced': 'Replaced figure',
  'markets.flag.unknown': 'Unflagged',

  // --- Markets module · tabs ---
  'markets.tab.overview': 'Overview',
  'markets.tab.prices': 'Price explorer',
  'markets.tab.history': 'Price history',
  'markets.tab.regions': 'Regions and markets',
  'markets.tab.insights': 'What the data shows',
  'markets.tab.exchange': 'Foreign exchange',
  'markets.tab.sources': 'Sources',

  // --- Markets module · overview ---
  'markets.ov.observations': 'Published prices',
  'markets.ov.observationsNote': '{rows} surveyed rows carry no figure; they are listed as gaps.',
  'markets.ov.commodities': 'Commodities covered',
  'markets.ov.commoditiesNote': 'Across {units} publisher units, never merged.',
  'markets.ov.markets': 'Markets surveyed',
  'markets.ov.marketsNote': 'In {regions} regions; {mapped} carry a publisher coordinate.',
  'markets.ov.periods': 'Survey periods',
  'markets.ov.periodsNote': 'Distinct observation dates, spread over {months} months.',
  'markets.ov.coverageTitle': 'What these surveys actually cover',
  'markets.ov.coverageHint':
    'Counts of published rows only — no average, no index, and no commodity a survey did not record.',
  'markets.ov.newest': 'Newest observation',
  'markets.ov.newestNote': 'Classified {tier} against its own publisher’s cadence.',
  'markets.ov.oldest': 'Oldest observation',
  'markets.ov.span': 'Survey months run from {from} to {to}.',
  'markets.ov.publishers': 'Publishers answering',
  'markets.ov.publishersNote': 'Each is loaded on its own, so one failure cannot empty this page.',
  'markets.ov.currencies': 'Currencies as published',
  'markets.ov.units': 'Units as published',
  'markets.ov.unitsNote': 'A price per 100 KG and a price per KG are two series, never one average.',
  'markets.ov.priceTypes': 'Price types',
  'markets.ov.granularities': 'Chart granularity the publishers support: {list}.',
  'markets.ov.catalogTitle': 'Commodities with published prices',
  'markets.ov.catalogHint':
    'Ordered by how many markets reported a figure. The list is read from the survey rows themselves, so a commodity no publisher surveyed is absent rather than empty.',
  'markets.ov.catalogTruncated': 'Showing the {shown} deepest of {total} commodity-and-unit series; the explorer lists every one.',
  'markets.ov.qualityTitle': 'Data quality the module can see',
  'markets.ov.qualityHint': 'Each of these is a count of published rows — a coverage fact, not a correction.',
  'markets.ov.gaps': 'Rows without a figure',
  'markets.ov.gapsNote': 'Rendered as empty cells. A zero would be a different claim.',
  'markets.ov.duplicates': 'Duplicate rows removed',
  'markets.ov.duplicatesNote':
    'Same publisher, market, commodity, unit, price type and date; the row carrying a figure is the one kept.',
  'markets.ov.unmapped': 'Markets without coordinates',
  'markets.ov.unmappedNote': '{mapped} markets are mappable. The rest stay in tables and are never placed by guess.',
  'markets.ov.seasonal': 'Series deep enough for seasonality',
  'markets.ov.seasonalNote': 'At least twelve survey months under one unit and price type.',
  'markets.ov.limitTitle': 'What this module cannot say',
  'markets.ov.limitBody':
    'These are surveyed retail and wholesale prices at named markets — not a national price index, not a farm-gate price and not a forecast. No yield, income or saving is claimed, and a survey month with no figure stays missing.',

  // --- Markets module · explorer ---
  'markets.ex.title': 'Price explorer',
  'markets.ex.hint':
    'One page of published rows at a time. Filters name only values the surveys contain, and a row with no figure stays an empty cell.',
  'markets.ex.search': 'Search market or commodity',
  'markets.ex.searchPlaceholder': 'for example Mekele, or Teff',
  'markets.ex.allCommodities': 'All commodities published',
  'markets.ex.allMarkets': 'All markets',
  'markets.ex.allSources': 'All publishers',
  'markets.ex.anyUnit': 'Any unit',
  'markets.ex.anyPriceType': 'Any price type',
  'markets.ex.priceType': 'Price type',
  'markets.ex.surveyRange': 'Survey window',
  'markets.ex.surveyRangeHint': 'Filtered on the publishers’ own observation dates.',
  'markets.ex.fromDate': 'Observations from',
  'markets.ex.toDate': 'Observations to',
  'markets.ex.pricedOnly': 'Only rows carrying a figure',
  'markets.ex.clear': 'Clear {count} filters',
  'markets.ex.clearAll': 'Clear all filters',
  'markets.ex.loading': 'Loading published price rows',
  'markets.ex.sourceLabel': 'Ethiopian market surveys',
  'markets.ex.emptyTitle': 'No published rows match these filters',
  'markets.ex.emptyHint':
    'Filters match the publisher’s own spellings exactly, so a combination no survey reported returns nothing. Nothing is invented to fill the table.',
  'markets.ex.tableCaption': 'Published Ethiopian market price observations',
  'markets.ex.sortAria': 'Sort by {label}',
  'markets.ex.price': 'Price',
  'markets.ex.quality': 'Type and quality',
  'markets.ex.freshness': 'Freshness',
  'markets.ex.noFigure': 'This survey cell carries no published figure',
  'markets.ex.perUnit': 'per {unit}',
  'markets.ex.prev': 'Previous',
  'markets.ex.next': 'Next',
  'markets.ex.pageOf': 'Page {page} of {pages}',
  'markets.ex.perPage': 'Rows per page',
  'markets.ex.matched': '{total} rows match these filters',
  'markets.ex.window': 'Newest in this result {newest}; oldest {oldest}.',
  'markets.ex.staleTitle': 'Some rows are behind their publisher’s schedule',
  'markets.ex.staleBody':
    'Freshness is graded per publisher against the cadence that publisher declares, so a weekly survey and a monthly one are not judged by the same clock.',
  'markets.ex.export': 'Export CSV',
  'markets.ex.exportHint':
    'Exports the {rows} rows of page {page} of {pages}, each with the publisher’s unit, currency, survey date, retrieval time and source link. Leading characters are neutralised so a spreadsheet cannot execute a name as a formula.',

  // --- Markets module · history ---
  'markets.hist.granularity': 'Bucket size',
  'markets.hist.windowLabel': 'Periods shown',
  'markets.hist.unitHint': 'The publisher’s unit; changing it changes the series.',
  'markets.hist.average': 'Mean of period',
  'markets.hist.lowest': 'Lowest figure',
  'markets.hist.highest': 'Highest figure',
  'markets.hist.derivedNote': 'Calculated here from published rows.',
  'markets.hist.latestNote': 'Surveyed {when}, across {markets} markets.',
  'markets.hist.lowestNote': 'Recorded at {when}.',
  'markets.hist.highestNote': 'Recorded at {when}.',
  'markets.hist.change': '{direction} {pct}% between survey periods',
  'markets.hist.up': 'Up',
  'markets.hist.down': 'Down',
  'markets.hist.seriesNote':
    '{commodity} · {unit} · {retail}: {periods} periods with figures, across {markets} markets that reported them.',
  'markets.hist.fallbackTitle': 'Drawn monthly',
  'markets.hist.fallbackBody':
    'No publisher contributing {commodity} surveys weekly, so this series is bucketed by survey month. A weekly line would plot days nobody looked at.',
  'markets.hist.gapTitle': 'Periods with no published figure',
  'markets.hist.gapBody':
    '{count} periods inside this window produced no price. The line breaks at each one; nothing is interpolated.',
  'markets.hist.onePoint':
    'Only {count} period in this window carries a figure, so no trend line is drawn — one point is not a trend.',
  'markets.hist.byMarketTitle': 'The same statistic, market by market',
  'markets.hist.byMarketHint':
    'Each row is one market inside the same commodity, unit and price type. Percentage change is our arithmetic on the two most recent periods that carry figures.',
  'markets.hist.publishersInSeries': 'Rows behind this series come from: {list}.',
  'markets.hist.recheck': 'Re-read this series from the publisher',

  // --- Markets module · regions ---
  'markets.reg.monthHint': 'Only months with published figures for this commodity are offered.',
  'markets.reg.marketsShown': '{count} markets reported',
  'markets.reg.cheapest': 'Cheapest market',
  'markets.reg.dearest': 'Dearest market',
  'markets.reg.atMarket': 'At {market}.',
  'markets.reg.spread': 'Dearest above cheapest',
  'markets.reg.spreadNote': 'Calculated here between the two market means of this month, same unit and price type.',
  'markets.reg.singleMarket':
    'One market only published this month for this commodity, unit and price type, so there is no spread to report.',
  'markets.reg.noneTitle': 'No published figures in this month',
  'markets.reg.noneBody':
    'In {month} the surveys returned no price for {commodity} per {unit} at the selected price type. Choose another month rather than reading an empty comparison as a cheap one.',
  'markets.reg.mapTitle': 'Where the publisher places these markets',
  'markets.reg.mapHint':
    'Each dot sits on the coordinate the publisher published for that market, over geoBoundaries administrative outlines. A market with no coordinate is left off the map and stays in the table.',
  'markets.reg.mapAria': 'Map of {count} surveyed Ethiopian markets plotted at their published coordinates',
  'markets.reg.ramp': 'cheaper {low} to dearer {high} {currency} per {unit}',
  'markets.reg.plotted': '{plotted} of {total} markets plotted',
  'markets.reg.unplottedNote': 'The rest have no publisher coordinate.',
  'markets.reg.loadingOutlines': 'Loading administrative outlines…',
  'markets.reg.outlineNote':
    'The administrative outlines could not be loaded, so the market points are shown without them. No boundary is drawn from memory.',
  'markets.reg.byRegionTitle': 'Regional averages for the month',
  'markets.reg.byRegionHint': 'The mean of the markets surveyed inside one region, in the publisher’s own region labels.',
  'markets.reg.regionMarkets': '{count} markets surveyed · per {unit}',
  'markets.reg.tableTitle': 'Market by market',
  'markets.reg.tableCaption': 'One commodity, unit and price type compared across markets in a single survey month',
  'markets.reg.tableNote': 'In {month}, {markets} markets published a figure for this series.',
  'markets.reg.price': 'Price',
  'markets.reg.aboveCheapest': 'Above cheapest',
  'markets.reg.hasCoords': 'Publisher coordinate',
  'markets.reg.noCoords': 'No coordinate published',
  'markets.reg.publisherNote': 'Supplied by: {list}.',

  // --- Markets module · insights ---
  'markets.ins.title': 'What the observations support',
  'markets.ins.hint':
    'Each finding names the series, markets, row count and period behind it, and carries its own limitation. A correlation is never called a cause, and no price is projected forward.',
  'markets.ins.noneTitle': 'No finding reaches the evidence bar',
  'markets.ins.noneBody':
    'A movement needs two consecutive survey periods with real figures, and a spread needs at least two markets reporting the identical commodity, unit and price type in the same month. Where those conditions are not met, no statement is made.',
  'markets.ins.kind.price-rise': 'Price rise',
  'markets.ins.kind.price-fall': 'Price fall',
  'markets.ins.kind.market-spread': 'Gap between markets',
  'markets.ins.kind.seasonal-coverage': 'Depth of coverage',
  'markets.ins.kind.market-outdated': 'Markets not surveyed recently',
  'markets.ins.kind.thin-coverage': 'Single-market commodity',
  'markets.ins.price-rise':
    'In {market}, {commodity} per {unit} ({retail}) was {pct}% higher in {to} than in {from}, at {price}.',
  'markets.ins.price-fall':
    'In {market}, {commodity} per {unit} ({retail}) was {pct}% lower in {to} than in {from}, at {price}.',
  'markets.ins.market-spread':
    'In {month}, {commodity} per {unit} ({retail}) cost {pct}% more in {dearest} than in {cheapest}, across {markets} markets.',
  'markets.ins.seasonal-coverage':
    '{series} commodity-and-unit series have at least twelve survey months; the deepest is {commodity} per {unit}, with {months} months across {markets} markets.',
  'markets.ins.market-outdated':
    '{months} markets have no survey row newer than {lastMonth}, while the newest survey month is {latestMonth} — among them {markets}.',
  'markets.ins.thin-coverage':
    '{commodity} per {unit} ({retail}) is surveyed in one market only ({market}), so no regional statement about it is possible.',
  'markets.insightLimit.change':
    'One market’s own survey, period on period. It is not a national index, and it does not explain why the price moved.',
  'markets.insightLimit.spread':
    'A gap between two market surveys in one month. Transport, local supply and survey timing all differ at once, so the gap is not attributable to any one of them.',
  'markets.insightLimit.seasonal':
    'Depth of coverage only: it says how many months were published, not that a seasonal pattern exists.',
  'markets.insightLimit.coverage': 'A statement about the surveys themselves, not about the market.',
  'markets.ins.seasonalTitle': 'Series with a year or more of coverage',
  'markets.ins.seasonalHint':
    'Months carrying figures, per commodity, unit and price type. Listed to show where a seasonal question could be asked at all.',
  'markets.ins.wetVsDry': 'Wet months against the rest',
  'markets.ins.seasonalLimitation':
    'That figure compares June to September with the other months across whatever years were published. With one year of rows it describes that year, not a pattern, and it is never a forecast.',
  'markets.ins.evidenceSeries': 'Series',
  'markets.ins.evidenceRows': 'Rows',
  'markets.ins.limitLabel': 'Limit',

  // --- Markets module · source report ---
  'markets.src.title': 'Publisher-by-publisher status',
  'markets.src.hint':
    'What this deployment’s own requests returned, per publisher: state, newest observation, retrieval time, coverage and the publisher’s own catalogue.',
  'markets.src.none': 'No publisher report came back with this answer.',
  'markets.src.answering': '{count} answering',
  'markets.src.refusing': '{refused} refusing · {silent} silent',
  'markets.src.chip': 'bot protection',
  'markets.src.publisherSite': 'Publisher page',
  'markets.src.challengeTitle': 'Reachable, and refusing the automated download',
  'markets.src.challengeBody':
    'The publisher’s bot protection answered our request instead of serving the file. We do not answer that challenge or imitate a browser, so no rows were retrieved and none are substituted. The catalogue below is the publisher’s own statement that the dataset exists and when it last changed.',
  'markets.src.outageTitle': 'No answer from this publisher',
  'markets.src.outageBody':
    'The request did not return usable rows, so this publisher contributes nothing to the figures above. A cached copy is never kept as a substitute for a current reading.',
  'markets.src.rows': 'Rows held',
  'markets.src.publishedCount': 'the publisher counts',
  'markets.src.truncated': 'fewer than published',
  'markets.src.excluded': 'Rows held back',
  'markets.src.excludedNote': 'Not prices — wage rows, or cells that could not be read as a figure.',
  'markets.src.coverage': 'Coverage',
  'markets.src.oldestObservation': 'Oldest observation',
  'markets.src.ageDays': '{days} days old',
  'markets.src.retrieved': 'Retrieved',
  'markets.src.retrievalAge': '{days} days in our cache',
  'markets.src.dataType': 'Kind of figure',
  'markets.src.catalogue': 'Publisher’s own catalogue',
  'markets.src.catalogueReachable': 'Reachable — the dataset was last changed {modified}.',
  'markets.src.catalogueUnreachable': 'The catalogue endpoint did not answer either.',
  'markets.src.notStated': 'date not stated',
  'markets.src.rowPaging': 'rows paged as JSON',
  'markets.src.fileOnly': 'whole-file download',
  'markets.src.httpTitle': 'A successful request is not the same claim as a current dataset',
  'markets.src.httpBody':
    'State is derived from the newest observation date measured against the cadence that publisher declares, not from an HTTP status. A publisher can answer in milliseconds and still be weeks behind its own schedule; that is reported as behind schedule, not as connected.',

  // --- Soil module ---
  'soil.pageDescription':
    'Soil conservation and erosion-prevention guidance for Ethiopian farms, paired with the observed rainfall that makes each practice timely.',
  'soil.badgeRainfallObserved': 'Rainfall observed',
  'soil.measuredTitle': 'Measured vs modelled — what this module can and cannot tell you',
  'soil.measuredBody':
    'IRSHAYE has [[no soil measurements]] for your field. Rainfall figures below are observations from NASA POWER with their dates attached; the practices are documented extension guidance with citations. Nothing here diagnoses soil fertility or acidity — that requires local sampling and a laboratory.',
  'soil.measuredBodySecond':
    'Satellite vegetation indices describe plant cover, not soil quality, and are never presented as soil data.',
  'soil.rainfallDriversTitle': 'Rainfall drivers at {place} — last 90 days',
  'soil.rainfallDriversHint':
    'Observed daily precipitation (NASA POWER). Heavy-rain days are the practical trigger for erosion-prevention work.',
  'soil.loadingRainfall': 'Loading observed rainfall',
  'soil.heavyRainDays': 'Heavy-rain days (≥12 mm)',
  'soil.ofDaysWithData': 'of days with data',
  'soil.heavyRainNote': 'Threshold used to flag runoff risk; not a soil measurement.',
  'soil.totalRainfall': 'Total rainfall in window',
  'soil.totalRainfallNote': 'Sum over {count} days the publisher returned.',
  'soil.recordCoverage': 'Record coverage',
  'soil.recordCoverageNote': 'Days with a published value over days requested.',
  'soil.guidanceTitle': 'Conservation guidance',
  'soil.guidanceEmpty':
    'The curated, source-cited practice library for this module is being assembled now. Until each entry carries a citable source, it is not shown — IRSHAYE will not present uncited agronomic instructions. The rainfall context above works in the meantime.',
  'soil.practicesLabel': 'Documented conservation practices',
  'soil.whenToAct': 'When to act',

  // --- Settings module ---
  'settings.pageDescription':
    'Every control on this page does something real. Accounts and shared workspaces arrive once the independent Irshaye Supabase project is provisioned — until then preferences are stored on this device only.',
  'settings.savedContext': 'Your saved context',
  'settings.savedContextHint':
    'Stored in this browser. It drives the Overview workflow and every module’s default location.',
  'settings.crop': 'Crop',
  'settings.noCuratedProfile': 'No curated profile yet',
  'settings.storage': 'Storage',
  'settings.storageDeviceOnly': 'This device only — no account is created',
  'settings.appearanceHint':
    'The dark canvas keeps the same value-kind colours, so a forecast stays violet and an observation stays green either way.',
  'settings.switchToLight': 'Switch to light',
  'settings.switchToDark': 'Switch to dark',
  'settings.colourSemantics': '— the same colour semantics in both canvases.',
  'settings.integrationStatus': 'Integration status',
  'settings.integrationHint': 'What this deployment can actually reach right now. Nothing here is decorative.',
  'settings.openDataName': 'Open data publishers (weather, climate, prices, satellite)',
  'settings.openDataDetail': 'Key-free public APIs probed live via /api/data/status.',
  'settings.advisorName': 'AI Agricultural Advisor (Gemini)',
  'settings.advisorDetail':
    'Requires GEMINI_API_KEY in this environment. The advisor degrades to an honest unavailable state without it.',
  'settings.referenceName': 'Crop and soil reference library',
  'settings.referenceDetail':
    'Curated, citation-backed profiles shipped with the application; not a live publisher.',
  'settings.accountsName': 'Accounts & saved records (Supabase)',
  'settings.accountsDetail':
    'Irshaye needs its own Supabase project before accounts are enabled. No shared credentials with any other application.',

  // --- AI advisor module ---
  'advisor.pageDescription':
    'The advisor may reason only over evidence the platform has assembled and traced to a publisher. It cites its inputs, states uncertainty and limitations, and stays silent when the evidence is insufficient. It will never promise yields or diagnose your soil.',
  'advisor.badgeEvidenceOnly': 'Reasons over platform evidence only',
  'advisor.askTitle': 'Ask about your season',
  'advisor.askHint':
    'The question is answered for {place} and the selected crop, using only the evidence listed under the answer.',
  'advisor.questionLabel': 'Your question',
  'advisor.charCount': '{count}/900 characters',
  'advisor.questionPlaceholder':
    'Example: rain is expected in the next few days — should I wait to sow, and what should I prepare meanwhile?',
  'advisor.example1': 'Is it a good time to prepare land and plant?',
  'advisor.example2': 'What weather risks should I plan around this week?',
  'advisor.example3': 'How should I time inputs given the rainfall outlook?',
  'advisor.assembling': 'Assembling evidence…',
  'advisor.submit': 'Get an evidence-based answer',
  'advisor.unavailableTitle': 'Advisor unavailable',
  'advisor.networkError': 'This service could not be reached. No answer is shown rather than a guess.',
  'advisor.notConfigured':
    'This deployment has no GEMINI_API_KEY configured, so the advisor cannot run. Everything else on the platform works without it — no fabricated answer is produced.',
  'advisor.responseTitle': 'Advisor response',
  'advisor.badgeInsufficient': 'Insufficient evidence',
  'advisor.badgeBacked': 'Evidence-backed',
  'advisor.abstains': 'The advisor abstains',
  'advisor.uncertainty': 'Uncertainty',
  'advisor.limitations': 'Limitations',
  'advisor.evidenceTitle': 'Evidence behind this answer',
  'advisor.evidenceHint':
    'Exactly what the advisor was allowed to use, with each value’s classification and publisher.',
  'advisor.gapsTitle': 'Known gaps the advisor considered',
  'advisor.kind.reference': 'reference',
} as const;

export type TranslationKey = keyof typeof en;
