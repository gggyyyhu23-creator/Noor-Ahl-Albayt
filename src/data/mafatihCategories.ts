export interface MafatihSection {
  id: string;
  title: string;
  category: 
    | 'duas' 
    | 'ziyarat' 
    | 'days' 
    | 'months' 
    | 'ramadan' 
    | 'taqibat' 
    | 'munajat'
    | 'prayers' 
    | 'azkar'
    | 'occasions' 
    | 'kisa';
  categoryLabel: string;
  arabicTitle: string;
  source: string;
  virtue: string;
  instructions?: string;
  occasionId?: string; // Links to calendar occasion
  arabicText: string[];
  simplifiedExplanation: string;
}

export const MAFATIH_CATEGORIES = [
  { id: 'all', label: 'جميع الأبواب' },
  { id: 'kisa', label: 'حديث الكساء الشريف' },
  { id: 'duas', label: 'الأدعية' },
  { id: 'ziyarat', label: 'الزيارات' },
  { id: 'munajat', label: 'المناجاة' },
  { id: 'days', label: 'أعمال الأيام والليالي' },
  { id: 'months', label: 'أعمال الأشهر' },
  { id: 'ramadan', label: 'شهر رمضان وليالي القدر' },
  { id: 'taqibat', label: 'التعقيبات' },
  { id: 'prayers', label: 'الصلوات' },
  { id: 'azkar', label: 'الأذكار والأحراز' },
  { id: 'occasions', label: 'الأدعية الخاصة بالمناسبات' },
];
