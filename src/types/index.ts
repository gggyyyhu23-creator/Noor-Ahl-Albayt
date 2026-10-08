export type NavTab = 
  | 'home' 
  | 'prayers' 
  | 'tasbeeh' 
  | 'duas' 
  | 'occasions' 
  | 'nahj' 
  | 'shakk' 
  | 'qibla' 
  | 'ai_studio' 
  | 'ai_assistant';

export interface CityCoords {
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: number; // UTC offset in hours
  isIraqi?: boolean;
}

export type CalculationMethodId = 'tehran' | 'najaf' | 'shia_general';

export interface CalculationMethod {
  id: CalculationMethodId;
  name: string;
  description: string;
  fajrAngle: number;
  maghribAngle: number;
  ishaAngle: number;
}

export interface PrayerOffsets {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface PrayerNotificationSettings {
  fajr: boolean;
  sunrise: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  preReminderMinutes: 0 | 5 | 10 | 15;
  soundType: 'spiritual_chime' | 'takbeer_call' | 'silent';
  volume: number; // 0 to 1
}

export interface PrayerTimesResult {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  sunset: string;
  maghrib: string;
  isha: string;
  midnight: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  remainingTime: string;
  currentPrayerName?: string;
  remainingSeconds?: number;
  countdownFormatted?: string;
  dayPeriod?: string;
  isPassed?: Record<string, boolean>;
}

export interface DuaItem {
  id: string;
  title: string;
  category: 'duas' | 'ziyarat' | 'munajat' | 'daily';
  time: string;
  virtue: string;
  narrator: string;
  arabicText: string[];
  translation?: string;
  reciter?: string;
}

export interface OccasionItem {
  id: string;
  month: number; // 1 to 12 Hijri
  day: number;
  title: string;
  type: 'wiladat' | 'shahadat' | 'eid' | 'historical';
  description: string;
  figure: string;
  mafatihId?: string;
  mafatihRelationship?: 'specific' | 'general';
  source?: string;
  recommendedDeeds?: string[];
  divergenceNote?: string;
}

export interface HadithItem {
  id: string;
  speaker: string;
  title: string;
  text: string;
  source: string;
  category: string;
}

export interface ShakkRule {
  id: string;
  title: string;
  category: 'invalidating' | 'ignorable' | 'correctable';
  situation: string;
  ruling: string;
  procedure: string;
  details: string;
}
