import React, { useState, useEffect } from 'react';
import { Compass, Navigation, MapPin, Sparkles } from 'lucide-react';
import { POPULAR_CITIES, calculateQiblaAngle } from '../utils/prayerTimes';
import { CityCoords } from '../types';

export const QiblaCompassView: React.FC = () => {
  const [city, setCity] = useState<CityCoords>(() => {
    try {
      const saved = localStorage.getItem('shia_selected_city');
      return saved ? JSON.parse(saved) : POPULAR_CITIES[0];
    } catch {
      return POPULAR_CITIES[0];
    }
  });

  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSupport, setHasCompassSupport] = useState<boolean>(false);

  const qiblaAngle = calculateQiblaAngle(city.lat, city.lng);

  // Listen for device orientation (compass sensor on mobile)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setHasCompassSupport(true);
        // alpha represents rotation around z-axis (compass heading)
        const heading = (e as any).webkitCompassHeading || (360 - e.alpha);
        setDeviceHeading(Math.round(heading));
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const relativeQibla = (qiblaAngle - deviceHeading + 360) % 360;

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#122e23] via-[#1a4636] to-[#122e23] p-5 border-2 border-[#d4af37]/60 shadow-xl">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#d4af37] mb-1">
          <Compass className="w-4 h-4 text-[#d4af37]" />
          <span>تَحْدِيدُ اتِّجَاهِ الْقِبْلَةِ الْمُعَظَّمَةِ (الْكَعْبَةُ الْمُشَرَّفَةُ)</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-quran text-white">
          بوصلة القبلة الدقيقة
        </h2>
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#cbdad3] mt-1 font-amiri">
          <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>موقعك المحسوب: {city.name}</span>
        </div>
      </div>

      {/* Compass Interactive Display */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto rounded-full bg-gradient-to-b from-[#143328] via-[#0d221b] to-[#091712] border-4 border-[#d4af37] shadow-2xl p-4 flex items-center justify-center">
        {/* Degree markers */}
        <div className="absolute top-2 text-xs font-bold text-red-400">N (الشمال)</div>
        <div className="absolute bottom-2 text-xs font-bold text-[#8fa79c]">S (الجنوب)</div>
        <div className="absolute left-2 text-xs font-bold text-[#8fa79c]">W (الغرب)</div>
        <div className="absolute right-2 text-xs font-bold text-[#8fa79c]">E (الشرق)</div>

        {/* Center Kaaba Pointer Arrow */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${qiblaAngle}deg)` }}
        >
          {/* Arrow pointing to Qibla */}
          <div className="absolute top-6 flex flex-col items-center">
            <span className="w-4 h-4 bg-[#d4af37] rotate-45 mb-1" />
            <span className="text-[11px] font-bold text-[#d4af37] bg-[#091712] px-2 py-0.5 rounded border border-[#d4af37]">
              القبلة
            </span>
          </div>

          {/* Needle center line */}
          <div className="w-1.5 h-44 bg-gradient-to-t from-transparent via-[#d4af37] to-amber-300 rounded-full shadow-lg" />
        </div>

        {/* Center Medallion */}
        <div className="absolute w-16 h-16 rounded-full bg-[#0a1813] border-2 border-[#d4af37] flex flex-col items-center justify-center shadow-lg">
          <span className="font-mono text-xs font-extrabold text-[#d4af37]">{qiblaAngle}°</span>
          <span className="text-[9px] text-[#8fa79c]">مكة</span>
        </div>
      </div>

      {/* Degree info cards */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-[#0e231c] border border-[#1f4a3b]">
          <span className="text-[#8fa79c] block mb-0.5">زاوية القبلة من الشمال الحقيقي:</span>
          <span className="font-mono font-bold text-lg text-[#d4af37]">{qiblaAngle}° شمالاً</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0e231c] border border-[#1f4a3b]">
          <span className="text-[#8fa79c] block mb-0.5">مستشعر البوصلة في الجهاز:</span>
          <span className="font-bold text-white text-sm">
            {hasCompassSupport ? `${deviceHeading}° (نشط)` : 'محسوب فلكياً'}
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-[#0b1c16] p-4 border border-[#193a2e] text-xs text-[#a2beb3] leading-relaxed">
        • ضع هاتفك أفقياً على سطح مستوٍ وقم بتوجيهه نحو الزاوية المحددة ({qiblaAngle}° درجة) لاستقبال الكعبة المشرفة في صلاتك.
      </div>
    </div>
  );
};
