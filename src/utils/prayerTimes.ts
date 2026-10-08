import { 
  CityCoords, 
  PrayerTimesResult, 
  CalculationMethodId, 
  CalculationMethod, 
  PrayerOffsets 
} from '../types';

export const CALCULATION_METHODS: CalculationMethod[] = [
  {
    id: 'najaf',
    name: 'تقويم العتبات المقدسة (النجف الأشرف وكربلاء)',
    description: 'المعيار المعتمد في العتبة العلوية والحسينية ومكتب سماحة السيد السيستاني (الفجر 16.5°، زوال الحمرة المشرقية 4.0°، العشاء 14.0°).',
    fajrAngle: 16.5,
    maghribAngle: 4.0,
    ishaAngle: 14.0,
  },
  {
    id: 'tehran',
    name: 'معهد لواء قم / جامعة طهران',
    description: 'المعيار الفلكي لمعهد لواء في قم المقدسة وجامعة طهران (الفجر 17.7°، زوال الحمرة 4.5°، العشاء 14.0°).',
    fajrAngle: 17.7,
    maghribAngle: 4.5,
    ishaAngle: 14.0,
  },
  {
    id: 'shia_general',
    name: 'الحساب الجعفري العام (الفقه الشيعي)',
    description: 'الحساب الشرعي العام وفق زوال الحمرة المشرقية (الفجر 16.0°، المغرب 4.0°، العشاء 14.0°).',
    fajrAngle: 16.0,
    maghribAngle: 4.0,
    ishaAngle: 14.0,
  },
];

export const IRAQI_CITIES: CityCoords[] = [
  { name: 'النجف الأشرف', country: 'العراق', lat: 31.9961, lng: 44.3168, timezone: 3, isIraqi: true },
  { name: 'كربلاء المقدسة', country: 'العراق', lat: 32.6160, lng: 44.0249, timezone: 3, isIraqi: true },
  { name: 'الكوفة العلوية', country: 'العراق', lat: 32.0298, lng: 44.4011, timezone: 3, isIraqi: true },
  { name: 'بغداد (الكاظمية)', country: 'العراق', lat: 33.3152, lng: 44.3661, timezone: 3, isIraqi: true },
  { name: 'سامراء المشرفة', country: 'العراق', lat: 34.1983, lng: 43.8742, timezone: 3, isIraqi: true },
  { name: 'بلد (السيد محمد ع)', country: 'العراق', lat: 34.0139, lng: 44.1436, timezone: 3, isIraqi: true },
  { name: 'البصرة', country: 'العراق', lat: 30.5081, lng: 47.7835, timezone: 3, isIraqi: true },
  { name: 'الحلة (بابل)', country: 'العراق', lat: 32.4637, lng: 44.4309, timezone: 3, isIraqi: true },
  { name: 'السماوة (المثنى)', country: 'العراق', lat: 31.3142, lng: 45.2811, timezone: 3, isIraqi: true },
  { name: 'الديوانية (القادسية)', country: 'العراق', lat: 31.9929, lng: 44.9255, timezone: 3, isIraqi: true },
  { name: 'الناصرية (ذي قار)', country: 'العراق', lat: 31.0439, lng: 46.2573, timezone: 3, isIraqi: true },
  { name: 'العمارة (ميسان)', country: 'العراق', lat: 31.8441, lng: 47.1458, timezone: 3, isIraqi: true },
  { name: 'الكوت (واسط)', country: 'العراق', lat: 32.5128, lng: 45.8197, timezone: 3, isIraqi: true },
  { name: 'الموصل (نينوى)', country: 'العراق', lat: 36.3400, lng: 43.1300, timezone: 3, isIraqi: true },
  { name: 'أربيل', country: 'العراق', lat: 36.1901, lng: 44.0091, timezone: 3, isIraqi: true },
  { name: 'السليمانية', country: 'العراق', lat: 35.5574, lng: 45.4359, timezone: 3, isIraqi: true },
  { name: 'دهوك', country: 'العراق', lat: 36.8679, lng: 42.9885, timezone: 3, isIraqi: true },
  { name: 'كركوك', country: 'العراق', lat: 35.4681, lng: 44.3922, timezone: 3, isIraqi: true },
  { name: 'بعقوبة (ديالى)', country: 'العراق', lat: 33.7439, lng: 44.6444, timezone: 3, isIraqi: true },
  { name: 'الرمادي (الأنبار)', country: 'العراق', lat: 33.4206, lng: 43.3089, timezone: 3, isIraqi: true },
];

export const HOLY_AND_GLOBAL_CITIES: CityCoords[] = [
  { name: 'مشهد المقدسة (الإمام الرضا ع)', country: 'إيران', lat: 36.2605, lng: 59.6168, timezone: 3.5 },
  { name: 'قم المقدسة (السيدة معصومة ع)', country: 'إيران', lat: 34.6401, lng: 50.8764, timezone: 3.5 },
  { name: 'طهران', country: 'إيران', lat: 35.6892, lng: 51.3890, timezone: 3.5 },
  { name: 'دمشق (السيدة زينب ع)', country: 'سوريا', lat: 33.5138, lng: 36.2765, timezone: 3 },
  { name: 'بيروت', country: 'لبنان', lat: 33.8938, lng: 35.5018, timezone: 3 },
  { name: 'المدينة المنورة', country: 'السعودية', lat: 24.5247, lng: 39.5692, timezone: 3 },
  { name: 'مكة المكرمة', country: 'السعودية', lat: 21.4225, lng: 39.8262, timezone: 3 },
  { name: 'الكويت', country: 'الكويت', lat: 29.3759, lng: 47.9774, timezone: 3 },
  { name: 'المنامة', country: 'البحرين', lat: 26.2285, lng: 50.5860, timezone: 3 },
  { name: 'القطيف / الأحساء', country: 'السعودية', lat: 26.5567, lng: 50.0076, timezone: 3 },
  { name: 'لندن', country: 'بريطانيا', lat: 51.5074, lng: -0.1278, timezone: 1 },
  { name: 'ديربورن (ميشيغان)', country: 'أمريكا', lat: 42.3223, lng: -83.1763, timezone: -4 },
  { name: 'مونتريال', country: 'كندا', lat: 45.5017, lng: -73.5673, timezone: -4 },
  { name: 'سيدني', country: 'أستراليا', lat: -33.8688, lng: 151.2093, timezone: 10 },
];

export const POPULAR_CITIES: CityCoords[] = [
  ...IRAQI_CITIES,
  ...HOLY_AND_GLOBAL_CITIES,
];

export const DEFAULT_OFFSETS: PrayerOffsets = {
  fajr: 0,
  sunrise: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
};

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

function radToDeg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

function fixHour(hour: number): number {
  hour = hour - 24.0 * Math.floor(hour / 24.0);
  return hour < 0 ? hour + 24.0 : hour;
}

function formatTime(decimalHour: number): string {
  const totalMinutes = Math.round(decimalHour * 60);
  let h = Math.floor(totalMinutes / 60) % 24;
  let m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function calculateShiaPrayerTimes(
  date: Date, 
  city: CityCoords,
  methodId: CalculationMethodId = 'najaf',
  offsets: PrayerOffsets = DEFAULT_OFFSETS
): PrayerTimesResult {
  const lat = city.lat;
  const lng = city.lng;
  const timezone = city.timezone;

  const method = CALCULATION_METHODS.find((m) => m.id === methodId) || CALCULATION_METHODS[0];

  // Day of year
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Equation of time & solar declination
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const equationOfTime = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // minutes
  const declination = 23.45 * Math.sin(degToRad((360 / 365) * (dayOfYear - 81))); // degrees

  // Solar noon
  const solarNoon = 12 + timezone - lng / 15 - equationOfTime / 60;

  // Sun hour angle helper
  const hourAngle = (angle: number): number => {
    const latRad = degToRad(lat);
    const decRad = degToRad(declination);
    const angRad = degToRad(angle);

    const cosH = (Math.sin(angRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
    if (cosH > 1) return 0; // Sun never reaches angle
    if (cosH < -1) return 12; // Sun always below
    return radToDeg(Math.acos(cosH)) / 15;
  };

  // Shia Jafari Calculation angles:
  const fajrHA = hourAngle(-method.fajrAngle);
  const sunriseHA = hourAngle(-0.833);
  const maghribHA = hourAngle(-method.maghribAngle);
  const ishaHA = hourAngle(-method.ishaAngle);

  // Asr according to Shia shadow formula (shadow = shadow at noon + height)
  const noonSunAltitude = 90 - Math.abs(lat - declination);
  const shadowAtNoon = 1 / Math.tan(degToRad(noonSunAltitude));
  const asrAltitude = radToDeg(Math.atan(1 / (shadowAtNoon + 1)));
  const asrHA = hourAngle(asrAltitude);

  // Apply base hours + manual minute offsets
  const fajr = fixHour(solarNoon - fajrHA + (offsets.fajr || 0) / 60);
  const sunrise = fixHour(solarNoon - sunriseHA + (offsets.sunrise || 0) / 60);
  const dhuhr = fixHour(solarNoon + (offsets.dhuhr || 0) / 60);
  const asr = fixHour(solarNoon + asrHA + (offsets.asr || 0) / 60);
  const sunset = fixHour(solarNoon + sunriseHA);
  const maghrib = fixHour(solarNoon + maghribHA + (offsets.maghrib || 0) / 60);
  const isha = fixHour(solarNoon + ishaHA + (offsets.isha || 0) / 60);

  // Shia Midnight (Nisf al-Layl): Midpoint between Sunset/Maghrib and Fajr
  let nightDuration = fajr + 24 - maghrib;
  if (nightDuration > 24) nightDuration -= 24;
  const midnight = fixHour(maghrib + nightDuration / 2);

  // Current time in hours
  const currentHour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  // The 6 main prayers + sunrise
  const prayerSchedule = [
    { key: 'fajr', name: 'صلاة الفجر', hour: fajr, label: 'الفجر' },
    { key: 'sunrise', name: 'شروق الشمس', hour: sunrise, label: 'الشروق' },
    { key: 'dhuhr', name: 'صلاة الظهر', hour: dhuhr, label: 'الظهر' },
    { key: 'asr', name: 'صلاة العصر', hour: asr, label: 'العصر' },
    { key: 'maghrib', name: 'صلاة المغرب', hour: maghrib, label: 'المغرب' },
    { key: 'isha', name: 'صلاة العشاء', hour: isha, label: 'العشاء' },
  ];

  // Current prayer & Next prayer detection
  let currentPrayerName = 'الانتظار للصلاة';
  let nextP = prayerSchedule[0];
  let diffHours = 0;

  // Determine current active prayer
  if (currentHour >= fajr && currentHour < sunrise) {
    currentPrayerName = 'صلاة الفجر';
  } else if (currentHour >= sunrise && currentHour < dhuhr) {
    currentPrayerName = 'ما بعد الشروق (الضحى)';
  } else if (currentHour >= dhuhr && currentHour < asr) {
    currentPrayerName = 'صلاة الظهر';
  } else if (currentHour >= asr && currentHour < maghrib) {
    currentPrayerName = 'صلاة العصر';
  } else if (currentHour >= maghrib && currentHour < isha) {
    currentPrayerName = 'صلاة المغرب';
  } else if (currentHour >= isha || currentHour < fajr) {
    currentPrayerName = 'صلاة العشاء ونافلة الليل';
  }

  // Find next upcoming prayer
  const upcoming = prayerSchedule.find((p) => p.hour > currentHour);
  if (upcoming) {
    nextP = upcoming;
    diffHours = upcoming.hour - currentHour;
  } else {
    // Tomorrow's Fajr
    nextP = prayerSchedule[0];
    diffHours = fajr + 24 - currentHour;
  }

  const remainingSeconds = Math.max(0, Math.round(diffHours * 3600));
  const remH = Math.floor(remainingSeconds / 3600);
  const remM = Math.floor((remainingSeconds % 3600) / 60);
  const remS = remainingSeconds % 60;

  const countdownFormatted = `${remH.toString().padStart(2, '0')}:${remM.toString().padStart(2, '0')}:${remS.toString().padStart(2, '0')}`;
  const remainingText = remH > 0 ? `${remH} س و ${remM} د` : `${remM} د و ${remS} ث`;

  // Day period description
  let dayPeriod = 'صباح مبارك';
  if (currentHour >= 3 && currentHour < 6) {
    dayPeriod = 'وقت الفجر والسحر المبارك';
  } else if (currentHour >= 6 && currentHour < 12) {
    dayPeriod = 'ساعات الصباح والضحى';
  } else if (currentHour >= 12 && currentHour < 16) {
    dayPeriod = 'وقت الظهيرة وصلاتي الظهر والعصر';
  } else if (currentHour >= 16 && currentHour < 18) {
    dayPeriod = 'أصيل اليوم واقتراب الغروب';
  } else if (currentHour >= 18 && currentHour < 23) {
    dayPeriod = 'أمسية إيمانية وصلاتي المغرب والعشاء';
  } else {
    dayPeriod = 'سكون الليل وأوقات صلاة الليل والتهجد';
  }

  const isPassed: Record<string, boolean> = {
    fajr: currentHour >= fajr,
    sunrise: currentHour >= sunrise,
    dhuhr: currentHour >= dhuhr,
    asr: currentHour >= asr,
    maghrib: currentHour >= maghrib,
    isha: currentHour >= isha,
  };

  return {
    fajr: formatTime(fajr),
    sunrise: formatTime(sunrise),
    dhuhr: formatTime(dhuhr),
    asr: formatTime(asr),
    sunset: formatTime(sunset),
    maghrib: formatTime(maghrib),
    isha: formatTime(isha),
    midnight: formatTime(midnight),
    nextPrayerName: nextP.name,
    nextPrayerTime: formatTime(nextP.hour),
    remainingTime: remainingText,
    currentPrayerName,
    remainingSeconds,
    countdownFormatted,
    dayPeriod,
    isPassed,
  };
}

// Qibla direction calculation (towards Mecca Kaaba: Lat 21.4225, Lng 39.8262)
export function calculateQiblaAngle(lat: number, lng: number): number {
  const meccaLat = 21.4225;
  const meccaLng = 39.8262;

  const latRad = degToRad(lat);
  const lngRad = degToRad(lng);
  const meccaLatRad = degToRad(meccaLat);
  const meccaLngRad = degToRad(meccaLng);

  const deltaLng = meccaLngRad - lngRad;

  const y = Math.sin(deltaLng);
  const x = Math.cos(latRad) * Math.tan(meccaLatRad) - Math.sin(latRad) * Math.cos(deltaLng);

  let qibla = radToDeg(Math.atan2(y, x));
  qibla = (qibla + 360) % 360;
  return Math.round(qibla);
}

// Great-circle distance between two coordinates in kilometers (Haversine formula)
export function calculateDistanceToMeccaKm(lat: number, lng: number): number {
  const meccaLat = 21.4225;
  const meccaLng = 39.8262;
  const R = 6371; // Earth radius in km

  const dLat = degToRad(meccaLat - lat);
  const dLng = degToRad(meccaLng - lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat)) * Math.cos(degToRad(meccaLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

