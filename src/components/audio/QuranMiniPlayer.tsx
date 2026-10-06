import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Maximize2, 
  BookOpen, 
  Layers,
  Volume2,
  Loader2,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { useAudioEngine } from '../../context/AudioContext';
import { QuranAudioTrack } from '../../types/audioEngine';

interface QuranMiniPlayerProps {
  activeReadingMode: 'mushaf' | 'text';
  onSwitchReadingMode: (mode: 'mushaf' | 'text') => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const QuranMiniPlayer: React.FC<QuranMiniPlayerProps> = ({
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
    togglePlay,
    seekRelative,
    seekPercent,
    setIsFullPlayerOpen,
    playNextQuranSurah,
    playPreviousQuranSurah,
    hasNextQuranSurah,
    hasPreviousQuranSurah,
    quranState,
  } = useAudioEngine();

  // If no track is loaded, don't show the player
  if (!currentTrack) {
    return null;
  }

  const isQuran = currentTrack.type === 'quran';
  const qTrack = isQuran ? (currentTrack as QuranAudioTrack) : null;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(100, (clickX / width) * 100));
    seekPercent(percent);
  };

  return (
    <aside 
      aria-label="مشغل الصوت المركزي"
      className="sticky bottom-14 xl:bottom-3 z-30 mx-auto max-w-5xl px-2 sm:px-4"
    >
      <div className="rounded-2xl bg-[#0c1f19]/95 backdrop-blur-md border-2 border-[#d4af37]/60 p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2 transition-all">
        {/* Top Scrubber Line */}
        <div 
          onClick={handleProgressBarClick}
          className="relative w-full h-1.5 bg-[#173a2e] rounded-full cursor-pointer overflow-hidden group"
          title="تقديم أو ترجيع"
        >
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-[#d4af37] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Player Controls Bar */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Track Info */}
          <div 
            onClick={() => {
              if (isQuran) setIsFullPlayerOpen(true);
            }}
            className={`flex items-center gap-2.5 min-w-0 flex-1 ${isQuran ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#143126] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-quran text-sm font-bold text-[#f7ecd6] truncate">
                  {currentTrack.title}
                </h4>
                {isQuran && quranState?.currentAyahNumber && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#16382b] text-[#d4af37] border border-[#275947] shrink-0">
                    الآية {quranState.currentAyahNumber}
                  </span>
                )}
                {!isQuran && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#16382b] text-emerald-300 border border-[#275947] shrink-0">
                    {currentTrack.type === 'prayer_lesson' ? 'معلّم الصلاة' : 'مفاتيح الجنان'}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#9fc0b3] truncate block">
                {currentTrack.subtitle}
              </span>
            </div>
          </div>

          {/* Time indicator */}
          <div className="hidden sm:block text-[11px] font-mono text-[#8fa79c] shrink-0 px-1">
            <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
          </div>

          {/* Quick Controls: Previous Surah (if Quran), -10s, Play/Pause, +10s, Next Surah (if Quran) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {isQuran && (
              <button
                onClick={playPreviousQuranSurah}
                disabled={!hasPreviousQuranSurah}
                className={`hidden md:flex p-1.5 rounded-lg border transition-all ${
                  hasPreviousQuranSurah
                    ? 'bg-[#122a21] text-[#cbdad3] hover:text-[#d4af37] border-[#234d3d]'
                    : 'bg-[#0f1f19] text-[#4a6358] border-transparent opacity-30 cursor-not-allowed'
                }`}
                title={hasPreviousQuranSurah ? 'السورة السابقة' : 'لا توجد سورة سابقة'}
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => seekRelative(-10)}
              className="p-1.5 rounded-lg bg-[#122a21] text-[#cbdad3] hover:text-white border border-[#234d3d] hover:border-[#d4af37] active:scale-95 transition-all"
              title="تأخير 10 ثوانٍ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 text-[#0b1311] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0b1311]" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => seekRelative(10)}
              className="p-1.5 rounded-lg bg-[#122a21] text-[#cbdad3] hover:text-white border border-[#234d3d] hover:border-[#d4af37] active:scale-95 transition-all"
              title="تقديم 10 ثوانٍ"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {isQuran && (
              <button
                onClick={playNextQuranSurah}
                disabled={!hasNextQuranSurah}
                className={`hidden md:flex p-1.5 rounded-lg border transition-all ${
                  hasNextQuranSurah
                    ? 'bg-[#122a21] text-[#cbdad3] hover:text-[#d4af37] border-[#234d3d]'
                    : 'bg-[#0f1f19] text-[#4a6358] border-transparent opacity-30 cursor-not-allowed'
                }`}
                title={hasNextQuranSurah ? 'السورة التالية' : 'لا توجد سورة تالية'}
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* If Quran: View Mode Toggle Pill & Expand Button */}
          {isQuran && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() =>
                  onSwitchReadingMode(activeReadingMode === 'mushaf' ? 'text' : 'mushaf')
                }
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#143226] hover:bg-[#1a4234] border border-[#275947] text-[11px] font-bold text-[#d4af37] transition-all"
                title="التبديل بين وضع المصحف والوضع النصي مع استمرار الصوت"
              >
                {activeReadingMode === 'mushaf' ? (
                  <>
                    <BookOpen className="w-3 h-3 text-[#d4af37]" />
                    <span>الوضع النصي</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3 h-3 text-[#d4af37]" />
                    <span>صفحات المصحف</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsFullPlayerOpen(true)}
                className="p-1.5 sm:p-2 rounded-lg bg-[#122a21] text-[#d4af37] hover:bg-[#1a3d30] border border-[#234d3d] active:scale-95 transition-all"
                title="فتح المشغل الكامل للقرآن"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
