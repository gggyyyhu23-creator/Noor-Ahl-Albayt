import { CityCoords, PrayerTimesResult } from '../types';

export const POPULAR_CITIES: CityCoords[] = [
  { name: 'النجف الأشرف', country: 'العراق', lat: 31.9961, lng: 44.3168, timezone: 3 },
  { name: 'كربلاء المقدسة', country: 'العراق', lat: 32.6160, lng: 44.0249, timezone: 3 },
  { name: 'بغداد', country: 'العراق', lat: 33.3152, lng: 44.3661, timezone: 3 },
  { name: 'مشهد المقدسة', country: 'إيران', lat: 36.2605, lng: 59.6168, timezone: 3.5 },
  { name: 'قم المقدسة', country: 'إيران', lat: 34.6401, lng: 50.8764, timezone: 3.5 },
  { name: 'طهران', country: 'إيران', lat: 35.6892, lng: 51.3890, timezone: 3.5 },
  { name: 'بيروت', country: 'لبنان', lat: 33.8938, lng: 35.5018, timezone: 3 },
  { name: 'الكويت', country: 'الكويت', lat: 29.3759, lng: 47.9774, timezone: 3 },
  { name: 'المنامة', country: 'البحرين', lat: 26.2285, lng: 50.5860, timezone: 3 },
  { name: 'القطيف / الإحساء', country: 'السعودية', lat: 26.5567, lng: 50.0076, timezone: 3 },
  { name: 'المدينة المنورة', country: 'السعودية', lat: 24.5247, lng: 39.5692, timezone: 3 },
  { name: 'دمشق (السيدة زينب ع)', country: 'سوريا', lat: 33.5138, lng: 36.2765, timezone: 3 },
  { name: 'لندن', country: 'بريطانيا', lat: 51.5074, lng: -0.1278, timezone: 1 },
  { name: 'ديربورن (ميشيغان)', country: 'أمريكا', lat: 42.3223, lng: -83.1763, timezone: -4 },
];

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

export function calculateShiaPrayerTimes(date: Date, city: CityCoords): PrayerTimesResult {
  const lat = city.lat;
  const lng = city.lng;
  const timezone = city.timezone;

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

  // Shia Jafari Calculation angles (Leva Institute Qom):
  // Fajr: 16.0 degrees
  // Sunrise/Sunset: -0.833 degrees
  // Maghrib: 4.0 degrees below horizon (disappearance of eastern redness)
  // Isha: 14.0 degrees below horizon
  const fajrHA = hourAngle(-16.0);
  const sunriseHA = hourAngle(-0.833);
  const maghribHA = hourAngle(-4.0);
  const ishaHA = hourAngle(-14.0);

  // Asr according to Shia shadow formula (shadow = shadow at noon + height)
  const noonSunAltitude = 90 - Math.abs(lat - declination);
  const shadowAtNoon = 1 / Math.tan(degToRad(noonSunAltitude));
  const asrAltitude = radToDeg(Math.atan(1 / (shadowAtNoon + 1)));
  const asrHA = hourAngle(asrAltitude);

  const fajr = fixHour(solarNoon - fajrHA);
  const sunrise = fixHour(solarNoon - sunriseHA);
  const dhuhr = fixHour(solarNoon);
  const asr = fixHour(solarNoon + asrHA);
  const sunset = fixHour(solarNoon + sunriseHA);
  const maghrib = fixHour(solarNoon + maghribHA);
  const isha = fixHour(solarNoon + ishaHA);

  // Shia Midnight (Nisf al-Layl): Midpoint between Sunset/Maghrib and Fajr
  // (Sunset + 24 + next Fajr) / 2
  let nightDuration = fajr + 24 - maghrib;
  if (nightDuration > 24) nightDuration -= 24;
  const midnight = fixHour(maghrib + nightDuration / 2);

  // Current time in hours
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  // Next prayer detection
  const prayers = [
    { name: 'صلاة الفجر', hour: fajr, label: 'الفجر' },
    { name: 'شروق الشمس', hour: sunrise, label: 'الشروق' },
    { name: 'صلاة الظهر', hour: dhuhr, label: 'الظهر' },
    { name: 'صلاة العصر', hour: asr, label: 'العصر' },
    { name: 'غروب الشمس', hour: sunset, label: 'الغروب' },
    { name: 'صلاة المغرب', hour: maghrib, label: 'المغرب' },
    { name: 'صلاة العشاء', hour: isha, label: 'العشاء' },
    { name: 'منتصف الليل الشرعي', hour: midnight, label: 'منتصف الليل' },
  ];

  let nextP = prayers.find((p) => p.hour > currentHour);
  let diffHours = 0;
  if (!nextP) {
    nextP = prayers[0]; // Next day's Fajr
    diffHours = fajr + 24 - currentHour;
  } else {
    diffHours = nextP.hour - currentHour;
  }

  const remainingH = Math.floor(diffHours);
  const remainingM = Math.floor((diffHours - remainingH) * 60);
  const remainingText = `${remainingH} س و ${remainingM} د`;

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
