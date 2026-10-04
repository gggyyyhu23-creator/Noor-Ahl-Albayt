export interface PrayerRecitation {
  arabic: string;
  meaning?: string;
  repeatCount?: string;
  isObligatory: boolean;
}

export interface PrayerStage {
  id: string;
  stepNumber: number;
  title: string;
  shortDescription: string;
  whatToDo: string;
  recitation?: PrayerRecitation;
  obligatoryActions: string[];
  recommendedActions: string[];
  commonMistakes: string[];
  rulingSource: string;
  tips?: string;
}

export interface PrayerRulingItem {
  id: string;
  topicNumber: number;
  topicCategory: string;
  title: string;
  summary: string;
  fullRuling: string;
  detailedPoints: string[];
  source: string;
  sourceBook: string;
  sourceReference: string;
  sourceUrl?: string;
  keywords: string[];
}

export interface PrayerCommonMistake {
  id: string;
  category: 'takbir' | 'recitation' | 'ruku' | 'sujud' | 'tashahhud' | 'rakat_doubt' | 'addition_omission' | 'general';
  categoryLabel: string;
  mistakeTitle: string;
  description: string;
  correctAction: string;
  consequence: 'invalidates' | 'requires_sujud_sahw' | 'requires_ihtiyat' | 'pardonable' | 'disliked';
  consequenceLabel: string;
  source: string;
}
