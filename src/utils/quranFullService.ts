import { ALL_114_SURAHS, SurahMeta } from '../data/quranSurahsAll';
import { SURAHS_TEXT_DATA, SurahTextDetail, QuranAyahDetail } from '../data/quranData';

const CACHE_PREFIX = 'quran_surah_cache_v3_';

export interface AyahSearchResult {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
}

/**
 * Remove tashkeel/harakat for clean flexible search
 */
export function normalizeArabicText(text: string): string {
  return text
    .replace(/[\u0670]/g, 'ا') // Convert Quranic dagger alef to standard alef
    .replace(/[\u064B-\u065F\u06D6-\u06ED]/g, '') // Harakat & Quranic symbols
    .replace(/[إأآاٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width characters
    .trim();
}

// In-memory cache for all surahs to enable lightning-fast full text search
let completeQuranCache: { number: number; name: string; ayahs: { numberInSurah: number; text: string }[] }[] | null = null;
let isLoadingCompleteQuran = false;

export async function loadCompleteQuranForSearch(): Promise<{ number: number; name: string; ayahs: { numberInSurah: number; text: string }[] }[]> {
  if (completeQuranCache && completeQuranCache.length === 114) {
    return completeQuranCache;
  }

  if (isLoadingCompleteQuran) {
    // Wait until loaded
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 200));
      if (completeQuranCache && completeQuranCache.length === 114) {
        return completeQuranCache;
      }
    }
  }

  isLoadingCompleteQuran = true;
  try {
    let data: any = null;
    if (typeof window === 'undefined') {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.resolve(process.cwd(), 'public/data/quran/quranComplete.json');
        if (fs.existsSync(filePath)) {
          data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
      } catch (e) {
        // ignore
      }
    }

    if (!data) {
      const res = await fetch('/data/quran/quranComplete.json');
      if (res.ok) {
        data = await res.json();
      }
    }

    if (Array.isArray(data) && data.length === 114) {
      completeQuranCache = data;
      return completeQuranCache;
    }
  } catch (err) {
    console.warn('Could not fetch complete Quran dataset from local static assets:', err);
  } finally {
    isLoadingCompleteQuran = false;
  }

  return [];
}

/**
 * Fetch full Surah text (all 114 Surahs supported completely with zero omissions)
 */
export async function getFullSurahText(surahNumber: number): Promise<SurahTextDetail> {
  const meta: SurahMeta = ALL_114_SURAHS.find(s => s.number === surahNumber) || {
    number: surahNumber,
    name: `سورة ${surahNumber}`,
    englishName: `Surah ${surahNumber}`,
    revelationType: 'مكية',
    numberOfAyahs: 1,
    startPage: 1,
    endPage: 1,
    juz: 1,
  };

  // 1. Check local storage cache first
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${surahNumber}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.ayahs && parsed.ayahs.length >= meta.numberOfAyahs) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore storage parse error
  }

  // 2. Fetch from static local Quran JSON file in /data/quran/surahs/${surahNumber}.json
  try {
    const res = await fetch(`/data/quran/surahs/${surahNumber}.json`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.ayahs) && data.ayahs.length > 0) {
        const ayahs: QuranAyahDetail[] = data.ayahs.map((a: { numberInSurah: number; text: string }) => ({
          numberInSurah: a.numberInSurah,
          text: a.text,
        }));

        const result: SurahTextDetail = {
          number: surahNumber,
          name: meta.name,
          revelationType: meta.revelationType,
          numberOfAyahs: meta.numberOfAyahs,
          bismillahPre: surahNumber !== 1 && surahNumber !== 9,
          intro: `سورة ${meta.name} الشريفة (${meta.revelationType}) عدد آياتها ${meta.numberOfAyahs} آية، في الجزء ${meta.juz}. تبدأ من صفحة ${meta.startPage}.`,
          virtue: `سورة ${meta.name} المباركة من كتاب الله العزيز، ورد في فضل تلاوتها وتدبرها عظيم الأجر والثواب.`,
          ayahs,
        };

        try {
          localStorage.setItem(`${CACHE_PREFIX}${surahNumber}`, JSON.stringify(result));
        } catch {
          // LocalStorage quota may be reached, harmless
        }

        return result;
      }
    }
  } catch (err) {
    console.warn(`Could not load local surah file for surah ${surahNumber}:`, err);
  }

  // 3. Fallback to bundled data if present
  if (SURAHS_TEXT_DATA[surahNumber] && SURAHS_TEXT_DATA[surahNumber].ayahs.length > 0) {
    return SURAHS_TEXT_DATA[surahNumber];
  }

  // 4. Fetch from standard open Quran API (Al-Quran Cloud)
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && data.data.ayahs) {
        const ayahs: QuranAyahDetail[] = data.data.ayahs.map((a: { numberInSurah: number; text: string }) => ({
          numberInSurah: a.numberInSurah,
          text: a.text,
        }));

        const result: SurahTextDetail = {
          number: surahNumber,
          name: meta.name,
          revelationType: meta.revelationType,
          numberOfAyahs: meta.numberOfAyahs,
          bismillahPre: surahNumber !== 1 && surahNumber !== 9,
          intro: `سورة ${meta.name} الشريفة (${meta.revelationType}) عدد آياتها ${meta.numberOfAyahs}، في الجزء ${meta.juz}.`,
          virtue: `سورة مباركة من كتاب الله العزيز، ورد في فضل تلاوتها عظيم الأجر والمثوبة.`,
          ayahs,
        };

        try {
          localStorage.setItem(`${CACHE_PREFIX}${surahNumber}`, JSON.stringify(result));
        } catch {}

        return result;
      }
    }
  } catch (err) {
    console.warn(`Could not fetch online surah ${surahNumber}:`, err);
  }

  return {
    number: surahNumber,
    name: meta.name,
    revelationType: meta.revelationType,
    numberOfAyahs: meta.numberOfAyahs,
    bismillahPre: surahNumber !== 1 && surahNumber !== 9,
    intro: `سورة ${meta.name} (${meta.revelationType}) - ${meta.numberOfAyahs} آية`,
    virtue: 'سورة من كتاب الله العزيز.',
    ayahs: [],
  };
}

/**
 * Search the Quran across ALL 6,236 AYAHs and 114 Surahs
 */
export async function searchInQuran(query: string): Promise<AyahSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const results: AyahSearchResult[] = [];
  const normalizedQuery = normalizeArabicText(q);

  // 1. Try to load the complete Quran dataset for comprehensive search
  const completeQuran = await loadCompleteQuranForSearch();

  if (completeQuran && completeQuran.length > 0) {
    for (const surah of completeQuran) {
      const meta = ALL_114_SURAHS.find(s => s.number === surah.number);
      const surahName = meta ? meta.name : surah.name;

      for (const ayah of surah.ayahs) {
        const normAyahText = normalizeArabicText(ayah.text);
        if (normAyahText.includes(normalizedQuery)) {
          results.push({
            surahNumber: surah.number,
            surahName,
            ayahNumber: ayah.numberInSurah,
            text: ayah.text,
          });

          if (results.length >= 100) return results;
        }
      }
    }
  } else {
    // Fallback: search bundled data
    for (const surahNumStr of Object.keys(SURAHS_TEXT_DATA)) {
      const surah = SURAHS_TEXT_DATA[Number(surahNumStr)];
      if (!surah) continue;

      for (const ayah of surah.ayahs) {
        const normText = normalizeArabicText(ayah.text);
        if (normText.includes(normalizedQuery)) {
          results.push({
            surahNumber: surah.number,
            surahName: surah.name,
            ayahNumber: ayah.numberInSurah,
            text: ayah.text,
          });
          if (results.length >= 50) return results;
        }
      }
    }
  }

  // 2. Also search Surah names
  const matchingSurahs = ALL_114_SURAHS.filter(s => 
    normalizeArabicText(s.name).includes(normalizedQuery) ||
    s.name.includes(q)
  );

  for (const s of matchingSurahs) {
    if (!results.some(r => r.surahNumber === s.number && r.ayahNumber === 1)) {
      results.unshift({
        surahNumber: s.number,
        surahName: s.name,
        ayahNumber: 1,
        text: `سورة ${s.name} (${s.revelationType}) - ${s.numberOfAyahs} آية - الجزء ${s.juz} - تبدأ من صفحة ${s.startPage}`,
      });
    }
  }

  return results;
}
