import { ALL_114_SURAHS } from '../data/quranSurahsAll';
import { getMushafPageForAyah, getFirstAyahOnPage } from './quranPageMapping';

export interface QuranContinueReadingState {
  lastViewMode: 'text' | 'mushaf';
  lastSurahNumber: number;
  lastSurahName: string;
  lastAyahNumber: number;
  lastMushafPage: number;
  lastReciterId: string;
  lastAudioPositionSec?: number;
  lastAudioSurahNumber?: number;
  updatedAt: number;
}

const CONTINUE_READING_KEY = 'quran_continue_reading_state_v2';
const LAST_RECITER_KEY = 'quran_last_selected_reciter_id_v2';
const DEFAULT_RECITER_ID = 'mishary-alafasy';

let memoryContinueReading: QuranContinueReadingState | null = null;
let memoryLastReciter: string = DEFAULT_RECITER_ID;

export function getQuranContinueReading(): QuranContinueReadingState {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return memoryContinueReading || {
      lastViewMode: 'mushaf',
      lastSurahNumber: 1,
      lastSurahName: 'الفاتحة',
      lastAyahNumber: 1,
      lastMushafPage: 1,
      lastReciterId: memoryLastReciter,
      updatedAt: Date.now(),
    };
  }

  try {
    const raw = localStorage.getItem(CONTINUE_READING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.lastSurahNumber) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  // Default state: Al-Fatihah, page 1
  return {
    lastViewMode: 'mushaf',
    lastSurahNumber: 1,
    lastSurahName: 'الفاتحة',
    lastAyahNumber: 1,
    lastMushafPage: 1,
    lastReciterId: getLastSelectedReciter(),
    updatedAt: Date.now(),
  };
}

export function saveQuranContinueReading(
  update: Partial<QuranContinueReadingState>
): QuranContinueReadingState {
  const current = getQuranContinueReading();
  const merged: QuranContinueReadingState = {
    ...current,
    ...update,
    updatedAt: Date.now(),
  };

  // Keep surah name in sync if surah number changed
  if (update.lastSurahNumber && (!update.lastSurahName || update.lastSurahName === current.lastSurahName)) {
    const meta = ALL_114_SURAHS.find((s) => s.number === update.lastSurahNumber);
    if (meta) {
      merged.lastSurahName = meta.name;
    }
  }

  // Ensure page and ayah harmony
  if (update.lastViewMode === 'mushaf' && update.lastMushafPage && !update.lastAyahNumber) {
    const startAyah = getFirstAyahOnPage(update.lastMushafPage);
    merged.lastSurahNumber = startAyah.surahNumber;
    merged.lastSurahName = startAyah.surahName;
    merged.lastAyahNumber = startAyah.ayahNumber;
  } else if (update.lastViewMode === 'text' && update.lastSurahNumber && update.lastAyahNumber && !update.lastMushafPage) {
    merged.lastMushafPage = getMushafPageForAyah(update.lastSurahNumber, update.lastAyahNumber);
  }

  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    memoryContinueReading = merged;
    return merged;
  }

  try {
    localStorage.setItem(CONTINUE_READING_KEY, JSON.stringify(merged));
    // Also sync old storage keys for backward compatibility
    localStorage.setItem('quran_last_read_page_v1', merged.lastMushafPage.toString());
    localStorage.setItem('quran_preferred_view_mode_v1', merged.lastViewMode);
  } catch (e) {
    console.error('Failed saving continue reading state', e);
  }

  return merged;
}

export function getLastSelectedReciter(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return memoryLastReciter;
  }
  try {
    return localStorage.getItem(LAST_RECITER_KEY) || DEFAULT_RECITER_ID;
  } catch (e) {
    return DEFAULT_RECITER_ID;
  }
}

export function saveLastSelectedReciter(reciterId: string) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    memoryLastReciter = reciterId;
    return;
  }
  try {
    localStorage.setItem(LAST_RECITER_KEY, reciterId);
  } catch (e) {
    // ignore
  }
}
