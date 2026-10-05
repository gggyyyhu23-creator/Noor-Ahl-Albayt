import pageRangesData from '../data/quranPageRanges.json';
import { ALL_114_SURAHS } from '../data/quranSurahsAll';

export interface PageRangeItem {
  page: number;
  start: { surah: number; ayah: number };
  end: { surah: number; ayah: number };
}

const pageRanges: PageRangeItem[] = pageRangesData as PageRangeItem[];

/**
 * Returns the exact Mushaf page (1 to 604) containing the given Surah and Ayah
 */
export function getMushafPageForAyah(surahNumber: number, ayahNumber: number): number {
  if (surahNumber < 1 || surahNumber > 114) return 1;

  for (const item of pageRanges) {
    if (item.start.surah === item.end.surah) {
      if (
        item.start.surah === surahNumber &&
        ayahNumber >= item.start.ayah &&
        ayahNumber <= item.end.ayah
      ) {
        return item.page;
      }
    } else {
      if (surahNumber === item.start.surah && ayahNumber >= item.start.ayah) {
        return item.page;
      }
      if (surahNumber > item.start.surah && surahNumber < item.end.surah) {
        return item.page;
      }
      if (surahNumber === item.end.surah && ayahNumber <= item.end.ayah) {
        return item.page;
      }
    }
  }

  // Fallback to surah's start page if ayah is out of range
  const surahMeta = ALL_114_SURAHS.find((s) => s.number === surahNumber);
  return surahMeta ? surahMeta.startPage : 1;
}

/**
 * Returns the first Ayah and Surah appearing on a given page (1 to 604)
 */
export function getFirstAyahOnPage(pageNumber: number): {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
} {
  const p = Math.max(1, Math.min(604, pageNumber));
  const range = pageRanges[p - 1];

  if (!range) {
    return { surahNumber: 1, surahName: 'الفاتحة', ayahNumber: 1 };
  }

  const surahMeta = ALL_114_SURAHS.find((s) => s.number === range.start.surah);
  return {
    surahNumber: range.start.surah,
    surahName: surahMeta ? surahMeta.name : `سورة ${range.start.surah}`,
    ayahNumber: range.start.ayah,
  };
}

/**
 * Returns the start and end ayah range on a page
 */
export function getAyahsRangeOnPage(pageNumber: number): PageRangeItem {
  const p = Math.max(1, Math.min(604, pageNumber));
  return pageRanges[p - 1] || pageRanges[0];
}
