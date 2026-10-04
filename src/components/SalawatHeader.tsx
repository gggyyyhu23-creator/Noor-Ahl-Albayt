import React, { useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';

export const SalawatHeader: React.FC = () => {
  const [salawatCount, setSalawatCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('user_salawat_count') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [justClicked, setJustClicked] = useState(false);

  const incrementSalawat = () => {
    const next = salawatCount + 1;
    setSalawatCount(next);
    try {
      localStorage.setItem('user_salawat_count', next.toString());
    } catch {}

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {}
    }

    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 800);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d2820] via-[#143d31] to-[#0d2820] p-4 sm:p-6 border border-[#d4af37]/40 shadow-xl shadow-black/40 text-center mb-6">
      {/* Decorative Islamic corner ornaments */}
      <div className="absolute top-1 right-2 text-[#d4af37]/30 text-xs select-none">۞</div>
      <div className="absolute top-1 left-2 text-[#d4af37]/30 text-xs select-none">۞</div>
      <div className="absolute bottom-1 right-2 text-[#d4af37]/30 text-xs select-none">۞</div>
      <div className="absolute bottom-1 left-2 text-[#d4af37]/30 text-xs select-none">۞</div>

      <div className="flex items-center justify-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[#d4af37] animate-pulse" />
        <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
          عَطِّرْ فَمَكَ بِالصَّلَاةِ عَلَى خَيْرِ الْوَرَى
        </span>
        <Sparkles className="w-4 h-4 text-[#d4af37] animate-pulse" />
      </div>

      {/* Prominent, reverent Salawat calligraphy text */}
      <h1 className="font-quran text-2xl sm:text-4xl md:text-5xl font-bold text-[#f7e7ce] tracking-wide leading-relaxed drop-shadow-md py-1">
        اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ
      </h1>

      <p className="text-xs sm:text-sm text-[#c8d8d2] mt-1 font-amiri">
        وَعَجِّلْ فَرَجَهُمْ، وَأَهْلِكْ عَدُوَّهُمْ، وَالْعَنْ ظَالِمِيهِمْ
      </p>

      {/* Interactive Salawat button */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          onClick={incrementSalawat}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
            justClicked
              ? 'bg-[#d4af37] text-[#0b1311] scale-105 shadow-lg shadow-[#d4af37]/30'
              : 'bg-[#18483b]/80 hover:bg-[#1f5e4d] text-[#e8f2ee] border border-[#d4af37]/30 active:scale-95'
          }`}
          title="اضغط للصلاة على محمد وآل محمد"
        >
          <Heart className={`w-3.5 h-3.5 ${justClicked ? 'fill-current text-red-600' : 'text-[#d4af37]'}`} />
          <span>صلِّ على محمد وآل محمد</span>
          {salawatCount > 0 && (
            <span className="bg-[#0b1311]/40 px-2 py-0.5 rounded-full text-[11px] font-mono text-[#d4af37]">
              {salawatCount.toLocaleString('ar-SA')}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
