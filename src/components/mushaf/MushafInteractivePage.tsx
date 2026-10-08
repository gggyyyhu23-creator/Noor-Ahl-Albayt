import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Volume2,
  Play,
  Pause,
  BookOpen,
  FileText,
  Copy,
  Check,
  Target,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import {
  MushafPageAyah,
  toArabicNumerals,
} from '../../services/quranMushafPageService';
import { ALL_114_SURAHS } from '../../data/quranSurahsAll';

interface MushafInteractivePageProps {
  pageNumber: number;
  themeMode: 'night' | 'parchment';
  activeAyahNumber: number;
  activeSurahNumber: number;
  isPlaying: boolean;
  ayahs: MushafPageAyah[];
  isLoadingAyahs: boolean;
  pageZoom: number;
  onZoomChange: (newZoom: number) => void;
  onAyahClick: (surahNumber: number, ayahNumber: number, startMs: number) => void;
  onSwitchToTextMode: (surahNumber: number, ayahNumber: number) => void;
  isAutoScrollPaused: boolean;
  onResumeAutoScroll: () => void;
  surahName: string;
  juzNumber: number;
}

export const MushafInteractivePage: React.FC<MushafInteractivePageProps> = ({
  pageNumber,
  themeMode,
  activeAyahNumber,
  activeSurahNumber,
  isPlaying,
  ayahs,
  isLoadingAyahs,
  pageZoom,
  onZoomChange,
  onAyahClick,
  onSwitchToTextMode,
  isAutoScrollPaused,
  onResumeAutoScroll,
  surahName,
  juzNumber,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAyah, setSelectedAyah] = useState<MushafPageAyah | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [userHasScrolled, setUserHasScrolled] = useState<boolean>(false);
  const lastActiveKeyRef = useRef<string>('');

  // Reset selected ayah and scroll tracking when page changes
  useEffect(() => {
    setSelectedAyah(null);
    setUserHasScrolled(false);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [pageNumber]);

  // Group ayahs on this page by Surah to render Surah headers and Bismillah banners accurately
  const surahGroups = useMemo(() => {
    const groups: {
      surahNumber: number;
      surahName: string;
      ayahs: MushafPageAyah[];
    }[] = [];

    for (const ayah of ayahs) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.surahNumber === ayah.surahNumber) {
        lastGroup.ayahs.push(ayah);
      } else {
        groups.push({
          surahNumber: ayah.surahNumber,
          surahName: ayah.surahName,
          ayahs: [ayah],
        });
      }
    }

    return groups;
  }, [ayahs]);

  // Smooth auto-scroll to the currently reciting Ayah
  useEffect(() => {
    if (!isPlaying || isAutoScrollPaused || userHasScrolled) {
      return;
    }

    const currentKey = `${activeSurahNumber}_${activeAyahNumber}`;
    if (currentKey === lastActiveKeyRef.current) {
      return;
    }
    lastActiveKeyRef.current = currentKey;

    const ayahElement = document.getElementById(
      `mushaf-ayah-${activeSurahNumber}-${activeAyahNumber}`
    );

    if (ayahElement) {
      ayahElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [isPlaying, activeAyahNumber, activeSurahNumber, isAutoScrollPaused, userHasScrolled, ayahs]);

  // Handle user manual scroll inside page container
  const handleScroll = () => {
    if (isPlaying && !userHasScrolled) {
      setUserHasScrolled(true);
    }
  };

  const handleReturnToActiveAyah = () => {
    setUserHasScrolled(false);
    onResumeAutoScroll();
    const ayahElement = document.getElementById(
      `mushaf-ayah-${activeSurahNumber}-${activeAyahNumber}`
    );
    if (ayahElement) {
      ayahElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  // Zoom handlers for Quran font size
  const handleZoomIn = () => {
    onZoomChange(Math.min(180, pageZoom + 15));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(85, pageZoom - 15));
  };

  const handleResetZoom = () => {
    onZoomChange(100);
  };

  // Copy ayah text to clipboard
  const handleCopyAyah = (ayah: MushafPageAyah) => {
    const textToCopy = `﴿${ayah.cleanVerseText}﴾ [سورة ${ayah.surahName}: ${ayah.ayahNumber}]`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedAyah(ayah.ayahNumber);
      setTimeout(() => setCopiedAyah(null), 2000);
    }
  };

  // Calculate dynamic typography scale based on pageZoom
  // Base font size is 22px on mobile, 25px on desktop
  const fontSizeRem = (1.5 * (pageZoom / 100)).toFixed(2);
  const lineHeightRem = (2.8 * (pageZoom / 100)).toFixed(2);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Top Floating Control Bar: Zoom + Page Context */}
      <div className="w-full max-w-4xl flex items-center justify-between px-2 sm:px-4 py-2 mb-2 bg-[#10231c]/80 backdrop-blur-md rounded-xl border border-[#d4af37]/30 text-xs sm:text-sm text-[#f5ebd7] shadow-lg">
        {/* Left: Info Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-medium border border-[#d4af37]/40 text-xs">
            صفحة {toArabicNumerals(pageNumber)} من ٦٠٤
          </span>
          <span className="hidden md:inline text-[#8aa598] text-xs">
            توزيع مصحف المدينة • نص قرآني تفاعلي
          </span>
        </div>

        {/* Right: Zoom / Text Size Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleZoomOut}
            disabled={pageZoom <= 85}
            className="p-1.5 rounded-lg bg-[#0b1713] hover:bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#f5ebd7] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="تصغير حجم الخط"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-1 text-xs font-mono text-[#d4af37]">
            {pageZoom}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={pageZoom >= 180}
            className="p-1.5 rounded-lg bg-[#0b1713] hover:bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#f5ebd7] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="تكبير حجم الخط"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {pageZoom !== 100 && (
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg bg-[#0b1713] hover:bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#8aa598] hover:text-[#d4af37] transition-all cursor-pointer"
              title="إعادة الحجم الافتراضي"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Mushaf Page Frame */}
      <div
        className={`w-full max-w-4xl rounded-2xl shadow-2xl border-2 transition-colors duration-300 relative overflow-hidden ${
          themeMode === 'night'
            ? 'bg-[#08130f] border-[#d4af37]/40 text-[#f5ebd7]'
            : 'bg-[#fcf9f2] border-[#b89b58]/60 text-[#1a1610]'
        }`}
        style={{ minHeight: '680px' }}
      >
        {/* Ornate Islamic Outer Gilded Border & Arabesque Corner Ornaments */}
        <div
          className={`absolute inset-1 sm:inset-2 border pointer-events-none rounded-xl ${
            themeMode === 'night'
              ? 'border-[#d4af37]/30'
              : 'border-[#b89b58]/40'
          }`}
        />
        <div
          className={`absolute inset-2 sm:inset-3 border-2 pointer-events-none rounded-lg ${
            themeMode === 'night'
              ? 'border-[#d4af37]/20'
              : 'border-[#b89b58]/30'
          }`}
        />

        {/* Decorative Arabesque Corners */}
        <div className="absolute top-2 right-2 w-7 h-7 border-t-2 border-r-2 border-[#d4af37]/70 pointer-events-none" />
        <div className="absolute top-2 left-2 w-7 h-7 border-t-2 border-l-2 border-[#d4af37]/70 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-7 h-7 border-b-2 border-r-2 border-[#d4af37]/70 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-7 h-7 border-b-2 border-l-2 border-[#d4af37]/70 pointer-events-none" />

        {/* Page Top Header: Juz (Right) & Surah (Left) */}
        <div
          className={`relative z-10 px-6 sm:px-10 pt-4 pb-2 flex items-center justify-between border-b ${
            themeMode === 'night'
              ? 'border-[#d4af37]/20 text-[#d4af37]'
              : 'border-[#b89b58]/30 text-[#8c6b12]'
          } text-xs sm:text-sm font-quran select-none`}
        >
          {/* Right: Juz Info */}
          <div className="flex items-center gap-1.5 font-bold">
            <span>الجزء {toArabicNumerals(juzNumber)}</span>
          </div>

          {/* Center Emblem */}
          <div className="text-[#d4af37] text-base opacity-75">
            ۞
          </div>

          {/* Left: Surah Info */}
          <div className="flex items-center gap-1.5 font-bold">
            <span>سورة {surahName}</span>
          </div>
        </div>

        {/* Scrollable Quran Text Body */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="relative z-10 px-5 sm:px-12 py-6 max-h-[72vh] overflow-y-auto selection:bg-[#d4af37]/30"
          dir="rtl"
        >
          {isLoadingAyahs ? (
            <div className="w-full py-28 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-quran text-[#d4af37]">
                جاري تحميل آيات الصفحة {toArabicNumerals(pageNumber)}...
              </p>
            </div>
          ) : ayahs.length === 0 ? (
            <div className="w-full py-20 text-center space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-[#d4af37]/60" />
              <p className="text-base font-quran">لا تتوفر آيات لهذه الصفحة</p>
            </div>
          ) : (
            <div className="space-y-6">
              {surahGroups.map((group) => {
                const firstAyah = group.ayahs[0];
                const surahMeta = ALL_114_SURAHS.find(
                  (s) => s.number === group.surahNumber
                );

                return (
                  <div key={`surah_group_${group.surahNumber}`} className="space-y-4">
                    {/* Surah Header Banner (rendered when Surah begins on this page) */}
                    {firstAyah.isFirstAyahOfSurah && (
                      <div className="my-4 text-center">
                        <div
                          className={`mx-auto max-w-lg px-6 py-2.5 rounded-xl border-2 shadow-md relative overflow-hidden ${
                            themeMode === 'night'
                              ? 'bg-gradient-to-r from-[#0d221a] via-[#153428] to-[#0d221a] border-[#d4af37]/60'
                              : 'bg-gradient-to-r from-[#f5ede0] via-[#ece0ca] to-[#f5ede0] border-[#b89b58]/80'
                          }`}
                        >
                          {/* Inner decorative ornament lines */}
                          <div className="absolute inset-x-2 top-1 h-[1px] bg-[#d4af37]/40" />
                          <div className="absolute inset-x-2 bottom-1 h-[1px] bg-[#d4af37]/40" />

                          <h3
                            className={`font-quran text-xl sm:text-2xl font-bold tracking-wide ${
                              themeMode === 'night' ? 'text-[#f5ebd7]' : 'text-[#2a2213]'
                            }`}
                          >
                            {group.surahName}
                          </h3>

                          {surahMeta && (
                            <div className="mt-1 flex items-center justify-center gap-3 text-xs text-[#d4af37]">
                              <span>{surahMeta.revelationType === 'مكية' ? 'مكية' : 'مدنية'}</span>
                              <span>•</span>
                              <span>{toArabicNumerals(surahMeta.numberOfAyahs)} آية</span>
                            </div>
                          )}
                        </div>

                        {/* Centered Bismillah Header (if applicable) */}
                        {firstAyah.hasHeaderBismillah && (
                          <div className="mt-3 py-1">
                            <span
                              onClick={() => onAyahClick(firstAyah.surahNumber, 1, firstAyah.startMs)}
                              className={`inline-block font-quran text-lg sm:text-2xl cursor-pointer hover:text-[#d4af37] transition-colors select-none ${
                                isPlaying &&
                                activeSurahNumber === group.surahNumber &&
                                activeAyahNumber === 1
                                  ? 'text-[#d4af37] scale-105 font-bold animate-pulse'
                                  : themeMode === 'night'
                                  ? 'text-[#e6dcbe]'
                                  : 'text-[#3d321d]'
                              }`}
                              title="انقر للاستماع إلى السورة"
                            >
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Flowing Quranic Text for this Surah on this page */}
                    <div
                      className="text-justify font-quran select-text transition-all duration-150"
                      style={{
                        fontSize: `${fontSizeRem}rem`,
                        lineHeight: `${lineHeightRem}rem`,
                      }}
                    >
                      {group.ayahs.map((ayah) => {
                        const isActiveAyah =
                          isPlaying &&
                          ayah.surahNumber === activeSurahNumber &&
                          ayah.ayahNumber === activeAyahNumber;

                        const isSelectedAyah =
                          selectedAyah?.surahNumber === ayah.surahNumber &&
                          selectedAyah?.ayahNumber === ayah.ayahNumber;

                        return (
                          <span
                            key={`page_ayah_${ayah.surahNumber}_${ayah.ayahNumber}`}
                            id={`mushaf-ayah-${ayah.surahNumber}-${ayah.ayahNumber}`}
                            onClick={() => {
                              setSelectedAyah(ayah);
                              onAyahClick(ayah.surahNumber, ayah.ayahNumber, ayah.startMs);
                            }}
                            className={`cursor-pointer transition-all duration-200 inline rounded-md px-1 py-0.5 mx-0.5 select-text ${
                              isActiveAyah
                                ? themeMode === 'night'
                                  ? 'bg-[#d4af37]/25 text-[#fcedb3] ring-1 ring-[#d4af37]/80 shadow-md font-semibold'
                                  : 'bg-[#d4af37]/30 text-[#856108] ring-1 ring-[#b89b58] shadow-md font-bold'
                                : isSelectedAyah
                                ? themeMode === 'night'
                                  ? 'bg-[#10b981]/20 ring-1 ring-[#10b981]/70'
                                  : 'bg-[#10b981]/15 ring-1 ring-[#10b981]/70'
                                : 'hover:bg-[#d4af37]/15'
                            }`}
                            title={`سورة ${ayah.surahName} - الآية ${ayah.ayahNumber}`}
                          >
                            {/* Authentic Verse Text */}
                            <span>{ayah.cleanVerseText}</span>

                            {/* Authentic End of Ayah Quranic Marker */}
                            <span
                              className={`inline-flex items-center justify-center mx-1.5 font-sans font-medium text-xs sm:text-sm select-none align-middle transition-transform ${
                                isActiveAyah
                                  ? 'scale-110 text-[#d4af37] font-bold'
                                  : themeMode === 'night'
                                  ? 'text-[#d4af37]/90'
                                  : 'text-[#8c6b12]'
                              }`}
                            >
                              <span className="opacity-70">﴿</span>
                              <span className="px-0.5">{toArabicNumerals(ayah.ayahNumber)}</span>
                              <span className="opacity-70">﴾</span>
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Page Footer: Centered Page Badge */}
        <div
          className={`relative z-10 px-6 py-2.5 flex items-center justify-between border-t ${
            themeMode === 'night'
              ? 'border-[#d4af37]/20 text-[#8aa598]'
              : 'border-[#b89b58]/30 text-[#7a6a4a]'
          } text-xs font-quran select-none`}
        >
          {/* Left: Juz count */}
          <div className="text-[11px] text-[#8aa598]">
            الجزء {toArabicNumerals(juzNumber)}
          </div>

          {/* Center: Page Number Badge */}
          <div className="flex items-center gap-1">
            <span
              className={`px-3 py-1 rounded-full border text-xs font-bold font-sans ${
                themeMode === 'night'
                  ? 'border-[#d4af37]/40 bg-[#0d221a] text-[#d4af37]'
                  : 'border-[#b89b58]/60 bg-[#f3ede1] text-[#705510]'
              }`}
            >
              {toArabicNumerals(pageNumber)}
            </span>
          </div>

          {/* Right: Quick hint */}
          <div className="text-[11px] text-[#8aa598] hidden sm:block">
            انقر على أي آية للاستماع
          </div>
        </div>
      </div>

      {/* Floating "Return to Active Ayah" Button (Appears if user scrolled away during playback) */}
      {isPlaying && userHasScrolled && (
        <button
          onClick={handleReturnToActiveAyah}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-[#102920] hover:bg-[#183d30] text-[#d4af37] border-2 border-[#d4af37] shadow-2xl transition-all animate-bounce cursor-pointer"
        >
          <Target className="w-4 h-4 animate-spin" />
          <span className="text-xs sm:text-sm font-bold font-quran">
            العودة للآية الجارية (الآية {activeAyahNumber})
          </span>
        </button>
      )}

      {/* Selected Ayah Quick Action Bottom Sheet */}
      {selectedAyah && (
        <div className="w-full max-w-4xl mt-3 p-3 sm:p-4 rounded-xl bg-[#10231c]/95 backdrop-blur-md border border-[#d4af37]/40 text-[#f5ebd7] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          {/* Ayah Details */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] text-xs font-bold font-sans">
              {toArabicNumerals(selectedAyah.ayahNumber)}
            </div>
            <div>
              <h4 className="text-sm font-bold font-quran text-white">
                سورة {selectedAyah.surahName} — الآية {toArabicNumerals(selectedAyah.ayahNumber)}
              </h4>
              <p className="text-xs text-[#8aa598] line-clamp-1 max-w-md">
                {selectedAyah.cleanVerseText}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => onAyahClick(selectedAyah.surahNumber, selectedAyah.ayahNumber, selectedAyah.startMs)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#b89b58] text-[#0b1311] text-xs font-bold transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>استماع</span>
            </button>

            <button
              onClick={() => onSwitchToTextMode(selectedAyah.surahNumber, selectedAyah.ayahNumber)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b1713] hover:bg-[#163026] text-[#f5ebd7] border border-[#d4af37]/30 text-xs transition-colors cursor-pointer"
              title="الانتقال إلى وضع القراءة النصية مع التفسير"
            >
              <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden sm:inline">القراءة النصية</span>
            </button>

            <button
              onClick={() => handleCopyAyah(selectedAyah)}
              className="p-1.5 rounded-lg bg-[#0b1713] hover:bg-[#163026] text-[#8aa598] hover:text-[#d4af37] border border-[#d4af37]/30 transition-colors cursor-pointer"
              title="نسخ نص الآية"
            >
              {copiedAyah === selectedAyah.ayahNumber ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => setSelectedAyah(null)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer text-xs"
              title="إغلاق"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
