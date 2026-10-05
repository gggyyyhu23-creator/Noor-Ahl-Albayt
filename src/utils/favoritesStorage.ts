export interface FavoriteItem {
  id: string;
  type: 'dua' | 'ziyarat' | 'work' | 'occasion' | 'story' | 'mafatih' | 'quran' | 'infallible';
  title: string;
  subtitle: string;
  snippet?: string;
  targetTab: string;
  targetId?: string;
  savedAt: number;
}

export interface LastReadPosition {
  sectionId: string;
  itemId: string;
  itemTitle: string;
  savedAt: number;
}

const FAVORITES_KEY = 'shia_app_favorites_v1';
const LAST_READ_KEY = 'shia_app_last_read_v1';

let memoryFavorites: FavoriteItem[] = [];
let memoryLastRead: LastReadPosition | null = null;

export function getFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return memoryFavorites;
  }
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveFavorites(list: FavoriteItem[]) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    memoryFavorites = list;
    return;
  }
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed saving favorites to localStorage', e);
  }
}

export function isFavorite(id: string): boolean {
  const list = getFavorites();
  return list.some((item) => item.id === id);
}

export function toggleFavorite(item: Omit<FavoriteItem, 'savedAt'>): boolean {
  const list = getFavorites();
  const index = list.findIndex((fav) => fav.id === item.id);
  if (index >= 0) {
    list.splice(index, 1);
    saveFavorites(list);
    return false; // removed
  } else {
    list.unshift({ ...item, savedAt: Date.now() });
    saveFavorites(list);
    return true; // added
  }
}

export function getLastReadPosition(): LastReadPosition | null {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveLastReadPosition(pos: LastReadPosition) {
  try {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify(pos));
  } catch (e) {}
}
