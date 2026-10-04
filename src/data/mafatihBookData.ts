export * from './mafatihCategories';
import { MafatihSection, MAFATIH_CATEGORIES } from './mafatihCategories';
import { MAFATIH_DUAS_FULL } from './mafatihDuasFull';
import { MAFATIH_ZIYARAT_FULL } from './mafatihZiyaratFull';
import { MAFATIH_MUNAJAT_FULL } from './mafatihMunajatFull';
import { MAFATIH_HADITH_KISA } from './mafatihHadithKisa';
import { MAFATIH_DAYS_MONTHS } from './mafatihDaysMonths';
import { MAFATIH_RAMADAN_FULL } from './mafatihRamadanFull';
import { MAFATIH_PRAYERS_TAQIBAT } from './mafatihPrayersTaqibat';
import { MAFATIH_AZKAR_BAQIYAT } from './mafatihAzkarBaqiyat';

// Combined master collection of all comprehensive Mafatih al-Jinan sections (guaranteed unique by id)
const RAW_MAFATIH_ITEMS: MafatihSection[] = [
  ...MAFATIH_HADITH_KISA,
  ...MAFATIH_DUAS_FULL,
  ...MAFATIH_ZIYARAT_FULL,
  ...MAFATIH_MUNAJAT_FULL,
  ...MAFATIH_DAYS_MONTHS,
  ...MAFATIH_RAMADAN_FULL,
  ...MAFATIH_PRAYERS_TAQIBAT,
  ...MAFATIH_AZKAR_BAQIYAT,
];

export const MAFATIH_BOOK_ITEMS: MafatihSection[] = Array.from(
  new Map(RAW_MAFATIH_ITEMS.map((item) => [item.id, item])).values()
);

// Helper to look up an item by ID
export function getMafatihItemById(id: string): MafatihSection | undefined {
  return MAFATIH_BOOK_ITEMS.find((it) => it.id === id);
}

// Helper to look up items by category
export function getMafatihItemsByCategory(category: string): MafatihSection[] {
  if (category === 'all') return MAFATIH_BOOK_ITEMS;
  return MAFATIH_BOOK_ITEMS.filter((it) => it.category === category);
}

// Helper to find items related to a calendar occasion
export function getMafatihItemsForOccasion(occasionKeyword: string): MafatihSection[] {
  const q = occasionKeyword.toLowerCase().trim();
  return MAFATIH_BOOK_ITEMS.filter((it) => 
    it.title.toLowerCase().includes(q) ||
    it.arabicTitle.toLowerCase().includes(q) ||
    it.simplifiedExplanation.toLowerCase().includes(q)
  );
}
