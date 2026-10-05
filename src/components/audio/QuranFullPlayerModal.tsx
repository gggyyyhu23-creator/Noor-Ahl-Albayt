import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  Repeat, 
  Gauge, 
  User, 
  BookOpen, 
  Layers, 
  Check, 
  Sparkles,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { useAudioEngine } from '../../context/AudioContext';
import { QuranAudioTrack, RepeatMode } from '../../types/audioEngine';
import { RECITERS_LIST } from '../../data/quranData';
import { saveLastSelectedReciter } from '../../utils/quranContinueReading';

interface QuranFullPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeReadingMode: 'mushaf' | 'text';
  onSwitchReadingMode: (mode: 'mushaf' | 'text') => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const QuranFullPlayerModal: React.FC<QuranFullPlayerModalProps> = ({
  isOpen,
  onClose,
  activeReadingMode,
  onSwitchReadingMode,
}) => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    progress,
    playbackSpeed,
    repeatMode,
    togglePlay,
    seek,
    seekRelative,
    seekPercent,
    setPlaybackSpeed,
    setRepeatMode,
    playQuranSurah,
    quranState,
  } = useAudioEngine();

  const [isReciterSelectorOpen, setIsReciterSelectorOpen] = useState<boolean>(false);

  if (!isOpen || !currentTrack || currentTrack.type !== 'quran') {
    return null;
  }

  const qTrack = currentTrack as QuranAudioTrack;

  // Cycle playback speed
  const handleCycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  // Cycle repeat mode
  const handleCycleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'track'];
    // Ayah repeat only if reliable timestamps exist
    if (quranState?.hasReliableTimestamps) {
      modes.push('ayah');
    }
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  // Change reciter and maintain position
  const handleChangeReciter = (reciterId: string) => {
    saveLastSelectedReciter(reciterId);
    setIsReciterSelectorOpen(false);
    playQuranSurah(qTrack.surahNumber, reciterId, {
      startTimeSec: currentTime,
      startAyah: quranState?.currentAyahNumber,
      startPage: quranState?.currentMushafPage,
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetPercent = parseFloat(e.target.value);
    seekPercent(targetPercent);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#122e23] via-[#0d221a] to-[#081510] border-2 border-[#d4af37]/60 shadow-2xl p-5 sm:p-8 flex flex-col justify-between overflow-hidden">
        {/* Background Islamic Watermark Accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#d4af37]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* 1. Header Bar: Close & Mode Switcher */}
        <div className="flex items-center justify-between gap-3 border-b border-[#1d4536] pb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#173a2e] border border-[#275947] flex items-center justify-center text-[#d4af37]">
              <Volume2 className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold text-[#d4af37] block">
                مشغل القرآن الكريم الموحد
              </span>
              <span className="text-[10px] text-[#8fa79c]">
                صوت متواصل مع مزامنة النص والمصحف
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <button
              onClick={() =>
                onSwitchReadingMode(activeReadingMode === 'mushaf' ? 'text' : 'mushaf')
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#143327] hover:bg-[#1a4234] border border-[#275947] text-xs font-bold text-[#d4af37] transition-all"
              title="التبديل بين وضع صفحات المصحف والوضع النصي"
            >
              {activeReadingMode === 'mushaf' ? (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>الوضع النصي</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>صفحات المصحف</span>
                </>
              )}
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#143327] hover:bg-[#1b4434] text-[#8fa79c] hover:text-white border border-[#234d3d] transition-all"
              title="تصغير إلى المشغل المصغر"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Middle Presentation: Medallion & Info */}
        <div className="py-6 text-center space-y-3">
          {/* Circular Decorative Medallion */}
          <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#143226] via-[#1b4334] to-[#0e241c] border-2 border-[#d4af37] shadow-xl flex items-center justify-center relative">
            <div className="text-center">
              <span className="font-quran text-2xl sm:text-3xl font-extrabold text-[#f7ecd6] block drop-shadow">
                {qTrack.surahName}
              </span>
              <span className="text-[10px] text-[#d4af37] font-semibold mt-0.5 block">
                سورة {qTrack.surahNumber}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-quran text-white">
              {qTrack.title}
            </h3>
            <p className="text-xs text-[#9fc0b3] font-amiri mt-1">
              بصوت القارئ المبارك: <strong className="text-[#d4af37]">{qTrack.reciterName}</strong>
            </p>
          </div>

          {/* Ayah & Page indicator pill */}
          <div className="flex items-center justify-center gap-2 pt-1 text-xs">
            {quranState?.currentMushafPage && (
              <span className="px-3 py-1 rounded-full bg-[#112a21] border border-[#234d3d] text-[#cbdad3]">
                صفحة المصحف: <strong className="text-white font-mono">{quranState.currentMushafPage}</strong>
              </span>
            )}
            {quranState?.currentAyahNumber && (
              <span className="px-3 py-1 rounded-full bg-[#112a21] border border-[#234d3d] text-[#cbdad3]">
                الآية الحالية: <strong className="text-[#d4af37] font-mono">{quranState.currentAyahNumber}</strong>
              </span>
            )}
          </div>

          {/* Reciter Selector Dropdown Trigger */}
          <div className="pt-2">
            <button
              onClick={() => setIsReciterSelectorOpen(!isReciterSelectorOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#143327] hover:bg-[#1a4234] border border-[#275947] text-xs text-[#d4af37] font-bold transition-all shadow"
            >
              <User className="w-3.5 h-3.5" />
              <span>تغيير القارئ ({qTrack.reciterName})</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Reciter Selection Modal/List */}
            {isReciterSelectorOpen && (
              <div className="mt-3 p-2 rounded-2xl bg-[#091813] border border-[#234d3d] shadow-2xl space-y-1 text-right max-h-48 overflow-y-auto">
                {RECITERS_LIST.map((r) => {
                  const isCurrent = r.id === qTrack.reciterId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleChangeReciter(r.id)}
                      className={`w-full p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-[#d4af37] text-[#0b1311] font-bold shadow'
                          : 'text-[#cbdad3] hover:bg-[#143227] hover:text-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block font-bold">{r.name}</span>
                        <span className={`text-[10px] block ${isCurrent ? 'text-[#1c2e27]' : 'text-[#8fa79c]'}`}>
                          {r.style}
                        </span>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Progress Scrubber */}
        <div className="space-y-1.5 py-2">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleSliderChange}
            className="w-full accent-[#d4af37] cursor-pointer h-2 bg-[#173a2e] rounded-lg"
          />

          <div className="flex items-center justify-between text-xs font-mono text-[#8fa79c]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 4. Controls Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#1d4536]">
          {/* Repeat Mode Button */}
          <button
            onClick={handleCycleRepeat}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              repeatMode !== 'off'
                ? 'bg-amber-500/20 text-[#d4af37] border-amber-500/40 shadow'
                : 'bg-[#122a21] text-[#7f9e92] border-[#234d3d] hover:text-white'
            }`}
            title={`وضع التكرار: ${
              repeatMode === 'off' ? 'بدون تكرار' : repeatMode === 'track' ? 'تكرار السورة' : 'تكرار الآية'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">
              {repeatMode === 'off' ? 'بدون تكرار' : repeatMode === 'track' ? 'تكرار السورة' : 'تكرار الآية'}
            </span>
          </button>

          {/* Seek -10s */}
          <button
            onClick={() => seekRelative(-10)}
            className="p-2.5 rounded-xl bg-[#122a21] text-[#cbdad3] hover:text-white border border-[#234d3d] hover:border-[#d4af37] active:scale-95 transition-all flex items-center gap-1"
            title="تأخير 10 ثوانٍ"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px] font-mono hidden sm:inline">-10s</span>
          </button>

          {/* Primary Play / Pause Button */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#d4af37] to-amber-500 text-[#0b1311] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#0b1311]" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>

          {/* Seek +10s */}
          <button
            onClick={() => seekRelative(10)}
            className="p-2.5 rounded-xl bg-[#122a21] text-[#cbdad3] hover:text-white border border-[#234d3d] hover:border-[#d4af37] active:scale-95 transition-all flex items-center gap-1"
            title="تقديم 10 ثوانٍ"
          >
            <span className="text-[10px] font-mono hidden sm:inline">+10s</span>
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Speed Selector Button */}
          <button
            onClick={handleCycleSpeed}
            className="p-2.5 rounded-xl bg-[#122a21] text-[#d4af37] hover:bg-[#1a3d30] border border-[#234d3d] text-xs font-bold transition-all flex items-center gap-1"
            title="سرعة التشغيل"
          >
            <Gauge className="w-4 h-4" />
            <span className="font-mono text-[11px]">{playbackSpeed}x</span>
          </button>
        </div>
      </div>
    </div>
  );
};
