import React, { useState } from 'react';
import { Moon, Star, Clock, Calendar, Sparkles, BookOpen, Flame, ChevronRight, ChevronLeft } from 'lucide-react';
import { RAMADAN_DAILY_DUAS, RAMADAN_WORKS, RamadanDailyDua, RamadanNightWork } from '../data/ramadanData';
import { calculateShiaPrayerTimes } from '../utils/prayerTimes';
import { POPULAR_CITIES } from '../utils/prayerTimes';

export const RamadanView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'works' | 'times' | 'prayers'>('daily');
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    // Default to current day of month or 1
    const d = new Date().getDate();
    return d >= 1 && d <= 30 ? d : 1;
  });

  const city = POPULAR_CITIES[0]; // Najaf or current
  const times = calculateShiaPrayerTimes(new Date(), city);

  // Shia Imsak calculation (15 minutes before Fajr)
  const [fajrH, fajrM] = times.fajr.split(':').map((n) => parseInt(n, 10));
  let imsakTotalMinutes = fajrH * 60 + fajrM - 15;
  if (imsakTotalMinutes < 0) imsakTotalMinutes += 24 * 60;
  const imsakH = Math.floor(imsakTotalMinutes / 60);
  const imsakM = imsakTotalMinutes % 60;
  const imsakTimeFormatted = `${imsakH.toString().padStart(2, '0')}:${imsakM.toString().padStart(2, '0')}`;

  const currentDua: RamadanDailyDua =
    RAMADAN_DAILY_DUAS.find((d) => d.day === selectedDay) || RAMADAN_DAILY_DUAS[0];

  return (
    <div className="space-y-6">
      {/* Ramadan Special Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#11382b] via-[#1a4a39] to-[#0f2e24] p-6 border-2 border-[#d4af37]/60 shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2 text-[#d4af37] text-xs font-bold uppercase tracking-wider mb-1">
          <Moon className="w-4 h-4 fill-current" />
          <span>شَهْرُ رَمَضَانَ الَّذِي أُنْزِلَ فِيهِ الْقُرْآنُ هُدًى لِلنَّاسِ</span>
          <Star className="w-4 h-4 fill-current" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold font-quran text-[#f7ecd6] py-1">
          بوابة شهر رمضان المبارك (شهر الله الأكبر)
        </h2>
        <p className="text-xs sm:text-sm text-[#cbdad3] max-w-xl mx-auto font-amiri">
          أدعية الأيام الثلاثين، مواقيت الإمساك والإفطار وفق المذهب الجعفري، وأعمال ليالي القدر المباركة.
        </p>

        {/* Sub-nav tabs */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-[#d4af37] text-[#0b1311] shadow-lg shadow-[#d4af37]/20 scale-105'
                : 'bg-[#0f2820] text-[#c8d8d2] hover:bg-[#16382c] border border-[#23473b]'
            }`}
          >
            الأدعية اليومية (1 - 30)
          </button>
          <button
            onClick={() => setActiveTab('times')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'times'
                ? 'bg-[#d4af37] text-[#0b1311] shadow-lg shadow-[#d4af37]/20 scale-105'
                : 'bg-[#0f2820] text-[#c8d8d2] hover:bg-[#16382c] border border-[#23473b]'
            }`}
          >
            مواقيت الإمساك والإفطار
          </button>
          <button
            onClick={() => setActiveTab('works')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'works'
                ? 'bg-[#d4af37] text-[#0b1311] shadow-lg shadow-[#d4af37]/20 scale-105'
                : 'bg-[#0f2820] text-[#c8d8d2] hover:bg-[#16382c] border border-[#23473b]'
            }`}
          >
            أعمال ليالي القدر والأيام
          </button>
          <button
            onClick={() => setActiveTab('prayers')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'prayers'
                ? 'bg-[#d4af37] text-[#0b1311] shadow-lg shadow-[#d4af37]/20 scale-105'
                : 'bg-[#0f2820] text-[#c8d8d2] hover:bg-[#16382c] border border-[#23473b]'
            }`}
          >
            صلوات وأدعية الشهر الفضيل
          </button>
        </div>
      </div>

      {/* Tab 1: Daily Duas 1-30 */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Day selection slider */}
          <div className="rounded-xl bg-[#0f241d] p-3 border border-[#1d4234] flex items-center justify-between gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
              disabled={selectedDay <= 1}
              className="p-2 rounded-lg bg-[#16362a] text-[#d4af37] disabled:opacity-30 hover:bg-[#1f4a3a]"
              title="اليوم السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex gap-1.5 overflow-x-auto py-1 px-2 no-scrollbar">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`min-w-9 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center font-mono ${
                    selectedDay === dayNum
                      ? 'bg-[#d4af37] text-[#0b1311] scale-110 shadow-md'
                      : 'bg-[#142e24] text-[#bcd0c7] hover:bg-[#1c3f32] border border-[#234d3d]'
                  }`}
                >
                  {dayNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedDay(Math.min(30, selectedDay + 1))}
              disabled={selectedDay >= 30}
              className="p-2 rounded-lg bg-[#16362a] text-[#d4af37] disabled:opacity-30 hover:bg-[#1f4a3a]"
              title="اليوم التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Current Day Dua Card */}
          <div className="rounded-2xl bg-[#0d211a] border-2 border-[#d4af37]/40 p-6 sm:p-8 shadow-xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] text-xs sm:text-sm font-bold border border-[#d4af37]/30">
              <Sparkles className="w-4 h-4" />
              <span>دعاء اليوم {selectedDay} من شهر رمضان المبارك</span>
            </div>

            <div className="p-4 sm:p-6 rounded-xl bg-[#091612] border border-[#1b3e31]">
              <p className="font-quran text-xl sm:text-2xl md:text-3xl text-[#f5ebd7] leading-loose sm:leading-relaxed">
                {currentDua.arabicText}
              </p>
            </div>

            <div className="rounded-xl bg-[#142d24] p-4 text-xs sm:text-sm text-[#cbdad3] text-right border border-[#255241] space-y-1">
              <span className="font-bold text-[#d4af37] block mb-1">فضل وثواب هذا الدعاء:</span>
              <p>{currentDua.virtue}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Imsak & Iftar Times */}
      {activeTab === 'times' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* وقت الإمساك */}
            <div className="rounded-2xl bg-gradient-to-br from-[#122820] to-[#0a1813] border-2 border-indigo-400/40 p-6 text-center space-y-2">
              <div className="inline-block p-3 rounded-full bg-indigo-950/60 text-indigo-300 mb-1">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-xs uppercase tracking-wider text-indigo-300 font-bold">وقت الإمساك الشرعي (احتياطاً)</div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white py-1">
                {imsakTimeFormatted}
              </div>
              <p className="text-xs text-[#9bb3a8]">
                يُمسك الصائم قبل أذان الفجر بنحو 10 إلى 15 دقيقة للتثبت من عدم ولوج الفجر الصادق.
              </p>
              <div className="pt-2 text-[11px] text-[#d4af37] font-amiri">
                أذان الفجر الشرعي: {times.fajr}
              </div>
            </div>

            {/* وقت الإفطار */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1b3a2f] to-[#0c1f18] border-2 border-[#d4af37] p-6 text-center space-y-2 shadow-xl">
              <div className="inline-block p-3 rounded-full bg-[#d4af37]/20 text-[#d4af37] mb-1">
                <Flame className="w-6 h-6" />
              </div>
              <div className="text-xs uppercase tracking-wider text-[#d4af37] font-bold">وقت الإفطار (المغرب الجعفري)</div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white py-1">
                {times.maghrib}
              </div>
              <p className="text-xs text-[#cbdad3]">
                يتحقق الإفطار بعد زوال الحمرة المشرقية فوق قبة السماء، وهو أحوط وأتم صياماً.
              </p>
              <div className="pt-2 text-[11px] text-amber-300 font-amiri">
                استتار القرص (الغروب الظاهري): {times.sunset}
              </div>
            </div>
          </div>

          {/* Du'a for Iftar and Suhoor */}
          <div className="rounded-xl bg-[#0e231c] border border-[#1f4a3b] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#d4af37]">أدعية مأثورة عند الإفطار والسحر:</h3>
            <div className="space-y-2 text-xs sm:text-sm text-[#e4eee9]">
              <div className="p-3 rounded-lg bg-[#081511] border border-[#193a2e]">
                <strong className="text-[#d4af37] block mb-1">دعاء أول لقمة من الإفطار:</strong>
                <p className="font-quran text-base sm:text-lg text-white">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ، يَا وَاسِعَ الْمَغْفِرَةِ اغْفِرْ لِي.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#081511] border border-[#193a2e]">
                <strong className="text-[#d4af37] block mb-1">الدعاء المأثور عند الإفطار عن أمير المؤمنين (ع):</strong>
                <p className="font-quran text-base sm:text-lg text-white">
                  اللَّهُمَّ لَكَ صُمْتُ، وَعَلَى رِزْقِكَ أَفْطَرْتُ، وَعَلَيْكَ تَوَكَّلْتُ.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#081511] border border-[#193a2e]">
                <strong className="text-[#d4af37] block mb-1">عند السحر وقبل الإمساك:</strong>
                <p className="font-quran text-base sm:text-lg text-white">
                  يَا مَفْزَعِي عِنْدَ كُرْبَتِي، وَيَا غَوْثِي عِنْدَ شِدَّتِي، إِلَيْكَ فَزِعْتُ، وَبِكَ اسْتَغَثْتُ.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Works & Qadr Nights */}
      {activeTab === 'works' && (
        <div className="space-y-4">
          {RAMADAN_WORKS.map((work) => (
            <div key={work.id} className="rounded-xl bg-[#0e221b] border border-[#1f4b3b] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-[#d4af37] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>{work.title}</span>
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1b3d30] text-[#a4b5ad]">
                  {work.category === 'qadr' ? 'ليالي القدر' : work.category === 'sahar' ? 'السحر' : 'الإفطار'}
                </span>
              </div>

              <p className="text-xs text-[#a4b5ad]">{work.description}</p>

              <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm text-[#d4e2dc]">
                {work.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed pl-2 bg-[#091712] p-2 rounded-lg border border-[#17382c]">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Prayers & Special Duas */}
      {activeTab === 'prayers' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#0e221b] border border-[#1f4b3b] p-5 space-y-3">
            <h3 className="text-base font-bold text-[#d4af37]">أحكام صلوات ونوافل شهر رمضان المبارك وفق الفقه الجعفري:</h3>
            <div className="space-y-2 text-xs sm:text-sm text-[#cbdad3] leading-relaxed">
              <p>
                • <strong>صلاة التراويح جماعة:</strong> أجمع فقهاء الإمامية وأئمة أهل البيت (عليهم السلام) على أن صلاة التراويح جماعة بدعة أُحدثت بعد رسول الله (ص) وليست من سنته؛ لأن النوافل المستحبة لا تُصلى جماعة في الشريعة الإسلامية إلا في صلاة الاستسقاء وصلاة العيدين عند سقوط وجوبهما.
              </p>
              <p>
                • <strong>صلاة الألف ركعة المستحبة:</strong> يُستحب في شهر رمضان أن يُصلي المكلف فرادى ألف ركعة موزعة على ليالي الشهر:
                عشرون ركعة في كل ليلة من العشرين الأولى (ثمان ركعات بعد المغرب واثنتا عشرة بعد العشاء)، وثلاثون ركعة في كل ليلة من العشر الأواخر، ومائة ركعة في كل ليلة من ليالي القدر الثلاث (19، 21، 23).
              </p>
              <p>
                • <strong>دعاء الافتتاح:</strong> يُستحب قراءته في كل ليلة من ليالي الشهر، وهو من أروع الأدعية الجامعة بين التوحيد والطلب والفرج بالدولة الكريمة.
              </p>
              <p>
                • <strong>دعاء أبي حمزة الثمالي ودعاء البهاء:</strong> يُستحب قراءتهما في أسحار شهر رمضان المبارك لما فيهما من المعارف العرفانية الشامخة.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
