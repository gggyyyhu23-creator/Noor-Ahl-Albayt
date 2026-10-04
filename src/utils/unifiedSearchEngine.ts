import { normalizeArabicText, searchMatches, getSearchSnippet } from './textSearch';
import { MUSHAF_PAGES, SURAHS_TEXT_DATA } from '../data/quranData';
import { ALL_114_SURAHS } from '../data/quranSurahsAll';
import { MAFATIH_BOOK_ITEMS } from '../data/mafatihBookData';
import { LIBRARY_DUAS } from '../data/mafatihDuas';
import { 
  SHIA_OCCASIONS, 
  WEEK_DAYS_DEEDS, 
  getHijriDate, 
  HIJRI_MONTH_NAMES 
} from '../data/calendarOccasions';
import { 
  PRAYER_LEARNING_STAGES, 
  PRAYER_RULINGS, 
  PRAYER_COMMON_MISTAKES 
} from '../data/prayer';
import { SHAKK_RULES } from '../data/shakkData';
import { INFALLIBLES_LIST, STORIES_LIST } from '../data/shiaInfallibles';

export type UnifiedCategory =
  | 'quran'
  | 'mafatih'
  | 'prayer_learn'
  | 'prayer_ruling'
  | 'prayer_mistake'
  | 'shakk'
  | 'calendar'
  | 'infallibles'
  | 'tool';

export interface UnifiedSearchResult {
  id: string;
  category: UnifiedCategory;
  categoryLabel: string;
  title: string;
  snippet: string;
  source: string;
  score: number;
  targetTab: string;
  targetId?: string;
  badge?: string;
  highlightText?: string;
}

export type QueryIntent = 
  | 'locate'      // وين، وين الكه، اين
  | 'how_to'      // شلون، كيف، طريقة، كيفية
  | 'deeds'       // شنو اعمال، شنو اقرا، ماذا يفعل
  | 'inquiry'     // ما هو، شنو، هل يجوز، حكم
  | 'general';

export interface ParsedQuery {
  raw: string;
  cleaned: string;
  normalized: string;
  intent: QueryIntent;
  tokens: string[];
  recognizedKeywords: string[];
}

// Dialect stop words and question particles to filter or map
const DIALECT_STOP_WORDS = [
  'وين', 'وينه', 'وينها', 'وين الكه', 'وين القى', 'وين القي', 'دلني', 'اشوف',
  'شلون', 'كيف', 'ازاي', 'طريقة', 'كيفية', 'اريد اعرف شلون',
  'اريد', 'أريد', 'ابغى', 'ابي', 'بدي', 'محتاج', 'ودّي', 'ودي',
  'شنو', 'ايش', 'شو', 'ماذا', 'ماهو', 'ماهي', 'ما هو', 'ما هي', 'شنو اقرا', 'شنو اعمال',
  'هل', 'عن', 'في', 'من', 'على', 'إلى', 'الى', 'مع', 'هذا', 'هذه', 'لي', 'لك',
  'افتح', 'اقرا', 'اقرأ', 'عرض', 'تطبيق', 'برنامج', 'يا', 'ليش', 'شسوي'
];

// Specific semantic dialect mappings
const DIALECT_SEMANTIC_MAP: Record<string, string[]> = {
  'عاشورة': ['عاشوراء', 'زيارة عاشوراء', 'الحسين'],
  'يس': ['يس', 'سورة يس', 'قلب القران'],
  'ياسين': ['يس', 'سورة يس'],
  'الاربعين': ['الاربعين', 'زيارة الاربعين', 'مشاية'],
  'القدر': ['ليلة القدر', 'الجوشن الكبير', 'القران'],
  'كميل': ['دعاء كميل', 'امير المؤمنين', 'ليلة الجمعة'],
  'الصباح': ['دعاء الصباح', 'امير المؤمنين'],
  'السمات': ['دعاء السمات', 'عصر الجمعة'],
  'التوسل': ['دعاء التوسل', 'الائمة المعصومين'],
  'الفرج': ['دعاء الفرج', 'صاحب الزمان', 'الحجة'],
  'العهد': ['دعاء العهد', 'صاحب الزمان', 'المهدي'],
  'الجوشن': ['الجوشن الكبير', 'الجوشن', 'الغوث'],
  'الاحتياط': ['صلاة الاحتياط', 'الشك بين 3 و 4', 'ركعة الاحتياط'],
  'السهو': ['سجود السهو', 'سجدتا السهو', 'سجدتي السهو'],
  'المبطلات': ['مبطلات الصلاة', 'نواقض الصلاة'],
  'الوضوء': ['الوضوء', 'شروط الوضوء', 'مسح الرأس والقدمين'],
  'القبلة': ['القبلة', 'معرفة القبلة', 'بوصلة القبلة'],
  'الجمعة': ['ليلة الجمعة', 'صلاة الجمعة', 'اعمال الجمعة', 'دعاء كميل'],
  'رمضان': ['شهر رمضان', 'افتتاح', 'سحر', 'ابو حمزة الثمالي'],
  'تسبيح': ['تسبيح الزهراء', 'المسبحة', 'فاطمة الزهراء'],
  'المسبحة': ['تسبيح الزهراء', 'مسبحة'],
  'الاذان': ['اوقات الصلاة', 'مواقيت الصلاة', 'صلاة الظهر'],
  'المواقيت': ['اوقات الصلاة', 'مواقيت الصلاة']
};

/**
 * Parses user input (especially Iraqi/Gulf dialect) into clean intent and keywords
 */
export function parseUserQuery(rawInput: string): ParsedQuery {
  const raw = rawInput.trim();
  let normalized = normalizeArabicText(raw);

  // Identify intent
  let intent: QueryIntent = 'general';
  if (/^(وين|وينه|وينها|اين|مكان|دلني)/.test(normalized) || normalized.includes('وين الكه') || normalized.includes('وين القى')) {
    intent = 'locate';
  } else if (/^(شلون|كيف|ازاي|طريقه|كيفيه)/.test(normalized) || normalized.includes('شلون اصلي') || normalized.includes('شلون اسوي')) {
    intent = 'how_to';
  } else if (normalized.includes('شنو اعمال') || normalized.includes('شنو اقرا') || normalized.includes('اعمال ليله') || normalized.includes('اعمال يوم')) {
    intent = 'deeds';
  } else if (/^(شنو|ايش|شو|ماذا|ماهو|ماهي)/.test(normalized) || normalized.includes('حكم') || normalized.includes('هل يجوز')) {
    intent = 'inquiry';
  }

  // Remove common question phrases and extract core keywords
  let cleaned = normalized;
  const recognizedKeywords: string[] = [];

  // Check semantic mappings
  for (const [key, mappedList] of Object.entries(DIALECT_SEMANTIC_MAP)) {
    const normKey = normalizeArabicText(key);
    if (normalized.includes(normKey)) {
      recognizedKeywords.push(...mappedList.map(normalizeArabicText));
    }
  }

  // Tokenize and filter stop words
  const words = normalized
    .replace(/[؟?.,!،:؛"«»()\[\]]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const tokens = words.filter((w) => {
    // Keep words longer than 1 char not in stop words
    if (w.length <= 1) return false;
    return !DIALECT_STOP_WORDS.includes(w);
  });

  return {
    raw,
    cleaned,
    normalized,
    intent,
    tokens: tokens.length > 0 ? tokens : words,
    recognizedKeywords
  };
}

/**
 * Universal Search across all sections of the application
 */
export function unifiedSearch(rawQuery: string, maxResults = 15): UnifiedSearchResult[] {
  if (!rawQuery || rawQuery.trim().length === 0) return [];

  const parsed = parseUserQuery(rawQuery);
  const qNorm = parsed.normalized;
  const tokens = parsed.tokens;
  const extraKeywords = parsed.recognizedKeywords;

  const results: UnifiedSearchResult[] = [];

  const addResult = (res: UnifiedSearchResult) => {
    // Avoid exact duplicate IDs
    const exists = results.find((r) => r.id === res.id);
    if (!exists) {
      results.push(res);
    } else if (res.score > exists.score) {
      exists.score = res.score;
    }
  };

  // Helper matching function with scoring
  const calculateMatchScore = (
    title: string,
    content: string,
    keywords: string[] = [],
    categoryBonus = 0
  ): number => {
    const titleNorm = normalizeArabicText(title);
    const contentNorm = normalizeArabicText(content);
    let score = categoryBonus;

    // 1. Exact title match
    if (titleNorm === qNorm) {
      score += 150;
    } else if (titleNorm.includes(qNorm) || qNorm.includes(titleNorm)) {
      score += 100;
    }

    // 2. Recognized keywords match
    for (const kw of extraKeywords) {
      if (titleNorm.includes(kw)) {
        score += 80;
      } else if (contentNorm.includes(kw)) {
        score += 40;
      }
    }

    // 3. Token-based matching
    let tokenMatchesInTitle = 0;
    let tokenMatchesInContent = 0;

    for (const t of tokens) {
      if (titleNorm.includes(t)) {
        tokenMatchesInTitle++;
      } else if (contentNorm.includes(t)) {
        tokenMatchesInContent++;
      }
    }

    score += tokenMatchesInTitle * 35;
    score += tokenMatchesInContent * 12;

    // Keyword array matches
    for (const k of keywords) {
      const kNorm = normalizeArabicText(k);
      if (kNorm === qNorm || qNorm.includes(kNorm)) {
        score += 60;
      }
      for (const t of tokens) {
        if (kNorm.includes(t)) {
          score += 25;
        }
      }
    }

    // Preference for matching exact item type (Dua vs Ziyarah)
    if (qNorm.includes('زياره') || qNorm.includes('زيارة')) {
      if (titleNorm.includes('زياره') || titleNorm.includes('زيارة')) {
        score += 60;
      } else if (titleNorm.includes('دعاء')) {
        score -= 40;
      }
    }
    if (qNorm.includes('دعاء')) {
      if (titleNorm.includes('دعاء')) {
        score += 60;
      } else if (titleNorm.includes('زياره') || titleNorm.includes('زيارة')) {
        score -= 40;
      }
    }

    // Exact start with main subject boost
    if (titleNorm.startsWith('زياره عاشوراء') || titleNorm.startsWith('زيارة عاشوراء')) {
      if (qNorm.includes('عاشور') || extraKeywords.includes('زيارة عاشوراء')) {
        score += 120;
      }
    }
    if (titleNorm.startsWith('دعاء كميل') && qNorm.includes('كميل')) {
      score += 100;
    }
    if (titleNorm.startsWith('دعاء الصباح') && qNorm.includes('الصباح')) {
      score += 100;
    }
    if (titleNorm.startsWith('دعاء الجوشن') && qNorm.includes('الجوشن')) {
      score += 100;
    }

    return score;
  };

  // =========================================================================
  // 1. القرآن الكريم (Quran Surahs and Mushaf Pages)
  // =========================================================================
  ALL_114_SURAHS.forEach((surah) => {
    const sDetail = SURAHS_TEXT_DATA[surah.number];
    const surahTextForSearch = `${surah.name} سورة ${surah.name} ${surah.revelationType} ${sDetail?.intro || ''} ${sDetail?.virtue || ''}`;
    const score = calculateMatchScore(
      `سورة ${surah.name}`,
      surahTextForSearch,
      ['سورة', surah.name, `سورة ${surah.name}`, String(surah.number)],
      parsed.intent === 'locate' || qNorm.includes('سوره') || qNorm.includes('سورة') ? 30 : 0
    );

    if (score >= 25) {
      addResult({
        id: `quran-surah-${surah.number}`,
        category: 'quran',
        categoryLabel: 'المصحف الشريف',
        title: `سورة ${surah.name} (${surah.revelationType} - ${surah.numberOfAyahs} آية)`,
        snippet: sDetail?.intro 
          ? sDetail.intro.slice(0, 130) + '...' 
          : `السورة رقم ${surah.number} في المصحف الشريف، تبدأ من الصفحة ${surah.startPage}.`,
        source: 'القرآن الكريم - المصحف المطبوع برواية حفص',
        score,
        targetTab: 'quran',
        targetId: String(surah.startPage),
        badge: `صفحة ${surah.startPage}`
      });
    }
  });

  // Search inside Mushaf Ayahs
  Object.values(MUSHAF_PAGES).forEach((page) => {
    page.ayahs.forEach((ayah) => {
      if (ayah.isBismillah) return;
      const matchScore = calculateMatchScore(
        `${page.surahName} آية ${ayah.ayahNumber}`,
        ayah.text,
        ['اية', 'آية', page.surahName]
      );
      if (matchScore >= 45) {
        addResult({
          id: `quran-p${page.pageNumber}-a${ayah.ayahNumber}`,
          category: 'quran',
          categoryLabel: 'القرآن الكريم',
          title: `سورة ${page.surahName} (آية ${ayah.ayahNumber})`,
          snippet: getSearchSnippet(ayah.text, qNorm, 120),
          source: `المصحف الشريف - جزء ${page.juz}، صفحة ${page.pageNumber}`,
          score: matchScore + 5,
          targetTab: 'quran',
          targetId: String(page.pageNumber),
          badge: `ص ${page.pageNumber}`
        });
      }
    });
  });

  // =========================================================================
  // 2. مفاتيح الجنان (Mafatih al-Jinan Complete Book Items)
  // =========================================================================
  MAFATIH_BOOK_ITEMS.forEach((item) => {
    const fullTextSample = (item.arabicText || []).slice(0, 4).join(' ');
    const keywordsList: string[] = [item.categoryLabel, item.source, item.virtue];
    const combinedContent = `${item.title} ${item.arabicTitle || ''} ${item.categoryLabel || ''} ${item.simplifiedExplanation || ''} ${keywordsList.join(' ')} ${fullTextSample}`;
    
    // Category bonus if query is about duas/ziyarat
    let catBonus = 0;
    if (qNorm.includes('دعاء') || qNorm.includes('زياره') || qNorm.includes('زيارة') || qNorm.includes('مناجاه') || qNorm.includes('اعمال')) {
      catBonus = 35;
    }

    const score = calculateMatchScore(
      item.title,
      combinedContent,
      [item.arabicTitle || '', item.categoryLabel || '', ...keywordsList],
      catBonus
    );

    if (score >= 25) {
      addResult({
        id: `mafatih-${item.id}`,
        category: 'mafatih',
        categoryLabel: `مفاتيح الجنان (${item.categoryLabel})`,
        title: item.title,
        snippet: item.simplifiedExplanation 
          ? item.simplifiedExplanation.slice(0, 140) + '...'
          : fullTextSample.slice(0, 140) + '...',
        source: `مفاتيح الجنان للمحدث القمي - باب ${item.categoryLabel}`,
        score,
        targetTab: 'mafatih',
        targetId: item.id,
        badge: item.categoryLabel
      });
    }
  });

  // Library Duas
  LIBRARY_DUAS.forEach((dua) => {
    const combinedContent = `${dua.title} ${dua.simplifiedMeaning} ${dua.occasion} ${dua.virtue} ${dua.arabicText.slice(0, 2).join(' ')}`;
    const score = calculateMatchScore(dua.title, combinedContent, [dua.title, dua.occasionCategory, dua.occasion]);
    if (score >= 25) {
      addResult({
        id: `library-${dua.id}`,
        category: 'mafatih',
        categoryLabel: 'مكتبة الأدعية والزيارات',
        title: dua.title,
        snippet: dua.simplifiedMeaning.slice(0, 130) + '...',
        source: 'مكتبة الأدعية والزيارات الشيعية المعتمدة',
        score,
        targetTab: 'library',
        targetId: dua.id,
        badge: 'أدعية'
      });
    }
  });

  // =========================================================================
  // 3. تعلم الصلاة (Prayer Learning - 16 Stages)
  // =========================================================================
  PRAYER_LEARNING_STAGES.forEach((stage) => {
    const whatToSay = stage.recitation ? stage.recitation.arabic : '';
    const combinedContent = `${stage.title} ${stage.shortDescription} ${stage.whatToDo} ${whatToSay} ${stage.obligatoryActions.join(' ')} ${stage.recommendedActions.join(' ')}`;
    
    let catBonus = 0;
    if (parsed.intent === 'how_to' || qNorm.includes('شلون اصلي') || qNorm.includes('تعلم الصلاة') || qNorm.includes('كيفية الصلاة')) {
      catBonus = 40;
    }

    const score = calculateMatchScore(
      stage.title,
      combinedContent,
      ['تعلم الصلاة', stage.title, `المرحلة ${stage.stepNumber}`],
      catBonus
    );

    if (score >= 25) {
      addResult({
        id: `prayer-stage-${stage.id}`,
        category: 'prayer_learn',
        categoryLabel: 'تعلم الصلاة خطوة بخطوة',
        title: stage.title,
        snippet: stage.shortDescription || stage.whatToDo.slice(0, 130) + '...',
        source: 'دليل تعليم الصلاة للمبتدئين وفق فقه مدرسة أهل البيت (ع)',
        score,
        targetTab: 'prayer_guide',
        targetId: stage.id,
        badge: `المرحلة ${stage.stepNumber} من 16`
      });
    }
  });

  // =========================================================================
  // 4. أحكام الصلاة الفقهية (Prayer Rulings - 30 Topics)
  // =========================================================================
  PRAYER_RULINGS.forEach((ruling) => {
    const combinedContent = `${ruling.title} ${ruling.topicCategory} ${ruling.summary} ${ruling.fullRuling} ${ruling.detailedPoints.join(' ')} ${ruling.keywords.join(' ')}`;
    
    let catBonus = 0;
    if (parsed.intent === 'inquiry' || qNorm.includes('حكم') || qNorm.includes('شك') || qNorm.includes('سجود السهو') || qNorm.includes('الاحتياط') || qNorm.includes('مبطلات')) {
      catBonus = 35;
    }

    const score = calculateMatchScore(
      ruling.title,
      combinedContent,
      [ruling.topicCategory, ...ruling.keywords],
      catBonus
    );

    if (score >= 25) {
      addResult({
        id: `prayer-ruling-${ruling.id}`,
        category: 'prayer_ruling',
        categoryLabel: `أحكام الصلاة (${ruling.topicCategory})`,
        title: ruling.title,
        snippet: ruling.summary || ruling.fullRuling.slice(0, 130) + '...',
        source: ruling.sourceBook 
          ? `فتاوى سماحة السيد السيستاني - ${ruling.sourceBook} (${ruling.sourceReference || ''})`
          : 'فتاوى سماحة السيد السيستاني (دام ظله) - المسائل المنتخبة',
        score,
        targetTab: 'prayer_guide',
        targetId: ruling.id,
        badge: ruling.topicCategory
      });
    }
  });

  // =========================================================================
  // 5. الأخطاء الشائعة في الصلاة (Common Mistakes - 17 Items)
  // =========================================================================
  PRAYER_COMMON_MISTAKES.forEach((mistake) => {
    const combinedContent = `${mistake.mistakeTitle} ${mistake.categoryLabel} ${mistake.description} ${mistake.correctAction} ${mistake.consequenceLabel}`;
    const score = calculateMatchScore(
      mistake.mistakeTitle,
      combinedContent,
      ['أخطاء شائعة', mistake.categoryLabel]
    );

    if (score >= 25) {
      addResult({
        id: `prayer-mistake-${mistake.id}`,
        category: 'prayer_mistake',
        categoryLabel: 'الأخطاء الشائعة في الصلاة',
        title: `تنبيه: ${mistake.mistakeTitle}`,
        snippet: `${mistake.description} ← الصواب: ${mistake.correctAction}`,
        source: `تصحيح الأخطاء الشائعة - ${mistake.source}`,
        score: score + 10,
        targetTab: 'prayer_guide',
        targetId: mistake.id,
        badge: mistake.categoryLabel
      });
    }
  });

  // =========================================================================
  // 6. أحكام شكوك الصلاة (Shakk Rules)
  // =========================================================================
  SHAKK_RULES.forEach((shakk) => {
    const combinedContent = `${shakk.title} ${shakk.situation} ${shakk.ruling} ${shakk.procedure} ${shakk.details}`;
    let catBonus = 0;
    if (qNorm.includes('شك') || qNorm.includes('احتياط') || qNorm.includes('سهو') || qNorm.includes('ركعه') || qNorm.includes('ركعة')) {
      catBonus = 40;
    }

    const score = calculateMatchScore(shakk.title, combinedContent, ['شكوك الصلاة', 'الشك في الركعات'], catBonus);

    if (score >= 25) {
      addResult({
        id: `shakk-${shakk.id}`,
        category: 'shakk',
        categoryLabel: 'شكوك الصلاة وصلاة الاحتياط',
        title: shakk.title,
        snippet: `${shakk.situation.slice(0, 80)}... الحكم: ${shakk.ruling}`,
        source: 'أحكام الشكوك وصلاة الاحتياط - فتاوى السيد السيستاني',
        score,
        targetTab: 'shakk',
        targetId: shakk.id,
        badge: 'فقه الشكوك'
      });
    }
  });

  // =========================================================================
  // 7. التقويم والمناسبات الدينية الشيعية (Calendar Occasions)
  // =========================================================================
  const searchNow = new Date();
  const searchTodayHijri = getHijriDate(searchNow, 0);

  const isTodaySearch = 
    qNorm.includes('مناسبة اليوم') || 
    qNorm.includes('مناسبه اليوم') || 
    qNorm.includes('يصادف اليوم') || 
    qNorm.includes('اليوم شنو') || 
    qNorm.includes('شنو اليوم') || 
    qNorm.includes('شنو مناسبة') || 
    qNorm.includes('شنو مناسبه') || 
    qNorm.includes('شنو يصادف') || 
    qNorm.includes('اقرا بهذا اليوم') ||
    qNorm.includes('أقرأ بهذا اليوم');

  const isMonthSearch = 
    (qNorm.includes('مناسبات') || qNorm.includes('مناسبه') || qNorm.includes('مناسبة')) && 
    (qNorm.includes('الشهر') || qNorm.includes('هذا الشهر'));

  SHIA_OCCASIONS.forEach((occ) => {
    const combinedContent = `${occ.title} ${occ.description} ${occ.figure} ${occ.type} ${HIJRI_MONTH_NAMES[occ.month - 1]}`;
    let catBonus = 0;
    if (qNorm.includes('مناسبه') || qNorm.includes('مناسبة') || qNorm.includes('يوم') || qNorm.includes('ليله') || qNorm.includes('ليلة') || qNorm.includes('شهاده') || qNorm.includes('ولاده')) {
      catBonus = 35;
    }

    // Boost for Imam Ali's birth
    if (
      (qNorm.includes('ولادة') || qNorm.includes('ولاده') || qNorm.includes('متى') || qNorm.includes('مولد') || qNorm.includes('ميلاد')) && 
      (qNorm.includes('علي') || qNorm.includes('امير المؤمنين')) && 
      !qNorm.includes('زين العابدين') && !qNorm.includes('السجاد') && !qNorm.includes('الاكبر') && !qNorm.includes('الهادي') && !qNorm.includes('الرضا') &&
      occ.id === 'occ-7-13'
    ) {
      catBonus += 800;
    }

    // Boost for today's occasion
    if (isTodaySearch && occ.month === searchTodayHijri.month && occ.day === searchTodayHijri.day) {
      catBonus += 400;
    }

    // Boost for this month's occasions
    if (isMonthSearch && occ.month === searchTodayHijri.month) {
      catBonus += 150;
    }

    const score = calculateMatchScore(occ.title, combinedContent, [occ.title, occ.figure, occ.type, HIJRI_MONTH_NAMES[occ.month - 1]], catBonus);

    if (score >= 25) {
      addResult({
        id: `occ-${occ.id}`,
        category: 'calendar',
        categoryLabel: 'التقويم والمناسبات الإسلامية',
        title: `${occ.title} (${occ.day} من شهر ${HIJRI_MONTH_NAMES[occ.month - 1]})`,
        snippet: occ.description.slice(0, 130) + '...',
        source: occ.source || `المناسبات الإسلامية - سيرة ${occ.figure}`,
        score,
        targetTab: occ.mafatihId ? 'mafatih' : 'calendar',
        targetId: occ.mafatihId || occ.id,
        badge: occ.type === 'wiladat' ? 'ولادة مباركة' : occ.type === 'shahadat' ? 'ذكرى شهادة' : 'مناسبة'
      });
    }
  });

  // =========================================================================
  // 7.1 أذكار وأدعية أيام الأسبوع (Weekly Deeds: Sat - Fri)
  // =========================================================================
  WEEK_DAYS_DEEDS.forEach((deed) => {
    const combinedContent = `أعمال يوم ${deed.dayName} ${deed.attributedFigure} ${deed.duaTitle} ${deed.ziyaratTitle} ${deed.tasbeeh} ${deed.recommendedActions.join(' ')}`;
    let deedBonus = 0;
    if (qNorm.includes('اعمال') || qNorm.includes('أعمال') || qNorm.includes('تسبيح') || qNorm.includes('دعاء يوم')) {
      deedBonus = 40;
    }
    if (qNorm.includes(normalizeArabicText(deed.dayName))) {
      deedBonus += 100;
    }
    if (isTodaySearch && deed.dayIndex === searchNow.getDay()) {
      deedBonus += 350;
    }

    const score = calculateMatchScore(`أعمال يوم ${deed.dayName}`, combinedContent, [deed.dayName, `يوم ${deed.dayName}`, deed.attributedFigure], deedBonus);

    if (score >= 25) {
      addResult({
        id: `weekday-deed-${deed.dayIndex}`,
        category: 'calendar',
        categoryLabel: 'أعمال وأدعية الأيام',
        title: `أعمال يوم ${deed.dayName} (${deed.attributedFigure})`,
        snippet: `تسبيح اليوم: ${deed.tasbeeh} • ${deed.duaTitle}`,
        source: deed.source,
        score: score + 20,
        targetTab: 'calendar',
        targetId: undefined,
        badge: `يوم ${deed.dayName}`
      });
    }
  });

  // =========================================================================
  // 8. سيرة وقصص أهل البيت (ع)
  // =========================================================================
  INFALLIBLES_LIST.forEach((inf) => {
    const combinedContent = `${inf.name} ${inf.title} ${inf.honorific} ${inf.bio} ${inf.role} ${inf.famousQuotes.map(q => q.text).join(' ')}`;
    const score = calculateMatchScore(inf.name, combinedContent, [inf.name, inf.title, inf.honorific]);

    if (score >= 35) {
      addResult({
        id: `inf-${inf.id}`,
        category: 'infallibles',
        categoryLabel: 'سيرة أهل البيت (ع)',
        title: `${inf.name} (${inf.honorific})`,
        snippet: inf.bio.slice(0, 130) + '...',
        source: 'موسوعة سيرة المعصومين الأربعة عشر (عليهم السلام)',
        score,
        targetTab: 'infallibles',
        targetId: inf.id,
        badge: 'المعصومين'
      });
    }
  });

  STORIES_LIST.forEach((story) => {
    const combinedContent = `${story.title} ${story.content} ${story.moral} ${story.infallibleName}`;
    const score = calculateMatchScore(story.title, combinedContent, [story.title, story.infallibleName, story.category]);

    if (score >= 30) {
      addResult({
        id: `story-${story.id}`,
        category: 'infallibles',
        categoryLabel: 'قصص ومواقف أهل البيت',
        title: story.title,
        snippet: story.content.slice(0, 120) + '...',
        source: `سيرة ${story.infallibleName} (ع)`,
        score,
        targetTab: 'infallibles',
        targetId: story.id,
        badge: story.category
      });
    }
  });

  // =========================================================================
  // 9. الأدوات العملية (Tools: Qibla, Tasbeeh, Prayer Times)
  // =========================================================================
  if (qNorm.includes('قبله') || qNorm.includes('قبلة') || qNorm.includes('اتجاه الكعبه') || qNorm.includes('بوصله')) {
    addResult({
      id: 'tool-qibla',
      category: 'tool',
      categoryLabel: 'أدوات الصلاة',
      title: 'بوصلة القبلة الدقيقة',
      snippet: 'تحديد اتجاه الكعبة المشرفة بدقة حسب موقعك الجغرافي واستشعار البوصلة.',
      source: 'حسابات فلكية معتمدة وفق إحداثيات مكة المكرمة',
      score: 500,
      targetTab: 'qibla',
      badge: 'أداة تفاعلية'
    });
  }

  if (qNorm.includes('تسبيح') || qNorm.includes('زهراء') || qNorm.includes('مسبحه') || qNorm.includes('مسبحة')) {
    addResult({
      id: 'tool-tasbeeh',
      category: 'tool',
      categoryLabel: 'أدوات الذكر',
      title: 'مسبحة تسبيح فاطمة الزهراء (ع)',
      snippet: 'عداد ذكي لتسبيح الزهراء: 34 الله أكبر، 33 الحمد لله، 33 سبحان الله مع الاهتزاز والصوت.',
      source: 'سنة نبوية شريفة مروية عن الإمام الصادق (ع)',
      score: 500,
      targetTab: 'tasbeeh',
      badge: 'عداد الأذكار'
    });
  }

  if (qNorm.includes('وقت') || qNorm.includes('اوقات') || qNorm.includes('اذان') || qNorm.includes('مواقيت') || qNorm.includes('صلاة الظهر')) {
    addResult({
      id: 'tool-prayers',
      category: 'tool',
      categoryLabel: 'مواقيت الصلاة',
      title: 'جدول مواقيت الصلاة الشرعية',
      snippet: 'حساب دقيق لمواقيت الصلوات الخمس بحسب المعايير الشيعية (معهد ليفا - جامعة طهران) مع زوال الحمرة المشرقية للمغرب.',
      source: 'الحسابات الفلكية الشرعية المعتمدة للمدن الإسلامية',
      score: 500,
      targetTab: 'prayers',
      badge: 'المواقيت'
    });
  }

  // Sort strictly by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}

/**
 * Intelligent Shia Assistant Response Synthesis
 * Generates respectful, contextual response text with zero hallucinations
 */
export function generateSmartAssistantResponse(rawInput: string): {
  replyText: string;
  results: UnifiedSearchResult[];
  followUpSuggestions: string[];
} {
  const parsed = parseUserQuery(rawInput);
  const qNorm = parsed.normalized;
  const results = unifiedSearch(rawInput, 8);

  let replyText = '';
  let followUpSuggestions: string[] = [];

  const now = new Date();
  const todayHijri = getHijriDate(now, 0);
  const todayDayOfWeek = now.getDay();
  const todayWeekDayObj = WEEK_DAYS_DEEDS.find((w) => w.dayIndex === todayDayOfWeek);
  const todayOcc = SHIA_OCCASIONS.find((o) => o.month === todayHijri.month && o.day === todayHijri.day);
  const todayGregorianFormatted = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);

  // 1. Direct recognizable intents

  // اليوم شنو / شنو مناسبة اليوم / شنو يصادف اليوم
  if (
    qNorm.includes('مناسبة اليوم') || 
    qNorm.includes('مناسبه اليوم') || 
    qNorm.includes('يصادف اليوم') || 
    qNorm.includes('اليوم شنو') || 
    qNorm.includes('شنو اليوم') || 
    qNorm.includes('شنو مناسبة') || 
    qNorm.includes('شنو مناسبه') || 
    qNorm.includes('شنو يصادف') ||
    (qNorm.includes('اليوم') && (qNorm.includes('مناسبه') || qNorm.includes('مناسبة')))
  ) {
    if (todayOcc) {
      replyText = `اليوم المبارك يصادف ${todayHijri.day} من شهر ${todayHijri.monthName} ${todayHijri.year} هـ (${todayGregorianFormatted}). والمناسبة الدينية المسجلة لهذا اليوم هي: «${todayOcc.title}» المنسوبة إلى ${todayOcc.figure}. ${todayOcc.description} يمكنك الاطلاع على التفاصيل والأعمال المستحبة الموثقة من خلال الزر أدناه:`;
      followUpSuggestions = ['أعمال هذا اليوم', `أعمال يوم ${todayWeekDayObj?.dayName}`, 'مناسبات هذا الشهر'];
    } else {
      replyText = `اليوم هو يوم ${todayWeekDayObj?.dayName}، الموافق ${todayHijri.day} من شهر ${todayHijri.monthName} ${todayHijri.year} هـ (${todayGregorianFormatted}). لا توجد مناسبة دينية مخصوصة مسجلة لهذا اليوم في قاعدة البيانات، ولكن يُستحب فيه إتيان أذكار وأدعية يوم ${todayWeekDayObj?.dayName} المأثورة عن أهل البيت (ع)، وتسبيح اليوم: «${todayWeekDayObj?.tasbeeh}»، بالإضافة إلى التعقيبات العامة للصلوات:`;
      followUpSuggestions = [`أعمال يوم ${todayWeekDayObj?.dayName}`, 'مناسبات هذا الشهر', 'أعمال ليلة الجمعة'];
    }
  } else if (
    (qNorm.includes('شنو') || qNorm.includes('ايش') || qNorm.includes('اريد')) && 
    (qNorm.includes('اقرا') || qNorm.includes('اقراء') || qNorm.includes('اعمال')) && 
    (qNorm.includes('اليوم') || qNorm.includes('بهذا اليوم'))
  ) {
    // شنو أقرأ بهذا اليوم؟
    replyText = `في هذا اليوم المبارك (${todayWeekDayObj?.dayName}، ${todayHijri.day} ${todayHijri.monthName}) يُستحب لك:${todayOcc ? `\n• إتيان أعمال مناسبة «${todayOcc.title}»` : ''}\n• تلاوة دعاء يوم ${todayWeekDayObj?.dayName} المروي في الصحيفة السجادية\n• ذكر تسبيح اليوم: «${todayWeekDayObj?.tasbeeh}»\n• قراءة زيارة ${todayWeekDayObj?.attributedFigure}\n• تعقيب الصلوات وتسبيح فاطمة الزهراء (ع). إليك النصوص الكاملة:`;
    followUpSuggestions = [`أعمال يوم ${todayWeekDayObj?.dayName}`, 'تسبيح الزهراء', 'أعمال ليلة الجمعة'];
  } else if (
    (qNorm.includes('مناسبات') || qNorm.includes('مناسبه') || qNorm.includes('مناسبة')) && 
    (qNorm.includes('الشهر') || qNorm.includes('هذا الشهر'))
  ) {
    // أريد مناسبات هذا الشهر
    const monthOccasions = SHIA_OCCASIONS.filter(o => o.month === todayHijri.month);
    replyText = `نحن حالياً في شهر ${todayHijri.monthName} ${todayHijri.year} هـ. يتضمن هذا الشهر الشريف ${monthOccasions.length} مناسبة دينية مسجلة في التقويم الإسلامي الشيعي. إليك قائمة بأبرز مناسبات شهر ${todayHijri.monthName} مع إمكانية فتح تفاصيل كل مناسبة:`;
    followUpSuggestions = ['مناسبة اليوم', 'أعمال هذا الشهر', 'التقويم الإسلامي'];
  } else if (
    (qNorm.includes('ولادة') || qNorm.includes('ولاده') || qNorm.includes('ميلاد') || qNorm.includes('متى')) && 
    (qNorm.includes('علي') || qNorm.includes('امير المؤمنين')) && 
    !qNorm.includes('زين العابدين') && !qNorm.includes('السجاد') && !qNorm.includes('الاكبر') && !qNorm.includes('الهادي') && !qNorm.includes('الرضا')
  ) {
    // متى ولادة الإمام علي؟
    replyText = 'ولادة أمير المؤمنين علي بن أبي طالب (عليه السلام) كانت في يوم 13 من شهر رجب الأصب في جوف الكعبة المشرفة بمكة المكرمة (سنة 23 قبل الهجرة النبوية الشريفة)، ولم يُولد في بيت الله الحرام مولود قبله ولا بعده. يمكنك فتح تفاصيل المناسبة وزيارة أمين الله:';
    followUpSuggestions = ['أعمال شهر رجب', 'زيارة أمين الله', 'دعاء كميل'];
  } else if (
    qNorm.includes('ليلة القدر') || qNorm.includes('ليله القدر') || qNorm.includes('ليالي القدر')
  ) {
    // أعمال ليلة القدر
    replyText = 'ليالي القدر المباركة هي ليالي (19، 21، و23) من شهر رمضان المبارك، وأعظمها ليلة الثالثة والعشرين. ومن أبرز أعمالها الموثقة في مفاتيح الجنان: الغسل، وصلاة مائة ركعة، ودعاء رفع المصاحف الشريفة، وزيارة سيد الشهداء (ع)، وتلاوة دعاء الجوشن الكبير كاملاً. إليك تفاصيل الأعمال في مفاتيح الجنان:';
    followUpSuggestions = ['دعاء الجوشن الكبير', 'أعمال شهر رمضان', 'زيارة عاشوراء'];
  } else if (
    (qNorm.includes('اعمال عاشوراء') || qNorm.includes('أعمال عاشوراء') || qNorm.includes('عاشوراء') || qNorm.includes('عاشوره')) &&
    (qNorm.includes('اعمال') || qNorm.includes('شنو') || qNorm.includes('اقرا'))
  ) {
    // شنو أعمال عاشوراء؟
    replyText = 'يوم العاشر من المحرم (عاشوراء) هو يوم المصيبة الكبرى لآل محمد (ع)، ومن أبرز أعماله الموثقة في مفاتيح الجنان ومصباح المتهجد: تلاوة زيارة عاشوراء المشرفة مع اللعن والسلام ودعاء علقمة، إقامة مآتم العزاء والبكاء والمواساة، الإمساك عن الطعام والشراب دون نية الصوم إلى ما بعد العصر، ولعن قتلة سيد الشهداء. إليك نصوص الأعمال والزيارة:';
    followUpSuggestions = ['زيارة عاشوراء', 'زيارة وارث', 'دعاء علقمة'];
  } else if (
    qNorm.includes('الخميس') && (qNorm.includes('اعمال') || qNorm.includes('أعمال') || qNorm.includes('شنو') || qNorm.includes('دعاء'))
  ) {
    // شنو أعمال يوم الخميس؟
    replyText = 'يوم الخميس منسوب للإمام الحسن العسكري (عليه السلام)، ومن سننه وأعماله الموثقة في مفاتيح الجنان: تلاوة دعاء يوم الخميس للإمام السجاد (ع)، وتسبيح اليوم: «لَا إِلَهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ» مائة مرة، والاستعداد لليلة الجمعة التي تبدأ بعد مغرب الخميس بقراءة دعاء كميل بن زياد وزيارة الحسين (ع). إليك الأعمال:';
    followUpSuggestions = ['دعاء كميل', 'أعمال ليلة الجمعة', 'دعاء يوم الخميس'];
  } else if (
    qNorm.includes('ليلة الجمعة') || 
    qNorm.includes('ليله الجمعة') || 
    qNorm.includes('ليلة الجمعه') || 
    qNorm.includes('ليله الجمعه') || 
    (qNorm.includes('ليلة') && qNorm.includes('الجمع')) ||
    (qNorm.includes('ليله') && qNorm.includes('الجمع')) ||
    qNorm.includes('اعمال ليلة')
  ) {
    // أعمال ليلة الجمعة
    replyText = 'ليلة الجمعة من أشرف الأوقات المباركة، ومن أفضل أعمالها المأثورة في مفاتيح الجنان: قراءة دعاء كميل بن زياد الشريف، وزيارة وارث للإمام الحسين (ع)، والاستغفار للوالدين والمؤمنين، وتلاوة سور يس والواقعة والجمعة، والإكثار من الصلاة على محمد وآل محمد. يمكنك فتح نصوص الأعمال فوراً:';
    followUpSuggestions = ['دعاء كميل', 'زيارة وارث', 'دعاء السمات'];
  } else if (
    (qNorm.includes('الجمعة') || qNorm.includes('الجمعه')) && 
    (qNorm.includes('اعمال') || qNorm.includes('أعمال') || qNorm.includes('شنو') || qNorm.includes('دعاء')) &&
    !qNorm.includes('ليل')
  ) {
    // أعمال يوم الجمعة
    replyText = 'يوم الجمعة هو سيد الأيام، ومن أبرز أعماله الموثقة في مفاتيح الجنان ومصباح المتهجد: الغسل المسنون قبل الزوال، الإكثار من الصلاة على محمد وآل محمد (ألف مرة)، تلاوة دعاء الندبة صباحاً شوقاً لظهور صاحب الزمان (عج)، زيارة الإمام المهدي بالزيارة المخصوصة، ودعاء السمات قبيل غروب الشمس. إليك نصوص الأعمال المباشرة:';
    followUpSuggestions = ['دعاء الندبة', 'دعاء السمات', 'أعمال ليلة الجمعة'];
  } else if (qNorm.includes('دعاء كميل') || (qNorm.includes('كميل') && !qNorm.includes('زياره') && !qNorm.includes('زيارة'))) {
    replyText = 'أهلاً بك. دعاء كميل بن زياد الشريف مروي عن أمير المؤمنين علي بن أبي طالب (عليه السلام)، ويُقرأ في ليلة الجمعة ومنتصف شعبان لمغفرة الذنوب وكفاية الرزق ودفع البلاء. يمكنك قراءته بالنص الكامل المضبوط بالتشكيل والمعنى المبسط من خلال الزر أدناه:';
    followUpSuggestions = ['أريد أعمال ليلة الجمعة', 'دعاء الصباح', 'سورة يس'];
  } else if (qNorm.includes('زيارة عاشوراء') || qNorm.includes('عاشوره') || qNorm.includes('عاشوراء')) {
    replyText = 'زيارة عاشوراء المشهورة مروية عن الإمام الباقر (عليه السلام) وهي من أعظم الزيارات أثراً وبركة، وفيها السلام واللعن ودعاء صفوان. يمكنك فتح نص الزيارة الكامل والمبسط مباشرة:';
    followUpSuggestions = ['زيارة أبي الفضل العباس', 'زيارة الأربعين', 'دعاء علقمة'];
  } else if (qNorm.includes('صلاة الاحتياط') || (qNorm.includes('احتياط') && qNorm.includes('صلاة'))) {
    replyText = 'صلاة الاحتياط ركعة أو ركعتان تؤدى بعد الصلاة فوراً دون التفاف عن القبلة أو تكلم، لجبر النقص المحتمل عند وقوع الشكوك الصحيحة (كالشك بين الركعة الثالثة والرابعة). إليك أحكامها الدقيقة وكيفيتها وفق فتاوى السيد السيستاني:';
    followUpSuggestions = ['الشك بين الثالثة والرابعة', 'سجدتا السهو', 'مبطلات الصلاة'];
  } else if (
    qNorm.split(/\s+/).includes('يس') || 
    qNorm.includes('سورة يس') || 
    qNorm.includes('سوره يس')
  ) {
    replyText = 'سورة يس الشريفة (قلب القرآن الكريم، السورة رقم 36) متوفرة بكامل آياتها وبيان فضائلها في المصحف الشريف. يمكنك الانتقال إلى السورة فوراً:';
    followUpSuggestions = ['سورة البقرة', 'دعاء كميل', 'المصحف الشريف'];
  } else if (qNorm.includes('دعاء الفرج') || qNorm.includes('الفرج')) {
    replyText = 'دعاء الفرج الشريف «اللَّهُمَّ كُنْ لِوَلِيِّكَ الحُجَّةِ بْنِ الحَسَنِ» ودعاء «إِلَهِي عَظُمَ البَلَاءُ» لتعجيل فرج صاحب العصر والزمان (عجل الله تعالى فرجه الشريف) متوفران في مفاتيح الجنان:';
    followUpSuggestions = ['دعاء العهد', 'زيارة آل يس', 'دعاء الندبة'];
  } else if (qNorm.includes('صلاة الصبح') || (qNorm.includes('شلون') && qNorm.includes('الصبح'))) {
    replyText = 'صلاة الصبح ركعتان جهرية؛ تبدأ بالنية وتكبيرة الإحرام، وتقرأ في كل ركعة الفاتحة وسورة تامة، مع الركوع والسجدتين، وفي الركعة الثانية يقنت المصلي بعد القراءة ثم يركع ويسجد ويسلّم. إليك دليل تعلم صلاة الصبح بالتفصيل:';
    followUpSuggestions = ['كيفية صلاة الظهر', 'أوقات الصلاة', 'شروط الصلاة'];
  } else if (qNorm.includes('سجود السهو') || qNorm.includes('سجدتي السهو') || qNorm.includes('سجدتا السهو')) {
    replyText = 'سجدتا السهو سجدتان واجبتان بعد التسليم للكلام سهواً، أو السلام في غير محله، أو الشك بين 4 و 5، ويُقال فيهما: «بِسْمِ اللَّهِ وَبِاللَّهِ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ». إليك تفاصيل الحكم:';
    followUpSuggestions = ['صلاة الاحتياط', 'مبطلات الصلاة', 'الشكوك الصحيحة'];
  } else if (qNorm.includes('الجوشن') || qNorm.includes('الغوث')) {
    replyText = 'دعاء الجوشن الكبير الشريف مروي عن النبي (ص) في مائة فصل جامع لأسماء الله الحسنى، يُستحب قراءته بالأخص في ليالي القدر المباركة. يمكنك تصفح الفصول المائة كاملة:';
    followUpSuggestions = ['أعمال ليلة القدر', 'دعاء التوسل', 'دعاء أبي حمزة'];
  } else if (results.length > 0) {
    const topResult = results[0];
    replyText = `بحثتُ لك في بيانات التطبيق الموثقة، وعثرتُ على «${topResult.title}» في قسم (${topResult.categoryLabel}). إليك أبرز النتائج ذات الصلة بسؤالك مع إمكانية فتحها مباشرة:`;
    followUpSuggestions = [
      'أحكام الصلاة',
      'مفاتيح الجنان',
      'القرآن الكريم',
      'التقويم والمناسبات'
    ];
  } else {
    replyText = 'سلام عليكم ورحمة الله. هذا المحتوى غير موجود في قاعدة البيانات الحالية للتطبيق، ولم نعثر على تطابق مباشر له. يمكنك البحث بكتابة اسم الدعاء، السورة، أو المسألة الفقهية (مثلاً: «دعاء كميل»، «صلاة الآيات»، «زيارة عاشوراء»، «الشك في الركعات»).';
    followUpSuggestions = [
      'وين دعاء كميل؟',
      'افتح زيارة عاشوراء',
      'شلون أصلي صلاة الاحتياط؟',
      'شنو مناسبة اليوم؟'
    ];
  }

  return {
    replyText,
    results,
    followUpSuggestions: followUpSuggestions.slice(0, 4)
  };
}
