import { getAyahsRangeOnPage } from '../utils/quranPageMapping';
import { ALL_114_SURAHS } from '../data/quranSurahsAll';
import { quranTimingService } from './quranTimingService';

export interface MushafPageAyah {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  globalAyahNumber: number;
  text: string;
  cleanVerseText: string;
  juz: number;
  isFirstAyahOfSurah: boolean;
  hasHeaderBismillah: boolean;
  startMs: number;
  endMs: number;
  polygon?: string;
  x?: string;
  y?: string;
  hasPolygon: boolean;
}

export interface MushafPageData {
  pageNumber: number;
  surahNumber: number;
  surahName: string;
  juz: number;
  ayahs: MushafPageAyah[];
  isLoading: boolean;
  viewBox: string;
  aspectRatio: string;
  svgUrl: string;
  fallbackSvgUrl: string;
  fallbackImageUrl: string;
  hasPolygons: boolean;
}

/**
 * Converts Western digits to Eastern Arabic numerals (١, ٢, ٣...)
 */
export function toArabicNumerals(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, (d) => arabicDigits[parseInt(d, 10)]);
}

/**
 * Separates Bismillah from Ayah 1 for display in ornate surah headers (Surahs 2-114, except 9)
 */
export function splitBismillah(surahNum: number, rawText: string): {
  hasHeaderBismillah: boolean;
  verseText: string;
} {
  if (surahNum === 1 || surahNum === 9) {
    return { hasHeaderBismillah: false, verseText: rawText.replace(/^\uFEFF/, '').trim() };
  }

  const cleaned = rawText.replace(/^\uFEFF/, '').trim();
  const match =
    cleaned.match(/^بِ?سۡ?مِ\s+ٱللَّهِ\s+ٱلرَّحۡمَٰنِ\s+ٱلرَّحِيمِ\s*(.*)$/) ||
    cleaned.match(/^بِ?سْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*(.*)$/);

  if (match) {
    return { hasHeaderBismillah: true, verseText: match[1].trim() };
  }

  const idx = cleaned.indexOf('ٱلرَّحِيمِ');
  if (idx !== -1 && idx < 45) {
    return {
      hasHeaderBismillah: true,
      verseText: cleaned.slice(idx + 'ٱلرَّحِيمِ'.length).trim(),
    };
  }

  return { hasHeaderBismillah: false, verseText: cleaned };
}

class QuranMushafPageService {
  // In-memory page cache (key: page_readId)
  private pageCache = new Map<string, MushafPageAyah[]>();
  private pendingRequests = new Map<string, Promise<MushafPageAyah[]>>();

  // Raw Quran pages text cache in memory (key: pageNumber)
  private rawPagesCache = new Map<number, any[]>();
  private completeQuranLoaded = false;
  private isFetchingCompleteQuran = false;

  /**
   * Returns viewBox and aspect ratio for a page:
   * Pages 1-2: 0 0 235 235 (1:1)
   * Pages 3-604: 0 0 345 550 (345/550)
   */
  public getPageViewBox(pageNumber: number): { viewBox: string; aspectRatio: string } {
    const p = Math.max(1, Math.min(604, pageNumber));
    if (p <= 2) {
      return { viewBox: '0 0 235 235', aspectRatio: '1 / 1' };
    }
    return { viewBox: '0 0 345 550', aspectRatio: '345 / 550' };
  }

  /**
   * URLs for SVG and JPEG fallback images (kept for backward compatibility)
   */
  public getPageUrls(pageNumber: number): {
    svgUrl: string;
    fallbackSvgUrl: string;
    fallbackImageUrl: string;
  } {
    const p = Math.max(1, Math.min(604, pageNumber));
    const pad = p.toString().padStart(3, '0');
    return {
      svgUrl: `/api/quran/page-svg/${p}`,
      fallbackSvgUrl: `https://www.mp3quran.net/api/quran_pages_svg/${pad}.svg`,
      fallbackImageUrl: `https://cdn.jsdelivr.net/gh/QuranHub/quran-pages-images@main/kfgqpc/hafs-wasat/${p}.jpg`,
    };
  }

  /**
   * Fetch raw page text from local server endpoint or static assets
   */
  private async fetchRawPageText(pageNumber: number): Promise<any[]> {
    if (this.rawPagesCache.has(pageNumber)) {
      return this.rawPagesCache.get(pageNumber)!;
    }

    // 1. Try local server API route /api/quran/page/:page
    try {
      const res = await fetch(`/api/quran/page/${pageNumber}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.ayahs) && data.ayahs.length > 0) {
          this.rawPagesCache.set(pageNumber, data.ayahs);
          return data.ayahs;
        }
      }
    } catch {
      // Fallback
    }

    // 2. Try loading full Quran once into cache if not yet loaded
    if (!this.completeQuranLoaded && !this.isFetchingCompleteQuran) {
      this.isFetchingCompleteQuran = true;
      try {
        const fullRes = await fetch('/data/quran/quranComplete.json');
        if (fullRes.ok) {
          const fullQuran = await fullRes.json();
          for (const s of fullQuran) {
            for (const a of s.ayahs) {
              const p = a.page;
              if (!this.rawPagesCache.has(p)) {
                this.rawPagesCache.set(p, []);
              }
              this.rawPagesCache.get(p)!.push({
                surahNumber: s.number,
                surahName: s.name,
                ayahNumber: a.numberInSurah,
                globalAyahNumber: a.number,
                text: a.text,
                juz: a.juz,
              });
            }
          }
          this.completeQuranLoaded = true;
          if (this.rawPagesCache.has(pageNumber)) {
            return this.rawPagesCache.get(pageNumber)!;
          }
        }
      } catch (err) {
        console.warn('Failed loading quranComplete.json fallback:', err);
      } finally {
        this.isFetchingCompleteQuran = false;
      }
    }

    // 3. Fallback: fetch surah files for the surahs on this page
    try {
      const range = getAyahsRangeOnPage(pageNumber);
      const ayahsResult: any[] = [];
      for (let s = range.start.surah; s <= range.end.surah; s++) {
        const sRes = await fetch(`/data/quran/surahs/${s}.json`);
        if (sRes.ok) {
          const sData = await sRes.json();
          const meta = ALL_114_SURAHS.find((item) => item.number === s);
          for (const a of sData.ayahs) {
            if (a.page === pageNumber) {
              ayahsResult.push({
                surahNumber: s,
                surahName: meta ? meta.name : `سورة ${s}`,
                ayahNumber: a.numberInSurah,
                globalAyahNumber: a.number,
                text: a.text,
                juz: a.juz,
              });
            }
          }
        }
      }
      if (ayahsResult.length > 0) {
        this.rawPagesCache.set(pageNumber, ayahsResult);
        return ayahsResult;
      }
    } catch {
      // Fallback exhausted
    }

    return [];
  }

  /**
   * Loads authentic Quran text along with timestamps for a given page and reciter
   */
  public async getPageAyahs(
    pageNumber: number,
    readId: number = 123
  ): Promise<MushafPageAyah[]> {
    const p = Math.max(1, Math.min(604, pageNumber));
    const cacheKey = `page_${p}_read_${readId}`;

    if (this.pageCache.has(cacheKey)) {
      return this.pageCache.get(cacheKey)!;
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const requestPromise = (async () => {
      try {
        // 1. Fetch raw authentic text for page
        const rawAyahs = await this.fetchRawPageText(p);

        if (!rawAyahs || rawAyahs.length === 0) {
          return [];
        }

        // 2. Identify distinct surahs on this page to load their timings
        const surahNumbers = Array.from(new Set(rawAyahs.map((a) => a.surahNumber)));
        const timingMap = new Map<string, { startMs: number; endMs: number; polygon?: string; x?: string; y?: string }>();

        await Promise.all(
          surahNumbers.map(async (surahNum) => {
            try {
              const timestamps = await quranTimingService.getAyahTimestamps(readId, surahNum);
              if (timestamps && timestamps.length > 0) {
                for (const t of timestamps) {
                  timingMap.set(`${surahNum}_${t.ayahNumber}`, {
                    startMs: t.startMs,
                    endMs: t.endMs,
                    polygon: t.polygon,
                    x: t.x,
                    y: t.y,
                  });
                }
              }
            } catch {
              // Ignore timing fetch error, fall back to 0ms
            }
          })
        );

        // 3. Assemble complete MushafPageAyah list with full tashkeel and clean verse text
        const result: MushafPageAyah[] = rawAyahs.map((raw) => {
          const surahMeta = ALL_114_SURAHS.find((s) => s.number === raw.surahNumber);
          const surahName = surahMeta ? surahMeta.name : raw.surahName || `سورة ${raw.surahNumber}`;
          const isFirstAyahOfSurah = raw.ayahNumber === 1;

          const bismillahSplit = isFirstAyahOfSurah
            ? splitBismillah(raw.surahNumber, raw.text)
            : { hasHeaderBismillah: false, verseText: raw.text };

          const timing = timingMap.get(`${raw.surahNumber}_${raw.ayahNumber}`);

          return {
            surahNumber: raw.surahNumber,
            surahName,
            ayahNumber: raw.ayahNumber,
            globalAyahNumber: raw.globalAyahNumber || raw.ayahNumber,
            text: raw.text,
            cleanVerseText: bismillahSplit.verseText,
            juz: raw.juz || 1,
            isFirstAyahOfSurah,
            hasHeaderBismillah: bismillahSplit.hasHeaderBismillah,
            startMs: timing?.startMs || 0,
            endMs: timing?.endMs || 0,
            polygon: timing?.polygon,
            x: timing?.x,
            y: timing?.y,
            hasPolygon: !!timing?.polygon,
          };
        });

        // Ensure chronological sort
        result.sort((a, b) => {
          if (a.surahNumber !== b.surahNumber) return a.surahNumber - b.surahNumber;
          return a.ayahNumber - b.ayahNumber;
        });

        this.pageCache.set(cacheKey, result);
        return result;
      } catch (err) {
        console.warn(`Failed loading ayahs for Mushaf page ${p}:`, err);
        return [];
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * Preload adjacent pages for instantaneous flipping
   */
  public preloadAdjacent(pageNumber: number, readId: number = 123) {
    if (pageNumber > 1) {
      this.getPageAyahs(pageNumber - 1, readId).catch(() => {});
    }
    if (pageNumber < 604) {
      this.getPageAyahs(pageNumber + 1, readId).catch(() => {});
    }
  }
}

export const quranMushafPageService = new QuranMushafPageService();
