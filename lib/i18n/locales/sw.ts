import type { Dictionary } from '../types';

/** Kiswahili. */
export const sw: Dictionary = {
  // --- Brand and application shell ---
  'brand.tagline': 'Kilimo mwenye akili ya tabianchi',
  'shell.openDataLive': 'Data huria, ya moja kwa moja',
  'shell.workingContext': 'Muktadha wa kazi',
  'shell.noCropProfile': 'Hakuna wasifu wa zao uliotengenezwa bado',
  'shell.appearance': 'Muonekano',
  'shell.language': 'Lugha',
  'shell.breadcrumbPlatform': 'Jukwaa',
  'shell.moduleFallback': 'IRSHAYE',

  // --- Accessibility ---
  'a11y.skip': 'Ruka hadi maudhui',
  'a11y.openNavigation': 'Fungua urambazaji',
  'a11y.closeNavigation': 'Funga urambazaji',
  'a11y.navigation': 'Urambazaji',
  'a11y.chooseLanguage': 'Chagua lugha',
  'a11y.currentLanguage': 'Lugha ya sasa: {language}',
  'a11y.themeToLight': 'Badilisha kwenye mandhari njepesi',
  'a11y.themeToDark': 'Badilisha kwenye mandhari nyeusi',

  // --- Sidebar groups ---
  'nav.group.Today': 'Leo',
  'nav.group.Intelligence': 'Taarifa',
  'nav.group.Advisory': 'Ushauri',
  'nav.group.Platform': 'Jukwaa',

  // --- Modules (single source for sidebar, tiles and page headers) ---
  'module.overview.label': 'Muhtasari',
  'module.overview.short': 'Muhtasari',
  'module.overview.description': 'Eneo lyenu, zao lyenu, na muktadha wa msimu muhimu sasa hivi.',
  'module.climate.label': 'Taarifa za Tabianchi',
  'module.climate.short': 'Tabianchi',
  'module.climate.description': 'Hali ya hewa ya sasa, utabiri, mifumo ya mvua, na viashiria vya hatari za tabianchi.',
  'module.markets.label': 'Taarifa za Masoko',
  'module.markets.short': 'Masoko',
  'module.markets.description': 'Bei za bidhaa za Uhabeshi pamoja na vyanzo na tarehe za vipimo.',
  'module.crops.label': 'Ushauri wa Mazao',
  'module.crops.short': 'Mazao',
  'module.crops.description': 'Wasifu wa mazao, mwongozo wa kupanda, na ufaa wa tabianchi kwa eneo lyenu.',
  'module.soil.label': 'Usimamizi wa Udongo',
  'module.soil.short': 'Udongo',
  'module.soil.description': 'Mwongozo wa uhifadhi wa udongo na kuzuia mmomonyoko katika mashamba ya Uhabeshi.',
  'module.advisor.label': 'Mshauri wa Kilimo wa AI',
  'module.advisor.short': 'Mshauri wa AI',
  'module.advisor.description': 'Mapendekezo yenye msingi wa ushahidi, yaliyoundwa kutoka data iliyothibitishwa ya jukwaa.',
  'module.sources.label': 'Vyanzo vya Data',
  'module.sources.short': 'Vyanzo',
  'module.sources.description': 'Kila mchapishaji wa data, leseni yake, upya wake, na uainishaji wa thamani.',
  'module.settings.label': 'Mipangilio',
  'module.settings.short': 'Mipangilio',
  'module.settings.description': 'Eneo na zao lyenu vilivyohifadhiwa, muonekano, na hali ya muunganiko.',

  // --- Shared interface words ---
  'common.retry': 'Jaribu tena',
  'common.refresh': 'Onyesha upya',
  'common.loading': 'Inapakia',
  'common.close': 'Funga',
  'common.apply': 'Tumia',
  'common.cancel': 'Ghairi',
  'common.change': 'Badilisha',
  'common.source': 'Chanzo',
  'common.sources': 'Vyanzo',
  'common.detail': 'Maelezo',
  'common.state': 'Hali',
  'common.cadence': 'Marudio',
  'common.newestObservation': 'Kipimo kipya zaidi',
  'common.unavailable': 'Haipatikani',
  'common.connected': 'Imeunganishwa',
  'common.notConfigured': 'haijapangwa',
  'common.noData': 'Hakuna data',
  'common.rows': 'safu',
  'common.derivedHere': 'iliyokokotolewa hapa',
  'common.live': 'moja kwa moja',
  'common.stale': 'ya zamani',
  'common.fromCache': 'kutoka kwenye hifadhi ya muda',
  'common.probeFailed': 'Ukaguzi ulishindwa',
  'common.unknown': 'Haijulikani',
  'common.allSources': 'Vyanzo vyote',
  'common.coreSources': 'Vyanzo vikuu',
  'common.sourceStatus': 'Hali ya vyanzo',
  'common.units.etbPerKg': 'ETB kwa kg',
  'common.updating': 'inasasishwa',
  'common.refreshAll': 'Onyesha upya vyote',
  'common.liveBadge': 'Moja kwa moja',

  // --- Value kinds: how a figure was produced ---
  'valueKind.observed': 'halisi',
  'valueKind.forecast': 'utabiri',
  'valueKind.modeled': 'ya modeli',
  'valueKind.estimated': 'kikadirio',
  'valueKind.imputed': 'iliyozibwa',

  // --- Shared data vocabulary (landing registry and the Data Sources page) ---
  'cadence.realtime': 'wakati halisi',
  'cadence.hourly': 'kila saa',
  'cadence.daily': 'kila siku',
  'cadence.8daily': 'mchanganyiko wa siku 8',
  'cadence.monthly': 'kila mwezi',
  'cadence.quarterly': 'kila robo ya mwaka',
  'cadence.annual': 'kila mwaka',
  'cadence.irregular': 'isiyo ya kawaida',
  'category.weather': 'Hali ya hewa na utabiri',
  'category.agroclimatology': 'Hali ya hewa ya kilimo',
  'category.market_prices': 'Bei za soko',
  'category.exchange_rates': 'Viwango vya ubadilishanaji wa sarafu',
  'category.economic_benchmarks': 'Vigezo vya kulinganishia vya kiuchumi',
  'category.geospatial': 'Mipaka na setilaiti',

  // --- Landing header ---
  'landing.eventTag': 'AgroInnovation 2026',
  'landing.navHow': 'Jinsi inavyofanya kazi',
  'landing.navIntelligence': 'Taarifa',
  'landing.navAdvisory': 'Ushauri',
  'landing.navData': 'Data',
  'landing.sourceStatus': 'Hali ya vyanzo',
  'landing.openPlatform': 'Fungua jukwaa',
  'landing.openModule': 'Fungua {module}',
  'a11y.landingSections': 'Sehemu za ukurasa wa mwanzo',
  'a11y.landingHome': 'Ukurasa kuu wa IRSHAYE',
  'a11y.footerModules': 'Moduli za jukwaa',
  'a11y.footerPublishers': 'Wachapishaji wa data',
  'a11y.footerPage': 'Kwenye ukurasa huu',

  // --- Landing hero ---
  'hero.festival': 'Tamasha la AgroInnovation 2026 · Uhabeshi',
  'hero.title': 'Kilimo mwenye akili ya tabianchi,\nlinaoamuliwa na [[ushahidi]].',
  'hero.lede':
    'IRSHAYE ni jukwaa la kidijitali linalosaidiwa na AI kwa kilimo mwenye akili ya tabianchi nchini Uhabeshi. Chagua eneo na zao, na likusanye taarifa za hali ya hewa za moja kwa moja, mwongozo wa mazao wenye marejeo ya vyanzo, mbinu za usimamizi wa udongo na bei halisi za masoko — kisha likaeleza maana yake, chanzo cha kila namba, na jinsi ya kuiamini.',
  'hero.ctaPrimary': 'Anza na eneo lyenu na zao lyenu',
  'hero.ctaSecondary': 'Ona data iliyo nyuma yake',
  'hero.trustNoAccount': 'Bila akaunti au ufunguo wa API kwa kuanza',
  'hero.trustOpenData': 'Data huria pekee, leseni imetajwa',
  'hero.trustLive': 'Wachapishaji hai, hukaguliwa kwa ombi',
  'hero.imageAlt':
    'Mashamba madogo yaliyokatwa ngazi katika nyanda za juu za Uhabeshi wakati wa mapambazuko, pamoja na vizuizi vya mawe vya mistari ya miteremko na nyumba za mashamba za jadi zenye paa la majani',
  'hero.placeNow': 'Addis Ababa, sasa hivi',
  'hero.humidity': 'Unyevu',
  'hero.rainOutlook': 'Mvua, mtazamo wa siku 7',
  'hero.publisherSilent': 'Mchapishaji wa hali ya hewa hakujibu.',
  'hero.noSubstitute': 'Hakuna kipimo cha mbadala kinachoonyeshwa.',

  // --- How it works ---
  'how.eyebrow': 'Mbinu ya kazi',
  'how.title': 'Hatua tano kutoka eneo hadi pendekezo linaloweza kukaguliwa',
  'how.lede':
    'Hakuna hapa dirisha la mazungumzo lenye lebo ya shamba. Jukwaa kwanza hukusanya seti maalum ya ushahidi, na ndipo hukichambua — ndiyo maana kila jibu linaweza kufuatiliwa hadi kwa mchapishaji na tarehe.',
  'how.step1Title': 'Chagua eneo lyenu',
  'how.step1Body':
    'Mji wa soko kutoka kwa rejista ya uchunguzi wa WFP — pamoja na viwianishi vya mchapishaji wenyewe — au latitudo na longitudo ya shamba lyenu.',
  'how.step2Title': 'Chagua zao lyenu',
  'how.step2Body':
    'Wasifu 11 wa mazao ya Uhabeshi yaliyotengenezwa kwa uangalifu, kila hitaji lina marejeo ya chanzo cha huduma za ushauri wa kilimo au utafiti, badala ya kudai tu.',
  'how.step3Title': 'Soma muktadha wa tabianchi',
  'how.step3Body':
    'Vipimo vya moja kwa moja, mtazamo wa siku saba, rekodi ya siku 45 na viwango vya kawaida vya miaka 30 kwa kiini kimoja cha gridi, hutengwa kwa aina.',
  'how.step4Title': 'Pata taarifa za kilimo',
  'how.step4Body':
    'Vipindi vya kupanda na mavuno, mbinu zilizorekodiwa, visababishi vya mmomonyoko na bei zilizochunguzwa — ingizo ambavyo uamuzi huhitaji kweli.',
  'how.step5Title': 'Pendekezo limoja lenye msingi wa ushahidi',
  'how.step5Body':
    'Mshauri huruhusiwa kuchambua tu ushahidi uliotajwa hapo juu. Hutaja vyanzo vyake, hutaja kutokuwa na uhakika, na hujiepusha ushahidi ukiwa hafifu.',

  // --- Feature sections ---
  'features.climate.title': 'Hali ya hewa ya moja kwa moja, wiki iliyo mbele, na muktadha wa miaka 30 — hutengwa kwa aina',
  'features.climate.lede':
    'Moduli ya tabianchi hukagua wachapishaji wanne kwa kiini kimoja cha gridi na haiwachanganyi kamwe kuwa namba moja yenye kujiamini. Kipimo, tokeo la modeli, na utabiri ni madai tofauti, na IRSHAYE huonyesha kwa lebo, rangi na kanuni tofauti za upya.',
  'features.climate.alt':
    'Mawingu mazito ya mvua yakijaa juu ya mashamba ya kijani ya Uhabeshi, pamoja na miale ya mwanga katika bonde',
  'features.climate.b1Title': 'Hali ya sasa na mtazamo wa siku 7',
  'features.climate.b1Body':
    'Utabiri wa Open-Meteo kwa viwianishi vyenu, husasishwa kwa marudio ya kila saa ya chanzo chenyewe na kupigwa muhuri wa muda wa upakuzi.',
  'features.climate.b2Title': 'Mvua ikilinganishwa na kalenda ya misimu',
  'features.climate.b2Body':
    'Rekodi za karibu za kila siku kando ya matarajio ya kiremt na belg, ili kuanza kwa kuchelewa kuonekane badala ya kuripotiwa tu.',
  'features.climate.b3Title': 'Viashiria vya ukame na joto',
  'features.climate.b3Body':
    'Zilikokokotolewa kutoka kwa agroklimatolojia ya NASA POWER kwa kiini kilekile, na thamani zilizokokotolewa zimewekwa lebo kuwa zimekokotolewa badala ya kupimwa.',
  'features.climate.b4Title': 'Upya unaoongea ukweli',
  'features.climate.b4Body':
    'Uchambuzi-upya wa ERA5 hufika ukiwa umechelewa takriban wiki moja. Kiolesura huusema hivyo badala ya kuonyesha namba iliyochelewa kama ya sasa.',

  'features.crops.title': 'Wasifu 11 wa mazao ya Uhabeshi, kila namba imefungamana na chanzo kilichotajwa',
  'features.crops.lede':
    'Tef, mahindi, ngano, shayiri, mtama, kahawa, faaba, mzunguvuli, noug, enset na mirungi. Viwango vya joto, mvua, kimo na pH ya udongo vimenakoliwa kutoka kwa sura za PROTA4U za aina za mimea, Ecocrop, FAO na tafiti za Uhabeshi zilizopitishwa na wenzee — pamoja na marejeo yamebambatanishwa na namba.',
  'features.crops.alt':
    'Shamba lililoiva la tef la Uhabeshi na vizuizi vya mbegu vinavyonyonya mwanga hafifu wa jioni',
  'features.crops.b1Title': 'Vipindi vya kupanda na mavuno',
  'features.crops.b1Body':
    'Mwongozo wa msimu kwa kila zao na mfumo wa ikolojia ya kilimo. Pale chanzo kilichopatikana kilipokosa kalenda, wasifu huonyesha pengo badala ya kubuni.',
  'features.crops.b2Title': 'Ufaa kwa eneo lyenu',
  'features.crops.b2Body':
    'Kimo na mvua za eneo lililochaguliwa hulinganishwa na kiwango kilichorekodiwa, na matokeo ya ulinganisho hupewa daraja — halidaiwi tu.',
  'features.crops.b3Title': 'Vyanzo vyinavyoweza kufungua',
  'features.crops.b3Body':
    'Kila wasifu una kiungo cha marejeo yake. Pale PROTA na utafiti wa shamba vinapokubaliana, namba zote mbili huonekana kando na kando badala ya wastani unaojificha.',
  'features.crops.b4Title': 'Ukomo uliotajwa',
  'features.crops.b4Body':
    'Viwango ni mapendeleo yaliyorekodiwa kutoka kwa fasihi, sio vipimo vya shamba lyenu, na moduli hueleza hivyo kwenye kichwa chake mwenyewe.',

  'features.soil.title': 'Mbinu za uhifadhi kwa mashamba ya Uhabeshi yaliyo kwenye hatari ya mmomonyoko',
  'features.soil.lede':
    'Mifuko ya fanya juu, vizuizi vya mistari ya miteremko, usimamizi wa komposti na molora, mzunguko wa mazao, usimamizi wa mabaki na vifuniko, na uhifadhi ulijumuishwa wa udongo na maji. Kila mbinu hutoka kwa tafiti za matumizi ya ardhi na uhifadhi wa nyanda za juu za Uhabeshi zilizochapishwa, pamoja na masharti inayohitajika ili itumike na vyanzo vinavyoieleza.',
  'features.soil.alt': 'Vizuizi vya mawe na miteremko yenye ngazi zinazoshikilia udongo kwenye kiwinika kilicholimwa cha Uhabeshi',
  'features.soil.b1Title': 'Mwongozo wa mbinu, sio upimaji wa udongo',
  'features.soil.b1Body':
    'Moduli husimamia hatari kulingana na miteremko na mvua zilizorekodiwa. Haidai kamwe kujua hali ya virutubisho udongoni mwenu, kwa sababu haijapima.',
  'features.soil.b2Title': 'Muktadha wa miteremko na mmomonyoko',
  'features.soil.b2Body':
    'Kali ya mvua na umbo la ardhi hutumika kuashiria sehemu ambapo mkondo wa maji na upotevu wa udongo ndivyo vikwazo vikuu.',
  'features.soil.b3Title': 'Mpangilio unaoouzingatia msimu',
  'features.soil.b3Body':
    'Kazi za miundo kabla ya mvua za msimu mrefu, vizuizi vya mimea baadaye — hupangwa kwa kalenda ileile ambayo moduli ya tabianchi hutumia.',

  'features.markets.title': 'Bei halisi za masoko ya Uhabeshi, zenye tarehe ya uchunguzi imebambatanishwa',
  'features.markets.lede':
    'Bei hutoka kwa uchunguzi wa WFP rEMS wa Uhabeshi na mfululizo wa bei za wakati halisi wa Benki ya Dunia kupitia HDX, zinasomwa kwa kituo cha soko kilichochaguliwa. Marudio ya uchunguzi wa kila mwezi humaanisha kuwa namba mpya zaidi mara nyingi huwa ya wiki kadhaa zilizopita, kwa hivyo moduli huonyesha mwezi wa kipimo badala ya kudokeza bei ya leo.',
  'features.markets.alt':
    'Mikba ya juti ya mahindi, tef na nga nyingine zimepangwa katika soko la Uhabeshi, vikapu vya kupimia vimewekwa juu',
  'features.markets.b1Title': 'Vituo vya masoko kutoka kwa rejista ya uchunguzi',
  'features.markets.b1Body':
    'Maeneo hutoka kwa seti za data za bei zilizochapishwa, kwa hivyo bei daima huhusishwa na soko iliyokusanywa.',
  'features.markets.b2Title': 'Mwelekeo bila ubunzi',
  'features.markets.b2Body':
    'Mifululizo huonyeshwa kutoka kwa vipimo vilivyopatikana pekee. Mwezi ukikosa, ni pengo kwenye mstari — kamwe si nukta iliyojazwa kwa makadirio.',
  'features.markets.b3Title': 'Uonekano wa uchelewaji',
  'features.markets.b3Body':
    'Bei za uchunguzi ni za kila mwezi, na viwango vya mwongozo vya NBE ni vya kila siku — dirisha zote mbili za upya huonyeshwa kwenye namba.',

  // --- Data credibility ---
  'data.eyebrow': 'Uaminika wa data',
  'data.title': 'Wachapishaji {count}, kila mmoja ametajwa kwa jina, ana leseni na muhuri wa wakati',
  'data.lede':
    'IRSHAYE haina faida ya data ya faragha. Faida yake ni kwamba kila namba kwenye skrini inaweza kufuatiliwa hadi kwa mchapishaji wa umma, leseni, marudio, na wakati wa kipimo — na kwamba kiolesura hutofautisha thamani halisi na tokeo la modeli, utabiri, na namba tulizokokotoa hapa.',
  'data.pointNoKeys': 'Hakuna chanzo katika orodha hii kinachohitaji ufunguo wa API, kwa hivyo hakuna kitu kilichofichwa nyuma ya taarifa za uthibitisho.',
  'data.pointMarkedKeys': 'Wachapishaji wanaohitaji taarifa za uthibitisho wamewekwa alama; huduma hupungua kwa uadilifu bila yao.',
  'data.pointFreshness':
    'Kila chanzo kina dirisha lake la upya — ERA5, POWER na michanganyiko ya setilaiti ya siku 8 huchelewa kwa mpango.',
  'data.pointLicence':
    'Seti mbili za data hazina leseni iliyotajwa na wachapishaji wao. Huonyeshwa kwa kusoma pamoja na kutaja chanzo, na ukomo huo umeandikwa kwenye skrini.',
  'data.cta': 'Fungua hali hai ya vyanzo',
  'data.registry': 'Rejista ya vyanzo',
  'data.registryBadge': 'Hai kutoka wachapishaji {count}',

  // --- Integrity rules ---
  'rules.eyebrow': 'Kanuni za ushahidi',
  'rules.title': 'Ahadi nne ambazo kiolesura hutekeleza, si kudai tu',
  'rules.lede':
    'Zana ya ushauri hujipatia kuaminika kwa mambo yanayokataa kusema. Kanuni hizi hutekelezwa katika tabaka la uonyeshaji — zinaweza kuonekana zikitenda kazi kwenye ukurasa wowote, hata data ilipokuwa nyeti.',
  'rules.r1Title': 'Tokeo la modeli halichorwi kamwe kama kipimo',
  'rules.r1Body':
    'Kila thamani huwa na aina yake — halisi, ya modeli, utabiri, iliyokokotolewa hapa, au iliyozibwa. Rangi na lebo hufanya tofauti ionekane badala ya kuififisha.',
  'rules.r2Title': 'Pengo huonyeshwa kama pengo',
  'rules.r2Body':
    'Mchapishaji anaporudisha kitu hakuna, moduli huarifu hitilafu na msimbo wake. Hakuna hali ya hewa, bei, au namba ya kilimo ya mbadala inayozalishwa kujaza nafasi.',
  'rules.r3Title': 'Hakuna madai ya matokeo bila uthibitisho wa shambani',
  'rules.r3Body':
    'Jukwaa halitaji ongezeko la mavuno, mapato, au akiba ya maji ambalo halijapima katika mashamba halisi, na halionyeshi viashiria vya mingime vya setilaiti kama jaribio la udongo.',
  'rules.r4Title': 'Mwongozo, sio dhamana',
  'rules.r4Body':
    'Ushauri ni msaada wa maamuzi wenye vyanzo vilivyotajwa na kutokuwa na uhakika kumetajwa. Haichunguzi hali ya udongo bila kipimo, na hujiepusha ushahidi ukiwa hafifu.',

  // --- AI layer ---
  'ai.eyebrow': 'Tabaka la AI',
  'ai.title': 'Msaidizi anayeuruhusiwa kuchambua tu kile ambacho jukwaa linaweza kuthibitisha',
  'ai.lede':
    'Mshauri hupokea pakiti ya ushahidi ambayo moduli nyingine zimekusanya — tabianchi hai kwa viwianishi vyenu, wasifu wa zao wenye marejeo, mbinu za usimamizi wa udongo, bei zilizochunguzwa pamoja na miezi ya vipimo vyake — na kujibu kwa muundo uliopangwa. Haijaunganishwa kwa shamba, maabara ya udongo, au soko la makataba ya baadaye, na hueleza hivyo.',
  'ai.keyNote':
    'Majibu huhitaji ufunguo wa modeli katika mazingira ya uendeshaji. Bila yao, moduli hujiripoti kuwa haipatikani na kuacha kila moduli nyingine ikifanya kazi — hajarudi kwa ushauri uliobuniwa.',
  'ai.cta': 'Fungua Mshauri wa Kilimo wa AI',
  'ai.imageAlt':
    'Mlimu wa Uhabeshi amevika shali nyeupe ya netala akishika simu ya mkononi ya kawaida, akisikiliza mazungumzo ya ushauri',
  'ai.contract': 'Mkataba wa majibu',
  'ai.contract1Body':
    'Rekodi mahususi za jukwaa ambazo jibu linategemea — kila moja inafuatiliwa hadi kwa mchapishaji na tarehe ya kipimo.',
  'ai.contract2Body':
    'Mwongozo uliowekwa katika mfumo wa msaada wa maamuzi ya kilimo. Haidai kuchunguza udongo, kuhakikisha mavuno, au kuahidi mapato.',
  'ai.contract3Body':
    'Yale ambayo ushahidi hauwezi kusuluhisha, ikiwemo viwango vya kutoka kwa fasihi, uchelewaji wa uchunguzi na miezi iliyokosekana, hutajwa katika jibu lenyewe.',
  'ai.contract4Body':
    'Ushahidi uliokusanywa ukishindwa kusaidia jibu, mshauri haurudishi pendekezo lolote na badala yake hutaja pengo.',

  // --- Audience / call to action ---
  'cta.title': 'Fungua jukwaa na chagua eneo. Yote mengine ni ya moja kwa moja.',
  'cta.lede':
    'Bila usajili, bila data ya onyesho, bila namba zilizowekwa. Chagua kituo cha soko cha Uhabeshi au wandika viwianishi vyako mwenyewe, na IRSHAYE isoma wachapishaji walewale wa umma ambao nawe unaweza kusoma — kisha huonyesha hasalaha kilichopata, lini, na kilichoshindwa kupata.',
  'cta.primary': 'Anza katika Muhtasari',
  'cta.secondary': 'Kagua hali ya vyanzo kwanza',
  'cta.eyebrow': 'Ni kwa nani',
  'cta.a1Title': 'Wanamulima na mashamba madogo ya kaya',
  'cta.a1Body':
    'Hufungua katika kivinjari bila akaunti na bila ufunguo. Majina ya mazao ya Ge’ez huonyeshwa vizuri, na namba hutajwa kwa vipimo ambavyo uamuzi hutumia — milimita, mita juu ya usawa wa bahari, bei kwa kuintari.',
  'cta.a2Title': 'Wawakilishi wa maendeleo na vikusuvi',
  'cta.a2Body':
    'Skrini moja inashikilia muktadha wa tabianchi, mahitaji ya zao yenye marejeo, mbinu za uhifadhi na bei zilizochunguzwa kwa eneo ileile, kwa hivyo ziara ya ushauri huanza kutoka kwa ushahidi wa pamoja.',
  'cta.a3Title': 'Programu, NGOs na watafiti',
  'cta.a3Body':
    'Kila mchapishaji, leseni na dirisha la upya vimetajwa, na thamani zilizokokotolewa zimewekwa lebo — kwa hivyo namba zinazotolewa nje ya jukwaa hufika na chanzo chake kimebambatanishwa.',

  // --- Landing footer ---
  'footer.about':
    'Jukwaa la kidijitali linalosaidiwa na AI kwa kilimo mwenye akili ya tabianchi nchini Uhabeshi. Taarifa za tabianchi kwa eneo, mwongozo wa mazao na udongo, na bei za masoko — pamoja na ushahidi umebambatanishwa.',
  'footer.modules': 'Moduli',
  'footer.publishers': 'Wachapishaji',
  'footer.overview': 'Muhtasari',
  'footer.linkHow': 'Jinsi IRSHAYE inavyofanya kazi',
  'footer.linkIntelligence': 'Tabianchi, mazao, udongo, masoko',
  'footer.linkAdvisory': 'Tabaka la AI',
  'footer.linkRegistry': 'Rejista ya vyanzo',
  'footer.linkSaved': 'Eneo na zao vilivyohifadhiwa',
  'footer.disclaimer':
    'IRSHAYE hutoa msaada wa maamuzi ya kilimo, si dhamana. Mapendekezo hayadai matokeo ya mavuno, mapato au akiba ya maji ambayo hayajapimwa ardhini, na hakuna moduli ichunguza hali ya udongo bila vipimo. Viwango vya mazao vya kutoka kwa fasihi ni mapendeleo yaliyorekodiwa, sio vipimo vya shamba lyenu. Viashiria vya mingime vya setilaiti hueleza kijani cha majani, sio ubora wa udongo. Mchapishaji anaporudisha kitu hakuna, jukwaa huarifu pengo badala ya kuweka thamani ya mbadala.',
  'footer.attributions':
    'Hali ya hewa na tabianchi: Open-Meteo (CC BY 4.0) na NASA POWER. Wastani wa kawaida wa mvua na joto: uchambuzi-upya wa ERA5 kupitia Open-Meteo. Bei za masoko: WFP Ethiopia rEMS na mifululizo ya wakati halisi ya Benki ya Dunia kupitia HDX. Viwango vya sarafu: Benki Kuu ya Uhabeshi na Benki ya Dunia. Mipaka na tabaka za setilaiti: geoBoundaries, NASA GIBS, Ethiopia.GeoPortal kwenye ArcGIS, GRID3/WorldPop na CDE — leseni kama zilivyotajwa kwenye ukurasa wa Vyanzo vya Data.',

  // --- Loading and notice primitives ---
  'states.codeLabel': 'Msimbo',
  'states.codeNoSubstitute': 'Hakuna thamani ya mbadala inayoonyeshwa kwa chanzo hiki.',

  // --- Provenance blocks ---
  'prov.kind.observed': 'Halisi',
  'prov.kind.modeled': 'Ya modeli',
  'prov.kind.forecast': 'Utabiri',
  'prov.kind.estimated': 'Iliyokokotolewa hapa',
  'prov.kind.imputed': 'Iliyozibwa',
  'prov.noSource': 'Hakuna chanzo kinachopatikana kwa namba hii.',
  'prov.behindSchedule': 'Iliyochelewa ratiba',
  'prov.cachedCopy': 'Nakili ya hifadhi ya muda',
  'prov.sourceLink': 'chanzo',
  'prov.observedAt': 'ilipimwa {when}',
  'prov.fetchedAt': 'ilipakuliwa {when} (EAT)',
  'prov.dateNotStated': 'tarehe haijatajwa',
  'prov.notAvailable': 'Haipatikani',

  // --- Value-kind legend (Data Sources) ---
  'legend.title': 'Jinsi thamani zinavyoainishwa',
  'legend.hint':
    'Kila namba kwenye jukwaa huwa na moja ya aina hizi. Aina huamua rangi, maneno, na dirisha lipi la upya hutumika.',
  'legend.ruleLabel': 'Kanuni',
  'legend.observedMeaning':
    'Kipimo ambacho mchapishaji huarifu kama uangalizi wa anga au uchunguzi wa soko.',
  'legend.observedRule': 'Huonyeshwa na tarehe yake ya kipimo. Hauonyeshwi kamwe kama utabiri.',
  'legend.modeledMeaning':
    'Tokeo la uchambuzi-upya au la modeli — limejengwa kwa misingi ya kifizikia, lakini limeundwa upya badala ya kupimwa mahali penyu.',
  'legend.modeledRule': 'Huwekwa lebo ya modeli; ukubwa wa kiini cha gridi hutajwa mchapishaji anapotoa.',
  'legend.forecastMeaning': 'Makadirio ya mbele ya modeli ya namba ya hali ya hewa.',
  'legend.forecastRule': 'Haujumuishwi kamwe na vipimo katika mfululizo mmoja.',
  'legend.estimatedMeaning':
    'Namba ambayo programu hii imeikokotoa kutoka kwa thamani zilizochapishwa, kama anomali ya mvua.',
  'legend.estimatedRule': 'Huwekwa lebo ya “iliyokokotolewa hapa”, na ingizo zake hutajwa ili ziweze kukokotolewa upya.',
  'legend.imputedMeaning': 'Thamani iliyozibwa mahali ambapo mchapishaji hakuwa na yoyote.',
  'legend.imputedRule':
    'IRSHAYE haizibi data za kilimo. Lebo hii ikionekana kamwe, mbadala wake hutajwa kwenye skrini.',

  // --- Source status panel ---
  'sources.title': 'Hali ya vyanzo',
  'sources.hint':
    'Kila safu ni ukaguzi wa moja kwa moja wa chanzo chenyewe. Chanzo ambacho hatuwezi kufikia huarifiwa kuwa kilelekana pamoja na sababu, hakufichwi kamwe wala kubadilishwa.',
  'sources.recheck': 'Kagua tena',
  'sources.recheckAria': 'Kagua vyanzo tena',
  'sources.probeScope': 'Upeo wa ukaguzi',
  'sources.probing': 'Hukagua vyanzo…',
  'sources.probeFailed': 'Ukaguzi wa hali ulishindwa',
  'sources.apiKeyRequired': 'Ufunguo wa API unahitajika',
  'sources.ranAt': 'Ukaguzi ulifanyika {when} EAT.',
  'sources.allHint': '“Vyanzo vyote” hukagua pia vyanzo vikubwa vya bei na viashiria, ambavyo huchukua muda mrefu.',
  'sources.storedPipeline': 'Mchakato uliohifadhiwa',
  'sources.noSync':
    'Hakuna usawazishaji uliorekodiwa kwa hifadhidata hii, kwa hivyo hakuna kitu kilichotolewa kutoka kwa hifadhi hapo juu — kila namba kwenye dashibodi hii ilitoka kwa mchapishaji katika ombi hili. Hii ndiyo mipangilio ya kazi; usawazishaji huongeza historia tu na huweza kustahimili kukatizwa kwa mchapishaji.',
  'sources.unfinished': 'haijakamilika',
  'sources.pageDescription':
    'IRSHAYE hutolea data huria kutoka kwa wachapishaji waliotajwa kwa majina na hakuna kingine. Kadi tupu humaanisha mchapishaji hakujibu — hakuna data za majaribio, mifano, wala thamani za kujaza nafasi katika njia ya utoaji.',
  'statusLabel.connected': 'Imeunganishwa',
  'statusLabel.stale': 'Iliyochelewa ratiba',
  'statusLabel.unavailable': 'Haipatikani',
  'statusLabel.auth_required': 'Taarifa za uthibitisho zinahitajika',
  'statusLabel.disabled': 'Imezimwa',
  'statusLabel.not_configured': 'Haijapangwa',
  'syncLabel.succeeded': 'utekelezaji wa mwisho uliandika vyote',
  'syncLabel.partial': 'utekelezaji wa mwisho uliandika wachapishaji wachache',
  'syncLabel.failed': 'utekelezaji wa mwisho haukuandika kitu',
  'syncLabel.skipped_overlap': 'ulirukwa, utekelezaji mwingine ulikuwa unaendelea',

  // --- Location and crop pickers ---
  'picker.location': 'Eneo',
  'picker.surveyMarket': 'Soko la uchunguzi',
  'picker.ownPoint': 'Nukta yako',
  'picker.hint':
    'Miji hutoka kwa jedwali la kumbukumbu la masoko lililochapishwa na WFP, kwa hivyo uchaguzi unabeba viwianishi vya mchapishaji wenyewe na majina ya mikoa.',
  'picker.marketCentre': 'Kituo cha soko',
  'picker.customCoordinate': 'Kirai maalum',
  'picker.ownPointField': 'Au wandika nukta yako mwenyewe',
  'picker.ownPointHint': 'Hutumika kama ilivyotolewa; hakuna majina ya kiutawala yamebambatanishwa na kirai kilichoandikwa.',
  'picker.latitude': 'Latitudo',
  'picker.longitude': 'Longitudo',
  'picker.selectedCoordinate': 'Kirai kilichochaguliwa',
  'picker.summaryWfp': '. Majina ya mikoa na maeneo ni kama vilivyochapishwa na WFP.',
  'picker.summaryOwn': '— {name}, nukta yako mwenyewe.',
  'picker.checkCoordinates': 'Angalia viwianishi',
  'picker.errorBlank': 'Weka latitudo na longitudo kama namba.',
  'picker.errorRange': 'Latitudo lazima iwe kati ya −90 na 90, longitudo kati ya −180 na 180.',
  'picker.listUnavailable': 'Orodha ya maeneo haipatikani',
  'picker.listFailed': 'Orodha ya maeneo haikuweza kupakiwa; kisanduku cha viwianishi bado kinafanya kazi.',
  'crops.yourCrop': 'Zao lyenu',
  'crops.cropProfile': 'Wasifu wa zao',
  'crops.pickerHint':
    'Mwongozo ni nyenzo za marejeo zilizotengenezwa kwa uangalifu. Ukaguzi wa ufaa hulinganisha nyenzo hizi na data hai ya tabianchi na huwekwa lebo kama mwongozo wa modeli, kamwe kama kipimo.',

  // --- Crop advisory module ---
  'crops.pageDescription':
    'Wasifu wa mazao ni nyenzo za marejeo zilizotengenezwa kwa uangalifu, kila namba ikiwa na marejeo ya mchapishaji wake. Ukaguzi wa ufaa hulinganisha nyenzo hizo na data hai ya tabianchi na huwekwa lebo kama mwongozo wa modeli — sio kipimo cha shamba lyenu.',
  'crops.badgeNoProfile': 'Hakuna wasifu uliochaguliwa',
  'crops.overall.supported': 'Inaendana na kiwango kilichorekodiwa',
  'crops.overall.mixed': 'Inaendelea kwa kiasi',
  'crops.overall.weak': 'Nje ya kiwango kilichorekodiwa',
  'crops.overall.insufficient-data': 'Data haitoshi',
  'crops.aspect.season': 'Msimu',
  'crops.aspect.rainfall': 'Mvua',
  'crops.aspect.temperature': 'Joto',
  'crops.aspect.altitude': 'Kimo',
  'crops.verdict.within': 'ndani',
  'crops.verdict.watch': 'fuatilia',
  'crops.verdict.outside': 'nje',
  'crops.verdict.unknown': 'hakuna data',
  'crops.noData': 'hakuna data',
  'crops.noProfileTitle': 'Wasifu wa marejeo ya mazao',
  'crops.noProfileBody':
    'Wasifu wa mazao ya Uhabeshi uliochaguliwa na kuwa na marejeo ya vyanzo unaandaliwa kwa sasa. Wasifu ukiwepo bado, moduli hii haitoi mwongozo wowote — IRSHAYE haionyeshi namba za kilimo zisizo na marejeo. Moduli za tabianchi na masoko zinaendelea kufanya kazi kikamilifu wakati huo.',
  'crops.liveComparison': 'Ulinganisho wa moja kwa moja',
  'crops.liveComparisonHint':
    'Mahitaji yaliyorekodiwa ya {crop} yalinganishwa na vipimo vya moja kwa moja vya {place}. Kila hukumu hutaja ingizo lililotumika.',
  'crops.provenanceForecast': 'ingizo za utabiri',
  'crops.provenanceObserved': 'rekodi halisi',
  'crops.loadingComparison': 'Inapakia tabianchi hai kwa ulinganisho',
  'crops.altitudeDetail':
    'Mifumo ya ikolojia ya kilimo iliyorekodiwa: {bands}. Jukwaa hili haliwezi kupima kimo cha shamba lyenu kutoka kwa data huria, kwa hivyo chukua kimo kama hukumu yako mwenyewe.',
  'crops.altitudeMissing': 'Hakuna ukanda wa kimo uliorekodiwa uliopatikana kwa zao hili.',
  'crops.requirementsTitle': 'Mahitaji yaliyorekodiwa',
  'crops.requirementsHint':
    'Thamani za marejeo zenye marejeo ya vyanzo — zilizochaguliwa na kutoka kwa fasihi, sio vipimo vya moja kwa moja vya shamba lyenu.',
  'crops.seasonRainNeed': 'Hitaji la mvua za msimu',
  'crops.documentedTotal': 'Jumla iliyorekodiwa kwa mzunguko mzima.',
  'crops.tempRange': 'Kiwango cha joto',
  'crops.singlePoint': ' (nukta moja)',
  'crops.seasonDependence': 'Utegemeaji wa msimu wa mvua',
  'crops.soilPreference': 'Upendeleo wa udongo',
  'crops.soilPreferenceNote': 'Upendeleo wa jinsi maji yanavyotoka udongoni, uliorekodiwa — sio jaribio la udongo.',
  'crops.plantingHarvest': 'Vipindi vya kupanda na mavuno',
  'crops.noPlantingCalendar':
    'Hakuna kalenda ya miezi ya kupanda yenye marejeo iliyopatikana kwa zao hili — imeonyeshwa kama pengo, haijazwi.',
  'crops.plantLabel': 'Panda',
  'crops.harvestLabel': 'Vuna',
  'crops.noHarvestCalendar': 'Hakuna kalenda ya miezi ya mavuno yenye marejeo iliyopatikana kwa zao hili.',
  'crops.tempNoteTitle': 'Kidokezo cha hitaji la joto',
  'crops.soilNoteTitle': 'Upendeleo wa udongo — umeandikwa, haujapimwa',
  'crops.phDocumented': 'pH {min}–{max} iliyorekodiwa.',
  'crops.phMissing': 'Hakuna kiwango cha pH chenye marejeo kilichopatikana.',
  'crops.practicesTitle': 'Mbinu zilizorekodiwa',
  'crops.practicesHint': 'Mbinu za usimamizi zilizotajwa katika vyanzo vilivyorejelewa kwa zao hili.',
  'crops.risksTitle': 'Hatari za tabianchi zilizorekodiwa',
  'crops.risksHint':
    'Maelezo ya hatari kutoka kwa fasihi iliyorejelewa, pamoja na kishiria cha jukwaa kinachoziangalia.',
  'crops.whenLabel': 'Lini:',
  'crops.watchLabel': 'Uangalizi wa jukwaa:',
  'crops.seasonTitle': 'Kalenda ya misimu ya Uhabeshi',
  'crops.seasonHint': 'Ufasiri wa misimu ambayo vipindi vya hapo juu hurejelea.',
  'crops.limitsTitle': 'Ukomo wa tabaka hili la marejeo',

  // --- Suitability sentences (generated by lib/crops/suitability.ts) ---
  'suitability.singlePoint': '(nukta moja iliyorekodiwa)',
  'suitability.seasonNoCalendar':
    'Hakuna kalenda ya miezi yenye marejeo iliyopatikana katika vyanzo vilivyochaguliwa vya {crop}, kwa hivyo IRSHAYE haitonyeshi kipindi cha kupanda au mavuno badala ya kubahatisha.',
  'suitability.seasonPlanting': '{month} iko ndani ya kipindi cha kupanda kilichorekodiwa cha {crop}.',
  'suitability.seasonHarvest': '{month} iko ndani ya kipindi cha mavuno kilichorekodiwa cha {crop}.',
  'suitability.seasonOutside': '{month} iko nje ya vipindi vya kupanda na mavuno vilivyorekodiwa vya {crop}.',
  'suitability.rainNoRange': 'Hakuna kiwango cha mvua za msimu chenye marejeo kilichopatikana kwa zao hili, kwa hivyo hakuna ulinganisho unaofanywa.',
  'suitability.rainNoData': 'Data ya mvua ya moja kwa moja haipatikani kwa sasa, kwa hivyo kiwango cha msimu hakiwezi kulinganishwa.',
  'suitability.rainDry':
    'Hitaji lililorekodiwa ni {need} mm kwa msimu, lakini ishara ya mvua ya karibu ni hafifu ({signal}). Chelewsha shughuli zinazotegemea mvua iwezekanavyo.',
  'suitability.rainForecast7': '{mm} mm zimetabiriwa ndani ya siku 7',
  'suitability.rainNoMeasurable': 'hakuna mvua inayopimika katika rekodi ya karibu',
  'suitability.rainWithin':
    'Hitaji lililorekodiwa ni {need} mm kwa msimu. Mvua ya karibu: {forecast}; vipimo vya hivi karibuni: {observed}.',
  'suitability.notAvailable': 'haipatikani',
  'suitability.tempNoRange': 'Hakuna kiwango cha joto chenye marejeo kilichopatikana kwa zao hili.',
  'suitability.tempNoData': 'Vipimo vya joto vya moja kwa moja havipatikani, kwa hivyo hakuna ulinganisho unaofanywa.',
  'suitability.tempOutside':
    'Vipimo vya sasa ({readings}) viko nje ya kiwango cha ulivu kilichorekodiwa {range} cha {crop}. {notes}',
  'suitability.tempBrush': 'Vipimo vinagusa ukingo wa kiwango kilichorekodiwa ({range}). {notes}',
  'suitability.tempWithin': 'Vipimo vya sasa {readings} viko ndani ya kiwango kilichorekodiwa {range}.',

  // --- Overview module ---
  'overview.title': 'Muhtasari wa shamba',
  'overview.description':
    'Chagua eneo lyenu na zao lyenu. Kila kitu kilicho hapa chini ni data hai pamoja na chanzo chake, na jukwaa hueleza wazi namba inapokuwa utabiri au tokeo la modeli badala ya kipimo.',
  'overview.badgeLive': 'Moja kwa moja',
  'overview.badgeConnecting': 'Inaunganisha',
  'overview.badgeNoReading': 'Hakuna kipimo cha moja kwa moja',
  'overview.changeContext': 'Badilisha muktadha uliohifadhiwa',
  'overview.yourLocation': 'Eneo lyenu',
  'overview.seasonContext': 'Muktadha wa msimu — {place}',
  'overview.seasonHint':
    'Mwezi wa {month}. Mwongozo unalinganisha utabiri wa moja kwa moja na mahitaji ya marejeo yaliyorekodiwa ya zao lyenu.',
  'overview.rainNow': 'mvua sasa {value} mm',
  'overview.loadingWeather': 'Inapakia hali ya hewa ya moja kwa moja',
  'overview.tempNow': 'Joto sasa',
  'overview.observedAt': 'Ilipimwa {when}',
  'overview.noObservation': 'Hakuna kipimo kilichorudi',
  'overview.rainOutlookNote': 'Jumla ya kadirio la kila siku zilizotabiriwa — mtazamo wa modeli, sio kipimo.',
  'overview.noForecastDays': 'Hakuna siku za utabiri zilizorudi.',
  'overview.nextRainDay': 'Siku inayofuata ≥ 1 mm',
  'overview.noneIn7d': 'Hakuna katika siku 7',
  'overview.nextRainDayNote': 'Siku ya kwanza ya utabiri kufikia milimita moja ya mvua.',
  'overview.humidityNow': 'Unyevu sasa',
  'overview.humidityNote': 'Unyevu wa uhusiano kutoka kwa kipimo kilekile cha joto.',
  'overview.forecastDays': 'Siku za utabiri zinazoonekana',
  'overview.forecastDaysNote': 'Kiwango cha utabiri wa Open-Meteo kwa nukta hii.',
  'overview.warmest': 'Mtazamo wa joto zaidi',
  'overview.warmestNote': 'Joto kuu la juu zaidi la kila siku kati ya siku za utabiri zilizorudi.',
  'overview.cooliest': 'Mtazamo wa baridi zaidi',
  'overview.cooliestNote': 'Joto ndogo zaidi la kila siku kati ya siku za utabiri zilizorudi.',
  'overview.plantingWindow': 'Kipindi cha kupanda',
  'overview.harvestWindow': 'Kipindi cha mavuno',
  'overview.outsideWindows': 'Nje ya vipindi vilivyorekodiwa',
  'overview.plantingNowNote': 'Mwezi huu uko ndani ya kipindi cha kupanda kilichorekodiwa cha zao hili.',
  'overview.harvestNowNote': 'Mwezi huu uko ndani ya kipindi cha mavuno kilichorekodiwa cha zao hili.',
  'overview.outsideWindowsNote':
    'Mwezi huu uko nje ya vipindi vya kupanda na mavuno vilivyorekodiwa — wasifu wa zao unaonyesha miezi ambayo vyanzo hutaja.',
  'overview.openCrops': 'Fungua Ushauri wa Mazao',
  'overview.noCropProfileNote':
    'Wasifu wa marejeo ya mazao hutengenezwa kwa vyanzo. Hadi wasifu wa zao hili ukiwepo, hakuna mwongozo wa kupanda unaonyeshwa — jukwaa halitobahatisha.',
  'overview.modulesAria': 'Moduli',
  'overview.goDeeper': 'Ingia kina zaidi',

  // --- Climate module ---
  'climate.description':
    'Hali ya sasa na utabiri kutoka Open-Meteo, historia ya mvua na wastani wa kawaida wa miaka 30 kutoka NASA POWER, na vipimo vya setilaiti kwa nukta ileile. Thamani halisi, za utabiri, za modeli na zilizokokotolewa huwekwa lebo daima kama zilivyo.',
  'climate.currentConditions': 'Hali ya sasa · {place}',
  'climate.currentHint':
    'Muda wa sasa uliochambuliwa na Open-Meteo kwa kiini cha gridi, pamoja na kimo kinachotangazwa na mchapishaji bila kuhusiana na kituo cha hali ya hewa.',
  'climate.loadingWeather': 'Inasoma Open-Meteo',
  'climate.temperature': 'Joto',
  'climate.wind': 'Upepo',
  'climate.rainThisHour': 'Mvua saa hii',
  'climate.gridElevation': 'Kimo cha kiini cha gridi',
  'climate.notReported': 'haijaripotiwa',
  'climate.timezoneLabel': 'eneo la saa',
  'climate.outsideEthiopia':
    'Nukta hii iko nje ya eneo lililochapishwa la Uhabeshi, kwa hivyo vyanzo vya kitaifa vinaweza visishughulikie.',
  'climate.weekAround': 'Wiki iliyopita na wiki iliyo mbele',
  'climate.weekHint':
    'Wima wa kijani ni vipimo vilivyochambuliwa, wima wa zambarau ni utabiri. Chati moja, aina mbili tofauti za namba — hazichanganywi kamwe kuwa mfululizo mmoja.',
  'climate.buildingOutlook': 'Inaunda mtazamo',
  'climate.todayMarker': 'leo →',
  'climate.rainObserved': 'Mvua, halisi',
  'climate.rainForecast': 'Mvua, utabiri',
  'climate.maxTemp': 'Joto kuu °C',
  'climate.minTemp': 'Joto ndogo °C',
  'climate.keyRainObserved': 'Mvua — halisi ({count} siku)',
  'climate.keyRainForecast': 'Mvua — utabiri ({count} siku)',
  'climate.keyMaxTemp': 'Joto kuu la kila siku',
  'climate.keyMinTemp': 'Joto ndogo la kila siku',
  'climate.rainPastDays': 'Mvua siku {count} zilizopita',
  'climate.rainNextDays': 'Mvua siku {count} zijazo',
  'climate.rainNextNote': 'Jumla ya jumla za kila siku za modeli.',
  'climate.et0Today': 'ET0 leo',
  'climate.et0Note': 'Majimuko ya marejeo ya FAO-56.',
  'climate.rainProbToday': 'Uwezekano wa mvua leo',
  'climate.dailyDetail': 'Maelezo ya kila siku',
  'climate.thDate': 'Tarehe',
  'climate.thKind': 'Aina',
  'climate.thRainMm': 'Mvua mm',
  'climate.thProbPct': 'Uwezekano %',
  'climate.thMaxMin': 'Joto kuu / ndogo °C',
  'climate.thHumidityPct': 'Unyevu %',
  'climate.thWindKmh': 'Upepo km/h',
  'climate.thEt0Mm': 'ET0 mm',
  'climate.agroTitle': 'Agroklimatolojia · {place}',
  'climate.agroHint':
    'Thamani za uso za kila siku za NASA POWER kwa kiini hiki cha gridi. Dirisha huisha jana kwa sababu POWER huchapisha uchambuzi-upya ukiwa umechelewa siku 1–3.',
  'climate.loadingPower': 'Inasoma NASA POWER',
  'climate.normalMarker': 'wastani wa kawaida mm/siku',
  'climate.keyDailyRain': 'Mvua ya kila siku — vipimo vya POWER',
  'climate.keyNormal': 'Wastani wa kawaida wa hali ya hewa mm/siku (mstari uliovunjika)',
  'climate.rainWindowDays': 'Mvua siku {count}',
  'climate.meanDailyMax': 'Wastani wa joto kuu la kila siku',
  'climate.meanDailyMin': 'Wastani wa joto ndogo la kila siku',
  'climate.meanShortwave': 'Wastani wa mionzi ya wimbo mfupi',
  'climate.anomalyTitle': 'Anomali ya mvua — imekokotolewa hapa, haichapishwi',
  'climate.anomalyBody': 'mvua za {observed} mm zilianguka dhidi ya {expected} mm za wastani wa hali ya hewa kwa {period}:',
  'climate.anomalyNotComputable': 'haiwezi kukokotolewa kutoka kwa data iliyorudi',
  'climate.anomalyRatio':
    'Uwiano wa viwango viwili vilivyochapishwa (POWER ya kila siku dhidi ya wastani wa kawaida wa miaka 30 wa POWER kwa kiini kilekile). Ukumbatizaji: siku {has}/{requested}',
  'climate.anomalySparse': ' — haitoshi kuonyesha kama jumla ya msimu',
  'climate.noAnomalyTitle': 'Hakuna anomali inaonyeshwa',
  'climate.noAnomalyBody':
    'Ombi la wastani wa hali ya hewa lilishindwa ({reason}). Mvua halisi iliyo hapo juu bado ni ya kweli.',
  'climate.satelliteTitle': 'Kipimo cha setilaiti kwa nukta hii',
  'climate.satelliteHint':
    'Thamani ya kifizikia iliyosomwa kutoka kwa bamba lililochapishwa kwa kirai hiki hasa, ikichambuliwa kwa ramani ya rangi ya mchapishaji wenyewe.',
  'climate.ndviTitle': 'Kijani cha mingime (NDVI, mchanganyiko wa siku 8)',
  'climate.imergTitle': 'Kiwango cha mvua (GPM IMERG)',
  'climate.satelliteFootnote':
    'Eneo lilichukuliwa ni pikiseli moja ya bamba — mamia ya mita upana — sio shamba la mkulima. Hakuna kati ya bidhaa hizi zinazopima mavuno au hali ya udongo; maneno ya ukanda hapo juu ni ya mchapishaji wenyewe.',
  'climate.fetchingTile': 'Inapakia bamba',
  'climate.noValue': 'hakuna thamani',
  'climate.publishedBand': 'Ukanda uliochapishwa: “{band}”.',
  'climate.noMappedValue': 'Pikiseli hii haina thamani iliyowekwa ramani, kwa hivyo hakuna inayodaiwa.',
  'climate.sceneDate': 'Tarehe ya muonekano',
  'climate.pixelSize': 'pikiseli ≈',
  'climate.outsideEthiopiaSuffix': ' — nje ya Uhabeshi',
  'climate.whatItMeans': 'Maana yake:',
  'climate.limitLabel': 'Ukomo:',

  // --- Markets module ---
  'markets.description':
    'Bei zilizochunguzwa katika masoko ya Uhabeshi na mpango wa ufuatiliaji wa WFP rEMS, kwa ETB kama ilivyorekodiwa na mchapishaji. Marejeo ya bidhaa za kimataifa havionyeshwi kamwe kama bei za masoko ya Uhabeshi hapa.',
  'markets.badgeLiveSurvey': 'Uchunguzi wa moja kwa moja',
  'markets.grainPricesTitle': 'Bei za kuu za kitaifa · mwezi mpya zaidi wa uchunguzi',
  'markets.grainPricesHint':
    'Wastani wa bei za rejareji zilizochunguzwa kweli katika mwezi huo, zikiwa zimepangwa kwa bidhaa na kipimo peke yake.',
  'markets.loadingWfp': 'Inapakia bei za WFP',
  'markets.meanAcrossMarkets': 'Wastani wa masoko {count} yaliyochunguzwa.',
  'markets.surveyMonth': 'Mwezi wa uchunguzi',
  'markets.grainNote':
    '; kila namba ni wastani wa masoko yanayoonekana kwenye kadi yake. Kahawa ni zao la kinywaji na halipo katika jedwali hili la kuu — tumia sehemu ya historia iliyo hapa chini.',
  'markets.historyTitle': 'Historia ya bei katika masoko ya Uhabeshi',
  'markets.historyHint':
    'Mstari mmoja kwa bidhaa · kipimo · aina ya bei, wastani wa masoko yaliyochunguzwa mwezi huo. Mchapishaji alipokuwa ameacha uchunguzi, mstari una pengo halisi — hakuna kitu kilichohesabiwa kwa kati.',
  'markets.last36Months': 'miezi 36 ya uchunguzi iliyopita',
  'markets.commodity': 'Bidhaa',
  'markets.loadingHistory': 'Inapakia historia ya {commodity}',
  'markets.noSeriesTitle': 'Hakuna mfululizo uliochorwa',
  'markets.noSeriesBody':
    'Mchapishaji hana mfululizo wa {commodity} wenye angalau miezi miwili chini ya kipimo kimoja na aina moja ya bei. Hakuna bei iliyobuniwa.',
  'markets.seriesLegend': '{series} · miezi {months} · hadi masoko {markets}',
  'markets.unitsNote':
    'Thamani ni ETB kwa kipimo kilichotajwa, rejareji au rejoni kama ilivyorekodiwa na mwchunguzi — hizi mbili huchanganywi wastani pamoja kamwe.',
  'markets.crossMarketTitle': 'Mabadiliko ya masoko mbalimbali',
  'markets.crossMarketHint':
    'Mabadiliko kutoka mwezi hadi mwingine ndani ya soko, bidhaa na kipimo kimoja. Kulinganisha masoko mawili ni kulinganisha michunguzi miwili, sio bei moja.',
  'markets.region': 'Mkoa',
  'markets.allRegions': 'Mikoa yote',
  'markets.loadingLatest': 'Inapakia mwezi mpya zaidi wa uchunguzi',
  'markets.thMarket': 'Soko',
  'markets.thLatest': 'Ya hivi karibuni',
  'markets.thChange': 'Mabadiliko',
  'markets.vs': 'dhidi ya',
  'markets.surveyCoverage':
    'Uchunguzi wa {month} ulishughulikia masoko {markets} na bidhaa {commodities}. Safu hapo juu zipo pekee ambapo mchapishaji ana mwezi huu na mwezi uliotangulia kwa soko, bidhaa na kipimo kilekile.',
  'markets.fxTitle': 'Ubadilishanaji wa fedha za kigeni za Uhabeshi — kategoria tatu tofauti',
  'markets.fxHint':
    'Kiwango rasmi ni chapisho la kila siku la NBE, kiwango cha soko la usawa ni wastani wa kitaifa wa kila mwezi wa Benki ya Dunia, na kiwango cha kulinganishia ni namba ya kila mwaka. Hizi ni aina tofauti za namba na huonyeshwa kando.',
  'markets.loadingFx': 'Inapakia NBE na Benki ya Dunia',
  'markets.officialLabel': 'Rasmi · mwongozo wa kila siku wa NBE',
  'markets.parallelLabel': 'Soko la usawa · wastani wa kitaifa wa kila mwezi wa Benki ya Dunia',
  'markets.benchmarkLabel': 'Vigezo vya kulinganishia · viashiria vya kila mwaka vya Benki ya Dunia',
  'markets.etbPerUsd': 'ETB kwa US$',
  'markets.officialNote':
    'Wima mmoja kwa tarehe ya biashara iliyochapishwa. Hili ni kiwango cha marejeo kilichowekwa na benki kuu, sio kiwango ambacho duka la sarafu hukupa.',
  'markets.parallelNote':
    'Wastani wa uchunguzi wa kila mwezi, sio kadirio la kila siku: nukta mpya zaidi ni mwezi wa mwisho ulioandaliwa na Benki ya Dunia, ambao unaweza kuwa nyuma ya leo kwa miezi.',
  'markets.publishedFrequency': 'ilichapishwa {frequency}',
  'markets.referencePeriod': 'marejeo ya {period}',
  'markets.annualTitle': 'Mfululizo wa kila mwaka, uliochapishwa baadaye',
  'markets.annualBody': 'Muktadha pekee — hizi si namba za mwezi huu.',
  'markets.noRowsTitle': 'Hakuna safu zilizorudi',
  'markets.noRowsBody': '{label}: majibu haya hakuwa na safu, na hakuna kitu cha mbadala kilichowekwa.',
  'commodity.teff': 'Tef',
  'commodity.maize': 'Mahindi',
  'commodity.wheat': 'Ngano',
  'commodity.sorghum': 'Mtama',
  'commodity.coffee': 'Kahawa',

  // --- Soil module ---
  'soil.pageDescription':
    'Mwongozo wa uhifadhi wa udongo na kuzuia mmomonyoko kwa mashamba ya Uhabeshi, uliounganishwa na mvua halisi inayofanya kila mbinu iwe wakati mwafaka.',
  'soil.badgeRainfallObserved': 'Mvua halisi',
  'soil.measuredTitle': 'Zilizopimwa na zilizokokotolewa — moduli hii inaweza kukwambia nini na nini haiwezi',
  'soil.measuredBody':
    'IRSHAYE haina [[vipimo vya udongo]] vyozote kwa shamba lyenu. Namba za mvua zilizo hapa chini ni vipimo kutoka NASA POWER zenye tarehe zake zimebambatanishwa; mbinu ni mwongozo wa ushauri uliorekodiwa wenye marejeo. Hakuna kitu hapa kinachochunguza rutuba au asidi ya udongo — hilo huhitaji sampuli za eneo lako na maabara.',
  'soil.measuredBodySecond':
    'Viashiria vya mingime vya setilaiti hueleza kifuniko cha mimea, sio ubora wa udongo, na havionyeshwi kamwe kama data ya udongo.',
  'soil.rainfallDriversTitle': 'Visababishi vya mvua kwa {place} — siku 90 zilizopita',
  'soil.rainfallDriversHint':
    'Mvua ya kila siku iliyopimwa (NASA POWER). Siku za mvua kali ndizo msukumo wa vitendo vya kuzuia mmomonyoko.',
  'soil.loadingRainfall': 'Inapakia mvua halisi',
  'soil.heavyRainDays': 'Siku za mvua kali (≥12 mm)',
  'soil.ofDaysWithData': 'kati ya siku zenye data',
  'soil.heavyRainNote': 'Kizingiti kilichotumika kuashiria hatari ya mkondo wa maji; sio kipimo cha udongo.',
  'soil.totalRainfall': 'Jumla ya mvua katika dirisha',
  'soil.totalRainfallNote': 'Jumla ya siku {count} ambazo mchapishaji alirudisha.',
  'soil.recordCoverage': 'Ukumbatizaji wa rekodi',
  'soil.recordCoverageNote': 'Siku zenye thamani iliyochapishwa kulinganishwa na siku zilizombwa.',
  'soil.guidanceTitle': 'Mwongozo wa uhifadhi',
  'soil.guidanceEmpty':
    'Maktaba ya mbinu zilizotengenezwa kwa uangalifu zenye marejeo ya vyanzo kwa moduli hii inaandaliwa kwa sasa. Kila mbinu ikiwa bado haina chanzo chenye marejeo, haitaonyeshwa — IRSHAYE haitaonyeshi maelekezo ya kilimo yasiyo na marejeo. Muktadha wa mvua ulio hapo juu unafanya kazi wakati huo.',
  'soil.practicesLabel': 'Mbinu za uhifadhi zilizorekodiwa',
  'soil.whenToAct': 'Wakati wa kuchukua hatua',

  // --- Settings module ---
  'settings.pageDescription':
    'Kila kidhibiti kwenye ukurasa hufanya kitu halisi. Akaunti na nafasi za kazi za pamoja zitaonekana mara mradi wa Supabase wa Irshaye utakapowekwa kuwa wa peke yake — hadi hapo, mapendeleo huhifadhiwa kwenye kifaa hiki pekee.',
  'settings.savedContext': 'Muktadha wenu uliohifadhiwa',
  'settings.savedContextHint':
    'Umehifadhiwa kwenye kivinjari hiki. Unaendesha mtiririko wa Muhtasari na eneo la kawaida la kila moduli.',
  'settings.crop': 'Zao',
  'settings.noCuratedProfile': 'Hakuna wasifu uliotengenezwa bado',
  'settings.storage': 'Hifadhi',
  'settings.storageDeviceOnly': 'Kifaa hiki pekee — hakuna akaunti inayoundwa',
  'settings.appearanceHint':
    'Turubai nyeusi inashikilia rangi ileile za aina za thamani, kwa hivyo utabiri hubaki zambarau na kipimo halisi hukibaki kijani hivyo hivyo.',
  'settings.switchToLight': 'Badilisha kwenye mwanga',
  'settings.switchToDark': 'Badilisha kwenye giza',
  'settings.colourSemantics': '— maana ileile za rangi katika turubai zote mbili.',
  'settings.integrationStatus': 'Hali ya muunganiko',
  'settings.integrationHint': 'Kile ambacho mpangilio huu unaweza kufikia kweli kwa sasa. Hakuna kitu hapa ni cha mapambo.',
  'settings.openDataName': 'Wachapishaji wa data huria (hali ya hewa, tabianchi, bei, setilaiti)',
  'settings.openDataDetail': 'API za umma zisizohitaji ufunguo hukaguliwa moja kwa moja kupitia /api/data/status.',
  'settings.advisorName': 'Mshauri wa Kilimo wa AI (Gemini)',
  'settings.advisorDetail':
    'Yanahitaji GEMINI_API_KEY katika mazingira haya. Mshauri hujaripoti kuwa haupatikani kwa uadilifu bila yake.',
  'settings.referenceName': 'Maktaba ya marejeo ya mazao na udongo',
  'settings.referenceDetail':
    'Wasifu uliotengenezwa kwa uangalifu wenye marejeo uliojumuishwa na programu; sio mchapishaji hai.',
  'settings.accountsName': 'Akaunti na rekodi zilizohifadhiwa (Supabase)',
  'settings.accountsDetail':
    'Irshaye huhitaji mradi wake mwenyewe wa Supabase kabla ya akaunti kuwezesha. Hakuna taarifa za uthibitisho za pamoja na programu yoyote nyingine.',

  // --- AI advisor module ---
  'advisor.pageDescription':
    'Mshauri huruhusiwa kuchambua tu ushahidi ambao jukwaa limekusanya na kufuatilia kwa mchapishaji. Hutaja vyanzo vyake, hutaja kutokuwa na uhakika na ukomo, na hukaa kimya ushahidi ukiwa haatoshi. Hakuahidi kamwe mavuno au kuchunguza udongo wako.',
  'advisor.badgeEvidenceOnly': 'Huchambua tu ushahidi wa jukwaa',
  'advisor.askTitle': 'Uliza kuhusu msimu wako',
  'advisor.askHint':
    'Swali hupigiwa jibu kwa {place} na zao lililochaguliwa, kwa kutumia tu ushahidi ulioorodheshwa chini ya jibu.',
  'advisor.questionLabel': 'Swali lako',
  'advisor.charCount': '{count}/900 herufi',
  'advisor.questionPlaceholder':
    'Mfano: mvua inatabiriwa ndani ya siku chache — nawichele kupanda, na nitayarisha nini wakati huo?',
  'advisor.example1': 'Je, ni wakati mwafaka wa kuandaa ardhi na kupanda?',
  'advisor.example2': 'Je, ni hatari gani za hali ya hewa nichukue kwa makini wiki hii?',
  'advisor.example3': 'Je, nipange vipi ingizo kulingana na mtazamo wa mvua?',
  'advisor.assembling': 'Inakusanya ushahidi…',
  'advisor.submit': 'Pata jibu lenye msingi wa ushahidi',
  'advisor.unavailableTitle': 'Mshauri haipatikani',
  'advisor.networkError': 'Huduma hii haikuweza kufikiwa. Hakuna jibu linaloonyeshwa badala ya kubahatisha.',
  'advisor.notConfigured':
    'Mpangilio huu huna GEMINI_API_KEY iliyopangwa, kwa hivyo mshauri hauwezi kuendelea. Kila kitu kingine kwenye jukwaa kinafanya kazi bila yake — hakuna jibu lililobuniwa linalotolewa.',
  'advisor.responseTitle': 'Majibu ya mshauri',
  'advisor.badgeInsufficient': 'Ushahidi haitoshi',
  'advisor.badgeBacked': 'Umetegemea ushahidi',
  'advisor.abstains': 'Mshauri hujiepusha',
  'advisor.uncertainty': 'Kutokuwa na uhakika',
  'advisor.limitations': 'Ukomo',
  'advisor.evidenceTitle': 'Ushahidi uliosimamia jibu hili',
  'advisor.evidenceHint':
    'Hasalaha ambalo mshauri aliruhusiwa kutumia, pamoja na uainishaji wa kila thamani na mchapishaji wake.',
  'advisor.gapsTitle': 'Mapengo yanayojulikana ambayo mshauri aliyaangalia',
  'advisor.kind.reference': 'marejeo',
};
