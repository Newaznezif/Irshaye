import type { Dictionary } from '../types';

/** Amharic (አማርኛ), rendered in Ethiopic script via Noto Sans Ethiopic. */
export const am: Dictionary = {
  // --- Brand and application shell ---
  'brand.tagline': 'የአየር ንብረት ብልህ ግብር',
  'shell.openDataLive': 'ክፍት መረጃ፣ በቀጥታ',
  'shell.workingContext': 'የሥራ አውድ',
  'shell.noCropProfile': 'እስካሁን የተዘጋጀ የሰብል መግለጫ የለም',
  'shell.appearance': 'መልክ',
  'shell.language': 'ቋንቋ',
  'shell.breadcrumbPlatform': 'መድረክ',
  'shell.moduleFallback': 'IRSHAYE',

  // --- Accessibility ---
  'a11y.skip': 'ወደ ይዘቱ ዝለል',
  'a11y.openNavigation': 'አሰሳ ክፈት',
  'a11y.closeNavigation': 'አሰሳ ዘጋ',
  'a11y.navigation': 'አሰሳ',
  'a11y.chooseLanguage': 'ቋንቋ ይምረጡ',
  'a11y.currentLanguage': 'የአሁኑ ቋንቋ: {language}',
  'a11y.themeToLight': 'ወደ ብሩህ ንድፍ ቀይር',
  'a11y.themeToDark': 'ወደ ግርዶሽ ንድፍ ቀይር',

  // --- Sidebar groups ---
  'nav.group.Today': 'ዛሬ',
  'nav.group.Intelligence': 'መረጃ ትንተና',
  'nav.group.Advisory': 'አማካሪ',
  'nav.group.Platform': 'መድረክ',

  // --- Modules (single source for sidebar, tiles and page headers) ---
  'module.overview.label': 'አጠቃላይ እይታ',
  'module.overview.short': 'አጠቃላይ',
  'module.overview.description': 'አድራሻዎ፣ ሰብልዎ እና ለአሁኑ ወሳኝ የሆነው የወረፋ አውድ።',
  'module.climate.label': 'የአየር ንብረት መረጃ ትንተና',
  'module.climate.short': 'አየር ንብረት',
  'module.climate.description': 'የአሁኑ የአየር ሁኔታ፣ ትንበያዎች፣ የዝናብ ንድፎች እና የአየር ንብረት ስጋት ጠቋሚዎች።',
  'module.markets.label': 'የገበያ መረጃ ትንተና',
  'module.markets.short': 'ገበያዎች',
  'module.markets.description': 'የኢትዮጵያ የእርሻ ምርቶች ዋጋዎች — ምንጮቻቸውና የተመዘገቡበት ቀን አብረዋቸው።',
  'module.crops.label': 'የሰብል አማካሪ',
  'module.crops.short': 'ሰብሎች',
  'module.crops.description': 'የሰብሎች መግለጫዎች፣ የዘር ማስቀጠል መመሪያዎች እና ለአካባቢዎ የአየር ንብረት ተስማሚነት።',
  'module.soil.label': 'የአፈር አስተዳደር',
  'module.soil.short': 'አፈር',
  'module.soil.description': 'ለኢትዮጵያ እርሻዎች የአፈር ጥበቃ እና የመሸርሸር መከላከያ መመሪያዎች።',
  'module.advisor.label': 'የሰው ሠራሽ ብልህነት የግብርና አማካሪ',
  'module.advisor.short': 'AI አማካሪ',
  'module.advisor.description': 'ከተረጋገጠ የመድረክ መረጃ ላይ የተገነቡ በማስረጃ የተደገፉ ምክረ-ሃሳቦች።',
  'module.sources.label': 'የመረጃ ምንጮች',
  'module.sources.short': 'ምንጮች',
  'module.sources.description': 'እያንዳንዱ የመረጃ አቅራቢ፣ ፈቃዱ፣ የአዲስነት ወሰኑ እና የዋጋ ዓይነት ደረጃው።',
  'module.settings.label': 'ቅንብሮች',
  'module.settings.short': 'ቅንብሮች',
  'module.settings.description': 'የተቀመጡ አድራሻዎና ሰብልዎ፣ የመልክ ሁኔታ እና የውህደት ደረጃ።',

  // --- Shared interface words ---
  'common.retry': 'እንደገና ይሞክሩ',
  'common.refresh': 'አድስ',
  'common.loading': 'በመጫን ላይ',
  'common.close': 'ዘጋ',
  'common.apply': 'ተግብር',
  'common.cancel': 'ሰርዝ',
  'common.change': 'ቀይር',
  'common.source': 'ምንጭ',
  'common.sources': 'ምንጮች',
  'common.detail': 'ዝርዝር',
  'common.state': 'ሁኔታ',
  'common.cadence': 'የድግግሞሽ ጊዜ',
  'common.newestObservation': 'ዕጅፍ አዲሱ የተመዘገበ መረጃ',
  'common.unavailable': 'አይገኝም',
  'common.connected': 'ተያይዟል',
  'common.notConfigured': 'አልተዘጋጀም',
  'common.noData': 'መረጃ የለም',
  'common.rows': 'ረድፎች',
  'common.derivedHere': 'እዚህ የተሰላ',
  'common.live': 'በቀጥታ',
  'common.stale': 'ወጥቶ የቆየ',
  'common.fromCache': 'ከመጋዘኑ',
  'common.probeFailed': 'ፍተሻው አልተሳካም',
  'common.unknown': 'አልታወቀም',
  'common.allSources': 'ሁሉም ምንጮች',
  'common.coreSources': 'ዋና ምንጮች',
  'common.sourceStatus': 'የምንጭ ሁኔታ',
  'common.units.etbPerKg': 'በkg የETB ዋጋ',
  'common.updating': 'በማደስ ላይ',
  'common.refreshAll': 'ሁሉንም አድስ',
  'common.liveBadge': 'ቀጥታ',

  // --- Value kinds: how a figure was produced ---
  'valueKind.observed': 'የተመዘገበ',
  'valueKind.forecast': 'ትንቢት',
  'valueKind.modeled': 'በሞዴል የተሰላ',
  'valueKind.estimated': 'የተገመተ',
  'valueKind.imputed': 'የተሞላ',

  // --- Shared data vocabulary (landing registry and the Data Sources page) ---
  'cadence.realtime': 'በቀጥታ ጊዜ',
  'cadence.hourly': 'በየሰዓቱ',
  'cadence.daily': 'በየቀኑ',
  'cadence.8daily': 'የ8 ቀን ድብልቅ',
  'cadence.weekly': 'በሳምንት',
  'cadence.monthly': 'በየወሩ',
  'cadence.quarterly': 'የሦስት ወር',
  'cadence.annual': 'ዓመታዊ',
  'cadence.irregular': 'ያልተስተካከለ',
  'category.weather': 'የአየር ሁኔታና ትንበያዎች',
  'category.agroclimatology': 'የእርሻ አየር ንብረት ጥናት',
  'category.market_prices': 'የገበያ ዋጋዎች',
  'category.exchange_rates': 'የውጭ ምንዛሪ ልወጣ',
  'category.economic_benchmarks': 'የኢኮኖሚ መነሻ ደረጃዎች',
  'category.geospatial': 'ወሰኖችና ሳተላይት',

  // --- Landing header ---
  'landing.eventTag': 'AgroInnovation 2026',
  'landing.navHow': 'እንዴት እንደሚሠራ',
  'landing.navIntelligence': 'መረጃ ትንተና',
  'landing.navAdvisory': 'አማካሪ',
  'landing.navData': 'መረጃ',
  'landing.sourceStatus': 'የምንጭ ሁኔታ',
  'landing.openPlatform': 'መድረኩን ይክፈቱ',
  'landing.openModule': '{module} ይክፈቱ',
  'a11y.landingSections': 'የመነሻ ገጽ ክፍሎች',
  'a11y.landingHome': 'የIRSHAYE መነሻ ገጽ',
  'a11y.footerModules': 'የመድረክ ክፍሎች',
  'a11y.footerPublishers': 'የመረጃ አቅራቢዎች',
  'a11y.footerPage': 'በዚህ ገጽ ላይ',

  // --- Landing hero ---
  'hero.festival': 'የAgroInnovation በዓል 2026 · ኢትዮጵያ',
  'hero.title': 'የአየር ንብረት ብልህ እርሻ፣\nበ[[ማስረጃ]] ላይ የተመሠረተ ውሳኔ።',
  'hero.lede':
    'IRSHAYE ለኢትዮጵያ የአየር ንብረት ብልህ ግብር የተዘጋጀ በሰው ሠራሽ ብልህነት የሚደገፍ ዲጂታል መድረክ ነው። አካባቢዎንና ሰብልዎን ይምረጡ፤ መድረኩ በቀጥታ የአየር ንብረት መረጃን፣ ምንጡ የተገለጸበት የሰብል መመሪያ፣ የአፈር አስተዳደር ልምዶችንና እውነተኛ የገበያ ዋጋዎችን ደምድሞ ይሰበስባል — ከዚያም ማንኛውም ቁጥር ከየት እንደመጣ፣ ትርጉሙ ምን እንደሆነና ምን ያህል እንደሚታመን ያብራራል።',
  'hero.ctaPrimary': 'ከአድራሻዎና ከሰብልዎ ይጀምሩ',
  'hero.ctaSecondary': 'በዚህ ሥር ያለውን መረጃ ይመልከቱ',
  'hero.trustNoAccount': 'ለመጀመር መለያም ሆነ API ቁልፍ አያስፈልግም',
  'hero.trustOpenData': 'ክፍት መረጃ ብቻ፣ ፈቃዱም ይገለጻል',
  'hero.trustLive': 'አቅራቢዎች በቀጥታ፣ ሲጠየቁ የሚፈተሹ',
  'hero.imageAlt':
    'በኢትዮጵያ ከደጋ አካባቢዎች የፀሐይ መውጫ ሰዓት የሚታዩ፣ በድንጋይ የተሠሩ የዙሪያ ግድፎችና ባህላዊ የሳሮ ጣል መንደሮች ያሏቸው የተከላከሉ የትንሽ እርሻ ባለቤቶች ግብርና',
  'hero.placeNow': 'አዲስ አበባ፣ ለአሁኑ ሰዓት',
  'hero.humidity': 'እርጥበት',
  'hero.rainOutlook': 'ዝናብ፣ የ7 ቀን ቅድመ እይታ',
  'hero.publisherSilent': 'የአየር ሁኔታ አቅራቢው መልስ ሳይሰጥ ቀርቷል።',
  'hero.noSubstitute': 'ምንም ተኪ ልኬት አያሳይም።',

  // --- How it works ---
  'how.eyebrow': 'የሥራ ዘዴው',
  'how.title': 'ከአካባቢ ምርጫ ጀምሮ ሙሉ በሙሉ ሊከታተሉ የሚችሏቸው ምክረ-ሃሳቦች ድረስ ያሉ አምስት ደረጃዎች',
  'how.lede':
    'እዚህ ያለው ምንም ነገር የእርሻ ምልክት ጥልበት የውይይት መስኮት አይደለም። መድረኩ መጀመሪያ የተወሰነ የማስረጃ ስብስብ ይሰበስባል፣ ከዚያ በኋላ ብቻ ላይኛውን ያስላል — ይህም እያንዳንዱ መልስ ወደ አቅራቢውና ወደ መረጃው የተመዘገበበት ቀን ሊከታተል የሚችልበት ምክንያት ነው።',
  'how.step1Title': 'አካባቢዎን ይምረጡ',
  'how.step1Body':
    'ከWFP የክትትል ምዝገባ የተወሰደ የገበያ ዙሪያ — አቅራቢው ለራሱ ያስቀመጣቸው ኮርዲናቶችና የክፍለ ሀገር ስሞች አብረውታል — ወይም የራስዎን የእርሻ መሬት ኮርዲናቶች ያስገቡ።',
  'how.step2Title': 'ሰብልዎን ይምረጡ',
  'how.step2Body':
    'የ11 ተመራጭ የኢትዮጵያ ሰብል መግለጫዎች — እያንዳንዱ መስፈርት ወደ ተስፋፊ ወይም ወደ ጥናት ምንጭ ዋቢ በማቅረብ የተገኘ እንግዳ እንደ ግምት አልቀመጠም።',
  'how.step3Title': 'የአየር ንብረት አውዱን ያንብቡ',
  'how.step3Body':
    'ለተመሳሳዩ ግሪድ ሴል ቅርብ-ጊዜ ትምዘታዎች፣ የሰባት ቀን ቅድመ እይታ፣ የ45 ቀን መዝገብ እና የ30 ዓመት መደበኛ ዋጋዎች — እያንዳንዱ በዓይነቱ ተለይቶ ተይዟል።',
  'how.step4Title': 'የግብርና መረጃ ያግኙ',
  'how.step4Body':
    'የዘር ማስቀጠልና የምርት ሰገፎች፣ የተመዘገቡ ልምዶች፣ የመሸርሸር ምክንያቶችና የተጠና ዋጋዎች — ለውሳኔ በእውነት የሚያስፈልጉ ግብቶች።',
  'how.step5Title': 'አንድ በማስረጃ የተደገፈ ምክረ-ሃሳብ',
  'how.step5Body':
    'አማካሪው ሊያሰላቸው የሚችላቸው ከላይ የተገለጹት ማስረጃዎች ብቻ ናቸው። ግብቶቹን ይጠቅሳል፣ እርግጠኛ አለመሆኑን ይገልጻል፣ ማስረጃው ሲዳከም ደግሞ መልስ አይሰጥም።',

  // --- Feature sections ---
  'features.climate.title': 'በቀጥታ የአየር ሁኔታ፣ የሚመጡት ሳምንት እና የ30 ዓመቱ አውድ — በዓይነት ተለይተው ይታያሉ',
  'features.climate.lede':
    'የአየር ንብረት ክፍሉ ለአንድ ግሪድ ሴል ከአራት አቅራቢዎች ያነባል፣ ሁሉንም ወደ አንድ ግልጽ ቁጥር በጭራሽ አቀላቅላቸውም። የተመዘገበ ልኬት፣ የሞዴል ውጤት እና ትንቢት የተለያዩ ግልጸቶች ናቸው፤ IRSHAYE ደግሞ በተለያዩ መለያዎች፣ ቀለሞችና የአዲስነት ደንቦች ያሳያቸዋል።',
  'features.climate.alt':
    'በሸለቆው ላይ የብርሃን ጨረቶች ሲያርፉ በኢትዮጵያ አረንጓዴ እርሻ ላይ የሚጠራቀሙ ከባድ የዝናብ ዳምጦች',
  'features.climate.b1Title': 'የአሁኑ ሁኔታና የሰባት ቀን ቅድመ እይታ',
  'features.climate.b1Body':
    'ለእርስዎ ኮርዲናቶች የOpen-Meteo ትንበያ — በምንጩ የራሱ የሰዓት ድግግሞሽ የሚደሰስና መረጃው በተወሰደበት ሰዓት የተሰየመ — ያሳያል።',
  'features.climate.b2Title': 'ዝናብ ከወረፋ አውደ ጥርና ጎን ለጎን',
  'features.climate.b2Body':
    'የቅርብ ጊዜው የዕለት መዝገብ የክረምትና የቤል ተጠባቂ ጊዜያት አጠገብ ይታያል — ስለዚህ የዝናቡ መጀመሪያ መዘግየቱ በቃል ብቻ ከመገለጽ ይልቅ ግልጽ ይሆናል።',
  'features.climate.b3Title': 'የድርቅና የሙቀት ጠቋሚዎች',
  'features.climate.b3Body':
    'ለዚሁ ግሪድ ሴል ከNASA POWER የእርሻ አየር ንብረት ጥናት የተሰሉ — የተሰሉ ውጤቶች እንደተለኩ ከማቅረብ ይልቅ እንደ የተሰሉ ተብለው ይመደባሉ።',
  'features.climate.b4Title': 'እውነቱን የሚናገር አዲስነት',
  'features.climate.b4Body':
    'የERA5 እንደገና-ትንተና መረጃ በአካባቢ ሳምንት ዕጉይት ይደርሳል። በይነገጹ ደግሞ ዕጉይ ቁጥር እንደ አሁን ቁጥር ከማቅረብ ይልቅ ይህንኑ ይናገራል።',

  'features.crops.title': 'የ11 ኢትዮጵያ ሰብል መግለጫዎች — እያንዳንዱ ቁጥር ለተሰየመ ምንጭ የተያያዘ',
  'features.crops.lede':
    'ጤፍ፣ ምስሪ፣ በቆልዓ፣ ገብስ፣ ማሽላ፣ ቡን፣ ባቄላ፣ ጎመሃ፣ ኖግ፣ እንሰትና ገት። የሙቀት፣ የዝናብ፣ የከፍታና የአፈር pH ወሰኖች ከPROTA4U የዝርያ ምእራፎች፣ ከEcocrop፣ ከFAO እና ከተጣሩ የኢትዮጵያ ጥናቶች የተቀዱ ናቸው — ዋቢውም ለቁጥሩ የተያያዘ ነው።',
  'features.crops.alt':
    'ዘሮቹ የምሽት ደካማ ብርሃን የያዙበት የበስሏል የኢትዮጵያ ጤፍ ሰብል',
  'features.crops.b1Title': 'የዘር ማስቀጠልና የምርት ሰገፎች',
  'features.crops.b1Body':
    'ለእያንዳንዱ ሰብልና ለእያንዳንዱ የእርሻ አየር ንብረት የወረፋ መመሪያ። ሊዋወስ የሚችል ምንጭ ማሳያ ባልሰጠበት ቦታ ላይ መግለጫው ከማባለጥ ይልቅ ክፍተቱን ያሳያል።',
  'features.crops.b2Title': 'ለአካባቢዎ ተስማሚነት',
  'features.crops.b2Body':
    'የተመረጠው አካባቢ ከፍታና ዝናብ ከተመዘገበው ወሰን ጋር ይነጻጸራል፤ ተስማሚነቱም ደረጃ ተሰጥቶ እንግዳ እንደ እውነት በማረጋገጥ አይቀመጥም።',
  'features.crops.b3Title': 'ሊክፍቷቸው የሚችሏቸው ምንጮች',
  'features.crops.b3Body':
    'እያንዳንዱ መግለጫ ወደ ዋቢው ያገናኛል። PROTAና የመስክ ጥናት በሚጋጩበት ጊዜ ሁለቱም ቁጥሮች ከአንድ ጸጥ ያለ አማካይ ይልቅ ጎን ለጎን ይታያሉ።',
  'features.crops.b4Title': 'የተገለጹ ገደቦች',
  'features.crops.b4Body':
    'ወሰኖቹ ለእርሻ መሬትዎ ልኬቶች ሳይሆኑ በሥነ-ጽሑፍ የተደገፉ ሰነድ የተዘገቡ ምርጫዎች ናቸው — ክፍሉም ይህን በራሱ ራዕሱ ላይ ይናገራል።',

  'features.soil.title': 'ለመሸርሸር ለሚጋለጡ የኢትዮጵያ እርሻዎች የአፈር ጥበቃ ልምዶች',
  'features.soil.lede':
    'የፋንያ ጁው ቱፎች፣ የዙሪያ ድንጋይ ግድፎች፣ ኮምፖስትና የእንሰሳት ፍግ አያያዝ፣ የሰብል ዙር፣ የቅርፍትና የሾልከተ-ሸፈን አስተዳደር፣ እንዲሁም የተቀናጀ የአፈርና የውሃ ጥበቃ። እያንዳንዱ ልምድ የሚመጣው ከተታተሙ የኢትዮጵያ የመሬት አጠቃቀምና የከደጋ ጥበቃ ጥናቶች ሲሆን፣ የሚተገበርበት ሁኔታና የሚገለጽበትም ምንጭ አለው።',
  'features.soil.alt': 'በተከላከሉ የኢትዮጵያ ተራራ ጎድና ላይ አፈርን ይዘው የቆሙ የድንጋይ ግድፎችና የተደረጁ እርሻዎች',
  'features.soil.b1Title': 'የልምድ መመሪያ እንግዳ የአፈር ምርመራ አይደለም',
  'features.soil.b1Body':
    'ክፍሉ ስጋቱን የሚያስተዳድረው በተመዘገቡ ላቦችና ዝናብ ላይ ብቻ ነው። ስለ አፈርዎ የልምምድ ሀብት ሁኔታ ዕውቀት አለኝ ብሎ በጭራሽ አይገልጽም — ምክንያቱም ስላልለካው ነው።',
  'features.soil.b2Title': 'የላብና የመሸርሸር አውድ',
  'features.soil.b2Body':
    'የዝናብ ጥንካሬና የመሬት ላብ ድንኳንና የአፈር ኪሳራ ዋናው ገደብ በሆነበት ቦታ ለመለየት ይጠቀማሉ።',
  'features.soil.b3Title': 'ወረፋውን የሚከብር ቅደም ተከተል',
  'features.soil.b3Body':
    'ረጅቱ ዝናብ ከመምጣቱ በፊት የገንቢ ሥራዎች — ከዚያ በኋላ ደግሞ እጽዋ የተሠሩ ግድፎች — የአየር ንብረት ክፍሉ ከሚጠቀመው አውደ ጥርና ጋር አስቀምጠው።',

  'features.markets.title': 'እውነተኛ የኢትዮጵያ የገበያ ዋጋዎች — የተጠናበት ቀን አብሮት',
  'features.markets.lede':
    'ዋጋዎቹ የሚመጡት ከWFP ኢትዮጵያ rEMS የክትትል ጥናት እና በHDX አማካኝነት ከዓለም ባንክ የቅርብ-ጊዜ ዋጋ ተከታታዮች ሲሆን ለተመረጠው የገበያ ማዕከል ተነብተዋል። ወርሃዊው የክትትል ድግግሞሽ ዕጅፍ አዲሱ ቁጥር ብዙ ሳምንት እንደሚደርስ ያደርገዋል — ስለዚህ ክፍሉ የዛሬው ዋጋ እንደሆነ አያመላክትም እንግዳ የተመዘገበበትን ወር ያሳያል።',
  'features.markets.alt':
    'ለምስሪ፣ ለጤፍና ለሌሎች እህሎች የተሞሉና በላያቸው ላይ የመለኪያ ቅርጫቶች ያሏቸው የጁት ምላዎች — በአንድ የኢትዮጵያ ገበያ ላይ የተንጠላጠሉ',
  'features.markets.b1Title': 'ከክትትል ምዝገባ የተወሰዱ የገበያ ማዕከሎች',
  'features.markets.b1Body':
    'አካባቢዎቹ ከተታተሙ የዋጋ መረጃ ስብስቦች የተወሰዱ ናቸው — ስለዚህ እያንዳንዱ ዋጋ ለተሰበሰበበት ገበያ ሁልጊዜ የተያያዘ ነው።',
  'features.markets.b2Title': 'ያለ ፍጠራ የሚታይ አዝማሚያ',
  'features.markets.b2Body':
    'ተከታታዮቹ የሚሳሉት ከተመለሱት ትምዘታዎች ብቻ ነው። ወር ከጠፋ በመስመሩ ላይ እውነተኛ ክፍተት ይሆናል እንግዳ በጭራሽ አይሞላም።',
  'features.markets.b3Title': 'የዕጉይ ጊዜው መታየት',
  'features.markets.b3Body':
    'የክትትል ዋጋዎቹ ወርሃዊ ናቸው፣ የNBE መመሪያ ልወጣዎች ደግሞ ዕለታዊ — ሁለቱም የአዲስነት ወሰኖች በቁጥሮቹ ላይ ይታያሉ።',

  // --- Data credibility ---
  'data.eyebrow': 'የመረጃ ታማኝነት',
  'data.title': '{count} አቅራቢዎች — እያንዳንዱ ስሙ፣ ፈቃዱና የተመዘገበበት ጊዜ ግልጽ የሆነ',
  'data.lede':
    'IRSHAYE የራሱ የሆነ የተደበቀ የመረጃ ጥቅም የለውም። ጥቅሙ ማንኛውም በማያ ገጹ ላይ ያለ ቁጥር ወደ ሕዝባዊ አቅራቢ፣ ወደ ፈቃድ፣ ወደ ድግግሞሽ እና ወደ መረጃው የተመዘገበበት ቅጽበት ሊከታተል በመቻሉ ነው — እንዲሁም በይነገጹ የተመዘገበን ዋጋ ከሞዴል ውጤት፣ ከትንቢት እና እዚህ ከተሰላ ቁጥር የሚለይበት ሁኔታ ነው።',
  'data.pointNoKeys': 'በዚህ ዝርዝር ውስጥ ያሉ አቅራቢዎች API ቁልፍ ስለማይጠይቁ ምንም በቁልፍ ሥር አልተደበቀም።',
  'data.pointMarkedKeys': 'ቁልፍ የሚፈልጉ አቅራቢዎች ተመልክተዋል፤ ያለ ቁልፍ ምርቱ በታማኝነት ዝቅ ይላል።',
  'data.pointFreshness':
    'እያንዳንዱ ምንጭ የራሱ የሆነ የአዲስነት ወሰን አለው — ERA5፣ POWER እና የ8 ቀን ሳተላይት ድብልቆች በዕቅድ ዕጉይ ሆነው ይመጣሉ።',
  'data.pointLicence':
    'ሁለት መረጃ ስብስቦች አቅራቢያቸው ፈቃዳቸውን አልጻፉም። አቅራቢዎቹን በመጥቀስ ለማንበብ ይታያሉ፣ ይህም ገደብ በማያ ገጹ ላይ ተጽፎ ይገኛል።',
  'data.cta': 'የቀጥታ የምንጭ ሁኔታ ይክፈቱ',
  'data.registry': 'የምንጮች ምዝገባ',
  'data.registryBadge': 'ከ{count} አቅራቢዎች በቀጥታ',

  // --- Integrity rules ---
  'rules.eyebrow': 'የማስረጃ ደንቦቹ',
  'rules.title': 'በይነገጹ የሚገፉ አራት ዋስትናዎች — በቃል ብቻ የማይወሰኑ',
  'rules.lede':
    'አማካሪ መሣሪያ እምነት የሚገኘው ምን እንደሚናገር ሳይሆን ምን እንደሚከለከል ነው። እነዚህ ደንቦች በማሳያው ንብርብር ላይ ተተግብረዋል — ማንኛውም ገጽ ላይ እየሠሩ መመልከት ይቻላል፣ መረጃው እንኳን ያልተመቸዎት ቢሆን።',
  'rules.r1Title': 'የሞዴል ውጤት በጭራሽ እንደ ልኬት አይቀርብም',
  'rules.r1Body':
    'እያንዳንዱ ዋጋ ዓይነት አለው — የተመዘገበ፣ በሞዴል የተሠራ፣ ትንቢት፣ እዚህ የተሰላ ወይም የተሞላ። ቀለሙና መለያው ልዩነቱን አጥፍተው ከማስወገድ ይልቅ ግልጽ ያደርጉታል።',
  'rules.r2Title': 'ክፍተት እንደ ክፍተት ይታያል',
  'rules.r2Body':
    'አቅራቢው ምንም ሳይመልስ ክፍሉ ስንፈቱን ኮዱን አብሮ ያወጣል። ቦታውን ለመሙላት የተፈለሰ የአየር ሁኔታ፣ ዋጋ ወይም የግብርና ቁጥር አይፈጠርም።',
  'rules.r3Title': 'የመስክ ማረጋገጫ ከሌለ ስለ ውጤት አይናገርም',
  'rules.r3Body':
    'መድረኩ በእውነተኛ እርሻዎች ላይ ሳይለካ ስለ ምርት ጭማሪ፣ ስለ ገቢ ንላላ ወይም ስለ ውሃ ቁጠብራ አይገልጽም፤ የሳተላይት እጽዋ ማሳያዎችንም እንደ የአፈር ምርመራ አያቀርብም።',
  'rules.r4Title': 'መመሪያ እንግዳ ዋስትና አይደለም',
  'rules.r4Body':
    'ምክሩ ምንጮቹ የተሰየሙበትና እርግጠኛ አለመሆኑ የተገለጸበት የውሳኔ ድጋፍ ነው። ሳይለካ የአፈር ሁኔታ አይተነትንም፣ ማስረጃው ሲዳከም ደግሞ ዝግ ይላል።',

  // --- AI layer ---
  'ai.eyebrow': 'የሰው ሠራሽ ብልህነት ንብርብር',
  'ai.title': 'መድረኩ ሊያረጋግጣቸው ከሚችላቸው ነገሮች ላይ ብቻ ማሰብ የሚችል ረዳት',
  'ai.lede':
    'አማካሪው የሚያገኘው ሌሎቹ ክፍሎች የሰበሰቡትን የማስረጃ ጥቅል ነው — ለኮርዲናቶዎ በቀጥታ የተገኘ የአየር ንብረት መረጃ፣ ዋቢ ያለው የሰብል መግለጫ፣ የአፈር አስተዳደር ልምዶችና የተጠና ዋጋዎች የተመዘገቡበት ወር እያኖ ሳቸው — መልሱን በተወሰነ መዋቅር ይሰጣል። ከእርሻ፣ ከአፈር ላብራቶሪ ወይም ከወደፊት ልውውጥ ገበያ አልተገናኘም፤ እሱም ይናገራል።',
  'ai.keyNote':
    'መልሶች በማሰራጫው ላይ የሞዴል ቁልፍ ይፈልጋሉ። ያለ ቁልፍ ክፍሉ ራሱን እንደማይገኝ ያወጣል እንግዳ ሌሎቹ ክፍሎች ሙሉ በሙሉ ይሠራሉ — የተፈለሰ ምክር አይሰጥም።',
  'ai.cta': 'የሰው ሠራሽ ብልህነት የግብርና አማካሪ ይክፈቱ',
  'ai.imageAlt':
    'የነጭ ንጣል ልብስ የለበሰ ኢትዮጵያዊ ገበሬ መሠረታዊ የሞባይል ስልክ ሲያዝ የምክር ውይይት ሲያዳምጥ',
  'ai.contract': 'የመልስ ውል',
  'ai.contract1Body':
    'መልሱ ላይ የተመሠረተባቸውን ወሳኝ የመድረክ መዝገቦች — እያንዳንዱ ወደ አቅራቢና ወደ መረጃው የተመዘገበበት ቀን የሚከታተል።',
  'ai.contract2Body':
    'እንደ የግብርና ውሳኔ ድጋፍ የቀረበ መመሪያ። የአፈርን ሁኔታ አይተነትንም፣ ምርትን አረጋግጦ አይሰጥም፣ ገቢም ተስጋ አይሰጥም።',
  'ai.contract3Body':
    'ማስረጃው መወሰን የማይችላቸው ነገሮች — በሥነ-ጽሑፍ የተደገፉ ወሰኖች፣ የክትትል ዕጉይትና የጠፉ ወራት ጨምሮ — በመልሱ ውስጥ የተገለጹ።',
  'ai.contract4Body':
    'የተሰበሰበው ማስረጃ መልስ ለመስጠት በማይችልበት ጊዜ አማካሪው ምክረ-ሃሳብ አይመልስም፤ ይልቁንም ክፍተቱን ይሰይመዋል።',

  // --- Audience / call to action ---
  'cta.title': 'መድረኩን ይክፈቱና አካባቢ ይምረጡ። ወደፊት ሁሉም በቀጥታ ይሆናል።',
  'cta.lede':
    'ምዝገታ የለም፣ የናሙና መረጃ የለም፣ የተዘሩ ቁጥሮች የሉም። አንድ የኢትዮጵያ የገበያ ማዕከል ይምረጡ ወይም የራስዎን ኮርዲናቶች ያስገቡ — IRSHAYE እርስዎም ማንበብ የሚችሏቸውን ተመሳሳይ ሕዝባዊ አቅራቢዎች ያነባል፤ ከዚያም ምን እንዳገኘ፣ መቼ እንዳገኘና ምን ሊያገኝ እንዳልቻለ በትክክል ያሳይዎታል።',
  'cta.primary': 'በአጠቃላይ እይታ ይጀምሩ',
  'cta.secondary': 'መጀመሪያ የምንጭ ሁኔታውን ያረጋግጡ',
  'cta.eyebrow': 'የተዘጋጀው ለማን?',
  'cta.a1Title': 'ገበሬዎችና የቤተሰብ እርሻዎች',
  'cta.a1Body':
    'ያለ መለያና ያለ ቁልፍ በአሳሽ ውስጥ ይከፈታል። በፊደል ግዕዝ የተጻፉ የሰብል ስሞች በትክክል ይታያሉ፣ ቁጥሮቹም ለውሳኔ በሚውሉ መለኪያዎች — ሚሜትር፣ ከባሕር ገጽታ በላይ ሜትርና የኩንታል ዋጋ — ይገለጻሉ።',
  'cta.a2Title': 'የልማት ተቋማትና ትብብራዎች',
  'cta.a2Body':
    'ለአንድ አካባቢ የአየር ንብረት አውዱ፣ ዋቢ ያላቸው የሰብል መስፈርቶች፣ የጥበቃ ልምዶችና የተጠና ዋጋዎች በአንድ ማያ ገጽ ላይ ይታያሉ — ይህም የምክር ጉብኝት ከጋራ ማስረጃ እንዲጀምር ያደርጋል።',
  'cta.a3Title': 'ፕሮግራሞች፣ ኤንጂኦዎችና ተመራማሪዎች',
  'cta.a3Body':
    'እያንዳንዱ አቅራቢ፣ ፈቃድና የአዲስነት ወሰን ግልጽ ሲሆን የተሰሉ ውጤቶችም ይመደባሉ — ከመድረኩ የወጡ ቁጥሮች መነሻቸውን እያዙ ይደርሳሉ።',

  // --- Landing footer ---
  'footer.about':
    'ለኢትዮጵያ የአየር ንብረት ብልህ ግብር የተዘጋጀ በሰው ሠራሽ ብልህነት የሚደገፍ ዲጂታል መድረክ። በአካባቢ ላይ የተመሠረተ የአየር ንብረት መረጃ ትንተና፣ የሰብልና የአፈር መመሪያ እንዲሁም የገበያ ዋጋዎች — ማስረጃው ከእያንዳንዱ ጋር የተያያዘበት።',
  'footer.modules': 'ክፍሎች',
  'footer.publishers': 'አቅራቢዎች',
  'footer.overview': 'አጠቃላይ እይታ',
  'footer.linkHow': 'IRSHAYE እንዴት እንደሚሠራ',
  'footer.linkIntelligence': 'አየር ንብረት፣ ሰብሎች፣ አፈር፣ ገበያዎች',
  'footer.linkAdvisory': 'የሰው ሠራሽ ብልህነት ንብርብር',
  'footer.linkRegistry': 'የምንጮች ምዝገባ',
  'footer.linkSaved': 'የተቀመጠ አካባቢና ሰብል',
  'footer.disclaimer':
    'IRSHAYE የግብርና ውሳኔ ድጋፍ ይሰጣል እንግዳ ዋስትና አይሰጥም። ምክረ-ሃሳቦቹ በመሬት ላይ ሳይለኩ ስለ ምርት፣ ስለ ገቢ ወይም ስለ ውሃ ቁጠብራ ውጤቶች አይገልጹም፤ ማንኛውም ክፍልም ሳይለካ የአፈር ሁኔታ አይተነትንም። በሥነ-ጽሑፍ የተደገፉ የሰብል ወሰኖች የተመዘገቡ ምርጫዎች እንግዳ ለእርሻ መሬትዎ ልኬት አይደሉም። የሳተላይት እጽዋ ማሳያዎች የአፈርን ጥራት ሳይሆን የቅጠሉት አረንጓዴነትን ይገልጻሉ። አቅራቢ መረጃ ሳይመልስ መድረኩ ቦታውን በተለያጅ ዋጋ ከመሙላት ይልቅ ክፍተቱን ያወጣል።',
  'footer.attributions':
    'የአየር ሁኔታና የአየር ንብረት፦ Open-Meteo (CC BY 4.0) እና NASA POWER። የዝናብና የሙቀት መደበኛ ሁኔታዎች፦ በOpen-Meteo አማካኝነት የERA5 እንደገና-ትንተና። የገበያ ዋጋዎች፦ WFP ኢትዮጵያ rEMS እና በHDX አማካኝነት የዓለም ባንክ የቅርብ-ጊዜ ተከታታዮች። የውጭ ምንዛሪ ልወጣዎች፦ ብሔራዊ የኢትዮጵያ ባንክ እና ዓለም ባንክ። ወሰኖችና ሳተላይት ንብርብሮች፦ geoBoundaries፣ NASA GIBS፣ Ethiopia.GeoPortal በArcGIS፣ GRID3/WorldPop እና CDE — ፈቃዶች በመረጃ ምንጮች ገጽ ላይ እንደተገለጹ።',

  // --- Loading and notice primitives ---
  'states.codeLabel': 'ኮድ',
  'states.codeNoSubstitute': 'ለዚህ ምንጭ ተኪ ዋጋ አያሳይም።',

  // --- Provenance blocks ---
  'prov.kind.observed': 'የተመዘገበ',
  'prov.kind.modeled': 'በሞዴል የተሠራ',
  'prov.kind.forecast': 'ትንቢት',
  'prov.kind.estimated': 'እዚህ የተሰላ',
  'prov.kind.imputed': 'የተሞላ',
  'prov.noSource': 'ለዚህ ቁጥር የሚታወቅ ምንጭ የለም።',
  'prov.behindSchedule': 'ከጊዜው በስተጀርባ',
  'prov.cachedCopy': 'የተቀመጠ ቅጂ',
  'prov.sourceLink': 'ምንጭ',
  'prov.observedAt': '{when} የተመዘገበ',
  'prov.fetchedAt': '{when} የተወሰደ (EAT)',
  'prov.dateNotStated': 'ቀኑ አልተገለጸም',
  'prov.notAvailable': 'አይገኝም',

  // --- Value-kind legend (Data Sources) ---
  'legend.title': 'ዋጋዎች እንዴት ይመደባሉ',
  'legend.hint':
    'በመድረኩ ላይ ያለ ማንኛውም ቁጥር ከእነዚህ ዓይነቶች አንዱን ይይዛል። ዓይነቱ ቀለሙን፣ ቃሉንና የሚተገበረውን የአዲስነት ወሰን ይወስናል።',
  'legend.ruleLabel': 'ደንብ',
  'legend.observedMeaning':
    'አቅራቢው እንደ የአየር ሁኔታ ወይም የገበያ ክትትል ልኬት አድርጎ የሚያወጣው መረጃ።',
  'legend.observedRule': 'በተመዘገበበት ቀን አብሮ ይታያል። በጭራሽ እንደ ትንቢት አይቀርብም።',
  'legend.modeledMeaning':
    'የእንደገና-ትንተና ወይም የሞዴል ውጤት — በፊዚክስ ሕግ የተመሠረተ ቢሆንም ለአካባቢዎ የተለካ ሳይሆን እንደገና የተገነባ ነው።',
  'legend.modeledRule': 'በሞዴል የተሠራ ተብሎ ይመደባል፤ አቅራቢው ሲሰጥ የግሪድ ጥራቱም ይገለጻል።',
  'legend.forecastMeaning': 'የቁጥራዊ የአየር ሁኔታ ሞዴል ወደፊት የሄደ ውጤት።',
  'legend.forecastRule': 'በተመሳሳይ ተከታታይ ውስጥ ከተመዘገቡ ልኬቶች ጋር በጭራሽ አይደመሩም።',
  'legend.estimatedMeaning':
    'ይህ መተግበሪያ ከተታተሙ ዋጋዎች ላይ የሰላው ቁጥር — ለምሳሌ የዝናብ መዛባት።',
  'legend.estimatedRule': '“እዚህ የተሰላ” ተብሎ ይመለያል፣ ግብቶቹም ስሙ ስለተሰጠ እንደገና ሊሰላ ይቻላል።',
  'legend.imputedMeaning': 'አቅራቢው ምንም ዋጋ ባልነበረበት ቦታ የተሞላ ዋጋ።',
  'legend.imputedRule':
    'IRSHAYE የግብርና መረጃ በጭራሽ አይተካም። ይህ መለያ እየታየ ካለ ተኪው በማያ ገጹ ላይ ይገለጻል።',

  // --- Source status panel ---
  'sources.title': 'የምንጭ ሁኔታ',
  'sources.hint':
    'እያንዳንዱ ረድፍ ለአቅራቢው የተደረገ አንድ ቀጥታ ፍተሻ ነው። መድረሱ የማይቻል ምንጭ ምክንያቱ አብሮ እንደማይደረስ ይዘገባል እንግዳ አይደበቅም ወይም አይተካም።',
  'sources.recheck': 'እንደገና ይፈትሹ',
  'sources.recheckAria': 'ምንጮችን እንደገና ፈትሹ',
  'sources.probeScope': 'የፍተሻ ወሰን',
  'sources.probing': 'ምንጮች በመፈተሽ ላይ…',
  'sources.probeFailed': 'የሁኔታ ፍተሻው አልተሳካም',
  'sources.apiKeyRequired': 'API ቁልፍ ያስፈልጋል',
  'sources.ranAt': 'ፍተሻዎቹ በ{when} EAT ተካሄደዋል።',
  'sources.allHint': '“ሁሉም ምንጮች” ረጅም ጊዜ የሚወስዱትን ትላልቅ የዋጋና የጠቋሚ መረጃ ምንጮችም ይፈትሻል።',
  'sources.storedPipeline': 'የተቀመጠ ማስተላለፊያ መስመር',
  'sources.noSync':
    'ለዚህ መረጃ ቋት ማመሳሰያ ሥራ ስላልተመዘገበ ከላይ ያሉት ምንም ከማከባበሪያ አልቀረቡም — በዚህ ማያ ገጽ ላይ ያሉት ሁሉም ቁጥሮች በዚህ ጥያቄ ውስጥ ከአቅራቢዎቹ የተገኙ ናቸው። ይህ የሥራ ውስጣዊ አቀማመጥ ነው፤ ማመሳሰያው ታሪክ ብቻ ይጨምራል እንግዳ አቅራቢው ሲዘገይ መቋቋሚያ ይሆናል።',
  'sources.unfinished': 'ያልተጠናቀቀ',
  'sources.pageDescription':
    'IRSHAYE ከተሰየሙ አቅራቢዎች ክፍት መረጃ ብቻ ያቀርባል እንግዳ ሌላ አያቀርብም። ባዶ ካርዛ ማለት አቅራቢው መልስ አልሰጠም ማለት ነው — በአገልግሎት መንገዱ ውስጥ የናሙና፣ የምሳሌ ወይም ቦታ ሙሌት ዋጋዎች የሉም።',
  'statusLabel.connected': 'ተያይዟል',
  'statusLabel.stale': 'ከጊዜው በስተጀርባ',
  'statusLabel.unavailable': 'አይገኝም',
  'statusLabel.auth_required': 'ማረጋገጫ ያስፈልጋል',
  'statusLabel.disabled': 'ጥፍ ተብሏል',
  'statusLabel.not_configured': 'አልተዘጋጀም',
  'syncLabel.succeeded': 'የመጨረሻው ሥራ ሁሉንም ጽፏል',
  'syncLabel.partial': 'የመጨረሻው ሥራ አንዳንድ አቅራቢዎችን ጽፏል',
  'syncLabel.failed': 'የመጨረሻው ሥራ ምንም አልጻፈም',
  'syncLabel.skipped_overlap': 'አልተሠራም — ሌላ ሥራ በሥራ ላይ ስለነበር',

  // --- Location and crop pickers ---
  'picker.location': 'አካባቢ',
  'picker.surveyMarket': 'የተጠና ገበያ',
  'picker.ownPoint': 'የራስዎ ነጥብ',
  'picker.hint':
    'ከተመረጡት ከWFP ሕዝባዊ የገበያ ማጣቀሻ ሰንጠረዝ ስለሆኑ እያንዳንዱ ምርጫ የአቅራቢውን የራሱ ኮርዲናቶችና የክፍለ ሀገር ስሞች ይዞ ይመጣል።',
  'picker.marketCentre': 'የገበያ ማዕከል',
  'picker.customCoordinate': 'የራስ ኮርዲናት',
  'picker.ownPointField': 'ወይም የራስዎን ነጥብ ያስገቡ',
  'picker.ownPointHint': 'እንደተሰጠ ይውላል፤ ለተታይደ ኮርዲናት የአስተዳደር ስም አይጣመርም።',
  'picker.latitude': 'ግድም ኮርዲናት (እንቅስት)',
  'picker.longitude': 'ቀጥተኛ ኮርዲናት (ሮንጂት)',
  'picker.selectedCoordinate': 'የተመረጠ ኮርዲናት',
  'picker.summaryWfp': '. የክፍለ ሀገርና ዞን ስሞች WFP እንዳስቀመጣቸው ነው።',
  'picker.summaryOwn': '— {name}፣ የራስዎ ነጥብ።',
  'picker.checkCoordinates': 'ኮርዲናቶቹን ያረጋግጡ',
  'picker.errorBlank': 'ግድምና ቀጥተኛ ኮርዲናቶችን እንደ ቁጥር ያስገቡ።',
  'picker.errorRange': 'ግድም ኮርዲናት −90 እና 90 መካከል፣ ቀጥተኛ ኮርዲናት ደግሞ −180 እና 180 መካከል መሆን አለበት።',
  'picker.listUnavailable': 'የአካባቢ ዝርዝር አልተገኘም',
  'picker.listFailed': 'የአካባቢ ዝርዝሩ መጫን አልተሳካም — የኮርዲናት ሳጥኑ ግን ይሠራል።',
  'crops.yourCrop': 'ሰብልዎ',
  'crops.cropProfile': 'የሰብል መግለጫ',
  'crops.pickerHint':
    'መመሪያው ዋቢ ያለው የተመረጠ ማጣቀሻ መረጃ ነው። ተስማሚነቱ ከቀጥታ የአየር ንብረት መረጃ ጋር ስለሚነጻጸር እንደ በሞዴል የተሠራ መመሪያ ይመደባል እንግዳ እንደ ልኬት አያቀርበውም።',

  // --- Crop advisory module ---
  'crops.pageDescription':
    'የሰብል መግለጫዎች እያንዳንዱ ቁጥር ለአቅራቢው የተዋወረበት የተመረጠ ማጣቀሻ መረጃ ናቸው። የተስማሚነት ፍተሻው ያንኝ ሰነድ ከቀጥታ የአየር ንብረት መረጃ ጋር ያነጻጽራል እንግዳ እንደ በሞዴል የተሠራ መመሪያ ብቻ ይመደባል — የእርሻ መሬትዎ ልኬት አይደለም።',
  'crops.badgeNoProfile': 'መግለጫ አልተመረጠም',
  'crops.overall.supported': 'ከተመዘገበው ወሰን ጋር ይስማማል',
  'crops.overall.mixed': 'በከፊል ይደገፋል',
  'crops.overall.weak': 'ከተመዘገበው ወሰን ውጭ',
  'crops.overall.insufficient-data': 'በቂ መረጃ የለም',
  'crops.aspect.season': 'ወረፋ',
  'crops.aspect.rainfall': 'ዝናብ',
  'crops.aspect.temperature': 'ሙቀት',
  'crops.aspect.altitude': 'ከፍታ',
  'crops.verdict.within': 'በውስጥ',
  'crops.verdict.watch': 'ክትትል ያስፈልጋል',
  'crops.verdict.outside': 'ውጭ',
  'crops.verdict.unknown': 'መረጃ የለም',
  'crops.noData': 'መረጃ የለም',
  'crops.noProfileTitle': 'የሰብል ማጣቀሻ መግለጫዎች',
  'crops.noProfileBody':
    'ለተሸፈኑት የኢትዮጵያ ሰብሎች ዋቢ ያላቸው የተመረጡ የሰብል መግለጫዎች በመገንባት ላይ ይገኛሉ። መግለጫ እስካልተዘጋጀ ድረስ ይህ ክፍል ምንም መመሪያ አያሳይም — IRSHAYE ያለ ዋቢ የግብርና ቁጥሮችን አያቀርብም። እስካሁን ድረስ የአየር ንብረትና የገበያ ክፍሎች ሙሉ በሙሉ ይሠራሉ።',
  'crops.liveComparison': 'ቀጥታ ንጽጽር',
  'crops.liveComparisonHint':
    'ለ{crop} የተመዘገቡ መስፈርቶች ከ{place} ቀጥታ ልኬቶች ጋር ሲነጻጸሩ። እያንዳንዱ ውሳኔ የተጠቀመውን ግብት ይሰይመዋል።',
  'crops.provenanceForecast': 'የትንቢት ግብቶች',
  'crops.provenanceObserved': 'የተመዘገበ መዝገብ',
  'crops.loadingComparison': 'ለንጽጽሩ ቀጥታ የአየር ንብረት በመጫን ላይ',
  'crops.altitudeDetail':
    'የተመዘገቡ የእርሻ-አየር ንብረት ደረጃዎች፦ {bands}። ይህ መድረክ የእርሻ መሬትዎን ከፍታ በክፍት መረጃ መለካት ስለማይችል የቁመት ግምቱ የራስዎ ውሳኔ ይሁን።',
  'crops.altitudeMissing': 'ለዚህ ሰብል የተመዘገበ የከፍታ ወሰን አልተገኘም።',
  'crops.requirementsTitle': 'የተመዘገቡ መስፈርቶች',
  'crops.requirementsHint':
    'ዋቢ ያላቸው ማጣቀሻ ዋጋዎች — የተመረጡና በሥነ-ጽሑፍ የተደገፉ እንግዳ ለእርሻ መሬትዎ ቀጥታ ልኬቶች አይደሉም።',
  'crops.seasonRainNeed': 'የወረፋ ዝናብ ፍላጎት',
  'crops.documentedTotal': 'ለመሠረቱ ሕይወት ዑደት የተመዘገበ ጠቅላላ።',
  'crops.tempRange': 'የሙቀት ወሰን',
  'crops.singlePoint': ' (ነጠላ ነጥብ)',
  'crops.seasonDependence': 'የወረፋ ዝናብ ጥገኝነት',
  'crops.soilPreference': 'የአፈር ምርጫ',
  'crops.soilPreferenceNote': 'የተመዘገበ የውሃ ፍሳሽ ምርጫ እንግዳ የአፈር ምርመራ አይደለም።',
  'crops.plantingHarvest': 'የዘር ማስቀጠልና የምርት ሰገፎች',
  'crops.noPlantingCalendar':
    'ለዚህ ሰብል ሊዋወስ የሚችል የማስቀጠል ወሮች ማሳያ አልተገኘም — እንደ ክፍተት ታይቷል እንግዳ አልተሞላም።',
  'crops.plantLabel': 'ማስቀጠል',
  'crops.harvestLabel': 'ማሳመሳ',
  'crops.noHarvestCalendar': 'ለዚህ ሰብል ሊዋወስ የሚችል የምርት ወሮች ማሳያ አልተገኘም።',
  'crops.tempNoteTitle': 'የሙቀት መስፈርት ማስታወሻ',
  'crops.soilNoteTitle': 'የአፈር ምርጫ — ተመዝግቧል እንግዳ አልተለካም',
  'crops.phDocumented': 'የተመዘገበ pH {min}–{max}።',
  'crops.phMissing': 'ሊዋወስ የሚችል የpH ወሰን አልተገኘም።',
  'crops.practicesTitle': 'የተመዘገቡ ልምዶች',
  'crops.practicesHint': 'ለዚህ ሰብል በተዋወሩ ምንጮች ውስጥ ስማቸው የተገለጹ የአያያዝ ልምዶች።',
  'crops.risksTitle': 'በመዝገብ ላይ ያሉ የአየር ንብረት ስጋቶች',
  'crops.risksHint':
    'ከተዋወሩት ሥነ-ጽሑፎች የተወሰዱ የአደጋ ግልጸቶች — እነሱን የሚከታተለው የመድረክ ጠቋሚ አብሮ ተገልጿል።',
  'crops.whenLabel': 'መቼ፦',
  'crops.watchLabel': 'የመድረክ ክትትል፦',
  'crops.seasonTitle': 'የኢትዮጵያ የወረፋ አውደ ጥርና',
  'crops.seasonHint': 'ከላይ ያሉት ሰገፎች የሚጠቅሟቸው ወረፋዎች ትርጉም።',
  'crops.limitsTitle': 'የዚህ ማጣቀሻ ንብርብር ገደቦች',

  // --- Suitability sentences (generated by lib/crops/suitability.ts) ---
  'suitability.singlePoint': '(የተመዘገበ ነጠላ ነጥብ)',
  'suitability.seasonNoCalendar':
    'ለ{crop} በተመረጡት ምንጮች ውስጥ ሊዋወስ የሚችል የወሮች ማሳያ ስላልተገኘ IRSHAYE በመነሳት ይልቅ የማስቀጠልም ሆነ የምርት ሰገፍ አያሳይም።',
  'suitability.seasonPlanting': '{month} ለ{crop} በተመዘገበ የማስቀጠል ሰገፍ ውስጥ ይገኛል።',
  'suitability.seasonHarvest': '{month} ለ{crop} በተመዘገበ የምርት ሰገፍ ውስጥ ይገኛል።',
  'suitability.seasonOutside': '{month} ከ{crop} በተመዘገቡ የማስቀጠልና የምርት ሰገፎች ውጭ ነው።',
  'suitability.rainNoRange': 'ለዚህ ሰብል ሊዋወስ የሚችል የወረፋ ዝናብ ወሰን ስላልተገኘ ምንም ንጽጽር አይደረግም።',
  'suitability.rainNoData': 'ቀጥታ የዝናብ መረጃ ለአሁኑ ሰዓት ስላልተገኘ የወረፋ ወሰኑን ማነጻጸር አልተቻለም።',
  'suitability.rainDry':
    'የተመዘገበው ፍላጎት በወረፋ {need} mm ሲሆን የቅርብ ጊዜው የዝናብ ምልክት ግን ደካማ ነው ({signal})። በቻሉ ልክ ዝናብ ጥገኛ የሆኑ ሥራዎችን ያዘገዩ።',
  'suitability.rainForecast7': 'በ7 ቀናት {mm} mm ትንቢት',
  'suitability.rainNoMeasurable': 'በቅርብ ጊዜው መዝገብ ሊለካ የሚችል ዝናብ የለም',
  'suitability.rainWithin':
    'የተመዘገበው ፍላጎት በወረፋ {need} mm ነው። የቅርብ ጊዜ ዝናብ፦ {forecast}፤ በቅርቡ የተመዘገበው ደግሞ {observed}።',
  'suitability.notAvailable': 'አልተገኘም',
  'suitability.tempNoRange': 'ለዚህ ሰብል ሊዋወስ የሚችል የሙቀት ወሰን አልተገኘም።',
  'suitability.tempNoData': 'ቀጥታ የሙቀት ልኬቶች ስላልተገኙ ምንም ንጽጽር አይደረግም።',
  'suitability.tempOutside':
    'የአሁኑ ልኬቶች ({readings}) ከ{crop} ለተመዘገበው ምቹ የሙቀት ወሰን {range} ውጭ ሆነዋል። {notes}',
  'suitability.tempBrush': 'ልኬቶቹ የተመዘገበውን ወሰን ዳርቻ ይነካሉ ({range})። {notes}',
  'suitability.tempWithin': 'የአሁኑ ልኬቶች {readings} በተመዘገበው ወሰን {range} ውስጥ ይገኛሉ።',

  // --- Overview module ---
  'overview.title': 'የእርሻ አጠቃላይ እይታ',
  'overview.description':
    'አካባቢዎንና ሰብልዎን ይምረጡ። ከዚህ በታች ያሉት ሁሉም ምንጫቸው አብሮት ያላቸው ቀጥታ መረጃዎች ናቸው — ቁጥሩ ልኬት ሳይሆን ትንቢት ወይም የሞዴል ውጤት ሲሆን መድረኑ ግልጽ ያወጣል።',
  'overview.badgeLive': 'ቀጥታ',
  'overview.badgeConnecting': 'በመገናኘት ላይ',
  'overview.badgeNoReading': 'ቀጥታ ልኬት የለም',
  'overview.changeContext': 'የተቀመጠውን አውድ ቀይር',
  'overview.yourLocation': 'አካባቢዎ',
  'overview.seasonContext': 'የወረፋ አውድ — {place}',
  'overview.seasonHint':
    'ወሩ {month} ነው። መመሪያው ትንቢቱን ከሰብልዎ የተመዘገቡ ማጣቀሻ መስፈርቶች ጋር ያነጻጽራል።',
  'overview.rainNow': 'ዝናቡ አሁን {value} mm',
  'overview.loadingWeather': 'ቀጥታ የአየር ሁኔታ በመጫን ላይ',
  'overview.tempNow': 'የአሁኑ ሙቀት',
  'overview.observedAt': '{when} የተመዘገበ',
  'overview.noObservation': 'ምንም መረጃ አልተመለሰም',
  'overview.rainOutlookNote': 'የየዕለት ትንቢት ድምር — በሞዴል የተሠራ ቅድመ እይታ እንግዳ ልኬት አይደለም።',
  'overview.noForecastDays': 'ምንም የትንቢት ቀናት አልተመለሱም።',
  'overview.nextRainDay': 'ቀጣዩ ቀን ≥ 1 mm',
  'overview.noneIn7d': 'በ7 ቀናት ውስጥ የለም',
  'overview.nextRainDayNote': 'አንድ ሚሜትር ዝናብ የሚደርስበት የመጀመሪያው የትንቢት ቀን።',
  'overview.humidityNow': 'የአሁኑ እርጥበት',
  'overview.humidityNote': 'ከሙቀቱ ጋር በአንድ ትምዘታ ላይ የተገኘ አንጻራዊ እርጥበት።',
  'overview.forecastDays': 'የሚታዩ የትንቢት ቀናት',
  'overview.forecastDaysNote': 'ለዚህ ነጥብ የOpen-Meteo የትንቢት ወሰን።',
  'overview.warmest': 'ሙቀት ብዙ ያለው ቅድመ እይታ',
  'overview.warmestNote': 'ከተመለሱት የትንቢት ቀናት መካከል ከፍተኛው የዕለት ከፍተኛ ሙቀት።',
  'overview.cooliest': 'ቀዝቃዛው ቅድመ እይታ',
  'overview.cooliestNote': 'ከተመለሱት የትንቢት ቀናት መካከል ዝቅተኛው የዕለት ዝቅተኛ ሙቀት።',
  'overview.plantingWindow': 'የማስቀጠል ሰገፍ',
  'overview.harvestWindow': 'የምርት ሰገፍ',
  'overview.outsideWindows': 'ከተመዘገቡ ሰገፎች ውጭ',
  'overview.plantingNowNote': 'ይህ ወር ለዚህ ሰብል በተመዘገበ የማስቀጠል ሰገፍ ውስጥ ይገኛል።',
  'overview.harvestNowNote': 'ይህ ወር ለዚህ ሰብል በተመዘገበ የምርት ሰገፍ ውስጥ ይገኛል።',
  'overview.outsideWindowsNote':
    'ይህ ወር ከተመዘገቡት የማስቀጠልና የምርት ሰገፎች ውጭ ነው — የሰብል መግለጫው ምንጮቹ የሚሰይማቸውን ወሮች ያሳያል።',
  'overview.openCrops': 'የሰብል አማካሪ ይክፈቱ',
  'overview.noCropProfileNote':
    'የሰብል ማጣቀሻ መግለጫዎች ምንጫቸው አብረውታል ተመርጠው የተዘጋጁ ናቸው። ለዚህ ሰብል መግለጫ እስኪኖር ድረስ የማስቀጠል መመሪያ አያሳይም — መድረኩ አይተነብርም።',
  'overview.modulesAria': 'ክፍሎች',
  'overview.goDeeper': 'ጥልቅ ይሂዱ',

  // --- Climate module ---
  'climate.description':
    'ከOpen-Meteo የአሁኑ ሁኔታና ትንቢት፣ ከNASA POWER የዝናብ ታሪክና የ30 ዓመት መደበኛ ሁኔታዎች — ለተመሳሳዩ ነጥቦች የሳተላይት ልኬቶች እንዲሁም። የተመዘገቡ፣ ትንቢት፣ በሞዴል የተሠሉ እና የተሰሉ ዋጋዎች ሁልጊዜ የራሳቸው ዓይነት ተብለው ይመደባሉ።',
  'climate.currentConditions': 'የአሁኑ ሁኔታ · {place}',
  'climate.currentHint':
    'ለግሪድ ሴሉ የOpen-Meteo የተተነተነ የአሁን ሰዓት ሁኔታ — ከጣቢያ ነጻ በሆነና አቅራቢው በተመዘገበው የግሪድ ከፍታ አብሮ።',
  'climate.loadingWeather': 'Open-Meteo በማንበብ ላይ',
  'climate.temperature': 'ሙቀት',
  'climate.wind': 'ንፋስ',
  'climate.rainThisHour': 'የዚህ ሰዓት ዝናብ',
  'climate.gridElevation': 'የግሪድ ከፍታ',
  'climate.notReported': 'አልተዘገበም',
  'climate.timezoneLabel': 'የጊዜ ዞን',
  'climate.outsideEthiopia':
    'ይህ ነጥብ የኢትዮጵያ ከተታተመ ወሰን ውጭ ስለሚገኝ ብሔራዊ ምንጮች ላይሸፍኑት ይችላሉ።',
  'climate.weekAround': 'ያለፈው ሳምንትና የሚመጣው ሳምንት',
  'climate.weekHint':
    'አረንጓዴ አምዶች የተተነተኑ ትምዘታዎች ናቸው፣ ወይን ቀለም ያላቸው ደግሞ ትንቢት ናቸው። አንድ ሰንጠረዥ — ሁለት የተለያዩ ዓይነት ቁጥሮች — በአንድ ተከታታይ ውስጥ በጭራሽ አይዋሃዱም።',
  'climate.buildingOutlook': 'ቅድመ እይታው በመገንባት ላይ',
  'climate.todayMarker': 'ዛሬ →',
  'climate.rainObserved': 'ዝናብ — የተመዘገበ',
  'climate.rainForecast': 'ዝናብ — ትንቢት',
  'climate.maxTemp': 'ከፍተኛ °C',
  'climate.minTemp': 'ዝቅተኛ °C',
  'climate.keyRainObserved': 'ዝናብ — የተመዘገበ ({count} ቀናት)',
  'climate.keyRainForecast': 'ዝናብ — ትንቢት ({count} ቀናት)',
  'climate.keyMaxTemp': 'የዕለት ከፍተኛ ሙቀት',
  'climate.keyMinTemp': 'የዕለት ዝቅተኛ ሙቀት',
  'climate.rainPastDays': 'ያለፉት {count} ቀን ዝናብ',
  'climate.rainNextDays': 'የሚመጡ {count} ቀናት ዝናብ',
  'climate.rainNextNote': 'በሞዴል የተሠሩ የዕለት ድምሮች።',
  'climate.et0Today': 'ET0 ዛሬ',
  'climate.et0Note': 'FAO-56 ማጣቀሻ ትንሙከት-ትነፍስ።',
  'climate.rainProbToday': 'የዝናብ ዕድል ዛሬ',
  'climate.dailyDetail': 'የዕለት ዝርዝር',
  'climate.thDate': 'ቀን',
  'climate.thKind': 'ዓይነት',
  'climate.thRainMm': 'ዝናብ mm',
  'climate.thProbPct': 'ዕድል %',
  'climate.thMaxMin': 'ከፍተኛ / ዝቅተኛ °C',
  'climate.thHumidityPct': 'እርጥበት %',
  'climate.thWindKmh': 'ንፋስ km/h',
  'climate.thEt0Mm': 'ET0 mm',
  'climate.agroTitle': 'የእርሻ አየር ንብረት ጥናት · {place}',
  'climate.agroHint':
    'ለዚህ ግሪድ ሴል የNASA POWER የዕለት ገጽታ ዋጋዎች። መስኮቱ የሚያልቀው ትናንሽ ሲሆን ምክንያቱ POWER የእንደገና-ትንተና ውጤት በ1–3 ቀን ዕጉይት ስለሚያወጣ ነው።',
  'climate.loadingPower': 'NASA POWER በማንበብ ላይ',
  'climate.normalMarker': 'መደበኛ mm/ቀን',
  'climate.keyDailyRain': 'የዕለት ዝናብ — የPOWER ትምዘታዎች',
  'climate.keyNormal': 'የአየር ንብረት መደበኛ ፊሽካ ገመድ mm/ቀን',
  'climate.rainWindowDays': 'ዝናብ {count} ቀን',
  'climate.meanDailyMax': 'አማካይ የዕለት ከፍተኛ',
  'climate.meanDailyMin': 'አማካይ የዕለት ዝቅተኛ',
  'climate.meanShortwave': 'አማካይ አጭር ሞገድ',
  'climate.anomalyTitle': 'የዝናብ መዛባት — እዚህ የተሰላ እንግዳ ያልተታተመ',
  'climate.anomalyBody': 'በ{period} ውስጥ {observed} mm የዘነበ ሲሆን የአየር ንብረት መደበኛው {expected} mm ነበር፦',
  'climate.anomalyNotComputable': 'ከተመለሰው መረጃ ሊሰላ አልተቻለም',
  'climate.anomalyRatio':
    'የሁለት የተታተሙ መጠኖች ድርሻ (የPOWER ዕለታዊ ከPOWER የ30 ዓመት መደበኛዎች ጋር ለተመሳሳዩ ሴል)። መሸፈኑ {has}/{requested} ቀናት',
  'climate.anomalySparse': ' — እንደ የወረፋ ጠቅላላ ለማቅረብ በጣም የተበተነ',
  'climate.noAnomalyTitle': 'ምንም መዛባት አያሳይም',
  'climate.noAnomalyBody':
    'የመደበኛ ሁኔታ መጠየቁ አልተሳካም ({reason})። ከላይ ያለው የተመዘገበ ዝናብ ግን እውነት ነው።',
  'climate.satelliteTitle': 'ለዚህ ነጥብ የሳተላይት ልኬት',
  'climate.satelliteHint':
    'ከተታተመው ሳሙና ለዚህ ትክክለኛ ኮርዲናት የተነበበ ፊዚካዊ ዋጋ — በአቅራቢው በራሱ የተዘጋጀ የቀለም ካርታ የተተረ᎐።',
  'climate.ndviTitle': 'የእጽዋ አረንጓዴነት (NDVI፣ የ8 ቀን ድብልቅ)',
  'climate.imergTitle': 'የዝናብ መጠን (GPM IMERG)',
  'climate.satelliteFootnote':
    'የተወሰደው ክፍል አንድ የሳሙና ፒክሰል ብቻ ነው — ስፋቱ በመቶ ሜትር — የገበሬው እርሻ መሬት አይደለምም። ሁለቱም ምርቶች ምርትንም ሆነ የአፈር ሁኔታን አይለኩም፤ ከላይ ያለው የወሰን ጽሑፍ የአቅራቢው የራሱ ነው።',
  'climate.fetchingTile': 'ሳሙና በማምጣት ላይ',
  'climate.noValue': 'ዋጋ የለም',
  'climate.publishedBand': 'የተታተመ ወሰን፦ “{band}”።',
  'climate.noMappedValue': 'ይህ ፒክሰል የተሰየመ ዋጋ ስለሌለው ምንም አይገለጽም።',
  'climate.sceneDate': 'የምስሌ ቀን',
  'climate.pixelSize': 'ፒክሰል ≈',
  'climate.outsideEthiopiaSuffix': ' — ከኢትዮጵያ ውጭ',
  'climate.whatItMeans': 'ትርጉሙ፦',
  'climate.limitLabel': 'ገደብ፦',

  // --- Markets module ---
  'markets.description':
    'በWFP rEMS የክትትል ፕሮግራምና በFEWS NET ሳምንታዊ የገበያ ክትትል በኢትዮጵያ ገበያዎች የተጠኑ ዋጋዎች — እያንዳንዱ አቅራቢ በመዘገበው ምንዛሪና መለኪያ መሠረት። እዚህ ምንም በሞዴል አልተሰራም፣ አይተነብይም፣ በጭራሽ አልሞላም፦ ምላሽ ያልጠቀም ምንጭ አይገኝም ብሎ ይታያል።',
  'markets.badgeLiveSurvey': 'ቀጥታ ክትትል',
  'markets.surveyMonth': 'የክትትል ወር',
  'markets.historyTitle': 'በኢትዮጵያ ገበያዎች የዋጋ ታሪክ',
  'markets.historyHint':
    'በአንድ ጊዜ አንድ ተከታታይ — እቃ፣ አቅራቢው ያመዘገበው መለኪያና አንድ የዋጋ ዓይነት። አማካይው፣ ዝቅተኛውና ከፍተኛው እዚህ ከተመዘገቡት ረድፎች ላይ ተሰልተዋል — ዋጋ ባልኖረበት ወረፍ መስመሩ ከመሃል መተሳሰር ይልቅ ይቋረጣል።',
  'markets.commodity': 'እቃ',
  'markets.loadingHistory': 'የ{commodity} ታሪክ በመጫን ላይ',
  'markets.noSeriesTitle': 'ምንም ተከታታይ አልሳለም',
  'markets.noSeriesBody': 'በዚህ መለኪያ፣ የዋጋ ዓይነትና ወረፍ ውስጥ ለ{commodity} ምንም ክትትል ዋጋ ስላልዘገበ ምንም መስመር አይሳልም፤ ዋጋም አይፈጠርም።',
  'markets.unitsNote':
    'ዋጋዎቹ የክትትል ሠራተኛው በመዘገበው ምንዛሪና መለኪያ ውስጥ ናቸው — ቸኮላና ማከላከያ በአንድ አማካይ ውስጥ በጭራሽ አይዋሃዱም፣ የአንድ እቃ ሁለት መለኪያዎች ሁለት የተለያዩ ተከታታዮች ሆነው ይቀራሉ።',
  'markets.crossMarketTitle': 'ክፍለ ሀገሮችና ገበያዎች · አንድ የክትትል ወር',
  'markets.crossMarketHint':
    'አንድ እቃ፣ አንድ መለኪያ፣ አንድ የዋጋ ዓይነትና አንድ ወር — እነዚህ ክትትሎች የሚደግፉት አንዱ ማወዳደሪያ ነው። ልዩነቱና ከዝቅተኛው ላይ የሚመዘነው በመቶኛ እዚህ በተመዘገቡ የገበያ አማካዮች ላይ ያደርገነው ስሌት ነው።',
  'markets.region': 'ክፍለ ሀገር',
  'markets.allRegions': 'ሁሉም ክፍለ ሀገሮች',
  'markets.loadingLatest': 'አዲሱን የክትትል ወር በመጫን ላይ',
  'markets.thMarket': 'ገበያ',
  'markets.thLatest': 'አዲሱ',
  'markets.thChange': 'ለውጥ',
  'markets.vs': 'ከ',
  'markets.fxTitle': 'የኢትዮጵያ ውጭ ምንዛሪ — ሦስት የተለያዩ ምድቦች',
  'markets.fxHint':
    'መንግሥታዊው ልወጣ የNBE ዕለታዊ መመሪያ ማሳያ ነው፣ የከፋፈለ ገበያው ደግሞ የዓለም ባንክ ወርሃዊ ብሔራዊ አማካይ ሲሆን መነሻ ደረጃው ዓመታዊ ቁጥር ነው። እነዚህ የተለያዩ ዓይነት ቁጥሮች ስለሆኑ ለየብቻ ይታያሉ።',
  'markets.loadingFx': 'NBE እና ዓለም ባንክ በመጫን ላይ',
  'markets.officialLabel': 'መንግሥታዊ · የNBE ዕለታዊ መመሪያ',
  'markets.parallelLabel': 'የከፋፈለ ገበያ · የዓለም ባንክ ወርሃዊ ብሔራዊ አማካይ',
  'markets.benchmarkLabel': 'መነሻ ደረጃዎች · የዓለም ባንክ ዓመታዊ ጠቋሚዎች',
  'markets.etbPerUsd': 'ETB ለአንድ US$',
  'markets.officialNote':
    'ለእያንዳንዱ የተታተመ የግብይት ቀን አንድ አምድ። ይህ የማዕከላዊ ባንክ የወሰነው ማጣቀሻ ልወጣ እንግዳ ለእርስዎ የብር ልውውጥ ቢሮ የሚሰጥ ልወጣ አይደለም።',
  'markets.parallelNote':
    'የወርሃዊ ክትትል አማካይ እንግዳ ዕለታዊ ማስታወሻ አይደለም፦ አዲሱ ነጥብ ዓለም ባንክ ያዘጋጀው የመጨረሻው ወር ሲሆን ከዛሬ በወሮች ሊዘገይ ይችላል።',
  'markets.publishedFrequency': 'የተታተመ {frequency}',
  'markets.referencePeriod': 'ማጣቀሻ {period}',
  'markets.annualTitle': 'ዓመታዊ ተከታታይ — በዕጉይት የተታተመ',
  'markets.annualBody': 'ለአውድ ብቻ — እነዚህ የአሁኑ ወር ዋጋዎች አይደሉም።',
  'markets.noRowsTitle': 'ምንም ረድፎች አልተመለሱም',
  'markets.noRowsBody': '{label}፦ ይህ ምላሽ ምንም ረድፍ ሳይዞ ሄደዋል — ለእነሱም ምንም አልተተካም።',

  // --- Markets module · shared registries ---
  'markets.sectionPicker': 'የክፍል እይታ',
  'markets.publishers': 'የኢትዮጵያ ገበያ ክትትሎች',
  'markets.unavailableTitle': 'ምንም የገበያ አቅራቢ መላክቶ አልተመለሰም',
  'markets.unavailableBody':
    'በዚህ ገጽ ላይ ያለው እያንዳንዱ ቁጥር በመጠየቅ ሰዓት ከክትትል የተነበበ ስለሆነ አቅራቢዎች ሲያመልጡ ምንም ማሳየት የለም። ምንም አልተተካም፤ ከታች ያለው ሪፖርት እያንዳንዱን አቅራቢና የራሱ ጥያቄ ምን እንደመለሰ ይላል።',
  'markets.contributing': 'በዚህ ምላሽ ውስጥ',
  'markets.coverageClean': '{rows} ረድፎች ተዛምደዋል፤ እያንዳንዳቸው የተታተመ ቁጥር አላቸው።',
  'markets.coverageWithGaps':
    '{rows} ረድፎች ተዛምደዋል፣ ከነሱ {gaps} የተታተመ ቁጥር የላቸውም — ባዶ ሳጥኖች የክትትል ክፍተቶች ናቸው እንግዳ ዜሮ ዋጋ አይደሉም።',
  'markets.ofCount': 'ከ{total}',
  'markets.noSpan': 'አንድ የክትትል ቀን ብቻ።',
  'markets.months': 'ወራት',
  'markets.weeks': 'ሳምንታት',
  'markets.lastWindow': 'የመጨረሻዎቹ {count} {unit}',
  'markets.col.markets': 'ገበያዎች',
  'markets.col.months': 'ወራት',
  'markets.col.periods': 'ጊዜያት',
  'markets.col.rows': 'ረድፎች',
  'common.unit': 'መለኪያ',
  'dataType.market-survey': 'የገበያ ክትትል',
  'dataType.reference-price': 'የማጣቀሻ ዋጋ',
  'dataType.projection': 'ትንቢያ',
  'dataType.administrative': 'አስተዳደራዊ ድንበር',
  'freshness.current': 'ወቅታዊ',
  'freshness.recent': 'ቅርብ ጊዜ',
  'freshness.stale': 'ከግዢ ሰዓት በኋላ',
  'freshness.historical': 'የታሪክ መዝገብ',
  'freshness.unknown': 'የማይጠቅም ቀን የለም',
  'statusLabel.historical': 'የታሪክ መዝገብ',
  'markets.state.access_challenged': 'መዳረሻ ተጠይቋል',
  'markets.granularity.weekly': 'ሳምንታዊ',
  'markets.granularity.monthly': 'ወርሃዊ',
  'markets.flag.actual': 'የተመለከተ',
  'markets.flag.aggregate': 'የተሰበሰበ',
  'markets.flag.replaced': 'የተተካ ቁጥር',
  'markets.flag.unknown': 'ደረጃ የለሽ',

  // --- Markets module · tabs ---
  'markets.tab.overview': 'አጠቃላይ እይታ',
  'markets.tab.prices': 'የዋጋ መመርመሪያ',
  'markets.tab.history': 'የዋጋ ታሪክ',
  'markets.tab.regions': 'ክፍለ ሀገሮችና ገበያዎች',
  'markets.tab.insights': 'መረጃው የሚያሳየው',
  'markets.tab.exchange': 'ውጭ ምንዛሪ',
  'markets.tab.sources': 'ምንጮች',

  // --- Markets module · overview ---
  'markets.ov.observations': 'የተታተሙ ዋጋዎች',
  'markets.ov.observationsNote': '{rows} የተጠኑ ረድፎች ቁጥር የላቸውም፤ እንደ ክፍተት ተዘርዝረዋል።',
  'markets.ov.commodities': 'የተሸፈኑ እቃዎች',
  'markets.ov.commoditiesNote': 'በ{units} የአቅራቢ መለኪያዎች — ለዘላቸው በአንድ አይዋሃዱም።',
  'markets.ov.markets': 'የተጠኑ ገበያዎች',
  'markets.ov.marketsNote': 'በ{regions} ክፍለ ሀገሮች ውስጥ፤ {mapped} የአቅራቢ መጋጠሚያ አላቸው።',
  'markets.ov.periods': 'የክትትል ጊዜያት',
  'markets.ov.periodsNote': 'የተለያዩ የመረጃ ቀናት — በ{months} ወራት ላይ የተሰራጩ።',
  'markets.ov.coverageTitle': 'እነዚህ ክትትሎች በእውነት የሚሸፍኑት',
  'markets.ov.coverageHint':
    'የተታተሙ ረድፎች ብዛት ብቻ — አማካይ የለም፣ ማውጫ የለም፣ ክትትል ያልመዘገበውም እቃ የለም።',
  'markets.ov.newest': 'አዲሱ መረጃ',
  'markets.ov.newestNote': 'የራሱን አቅራቢ ጊዜ ሰዓት መሠረት በማድረግ {tier} ተብሎ ተመድቧል።',
  'markets.ov.oldest': 'የጤ ለጤው መረጃ',
  'markets.ov.span': 'የክትትል ወራት ከ{from} እስከ {to} ይሄዳሉ።',
  'markets.ov.publishers': 'መላክቶ የተመለሱ አቅራቢዎች',
  'markets.ov.publishersNote': 'እያንዳንዱ ለየብቻ ስለሚጫን አንድ ስህተት ይህን ገጽ ማንሳት አይችልም።',
  'markets.ov.currencies': 'እንደተታተሙ ምንዛሪዎች',
  'markets.ov.units': 'እንደተታተሙ መለኪያዎች',
  'markets.ov.unitsNote': 'የ100 KG ዋጋና የKG ዋጋ ሁለት ተከታታይ ናቸው — አንድ አማካይ አይደሉም።',
  'markets.ov.priceTypes': 'የዋጋ ዓይነቶች',
  'markets.ov.granularities': 'አቅራቢዎች የሚደግፉት የሰውጥ ልኬት፦ {list}።',
  'markets.ov.catalogTitle': 'የተታተሙ ዋጋ ያላቸው እቃዎች',
  'markets.ov.catalogHint':
    'ምን ያህል ገበያዎች ቁጥር እንደሰጡ መሠረት ተደርድረዋል። ዝርዝሩ የሚነበበው ከክትትል ረድፎቹ ራሳቸው ስለሆነ አቅራቢ ያልጠየው እቃ ባዶ ሳይሆን ጠፍቶ ይታያል።',
  'markets.ov.catalogTruncated': 'ከ{total} የእቃና መለኪያ ተከታታዮች ውስጥ ጥልቅ የሆኑት {shown} ብቻ ታይተዋል፤ መመርመሪያው ሁሉንም ይዘረዝራል።',
  'markets.ov.qualityTitle': 'ክፍሉ የሚያየው የመረጃ ጥራት',
  'markets.ov.qualityHint': 'እነዚህ ሁሉ የተታተሙ ረድፎች ብዛት ናቸው — የመሸፈኛ እውነታ እንግዳ ማስተካከያ አይደሉም።',
  'markets.ov.gaps': 'ቁጥር የሌላቸው ረድፎች',
  'markets.ov.gapsNote': 'እንደ ባዶ ሳጥን ቀርተዋል። ዜሮ ሌላ ዓይነት ድምዳሜ ነው።',
  'markets.ov.duplicates': 'የተወገዱ ደጋጋሚ ረድፎች',
  'markets.ov.duplicatesNote':
    'አንድ አቅራቢ፣ ገበያ፣ እቃ፣ መለኪያ፣ የዋጋ ዓይነትና ቀን፤ ቁጥር ያለው ረድፍ ብቻ ቀርቷል።',
  'markets.ov.unmapped': 'መጋጠሚያ የሌላቸው ገበያዎች',
  'markets.ov.unmappedNote': '{mapped} ገበያዎች በካርታ ሊቀመጡ ይችላሉ። ወደፊኞቹ በሰንጠረዥ ብቻ ይቆያሉ እንግዳ በማሰብ አይቀመጡም።',
  'markets.ov.seasonal': 'ለወቅት ለመነጋገር በቂ ጥልቀት ያላቸው ተከታታዮች',
  'markets.ov.seasonalNote': 'ቢያንስ አስራ ሁለት የክትትል ወራት በአንድ መለኪያና የዋጋ ዓይነት።',
  'markets.ov.limitTitle': 'ይህ ክፍል ሊል ያልችለው',
  'markets.ov.limitBody':
    'እነዚህ በየተሰየሙ ገበያዎች የተጠኑ የቸኮላና ማከላከያ ዋጋዎች ናቸው — ብሔራዊ የዋጋ ማውጫ አይደሉም፣ የእርሻ በር ዋጋ አይደሉም፣ ትንቢያም አይደሉም። ምንም ምርት፣ ገቢ ወይም ቁጠባ አልተገለጸም፤ ቁጥር የሌለው የክትትል ወር እንደ ክፍተት ይቆያል።',

  // --- Markets module · coverage scope ---
  'markets.scope.title': 'ይህ የውሂብ ስብስብ ምን ይሸፍናል',
  'markets.scope.body': 'እነዚህን ቁጥሮች እንደ የተደረጉ መረጃ-ሰብሰቦች ወሰን እንጂ እንደ የኢትዮጵያ ገበያ ሁኔታ አታዩ።',
  'markets.scope.markets': '{markets} ገበያዎች በ{regions} ክልሎች፣ በ{dates} የምርመራ ቀናት።',
  'markets.scope.publishers': 'እዚህ ያለው እያንዳንዱ ዋጋ በ{publishers} የታተመ የምርመራ ምልከታ ነው።',
  'markets.scope.age': 'የቅርቡ ምልከታ {date} ሲሆን ዕድሜው {age} ነው።',
  'markets.scope.priceTypes': 'ዋጋዎች እንደ {types} በ{currencies} ታትመዋል። ሌሎች የዋጋ ዓይነቶችና ሌሎች ምንዛሪዎች አሳታሚው ሲያስመዘግቡ ብቻ ይታያሉ።',
  'markets.scope.notNationwide': 'ይህ አገሪቱን ሁሉ ሸፍኖ አይደለም፤ ምርመራዎቹ ወደ ላሉባቸው ገበያዎችና ክልሎች በዝርዝሮቹ ውስጥ አይገኙም፣ በዜሮም አይቀርቡም።',
  'markets.scope.refused': 'አይገኝም፦ {publishers} ለዋጋ ፋይሉ HTTP {status} መልሷል። አሳታሚው ተያይዟል፤ ለዝርዝሮቹ ምንም ግምት አልተተካም።',
  'markets.scope.refusedChallenge':
    'አይገኝም፦ የ{publishers} የቦት ጥበቃ ራስ-ሰር የፋይል መዳረሽን ውድቅ ያደርጋል። አሳታሚው ተያይዟል፤ ለዝርዝሮቹ ምንም ግምት አልተተካም።',
  'markets.ov.ageLabel': 'የቅርቡ ምልከታ ዕድሜ',
  'markets.ov.ageNote': 'አሳታሚው {cadence} ይለቃል፤ የዕድሜ ደረጃው {tier} ነው።',
  'markets.age.today': 'በዚያው ቀን',
  'markets.age.oneDay': 'ወደ አንድ ቀን',
  'markets.age.days': '{n} ቀናት',
  'markets.age.weeks': 'ወደ {n} ሳምንታት',
  'markets.age.months': 'ወደ {n} ወራት',
  'markets.src.coverageCounts': '{dates} የምርመራ ቀናት · {markets} ገበያዎች · {commodities} የእቃ+መለኪያ ተከታታይ',
  'markets.src.noRowsRetrieved': 'ምንም ዝርዝር ስላልተገኘ መሸፈን አልታወሰም',

  // --- Markets module · explorer ---
  'markets.ex.title': 'የዋጋ መመርመሪያ',
  'markets.ex.hint':
    'በአንድ ጊዜ አንድ ገጽ የተታተሙ ረድፎች። ማጣሪያዎች በክትትሎች ውስጥ ባሉ እሴቶች ብቻ ይሰይሙናል፤ ቁጥር የሌለው ረድፍ ባዶ ሳጥን ሆኖ ይቆያል።',
  'markets.ex.search': 'ገበያ ወይም እቃ ፈልግ',
  'markets.ex.searchPlaceholder': 'ለምሳሌ መቀለ ወይም ጤፍ',
  'markets.ex.allCommodities': 'ሁሉም የተታተሙ እቃዎች',
  'markets.ex.allMarkets': 'ሁሉም ገበያዎች',
  'markets.ex.allSources': 'ሁሉም አቅራቢዎች',
  'markets.ex.anyUnit': 'ማንኛውም መለኪያ',
  'markets.ex.anyPriceType': 'ማንኛውም የዋጋ ዓይነት',
  'markets.ex.priceType': 'የዋጋ ዓይነት',
  'markets.ex.surveyRange': 'የክትትል መስኮት',
  'markets.ex.surveyRangeHint': 'በአቅራቢዎች ራሳቸው የመረጃ ቀናት ላይ የተጣራ።',
  'markets.ex.fromDate': 'ከዚህ ቀን ጀምሮ',
  'markets.ex.toDate': 'እስከዚህ ቀን',
  'markets.ex.pricedOnly': 'ቁጥር ያላቸው ረድፎች ብቻ',
  'markets.ex.clear': '{count} ማጣሪያ አጽዳ',
  'markets.ex.clearAll': 'ሁሉንም ማጣሪያ አጽዳ',
  'markets.ex.loading': 'የተታተሙ የዋጋ ረድፎች በመጫን ላይ',
  'markets.ex.sourceLabel': 'የኢትዮጵያ ገበያ ክትትሎች',
  'markets.ex.emptyTitle': 'ከእነዚህ ማጣሪያዎች ጋር የሚዛመድ የተታተመ ረድፍ የለም',
  'markets.ex.emptyHint':
    'ማጣሪያዎች የአቅራቢውን ራሱ ጽሕፈት በትክክል ስለሚከተሉ ምንም ክትትል ያልናገረው ጥምረት ባዶ ይመልሳል። ሰንጠረዡን ለሙላት ምንም አይፈጠርም።',
  'markets.ex.tableCaption': 'የተታተሙ የኢትዮጵያ ገበያ ዋጋ መረጃዎች',
  'markets.ex.sortAria': 'በ{label} ደርድር',
  'markets.ex.price': 'ዋጋ',
  'markets.ex.quality': 'ዓይነትና ጥራት',
  'markets.ex.freshness': 'አዲስነት',
  'markets.ex.noFigure': 'ይህ የክትትል ሳጥን የተታተመ ቁጥር የለውም',
  'markets.ex.perUnit': 'ለ{unit}',
  'markets.ex.prev': 'ቀዳሚ',
  'markets.ex.next': 'ቀጣይ',
  'markets.ex.pageOf': 'ገጽ {page} ከ{pages}',
  'markets.ex.perPage': 'በገጽ ረድፎች',
  'markets.ex.matched': '{total} ረድፎች ከእነዚህ ማጣሪያዎች ጋር ተዛምደዋል',
  'markets.ex.window': 'በዚህ ውጤት ውስጥ አዲሱ {newest}፤ የጤ ለጤው {oldest}።',
  'markets.ex.staleTitle': 'አንዳንድ ረድፎች ከአቅራቢያቸው ጊዜ ሰዓት በስጋት ላይ ናቸው',
  'markets.ex.staleBody':
    'አዲስነት የሚመዘኑት በእያንዳንዱ አቅራቢ ራሱ በሚገልጸው ጊዜ ሰዓት ስለሆነ ሳምንታዊና ወርሃዊ ክትትል በአንድ ሰዓት አይዳነም።',
  'markets.ex.export': 'CSV ላክ',
  'markets.ex.exportHint':
    'ከገጽ {page} ከ{pages} የሆኑትን {rows} ረድፎች ሁሉም የአቅራቢ መለኪያ፣ ምንዛሪ፣ የክትትል ቀን፣ የተገኘበት ሰዓትና የምንጅ አድራሻ አድርጎ ይላካል። መረጃው በፎርሙላ እንዳይሄድ የፊት ቁምፊዎች ተከልክለዋል።',

  // --- Markets module · history ---
  'markets.hist.granularity': 'የስብስብ ልኬት',
  'markets.hist.windowLabel': 'የታዩ ጊዜያት',
  'markets.hist.unitHint': 'የአቅራቢው መለኪያ — መቀየሩ ተከታታዩን ይቀይረዋል።',
  'markets.hist.average': 'የጊዜ አማካይ',
  'markets.hist.lowest': 'ዝቅተኛው ቁጥር',
  'markets.hist.highest': 'ከፍተኛው ቁጥር',
  'markets.hist.derivedNote': 'ከተታተሙ ረድፎች እዚህ የተሰላ።',
  'markets.hist.latestNote': '{when} የተጠነ — በ{markets} ገበያዎች።',
  'markets.hist.lowestNote': '{when} ተመዝግቧል።',
  'markets.hist.highestNote': '{when} ተመዝግቧል።',
  'markets.hist.change': 'በክትትል ጊዜያት መካከል {direction} {pct}%',
  'markets.hist.up': 'ጨምሯል',
  'markets.hist.down': 'ቀንሟል',
  'markets.hist.seriesNote':
    '{commodity} · {unit} · {retail}፦ ቁጥር ባላቸው {periods} ጊዜያት — እነሱን በሰጡ {markets} ገበያዎች።',
  'markets.hist.fallbackTitle': 'ወርሃዊ ተሳልቷል',
  'markets.hist.fallbackBody':
    '{commodity}ን የሚያቀርብ ማንም አቅራቢ በሳምንት ክትትል አያደርግም፤ ስለዚህ ይህ ተከታታይ በየክትትል ወሩ ተከፋፍሏል። ሳምንታዊ መስመር ማንም ያላየባቸውን ቀናት ይሳላል።',
  'markets.hist.gapTitle': 'የተታተመ ቁጥር የሌለባቸው ጊዜያት',
  'markets.hist.gapBody':
    'በዚህ መስኮት ውስጥ ያሉ {count} ጊዜያት ምንም ዋጋ አላመጡም። መስመሩ በእያንዳንዱ ክፍተት ይቋረጣል፤ ምንም አይሞላም።',
  'markets.hist.onePoint':
    'በዚህ መስኮት ውስጥ {count} ጊዜ ብቻ ቁጥር ስላለው የአዝማሚያ መስመር አይሳልም — አንድ ነጥብ አዝማሚያ አይደለም።',
  'markets.hist.byMarketTitle': 'ተመሳሳሊ ስታቲስቲክስ በየገበያው',
  'markets.hist.byMarketHint':
    'እያንዳንዱ ረድፍ በአንድ እቃ፣ መለኪያና የዋጋ ዓይነት ውስጥ ያለ አንድ ገበያ ነው። የመቶኛ ለውጥ ቁጥር ባላቸው ሁለት የቅርብ ጊዜ ጊዜያት ላይ የረሳ ስሌት ነው።',
  'markets.hist.publishersInSeries': 'በዚህ ተከታታይ ውስጥ ያሉ ረድፎች የመጡት፦ {list}።',
  'markets.hist.recheck': 'ይህን ተከታታይ ከአቅራቢው እንደገና አንብብ',

  // --- Markets module · regions ---
  'markets.reg.monthHint': 'ለዚህ እቃ የተታተመ ቁጥር ባላቸው ወራት ብቻ ይቀርባሉ።',
  'markets.reg.marketsShown': '{count} ገበያዎች ዘግበዋል',
  'markets.reg.cheapest': 'አነስተኛ ዋጋ ያለው ገበያ',
  'markets.reg.dearest': 'ከፍተኛ ዋጋ ያለው ገበያ',
  'markets.reg.atMarket': 'በ{market}።',
  'markets.reg.spread': 'ከፍተኛው ከዝቅተኛው በላይ',
  'markets.reg.spreadNote': 'በዚህ ወር ባሉ ሁለት የገበያ አማካዮች መካከል እዚህ የተሰላ — በአንድ መለኪያና የዋጋ ዓይነት።',
  'markets.reg.singleMarket':
    'በዚህ ወር ለዚህ እቃ፣ መለኪያና የዋጋ ዓይነት አንድ ገበያ ብቻ ስለተታተመ ሊነገር የሚችል ልዩነት የለም።',
  'markets.reg.noneTitle': 'በዚህ ወር የተታተመ ቁጥር የለም',
  'markets.reg.noneBody':
    'በ{month} ክትትሎች ለ{commodity} በ{unit} በተመረጠው የዋጋ ዓይነት ምንም ዋጋ አልሰጡም። ሌላ ወር ይምረጡ እንግዳ ባዶ ንጽጽርን ዋጋው ያነሰ ብሎ አያንብቡት።',
  'markets.reg.mapTitle': 'አቅራቢው እነዚህን ገበያዎች የየት ይገድፋል',
  'markets.reg.mapHint':
    'እያንዳንዱ ነጥብ አቅራቢው ለዚያ ገበያ ያተተመው መጋጠሚያ ላይ ሲቀመጥ የgeoBoundaries አስተዳደራዊ ድንበሮች ላይ ይገኛሉ። መጋጠሚያ የሌለው ገበያ ከካርታው ይቀራልና በሰንጠረዡ ውስጥ ይቆያል።',
  'markets.reg.mapAria': 'በየተታተሙ መጋጠሚያቸው የቀመጡ {count} የተጠኑ የኢትዮጵያ ገበያዎች ካርታ',
  'markets.reg.ramp': 'ከግራ {low} ወደ ቀኝ {high} {currency} ለ{unit}',
  'markets.reg.plotted': '{plotted} ከ{total} ገበያዎች በካርታ ቀምተዋል',
  'markets.reg.unplottedNote': 'ወደፊኞቹ የአቅራቢ መጋጠሚያ የላቸውም።',
  'markets.reg.loadingOutlines': 'አስተዳደራዊ ድንበሮች በመጫን ላይ…',
  'markets.reg.outlineNote':
    'አስተዳደራዊ ድንበሮች መጫን ስላልቻሉ የገበያ ነጥቦቹ ያለ እነሱ ታይተዋል። ምንም ድንበር በmemory አይሳልም።',
  'markets.reg.byRegionTitle': 'ለወሩ የክፍለ ሀገር አማካዮች',
  'markets.reg.byRegionHint': 'በአንድ ክፍለ ሀገር ውስጥ ባሉ የተጠኑ ገበያዎች አማካይ — በአቅራቢው ራሱ የክፍለ ሀገር ስሞች።',
  'markets.reg.regionMarkets': '{count} ገበያዎች ተጥነዋል · ለ{unit}',
  'markets.reg.tableTitle': 'ገበያ በገበያ',
  'markets.reg.tableCaption': 'በአንድ የክትትል ወር ውስጥ በገበያዎች መካከል የተነጻጸረ አንድ እቃ፣ መለኪያና የዋጋ ዓይነት',
  'markets.reg.tableNote': 'በ{month} ውስጥ {markets} ገበያዎች ለዚህ ተከታታይ ቁጥር አሳውመዋል።',
  'markets.reg.price': 'ዋጋ',
  'markets.reg.aboveCheapest': 'ከዝቅተኛው በላይ',
  'markets.reg.hasCoords': 'የአቅራቢ መጋጠሚያ',
  'markets.reg.noCoords': 'መጋጠሚያ አልተታተመም',
  'markets.reg.publisherNote': 'የተቀበለው፦ {list}።',

  // --- Markets module · insights ---
  'markets.ins.title': 'መረጃው የሚደግፈው',
  'markets.ins.hint':
    'እያንዳንዱ ግኝት ከኋላው ያለውን ተከታታይ፣ ገበያዎች፣ የረድፍ ብዛትና ጊዜ ይላልና የራሱን ገደብ ይዞ ይመጣል። ተዛማጅነት ምክንያት ተብሎ በጭራሽ አይጠራም፤ ዋጋም ወደፊት አይተነብይም።',
  'markets.ins.noneTitle': 'ምንም ግኝት የመረጃ መስፈርት አላሟላም',
  'markets.ins.noneBody':
    'ለእንቅስቃሴ ተከታታይ ሁለት የክትትል ጊዜያት በእውነተኛ ቁጥሮች ያስፈልጋሉ፤ ለልዩነት ደግሞ በአንድ ወር ተመሳሳይ እቃ፣ መለኪያና የዋጋ ዓይነት የሰጡ ቢያንስ ሁለት ገበያዎች ያስፈልጋሉ። እነዚህ ሁኔታዎች በማይሟሉበት ቦታ ምንም ድምዳሜ አይደረግም።',
  'markets.ins.kind.price-rise': 'የዋጋ ጭማሪ',
  'markets.ins.kind.price-fall': 'የዋጋ ቅናሽ',
  'markets.ins.kind.market-spread': 'በገበያዎች መካከል ያለ ልዩነት',
  'markets.ins.kind.seasonal-coverage': 'የመሸፈኛ ጥልቀት',
  'markets.ins.kind.market-outdated': 'በቅርብ ጊዜ የላተሙ ገበያዎች',
  'markets.ins.kind.thin-coverage': 'በአንድ ገበያ ያለ እቃ',
  'markets.ins.price-rise':
    'በ{market}፣ {commodity} ለ{unit} ({retail}) በ{to} ከ{from} በ{pct}% ከፍ ብሏል፣ ዋጋው {price}።',
  'markets.ins.price-fall':
    'በ{market}፣ {commodity} ለ{unit} ({retail}) በ{to} ከ{from} በ{pct}% ወርዷል፣ ዋጋው {price}።',
  'markets.ins.market-spread':
    'በ{month}፣ {commodity} ለ{unit} ({retail}) በ{dearest} ከ{cheapest} በ{pct}% ውጤ ሆኖ ተገኝቷል — በ{markets} ገበያዎች።',
  'markets.ins.seasonal-coverage':
    '{series} የእቃና መለኪያ ተከታታዮች ቢያንስ ዐሥራ ሁለት የክትትል ወራት አሏቸው፤ የበለጠ ጥልቀት ያለው {commodity} ለ{unit} ነው — {months} ወራት በ{markets} ገበያዎች።',
  'markets.ins.market-outdated':
    '{months} ገበያዎች ከ{lastMonth} በኋላ የክትትል ረድፍ የላቸውም፤ አዲሱ የክትትል ወር ግን {latestMonth} ነው — ከእነሱ መካከል {markets}።',
  'markets.ins.thin-coverage':
    '{commodity} ለ{unit} ({retail}) በአንድ ገበያ ብቻ ({market}) ስለተጠነ ስለእሱ የክፍለ ሀገር ድምዳሜ መስጠት አይቻልም።',
  'markets.insightLimit.change':
    'የአንድ ገበያ ራሱ ክትትል፣ ጊዜ በጊዜ። ይህ ብሔራዊ ማውጫ አይደለም፤ ዋጋው ለምን እንደተንቀሳቀሰም አያብራራም።',
  'markets.insightLimit.spread':
    'በአንድ ወር ውስጥ በሁለት የገበያ ክትትሎች መካከል ያለ ልዩነት። ማጓጓዣ፣ አካባቢያዊ አቅርቦትና የክትትል ጊዜ ሁሉ በአንድ ሰዓት ስለሚለያዩ ልዩነቱ ለአንዱ ብቻ አይመደብም።',
  'markets.insightLimit.seasonal':
    'የመሸፈኛ ጥልቀት ብቻ፦ ስንት ወራት እንደተታተሙ ይላል እንግዳ የወቅት ንድፍ አለ ወደማለት አይደለም።',
  'markets.insightLimit.coverage': 'ስለ ክትትሎቹ ራሳቸው የተሰጠ ድምዳሜ እንግዳ ስለ ገበያው አይደለም።',
  'markets.ins.seasonalTitle': 'አመት ወይም ከዚያ በላይ መሸፈኛ ያላቸው ተከታታዮች',
  'markets.ins.seasonalHint':
    'ቁጥር ባላቸው ወራች — በእቃ፣ በመለኪያና በየዋጋ ዓይነት። የወቅት ጥያቄ ሊነሳበት በሚችልበት ቦታ ማሳየት ዐላም ተዘርዝረዋል።',
  'markets.ins.wetVsDry': 'የደጋ ወራት ከሌሎች ጋር',
  'markets.ins.seasonalLimitation':
    'ይህ ቁጥር ሰኔ እስከ መስከረም ያሉትን ወራት ከሌሎች ወራች ጋር በተታተሙ ዓመታት ሁሉ ይነጻጽራል። የአንድ ዓመት ረድፍ ካለ ማንነቱን እንግዳ ንድፍን አይገልጽም፤ ትንቢያም በጭራሽ አይደለም።',
  'markets.ins.evidenceSeries': 'ተከታታይ',
  'markets.ins.evidenceRows': 'ረድፎች',
  'markets.ins.limitLabel': 'ገደብ',

  // --- Markets module · source report ---
  'markets.src.title': 'በአቅራቢ ደረጃ ሁኔታ',
  'markets.src.hint':
    'የዚህ ተሰማሪ ራሱ ጥያቄዎች ምን እንዳመለሱ በየአቅራቢው፦ ሁኔታ፣ አዲሱ መረጃ፣ የተገኘበት ሰዓት፣ መሸፈኛና የአቅራቢው ራሱ ካታሎግ።',
  'markets.src.none': 'ከዚህ ምላሽ ጋር ምንም የአቅራቢ ሪፖርት አልመለሰም።',
  'markets.src.answering': '{count} መልስተዋል',
  'markets.src.refusing': '{refused} አልቀበሉም · {silent} ጸጥ ብለዋል',
  'markets.src.chip': 'የቦት መከላከያ',
  'markets.src.publisherSite': 'የአቅራቢ ገጽ',
  'markets.src.challengeTitle': 'ይገኛልና የራራክ ማውረድ ይከልክላል',
  'markets.src.challengeBody':
    'የአቅራቢው የቦት መከላከያ ፋይሉን ከመስጥ ጥያቄአችንን መልስላል። ይህን ጠያቂ ስላልመልስን ወይም አሳሽን በማሳየት ስላልተጠቀምን ምንም ረድፍ አልተገኘም፤ ምንም አልተተካም። ከታች ያለው ካታሎግ የአቅራቢው ራሱ መረጃው እንዳለና መቼ እንደተቀየረ መግለጫ ነው።',
  'markets.src.outageTitle': 'ከዚህ አቅራቢ ምንም መልስ የለም',
  'markets.src.outageBody':
    'ጥያቄው የሚጠቅም ረድፍ አላመጣም፤ ስለዚህ ይህ አቅራቢ ከላይ ባሉ ቁጥሮች ላይ ምንም አበረክታ የለውም። የተቀመጣ ቅዳሜ ለወቅታዊ ንባብ ተተኪ ሆኖ በጭራሽ አይደረግም።',
  'markets.src.rows': 'የያዝኑ ረድፎች',
  'markets.src.publishedCount': 'አቅራቢው የሚቆጥረው',
  'markets.src.truncated': 'ከተታተመው ያነሰ',
  'markets.src.excluded': 'የተያዙ ረድፎች',
  'markets.src.excludedNote': 'ዋጋ የሆኑ አይደሉም — የደመወዝ ረድፎች ወይም እንደ ቁጥር የማንበብ ዕድል ያላገኙ ሳጥኖች።',
  'markets.src.coverage': 'መሸፈኛ',
  'markets.src.oldestObservation': 'የጤ ለጤው መረጃ',
  'markets.src.ageDays': 'ዕድሜ {days} ቀናት',
  'markets.src.retrieved': 'የተገኘበት',
  'markets.src.retrievalAge': 'በእኛ ማከማቻ {days} ቀናት',
  'markets.src.dataType': 'የቁጥር ዓይነት',
  'markets.src.catalogue': 'የአቅራቢው ራሱ ካታሎግ',
  'markets.src.catalogueReachable': 'ይገኛል — መረጃው የተቀየረው በመጨረሻው {modified}።',
  'markets.src.catalogueUnreachable': 'የካታሎግ መጨረሻ ነጥብም ምላሽ አልሰጠም።',
  'markets.src.notStated': 'ቀን አልተገለጸም',
  'markets.src.rowPaging': 'ረድፎች እንደ JSON በገጽ',
  'markets.src.fileOnly': 'ፋይሉን በሙሉ ማውረድ',
  'markets.src.httpTitle': 'ተሳኪ ጥያቄ ከወቅታዊ መረጃ ጋር አንድ ዓይነት ድምዳሜ አይደለም',
  'markets.src.httpBody':
    'ሁኔታ የሚነሳው ከHTTP ሁኔታ ሳይሆን አዲሱ የመረጃ ቀን አቅራቢው በሚገልጸው ጊዜ ሰዓት ሲመዘን ነው። አቅራቢ በሚሊሰከንድ ሊመልስና በራሱ ግዢ ሰዓት ሳምንታት ከኋላ ሆኖ ሊቆይ ይችላል፤ ይህ እንደ መንገድ መክፈት ሳይሆን እንደ ማዘጋየት ይዘገባል።',

  // --- Soil module ---
  'soil.pageDescription':
    'ለኢትዮጵያ እርሻዎች የአፈር ጥበቃና የመሸርሸር መከላከያ መመሪያዎች — እያንዳንዱ ልምድ ጊዜውን የሚያስቀምጠው የተመዘገበ ዝናብ አብሮት።',
  'soil.badgeRainfallObserved': 'የተመዘገበ ዝናብ',
  'soil.measuredTitle': 'የተለካ እና በሞዴል የተሰላ — ይህ ክፍል ሊነግርዎ የሚችለውና ማማለል የሚገባው',
  'soil.measuredBody':
    'IRSHAYE ለእርሻ መሬትዎ [[ምንም የአፈር ልኬቶች]] የሉትም። ከታች ያሉት የዝናብ ቁጥሮች ቀናቸው አብሮት ያላቸው ከNASA POWER የተመዘገቡ ልኬቶች ናቸው፤ ልምዶቹ ደግሞ ዋቢ ያላቸው የተመዘገቡ የተስፋፊ መመሪያዎች ናቸው። እዚህ ያለው ምንም የአፈርን ጥራት ወይም አሲዳማነት አይተነትንም — ለዚህ የአካባቢ ናሙናና ላብራቶሪ ያስፈልጋል።',
  'soil.measuredBodySecond':
    'የሳተላይት እጽዋ ማሳያዎች የአፈርን ጥራት ሳይሆን የዕጽዋ ሽፋንን ይገልጻሉ — በጭራሽ እንደ የአፈር መረጃ አይቀርቡም።',
  'soil.rainfallDriversTitle': 'በ{place} የዝናብ ምክንያቶች — ባለፉት 90 ቀናት',
  'soil.rainfallDriversHint':
    'የተመዘገበ የዕለት ዝናብ (NASA POWER)። ከባድ ዝናብ ያለባቸው ቀናት ለመሸርሸር መከላከያ ሥራ ተግባራዊ ምንሻው ናቸው።',
  'soil.loadingRainfall': 'የተመዘገበ ዝናብ በመጫን ላይ',
  'soil.heavyRainDays': 'የከባድ ዝናብ ቀናት (≥12 mm)',
  'soil.ofDaysWithData': 'መረጃ ካላቸው ቀናት ውስጥ',
  'soil.heavyRainNote': 'የድንኳን ስጋት ለመለየት የተጠቀመው ወሰን — የአፈር ልኬት አይደለም።',
  'soil.totalRainfall': 'በመስኮቱ ውስጥ ጠቅላላ ዝናብ',
  'soil.totalRainfallNote': 'አቅራቢው ባመለሳቸው {count} ቀናት ላይ ያለ ድምር።',
  'soil.recordCoverage': 'የመዝገብ መሸፈን',
  'soil.recordCoverageNote': 'ከተጠየቁት ቀናት መካከል የተታተመ ዋጋ ያላቸው ቀናት።',
  'soil.guidanceTitle': 'የጥበቃ መመሪያ',
  'soil.guidanceEmpty':
    'ለዚህ ክፍል ሊዋወስ የሚችል ምንጭ ባላቸው የተመረጡ ልምዶች ማኅደር ላይ በመሥራት ላይ ነው። እያንዳንዱ መዝገብ ሊዋወስ የሚችል ምንጭ እስኪኖረው ድረስ አያሳይም — IRSHAYE ያለ ዋቢ የግብርና ትዕዛዞችን አያቀርብም። እስካሁን ከላይ ያለው የዝናብ አውድ ሙሉ በሙሉ ይሠራል።',
  'soil.practicesLabel': 'የተመዘገቡ የጥበቃ ልምዶች',
  'soil.whenToAct': 'መቼ መሥራት ሲባል',

  // --- Settings module ---
  'settings.pageDescription':
    'በዚህ ገጽ ላይ ያለው እያንዳንዱ ቁጥጥር እውነተኛ ሥራ ይሠራል። መለያዎችና የጋራ የሥራ ቦታዎች የራሱ የሆነው የIrshaye Supabase ፕሮጀክት ሲዘጋጅ ይመጣሉ — እስካሁን ግን ቅንብሮች በዚህ መሣሪያ ላይ ብቻ ይቀመጣሉ።',
  'settings.savedContext': 'የተቀመጠው አውድዎ',
  'settings.savedContextHint':
    'በዚህ አሳሽ ውስጥ ተቀምጧል። የአጠቃላይ እይታውን የሥራ ሂደትና የእያንዳንዱን ክፍል ነባሪ አካባቢ ያንቀሳቅሳል።',
  'settings.crop': 'ሰብል',
  'settings.noCuratedProfile': 'እስካሁን የተዘጋጀ መግለጫ የለም',
  'settings.storage': 'ማከባበሪያ',
  'settings.storageDeviceOnly': 'በዚህ መሣሪያ ላይ ብቻ — ምንም መለያ አይፈጠርም',
  'settings.appearanceHint':
    'ግርዶሹ ገጽታ የዋጋ ዓይነት ቀለሞቹን ጠብቶ ይይዛል — ስለዚህ ትንቢት ወይን ቀለም፣ የተመዘገበው ደግሞ አረንጓዴ ሁለቱም ገጽታዎች ውስጥ ይቆያሉ።',
  'settings.switchToLight': 'ወደ ብሩህ ቀይር',
  'settings.switchToDark': 'ወደ ግርዶሽ ቀይር',
  'settings.colourSemantics': '— ሁለቱም ገጽታዎች ላይ ተመሳሳይ የቀለም ትርጉም።',
  'settings.integrationStatus': 'የውህደት ደረጃ',
  'settings.integrationHint': 'ይህ ማሰራጫ በአሁኑ ሰዓት በእውነት ሊደርሳቸው የሚችላቸው። እዚህ ያለ ምንም ነገር ለማስዋብነት ብቻ አይደለም።',
  'settings.openDataName': 'ሕዝባዊ የመረጃ አቅራቢዎች (የአየር ሁኔታ፣ የአየር ንብረት፣ ዋጋዎች፣ ሳተላይት)',
  'settings.openDataDetail': 'ያለ ቁልፍ የሚከፈቱ ሕዝባዊ APIs በ /api/data/status አማካኝነት በቀጥታ የሚፈተሹ።',
  'settings.advisorName': 'የሰው ሠራሽ ብልህነት የግብርና አማካሪ (Gemini)',
  'settings.advisorDetail':
    'በዚህ አካባቢ GEMINI_API_KEY ያስፈልገዋል። ያለ ቁልፍ አማካሪው ራሱን በታማኝነት እንደማይገኝ ይገልጻል።',
  'settings.referenceName': 'የሰብልና የአፈር ማጣቀሻ ማኅደር',
  'settings.referenceDetail':
    'ከመተግበሪያው ጋር የተላኩ፣ ዋቢ ያላቸው የተመረጡ መግለጫዎች — ቀጥታ አቅራቢ አይደሉም።',
  'settings.accountsName': 'መለያዎችና የተቀመጡ መዝገቦች (Supabase)',
  'settings.accountsDetail':
    'መለያዎች ከሚከፈቱ በፊት Irshaye የራሱ Supabase ፕሮጀክት ያስፈልገዋል። ከሌላ መተግበሪያ ምንም የጋራ ማረጋገጫ አይኖርም።',

  // --- AI advisor module ---
  'advisor.pageDescription':
    'አማካሪው ሊያሰላ የሚችለው መድረኩ ወደ አቅራቢ አረጋግጦ ያሰባሰበው ማስረጃ ላይ ብቻ ነው። ግብቶቹን ይጠቅሳል፣ እርግጠኛ አለመሆንና ገደቦችን ይገልጻል፣ ማስረጃው በቂ ባልሆነ ጊዜ ደግሞ ዝግ ይላል። የምርት ተስፋ በጭራሽ አይሰጥም፤ የአፈርዎንም ሁኔታ አይተነትንም።',
  'advisor.badgeEvidenceOnly': 'በመድረክ ማስረጃ ላይ ብቻ ያስላል',
  'advisor.askTitle': 'ስለ ወረፋዎ ይጠይቁ',
  'advisor.askHint':
    'ጥያቄው ለ{place}ና ለተመረጠው ሰብል — ከመልሱ በታች ባሉት የተዘረዘሩት ማስረጃዎች ብቻ ተጠቅሞ ይመለሳል።',
  'advisor.questionLabel': 'ጥያቄዎ',
  'advisor.charCount': '{count}/900 ቁምፊዎች',
  'advisor.questionPlaceholder':
    'ለምሳሌ፦ በሚቀጥሉት ቀናት ዝናብ ይጠበቃል — ለመዝራት እጠብቅ? በመካከላው ምን ላዘጋጅ?',
  'advisor.example1': 'መሬት ለማዘጋጀትና ለመዝራት ጥሩ ጊዜ ነው?',
  'advisor.example2': 'በዚህ ሳምንት ልጠበቃቸው የሚገባ የአየር ሁኔታ ስጋቶች ምንድን ናቸው?',
  'advisor.example3': 'የዝናቡን ቅድመ እይታ ተከትሎ ግብዓቶችን እንዴት በጊዜው ላስገባ?',
  'advisor.assembling': 'ማስረጃ በመሰብሰብ ላይ…',
  'advisor.submit': 'በማስረጃ የተደገፈ መልስ ያግኙ',
  'advisor.unavailableTitle': 'አማካሪው አይገኝም',
  'advisor.networkError': 'ወደዚህ አገልግሎት መድረስ አልተቻለም። በመተናት ይልቅ ምንም መልስ አያሳይም።',
  'advisor.notConfigured':
    'GEMINI_API_KEY በዚህ ማሰራጫ ላይ ስላልተገናኘ አማካሪው መሠራት አይችልም። በመድረኩ ላይ ግን ያለ ቁልፍ ሌላ ሁሉ ይሠራል — የተፈለሰ መልስ አይሠራም።',
  'advisor.responseTitle': 'የአማካሪው መልስ',
  'advisor.badgeInsufficient': 'ማስረጃ አይበቃም',
  'advisor.badgeBacked': 'በማስረጃ የተደገፈ',
  'advisor.abstains': 'አማካሪው መልስ አልሰጠም',
  'advisor.uncertainty': 'እርግጠኛ አለመሆን',
  'advisor.limitations': 'ገደቦች',
  'advisor.evidenceTitle': 'ከመልሩ በስተጀርባ ያለ ማስረጃ',
  'advisor.evidenceHint':
    'አማካሪው መጠቀም የተፈቀደለት ልክ እነዚህ ናቸው — እያንዳንዱ ዋጋ ደረጃውና አቅራቢው አብሮ።',
  'advisor.gapsTitle': 'አማካሪው ሲገመት የታዩት የታወቁ ክፍተቶች',
  'advisor.kind.reference': 'ማጣቀሻ',
};
