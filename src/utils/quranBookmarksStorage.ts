export interface QuranBookmark {
  id: string;
  pageNumber: number;
  surahName: string;
  juz: number;
  note?: string;
  savedAt: number;
}

const BOOKMARKS_KEY = 'quran_saved_bookmarks_v1';
const LAST_READ_PAGE_KEY = 'quran_last_read_page_v1';
const PREFERRED_VIEW_KEY = 'quran_preferred_view_mode_v1';

export function getQuranBookmarks(): QuranBookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveQuranBookmarks(list: QuranBookmark[]) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed saving bookmarks', e);
  }
}

export function isPageBookmarked(pageNum: number): boolean {
  const list = getQuranBookmarks();
  return list.some((b) => b.pageNumber === pageNum);
}

export function toggleQuranBookmark(pageNum: number, surahName: string, juz: number, note?: string): boolean {
  const list = getQuranBookmarks();
  const idx = list.findIndex((b) => b.pageNumber === pageNum);
  if (idx >= 0) {
    list.splice(idx, 1);
    saveQuranBookmarks(list);
    return false; // removed
  } else {
    list.unshift({
      id: `bookmark_page_${pageNum}_${Date.now()}`,
      pageNumber: pageNum,
      surahName,
      juz,
      note,
      savedAt: Date.now(),
    });
    saveQuranBookmarks(list);
    return true; // added
  }
}

export function saveLastReadQuranPage(pageNum: number) {
  try {
    localStorage.setItem(LAST_READ_PAGE_KEY, pageNum.toString());
  } catch (e) {
    console.error('Failed to save last read page', e);
  }
}

export function getLastReadQuranPage(): number | null {
  try {
    const raw = localStorage.getItem(LAST_READ_PAGE_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch (e) {
    return null;
  }
}

export function getPreferredQuranView(): 'mushaf' | 'text' {
  try {
    const raw = localStorage.getItem(PREFERRED_VIEW_KEY);
    if (raw === 'mushaf' || raw === 'text') {
      return raw;
    }
  } catch (e) {
    // ignore
  }
  return 'mushaf';
}

export function savePreferredQuranView(mode: 'mushaf' | 'text') {
  try {
    localStorage.setItem(PREFERRED_VIEW_KEY, mode);
  } catch (e) {
    // ignore
  }
}
