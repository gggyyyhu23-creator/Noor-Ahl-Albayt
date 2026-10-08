import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Compass, 
  Settings2, 
  Volume2, 
  VolumeX, 
  Bell, 
  BellOff, 
  Check, 
  Sliders, 
  RefreshCw, 
  Play, 
  Square, 
  Info, 
  Moon, 
  Sun, 
  ChevronDown, 
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  CityCoords, 
  CalculationMethodId, 
  PrayerOffsets, 
  PrayerNotificationSettings, 
  PrayerTimesResult 
} from '../types';
import { 
  POPULAR_CITIES, 
  IRAQI_CITIES, 
  HOLY_AND_GLOBAL_CITIES, 
  CALCULATION_METHODS, 
  calculateShiaPrayerTimes, 
  calculateQiblaAngle,
  calculateDistanceToMeccaKm 
} from '../utils/prayerTimes';
import { 
  prayerAdhanService 
} from '../services/prayerAdhanService';
import { getHijriDate } from '../data/calendarOccasions';

interface PrayerTimesViewProps {
  onGoToQibla?: () => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({ onGoToQibla }) => {
  // 1. Live Time
  const [now, setNow] = useState<Date>(new Date());

  // 2. City & Location
  const [selectedCity, setSelectedCity] = useState<CityCoords>(() => prayerAdhanService.getSavedCity());
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);
  const [activeCityTab, setActiveCityTab] = useState<'iraq' | 'all'>('iraq');

  // Custom Coords Modal
  const [showCoordModal, setShowCoordModal] = useState(false);
  const [customCoords, setCustomCoords] = useState<{ lat: string; lng: string }>({
    lat: selectedCity.lat.toString(),
    lng: selectedCity.lng.toString(),
  });

  // 3. Calculation Method & Offsets
  const [calcMethod, setCalcMethod] = useState<CalculationMethodId>(() => prayerAdhanService.getSavedMethod());
  const [offsets, setOffsets] = useState<PrayerOffsets>(() => prayerAdhanService.getSavedOffsets());

  // 4. Notification & Adhan Settings
  const [notificationSettings, setNotificationSettings] = useState<PrayerNotificationSettings>(() => 
    prayerAdhanService.getNotificationSettings()
  );
  const [isPlayingAudioTest, setIsPlayingAudioTest] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean>(() =>
    prayerAdhanService.hasNotificationPermission()
  );

  // Active Tab inside view: 'times' | 'settings' | 'adhan'
  const [activeSubTab, setActiveSubTab] = useState<'times' | 'adhan' | 'settings'>('times');

  // Live timer tick every second for high precision countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      // Background check for adhan minute strike
      prayerAdhanService.checkAndTriggerScheduledAdhan(current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update customCoords state when selectedCity changes
  useEffect(() => {
    setCustomCoords({
      lat: selectedCity.lat.toString(),
      lng: selectedCity.lng.toString(),
    });
  }, [selectedCity]);

  // Calculations
  const prayerResult: PrayerTimesResult = calculateShiaPrayerTimes(now, selectedCity, calcMethod, offsets);
  const qiblaAngle = calculateQiblaAngle(selectedCity.lat, selectedCity.lng);
  const distanceToMecca = calculateDistanceToMeccaKm(selectedCity.lat, selectedCity.lng);
  const hijri = getHijriDate(now);

  // --- Handlers ---
  const handleSelectCity = (city: CityCoords) => {
    setSelectedCity(city);
    prayerAdhanService.saveCity(city);
    setGpsMessage(null);
    setShowCityPickerModal(false);
  };

  const handleDetectGPS = async () => {
    setIsGpsLoading(true);
    setGpsMessage(null);
    const result = await prayerAdhanService.detectGPSLocation();
    setIsGpsLoading(false);
    if (result.isSuccess) {
      setSelectedCity(result.city);
      setGpsMessage({ text: 'تم تحديد موقعك بدقة عبر الأقمار الاصطناعية (GPS).', isError: false });
    } else {
      setGpsMessage({ text: result.errorMessage || 'تعذر تحديد الموقع الجغرافي.', isError: true });
    }
  };

  const handleSaveCustomCoords = () => {
    const lat = parseFloat(customCoords.lat);
    const lng = parseFloat(customCoords.lng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setGpsMessage({ text: 'يرجى إدخال إحداثيات صحيحة بين -90 و 90 لخط العرض وبين -180 و 180 لخط الطول.', isError: true });
      return;
    }
    const tz = -new Date().getTimezoneOffset() / 60;
    const customCity: CityCoords = {
      name: `موقع مخصص (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
      country: 'إحداثيات جغرافية',
      lat,
      lng,
      timezone: tz,
    };
    handleSelectCity(customCity);
    setShowCoordModal(false);
  };

  const handleMethodChange = (methodId: CalculationMethodId) => {
    setCalcMethod(methodId);
    prayerAdhanService.saveMethod(methodId);
  };

  const handleOffsetChange = (prayerKey: keyof PrayerOffsets, delta: number) => {
    const nextOffsets = {
      ...offsets,
      [prayerKey]: (offsets[prayerKey] || 0) + delta,
    };
    setOffsets(nextOffsets);
    prayerAdhanService.saveOffsets(nextOffsets);
  };

  const handleResetOffsets = () => {
    const reset: PrayerOffsets = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    setOffsets(reset);
    prayerAdhanService.saveOffsets(reset);
  };

  const handleTogglePrayerNotification = (prayerKey: keyof PrayerNotificationSettings) => {
    const nextSettings = {
      ...notificationSettings,
      [prayerKey]: !notificationSettings[prayerKey],
    };
    setNotificationSettings(nextSettings);
    prayerAdhanService.saveNotificationSettings(nextSettings);
  };

  const handleUpdateNotificationSettings = (partial: Partial<PrayerNotificationSettings>) => {
    const nextSettings = {
      ...notificationSettings,
      ...partial,
    };
    setNotificationSettings(nextSettings);
    prayerAdhanService.saveNotificationSettings(nextSettings);
  };

  const handleRequestPermission = async () => {
    const granted = await prayerAdhanService.requestNotificationPermission();
    setNotificationPermissionGranted(granted);
  };

  const handleToggleAudioTest = async () => {
    if (isPlayingAudioTest) {
      prayerAdhanService.stopAudio();
      setIsPlayingAudioTest(false);
    } else {
      setIsPlayingAudioTest(true);
      await prayerAdhanService.playSound(notificationSettings.soundType, notificationSettings.volume);
      setIsPlayingAudioTest(false);
    }
  };

  // Filter cities for search
  const filteredCities = (activeCityTab === 'iraq' ? IRAQI_CITIES : POPULAR_CITIES).filter((c) =>
    c.name.includes(citySearchQuery) || c.country.includes(citySearchQuery)
  );

  // Canonical 6 prayers list
  const canonicalPrayers: {
    key: keyof PrayerOffsets;
    name: string;
    time: string;
    note: string;
    icon: typeof Sun;
    isNotificationActive: boolean;
  }[] = [
    {
      key: 'fajr',
      name: 'صلاة الفجر',
      time: prayerResult.fajr,
      note: 'الفجر الصادق الشرعي',
      icon: Moon,
      isNotificationActive: notificationSettings.fajr,
    },
    {
      key: 'sunrise',
      name: 'شروق الشمس',
      time: prayerResult.sunrise,
      note: 'نهاية وقت فضيلة الفجر',
      icon: Sun,
      isNotificationActive: notificationSettings.sunrise,
    },
    {
      key: 'dhuhr',
      name: 'صلاة الظهر',
      time: prayerResult.dhuhr,
      note: 'الزوال الشرعي',
      icon: Sun,
      isNotificationActive: notificationSettings.dhuhr,
    },
    {
      key: 'asr',
      name: 'صلاة العصر',
      time: prayerResult.asr,
      note: 'ظل القامة وفق الفقه الجعفري',
      icon: Sun,
      isNotificationActive: notificationSettings.asr,
    },
    {
      key: 'maghrib',
      name: 'صلاة المغرب',
      time: prayerResult.maghrib,
      note: 'زوال الحمرة المشرقية (وقت الإفطار)',
      icon: Moon,
      isNotificationActive: notificationSettings.maghrib,
    },
    {
      key: 'isha',
      name: 'صلاة العشاء',
      time: prayerResult.isha,
      note: 'غياب الشفق الأحمر',
      icon: Moon,
      isNotificationActive: notificationSettings.isha,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Banner & Location Indicator */}
      <div className="rounded-3xl bg-gradient-to-r from-[#112d22] via-[#1a4434] to-[#112d22] p-5 sm:p-6 border-2 border-[#d4af37]/60 shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37] mb-1">
              <Clock className="w-4 h-4 text-[#d4af37]" />
              <span>مواقيت الصلاة والأذان وفق مذهب أهل البيت (عليهم السلام)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-quran flex items-center gap-2">
                <MapPin className="w-6 h-6 text-[#d4af37] shrink-0" />
                <span>{selectedCity.name}</span>
              </h2>

              <span className="text-xs px-2.5 py-1 rounded-full bg-[#0a1b14] text-[#d4af37] border border-[#d4af37]/40 font-semibold">
                {selectedCity.country}
              </span>

              <span className="text-xs px-2.5 py-1 rounded-full bg-[#16382b] text-[#c0d8cd] border border-[#245341]">
                {CALCULATION_METHODS.find((m) => m.id === calcMethod)?.name.split('(')[0] || 'المعيار الجعفري'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-1.5">
              اليوم: {new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)}
              {' • '}
              <span className="text-[#d4af37] font-semibold">
                {hijri.day} {hijri.monthName} {hijri.year} هـ
              </span>
            </p>
          </div>

          {/* Location Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCityPickerModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#143126] hover:bg-[#1c4535] text-white border border-[#285845] transition-all shadow"
            >
              <Search className="w-4 h-4 text-[#d4af37]" />
              <span>اختيار المدينة</span>
            </button>

            <button
              onClick={handleDetectGPS}
              disabled={isGpsLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#d4af37] text-[#0b1311] hover:brightness-105 transition-all shadow disabled:opacity-50"
              title="تحديد الموقع الجغرافي تلقائياً عبر GPS"
            >
              <Navigation className={`w-4 h-4 ${isGpsLoading ? 'animate-spin' : ''}`} />
              <span>{isGpsLoading ? 'جاري التحديد...' : 'موقعي (GPS)'}</span>
            </button>

            {onGoToQibla && (
              <button
                onClick={onGoToQibla}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0e241c] hover:bg-[#17382c] text-[#d4af37] border border-[#d4af37]/40 transition-all shadow"
                title="عرض بوصلة القبلة"
              >
                <Compass className="w-4 h-4" />
                <span>القبلة ({qiblaAngle}°)</span>
              </button>
            )}
          </div>
        </div>

        {/* GPS Feedback Message */}
        {gpsMessage && (
          <div className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between border ${
            gpsMessage.isError 
              ? 'bg-red-950/70 border-red-800 text-red-200' 
              : 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
          }`}>
            <span>{gpsMessage.text}</span>
            <button onClick={() => setGpsMessage(null)} className="text-xs px-2 py-0.5 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* 2. Hero Current & Next Prayer Countdown Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#123024] via-[#1a4434] to-[#0e241c] p-6 border-2 border-[#d4af37] shadow-2xl relative overflow-hidden text-center">
        {/* Sacred Header Accent */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#d4af37] tracking-widest uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>حَالَةُ الصَّلَاةِ وَالْوَقْتِ الْحَالِيِّ</span>
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
        </div>

        {/* Current State & Day Period */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#a2beb3] mb-2 font-amiri">
          <span>الحالة الآن:</span>
          <span className="text-white font-bold bg-[#143226] px-2.5 py-0.5 rounded-full border border-[#234d3d]">
            {prayerResult.currentPrayerName}
          </span>
          <span>•</span>
          <span className="text-[#f5eedc] font-semibold">{prayerResult.dayPeriod}</span>
        </div>

        {/* Next Prayer Big Title */}
        <div className="text-xs text-[#cbdad3] mb-0.5">الصلاة القادمة بإذن الله تعالى:</div>
        <h3 className="text-3xl sm:text-5xl font-extrabold text-white font-quran tracking-wide my-1 text-shadow">
          {prayerResult.nextPrayerName}
        </h3>

        {/* Next Prayer Time */}
        <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#d4af37]">
          {prayerResult.nextPrayerTime}
        </div>

        {/* Live Countdown Badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#091712]/90 border-2 border-[#d4af37]/60 shadow-xl">
          <Clock className="w-4 h-4 text-[#d4af37] animate-pulse" />
          <span className="text-xs sm:text-sm text-[#cbdad3]">الوقت المتبقي:</span>
          <span className="font-mono text-base sm:text-xl font-bold text-[#d4af37] tracking-wider">
            {prayerResult.countdownFormatted}
          </span>
          <span className="text-xs text-[#a2beb3] font-amiri">
            ({prayerResult.remainingTime})
          </span>
        </div>
      </div>

      {/* 3. Sub Tabs Navigation: الصلوات اليومية | نظام الأذان | طريقة الحساب والتصحيح */}
      <div className="flex items-center justify-center gap-2 bg-[#0e231c] p-1.5 rounded-2xl border border-[#1f4a3b] shadow">
        <button
          onClick={() => setActiveSubTab('times')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'times'
              ? 'bg-[#d4af37] text-[#0b1311] shadow'
              : 'text-[#c0d4cb] hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>مواقيت الصلوات الست</span>
        </button>

        <button
          onClick={() => setActiveSubTab('adhan')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'adhan'
              ? 'bg-[#d4af37] text-[#0b1311] shadow'
              : 'text-[#c0d4cb] hover:text-white'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>نظام الأذان والتنبيهات</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'settings'
              ? 'bg-[#d4af37] text-[#0b1311] shadow'
              : 'text-[#c0d4cb] hover:text-white'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>طريقة الحساب والتصحيح</span>
        </button>
      </div>

      {/* 4. TAB CONTENT: 1) PRAYER TIMES */}
      {activeSubTab === 'times' && (
        <div className="space-y-5">
          {/* Canonical 6 Prayers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {canonicalPrayers.map((prayer) => {
              const Icon = prayer.icon;
              const isNext = prayerResult.nextPrayerName.includes(prayer.name.replace('صلاة ', ''));
              const isPassed = prayerResult.isPassed?.[prayer.key];

              return (
                <div
                  key={prayer.key}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-lg flex flex-col justify-between ${
                    isNext
                      ? 'bg-gradient-to-br from-[#1b3d30] to-[#122e23] border-2 border-[#d4af37] scale-[1.02] shadow-xl'
                      : isPassed
                      ? 'bg-[#0a1813] border-[#183d2f] opacity-85'
                      : 'bg-[#0e231c] border-[#1f4a3b] hover:border-[#d4af37]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isNext ? 'bg-[#d4af37] text-[#0b1311]' : 'bg-[#143226] text-[#d4af37]'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white font-quran">{prayer.name}</h4>
                        <span className="text-[10px] text-[#8fa79c] block font-amiri">{prayer.note}</span>
                      </div>
                    </div>

                    {/* Adhan Toggle Button */}
                    <button
                      onClick={() => handleTogglePrayerNotification(prayer.key as any)}
                      className={`p-2 rounded-xl border transition-all ${
                        prayer.isNotificationActive
                          ? 'bg-[#18483b] text-[#d4af37] border-[#d4af37]/60 shadow'
                          : 'bg-[#11231c] text-[#718f82] border-[#1d3d30]'
                      }`}
                      title={prayer.isNotificationActive ? 'الأذان والتنبيه مفعل' : 'الأذان والتنبيه معطل'}
                    >
                      {prayer.isNotificationActive ? <Bell className="w-4 h-4 fill-current" /> : <BellOff className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between mt-2 pt-3 border-t border-[#1a3d31]">
                    <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                      {prayer.time}
                    </div>

                    <div className="text-right">
                      {isNext ? (
                        <span className="text-[11px] font-bold text-[#0b1311] bg-[#d4af37] px-2 py-0.5 rounded-full shadow">
                          الصلاة القادمة
                        </span>
                      ) : isPassed ? (
                        <span className="text-[11px] text-[#7f9c8f] bg-[#10241b] px-2 py-0.5 rounded-full border border-[#1b3d2f]">
                          انقضى الوقت
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#a2beb3]">في الانتظار</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Midnight & Qibla Quick Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* منتصف الليل الشرعي */}
            <div className="rounded-2xl bg-[#0a1813] border border-[#1d4334] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#143226] text-purple-300 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">منتصف الليل الشرعي</h4>
                  <p className="text-[11px] text-[#8fa79c] font-amiri">الغاية القصوى لصلاتي المغرب والعشاء ووقت صلاة الليل</p>
                </div>
              </div>
              <div className="font-mono text-xl font-bold text-[#d4af37]">
                {prayerResult.midnight}
              </div>
            </div>

            {/* المسافة واتجاه القبلة */}
            <div className="rounded-2xl bg-[#0a1813] border border-[#1d4334] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#143226] text-[#d4af37] flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">القبلة الشريفة (مكة المكرمة)</h4>
                  <p className="text-[11px] text-[#8fa79c] font-amiri">المسافة: {distanceToMecca.toLocaleString()} كم تقريباً</p>
                </div>
              </div>
              {onGoToQibla && (
                <button
                  onClick={onGoToQibla}
                  className="px-3 py-1.5 rounded-xl bg-[#18483b] hover:bg-[#205b4b] text-[#d4af37] text-xs font-bold border border-[#d4af37]/40 flex items-center gap-1"
                >
                  <span>{qiblaAngle}°</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: 2) ADHAN & NOTIFICATIONS */}
      {activeSubTab === 'adhan' && (
        <div className="rounded-2xl bg-[#0e231c] border border-[#1f4a3b] p-5 sm:p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#1d4334]">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-quran flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-[#d4af37]" />
                <span>إعدادات نظام الأذان والتنبيهات المباشرة</span>
              </h3>
              <p className="text-xs text-[#a2beb3] font-amiri mt-0.5">
                تخصيص صوت الأذان، التحكم بمستوى الصوت، التنبيه المسبق، وتفعيل الإشعارات في الخلفية.
              </p>
            </div>

            {/* System Permission Button */}
            {!notificationPermissionGranted && (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 rounded-xl bg-[#d4af37] text-[#0b1311] font-bold text-xs hover:brightness-105 shadow flex items-center gap-1.5"
              >
                <Bell className="w-4 h-4" />
                <span>منح إذن الإشعارات</span>
              </button>
            )}
          </div>

          {/* Sound Choice & Audio Test */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* نوع صوت الأذان */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#d4af37] block">نوع صوت التنبيه والأذان المعتمد:</label>
              
              <div className="space-y-2">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  notificationSettings.soundType === 'spiritual_chime'
                    ? 'bg-[#18483b] border-[#d4af37] text-white font-bold'
                    : 'bg-[#11271f] border-[#1d4334] text-[#c0d4cb]'
                }`}>
                  <input
                    type="radio"
                    name="soundType"
                    checked={notificationSettings.soundType === 'spiritual_chime'}
                    onChange={() => handleUpdateNotificationSettings({ soundType: 'spiritual_chime' })}
                    className="accent-[#d4af37]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm block">نغمة الأذان الروحانية المباركة (Web Audio Chime)</span>
                    <span className="text-[10px] text-[#8fa79c] font-normal block font-amiri">
                      نغمات توافقية مقامية هادئة تحاكي أثير العتبات المقدسة (تعمل بدون إنترنت 100%).
                    </span>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  notificationSettings.soundType === 'takbeer_call'
                    ? 'bg-[#18483b] border-[#d4af37] text-white font-bold'
                    : 'bg-[#11271f] border-[#1d4334] text-[#c0d4cb]'
                }`}>
                  <input
                    type="radio"
                    name="soundType"
                    checked={notificationSettings.soundType === 'takbeer_call'}
                    onChange={() => handleUpdateNotificationSettings({ soundType: 'takbeer_call' })}
                    className="accent-[#d4af37]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm block">النداء والتكبير الشرعي («الله أكبر»)</span>
                    <span className="text-[10px] text-[#8fa79c] font-normal block font-amiri">
                      صوت النداء الروحي والتكبير مع دعوة الصلاة باللغة العربية الفصحى.
                    </span>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  notificationSettings.soundType === 'silent'
                    ? 'bg-[#18483b] border-[#d4af37] text-white font-bold'
                    : 'bg-[#11271f] border-[#1d4334] text-[#c0d4cb]'
                }`}>
                  <input
                    type="radio"
                    name="soundType"
                    checked={notificationSettings.soundType === 'silent'}
                    onChange={() => handleUpdateNotificationSettings({ soundType: 'silent' })}
                    className="accent-[#d4af37]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm block">صامت (إشعار نظام بصري فقط دون صوت)</span>
                    <span className="text-[10px] text-[#8fa79c] font-normal block font-amiri">
                      ظهور إشعار الصلاة على الشاشة دون إصدار أي صوت تنبيه.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* مستوى الصوت واختبار الصوت */}
            <div className="space-y-4 bg-[#11271f] p-4 rounded-xl border border-[#1d4334]">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#d4af37] mb-2">
                  <span>مستوى صوت الأذان والتنبيه:</span>
                  <span className="font-mono">{Math.round(notificationSettings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={notificationSettings.volume}
                  onChange={(e) => handleUpdateNotificationSettings({ volume: parseFloat(e.target.value) })}
                  className="w-full accent-[#d4af37] cursor-pointer"
                />
              </div>

              {/* زر اختبار الصوت */}
              <div>
                <button
                  onClick={handleToggleAudioTest}
                  disabled={notificationSettings.soundType === 'silent'}
                  className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow ${
                    isPlayingAudioTest
                      ? 'bg-red-700 text-white hover:bg-red-800'
                      : 'bg-[#d4af37] text-[#0b1311] hover:brightness-105'
                  } disabled:opacity-50`}
                >
                  {isPlayingAudioTest ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      <span>إيقاف تجربة الصوت</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>اختبار وتجربة صوت الأذان</span>
                    </>
                  )}
                </button>
              </div>

              {/* تنبيه مسبق */}
              <div>
                <span className="text-xs font-bold text-[#d4af37] block mb-1.5">التنبيه المسبق قبل دخول وقت الصلاة:</span>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[0, 5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleUpdateNotificationSettings({ preReminderMinutes: mins as any })}
                      className={`py-1.5 rounded-lg border font-bold transition-all ${
                        notificationSettings.preReminderMinutes === mins
                          ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]'
                          : 'bg-[#0a1813] border-[#1f4a3b] text-[#c0d4cb]'
                      }`}
                    >
                      {mins === 0 ? 'بدون' : `${mins} د`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* التبديل المستقل لكل صلاة */}
          <div className="pt-4 border-t border-[#1d4334]">
            <h4 className="text-xs font-bold text-[#d4af37] mb-3">تفعيل / تعطيل التنبيه والأذان لكل صلاة بشكل مستقل:</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {canonicalPrayers.map((prayer) => (
                <label
                  key={prayer.key}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all ${
                    prayer.isNotificationActive
                      ? 'bg-[#18483b] border-[#d4af37]/80 text-white font-bold'
                      : 'bg-[#0a1813] border-[#1d4334] text-[#718f82]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={prayer.isNotificationActive}
                    onChange={() => handleTogglePrayerNotification(prayer.key as any)}
                    className="accent-[#d4af37]"
                  />
                  <span>{prayer.name}</span>
                  <span className="font-mono text-[11px] opacity-80">{prayer.time}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: 3) CALCULATION METHODS & MANUAL OFFSETS */}
      {activeSubTab === 'settings' && (
        <div className="rounded-2xl bg-[#0e231c] border border-[#1f4a3b] p-5 sm:p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-quran flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-[#d4af37]" />
              <span>طريقة الحساب الفلكي والتصحيح اليدوي</span>
            </h3>
            <p className="text-xs text-[#a2beb3] font-amiri mt-0.5">
              اختر المعيار الفقهي المعتمد، أو اضبط التوقيت يدوياً بالدقائق لكل صلاة بما يتطابق مع مدينتك.
            </p>
          </div>

          {/* Calculation Method Selection */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#d4af37] block">المعيار وطريقة الحساب الفلكي المعتمدة:</span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CALCULATION_METHODS.map((method) => {
                const isSelected = calcMethod === method.id;
                return (
                  <div
                    key={method.id}
                    onClick={() => handleMethodChange(method.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-[#18483b] border-[#d4af37] text-white shadow-lg'
                        : 'bg-[#11271f] border-[#1d4334] text-[#c0d4cb] hover:border-[#d4af37]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-white">{method.name}</h4>
                      {isSelected && <Check className="w-4 h-4 text-[#d4af37]" />}
                    </div>
                    <p className="text-[11px] text-[#a2beb3] font-amiri leading-relaxed">
                      {method.description}
                    </p>
                    <div className="text-[10px] text-[#d4af37] font-mono pt-1 border-t border-[#1f4a3b]">
                      الفجر: {method.fajrAngle}° • المغرب: {method.maghribAngle}°
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Minute Offsets */}
          <div className="pt-4 border-t border-[#1d4334] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#d4af37] block">التصحيح اليدوي بالدقائق (Manual Offsets):</span>
                <span className="text-[11px] text-[#8fa79c] font-amiri">
                  يمكنك تقديم أو تأخير أي صلاة بالدقائق لمطابقة أذان مدينتك بدقة متناهية.
                </span>
              </div>

              <button
                onClick={handleResetOffsets}
                className="text-xs text-[#d4af37] hover:underline"
              >
                إعادة ضبط الأصفار
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {canonicalPrayers.map((prayer) => {
                const val = offsets[prayer.key] || 0;
                return (
                  <div key={prayer.key} className="bg-[#11271f] border border-[#1d4334] p-3 rounded-xl text-center space-y-2">
                    <span className="text-xs font-bold text-white block">{prayer.name}</span>
                    
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOffsetChange(prayer.key, -1)}
                        className="w-7 h-7 rounded-lg bg-[#18483b] text-[#d4af37] font-bold text-sm flex items-center justify-center hover:bg-[#205b4b]"
                      >
                        -
                      </button>

                      <span className={`font-mono text-xs font-bold ${val > 0 ? 'text-emerald-400' : val < 0 ? 'text-amber-400' : 'text-white'}`}>
                        {val > 0 ? `+${val}` : val} د
                      </span>

                      <button
                        onClick={() => handleOffsetChange(prayer.key, 1)}
                        className="w-7 h-7 rounded-lg bg-[#18483b] text-[#d4af37] font-bold text-sm flex items-center justify-center hover:bg-[#205b4b]"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-[10px] text-[#718f82] block font-mono">الوقت: {prayer.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. City Picker Modal Dialog */}
      {showCityPickerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCityPickerModal(false)}
        >
          <div
            className="relative w-full max-w-xl max-h-[85vh] bg-[#0c1f18] border-2 border-[#d4af37]/60 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f4a3b]">
              <div>
                <h3 className="text-base font-bold text-white font-quran flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#d4af37]" />
                  <span>اختيار المدينة والمحافظة</span>
                </h3>
                <span className="text-xs text-[#8fa79c]">اختر مدينتك لحساب المواقيت والقبلة بدقة متناهية</span>
              </div>
              <button
                onClick={() => setShowCityPickerModal(false)}
                className="w-8 h-8 rounded-full bg-[#143226] text-[#cbdad3] hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* City Tabs: العراق vs سائر العتبات والمدن */}
            <div className="flex items-center gap-2 bg-[#091712] p-1 rounded-xl border border-[#1d4334]">
              <button
                onClick={() => setActiveCityTab('iraq')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCityTab === 'iraq' ? 'bg-[#d4af37] text-[#0b1311]' : 'text-[#a2beb3]'
                }`}
              >
                محافظات ومدن العراق (المراقد الشريفة)
              </button>
              <button
                onClick={() => setActiveCityTab('all')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCityTab === 'all' ? 'bg-[#d4af37] text-[#0b1311]' : 'text-[#a2beb3]'
                }`}
              >
                سائر العتبات والمدن الإسلامية والعالمية
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن اسم المدينة أو المحافظة..."
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                className="w-full bg-[#07130e] border border-[#204a3a] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#688a7c] outline-none focus:border-[#d4af37]"
              />
              <Search className="w-4 h-4 text-[#d4af37] absolute left-3 top-3 pointer-events-none" />
            </div>

            {/* Cities Grid List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-72 pr-1">
              {filteredCities.map((c) => {
                const isSelected = selectedCity.name === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => handleSelectCity(c)}
                    className={`w-full p-3 rounded-xl text-right flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-[#18483b] border-[#d4af37] text-white font-bold'
                        : 'bg-[#11271f] border-[#1d4334] text-[#c0d4cb] hover:bg-[#16382c]'
                    }`}
                  >
                    <div>
                      <span className="text-xs sm:text-sm block">{c.name}</span>
                      <span className="text-[10px] text-[#8fa79c] block font-amiri">{c.country} • خط العرض {c.lat}°</span>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-[#d4af37]" />
                    ) : (
                      <span className="text-[10px] text-[#718f82]">اختيار ←</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Manual Coordinates Option */}
            <div className="pt-2 border-t border-[#1f4a3b] flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setShowCityPickerModal(false);
                  setShowCoordModal(true);
                }}
                className="text-[#d4af37] hover:underline font-bold"
              >
                + إدخال إحداثيات خط العرض والطول يدوياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Custom Coordinates Modal */}
      {showCoordModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCoordModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0c1f18] border-2 border-[#d4af37]/60 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white font-quran">إدخال إحداثيات مخصصة (Latitude / Longitude):</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#a2beb3] block mb-1">خط العرض (Latitude - مثلاً 31.99 للنجف):</label>
                <input
                  type="number"
                  step="0.0001"
                  value={customCoords.lat}
                  onChange={(e) => setCustomCoords({ ...customCoords, lat: e.target.value })}
                  className="w-full bg-[#07130e] border border-[#234d3d] rounded-xl p-2.5 text-xs sm:text-sm text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="text-xs text-[#a2beb3] block mb-1">خط الطول (Longitude - مثلاً 44.31 للنجف):</label>
                <input
                  type="number"
                  step="0.0001"
                  value={customCoords.lng}
                  onChange={(e) => setCustomCoords({ ...customCoords, lng: e.target.value })}
                  className="w-full bg-[#07130e] border border-[#234d3d] rounded-xl p-2.5 text-xs sm:text-sm text-white outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCoordModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs text-[#a2beb3] hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCustomCoords}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#d4af37] text-[#0b1311] hover:brightness-105"
              >
                تطبيق وحفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
