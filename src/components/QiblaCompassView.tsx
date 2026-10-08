import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Navigation, 
  Sparkles, 
  Info, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Search
} from 'lucide-react';
import { 
  POPULAR_CITIES, 
  IRAQI_CITIES, 
  calculateQiblaAngle, 
  calculateDistanceToMeccaKm 
} from '../utils/prayerTimes';
import { CityCoords } from '../types';
import { prayerAdhanService } from '../services/prayerAdhanService';

export const QiblaCompassView: React.FC = () => {
  const [city, setCity] = useState<CityCoords>(() => prayerAdhanService.getSavedCity());
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [searchCityQuery, setSearchCityQuery] = useState<string>('');

  const qiblaAngle = calculateQiblaAngle(city.lat, city.lng);
  const distanceToMecca = calculateDistanceToMeccaKm(city.lat, city.lng);

  // Listen to device orientation sensors (Mobile Compass)
  useEffect(() => {
    let sensorDetected = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // iOS Safari provides webkitCompassHeading directly (degrees relative to magnetic north)
      if ((e as any).webkitCompassHeading !== undefined && (e as any).webkitCompassHeading !== null) {
        sensorDetected = true;
        setHasCompassSensor(true);
        const heading = Math.round((e as any).webkitCompassHeading);
        setDeviceHeading(heading);
      } else if (e.alpha !== null && e.alpha !== undefined) {
        // Android / Chromium: alpha is counter-clockwise rotation around Z-axis
        sensorDetected = true;
        setHasCompassSensor(true);
        const heading = Math.round((360 - e.alpha) % 360);
        setDeviceHeading(heading);
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    // Check after 2 seconds if sensor responded
    const timeout = setTimeout(() => {
      if (!sensorDetected) {
        setHasCompassSensor(false);
      }
    }, 2000);

    return () => {
      clearTimeout(timeout);
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  const handleSelectCity = (newCity: CityCoords) => {
    setCity(newCity);
    prayerAdhanService.saveCity(newCity);
    setShowCityPicker(false);
  };

  // If compass sensor is active: dial rotates counter-clockwise with device heading, needle points to relative Qibla
  // If sensor is absent: dial stays fixed at 0°, needle points fixed to calculated Qibla angle from North
  const needleRotation = hasCompassSensor && deviceHeading !== null
    ? (qiblaAngle - deviceHeading + 360) % 360
    : qiblaAngle;

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.name.includes(searchCityQuery) || c.country.includes(searchCityQuery)
  );

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#122e23] via-[#1a4636] to-[#122e23] p-5 sm:p-6 border-2 border-[#d4af37]/60 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#d4af37] mb-1">
          <Compass className="w-4 h-4 text-[#d4af37]" />
          <span>تَحْدِيدُ اتِّجَاهِ الْقِبْلَةِ الْمُعَظَّمَةِ (الْكَعْبَةُ الْمُشَرَّفَةُ)</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-quran text-white">
          بوصلة القبلة الدقيقة
        </h2>

        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={() => setShowCityPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0d221b] text-[#d4af37] border border-[#d4af37]/40 text-xs font-bold hover:bg-[#153429] transition-all"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>الموقع: {city.name}</span>
            <span className="text-[10px] text-[#cbdad3]">(تغيير)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Compass Display */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 mx-auto rounded-full bg-gradient-to-b from-[#143328] via-[#0d221b] to-[#07130e] border-4 border-[#d4af37] shadow-2xl p-4 flex items-center justify-center">
        {/* Outer Degree Ring ticks */}
        <div className="absolute inset-2 rounded-full border border-[#d4af37]/30 pointer-events-none" />
        <div className="absolute inset-5 rounded-full border border-[#d4af37]/20 pointer-events-none" />

        {/* Cardinal Directions */}
        <div className="absolute top-4 text-xs font-bold text-red-400">N (الشمال)</div>
        <div className="absolute bottom-4 text-xs font-bold text-[#8fa79c]">S (الجنوب)</div>
        <div className="absolute left-4 text-xs font-bold text-[#8fa79c]">W (الغرب)</div>
        <div className="absolute right-4 text-xs font-bold text-[#8fa79c]">E (الشرق)</div>

        {/* Rotating Compass Needle Container */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${needleRotation}deg)` }}
        >
          {/* Top Arrow Head with Kaaba Icon */}
          <div className="absolute top-8 flex flex-col items-center">
            {/* Golden Pointer diamond */}
            <div className="w-5 h-5 bg-gradient-to-tr from-[#d4af37] to-amber-300 rotate-45 mb-1.5 shadow-lg border border-amber-200" />
            <div className="text-[11px] font-bold text-[#0b1311] bg-[#d4af37] px-2.5 py-0.5 rounded-full shadow border border-amber-200">
              🕋 القبلة
            </div>
          </div>

          {/* Central Gilded Needle Line */}
          <div className="w-1.5 h-56 bg-gradient-to-t from-transparent via-[#d4af37] to-amber-300 rounded-full shadow-xl" />
        </div>

        {/* Center Medallion with Qibla Degrees */}
        <div className="absolute w-20 h-20 rounded-full bg-[#0a1813] border-2 border-[#d4af37] flex flex-col items-center justify-center shadow-2xl z-20">
          <span className="font-mono text-sm font-extrabold text-[#d4af37]">{qiblaAngle}°</span>
          <span className="text-[9px] text-[#8fa79c] font-amiri">مكة المكرمة</span>
        </div>
      </div>

      {/* Sensor Status / Honest Notice (No Fake Compass) */}
      <div className={`p-4 rounded-2xl border text-xs sm:text-[13px] text-right space-y-1.5 ${
        hasCompassSensor 
          ? 'bg-[#102920] border-emerald-600/60 text-emerald-100' 
          : 'bg-[#16211c] border-[#295040] text-[#cbdad3]'
      }`}>
        <div className="flex items-center gap-2 font-bold text-[#d4af37]">
          {hasCompassSensor ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300">مستشعر البوصلة المغناطيسية نشط في جهازك:</span>
            </>
          ) : (
            <>
              <Info className="w-4 h-4 text-[#d4af37]" />
              <span>ملاحظة حول مستشعر البوصلة:</span>
            </>
          )}
        </div>

        {hasCompassSensor ? (
          <p className="leading-relaxed font-amiri text-xs">
            البوصلة تدور تفاعلياً مع حركة هاتفك المحمول الآن. يمكنك توجيه الجهاز حتى يتطابق سهم القبلة مع اتجاه الكعبة.
            (للمعايرة: حرك الهاتف في الهواء على شكل رقم 8 إذا كانت القراءة غير مستقرة).
          </p>
        ) : (
          <p className="leading-relaxed font-amiri text-xs">
            مستشعر البوصلة المغناطيسية غير متوفر أو غير مدعوم في هذا المتصفح/الجهاز.
            <strong> تم احتساب زاوية القبلة فلكياً بدقة متناهية بناءً على إحداثيات {city.name}:</strong>
            {' '}تتجه القبلة بزاوية <strong>{qiblaAngle}°</strong> من جهة الشمال الحقيقي باتجاه مكة المكرمة.
          </p>
        )}
      </div>

      {/* Calculated Astronomical Data Cards */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-[#0e231c] border border-[#1f4a3b] text-center">
          <span className="text-[#8fa79c] block mb-1">زاوية القبلة من الشمال:</span>
          <span className="font-mono font-extrabold text-xl text-[#d4af37]">{qiblaAngle}°</span>
          <span className="text-[10px] text-[#a2beb3] block mt-0.5">درجة فلكية دقيقة</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e231c] border border-[#1f4a3b] text-center">
          <span className="text-[#8fa79c] block mb-1">المسافة إلى الكعبة المشرفة:</span>
          <span className="font-mono font-extrabold text-xl text-white">{distanceToMecca.toLocaleString()}</span>
          <span className="text-[10px] text-[#a2beb3] block mt-0.5">كيلومتر تقريباً</span>
        </div>
      </div>

      {/* City Switcher Modal */}
      {showCityPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCityPicker(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0c1f18] border-2 border-[#d4af37]/60 rounded-3xl p-5 shadow-2xl space-y-3 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1f4a3b]">
              <h3 className="text-sm font-bold text-white font-quran">اختر المدينة لتحديد القبلة:</h3>
              <button onClick={() => setShowCityPicker(false)} className="text-xs text-[#a2beb3] hover:text-white">✕</button>
            </div>

            <input
              type="text"
              placeholder="ابحث عن المدينة..."
              value={searchCityQuery}
              onChange={(e) => setSearchCityQuery(e.target.value)}
              className="w-full bg-[#07130e] border border-[#204a3a] rounded-xl p-2.5 text-xs text-white placeholder-[#688a7c] outline-none focus:border-[#d4af37]"
            />

            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {filteredCities.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleSelectCity(c)}
                  className={`w-full p-2.5 rounded-xl text-right flex items-center justify-between text-xs border transition-all ${
                    city.name === c.name
                      ? 'bg-[#18483b] border-[#d4af37] text-white font-bold'
                      : 'bg-[#11271f] border-[#1d4334] text-[#c0d4cb] hover:bg-[#16382c]'
                  }`}
                >
                  <span>{c.name} ({c.country})</span>
                  <span className="text-[10px] text-[#d4af37] font-mono">{calculateQiblaAngle(c.lat, c.lng)}°</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
