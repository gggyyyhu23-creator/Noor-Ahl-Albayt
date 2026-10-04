import React, { useState } from 'react';
import { RotateCcw, Sparkles, CheckCircle2, Heart, Volume2, VolumeX, Smartphone } from 'lucide-react';

interface DhikrStage {
  name: string;
  countTarget: number; // 34 for Allahu Akbar, 33 for Alhamdulillah, 33 for Subhan Allah
  arabicPhrase: string;
  arabicMeaning: string;
  stageMilestone: number; // 34, 67, 100
}

const ZAHRA_STAGES: DhikrStage[] = [
  {
    name: 'الله أكبر',
    countTarget: 34,
    arabicPhrase: 'اللَّهُ أَكْبَرُ',
    arabicMeaning: 'الله أعظم وأجلّ من أن يوصف أو يُدرك كنهه وعظمته.',
    stageMilestone: 34,
  },
  {
    name: 'الحمد لله',
    countTarget: 33,
    arabicPhrase: 'الْحَمْدُ لِلَّهِ',
    arabicMeaning: 'الشكر والثناء التام لله رب العالمين على كل نعمة وبلاء.',
    stageMilestone: 67,
  },
  {
    name: 'سبحان الله',
    countTarget: 33,
    arabicPhrase: 'سُبْحَانَ اللَّهِ',
    arabicMeaning: 'تنزيه الله وتقديسه المطلق عن كل عيب ونقص وشريك.',
    stageMilestone: 100,
  },
];

export const TasbeehZahraView: React.FC = () => {
  // Total count in the current session (0 to 100)
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);

  // Determine which stage we are currently in
  let currentStageIndex = 0;
  let stageCount = totalCount;
  if (totalCount < 34) {
    currentStageIndex = 0;
    stageCount = totalCount;
  } else if (totalCount < 67) {
    currentStageIndex = 1;
    stageCount = totalCount - 34;
  } else if (totalCount < 100) {
    currentStageIndex = 2;
    stageCount = totalCount - 67;
  } else {
    currentStageIndex = 2;
    stageCount = 33;
  }

  const currentStage = ZAHRA_STAGES[currentStageIndex];

  // Click audio feedback generator via Web Audio API (gentle woody prayer bead click)
  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  };

  const playCompletionChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.35);
      });
    } catch {}
  };

  const handleTap = () => {
    if (totalCount >= 100) return;

    const nextTotal = totalCount + 1;
    setTotalCount(nextTotal);
    playClickSound();

    // Check milestones:
    // User requested:
    // "عند إكمال كل 33 تسبيحة يصدر اهتزاز خفيف من الهاتف.
    // يكون الاهتزاز فقط عند الوصول إلى 33، ثم 66، ثم 99 (أو عند نهاية كل ذكر 34، 67، 100).
    // لا تجعل الاهتزاز قوياً أو مزعجاً (40ms خفيف ولطيف) على أجهزة Android."
    const isStageEnd = nextTotal === 34 || nextTotal === 67 || nextTotal === 100;
    const is33Step = nextTotal === 33 || nextTotal === 66 || nextTotal === 99;

    if (vibrateEnabled && (isStageEnd || is33Step) && 'vibrate' in navigator) {
      try {
        // Gentle light vibration (45ms)
        navigator.vibrate([45]);
      } catch {}
    }

    if (nextTotal >= 100) {
      setIsCompleted(true);
      playCompletionChime();
      if (vibrateEnabled && 'vibrate' in navigator) {
        try {
          // Subtle double vibration on final completion: 50ms, pause 40ms, 60ms
          navigator.vibrate([50, 40, 60]);
        } catch {}
      }
    }
  };

  const handleReset = () => {
    setTotalCount(0);
    setIsCompleted(false);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Introduction Card */}
      <div className="rounded-2xl bg-gradient-to-r from-[#143126] via-[#1d4637] to-[#122c22] p-5 border border-[#d4af37]/40 text-center shadow-xl">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#d4af37] mb-1">
          <Sparkles className="w-4 h-4 text-[#d4af37]" />
          <span>هَدِيَّةُ رَسُولِ اللَّهِ (ص) لِبَضْعَتِهِ الطَّاهِرَةِ</span>
          <Sparkles className="w-4 h-4 text-[#d4af37]" />
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold font-quran text-[#f7edd9]">
          تسبيح فاطمة الزهراء (عليها السلام)
        </h2>
        <p className="text-xs sm:text-sm text-[#cbdad3] mt-1 font-amiri leading-relaxed">
          عن الإمام الصادق (ع): «تَسْبِيحُ فَاطِمَةَ فِي كُلِّ يَوْمٍ فِي دُبُرِ كُلِّ صَلَاةٍ أَحَبُّ إِلَيَّ مِنْ صَلَاةِ أَلْفِ رَكْعَةٍ فِي كُلِّ يَوْمٍ».
        </p>

        {/* Vibration and Sound Controls */}
        <div className="mt-4 flex items-center justify-center gap-3 text-xs">
          <button
            onClick={() => setVibrateEnabled(!vibrateEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
              vibrateEnabled
                ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                : 'bg-[#122820] border-[#254f3f] text-[#8fa79c]'
            }`}
            title="تفعيل أو تعطيل الاهتزاز الخفيف"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>الاهتزاز: {vibrateEnabled ? 'مفعل (خفيف)' : 'معطل'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
              soundEnabled
                ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                : 'bg-[#122820] border-[#254f3f] text-[#8fa79c]'
            }`}
            title="صوت النقر اللطيف"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>الصوت: {soundEnabled ? 'مفعل' : 'صامت'}</span>
          </button>
        </div>
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border-2 border-[#d4af37] p-5 text-center shadow-2xl space-y-2 animate-bounce-short">
          <div className="w-12 h-12 rounded-full bg-[#d4af37] text-[#0b1311] flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-quran text-[#f7ebd7]">
            تَقَبَّلَ اللَّهُ طَاعَتَكُمْ وَأَجْزَلَ ثَوَابَكُمْ
          </h3>
          <p className="text-xs sm:text-sm text-emerald-200 font-amiri">
            اكتمل تسبيح فاطمة الزهراء (ع) مباركاً (٣٤ الله أكبر، ٣٣ الحمد لله، ٣٣ سبحان الله).
          </p>
          <button
            onClick={handleReset}
            className="mt-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#d4af37] text-[#0b1311] hover:bg-[#e3be45] shadow-lg transition-all"
          >
            البدء بتسبيح جديد
          </button>
        </div>
      )}

      {/* 3 Stages Step Indicators */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {ZAHRA_STAGES.map((stg, idx) => {
          const isDone =
            idx === 0
              ? totalCount >= 34
              : idx === 1
              ? totalCount >= 67
              : totalCount >= 100;
          const isCurrent = currentStageIndex === idx && !isCompleted;

          return (
            <div
              key={stg.name}
              className={`p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-[#183d2f] border-[#d4af37] ring-2 ring-[#d4af37]/40 shadow-lg'
                  : isDone
                  ? 'bg-[#112920] border-emerald-600/50 text-emerald-300'
                  : 'bg-[#0a1813] border-[#1b3d30] text-[#7f998e]'
              }`}
            >
              <div className="font-bold text-sm sm:text-base font-quran text-white">{stg.arabicPhrase}</div>
              <div className="text-[11px] font-mono mt-0.5">
                {idx === 0
                  ? `${Math.min(34, totalCount)} / 34`
                  : idx === 1
                  ? `${Math.max(0, Math.min(33, totalCount - 34))} / 33`
                  : `${Math.max(0, Math.min(33, totalCount - 67))} / 33`}
              </div>
              <div className="mt-1 text-[10px] text-[#9bb3a8]">
                {isDone ? '✓ اكتمل' : isCurrent ? 'الآن' : 'متبقي'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Main Prayer Bead (Rosary) Button */}
      <div className="text-center py-4">
        <button
          onClick={handleTap}
          disabled={isCompleted}
          className={`w-64 h-64 sm:w-72 sm:h-72 rounded-full mx-auto relative flex flex-col items-center justify-center border-4 shadow-2xl transition-all duration-200 select-none active:scale-95 ${
            isCompleted
              ? 'bg-[#10241c] border-emerald-500/50 cursor-default opacity-80'
              : 'bg-gradient-to-b from-[#18483b] via-[#103329] to-[#0c261e] border-[#d4af37] hover:border-[#f3ca4c] shadow-[#d4af37]/20 cursor-pointer hover:shadow-[#d4af37]/40'
          }`}
          style={{
            boxShadow: '0 0 45px rgba(212, 175, 55, 0.15)',
          }}
        >
          {/* Subtle Islamic circular border rings */}
          <div className="absolute inset-2 rounded-full border border-[#d4af37]/20 pointer-events-none" />
          <div className="absolute inset-5 rounded-full border border-[#d4af37]/10 pointer-events-none" />

          {/* Current Stage text */}
          <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold mb-1">
            الذِّكْرُ الْحَالِيُّ
          </span>

          <div className="font-quran text-3xl sm:text-4xl font-extrabold text-[#f7ebd7] leading-relaxed drop-shadow">
            {currentStage.arabicPhrase}
          </div>

          {/* Big Count Number */}
          <div className="font-mono text-4xl sm:text-5xl font-black text-white mt-1 drop-shadow">
            {stageCount}
          </div>

          <div className="text-xs text-[#a2beb3] mt-1">
            من أصل {currentStage.countTarget} تسبيحة
          </div>

          <span className="mt-3 text-[11px] text-[#d4af37]/80 bg-[#091813]/60 px-3 py-1 rounded-full border border-[#d4af37]/30">
            اضغط للتسبيح
          </span>
        </button>

        {/* Total Progress Bar (0 to 100) */}
        <div className="mt-6 max-w-md mx-auto space-y-1.5">
          <div className="flex justify-between text-xs text-[#a2beb3]">
            <span>التقدم الإجمالي:</span>
            <span className="font-mono font-bold text-[#d4af37]">{totalCount} / 100</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#0a1813] border border-[#1b3d30] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-[#d4af37] to-amber-300 transition-all duration-300"
              style={{ width: `${totalCount}%` }}
            />
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-5">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#112920] hover:bg-[#18392d] text-[#c0d4cb] border border-[#234d3d] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط العداد</span>
          </button>
        </div>
      </div>

      {/* Explanatory Note on Merits of Tasbeeh al-Zahra */}
      <div className="rounded-xl bg-[#0d2019] p-4 border border-[#1f4a3b] text-xs text-[#a4b5ad] leading-relaxed space-y-1.5">
        <strong className="text-[#d4af37] block text-sm">من أسرار تسبيح الزهراء (عليها السلام):</strong>
        <p>
          • علّمه رسول الله (ص) لابنته فاطمة الزهراء لما شكت إليه تعب الطحن والخدمة، فكان خيراً لها من خادم ومن الدنيا وما فيها.
        </p>
        <p>
          • يُستحب أن يُختم بعد الفراغ من التسبيح بـ «لا إله إلا الله» مرة واحدة، والاستغفار.
        </p>
        <p>
          • الأفضل والأتم ثواباً أن يُسبح بطين قبر سيد الشهداء الإمام الحسين (ع) (سبحة تربة كربلاء)، فإنها تسبح في يد صاحبها وإن لم يسبح.
        </p>
      </div>
    </div>
  );
};
