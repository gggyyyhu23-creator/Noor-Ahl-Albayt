import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, RefreshCw, Volume2, VolumeX, Compass, Calendar, Sun, Moon } from 'lucide-react';
import { CityCoords, PrayerTimesResult } from '../types';
import { POPULAR_CITIES, calculateShiaPrayerTimes, calculateQiblaAngle } from '../utils/prayerTimes';

interface PrayerTimesViewProps {
  onGoToQibla?: () => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({ onGoToQibla }) => {
  const [selectedCity, setSelectedCity] = useState<CityCoords>(() => {
    try {
      const saved = localStorage.getItem('shia_selected_city');
      return saved ? JSON.parse(saved) : POPULAR_CITIES[0]; // Najaf default
    } catch {
      return POPULAR_CITIES[0];
    }
  });

  const [useGps, setUseGps] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [audioAlertEnabled, setAudioAlertEnabled] = useState(false);
  const [customCoords, setCustomCoords] = useState<{ lat: string; lng: string }>({
    lat: selectedCity.lat.toString(),
    lng: selectedCity.lng.toString(),
  });
  const [showCoordModal, setShowCoordModal] = useState(false);

  // Live timer tick every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const prayerResult: PrayerTimesResult = calculateShiaPrayerTimes(now, selectedCity);
  const qiblaAngle = calculateQiblaAngle(selectedCity.lat, selectedCity.lng);

  const handleCityChange = (cityName: string) => {
    const city = POPULAR_CITIES.find((c) => c.name === cityName);
    if (city) {
      setSelectedCity(city);
      setUseGps(false);
      setGpsError(null);
      setCustomCoords({ lat: city.lat.toString(), lng: city.lng.toString() });
      try {
        localStorage.setItem('shia_selected_city', JSON.stringify(city));
      } catch {}
    }
  };

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      setGpsError('خاصية تحديد الموقع الجغرافي (GPS) غير مدعومة في جهازك.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const tzOffsetHours = -new Date().getTimezoneOffset() / 60;

        const gpsCity: CityCoords = {
          name: 'الموقع الحالي (GPS)',
          country: 'موقعي الجغرافي',
          lat,
          lng,
          timezone: tzOffsetHours,
        };

        setSelectedCity(gpsCity);
        setUseGps(true);
        setGpsLoading(false);
        setCustomCoords({ lat: lat.toFixed(4), lng: lng.toFixed(4) });
        try {
          localStorage.setItem('shia_selected_city', JSON.stringify(gpsCity));
        } catch {}
      },
      (error) => {
        setGpsLoading(false);
        let msg = 'تعذر الحصول على الموقع الجغرافي.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'يرجى منح الإذن للوصول إلى الموقع الجغرافي (GPS) من إعدادات المتصفح أو الجهاز.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'استغرق تحديد الموقع وقتاً طويلاً. يرجى اختيار المدينة يدوياً.';
        }
        setGpsError(msg);
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  const handleSaveCustomCoords = () => {
    const lat = parseFloat(customCoords.lat);
    const lng = parseFloat(customCoords.lng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setGpsError('يرجى إدخال إحداثيات صحيحة (خط العرض بين -90 و 90، خط الطول بين -180 و 180)');
      return;
    }
    const tz = -new Date().getTimezoneOffset() / 60;
    const customCity: CityCoords = {
      name: `إحداثيات (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
      country: 'مخصص',
      lat,
      lng,
      timezone: tz,
    };
    setSelectedCity(customCity);
    setUseGps(false);
    setShowCoordModal(false);
    setGpsError(null);
    try {
      localStorage.setItem('shia_selected_city', JSON.stringify(customCity));
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Location Controls */}
      <div className="rounded-2xl bg-gradient-to-b from-[#132d24] to-[#0c1c17] p-5 border border-[#d4af37]/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#d4af37] text-sm font-semibold mb-1">
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span>مواقيت الصلاة وفق المذهب الجعفري (معهد لواء قم)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#d4af37]" />
              <span>{selectedCity.name}</span>
              <span className="text-xs bg-[#18483b] text-[#c8d8d2] px-2.5 py-0.5 rounded-full font-normal">
                {selectedCity.country}
              </span>
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGpsDetect}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#1d5042] hover:bg-[#256855] text-white border border-[#d4af37]/40 shadow transition-all active:scale-95 disabled:opacity-50"
              title="تحديد الموقع الجغرافي تلقائياً"
            >
              <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : 'text-[#d4af37]'}`} />
              <span>{gpsLoading ? 'جاري التحديد...' : 'موقعي (GPS)'}</span>
            </button>

            <button
              onClick={() => setShowCoordModal(!showCoordModal)}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#162923] hover:bg-[#1f3830] text-[#c8d8d2] border border-[#2d5849]"
            >
              إدخال إحداثيات
            </button>

            {onGoToQibla && (
              <button
                onClick={onGoToQibla}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/30"
                title="عرض بوصلة القبلة"
              >
                <Compass className="w-4 h-4" />
                <span>القبلة: {qiblaAngle}°</span>
              </button>
            )}

            <button
              onClick={() => setAudioAlertEnabled(!audioAlertEnabled)}
              className={`p-2 rounded-xl border transition-colors ${
                audioAlertEnabled
                  ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]'
                  : 'bg-[#162923] text-[#a4b5ad] border-[#2d5849] hover:text-white'
              }`}
              title={audioAlertEnabled ? 'تنبيه الأذان مفعل' : 'تفعيل تنبيه الأذان'}
            >
              {audioAlertEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* City selection quick chips */}
        <div className="mt-4 pt-4 border-t border-[#1d4034] flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#a4b5ad] ml-1 font-semibold">مدن مقدسة:</span>
          {POPULAR_CITIES.slice(0, 8).map((city) => (
            <button
              key={city.name}
              onClick={() => handleCityChange(city.name)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedCity.name === city.name && !useGps
                  ? 'bg-[#d4af37] text-[#0b1311] font-bold shadow'
                  : 'bg-[#152e25] text-[#d6e2dd] hover:bg-[#1d4235] border border-[#23473b]'
              }`}
            >
              {city.name}
            </button>
          ))}

          {/* More cities dropdown */}
          <select
            value={POPULAR_CITIES.some((c) => c.name === selectedCity.name) ? selectedCity.name : ''}
            onChange={(e) => handleCityChange(e.target.value)}
            className="bg-[#152e25] text-[#d6e2dd] border border-[#23473b] rounded-lg px-2 py-1 text-xs outline-none focus:border-[#d4af37]"
          >
            <option value="" disabled>
              سائر المدن...
            </option>
            {POPULAR_CITIES.slice(8).map((city) => (
              <option key={city.name} value={city.name}>
                {city.name} ({city.country})
              </option>
            ))}
          </select>
        </div>

        {/* GPS or manual error warning if any */}
        {gpsError && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-950/60 border border-red-800/40 text-red-200 text-xs">
            {gpsError}
          </div>
        )}
      </div>

      {/* Custom Coordinates Modal Dialog */}
      {showCoordModal && (
        <div className="p-4 rounded-xl bg-[#142822] border border-[#d4af37]/40 space-y-3">
          <h3 className="text-sm font-bold text-white">إدخال إحداثيات الموقع المخصص (Latitude / Longitude):</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#a4b5ad] block mb-1">خط العرض (Latitude - مثلاً 31.99 للنجف):</label>
              <input
                type="number"
                step="0.0001"
                value={customCoords.lat}
                onChange={(e) => setCustomCoords({ ...customCoords, lat: e.target.value })}
                className="w-full bg-[#0a1411] border border-[#2d5849] rounded-lg px-3 py-1.5 text-sm text-white focus:border-[#d4af37] outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#a4b5ad] block mb-1">خط الطول (Longitude - مثلاً 44.31 للنجف):</label>
              <input
                type="number"
                step="0.0001"
                value={customCoords.lng}
                onChange={(e) => setCustomCoords({ ...customCoords, lng: e.target.value })}
                className="w-full bg-[#0a1411] border border-[#2d5849] rounded-lg px-3 py-1.5 text-sm text-white focus:border-[#d4af37] outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCoordModal(false)}
              className="px-3 py-1 rounded-lg text-xs bg-transparent text-[#a4b5ad] hover:text-white"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveCustomCoords}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#d4af37] text-[#0b1311] hover:bg-[#e2bd44]"
            >
              حفظ وحساب المواقيت
            </button>
          </div>
        </div>
      )}

      {/* Hero Next Prayer Countdown Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#173a2f] via-[#1f4e3f] to-[#173a2f] p-6 border-2 border-[#d4af37] shadow-2xl text-center">
        <div className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold flex items-center justify-center gap-1.5 mb-1">
          <SparklesIcon className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>الصَّلَاةُ عَمُودُ الدِّينِ</span>
          <SparklesIcon className="w-3.5 h-3.5 text-[#d4af37]" />
        </div>

        <h3 className="text-sm sm:text-base text-[#e5f0eb] mb-1">الصلاة القادمة بإذن الله:</h3>
        <div className="text-2xl sm:text-4xl font-extrabold text-[#f4eedb] font-quran tracking-wide my-1">
          {prayerResult.nextPrayerName}
        </div>
        <div className="text-xl sm:text-2xl font-mono font-bold text-[#d4af37]">
          {prayerResult.nextPrayerTime}
        </div>

        <div className="inline-block mt-3 px-4 py-1.5 rounded-full bg-[#0d221c]/80 border border-[#d4af37]/40 text-xs sm:text-sm text-[#f5ebd7]">
          متبقي: <span className="font-bold text-[#d4af37] font-mono">{prayerResult.remainingTime}</span>
        </div>
      </div>

      {/* Shia Prayer Times Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* الفجر */}
        <div className="rounded-xl bg-[#0e231c] border border-[#1f4a3b] p-4 text-center hover:border-[#d4af37]/60 transition-all hover:bg-[#132c23]">
          <div className="flex items-center justify-center text-[#d4af37] mb-1">
            <Moon className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#a4b5ad] font-semibold">صلاة الفجر</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">{prayerResult.fajr}</div>
          <div className="text-[10px] text-[#6b8b7e] mt-1 font-amiri">زاوية 16° (قم)</div>
        </div>

        {/* الشروق */}
        <div className="rounded-xl bg-[#0e231c] border border-[#1f4a3b] p-4 text-center hover:border-[#d4af37]/60 transition-all hover:bg-[#132c23]">
          <div className="flex items-center justify-center text-amber-400 mb-1">
            <Sun className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#a4b5ad] font-semibold">شروق الشمس</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">{prayerResult.sunrise}</div>
          <div className="text-[10px] text-[#6b8b7e] mt-1 font-amiri">نهاية وقت الفجر</div>
        </div>

        {/* الظهر */}
        <div className="rounded-xl bg-[#0e231c] border border-[#1f4a3b] p-4 text-center hover:border-[#d4af37]/60 transition-all hover:bg-[#132c23]">
          <div className="flex items-center justify-center text-yellow-400 mb-1">
            <Sun className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#a4b5ad] font-semibold">صلاة الظهر</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">{prayerResult.dhuhr}</div>
          <div className="text-[10px] text-[#6b8b7e] mt-1 font-amiri">الزوال الشرعي</div>
        </div>

        {/* العصر */}
        <div className="rounded-xl bg-[#0e231c] border border-[#1f4a3b] p-4 text-center hover:border-[#d4af37]/60 transition-all hover:bg-[#132c23]">
          <div className="flex items-center justify-center text-amber-300 mb-1">
            <Sun className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#a4b5ad] font-semibold">صلاة العصر</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">{prayerResult.asr}</div>
          <div className="text-[10px] text-[#6b8b7e] mt-1 font-amiri">ظل القامة (الجعفري)</div>
        </div>

        {/* الغروب */}
        <div className="rounded-xl bg-[#0e231c] border border-[#1f4a3b] p-4 text-center hover:border-[#d4af37]/60 transition-all hover:bg-[#132c23]">
          <div className="flex items-center justify-center text-orange-400 mb-1">
            <Sun className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#a4b5ad] font-semibold">غروب القرص</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#dcd1be] mt-1">{prayerResult.sunset}</div>
          <div className="text-[10px] text-[#6b8b7e] mt-1 font-amiri">استتار القرص</div>
        </div>

        {/* المغرب */}
        <div className="rounded-xl bg-[#112a21] border-2 border-[#d4af37]/50 p-4 text-center hover:border-[#d4af37] transition-all hover:bg-[#16382c] shadow-lg">
          <div className="flex items-center justify-center text-[#d4af37] mb-1">
            <Moon className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#d4af37] font-bold">صلاة المغرب (الإفطار)</div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1">{prayerResult.maghrib}</div>
          <div className="text-[10px] text-[#97baa9] mt-1 font-amiri">زوال الحمرة المشرقية</div>
        </div>

        {/* العشاء */}
        <div className="rounded-xl bg-[#0e231c] border border-[#1f4a3b] p-4 text-center hover:border-[#d4af37]/60 transition-all hover:bg-[#132c23]">
          <div className="flex items-center justify-center text-indigo-300 mb-1">
            <Moon className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#a4b5ad] font-semibold">صلاة العشاء</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">{prayerResult.isha}</div>
          <div className="text-[10px] text-[#6b8b7e] mt-1 font-amiri">غياب الشفق الأحمر</div>
        </div>

        {/* منتصف الليل */}
        <div className="rounded-xl bg-[#0e231c] border border-[#1f4a3b] p-4 text-center hover:border-[#d4af37]/60 transition-all hover:bg-[#132c23]">
          <div className="flex items-center justify-center text-purple-300 mb-1">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#a4b5ad] font-semibold">منتصف الليل الشرعي</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#dcd1be] mt-1">{prayerResult.midnight}</div>
          <div className="text-[10px] text-[#6b8b7e] mt-1 font-amiri">نهاية وقت العشاء وقضاء الصلاة</div>
        </div>
      </div>

      {/* Shia Fiqh Notes regarding Prayer times */}
      <div className="rounded-xl bg-[#0c1a15] p-4 border border-[#1d3d32] text-xs text-[#a4b5ad] leading-relaxed space-y-1.5">
        <div className="font-bold text-[#d4af37] flex items-center gap-1.5 text-sm">
          <span>تنبيه فقهي حسب فتاوى مراجع الشيعة العظام (دام ظلهم):</span>
        </div>
        <p>
          • <strong>المغرب الشرعي:</strong> لا يدخل وقت المغرب بمجرد سقوط قرص الشمس وتواريه خلف الأفق، بل يشترط الأحوط وجوباً ذهاب وزوال «الحمرة المشرقية» من قبة السماء فوق الرأس (وهي حمرة تظهر في جهة المشرق بعد غروب الشمس بنحو 12 إلى 15 دقيقة).
        </p>
        <p>
          • <strong>الجمع بين الصلاتين:</strong> يجوز شرعاً للمكلف الجمع بين صلاتي الظهر والعصر، وكذلك بين المغرب والعشاء، أو التفريق بينهما في أوقات الفضيلة المستحبة.
        </p>
        <p>
          • <strong>منتصف الليل الشرعي:</strong> هو منتصف الوقت الواقع بين غروب الشمس (أو المغرب) وطلوع الفجر الصادق، وهو الغاية القصوى لوقتي المغرب والعشاء للمختار.
        </p>
      </div>
    </div>
  );
};

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.4L12 21.6l-2.4-7.2L2.4 12l7.2-2.4L12 2z" />
    </svg>
  );
}
