import { AyahTimestamp } from '../types/audioEngine';

interface RawTimingAyah {
  ayah: number;
  polygon?: string;
  start_time: number;
  end_time: number;
  x?: string;
  y?: string;
  page?: string;
}

class QuranTimingService {
  // In-memory cache: key is `${readId}_${surah}`
  private memoryCache: Map<string, AyahTimestamp[]> = new Map();
  private pendingRequests: Map<string, Promise<AyahTimestamp[] | null>> = new Map();

  private getStorageKey(readId: number, surah: number): string {
    return `quran_timing_cache_r${readId}_s${surah}_v1`;
  }

  /**
   * Validate timing monotonicity and correctness
   */
  private validateAndFormat(raw: RawTimingAyah[]): AyahTimestamp[] | null {
    if (!Array.isArray(raw) || raw.length === 0) {
      return null;
    }

    // Filter ayahs > 0 (handle ayah 0 if present as preamble/istiadhah)
    const validAyahs: AyahTimestamp[] = [];

    for (let i = 0; i < raw.length; i++) {
      const item = raw[i];
      if (typeof item.start_time !== 'number' || typeof item.end_time !== 'number') {
        return null;
      }

      // Must be start < end
      if (item.start_time >= item.end_time) {
        return null;
      }

      // Check chronological order
      if (i > 0 && item.start_time < raw[i - 1].start_time) {
        return null;
      }

      // Only push Quran ayahs (1..N). If item.ayah is 0, it's Isti'adha/Basmalah
      if (item.ayah > 0) {
        let pageStr = item.page;
        if (pageStr && typeof pageStr === 'string' && pageStr.includes('.svg')) {
          const match = pageStr.match(/(\d+)\.svg/);
          if (match) {
            pageStr = String(parseInt(match[1], 10));
          }
        }

        validAyahs.push({
          ayahNumber: item.ayah,
          startMs: item.start_time,
          endMs: item.end_time,
          polygon: item.polygon,
          page: pageStr,
          x: item.x,
          y: item.y,
        });
      }
    }

    if (validAyahs.length === 0) {
      return null;
    }

    return validAyahs;
  }

  /**
   * Get Ayah Timestamps for a given reciter read ID and surah number.
   * Returns cached data if available; otherwise fetches from official MP3Quran API.
   */
  public async getAyahTimestamps(
    readId: number,
    surahNumber: number
  ): Promise<AyahTimestamp[] | null> {
    if (!readId || readId <= 0 || surahNumber < 1 || surahNumber > 114) {
      return null;
    }

    const cacheKey = `${readId}_${surahNumber}`;

    // 1. Check in-memory cache
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    // 2. Check persistent localStorage cache
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const rawSaved = localStorage.getItem(this.getStorageKey(readId, surahNumber));
        if (rawSaved) {
          const parsed = JSON.parse(rawSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.memoryCache.set(cacheKey, parsed);
            return parsed;
          }
        }
      } catch {
        // Ignore localStorage read errors
      }
    }

    // 3. Prevent duplicate concurrent requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    // 4. Fetch from official MP3Quran API
    const requestPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        // 4. Fetch from local proxy or official MP3Quran API
        let rawData: any = null;
        try {
          const localRes = await fetch(`/api/quran/timing/${surahNumber}/${readId}`, { signal: controller.signal });
          if (localRes.ok) {
            rawData = await localRes.json();
          }
        } catch {
          // fallback to direct
        }

        if (!rawData) {
          const directUrl = `https://www.mp3quran.net/api/v3/ayat_timing?surah=${surahNumber}&read=${readId}`;
          const res = await fetch(directUrl, { signal: controller.signal });
          if (res.ok) {
            rawData = await res.json();
          }
        }
        clearTimeout(timeoutId);

        if (!rawData) {
          return null;
        }
        const formatted = this.validateAndFormat(rawData);

        if (formatted && formatted.length > 0) {
          // Store in memory
          this.memoryCache.set(cacheKey, formatted);

          // Store in localStorage asynchronously
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(
                this.getStorageKey(readId, surahNumber),
                JSON.stringify(formatted)
              );
            } catch {
              // Ignore quota errors
            }
          }

          return formatted;
        }

        return null;
      } catch (err) {
        console.warn(`Failed fetching ayah timing for read ${readId}, surah ${surahNumber}:`, err);
        return null;
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * Prefetch timing data in the background (non-blocking)
   */
  public prefetchTiming(readId: number, surahNumber: number): void {
    const cacheKey = `${readId}_${surahNumber}`;
    if (!this.memoryCache.has(cacheKey)) {
      this.getAyahTimestamps(readId, surahNumber).catch(() => {});
    }
  }
}

export const quranTimingService = new QuranTimingService();
