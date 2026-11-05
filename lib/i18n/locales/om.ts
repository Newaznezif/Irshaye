import type { Dictionary } from '../types';

/** Afaan Oromoo, in Qubee (Latin) script. */
export const om: Dictionary = {
  // --- Brand and application shell ---
  'brand.tagline': 'Qonna Haala Klimaatti Of Qunusu',
  'shell.openDataLive': 'Daataa banaa, ammumaatti',
  'shell.workingContext': 'Haala hojii',
  'shell.noCropProfile': 'Ibsi midhaanii qulqulleeffame ammaaf hin jiru',
  'shell.appearance': 'Bifa mul\'ataa',
  'shell.language': 'Afaan',
  'shell.breadcrumbPlatform': 'Pilaatformii',
  'shell.moduleFallback': 'IRSHAYE',

  // --- Accessibility ---
  'a11y.skip': 'Gara qabiyyetti ceesi',
  'a11y.openNavigation': 'Naavigeshinii banaa',
  'a11y.closeNavigation': 'Naavigeshinii cufi',
  'a11y.navigation': 'Naavigeshinii',
  'a11y.chooseLanguage': 'Afaan filadhu',
  'a11y.currentLanguage': 'Afaan ammaa: {language}',
  'a11y.themeToLight': 'Gara bifa ifaatti jijjiiri',
  'a11y.themeToDark': 'Gara bifa dukkanaaatti jijjiiri',

  // --- Sidebar groups ---
  'nav.group.Today': 'Har\'a',
  'nav.group.Intelligence': 'Odeeffannoo',
  'nav.group.Advisory': 'Gorsa',
  'nav.group.Platform': 'Pilaatformii',

  // --- Modules (single source for sidebar, tiles and page headers) ---
  'module.overview.label': 'Cuunfaa',
  'module.overview.short': 'Cuunfaa',
  'module.overview.description': 'Bakkakee, midhaankee, fi haala yeroo ammaaf murteessaa ta\'e.',
  'module.climate.label': 'Odeeffannoo Haala Klimaa',
  'module.climate.short': 'Haala Klimaa',
  'module.climate.description': 'Haala qonnaa ammaa, duraa ramadaa, caasaa roobaa fi mallattoo balaa klimaa.',
  'module.markets.label': 'Odeeffannoo Gabaa',
  'module.markets.short': 'Gabaa',
  'module.markets.description': 'Gatama meeshaalee gurgurtaa Itoophiyaa, madda fi guyyaa to\'annoodhaan.',
  'module.crops.label': 'Gorsa Midhaanii',
  'module.crops.short': 'Midhaan',
  'module.crops.description': 'Ibsa midhaanii, qajeelfama facuufii fi madaallii haala klimaa naannoo keessanitiin.',
  'module.soil.label': 'To\'annoo Lafaa',
  'module.soil.short': 'Lafa',
  'module.soil.description': 'Qajeelfama eegumsa lafaa fi ittisa sochora lafaa qonna Itoophiyaa fi.',
  'module.advisor.label': 'Gorsaa Qonnaa AI',
  'module.advisor.short': 'Gorsaa AI',
  'module.advisor.description': 'Gorsaan ragaa daataa pilaatformii mirkanaa\'ee irratti ijaarame.',
  'module.sources.label': 'Madda Daataa',
  'module.sources.short': 'Madda',
  'module.sources.description': 'Dhiheessitoonni daataa hundi, hayyama isaanii, haara\'ummaa fi ramaddiin gosa lakkaa\'amsaa.',
  'module.settings.label': 'Qindaa\'inota',
  'module.settings.short': 'Qind.',
  'module.settings.description': 'Bakka fi midhaan si\'eegame, bifa mul\'ataa fi haala wal-qunnamtii (integration).',

  // --- Shared interface words ---
  'common.retry': 'Ammas yaali',
  'common.refresh': 'Haareessi',
  'common.loading': 'Fe\'amaa jira',
  'common.close': 'Cufi',
  'common.apply': 'Hojiirra oolchi',
  'common.cancel': 'Dhiisi',
  'common.change': 'Jijjiiri',
  'common.source': 'Madda',
  'common.sources': 'Maddaalee',
  'common.detail': 'Ibsa',
  'common.state': 'Haala',
  'common.cadence': 'Saffina dhiheessaa',
  'common.newestObservation': 'To\'annoo haaraa',
  'common.unavailable': 'Hin jiru',
  'common.connected': 'Walqabate',
  'common.notConfigured': 'hin qindaa\'amne',
  'common.noData': 'Daataa hin jiru',
  'common.rows': 'tarfawwan',
  'common.derivedHere': 'as irratti baafame',
  'common.live': 'callii',
  'common.stale': 'yeroon dura',
  'common.fromCache': 'kuusaa (cache) irraa',
  'common.probeFailed': 'Qulqulleeffannuu (probe) milkaa\'e miti',
  'common.unknown': 'Hin beekamu',
  'common.allSources': 'Maddaalee hunda',
  'common.coreSources': 'Maddaalee ijoo',
  'common.sourceStatus': 'Haala madda',
  'common.units.etbPerKg': 'ETB kg tokkoof',
  'common.updating': 'haaraa\'aa jira',
  'common.refreshAll': 'Hunda hareessi',
  'common.liveBadge': 'Callii',

  // --- Value kinds: how a figure was produced ---
  'valueKind.observed': 'to\'atame',
  'valueKind.forecast': 'duraa ramaduu',
  'valueKind.modeled': 'moodelaatiin hojjetame',
  'valueKind.estimated': 'tilmaamame',
  'valueKind.imputed': 'bakka guutame',

  // --- Shared data vocabulary (landing registry and the Data Sources page) ---
  'cadence.realtime': 'yeroon isaa',
  'cadence.hourly': 'sa\'aataaf',
  'cadence.daily': 'guyyaaf',
  'cadence.8daily': 'walitti maxxansa guyyaa 8',
  'cadence.weekly': 'torbanaaf',
  'cadence.monthly': 'ji\'aaf',
  'cadence.quarterly': 'kurtii ji\'aa afuriif (sadi\'an)',
  'cadence.annual': 'baraan',
  'cadence.irregular': 'yeroo murtaa\'aa hin qabu',
  'category.weather': 'Haala qonnaa fi duraa ramadaa',
  'category.agroclimatology': 'Agrooklimatolojii',
  'category.market_prices': 'Gatama gabaa',
  'category.exchange_rates': 'Saffina jijjiirrama salfa (exchange)',
  'category.economic_benchmarks': 'Madaallii dinagdee',
  'category.geospatial': 'Daangaa fi satilaayitii',

  // --- Landing header ---
  'landing.eventTag': 'AgroInnovation 2026',
  'landing.navHow': 'Akkamitti hojjeta',
  'landing.navIntelligence': 'Odeeffannoo',
  'landing.navAdvisory': 'Gorsa',
  'landing.navData': 'Daataa',
  'landing.sourceStatus': 'Haala madda',
  'landing.openPlatform': 'Pilaatformii banaa',
  'landing.openModule': '{module} banaa',
  'a11y.landingSections': 'Kutaalee fuula jalqabaa',
  'a11y.landingHome': 'Gara fuula IRSHAYE',
  'a11y.footerModules': 'Kutaalee pilaatformii',
  'a11y.footerPublishers': 'Dhiheessitoota daataa',
  'a11y.footerPage': 'Fuula kana irratti',

  // --- Landing hero ---
  'hero.festival': 'AgroInnovation Festival 2026 · Itoophiyaa',
  'hero.title': 'Qonna haala klimaa waliin simu,\nmurtaa [[ragaa]] irratti ijaarame.',
  'hero.lede':
    'IRSHAYE pilaatformii dijitaalaa AI\'n deegaramu qonna haala klimaa waliin simu Itoophiyaa keessatiif dha. Bakka fi midhaan filadhu; odeeffannoo haala klimaa callii, qajeelfama midhaanii madda kaase, mala to\'annoo lafaa fi gatama gabaa callii walitti qindeessa — erga sana booda hiika isaanii, madda lakkaa\'amsaa hundaatiifi hanga tokkotti amanuu akka qabu ifatti ibsa.',
  'hero.ctaPrimary': 'Bakka fi midhaan keessan irraa jalqabaa',
  'hero.ctaSecondary': 'Daataa isaa duuba jiru ilaali',
  'hero.trustNoAccount': 'Herrega malee, ifa (API key) malee jalqabi',
  'hero.trustOpenData': 'Daataa banaa qofa, hayyamni isaa ibsame',
  'hero.trustLive': 'Dhiheessitoota callii, yeroo barbaadame qulqulleeffatame',
  'hero.imageAlt':
    'Lafa qonnaa xixiqqaa sadarkaa qabuu (terrace), olkaawwan Itoophiyaa keessatti abjuun ganamaa ka\'itu, daggeen dhagaa daangaa haphinaa hordofu fi manneen qonnaa aadaatiin bubbuleffame',
  'hero.placeNow': 'Finfinnee, ammaa',
  'hero.humidity': 'Hishimna',
  'hero.rainOutlook': 'Rooba, ilaalcha guyyaa 7',
  'hero.publisherSilent': 'Dhiheessi haala qonnaa deebisaa hin kennine.',
  'hero.noSubstitute': 'Gatii bakka bu\'ame tokkoyyu hin agarsiifamu.',

  // --- How it works ---
  'how.eyebrow': 'Mala hojii',
  'how.title': 'Tarsiimoonni shan: bakka irraa gara gorsaa isin to\'achuu dandeessanitti',
  'how.lede':
    'Wanti as jiru chat window of qofa "qonna" jedhaamuu moggaafame miti. Pilaatforichi duraa ragaalee beekamoo walitti qindeessa; erga sana booda qofa isaan irratti mari\'ata — kuni deebii hunda dhiheessaa fi guyyaa to\'annootiif cfamuun mirkaneeffachuuf karaa bana.',
  'how.step1Title': 'Bakka keessan filadhu',
  'how.step1Body':
    'Ganda gabaa galmee qorannoo WFP irraa — tuqaan isaa akka dhiheessa isaatti — yookiin laatituudii fi longituudii lafa qonnaa ofii galchi.',
  'how.step2Title': 'Midhaan keessan filadhu',
  'how.step2Body':
    'Ibsi midhaanii Itoophiyaa 11 kan qulqulleeffamee fi kunuunfame; dirqama tokkoyuu madda qajeelfamaa yookiin qorannoodhaan kan cfamuu malee dubbii of-dhaabbatu miti.',
  'how.step3Title': 'Haala klimaa (sukannaa) dubbatu',
  'how.step3Body':
    'To\'annoo callii, ilaalcha guyyaa 7, galmee guyyaa 45 fi normalii baroota 30 tuqaa lakkaa\'amaa tokumatti, gosa isaaniitiin adda baafamanii wal bira kaa\'aman.',
  'how.step4Title': 'Odeeffannoo qonnaa argadhu',
  'how.step4Body':
    'Yeroowwan facuufii fi muccaa, adeemsa galmaa\'ee, haala sochorri lafaa itti eegalu fi gatama to\'atame — kuusaa murtiin keessan kan irraa hirkatu.',
  'how.step5Title': 'Gorsa ragaa qabu tokko',
  'how.step5Body':
    'Gorsaadni odeeffannoo armaan olii irratti qofa mari\'achuu danda\'a. Galmee isaa ni kaasa, shakka ni ibsa, ragaaleen gahaa yoo hin ta\'in immoo callisa.',

  // --- Feature sections ---
  'features.climate.title': 'Haala qonnaa callii, torban duraatti, fi ilaalcha baroota 30 — gosootaan adda baafamanii',
  'features.climate.lede':
    'Kutaan sukannaa tuqaa lakkaa\'amaa tokof dhiheessitoota afur dubbisa; tokkoyuu gara lakkaa\'amsa tokkotti hin maxxansu. To\'annoon, bu\'aan moodelaatiifi duraa ramadaan dubbiiwwan adda addaati; IRSHAYE kunis maqaa, halluu fi sirna haara\'ummaa addaatiin ni agarsiisa.',
  'features.climate.alt':
    'Duula roobaa cimaa lafa qonnaa magariisaan uwwifame Itoophiyaa irratti dachaa\'aa, ifni abjuu giddu-galeessa lammuggoo keessa seene',
  'features.climate.b1Title': 'Haala ammaa fi ilaalcha guyyaa 7',
  'features.climate.b1Body':
    'Open-Meteo tuqaakeef duraa ramadaa ni kenna; sa\'aatin dhiheessa isaa irratti haaromfame, yeroo isaa ergameettiimmoo mallattoo qaba.',
  'features.climate.b2Title': 'Rooba kaalendii yeroon waliin',
  'features.climate.b2Body':
    'Galmee guyyaa guyyaa haaraatti eeguma ganna (kiremt) fi bittinfaddoo (belg) biraatti kaa\'ame — kanaaf eegalansi facuu yoo turame ifaan waan mul\'atuuf, gabaasa qofa miti.',
  'features.climate.b3Title': 'Mallattoo goginaa fi ho\'inaa',
  'features.climate.b3Body':
    'Odeeffannoo agrooklimatolojii NASA POWER tuqaa walfakkaatuuf irraa baafame; gatiin isaa "baafame" jedhaamuu malee "to\'atame" miti.',
  'features.climate.b4Title': 'Haara\'ummaa dhugaa dubbatu',
  'features.climate.b4Body':
    'Deebi\'ee ilaaluu ERA5 (reanalysis) torban tokko harkatti fida. Furichi kunis akkuma jirutti ni ibsa, lakkaa\'amsa duubaatti hafe "ammaa" jedhee hin dhiheessu.',

  'features.crops.title': 'Ibsa midhaanii Itoophiyaa 11 — gatiin hundi madda ofiitiin cfame',
  'features.crops.lede':
    'Mucucaaka, cekumsa, boqqoqoora, harmazaa (barley), fono (sorghum), buni, baqelaa, shingol (chickpea), nugus, qoocho (enset) fi gaaroo (khat). Sararoonni ho\'inaa, roobaa, ol\'kaa fi pH lafaa mata-duree sanyii PROTA4U, Ecocrop, FAO fi qorannoo Itoophiyaa ogeeyyiin mirkaneffaman (peer-reviewed) irraa barreeffaman — maddi isaa lakkaa\'amsa sanatti cfame.',
  'features.crops.alt':
    'Midhaan mucucaaka Itoophiyaa gahea, mata-midhaanni isaa ifa ganamaa margaatti kufe',
  'features.crops.b1Title': 'Yeroowwan facuufii fi muccaa',
  'features.crops.b1Body':
    'Qajeelfama yeroo midhaaniif fi haala qonnaatti dhiyaatu. Maddi kunuunsa beekamu yoo calaqqisi hin qabne, bakkatti dhiisee hin agarsiifamu — IRSHAYE tilmaama ofii hin gochu.',
  'features.crops.b2Title': 'Bakka keessaniif madaallii',
  'features.crops.b2Body':
    'Ol\'kaan bakka filatamee fi baay\'inni roobaa sarara kunuunsa maddaatiin madaallamu; madaalliinsaa ni kenna (grade) malee of-ibsuu miti.',
  'features.crops.b3Title': 'Madda isin banuu dandeessan',
  'features.crops.b3Body':
    'Ibsi midhaanii hundi cfama isaatii geessisa. PROTA fi qorannaan lafaa yoo wal hin simsiifne, gatiin lamaan bakka tokkotti ni mul\'atu — giddugaleessi icitee miti.',
  'features.crops.b4Title': 'Daangaawwan ibsaman',
  'features.crops.b4Body':
    'Sararoonni kunuunsa madda barreessitootaa irratti hirkatan — to\'annoo lafa keessanii miti; kutnis kun mata-duree isaatti kanuma ibsa.',

  'features.soil.title': 'Adeemsa eegumsa lafaa lafa sochoraaf saaxilame Itoophiyaa fi',
  'features.soil.lede':
    'Cana\'aa Fanya juu, dagge daangaa haphinaa hordofu, koompostii fi saphaa to\'achuu, muudannaa midhaanii, hafaan midhaanii fi biqiltuu lafaa haguuguu, eegumsa lafaa fi bishaanii walqunnamachiisuun. Adeemsi hundi qorannoo fayyadama lafaa Itoophiyaa fi eegumsa olkaawoo galmaa\'ee irraa kan fudhatame — haala itti hojjetuufi madda isaa ibsu waliin.',
  'features.soil.alt': 'Dagge dhagaa fi lafa sadarkaa (terace) qabu qonnaan gaara Itoophiyaa irratti lafa qabu',
  'features.soil.b1Title': 'Qajeelfama adeemsa — qorannoo lafaa miti',
  'features.soil.b1Body':
    'Kutni kun madaallii haphinaa lafaa fi rooba kunuunfa\'ameen balaa to\'ata. Hozii (nutrient) lafa keessanii beekuuf hin yaalu — sababni isaa qorannoo lafaa (soil test) hin goone.',
  'features.soil.b2Title': 'Haala haphinaa fi sochora lafaa',
  'features.soil.b2Body':
    'Cimina roobaafi dangeessa lafaatti (terrain) fayyadamuun bishaan lafa irraa bahuu fi lafiin sochoru bakka balaa guddaa qabu mallattoo dha.',
  'features.soil.b3Title': 'Durtii yeroon kabachiisu',
  'features.soil.b3Body':
    'Hojiin ijoo ganna (rooba guddaa) dura, hojiin biqiltuudhaa immoo booda — kaalendii kutni sukannaa fayyadamu waliin qindeeffame.',

  'features.markets.title': 'Gatama gabaa callii Itoophiyaa — guyyaan qorannoo isaatiin cfame',
  'features.markets.lede':
    'Gatiin qorannoo gatamaa WFP Ethiopia rEMS fi sarara gatii yeroon dhiyaatuun Bankii Addunyaa (World Bank) HDX darbeetiin kan fudhatame — gabaa filatameef. Qorannaan ji\'aan tokko kan gaggeeffamuufi gatiin haaraan yeroo baay\'ee torban muraasa dura\'aa; kanaaf mallattoo guyyaa to\'annoo agarsiisa — gatama har\'aa miti.',
  'features.markets.alt':
    'Keesoowwan cekumsaa, mucucaakaafi midhaan biroo gaba Itoophiyaa keessatti dachaa ta\'an, gaaddisa cichisaatiif ol kaa\'aman',
  'features.markets.b1Title': 'Gabbattoota galmee qorannoo irraa',
  'features.markets.b1Body':
    'Ramaddiin bakkaa daataa gatii dhiyaatame keessaa fudhatame — kanaaf gatiin hundi gabba isatti to\'atame waliin cfame.',
  'features.markets.b2Title': 'Adeemsa soba malee',
  'features.markets.b2Body':
    'Sararoonni to\'annoo kan argame qofa irraa dhiyaatu. Ji\'an hin jirri bakka duhi (gap) ti — wanti madaallamaan (interpolation) uumame hin jiru.',
  'features.markets.b3Title': 'Mul\'ata harkatti (lag) taa\'e',
  'features.markets.b3Body':
    'Gatiin qorannoo ji\'aan, isaanii NBE guyyaan — yeroon haaromfamaa lamaanuu lakkaa\'amsa irratti mul\'atu.',

  // --- Data credibility ---
  'data.eyebrow': 'Amanamummaa daataa',
  'data.title': 'Dhiheessitoota {count} — hundi isaanii maqaatiin, hayyamatiifi guyyaatiin cfamanii',
  'data.lede':
    'IRSHAYE daataa dhuunfaa ofii hin qabu. Egeree isaa garuu: lakkaa\'amsa screen irratti jiru hundi dhiheessaa banaatti, hayyama, yeroo dhiheessaa fi guyyaa to\'annootiif cfamuu danda\'a — furichi gatii "to\'atame" jedhu bu\'aa moodelaatiif, duraa ramadaafi kan nuun as irratti baafame adda baasa.',
  'data.pointNoKeys': 'Wanti kun otuu API key hin barbaachisu — kanaaf wanti hafeefamaan (credential) duubaatti dhokate hin jiru.',
  'data.pointMarkedKeys': 'Dhiheessitoonni ifa (credential) barbaadan ni mallattoo\'aman; ifa yoo hin qabne pilaatforichi dhugaa dubbatuun hojjechuu itti fufa.',
  'data.pointFreshness':
    'Maddi hundi yeroon haaromfamuu mataa isaa qaba — ERA5, POWER fi walitti maxxansa satilaayitii guyyaa 8 dizayinii isaaniitiin harkatti (lag) qabu.',
  'data.pointLicence':
    'Daataan lama hayyama dhiheessaa isaanii irratti hin ibsatan. Akka dubbisaman maqaan dhiheessaa kaaseen (attribution) ni agarsiifamu — daangaan isaa screen irratti ni barreessa.',
  'data.cta': 'Haala madda banaa agarsiisi',
  'data.registry': 'Galmee maddaalee',
  'data.registryBadge': 'Callii dhiheessitoota {count} irraa',

  // --- Integrity rules ---
  'rules.eyebrow': 'Seerota ragaa',
  'rules.title': 'Waaddee afur — furichi isaan dubbii qofa miti, hojiidhaan isaan mirkaneessa',
  'rules.lede':
    'Meeshaan gorsaa amanamaa ta\'uun isaa waan hin dubbanneen mirkanaa\'a. Seeronni kun sadarkaa agarsiisaa (rendering layer) keessatti hojjetan — fuula kamiyyuu irratti akkuma jirutti ni mul\'atu, daataan yoo mi\'a hin qabnelles.',
  'rules.r1Title': 'Bu\'aan moodelaatiif qonnaan hin madaallamu',
  'rules.r1Body':
    'Gatiin hundeen gosaa qaba — "to\'atame", "moodelaatiin hojjetame", "duraa ramaduu", "as irratti baafame" yookiin "bakka guutame". Halluunifi maqaan (label) addi isaan ni agarsiisa — walitti qindeessinee dhokuu miti.',
  'rules.r2Title': 'Bakki duhi bakka duhiitiin agarsiifama',
  'rules.r2Body':
    'Yoo dhiheessi wanti hin deebine, kutni ife (code) waliin gabaasa. Gatii sukannaa, gabaa yookiin qonnaa sobaa uumame bakka sunitti hin fe\'amu.',
  'rules.r3Title': 'Mirkaneeffannaa lafaa malee waa\'ee bu\'aa hin jennu',
  'rules.r3Body':
    'Pilaatforichi lafa qonnaa callii irratti hin to\'anneef bu\'aa guddisa, galii ol\'kaachaafi qusannoo bishaanii hin gabaasu; mallattoowwan satilaayitii mukaa (vegetation indices) madaallii lafaa miti.',
  'rules.r4Title': 'Gorsa — abshaar miti',
  'rules.r4Body':
    'Gorsi kun deegarsa murtii madda kaaseefi shakka ibsuudha. Qorannoo lafaa malee haala beekamuu lafaa hin himu; ragaan gahaa yoo hin ta\'in callisa.',

  // --- AI layer ---
  'ai.eyebrow': 'Sadarkaa AI',
  'ai.title': 'Gargaarri AI kan waan pilaatforichi mirkaneessuu danda\'e qofa irratti mari\'atu',
  'ai.lede':
    'Gorsaadni kuusaa ragaa kutaan biraa walitti qindeesse — sukannaa callii tuqaa keessaniif, ibsa midhaanii cfama qabu, adeemsa to\'annoo lafaa, gatama to\'atame yeroo isaatiin — fudhatee deebii caree (structure) qindaa\'een kenna. Lafa qonnaatti, laabiraatii qorannoo lafaatti, gabaa darbuu (futures exchange) wallatti cfamaa miti — kunis ni ibsa.',
  'ai.keyNote':
    'Deebiin AI ifa moodelaa (model key) sirna kanaatti barbaachisa. Ifa yoo hin jirre, kutni "hin jiru" jedha; kutaan biraa hundi hojjechuu itti fufu — gorsa sobaa irratti hin deeman.',
  'ai.cta': 'Gorsaa Qonnaa AI banaa',
  'ai.imageAlt':
    'Qonnaan Itoophiyaa lifaa adii netala jedhamu uffate, bilbila harkatii bu\'uuraa qabate, haasaa gorsaa dhaga\'uuf gurra kennate',
  'ai.contract': 'Waliigaltee deebii',
  'ai.contract1Body':
    'Galmee pilaatformii bu\'uura deebii ta\'e — tokkoon tokkoon isaa dhiheessaa fi guyyaa to\'annotti cfama.',
  'ai.contract2Body':
    'Garsi kun akka deegarsa murtii qonnaatti dhiya\'a — qorannoo lafaa, muccaa mirkaneessaa, galii waadaa ga\'uu miti.',
  'ai.contract3Body':
    'Ragaaleen fixuu dadhaban deebii keessatti ni ibsamu — sarara madda irraa fudhatame, gatiin yeroon duubaatti hafe, fi ji\'aaleen hafe.',
  'ai.contract4Body':
    'Ragaaleen walitti qabaman deebii gorsuuf yoo hin ga\'ine, gorsaadni gorsa kamiyyuu hin deebisu — bakka duhe isaa kaasa.',

  // --- Audience / call to action ---
  'cta.title': 'Pilaatformii banaa bakka keessan filadhu. Kan hafe calliidha.',
  'cta.lede':
    'Galmee herregaa hin barbaachisu, daataa fakkeenyaatiif lakkaa\'amsa duruun kunuunfame hin jiru. Gabaa magaalaa Itoophiyaa filadhu yookiin tuqaa ofii keessan (coordinates) galchi — IRSHAYE dhiheessitoota banaa isinis dubbisuu danda\'atanitti fayyadama; erga sana booda waan argate, yeroo isaatiifi wanti hin argamne ifaan ifatti agarsiisa.',
  'cta.primary': 'Gara Cuunfaatti deemi',
  'cta.secondary': 'Durtii haala madda to\'adhu',
  'cta.eyebrow': 'Kan irratti xiyyeefate',
  'cta.a1Title': 'Qonnaan bultootaafi lafa qonnaa manaa',
  'cta.a1Body':
    'Browserii keessatti banaa, herregaafi ifa (key) malee. Maqaaleen midhaanii Ge\'ez akka barbaadutti ni mul\'atu; lakkaa\'amsi bifa murtiin itti hirkatuun — mm, ol\'kaan meetiriin (galaana irraa), gatamiin kintaleetiin — dhiya\'a.',
  'cta.a2Title': 'Gorsitoota misoomaafi kuusaa (cooperative)',
  'cta.a2Body':
    'Screen tokkotti sukannaa, dirqama midhaanii cfama qabu, adeemsa eegumsa lafaafi gatama to\'atame bakka tokkotti walitti qabameera — kanaaf da\'uun gorsaa ragaandhaan eegalama.',
  'cta.a3Title': 'Sagantaa, dhaabbilee (NGO) fi qorattoota',
  'cta.a3Body':
    'Dhiheessaan, hayyamaanifi yeroon haaromfamaa hundinuu ni ibsaman; gatiin nuun baafame "baafame" jedhanii mallattoo\'aman — kanaaf lakkaa\'amsi pilaatformii alatti yoo fuwame madaallii isaa waliin deema.',

  // --- Landing footer ---
  'footer.about':
    'Pilaatformii dijitaalaa AI\'n deegaramu qonna haala klimaa waliin simu Itoophiyaa keessatti. Odeeffannoo sukannaa bakka irratti hirkate, gorsa midhaanii fi lafaa, gatama gabaa — ragaan isaa waliin cfamee.',
  'footer.modules': 'Kutaalee',
  'footer.publishers': 'Dhiheessitoota',
  'footer.overview': 'Cuunfaa',
  'footer.linkHow': 'Akkamitti IRSHAYE hojjeta',
  'footer.linkIntelligence': 'Sukannaa, midhaan, lafa, gabaa',
  'footer.linkAdvisory': 'Sadarkaa AI',
  'footer.linkRegistry': 'Galmee maddaalee',
  'footer.linkSaved': 'Bakkaafi midhaanii simame',
  'footer.disclaimer':
    'IRSHAYE deegarsa murtii qonnaa kenna, abshaar miti. Gorsaaleen gosa bu\'aa, galii yookiin qusannoo bishaanii lafa qonnaa callii irratti hin to\'anneef waadaa hin galan; kutni kamiyyuun to\'annoo lafaa malee haala lafaa hin ibsu. Sararoonni gorsaa midhaanii kan madda irraa fudhataman filannoo galmee qofa — lafa keessan to\'achuun miti. Mallattoowwan satilaayitii (NDVI) magariisa gubbaa biqiltuu qofa ibsu — qulqullina lafaa hin himan. Dhiheessi yoo wanti deebise hin qabne, pilaatforichi gatii ofumaan uumuu dhiisee bakka duhe ibsa.',
  'footer.attributions':
    'Sukannaa fi kliimaa: Open-Meteo (CC BY 4.0) fi NASA POWER. Baay\'ina roobaafi normalii ho\'inaa: ERA5 deebisanii ilaaluu (reanalysis) Open-Meteo darbeetiin. Gatama gabaa: WFP Ethiopia rEMS fi sarara yeroon dhiyaatu Bankii Addunyaa HDX darbeetiin. Saffina jijjiirrama salfa (exchange): Bankii Itoophiyaa (NBE) fi Bankii Addunyaa. Daangaawwanfi kuusaawwan satilaayitii: geoBoundaries, NASA GIBS, Ethiopia.GeoPortal ArcGIS irratti, GRID3/WorldPop fi CDE — hayyamni isaanii fuula "Madda Daataa" irratti akka ibsame.',

  // --- Loading and notice primitives ---
  'states.codeLabel': 'Code',
  'states.codeNoSubstitute': 'Madda kanaaf gatiin bakka bu\'aa (substitute) hin agarsiifamu.',

  // --- Provenance blocks ---
  'prov.kind.observed': 'To\'atame',
  'prov.kind.modeled': 'Moodelaatiin hojjetame',
  'prov.kind.forecast': 'Duraa ramaduudhaan',
  'prov.kind.estimated': 'As irratti baafame',
  'prov.kind.imputed': 'Bakka guutame',
  'prov.noSource': 'Lakkaa\'amsa kanaaf maddi hin jiru.',
  'prov.behindSchedule': 'Yeroo duraa hafe',
  'prov.cachedCopy': 'Copy kuusaa (cache)',
  'prov.sourceLink': 'madda',
  'prov.observedAt': '{when} to\'atame',
  'prov.fetchedAt': '{when} argame (EAT)',
  'prov.dateNotStated': 'guyyaan hin ibsamne',
  'prov.notAvailable': 'Hin jiru',

  // --- Value-kind legend (Data Sources) ---
  'legend.title': 'Akkamitti gatiin ramadamu',
  'legend.hint':
    'Lakkaa\'amsa pilaatformii irratti jiru hundeen gosa kanneen keessaa tokko qaba. Gosaan isaa halluu, jechaa fi yeroo haaromfamaa (cadence) murteessa.',
  'legend.ruleLabel': 'Seera',
  'legend.observedMeaning':
    'To\'annoo dhiheessi akka to\'annoo qilleensaa yookiin qorannoo gabaaatti gabaase.',
  'legend.observedRule': 'Guyyaa to\'annoo isaa waliin agarsiifama; duraa ramadaa miti.',
  'legend.modeledMeaning':
    'Ilaalcha haaromsa (reanalysis) yookiin bu\'aa moodelaati — seera uumamaatiin ijaarame ta\'uu danda\'a, garuu to\'annoo tuqaa keessaniiti miti; deebisanii hojjetame.',
  'legend.modeledRule': 'Akka "moodelaatiin hojjetame" mallattoo\'ama; sadarkaa lakkaa\'amaa (grid resolution) dhiheessi yoo kaase.',
  'legend.forecastMeaning': 'Duraa ramadaa moodela lakkaa\'amsaa sukannaa.',
  'legend.forecastRule': 'To\'annoo waliin sarara tokkotti hin maxxansaman.',
  'legend.estimatedMeaning':
    'Lakkaa\'amsa aplikeshinii kun gatii dhiyaatamee irraa baafate, fakkeenyaaf garee (anomaly) roobaa.',
  'legend.estimatedRule': '"As irratti baafame" jedhaamuu mallattoo\'ama; kunuunsa isaa kaasuun haaromsuuf karaa bana.',
  'legend.imputedMeaning': 'Bakka dhiheessi gatii hin qabneetti bakka bu\'iin (value) kaa\'ame.',
  'legend.imputedRule':
    'IRSHAYE daataa qonnaa bakka hin guutu. Madaalliin kun yoo mul\'ate, bakka bu\'iinsi isaa screen irratti ni ibsama.',

  // --- Source status panel ---
  'sources.title': 'Haala madda',
  'sources.hint':
    'Tarfni hundeen qulqulleeffannuu (live probe) dhiheessaa ofiitiiti. Maddi yoo hin qabamne, sababa isaatiin "cfamuu hin dandeenye" jedhaamuu gabaafama — hin dhokfamu, bakka bu\'iinsis hin jiru.',
  'sources.recheck': 'Ammas to\'adhu',
  'sources.recheckAria': 'Maddaalee ammas to\'adhu',
  'sources.probeScope': 'Bal\'ina qulqulleeffannaa',
  'sources.probing': 'Maddaalee qulqulleeffachaa jira…',
  'sources.probeFailed': 'Qulqulleeffannuun haala madda milkaa\'e miti',
  'sources.apiKeyRequired': 'API key barbaachisa',
  'sources.ranAt': 'Qulqulleeffannaan {when} (EAT) gaggeeffame.',
  'sources.allHint': '"Maddaalee hunda" feeds gatii fi mallattoo gurguddaa illee qulqulleessa — kunis yeroo dheeraa fudhata.',
  'sources.storedPipeline': 'Adeemsa daataa kuufame',
  'sources.noSync':
    'Kuusaan daataa kanaaf galmee sirna sync galmaa\'eef hin jiru — kanaaf lakkaa\'amsa agarsiifamu hundeen kuusaa irraa miti, dhiheessaa irraa yaalii kanaatti (this request) argame. Kuni qindaa\'ina hojii sirrii dha; sync\'n galmee darbe dabaluu fi yeroo dhiheessi waan dhaabbatu tajaajila itti fufsiisuuf malee.',
  'sources.unfinished': 'haqa hin qabu',
  'sources.pageDescription':
    'IRSHAYE daataa banaa dhiheessitoota beekamoo qofa irraa tajaajila; wanti biraa hin jiru. Kaardiin duhi (empty) jechuun dhiheessi deebisaa hin kennine — sirna tajaajilaa keessatti soba, fakkeenya, yookiin lakkaa\'amsa qopheeffame (placeholder) miti.',
  'statusLabel.connected': 'Walqabate',
  'statusLabel.stale': 'Yeroo duraa hafe',
  'statusLabel.unavailable': 'Hin jiru',
  'statusLabel.auth_required': 'Credential (mirkanaa\'iinsa) barbaachisa',
  'statusLabel.disabled': 'Cufaa jira',
  'statusLabel.not_configured': 'Hin qindaa\'amne',
  'syncLabel.succeeded': 'yeroo dhumaaf dhiheessitoota hunda kuusuu milkaa\'e',
  'syncLabel.partial': 'dhiheessitoota muraasa qofa kuufamanii',
  'syncLabel.failed': 'yeroo dhumaaf galmee kamiyyuu hin kuusan',
  'syncLabel.skipped_overlap': 'hakee, sirni biraa hojjechaa jira',

  // --- Location and crop pickers ---
  'picker.location': 'Bakka',
  'picker.surveyMarket': 'Gabaa qorannoo',
  'picker.ownPoint': 'Tuqaa ofii',
  'picker.hint':
    'Magalonni gabaa galmee WFP dhiyaatame irraa fudhatame — kanaaf bakka filatameen (coordinates) fi ramaddiin godinaa dhiheessa isaatiin cfama.',
  'picker.marketCentre': 'Bakka gaba',
  'picker.customCoordinate': 'Tuqaa (coordinate) ofii galchi',
  'picker.ownPointField': 'Yookiin tuqaa ofii galchi',
  'picker.ownPointHint': 'Akkuma galchameen fayyadama; lakkaa\'amsa tuqaa ofiitiin galchameen maqaan aanaa fi godinaa hin cfamu.',
  'picker.latitude': 'Laatituudii (latitude)',
  'picker.longitude': 'Longituudii (longitude)',
  'picker.selectedCoordinate': 'Tuqaa filatame',
  'picker.summaryWfp': '. Maqaan godinaa fi aanaa akka WFP dhiheesseeti.',
  'picker.summaryOwn': '— {name}, bakka keessaniiti.',
  'picker.checkCoordinates': 'Tuqaa (coordinates) keessan to\'adhu',
  'picker.errorBlank': 'Laatituudii fi longituudii lakkaa\'amsaatti galchi.',
  'picker.errorRange': 'Laatituudiin −90 fi 90 gidduu, longituudiin −180 fi 180 gidduu ta\'uu qaba.',
  'picker.listUnavailable': 'Tarree bakkaa argamuuf miti',
  'picker.listFailed': 'Tarree bakkaa fe\'amuun hin dandeenye; tuqaa (coordinate) ofiitiin garuu ni hojjeta.',
  'crops.yourCrop': 'Midhaan keessan',
  'crops.cropProfile': 'Ibsa midhaanii',
  'crops.pickerHint':
    'Garsi kun kunuunsa qorannoo cfama qabudha — gatii callii lafa keessaniiti miti. Madaalliin kunuunsa haala sukannaa calliiti waliin godha; gorsaa "moodelaatiin hojjetame" jedhaamuu mallattoo\'ama, gatii to\'atameen miti.',

  // --- Crop advisory module ---
  'crops.pageDescription':
    'Ibsi midhaanii kunuunsa maddaalee cfama qabudha — gatiin hundeen madda ofiitiin cfame. Madaalliin kunuunsa sukannaa calliiti waliin godhe gorsaa moodelaatiif mallattoo\'ama; to\'annoo lafa keessaniiti miti.',
  'crops.badgeNoProfile': 'Ibsi midhaanii hin filatamne',
  'crops.overall.supported': 'Sarara kunuunfaa waliin simata',
  'crops.overall.mixed': 'Qoodaaf ni simata',
  'crops.overall.weak': 'Sarara kunuunfaa alatti',
  'crops.overall.insufficient-data': 'Daataan gahaa miti',
  'crops.aspect.season': 'Yeroo',
  'crops.aspect.rainfall': 'Baay\'ina rooba',
  'crops.aspect.temperature': 'Ho\'inaa',
  'crops.aspect.altitude': 'Ol\'ka',
  'crops.verdict.within': 'keessatti',
  'crops.verdict.watch': 'hordogi',
  'crops.verdict.outside': 'alatti',
  'crops.verdict.unknown': 'daataa miti',
  'crops.noData': 'daataa miti',
  'crops.noProfileTitle': 'Ibsa gorsaa midhaanii',
  'crops.noProfileBody':
    'Ibsni midhaanii Itoophiyaa dhiyaatu kunuunsaafi madda cfama qabu qophaa\'aa jira. Ibsni midhaanii tokko yoo hin jirre, kutni kun qajeelfama kamiyyuu hin agarsiisu — IRSHAYE gatii madda hin qabne hin gabaasu. Kutaan sukannaafi gabaa garuu ammas guutummaatti ni hojjetu.',
  'crops.liveComparison': 'Madaallii callii',
  'crops.liveComparisonHint':
    'Dirqama kunuunfaa midhaanii {crop} tuqaa {place} irratti sukannaa calliiti waliin madaallamu. Madaalliin hundeen kunuunsa isaa fayyadame kaasa.',
  'crops.provenanceForecast': 'kunoonfama duraa ramadaatiin',
  'crops.provenanceObserved': 'galmee to\'atame',
  'crops.loadingComparison': 'Sukannaa callii madaalliif fe\'amaa jira',
  'crops.altitudeDetail':
    'Haala qonnaa (agroecology) kunuunfa\'amee: {bands}. Pilaatforichi ol\'kaa lafa keessaniiti daataa banaatiin to\'achuu hin danda\'u — kanaaf ol\'kaan murtii keessaniiti.',
  'crops.altitudeMissing': 'Ol\'kaan (altitude band) kunuunfa\'ame midhaana kanaaf hin argame.',
  'crops.requirementsTitle': 'Dirqamoota kunuunfa\'aman',
  'crops.requirementsHint':
    'Gatii referensii cfama qabuu — kunuunsaafi madda barreessa qabudha, to\'annoo lafa keessaniiti miti.',
  'crops.seasonRainNeed': 'Barbaachisaa rooba yeroo gannaatti',
  'crops.documentedTotal': 'Kuusaa marsaa guutuuf kunuunfa\'ame.',
  'crops.tempRange': 'Sarara ho\'inaa',
  'crops.singlePoint': ' (tuqaa tokko)',
  'crops.seasonDependence': 'Hirkannoo yeroo roobaatiin',
  'crops.soilPreference': 'Filannoo lafaa',
  'crops.soilPreferenceNote': 'Filannoo gahumsaa (drainage) kunuunfa\'ame, qorannoo lafaa (soil test) miti.',
  'crops.plantingHarvest': 'Yeroowwan facuufii fi muccaa',
  'crops.noPlantingCalendar':
    'Kaalendaraan ji\'oota facuu kunuunsa (citable) qabu midhaana kanaaf hin argamne — bakka duhe agarsiisa, bakka hin guutanu.',
  'crops.plantLabel': 'Facuu',
  'crops.harvestLabel': 'Muccaa',
  'crops.noHarvestCalendar': 'Kaalendaraan ji\'oota muccaa kunuunsa qabu midhaana kanaaf hin argamne.',
  'crops.tempNoteTitle': 'Hubachiisa dirqama ho\'inaa',
  'crops.soilNoteTitle': 'Filannoo lafaa — kunuunfa\'ame, to\'atame miti',
  'crops.phDocumented': 'pH kunuunfaa\'amee {min}–{max}.',
  'crops.phMissing': 'Sararaan pH kunuunsa qabu hin argamne.',
  'crops.practicesTitle': 'Adeemsa kunuunfa\'amee',
  'crops.practicesHint': 'Adeemsa to\'annoo maddaaleen kunuunsa qabni midhaana kanaaf kaasan.',
  'crops.risksTitle': 'Balawwan sukannaa galmee qabaniiti',
  'crops.risksHint':
    'Ibsa balaa madda qorannoo irraa fudhate — hordoffii pilaatformii isaaniif godhu waliin.',
  'crops.whenLabel': 'Yoom:',
  'crops.watchLabel': 'Hordoffii pilaatformii:',
  'crops.seasonTitle': 'Kaalendaa yeroo Itoophiyaa',
  'crops.seasonHint': 'Hiikni yeroonni sararoonni armaan olii isaan irratti hirkatan.',
  'crops.limitsTitle': 'Daangaawwan kutaa kunuunsa kanaa',

  // --- Suitability sentences (generated by lib/crops/suitability.ts) ---
  'suitability.singlePoint': '(kunoonfama tuqaa tokko)',
  'suitability.seasonNoCalendar':
    'Kaalendaraan kunuunsa (citable) ji\'ootaa midhaana {crop} maddaalee kunuunfa\'amaniitti hin argamne — kanaaf IRSHAYE yeroo facuu yookiin muccaa tilmaamu dhiisee bakka duhe agarsiisa.',
  'suitability.seasonPlanting': '{month} yeroo facuu midhaana {crop}tti kunuunfa\'ame keessa jira.',
  'suitability.seasonHarvest': '{month} yeroo muccaa midhaana {crop}tti kunuunfa\'ame keessa jira.',
  'suitability.seasonOutside': '{month} yeroo facuu fi muccaa midhaana {crop}tti kunuunfa\'ame alatti jira.',
  'suitability.rainNoRange': 'Sararaan baay\'ina roobaa yeroon midhaana kanaaf kunuunsa qabu hin argamne — kanaaf madaalliin hin jiru.',
  'suitability.rainNoData': 'Daataan sukannaa rooba callii ammaaf hin jiru — kanaaf sararaan yeroo waliin madaallamuuf miti.',
  'suitability.rainDry':
    'Barbaachisaan kunuunfa\'ame yeroo gannaaf {need} mm ti; garuu mallattoon rooba yeroo dhihootti dadhabaadha ({signal}). Hojiin rooba irratti hirkate yoo danda\'amu simchisi.',
  'suitability.rainForecast7': '{mm} mm guyyaa 7 keessaatti duraa ramaduu',
  'suitability.rainNoMeasurable': 'galmee yeroo dhihootti rooba lakkaa\'amu miti',
  'suitability.rainWithin':
    'Barbaachisaan kunuunfa\'ame yeroo gannaaf {need} mm. Rooba yeroo dhihootti: {forecast}; to\'atame yeroo gabaabaatti {observed}.',
  'suitability.notAvailable': 'hin jiru',
  'suitability.tempNoRange': 'Sararaan ho\'inaa (temperature range) midhaana kanaaf kunuunfa\'ame hin jiru.',
  'suitability.tempNoData': 'To\'annoon ho\'inaa callii ammaaf waan hin jirre madaalliin ho\'inaa hin jiru.',
  'suitability.tempOutside':
    'To\'annoon ammaa ({readings}) sarara kunuunfaa {range} midhaana {crop} alatti jira. {notes}',
  'suitability.tempBrush': 'To\'annoon geessa sarara kunuunfaa {range} cuqulate. {notes}',
  'suitability.tempWithin': 'To\'annoon ammaa {readings} sarara kunuunfaa {range} keessa jira.',

  // --- Overview module ---
  'overview.title': 'Cuunfaa qonnaan bultuu',
  'overview.description':
    'Bakka keessan fi midhaan keessan filadhu. Kan armaan gadii hundi daataa callii madda isaa qabudha; lakkaa\'amsi duraa ramadaa yookiin bu\'aa moodelaati yoo ta\'e — to\'annoo miti — furichi ifatti ibsa.',
  'overview.badgeLive': 'Callii',
  'overview.badgeConnecting': 'Walqunnamsiisaa jira',
  'overview.badgeNoReading': 'To\'annoo callii miti',
  'overview.changeContext': 'Haala simame jijjiiri',
  'overview.yourLocation': 'Bakka keessan',
  'overview.seasonContext': 'Haala yeroo — {place}',
  'overview.seasonHint':
    'Ji\'a {month}. Gorsaaleen kun duraa ramadaa calliiti waliin dirqama midhaan keessanii kunuunfa\'ame madaala.',
  'overview.rainNow': 'rooba ammaa {value} mm',
  'overview.loadingWeather': 'Sukannaa callii fe\'amaa jira',
  'overview.tempNow': 'Ho\'inaa ammaa',
  'overview.observedAt': '{when} to\'atame',
  'overview.noObservation': 'To\'annoon hin deebine',
  'overview.rainOutlookNote': 'Kuusaa duraa rooba guyyaa guyyaan — ilaalcha moodelaati, to\'annoo miti.',
  'overview.noForecastDays': 'Guyyaawwan duraa ramadaa hin deebine.',
  'overview.nextRainDay': 'Guyyaa itti aanu ≥ 1 mm',
  'overview.noneIn7d': 'Guyaawwan 7 keessaa tokkollee',
  'overview.nextRainDayNote': 'Guyyaan jalqabaa duraa ramadaa mm rooba tokko ga\'u.',
  'overview.humidityNow': 'Hishimna ammaa',
  'overview.humidityNote': 'Hishimna (relative humidity) to\'annoo ho\'inaa walfakkaatu irraa.',
  'overview.forecastDays': 'Guyyaawwan duraa ramadaa agarsiifaman',
  'overview.forecastDaysNote': 'Yeroo (horizon) Open-Meteo tuqaa kanaaf.',
  'overview.warmest': 'Haala ho\'aa ol\'aanaa',
  'overview.warmestNote': 'Guyyaawwan duraa ramadaa deebi\'an keessatti ol\'aanaan guyyaa guyyaa guddaan.',
  'overview.cooliest': 'Haala qorraa gadi\'aanaa',
  'overview.cooliestNote': 'Guyyaawwan duraa ramadaa deebi\'an keessatti gadi\'aanaan guyyaa guyyaa xiqqaan.',
  'overview.plantingWindow': 'Yeroo facuu',
  'overview.harvestWindow': 'Yeroo muccaa',
  'overview.outsideWindows': 'Yeroo kunuunfaa alatti',
  'overview.plantingNowNote': 'Ji\'a kun yeroo facuu midhaana kanaaf kunuunfa\'ame keessa jira.',
  'overview.harvestNowNote': 'Ji\'a kun yeroo muccaa midhaana kanaaf kunuunfa\'ame keessa jira.',
  'overview.outsideWindowsNote':
    'Ji\'a kun yeroo facuu fi muccaa kunuunfa\'amaniiti alatti jira — ibsni midhaanii (crop profile) maddoonni ji\'oota kaasan ni agarsiisa.',
  'overview.openCrops': 'Gorsa Midhaanii banaa',
  'overview.noCropProfileNote':
    'Galmee kunuunsa midhaanii maddaalee waliin qindeeffameera. Ibsni midhaana kanaaf yoo hin jirre, gorsi facuu hin agarsiifamu — furichi tilmaama (guess) hin gootu.',
  'overview.modulesAria': 'Kutaalee',
  'overview.goDeeper': 'Fageettii deemi',

  // --- Climate module ---
  'climate.description':
    'Haala ammaa fi duraa ramadaa Open-Meteo irraa, seenaa roobaafi normalii bara 30 NASA POWER irraa, akkasumas to\'annoo satilaayitii tuqaa walfakkaatuuf. To\'annoon, duraa ramadaan, moodelaatiin hojjetamee fi as irratti baafaman gosoota isaanitiin adda baafamanii agarsiifamu.',
  'climate.currentConditions': 'Haala ammaa · {place}',
  'climate.currentHint':
    'Yeroo ammaa (analysed now-time) Open-Meteo kutaa lakkaa\'amaatiif, ol\'kaan (elevation) bakka to\'annoo irratti hin hirkanne dhiheessi gabaase.',
  'climate.loadingWeather': 'Open-Meteo dubbisaa jira',
  'climate.temperature': 'Ho\'inaa',
  'climate.wind': 'Qilleensa',
  'climate.rainThisHour': 'Rooba sa\'aa kanaati',
  'climate.gridElevation': 'Ol\'kaa kutaa lakkaa\'amaa',
  'climate.notReported': 'hin gabaasamne',
  'climate.timezoneLabel': 'naannoo sa\'aa (timezone)',
  'climate.outsideEthiopia':
    'Tuqaan kun daangaa beekamaa Itoophiyaa alatti waan jiruuf, maddoonni biyyoolessaa morsuu dadhabu.',
  'climate.weekAround': 'Torban darbe fi torban dhufu',
  'climate.weekHint':
    'Sararoonni magariin to\'annoo mirkanaa\'e; sararoonni violetniimmoo duraa ramadaa dha. Chaartii tokkotti, lakkaa\'amsa gosa lama — sarara tokkotti hin maxxansaman.',
  'climate.buildingOutlook': 'Ilaalcha ijaaraa jira',
  'climate.todayMarker': 'har\'a →',
  'climate.rainObserved': 'Rooba, to\'atame',
  'climate.rainForecast': 'Rooba, duraa ramaduudhaan',
  'climate.maxTemp': 'Ol\'aanaa °C',
  'climate.minTemp': 'Gadi\'aanaa °C',
  'climate.keyRainObserved': 'Rooba — to\'atame (guyyaa {count})',
  'climate.keyRainForecast': 'Rooba — duraa ramaduu (guyyaa {count})',
  'climate.keyMaxTemp': 'Ol\'aanaa guyyaa guyyaan',
  'climate.keyMinTemp': 'Gadi\'aanaa guyyaa guyyaan',
  'climate.rainPastDays': 'Rooba guyyaa {count} darbee',
  'climate.rainNextDays': 'Rooba guyyaa {count} dhufu',
  'climate.rainNextNote': 'Kuusaan guyyaa guyyaan moodelaatiin hojjetame.',
  'climate.et0Today': 'ET0 har\'aa',
  'climate.et0Note': 'Referensii evapotranspiration FAO-56.',
  'climate.rainProbToday': 'Carraa roobaa har\'aa',
  'climate.dailyDetail': 'Ibsa guyyaa guyyaa',
  'climate.thDate': 'Guyyaa',
  'climate.thKind': 'Gosa',
  'climate.thRainMm': 'Rooba mm',
  'climate.thProbPct': 'Carraa %',
  'climate.thMaxMin': 'Ol\'aanaa / gadi\'aanaa °C',
  'climate.thHumidityPct': 'Hishimna %',
  'climate.thWindKmh': 'Qilleensa km/h',
  'climate.thEt0Mm': 'ET0 mm',
  'climate.agroTitle': 'Agrooklimatolojii · {place}',
  'climate.agroHint':
    'Gatii guyyaa guyyaa (daily surface) NASA POWER kutaa lakkaa\'amaa kanaatiif. Daangaa guyyaa marfaatti dhaabbata — sababni isaa POWER galmee deebisanii ijaaruu (reanalysis) guyyaa 1–3 booda dhiyaatu.',
  'climate.loadingPower': 'NASA POWER dubbisaa jira',
  'climate.normalMarker': 'normalii mm/guyyaa',
  'climate.keyDailyRain': 'Rooba guyyaa guyyaa — to\'annoo POWER',
  'climate.keyNormal': 'Normalii klimaatolojii mm/guyyaa (sarara citee)',
  'climate.rainWindowDays': 'Rooba guyyaa {count}',
  'climate.meanDailyMax': 'Giddugaleessa ol\'aanaa guyyaa',
  'climate.meanDailyMin': 'Giddugaleessa gadi\'aanaa guyyaa',
  'climate.meanShortwave': 'Giddugaleessa ifa aduu (shortwave)',
  'climate.anomalyTitle': 'Garee (anomaly) roobaa — as irratti baafame, dhiheessa miti',
  'climate.anomalyBody': 'Yeroo {period}: rooba {observed} mm normalii {expected} mm waliin madaallame:',
  'climate.anomalyNotComputable': 'daataa deebi\'ameen madaallamuuf miti',
  'climate.anomalyRatio':
    'Madaalliin (ratio) gatii dhiyaatame lamaati (galmee guyyaa POWER normalii baroota 30 POWER kutaa tokumatti). Gahumsa guyyaa {has}/{requested}',
  'climate.anomalySparse': ' — baay\'ee duha; yeroo gannaaf kuusaatti hin gahamu',
  'climate.noAnomalyTitle': 'Gareen (anomaly) hin agarsiifamu',
  'climate.noAnomalyBody':
    'Gaaffiin normalii sukannaa milkaa\'e miti ({reason}). To\'annoon roobaa armaan olii garuu dhugaadha.',
  'climate.satelliteTitle': 'To\'annoo satilaayitii tuqaa kanaatiif',
  'climate.satelliteHint':
    'Gatii pikselii kutaa satilaayitii tuqaa sirriitti keessanirraa fudhate, maxxansa halluu (colour map) dhiheessa isaaniitiin qulqulleeffame.',
  'climate.ndviTitle': 'Magariisa biqiltuu (NDVI, walitti maxxansa guyyaa 8)',
  'climate.imergTitle': 'Saffina roobaa (GPM IMERG)',
  'climate.satelliteFootnote':
    'Bakkeen to\'atame pikselii kutaa tokko — bal\'inni isaa meetira dachaa heddu — lafa qonnaan bultuu ofii miti. Oomishoonni lamaanuu bu\'aa yookiin haala lafaa (soil) to\'achuu miti; jechi sarara armaan olii dhiheessa isaaniiti.',
  'climate.fetchingTile': 'Kutaa (tile) fe\'amaa jira',
  'climate.noValue': 'gatii miti',
  'climate.publishedBand': 'Sarara dhiyaate: "{band}".',
  'climate.noMappedValue': 'Pikseli kun gatii ramadame (mapped) hin qabu — wanti kaafame (claim) hin jiru.',
  'climate.sceneDate': 'Guyyaa fakkeenya (scene)',
  'climate.pixelSize': 'pikselii ≈',
  'climate.outsideEthiopiaSuffix': ' — Itoophiyaa alatti',
  'climate.whatItMeans': 'Hiika isaa:',
  'climate.limitLabel': 'Daangaa:',

  // --- Markets module ---
  'markets.description':
    'Gatama sagantaan to\'annoo WFP rEMS fi qorannoon gabaa torbeendi FEWS NET gabaa Itoophiyaa keessatti to\'atan, dhiheessi tokkoon tokkoon isaa akka galmeeffateetti huujii fi safartuudhaan. Asitti wanti moodelaan hojjetame, karoorfame yookiin guutame hin jiru: maddi deebisaa hin qabne akka hin argamne agarsiifama.',
  'markets.badgeLiveSurvey': 'To\'annoo callii',
  'markets.surveyMonth': 'Ji\'a to\'annoo',
  'markets.historyTitle': 'Seenaa gatii gabaa Itoophiyaa keessatti',
  'markets.historyHint':
    'Yeroo tokkotti sarara tokko — meeshaa, safartuu dhiheessaa fi gosa gatii tokko. Giddugalaan, gadhee fi ol\'aannu isaa safarkoota lakkoofsa qaban irraa asitti herregarama — yeroon gatii hin qabne sararri isa qaxxamuraan walitti hin hidhamne kutama.',
  'markets.commodity': 'Meeshaa',
  'markets.loadingHistory': 'Seenaa {commodity} fe\'amaa jira',
  'markets.noSeriesTitle': 'Sarari hin agarsiifamu',
  'markets.noSeriesBody':
    'Qorannoon tokkoon iyyuu safartuu, gosa gatii fi yeroo kana keessatti {commodity}f gatii hin galfanne, kanaaf sararri hin saakamne; gatiin ofumaan hin uumamne.',
  'markets.unitsNote':
    'Gatiin akkuma to\'ataan galmeeffateetti huujii fi safartuudhaan — gurgurtaan hawaasummaa fi gurgurtaan guddaa wastaniin tokkotti hin madaalamu; meeshaa tokkotti safartuuleen lamaan sararoota adda addaa lama ta\'u.',
  'markets.crossMarketTitle': 'Naannolee fi gabaa · ji\'a qorannoo tokko',
  'markets.crossMarketHint':
    'Meeshaa tokko, safartuu tokko, gosa gatii tokko, ji\'a tokko — madaallii qorannooleen kun deeggaran tokko qofa. Hallagaafi dhibbeentaan gadhee irraa ol ta\'e herregaa keenya giddugala gabaa galmeeffameen hojjetamedha.',
  'markets.region': 'Godina',
  'markets.allRegions': 'Godinaalee hunda',
  'markets.loadingLatest': 'Ji\'a to\'annoo haaraa fe\'amaa jira',
  'markets.thMarket': 'Gaba',
  'markets.thLatest': 'Haaraa',
  'markets.thChange': 'Jijjiirama',
  'markets.vs': 'vs',
  'markets.fxTitle': 'Saffina jijjiirrama salfa alaa (forex) Itoophiyaa — gosa sadi',
  'markets.fxHint':
    'Gatiin sirna mootummaa galmee guyyaa NBE dha; gatiin gabaa qe\'ee (parallel) giddugaleessa ji\'aa biyyoolessaa Bankii Addunyaa dha; gatiin madaallii (benchmark) gatii baraati. Gatiin sunniin gosa addaati — kanaaf adda baafamanii agarsiifamu.',
  'markets.loadingFx': 'NBE fi Bankii Addunyaa fe\'amaa jira',
  'markets.officialLabel': 'Sirna mootummaa · mallattoo guyyaa NBE',
  'markets.parallelLabel': 'Gabaa qe\'ee · giddugaleessa ji\'aa biyyoolessaa Bankii Addunyaa',
  'markets.benchmarkLabel': 'Madaallii · gatii baraati Bankii Addunyaa',
  'markets.etbPerUsd': 'ETB US$ tokkoof',
  'markets.officialNote':
    'Sarara dhaabaa (bar) tokko guyyaa dhiyaatame tokkoof. Kun gatii referensii Bankii Itoophiyaa (central bank) qindeeffame malee gatii sukkaanni jijjiirrama salfa (bureau) isiniif gabaasu miti.',
  'markets.parallelNote':
    'Giddugaleessa qorannoo ji\'aa malee gatii guyyaa miti: tuqaan haaraan ji\'a Bankiin Addunyaa walitti qabate haaraati — yeroon kanatti guyyaa har\'aa irraa ji\'ootan fagaachuu danda\'a.',
  'markets.publishedFrequency': '{frequency}tti dhiyaate',
  'markets.referencePeriod': 'yeroo referensii {period}',
  'markets.annualTitle': 'Sarara baraafi dhiya\'insi isaa yeroon duubaatti hafe',
  'markets.annualBody': 'Ibsa qofa — kunis gatii ji\'a ammaa miti.',
  'markets.noRowsTitle': 'Tarfaan deebise hin jiru',
  'markets.noRowsBody': '{label}: deebiin kun tarfawwan waan hin qabne, bakka bu\'ame tokko hin laanne.',

  // --- Markets module · shared registries ---
  'markets.sectionPicker': 'Mul’ata kutaa',
  'markets.publishers': 'Qorannoo gabaa Itoophiyaa',
  'markets.unavailableTitle': 'Torchoftuu gabaa tokkoon deebise hin qabu',
  'markets.unavailableBody':
    'Lakkoofsii jalqaba irratti argamu hundi isaa yeroo iyyituu qorannoo irraa dubbatama, kanaafuu torchoftuun yeroo hin deebifne wanti mul’atu hin jiru. Homaa hin qabbaneefne; gabaan jalatti tarre torchoftuu hundaa fi wanti iyyituu isaa deebise bakka buusa.',
  'markets.contributing': 'Deebii kana keessatti',
  'markets.coverageClean': 'Tarrajawwan {rows} wal siman, tokko tokko isaanii gatii baafame qabu.',
  'markets.coverageWithGaps':
    'Tarrajawwan {rows} wal siman, keessaa {gaps} gatii baafame hin qaban — sandukuwwan duwwaa bakka qorannoo argamu miti gatii dhala.',
  'markets.ofCount': 'keessaa {total}',
  'markets.noSpan': 'Guyyaa qorannoo tokko qofa.',
  'markets.months': 'jiwwan',
  'markets.weeks': 'torbanwwan',
  'markets.lastWindow': '{count} {unit} dhumaa',
  'markets.col.markets': 'Gabaa',
  'markets.col.months': 'Jiwwan',
  'markets.col.periods': 'Yeroon',
  'markets.col.rows': 'Tarraja',
  'common.unit': 'Salphina',
  'dataType.market-survey': 'qorannoo gabaa',
  'dataType.reference-price': 'gatii fuulduraa',
  'dataType.projection': 'duraa ba’uu',
  'dataType.administrative': 'geessa bulchiinsa',
  'freshness.current': 'Ammaa',
  'freshness.recent': 'Dhihoo',
  'freshness.stale': 'Karoorraa fagoo',
  'freshness.historical': 'Galmee seenaa',
  'freshness.unknown': 'Guyyaa fayyadu hin qabu',
  'statusLabel.historical': 'Galmee seenaa',
  'markets.state.access_challenged': 'Gargaarsi si’aqu',
  'markets.granularity.weekly': 'Torbanan',
  'markets.granularity.monthly': 'Ji’an',
  'markets.flag.actual': 'Argame',
  'markets.flag.aggregate': 'Walitti qabame',
  'markets.flag.replaced': 'Lakkoofsa jijjiirame',
  'markets.flag.unknown': 'Mallattoo hin qabu',

  // --- Markets module · tabs ---
  'markets.tab.overview': 'Ibsa gabaabaa',
  'markets.tab.prices': 'Qorattoo gatii',
  'markets.tab.history': 'Seenaa gatii',
  'markets.tab.regions': 'Naannolee fi gabaa',
  'markets.tab.insights': 'Ragaan waan agarsiisu',
  'markets.tab.exchange': 'Sanyii alaa',
  'markets.tab.sources': 'Maddiwwan',

  // --- Markets module · overview ---
  'markets.ov.observations': 'Gatii baafaman',
  'markets.ov.observationsNote': 'Tarrajawwan qorataman {rows} gatii hin qaban; akkan bakka duwwaatti tarraa’aman.',
  'markets.ov.commodities': 'Meeshaalee hammachaman',
  'markets.ov.commoditiesNote': 'Salphina torchoftuu {units} gidduutti, namuu waliin hin makaman.',
  'markets.ov.markets': 'Gabaa qorataman',
  'markets.ov.marketsNote': 'Naannolee {regions} keessatti; {mapped} salphina torchoftuu qabu.',
  'markets.ov.periods': 'Yeroo qorannoo',
  'markets.ov.periodsNote': 'Guyyowwan argii adda addaa — ji’oota {months} keessa faca’an.',
  'markets.ov.coverageTitle': 'Qorannoon kunniin dhuguma waan hammatan',
  'markets.ov.coverageHint':
    'Lakkoofsa tarrajawa baafaman qofa — giddugala miti, madaallii miti, meeshaa qorannoon galmeesse hin qabne miti.',
  'markets.ov.newest': 'Argii haaraa',
  'markets.ov.newestNote': 'Karoorra torchoftuu isaa irratti {tier} jedhamuuran ramaddame.',
  'markets.ov.oldest': 'Argii duraa',
  'markets.ov.span': 'Jiwwan qorannoo {from} irraa hanga {to}tti deemu.',
  'markets.ov.publishers': 'Torchoftuulee deebisan',
  'markets.ov.publishersNote': 'Tokkoon tokkoon isaanii ofii isaatiin ni fe’ama, kanaafuu kufaatii tokkutuu duqa kana hin balleessu.',
  'markets.ov.currencies': 'Sanyii akkan baafame',
  'markets.ov.units': 'Salphina akkan baafame',
  'markets.ov.unitsNote': 'Gatii KG 100 fi gatii KG tokkootii tarraja lama, miti giddugala tokko.',
  'markets.ov.priceTypes': 'Gosa gatii',
  'markets.ov.granularities': 'Bal’ina saaxuu torchoftuun deeggaran: {list}.',
  'markets.ov.catalogTitle': 'Meeshaalee gatii baafame qaban',
  'markets.ov.catalogHint':
    'Gabaa meeqatu gatii kenneedhaan duraa taa’an. Tarree kun tarrajawa qorannoo irraa dubbatama, kanaafuu meeshaa torchoftuun hin qoranne bahuu malee duwwaa hin ta’u.',
  'markets.ov.catalogTruncated': 'Tarraja meeshaa fi salphina {total} keessaa gad fagoo {shown} mul’atu; qorattoon hundaa tarreeffata.',
  'markets.ov.qualityTitle': 'Qulqullina ragaa kutaan argu danda’u',
  'markets.ov.qualityHint': 'Kun hundi lakkoofsa tarrajawa baafaman — raga hammachaa, miti sirreeffama.',
  'markets.ov.gaps': 'Tarrajawwan gatii hin qabne',
  'markets.ov.gapsNote': 'Akka sandukuwwan duwwaatti mul’atu. Dhalin hiika biraati.',
  'markets.ov.duplicates': 'Tarrajawwan irratti ba’aman haqaman',
  'markets.ov.duplicatesNote':
    'Torchoftuu, gabaa, meeshaa, salphina, gosa gatii fi guyyaa walfakkaatu; tarraja gatii qabatu turre.',
  'markets.ov.unmapped': 'Gabaa salphina hin qabne',
  'markets.ov.unmappedNote': 'Gabaa {mapped} kaartaan irratti qabamu. Kan hafe tarraja keessa hafee hiikaan hin qabamu.',
  'markets.ov.seasonal': 'Tarraja yerosiif gad fagoo',
  'markets.ov.seasonalNote': 'Salphina fi gosa gatii tokkuuttan ji’a qorannoo kudha lamaa ol.',
  'markets.ov.limitTitle': 'Wanta kutiin kun hin dubbanne',
  'markets.ov.limitBody':
    'Kun gatii gabaa fi gurgurtaa naannoo gaaba bakka himame qoratame — madaalli gatii biyyoolessaa miti, gatii darachaa miti, duraa ba’uu miti. Oomisha, galii yookiin qusannaa hin ibsine; ji’a qorannoo gatii hin qabne bakka duwwaa hafa.',

  // --- Markets module · coverage scope ---
  'markets.scope.title': 'Kuusaan deetaa kanaa waan hammattu',
  'markets.scope.body': 'Lakkoofsota kana akka daangaa qorannoo ta\'e ilaali, akka haala gabaa Itoophiyaa miti.',
  'markets.scope.markets': 'Gabaa {markets} naannoo {regions} keessatti, guyyaa qorannoo {dates}.',
  'markets.scope.publishers': 'Gatii marfama kanaa hundi wanta {publishers} ifa baase qorannoodha.',
  'markets.scope.age': 'Mul\'ataan haaraan {date} dha, umurii isaa {age}.',
  'markets.scope.priceTypes':
    'Gatiin akka {types} {currencies} keessatti ifa ba\'e. Halli gatii fi sarfii biraa maddi galmeesse malee hin mul\'atu.',
  'markets.scope.notNationwide':
    'Kun hammachaa biyya guutuu miti; gabaa fi naannoo qorannoon hin geenye galmee hunda keessatti dhabamu, zeroon hin agarsiifamu.',
  'markets.scope.refused':
    'Deebii hin kennu: {publishers} fayilii gatiif HTTP {status} deebise. Maddichi cachaa isaa keessa jira, tilmaanni bakka safaru isaa bu\'ame miti.',
  'markets.scope.refusedChallenge':
    'Deebii hin kennu: eegumsa bootii {publishers} sassaabbuu ofumaan dhorka. Maddichi cachaa isaa keessa jira, tilmaanni bakka safaru isaa bu\'ame miti.',
  'markets.ov.ageLabel': 'Umurii mul\'ataa haaraa',
  'markets.ov.ageNote': 'Barruuqa\'aa isaa {cadence} erga; kunsaan kun {tier} godhamu ramaddame.',
  'markets.age.today': 'guyyaa sanuma',
  'markets.age.oneDay': 'guyyaa tokko haa ta\'u',
  'markets.age.days': 'guyyaa {n}',
  'markets.age.weeks': 'torban {n} haa ta\'u',
  'markets.age.months': 'ji\'a {n} haa ta\'u',
  'markets.src.coverageCounts': 'guyyaa qorannoo {dates} · gabaa {markets} · {commodities} sirna meeshaa+yuunitii',
  'markets.src.noRowsRetrieved': 'Safaru hin argamne, kanaaf hammachni hin beekamne',

  // --- Markets module · explorer ---
  'markets.ex.title': 'Qorattoo gatii',
  'markets.ex.hint':
    'Fuqa tarrajawa baafaman tokko yeroo tokkotti. Filattoon wanta qorannoo keessa jiru qofa ni maqaa bala, tarraja gatii hin qabne sanduku duwwaa hafa.',
  'markets.ex.search': 'Gabaa yookiin meeshaa barbaadi',
  'markets.ex.searchPlaceholder': 'fakkeenyaaf Mekeelaa yookiin Taaf',
  'markets.ex.allCommodities': 'Meeshaalee baafaman hunda',
  'markets.ex.allMarkets': 'Gabaa hunda',
  'markets.ex.allSources': 'Torchoftuulee hunda',
  'markets.ex.anyUnit': 'Salphina kamiyyuu',
  'markets.ex.anyPriceType': 'Gosa gatii kamiyyuu',
  'markets.ex.priceType': 'Gosa gatii',
  'markets.ex.surveyRange': 'Yeroo qorannoo',
  'markets.ex.surveyRangeHint': 'Guyyowwan argii torchoftuu ofii irratti filatame.',
  'markets.ex.fromDate': 'Argii irraa',
  'markets.ex.toDate': 'Argii hanga',
  'markets.ex.pricedOnly': 'Tarrajawwan gatii qaban qofa',
  'markets.ex.clear': 'Filatton {count} qulqulleessi',
  'markets.ex.clearAll': 'Filatton hunda qulqulleessi',
  'markets.ex.loading': 'Tarrajawwan gatii baafaman fe’ama jira',
  'markets.ex.sourceLabel': 'Qorannoo gabaa Itoophiyaa',
  'markets.ex.emptyTitle': 'Tarraja baafame filatton kana hin wal simu',
  'markets.ex.emptyHint':
    'Filattoon barreeffama torchoftuu ofiitti sirriitti wal sima, kanaafuu qindameen qorannaan hin galfanne homaa hin deebisu. Horaan guutuuf homaa hin uumamne.',
  'markets.ex.tableCaption': 'Argii gatii gabaa Itoophiyaa baafame',
  'markets.ex.sortAria': '{label}n tartiyyessi',
  'markets.ex.price': 'Gatii',
  'markets.ex.quality': 'Gosa fi qulqullina',
  'markets.ex.freshness': 'Haaromina',
  'markets.ex.noFigure': 'Sanduku qorannoo kun gatii baafame hin qabu',
  'markets.ex.perUnit': '{unit}n',
  'markets.ex.prev': 'Duraa',
  'markets.ex.next': 'Itti aanu',
  'markets.ex.pageOf': 'Fuqa {page} keessaa {pages}',
  'markets.ex.perPage': 'Tarraja fuqa tokkotti',
  'markets.ex.matched': 'Tarrajawwan {total} filatton kana waliin simatan',
  'markets.ex.window': 'Bayaara kana keessatti haaraan {newest}; duraa {oldest}.',
  'markets.ex.staleTitle': 'Tarrajawwan tokko tokko karoorra torchoftuu isaaniirraa fagoo',
  'markets.ex.staleBody':
    'Haarominni torchoftuu tokkoon tokkoon isaanii karoota isaan ibsan irratti madaalama, kanaafuu qorannoo torbananii fi ji’an waltigaan hin madaallamu.',
  'markets.ex.export': 'CSV ergi',
  'markets.ex.exportHint':
    'Fuqa {page} keessaa {pages} tarrajawa {rows} salphina, sanyii, guyyaa qorannoo, yeroo argame fi geessi madda torchoftuu waliin erga. Utubawwan duraa ni hadhaman, kanaafuu taableeen maqaa akkan formulaatti hin raawwatu.',

  // --- Markets module · history ---
  'markets.hist.granularity': 'Bal’ina saaphinaa',
  'markets.hist.windowLabel': 'Yeroon mul’atu',
  'markets.hist.unitHint': 'Salphina torchoftuu; jijjiiruun tarraja jijjiira.',
  'markets.hist.average': 'Giddugala yeroo',
  'markets.hist.lowest': 'Gatii gadafamsaa',
  'markets.hist.highest': 'Gatii ol’aanaa',
  'markets.hist.derivedNote': 'Tarrajawa baafaman irraa asitti herregame.',
  'markets.hist.latestNote': '{when} qoratame — gabaa {markets} gidduutti.',
  'markets.hist.lowestNote': '{when} galmaa’ame.',
  'markets.hist.highestNote': '{when} galmaa’ame.',
  'markets.hist.change': 'Yeroowwan qorannoo gidduutti {direction} {pct}%',
  'markets.hist.up': 'Ol ka’e',
  'markets.hist.down': 'Gadi bu’e',
  'markets.hist.seriesNote':
    '{commodity} · {unit} · {retail}: yeroowwan {periods} gatii qaban, gabaa {markets} kan kennan gidduutti.',
  'markets.hist.fallbackTitle': 'Ji’an saaxame',
  'markets.hist.fallbackBody':
    'Torchoftuun {commodity} kennu torbanan hin qorannu, kanaafuu tarree kun ji’a qorannoon adda baafame. Tarree torbanan saaxuu namni hin ilaalle guyyaawwan saaxisa.',
  'markets.hist.gapTitle': 'Yeroowwan gatii baafame hin qabne',
  'markets.hist.gapBody':
    'Yeroowwan {count} daangaa kana keessatti gatii hin uumne. Tarrinni bakka tokko tokkuutti ni kutama; homaa hin guutamne.',
  'markets.hist.onePoint':
    'Daangaa kana keessatti yeroon {count} qofatu gatii qaba, kanaafuu tarree agimsaa hin saaxamu — tuqaan tokko agimsaa miti.',
  'markets.hist.byMarketTitle': 'Madaallii walfakkaatu — gaaba gaabaan',
  'markets.hist.byMarketHint':
    'Tarraja tokkoon tokkoon isaa gaaba meeshaa, salphina fi gosa gatii tokkuutt jiru. Jijjiiramni dhibbeentaan herrega keessan yeroowwan lamatti dhumaa gatii qaban irratti.',
  'markets.hist.publishersInSeries': 'Tarrajawwan tarree kana jalaa argaman: {list}.',
  'markets.hist.recheck': 'Tarree kana torchoftuu irraa irra deebi’an nubisi',

  // --- Markets module · regions ---
  'markets.reg.monthHint': 'Ji’oonni meeshaa kanaaf gatii baafame qaban qofa ni dhiyaatu.',
  'markets.reg.marketsShown': 'Gabaa {count} gabaasan',
  'markets.reg.cheapest': 'Gaaba gatii gadafamsaa',
  'markets.reg.dearest': 'Gaaba gatii ol’aanaa',
  'markets.reg.atMarket': '{market} irratti.',
  'markets.reg.spread': 'Ol’aanaa gadafamsaa irraa',
  'markets.reg.spreadNote': 'Ji’a kana gabaa lama giddugala isaani gidduutti asitti herregame — salphina fi gosa gatii tokkotti.',
  'markets.reg.singleMarket':
    'Ji’a kana meeshaa, salphina fi gosa gatii kanaaf gaaba tokko qofatu baafate, kanaafuu adda baasni hin jiru.',
  'markets.reg.noneTitle': 'Ji’a kana gatii baafame hin jiru',
  'markets.reg.noneBody':
    '{month} qorannoowhan {commodity} {unit}n gosa gatii filatameen gatii hin deebifne. Ji’a biraa filadhu, walfakkaatto duwwaa akka gatii gadafamsaatti hin dubbisu.',
  'markets.reg.mapTitle': 'Torchoftuun gabaa kana eessatti qaba',
  'markets.reg.mapHint':
    'Tuqaan tokkoon tokkoon isaa salphina torchoftuun gabaa kanaaf baafate irratti, geessota bulchiinsa geoBoundaries irra taa’a. Gaabni salphina hin qabne kaartaa irraa hafee tarraja keessa hafa.',
  'markets.reg.mapAria': 'Kaartaa gabaa Itoophiyaa {count} qorataman salphina isaanii baafameen irratti qabaman',
  'markets.reg.ramp': 'gadaif {low} hanga jabisu {high} {currency} {unit}n',
  'markets.reg.plotted': 'Gabaa {plotted} keessaa {total} kaartaan irratti qabaman',
  'markets.reg.unplottedNote': 'Kan hafe salphina torchoftuu hin qabu.',
  'markets.reg.loadingOutlines': 'Geessota bulchiinsa fe’ama jira…',
  'markets.reg.outlineNote':
    'Geessonni bulchiinsa hin fe’amne, kanaafuu tuqaawwan gabaa alamsaatiin mul’atu. Geessi yaadansaatiin hin saaxamu.',
  'markets.reg.byRegionTitle': 'Giddugala naannoo ji’a kanaa',
  'markets.reg.byRegionHint': 'Giddugala gabaa naannoo tokkuutt qoratame — maqaa naannoo torchoftuu ofiitti.',
  'markets.reg.regionMarkets': 'Gabaa {count} qoratame · {unit}n',
  'markets.reg.tableTitle': 'Gaaba gaabaan',
  'markets.reg.tableCaption': 'Meeshaa, salphina fi gosa gatii tokko ji’a qorannoo tokkuutt gabaa gidduutti walfifame',
  'markets.reg.tableNote': '{month} keessatti gabaa {markets} tarree kanaaf gatii baafaman.',
  'markets.reg.price': 'Gatii',
  'markets.reg.aboveCheapest': 'Gadafamsaa irraa ol',
  'markets.reg.hasCoords': 'Salphina torchoftuu',
  'markets.reg.noCoords': 'Salphinni hin baafamne',
  'markets.reg.publisherNote': 'Kan kenname: {list}.',

  // --- Markets module · insights ---
  'markets.ins.title': 'Wanta argiwwan deeggaran',
  'markets.ins.hint':
    'Ragaan tokkoon tokkoon isaa tarree, gabaa, lakkoofsa tarraja fi yeroo jalatti mul’isuudhaan hiika ofii waggalu. Walitti dhufuun namuu ragaadhaan miti jennamu, gatiin duraa hin baafamu.',
  'markets.ins.noneTitle': 'Ragaan tokkollee uf raga baha ga’uu miti',
  'markets.ins.noneBody':
    'Sochiin yeroowwan qorannoo itti aanan lama gatii dhuga qabu gaafata; adda baasni garuu gabaa meeshaa, salphina fi gosa gatii walfakkaatu ji’a tokkuutt kennan lamaa ol gaafata. Haalli kun yeroo hin guufne ibsi hin kennamu.',
  'markets.ins.kind.price-rise': 'Ol ka’uu gatii',
  'markets.ins.kind.price-fall': 'Bu’uu gatii',
  'markets.ins.kind.market-spread': 'Adda baasni gabaa gidduu',
  'markets.ins.kind.seasonal-coverage': 'Gad fagoo hammachaa',
  'markets.ins.kind.market-outdated': 'Gabaa yeroo dhihootti hin qorramne',
  'markets.ins.kind.thin-coverage': 'Meeshaa gabaa tokkotti',
  'markets.ins.price-rise':
    '{market} irratti, {commodity} {unit}n ({retail}) {to} keessatti {from} caalu {pct}% ol ka’ee, {price} ta’e.',
  'markets.ins.price-fall':
    '{market} irratti, {commodity} {unit}n ({retail}) {to} keessatti {from} caalu {pct}% gadi bu’ee, {price} ta’e.',
  'markets.ins.market-spread':
    '{month} keessatti, {commodity} {unit}n ({retail}) {dearest}tti {cheapest} caalu {pct}% jabisu — gabaa {markets} gidduutti.',
  'markets.ins.seasonal-coverage':
    'Tarraja meeshaa fi salphina {series} ji’oota qorannoo kudha lamaa ol qabu; gad fagoo {commodity} {unit}n — ji’oota {months} gabaa {markets} gidduutti.',
  'markets.ins.market-outdated':
    'Gabaa {months} {lastMonth} caalu tarraja qorannoo hin qaban; ji’a qorannoo haaraan garuu {latestMonth} — keessaa {markets}.',
  'markets.ins.thin-coverage':
    '{commodity} {unit}n ({retail}) gaaba tokkotti qofa ({market}) qoratame, kanaafuu ibsi naannoo isaa irratti kennamu hin danda’amu.',
  'markets.insightLimit.change':
    'Qorannoo gabaa tokkoo ofiisaa — yeroon yerootti. Kun madaalli biyyoolessaa miti, gatiin maaliif akka socho’e hin ibsu.',
  'markets.insightLimit.spread':
    'Adda baasni qorannoo gabaa lama gidduutti ji’a tokkuutt. Dhaqqebni, kennaa naannoo fi yeroo qorannoo walumaan adda, kanaafuu adda baasni wanta tokkotti hin qoodamu.',
  'markets.insightLimit.seasonal':
    'Gad fagoo hammachaa qofa: ji’oonni meeqatu baafame jedha, miti adeemsi yerosaa jira jedhu.',
  'markets.insightLimit.coverage': 'Ibsa qorannoo ofiirratti, miti gabaa irratti.',
  'markets.ins.seasonalTitle': 'Tarraja lochora hammachaa yookiin isaa ol qaban',
  'markets.ins.seasonalHint':
    'Ji’oota gatii qaban — meeshaan, salphinan fi gosa gatiiin. Gaaffii yerosaa eessatti kaafamuu akka danda’u mul’isuuf tarreeffame.',
  'markets.ins.wetVsDry': 'Ji’oonni rooba kan hafe waliin',
  'markets.ins.seasonalLimitation':
    'Lakkoofsa kun ji’oota June hanga September kan hafe waliin waggoota baafaman hunda gidduutti walfakkeessa. Tarraja lochora tokkotti waggaa san ni ibsa, miti adeemsa; duraa ba’uu garuu namu miti.',
  'markets.ins.evidenceSeries': 'Tarree',
  'markets.ins.evidenceRows': 'Tarrajawwan',
  'markets.ins.limitLabel': 'Hiika',

  // --- Markets module · source report ---
  'markets.src.title': 'Haala torchoftuu torchoftuun',
  'markets.src.hint':
    'Wanta iyyitoota babal’ina kanaa ofiisaa deebisan — torchoftuun tokkoon: haala, argii haaraa, yeroo argame, hammachaa fi kataba madda torchoftuu ofiisaa.',
  'markets.src.none': 'Gabaan torchoftuu deebii kana waliin hin baafamne.',
  'markets.src.answering': '{count} deebisan',
  'markets.src.refusing': '{refused} didan · {silent} calmisan',
  'markets.src.chip': 'eegumsa bot',
  'markets.src.publisherSite': 'Fuqa torchoftuu',
  'markets.src.challengeTitle': 'Argama, buufata ofumaatiin ni dhorka',
  'markets.src.challengeBody':
    'Eegumsni bot torchoftuu dhafilee hinfudhan iyyituu keenya deebi’u. Gaaffii kana deebisuu yookiin biraawuzii of fakkeenya miti, kanaafuu tarraja hin arganne, homaa hin qabbaneefne. Katabni jalatti jiru ibsa torchoftuu ofiisaa — daataan jira, yeroo dhumaafis kan jijjiirame.',
  'markets.src.outageTitle': 'Torchoftuu kanaa deebii hin jiru',
  'markets.src.outageBody':
    'Iyyituu tarraja fayyadu hin deebifne, kanaafuu torchoftuu kun lakkoofsota ol jiru keessaa gahee hin qabu. Copiin kuufame bakka nubisa ammaaatti namuu hin ta’u.',
  'markets.src.rows': 'Tarrajawwan qabaman',
  'markets.src.publishedCount': 'torchoftuun lakkaa’u',
  'markets.src.truncated': 'baafame caalu gadaf',
  'markets.src.excluded': 'Tarrajawwan dhaamsaman',
  'markets.src.excludedNote': 'Gatii miti — tarrajawwwan mindaa, yookiin sandukuwwan akkan lakkoofsatti hin dubbatamne.',
  'markets.src.coverage': 'Hammachaa',
  'markets.src.oldestObservation': 'Argii duraa',
  'markets.src.ageDays': 'Umurii guyyaa {days}',
  'markets.src.retrieved': 'Kan argame',
  'markets.src.retrievalAge': 'Kuusaa keenya keessatti guyyaa {days}',
  'markets.src.dataType': 'Gosa lakkoofsaa',
  'markets.src.catalogue': 'Kataba madda torchoftuu ofiisaa',
  'markets.src.catalogueReachable': 'Argama — daataan yeroo dhumaaf {modified} jijjiirame.',
  'markets.src.catalogueUnreachable': 'Geessi kataba maddis deebii hin kennine.',
  'markets.src.notStated': 'guyyaan hin ibsamne',
  'markets.src.rowPaging': 'tarrajawwan JSONn fuqa qoodaman',
  'markets.src.fileOnly': 'dhafilee guutuu buufachuu',
  'markets.src.httpTitle': 'Iyyituun milkaa’e akkan daataan ammaa jiru hin ibsu',
  'markets.src.httpBody':
    'Haalli argame HTTP irraa miti, guyyaa argii haaraa karoora torchoftuu ibsameen madaalluun argama. Torchoftuun milli-sekondaatti deebisuu danda’a garuu karoorra ofiirraa torbanootaan fagoo taa’uu danda’a; kun akkan cufamaa malee akka banamaatti hin galmeeffamu.',

  // --- Soil module ---
  'soil.pageDescription':
    'Gorsa eegumsa lafaafi ittisa sochora lafaa qonnaan bultuu Itoophiyaa fi — rooba to\'atameen yeroon hojii kunuu itti himamu waliin cfame.',
  'soil.badgeRainfallObserved': 'Rooba to\'atame',
  'soil.measuredTitle': 'To\'annoo fi moodela — kun isiniif himuu danda\'u fi hin danda\'une',
  'soil.measuredBody':
    'IRSHAYE lafa keessaniif [[qorannoo lafaa]] hin qabu. Lakkaa\'amsa rooba armaan gadii to\'annoo NASA POWER guyyaa isaatiin cfamedha; gorsaaleen immoo kunuunsa qajeelfamaa cfama qabudha. Wantii kun hundi hozii (fertility) yookiin acidummaa (acidity) lafaa hin ibsu — kunis fuudhaa lafaa naannoo fi laabiraatorii gaafata.',
  'soil.measuredBodySecond':
    'Mallattoowwan biqiltuu (vegetation indices) satilaayitiiti uumama biqiltuu ibsu, gahumsa lafaati miti — daataa lafaattiin hin dhiyaatan.',
  'soil.rainfallDriversTitle': 'Haala roobaa {place} — guyyaa 90 darbe',
  'soil.rainfallDriversHint':
    'Rooba to\'atame guyyaa guyyaan (NASA POWER). Guyyaawni rooba cimaa mallattoo hojii ittisa sochora lafaatiiti.',
  'soil.loadingRainfall': 'Baay\'ina rooba to\'atame fe\'amaa jira',
  'soil.heavyRainDays': 'Guyyaawwan rooba cimaa (≥12 mm)',
  'soil.ofDaysWithData': 'guyyaawwan daataa qamani keessaa',
  'soil.heavyRainNote': 'Madaalliin balaa bishaan bahaa (runoff) mallattoo godha; to\'annoo lafaati miti.',
  'soil.totalRainfall': 'Kuusaa roobaa daangaa sanatti',
  'soil.totalRainfallNote': 'Guyyaawwan dhiheessi {count} deebise kuusaa isaatiiti.',
  'soil.recordCoverage': 'Gahumsa galmee',
  'soil.recordCoverageNote': 'Guyyaawwan gatii dhiyaate qamani yeroo gaafatame keessaa.',
  'soil.guidanceTitle': 'Gorsa eegumsa lafaa',
  'soil.guidanceEmpty':
    'Kutaan kunuunsa adeemsa maddaalee qabuu kunuunfamaa jira. Galmiin tokkoon tokkoon isaa madda citiin (citable) isatti cfamuu qabu — yoon hin ta\'ne hin agarsiifamu; IRSHAYE gorsaan madda qofaatiin alatti tilmaama hin gootu. Haala rooba armaan olii garuu ammas ni hojjeta.',
  'soil.practicesLabel': 'Adeemsa eegumsaa kunuunfa\'ame',
  'soil.whenToAct': 'Yoom hojiirra oolchi?',

  // --- Settings module ---
  'settings.pageDescription':
    'Qindaa\'insi fuula kanaatti jiru hundeen waan dhugaatiif hojjeta. Herregaafi bakki hojii qoodamaa (shared workspace) pirojektii Supabase Irshaye ofiitiin yoo qophaa\'e dhufa — sana duratti filannoon keessan meeshaa (device) kana irratti qofa kuufama.',
  'settings.savedContext': 'Haala keessanii simame',
  'settings.savedContextHint':
    'Browserii kana keessatti kuufame. Sirna hojii "Cuunfaa" fi bakka duraa kutaa hundaa to\'ata.',
  'settings.crop': 'Midhaan',
  'settings.noCuratedProfile': 'Galmee kunuunsa ammaaf hin jiru',
  'settings.storage': 'Kuusaa',
  'settings.storageDeviceOnly': 'Meeshaa kana qofa — herrega haaraan hin banaamu',
  'settings.appearanceHint':
    'Bifa dukkanaa\'atti halluun gatii adda addaa (value-kind) walfakkaatuun itti fufa — duraa ramadaan violet, to\'annaan magariisa akka lamaanittis.',
  'settings.switchToLight': 'Gara bifa ifaatti jijjiiri',
  'settings.switchToDark': 'Gara bifa dukkanaatti jijjiiri',
  'settings.colourSemantics': '— hiikni halluu sadarkaa lamaanitti walfakkaata.',
  'settings.integrationStatus': 'Haala walqunnamsiisuu (integration)',
  'settings.integrationHint': 'Sirni hojiirra oolchame (deployment) kun ammaa waan sirriitti cfamu. Wanti kun agarsiisa qofa miti.',
  'settings.openDataName': 'Dhiheessitoota daataa banaa (sukannaa, kliimaa, gatii, satilaayitii)',
  'settings.openDataDetail': 'API\'oota banaa ifa (key) hin barbaachisne /api/data/status darbeetiin qulqulleeffataman.',
  'settings.advisorName': 'Gorsaa Qonnaa AI (Gemini)',
  'settings.advisorDetail':
    'GEMINI_API_KEY haala kanaatti barbaachisa. Ifa yoo hin jirre gorsaadhaan "haala jiruuf miti" jedhe ifatti beeksisa.',
  'settings.referenceName': 'Kuusaa gorsaa midhaanii fi lafaa',
  'settings.referenceDetail':
    'Galmee kunuunsa cfama qabu aplikeshinii waliin dhufe; dhiheessa callii miti.',
  'settings.accountsName': 'Herregaafi galmee simame (Supabase)',
  'settings.accountsDetail':
    'Irshaye herregaan yoo bana\'amuuf pirojektii Supabase mataa isaatiif barbaada — credential application biraa waliin qoodamu hin jiru.',

  // --- AI advisor module ---
  'advisor.pageDescription':
    'Gorsaadhaan kun ragaaleen pilaatformii kunuunsefi maddaatti cfame irratti qofa mari\'achuu danda\'a. Galmee isaa kaasa, shakkaafi daangaa hubachisa, ragaaleen gahaa hin ta\'in immoo callisa. Bu\'aa waadaa hin laatu, haala (soil) keessaniifis hin ibsu.',
  'advisor.badgeEvidenceOnly': 'Ragaa pilaatformii irratti qofa mari\'achuu',
  'advisor.askTitle': 'Waa\'ee yeroo keessanii gaafadhu',
  'advisor.askHint':
    'Gaaffiin keessan {place}fi midhaan filatameef, ragaa deebii jala tarfa\'ame qofa fayyadamuun deebifama.',
  'advisor.questionLabel': 'Gaaffii keessanii',
  'advisor.charCount': '{count}/900 xurawwilee',
  'advisor.questionPlaceholder':
    'Fakkeenya: Rooba guyyaa muraasa dhufu eegna — facuu harkisiinee, sana dura maaltu qophaa\'a?',
  'advisor.example1': 'Yeroon kun lafa qabachuuf fi facuuf ga\'aa?',
  'advisor.example2': 'Torban kanaatti balaa sukannaa maaltu jiraatu?',
  'advisor.example3': 'Haala rooba ilaaluun meeshaalee akkamitti yeroon qindeessu?',
  'advisor.assembling': 'Ragaaleen walitti qindaa\'aa jiru…',
  'advisor.submit': 'Deebii ragaa qabu argadhu',
  'advisor.unavailableTitle': 'Gorsaadhaan hin jiru',
  'advisor.networkError': 'Tajaajilli kun cfamuu hin dandeenye. Deebiin tilmaama (guess) malee hin agarsiifamu.',
  'advisor.notConfigured':
    'Sirna hojiirra oolchame kana GEMINI_API_KEY qindaa\'eef hin qabu — gorsaadhaan hojjechuu hin danda\'u. Wantii pilaatformii irratti jiru hundeen isaa malee ni hojjetu; deebiin sobaan (fabricated) uumame hin jiru.',
  'advisor.responseTitle': 'Deebii gorsaa',
  'advisor.badgeInsufficient': 'Ragaa gahaa miti',
  'advisor.badgeBacked': 'Ragaandhaan deegaramu',
  'advisor.abstains': 'Gorsaadhaan callise',
  'advisor.uncertainty': 'Shakki',
  'advisor.limitations': 'Daangaawwan',
  'advisor.evidenceTitle': 'Ragaa deebii kana duuba jiru',
  'advisor.evidenceHint':
    'Ragaa gorsaadhaan fayyadamuu danda\'e sirriitti — gatii hundee gosaafi dhiheessa isaa waliin.',
  'advisor.gapsTitle': 'Bakka duhe gorsaadhaan hubate',
  'advisor.kind.reference': 'referensii',
};
