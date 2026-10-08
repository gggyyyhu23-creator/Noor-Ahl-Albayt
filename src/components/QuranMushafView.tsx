import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Play, 
  Pause, 
  Trash2, 
  Moon, 
  Sun, 
  Volume2, 
  HardDrive, 
  Check, 
  Loader2,
  ZoomIn,
  ZoomOut,
  Bookmark,
  Share2,
  Copy,
  Search,
  BookMarked,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  RotateCcw,
  RotateCw,
  Repeat,
  Gauge,
  SlidersHorizontal,
  Navigation,
  Target,
  FileText
} from 'lucide-react';
import { 
  RECITERS_LIST, 
  Reciter,
  SurahTextDetail
} from '../data/quranData';
import { 
  ALL_114_SURAHS, 
  JUZ_NAMES, 
  getPageMetadata, 
  getMushafPageImageUrl, 
  getMushafPageFallbackUrl 
} from '../data/quranSurahsAll';
import { 
  getFullSurahText, 
  searchInQuran, 
  AyahSearchResult 
} from '../utils/quranFullService';
import { 
  downloadQuranAudio, 
  getCachedAudioUrl, 
  deleteDownloadedAudio, 
  getDownloadedMetaList, 
  formatBytes, 
  DownloadedAudioItem 
} from '../utils/audioStorage';
import { 
  getQuranBookmarks, 
  toggleQuranBookmark, 
  isPageBookmarked, 
  QuranBookmark 
} from '../utils/quranBookmarksStorage';
import { 
  getMushafPageForAyah, 
  getFirstAyahOnPage 
} from '../utils/quranPageMapping';
import { 
  getQuranContinueReading, 
  saveQuranContinueReading, 
  getLastSelectedReciter, 
  saveLastSelectedReciter,
  QuranContinueReadingState 
} from '../utils/quranContinueReading';
import { useAudioEngine } from '../context/AudioContext';
import { QuranMiniPlayer } from './audio/QuranMiniPlayer';
import { QuranFullPlayerModal } from './audio/QuranFullPlayerModal';
import { MushafInteractivePage } from './mushaf/MushafInteractivePage';
import { MushafPageAyah, quranMushafPageService } from '../services/quranMushafPageService';

interface QuranMushafViewProps {
  initialPageNumber?: number;
}

export const QuranMushafView: React.FC<QuranMushafViewProps> = ({ initialPageNumber }) => {
  // Central Audio Engine
  const {
    currentTrack,
    isPlaying,
    playQuranSurah,
    togglePlay,
    pause,
    resume,
    seek,
    seekRelative,
    setPlaybackSpeed,
    setRepeatMode,
    playbackSpeed,
    repeatMode,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    quranState,
    updateQuranState,
  } = useAudioEngine();

  // Load initial continue reading state
  const initialContinueState = getQuranContinueReading();

  // Reading Mode: 'mushaf' (physical book pages 1-604) vs 'text' (continuous verse text list)
  const [readingMode, setReadingMode] = useState<'mushaf' | 'text'>(
    initialContinueState.lastViewMode || 'mushaf'
  );

  const [currentPageNum, setCurrentPageNum] = useState<number>(() => {
    if (initialPageNumber && initialPageNumber >= 1 && initialPageNumber <= 604) {
      return initialPageNumber;
    }
    return initialContinueState.lastMushafPage || 1;
  });

  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(
    initialContinueState.lastSurahNumber || 1
  );

  const [activeAyahNum, setActiveAyahNum] = useState<number>(
    initialContinueState.lastAyahNumber || 1
  );

  const [selectedReciter, setSelectedReciter] = useState<Reciter>(() => {
    const savedReciterId = getLastSelectedReciter();
    return RECITERS_LIST.find((r) => r.id === savedReciterId) || RECITERS_LIST[0];
  });

  // Authentic Ayah Polygons for current Mushaf page
  const [pageAyahs, setPageAyahs] = useState<MushafPageAyah[]>([]);
  const [isLoadingPageAyahs, setIsLoadingPageAyahs] = useState<boolean>(false);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState<boolean>(false);

  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [tabMode, setTabMode] = useState<'reader' | 'downloads' | 'bookmarks'>('reader');
  const [themeMode, setThemeMode] = useState<'night' | 'parchment'>('parchment');

  // Zoom / Scale state for Mushaf page (100% normal)
  const [pageZoom, setPageZoom] = useState<number>(100);
  const [textFontSize, setTextFontSize] = useState<number>(24);

  // Jump Drawer / Modal state
  const [isJumpModalOpen, setIsJumpModalOpen] = useState<boolean>(false);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<AyahSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Text View Surah data
  const [currentSurahDetail, setCurrentSurahDetail] = useState<SurahTextDetail | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(false);

  // Download state
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [downloadingMap, setDownloadingMap] = useState<{ [key: string]: boolean }>({});
  const [downloadedList, setDownloadedList] = useState<DownloadedAudioItem[]>(() =>
    getDownloadedMetaList('quran')
  );

  // Bookmarks state
  const [bookmarksList, setBookmarksList] = useState<QuranBookmark[]>(() => getQuranBookmarks());
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  // Continue reading banner state
  const [continueReading, setContinueReading] = useState<QuranContinueReadingState>(initialContinueState);

  // Touch swipe handling for physical page turning
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Get current metadata for page (1-604)
  const pageMeta = getPageMetadata(currentPageNum);

  // Handle external navigation (from search, calendar, etc.)
  useEffect(() => {
    if (initialPageNumber && initialPageNumber >= 1 && initialPageNumber <= 604) {
      setCurrentPageNum(initialPageNumber);
      const meta = getPageMetadata(initialPageNumber);
      setSelectedSurahNum(meta.surahNumber);
      const startAyah = getFirstAyahOnPage(initialPageNumber);
      setActiveAyahNum(startAyah.ayahNumber);
    }
  }, [initialPageNumber]);

  // Load surah detail when selectedSurahNum changes (for text view)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSurah(true);
    getFullSurahText(selectedSurahNum).then((data) => {
      if (isMounted) {
        setCurrentSurahDetail(data);
        setIsLoadingSurah(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedSurahNum]);

  // Load authentic ayah timings & polygon boundaries for physical Mushaf page (1-604)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingPageAyahs(true);
    quranMushafPageService
      .getPageAyahs(currentPageNum, selectedReciter.readId || 123)
      .then((data) => {
        if (isMounted) {
          setPageAyahs(data);
          setIsLoadingPageAyahs(false);
        }
      });

    // Preload adjacent pages for instantaneous turning
    quranMushafPageService.preloadAdjacent(currentPageNum, selectedReciter.readId || 123);

    return () => {
      isMounted = false;
    };
  }, [currentPageNum, selectedReciter.readId]);

  // Sync active ayah and mushaf page from audio engine if audio is playing
  useEffect(() => {
    if (quranState) {
      if (quranState.surahNumber && quranState.surahNumber !== selectedSurahNum) {
        setSelectedSurahNum(quranState.surahNumber);
      }
      if (quranState.currentAyahNumber && quranState.currentAyahNumber !== activeAyahNum) {
        setActiveAyahNum(quranState.currentAyahNumber);
      }
      // If following audio in Mushaf Mode, automatically turn page when ayah page advances (unless user paused auto-follow)
      if (
        readingMode === 'mushaf' &&
        isPlaying &&
        !isAutoScrollPaused &&
        quranState.currentMushafPage &&
        quranState.currentMushafPage !== currentPageNum
      ) {
        setCurrentPageNum(quranState.currentMushafPage);
      }
    }
  }, [
    quranState?.currentAyahNumber,
    quranState?.surahNumber,
    quranState?.currentMushafPage,
    selectedSurahNum,
    readingMode,
    isPlaying,
    isAutoScrollPaused,
    currentPageNum,
    activeAyahNum,
  ]);

  // Auto-scroll to active ayah in Text View if enabled
  useEffect(() => {
    if (readingMode === 'text' && autoScrollEnabled && activeAyahNum) {
      const ayahElement = document.getElementById(`ayah-node-${activeAyahNum}`);
      if (ayahElement) {
        ayahElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeAyahNum, readingMode, autoScrollEnabled]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      searchInQuran(searchQuery).then((res) => {
        setSearchResults(res);
        setIsSearching(false);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // =========================================================================
  // SYNCHRONIZATION BETWEEN TEXT VIEW AND MUSHAF PAGES VIEW
  // =========================================================================
  const handleReadingModeChange = (targetMode: 'mushaf' | 'text') => {
    if (targetMode === readingMode) return;

    if (targetMode === 'mushaf') {
      // Transition from TEXT to MUSHAF:
      // Map current surah and active ayah to its authentic Mushaf page
      const targetPage = getMushafPageForAyah(selectedSurahNum, activeAyahNum);
      setCurrentPageNum(targetPage);
      setReadingMode('mushaf');

      const updated = saveQuranContinueReading({
        lastViewMode: 'mushaf',
        lastMushafPage: targetPage,
        lastSurahNumber: selectedSurahNum,
        lastAyahNumber: activeAyahNum,
      });
      setContinueReading(updated);

      // Keep audio playing and update quranState
      updateQuranState({
        viewMode: 'mushaf',
        currentMushafPage: targetPage,
        surahNumber: selectedSurahNum,
        currentAyahNumber: activeAyahNum,
      });
    } else {
      // Transition from MUSHAF to TEXT:
      // Map current Mushaf page to its first ayah and surah
      const firstAyah = getFirstAyahOnPage(currentPageNum);
      setSelectedSurahNum(firstAyah.surahNumber);
      setActiveAyahNum(firstAyah.ayahNumber);
      setReadingMode('text');

      const updated = saveQuranContinueReading({
        lastViewMode: 'text',
        lastSurahNumber: firstAyah.surahNumber,
        lastSurahName: firstAyah.surahName,
        lastAyahNumber: firstAyah.ayahNumber,
        lastMushafPage: currentPageNum,
      });
      setContinueReading(updated);

      // Keep audio playing and update quranState
      updateQuranState({
        viewMode: 'text',
        surahNumber: firstAyah.surahNumber,
        currentAyahNumber: firstAyah.ayahNumber,
        currentMushafPage: currentPageNum,
      });
    }
  };

  const refreshDownloads = () => {
    setDownloadedList(getDownloadedMetaList('quran'));
  };

  const refreshBookmarks = () => {
    setBookmarksList(getQuranBookmarks());
  };

  // Switch physical Mushaf page (1 - 604)
  const handlePageChange = (pageNum: number) => {
    const target = Math.max(1, Math.min(604, pageNum));
    setImageError(false);
    setCurrentPageNum(target);
    const meta = getPageMetadata(target);
    setSelectedSurahNum(meta.surahNumber);
    const startAyah = getFirstAyahOnPage(target);
    setActiveAyahNum(startAyah.ayahNumber);

    // If audio is playing and user manually moved away from playing page, pause auto-follow
    if (isPlaying && quranState?.currentMushafPage && quranState.currentMushafPage !== target) {
      setIsAutoScrollPaused(true);
    } else {
      setIsAutoScrollPaused(false);
    }

    const updated = saveQuranContinueReading({
      lastViewMode: 'mushaf',
      lastMushafPage: target,
      lastSurahNumber: meta.surahNumber,
      lastSurahName: meta.surahName,
      lastAyahNumber: startAyah.ayahNumber,
    });
    setContinueReading(updated);

    updateQuranState({
      currentMushafPage: target,
      surahNumber: meta.surahNumber,
      currentAyahNumber: startAyah.ayahNumber,
    });
  };

  // Direct click on Ayah inside interactive Mushaf polygon (Requirement 4)
  const handleMushafAyahClick = async (surahNumber: number, ayahNumber: number, startMs: number) => {
    setSelectedSurahNum(surahNumber);
    setActiveAyahNum(ayahNumber);
    setIsAutoScrollPaused(false);

    saveQuranContinueReading({
      lastViewMode: 'mushaf',
      lastSurahNumber: surahNumber,
      lastAyahNumber: ayahNumber,
      lastMushafPage: currentPageNum,
      lastAudioPositionSec: startMs / 1000,
    });

    // If already playing this surah and reciter, seek directly to startMs
    if (
      isPlaying &&
      currentTrack?.type === 'quran' &&
      quranState?.surahNumber === surahNumber &&
      quranState?.reciterId === selectedReciter.id
    ) {
      seek(startMs / 1000);
      updateQuranState({
        currentAyahNumber: ayahNumber,
        activeAyahHighlight: ayahNumber,
        currentMushafPage: currentPageNum,
      });
      return;
    }

    // Otherwise initiate playback from this ayah
    await playQuranSurah(surahNumber, selectedReciter.id, {
      startAyah: ayahNumber,
      startPage: currentPageNum,
      startTimeSec: startMs / 1000,
    });
  };

  // Jump from Mushaf mode to Text mode (Requirement 7)
  const handleJumpFromMushafToText = (surahNumber: number, ayahNumber: number) => {
    setSelectedSurahNum(surahNumber);
    setActiveAyahNum(ayahNumber);
    setReadingMode('text');

    saveQuranContinueReading({
      lastViewMode: 'text',
      lastSurahNumber: surahNumber,
      lastAyahNumber: ayahNumber,
      lastMushafPage: currentPageNum,
    });

    updateQuranState({
      viewMode: 'text',
      surahNumber,
      currentAyahNumber: ayahNumber,
      currentMushafPage: currentPageNum,
    });
  };

  // Jump from Text mode to Mushaf mode (Requirement 7)
  const handleJumpFromTextToMushaf = (surahNumber: number, ayahNumber: number) => {
    const targetPage = getMushafPageForAyah(surahNumber, ayahNumber);
    setCurrentPageNum(targetPage);
    setSelectedSurahNum(surahNumber);
    setActiveAyahNum(ayahNumber);
    setIsAutoScrollPaused(false);
    setReadingMode('mushaf');

    saveQuranContinueReading({
      lastViewMode: 'mushaf',
      lastMushafPage: targetPage,
      lastSurahNumber: surahNumber,
      lastAyahNumber: ayahNumber,
    });

    updateQuranState({
      viewMode: 'mushaf',
      currentMushafPage: targetPage,
      surahNumber,
      currentAyahNumber: ayahNumber,
    });
  };

  // Resume auto-scroll if user navigated away manually (Requirement 11)
  const handleResumeAutoScroll = () => {
    setIsAutoScrollPaused(false);
    if (quranState?.currentMushafPage && quranState.currentMushafPage !== currentPageNum) {
      setCurrentPageNum(quranState.currentMushafPage);
    }
    if (quranState?.currentAyahNumber) {
      setActiveAyahNum(quranState.currentAyahNumber);
    }
  };

  const handleNextPage = () => {
    if (currentPageNum < 604) {
      handlePageChange(currentPageNum + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageNum > 1) {
      handlePageChange(currentPageNum - 1);
    }
  };

  // Swipe navigation listeners (RTL: swipe left = next, swipe right = previous)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextPage();
    }
    if (isRightSwipe) {
      handlePrevPage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Select Surah from dropdown or jump
  const handleSurahSelect = (surahNum: number) => {
    setSelectedSurahNum(surahNum);
    setActiveAyahNum(1);
    const surahMeta = ALL_114_SURAHS.find((s) => s.number === surahNum);
    if (surahMeta) {
      const targetPage = surahMeta.startPage;
      setCurrentPageNum(targetPage);

      const updated = saveQuranContinueReading({
        lastSurahNumber: surahNum,
        lastSurahName: surahMeta.name,
        lastAyahNumber: 1,
        lastMushafPage: targetPage,
      });
      setContinueReading(updated);

      updateQuranState({
        surahNumber: surahNum,
        currentAyahNumber: 1,
        currentMushafPage: targetPage,
      });
    }
  };

  // Change reciter
  const handleReciterChange = (reciter: Reciter) => {
    setSelectedReciter(reciter);
    saveLastSelectedReciter(reciter.id);

    // If audio is playing, switch reciter seamlessly
    if (isPlaying && currentTrack?.type === 'quran') {
      playQuranSurah(selectedSurahNum, reciter.id, {
        startAyah: activeAyahNum,
        startPage: currentPageNum,
      });
    }
  };

  // Start playing full Surah audio via Central Audio Engine
  const handleStartPlaySurah = async (surahNumber: number, startAyah?: number) => {
    const ayah = startAyah || activeAyahNum || 1;
    const page = getMushafPageForAyah(surahNumber, ayah);

    await playQuranSurah(surahNumber, selectedReciter.id, {
      startAyah: ayah,
      startPage: page,
    });
  };

  // Play or Seek directly to a specific ayah
  const handlePlayAyahDirect = async (ayahNumber: number) => {
    setActiveAyahNum(ayahNumber);
    const page = getMushafPageForAyah(selectedSurahNum, ayahNumber);
    saveQuranContinueReading({
      lastViewMode: readingMode,
      lastSurahNumber: selectedSurahNum,
      lastAyahNumber: ayahNumber,
      lastMushafPage: page,
    });

    // If already playing this surah and track has reliable timestamps, seek directly
    if (
      isPlaying &&
      currentTrack?.type === 'quran' &&
      quranState?.surahNumber === selectedSurahNum &&
      (currentTrack as any).ayahTimestamps?.length
    ) {
      const timestamps = (currentTrack as any).ayahTimestamps;
      const targetTimestamp = timestamps.find((t: any) => t.ayahNumber === ayahNumber);
      if (targetTimestamp) {
        seek(targetTimestamp.startMs / 1000);
        return;
      }
    }

    // Otherwise initiate playback from this ayah
    await playQuranSurah(selectedSurahNum, selectedReciter.id, {
      startAyah: ayahNumber,
      startPage: page,
    });
  };

  // Bookmark Toggle
  const handleToggleBookmark = () => {
    toggleQuranBookmark(
      currentPageNum,
      pageMeta.surahName,
      pageMeta.juz,
      `صفحة ${currentPageNum}`
    );
    refreshBookmarks();
  };

  const isCurrentBookmarked = isPageBookmarked(currentPageNum);

  // Download Surah audio
  const handleDownload = async (surahNumber: number) => {
    const surahMeta = ALL_114_SURAHS.find((s) => s.number === surahNumber);
    if (!surahMeta) return;

    const audioId = `${selectedReciter.id}_surah_${surahNumber}`;
    const url = selectedReciter.sampleUrl(surahNumber);

    setDownloadingMap((prev) => ({ ...prev, [audioId]: true }));
    try {
      await downloadQuranAudio(
        url,
        {
          id: audioId,
          surahNumber,
          surahName: surahMeta.name,
          reciterId: selectedReciter.id,
          reciterName: selectedReciter.name,
        },
        (progress: number) => {
          setDownloadProgress((prev) => ({ ...prev, [audioId]: progress }));
        }
      );
      refreshDownloads();
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setDownloadingMap((prev) => ({ ...prev, [audioId]: false }));
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    await deleteDownloadedAudio(audioId);
    refreshDownloads();
  };

  const handleCopyAyah = (text: string, ayahNum: number) => {
    const formatted = `﴿ ${text} ﴾ [${currentSurahDetail?.name || pageMeta.surahName}: ${ayahNum}]`;
    navigator.clipboard.writeText(formatted);
    setCopiedAyah(ayahNum);
    setTimeout(() => setCopiedAyah(null), 2000);
  };

  const handleShareSurah = () => {
    if (!currentSurahDetail) return;
    const shareText = `سورة ${currentSurahDetail.name} الشريفة من القرآن الكريم\nعدد آياتها: ${currentSurahDetail.numberOfAyahs}\n\nتطبيق نور العترة الشيعي`;
    if (navigator.share) {
      navigator.share({
        title: `سورة ${currentSurahDetail.name}`,
        text: shareText,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  // Handle Resume from Continue Reading Banner
  const handleResumeContinueReading = () => {
    if (continueReading.lastViewMode === 'mushaf') {
      handlePageChange(continueReading.lastMushafPage);
      setReadingMode('mushaf');
    } else {
      setSelectedSurahNum(continueReading.lastSurahNumber);
      setActiveAyahNum(continueReading.lastAyahNumber);
      setReadingMode('text');
    }

    if (continueReading.lastAudioPositionSec && continueReading.lastAudioSurahNumber) {
      playQuranSurah(
        continueReading.lastAudioSurahNumber,
        continueReading.lastReciterId || selectedReciter.id,
        {
          startTimeSec: continueReading.lastAudioPositionSec,
          startAyah: continueReading.lastAyahNumber,
          startPage: continueReading.lastMushafPage,
        }
      );
    }
  };

  return (
    <div className="space-y-4 pb-16 select-none" dir="rtl">
      {/* 1. TOP HEADER CARD */}
      <div className="rounded-2xl bg-gradient-to-r from-[#112920] via-[#1a4436] to-[#0f251c] p-4 sm:p-6 border-2 border-[#d4af37]/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#d4af37]">
            <BookOpen className="w-4 h-4 fill-current text-[#d4af37]" />
            <span>المصحف الشريف الكامل • برواية حفص عن عاصم</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-quran text-[#f7ecd6] mt-1">
            القرآن الكريم (١١٤ سورة و ٦٠٤ صفحات)
          </h2>
          <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-0.5">
            تلاوات صوتية عطرة، خط عثماني محقق، مصحف المدينة المنورة المصور، ومزامنة موحدة للقراءة والاستماع.
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Reading Mode Switcher */}
          <div className="flex items-center bg-[#091813] p-1 rounded-xl border border-[#234d3d]">
            <button
              onClick={() => handleReadingModeChange('mushaf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                readingMode === 'mushaf' && tabMode === 'reader'
                  ? 'bg-[#d4af37] text-[#0b1311] shadow'
                  : 'text-[#cbdad3] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>صفحات المصحف</span>
            </button>
            <button
              onClick={() => handleReadingModeChange('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                readingMode === 'text' && tabMode === 'reader'
                  ? 'bg-[#d4af37] text-[#0b1311] shadow'
                  : 'text-[#cbdad3] hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>الوضع النصي</span>
            </button>
          </div>

          {/* Jump to Page / Surah */}
          <button
            onClick={() => setIsJumpModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#143328] hover:bg-[#1b4435] text-[#d4af37] text-xs font-bold border border-[#275947] transition-all shadow"
            title="انتقال سريع لصفحة أو سورة"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">انتقال سريع</span>
          </button>

          {/* Search in Quran */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#143328] hover:bg-[#1b4435] text-white text-xs font-bold border border-[#275947] transition-all shadow"
            title="البحث في آيات القرآن الكريم"
          >
            <Search className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden sm:inline">بحث قرآني</span>
          </button>

          {/* Bookmarks Tab Toggle */}
          <button
            onClick={() => setTabMode(tabMode === 'bookmarks' ? 'reader' : 'bookmarks')}
            className={`p-2 rounded-xl border text-xs transition-all ${
              tabMode === 'bookmarks'
                ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]'
                : 'bg-[#122e23] text-[#d4af37] border-[#22523f] hover:bg-[#1a4234]'
            }`}
            title="العلامات المرجعية المحفوظة"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>

          {/* Downloads Tab Toggle */}
          <button
            onClick={() => setTabMode(tabMode === 'downloads' ? 'reader' : 'downloads')}
            className={`p-2 rounded-xl border text-xs transition-all ${
              tabMode === 'downloads'
                ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]'
                : 'bg-[#122e23] text-[#d4af37] border-[#22523f] hover:bg-[#1a4234]'
            }`}
            title="الصوتيات المحملة بدون نت"
          >
            <HardDrive className="w-4 h-4" />
          </button>

          {/* Theme Mode Toggle (Night vs Parchment) */}
          <button
            onClick={() => setThemeMode(themeMode === 'night' ? 'parchment' : 'night')}
            className="p-2 rounded-xl bg-[#122e23] text-[#d4af37] hover:bg-[#1a4234] border border-[#22523f] text-xs transition-all"
            title={themeMode === 'night' ? 'الوضع العاجي' : 'الوضع الليلي'}
          >
            {themeMode === 'night' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. CONTINUE READING BANNER («متابعة القراءة») */}
      {tabMode === 'reader' && continueReading && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-[#143328] via-[#1a4235] to-[#112a21] border border-[#d4af37]/50 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-[#9fc0b3] block">
                متابعة القراءة ({continueReading.lastViewMode === 'mushaf' ? 'وضع المصحف' : 'الوضع النصي'}):
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white font-quran truncate">
                سورة {continueReading.lastSurahName} • الآية {continueReading.lastAyahNumber} • صفحة {continueReading.lastMushafPage}
              </h4>
            </div>
          </div>

          <button
            onClick={handleResumeContinueReading}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[#d4af37] text-[#0b1311] font-bold text-xs hover:bg-amber-400 transition-all shrink-0 active:scale-95 shadow"
          >
            <span>استئناف القراءة</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. SEARCH MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0d221a] border-2 border-[#d4af37]/60 shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1b3f31] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#d4af37]">
                <Search className="w-4 h-4" />
                <span>البحث القرآني الشامل (بدون تشكيل)</span>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg hover:bg-[#143328] text-[#8fa79c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#8fa79c] absolute top-3.5 right-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اكتب كلمة أو آية للبحث في كامل القرآن الكريم..."
                className="w-full bg-[#081510] border border-[#234d3d] rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-[#6f8d80] outline-none focus:border-[#d4af37]"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isSearching ? (
                <div className="py-8 text-center text-xs text-[#d4af37]">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  جاري البحث في كامل آيات القرآن...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedSurahNum(res.surahNumber);
                      setActiveAyahNum(res.ayahNumber);
                      const targetPage = getMushafPageForAyah(res.surahNumber, res.ayahNumber);
                      setCurrentPageNum(targetPage);
                      setIsSearchOpen(false);
                      setTabMode('reader');
                    }}
                    className="p-3 rounded-xl bg-[#112a20] hover:bg-[#183d2e] border border-[#1b4232] cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs text-[#d4af37] font-bold">
                      <span>سورة {res.surahName}</span>
                      <span>الآية {res.ayahNumber}</span>
                    </div>
                    <p className="font-quran text-sm text-white leading-relaxed">
                      {res.text}
                    </p>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="py-8 text-center text-xs text-[#8fa79c]">
                  لم يتم العثور على آيات مطابقة للبحث. جرب كتابة كلمات أخرى.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 4. JUMP MODAL */}
      {isJumpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e231c] border-2 border-[#d4af37]/60 shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1b4334] pb-3">
              <h3 className="text-sm font-bold text-[#d4af37] flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                <span>انتقال سريع في المصحف الشريف</span>
              </h3>
              <button
                onClick={() => setIsJumpModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#153629] text-[#8ea89c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Jump by Page Number */}
            <div className="space-y-2">
              <label className="text-xs text-[#cbdad3] font-bold">انتقال برقم الصفحة (1 - 604):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="604"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  placeholder="أدخل رقم الصفحة..."
                  className="flex-1 bg-[#091712] border border-[#234d3d] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#d4af37]"
                />
                <button
                  onClick={() => {
                    const p = parseInt(jumpPageInput, 10);
                    if (!isNaN(p) && p >= 1 && p <= 604) {
                      handlePageChange(p);
                      setIsJumpModalOpen(false);
                      setJumpPageInput('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#d4af37] text-[#0b1311] font-bold text-xs hover:bg-amber-400 transition-all"
                >
                  انتقال
                </button>
              </div>
            </div>

            {/* Jump by Surah */}
            <div className="space-y-2 pt-2 border-t border-[#1b4334] flex-1 overflow-hidden flex flex-col">
              <label className="text-xs text-[#cbdad3] font-bold">اختر سورة للانتقال المباشر:</label>
              <div className="overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {ALL_114_SURAHS.map((s) => (
                    <button
                      key={s.number}
                      onClick={() => {
                        handleSurahSelect(s.number);
                        setIsJumpModalOpen(false);
                      }}
                      className="p-2 text-right rounded-lg bg-[#112920] hover:bg-[#1a3f31] hover:text-[#d4af37] text-xs text-[#c6ded3] transition-all border border-transparent hover:border-[#d4af37]/30"
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{s.number}. {s.name}</span>
                        <span className="text-[9px] px-1 rounded bg-[#0b1a14] text-[#8fa79c]">
                          {s.revelationType}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#7fa394]">
                        ص {s.startPage} • {s.numberOfAyahs} آية
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MAIN READER AREA                                            */}
      {/* ============================================================== */}
      {tabMode === 'bookmarks' ? (
        /* BOOKMARKS LIST */
        <div className="p-4 sm:p-6 rounded-2xl bg-[#0e231c] border border-[#1b4334] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#d4af37] flex items-center gap-2">
              <Bookmark className="w-4 h-4 fill-current" />
              <span>العلامات المرجعية المحفوظة ({bookmarksList.length})</span>
            </h3>
          </div>

          {bookmarksList.length === 0 ? (
            <div className="text-center py-12 text-[#8ea89c] text-sm">
              لا توجد علامات مرجعية محفوظة بعد. اضغط على أيقونة العلامة المرجعية أثناء القراءة لحفظ الصفحة.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {bookmarksList.map((bm) => (
                <div
                  key={bm.id}
                  className="p-4 rounded-xl bg-[#122d22] border border-[#1f4a39] hover:border-[#d4af37] transition-all flex items-center justify-between gap-3 group"
                >
                  <div
                    onClick={() => {
                      handlePageChange(bm.pageNumber);
                      setTabMode('reader');
                    }}
                    className="cursor-pointer flex-1"
                  >
                    <div className="font-bold text-sm text-white group-hover:text-[#d4af37] transition-colors">
                      سورة {bm.surahName}
                    </div>
                    <div className="text-xs text-[#8fa89b] mt-0.5">
                      صفحة {bm.pageNumber} • الجزء {bm.juz}
                    </div>
                    <div className="text-[10px] text-[#698579] mt-1 font-mono">
                      {new Date(bm.savedAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      toggleQuranBookmark(bm.pageNumber, bm.surahName, bm.juz);
                      refreshBookmarks();
                    }}
                    className="p-2 rounded-lg bg-[#0b1b14] text-red-400 hover:bg-red-950/40 transition-colors"
                    title="حذف العلامة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tabMode === 'downloads' ? (
        /* AUDIO DOWNLOADS LIST */
        <div className="p-4 sm:p-6 rounded-2xl bg-[#0e231c] border border-[#1b4334] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#d4af37] flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#d4af37]" />
              <span>الصوتيات المحملة للاستماع بدون إنترنت ({downloadedList.length})</span>
            </h3>
          </div>

          {downloadedList.length === 0 ? (
            <div className="text-center py-12 text-[#8ea89c] text-sm">
              لم تقم بتنزيل أي سور بعد. يمكنك تنزيل أي سورة من خلال زر التحميل بجانب القارئ لتستمع إليها بدون اتصال بالإنترنت.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {downloadedList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#122d22] border border-[#1f4a39] flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-white">{item.title}</div>
                    <div className="text-xs text-[#8fa89b]">
                      {item.subtitle} • {formatBytes(item.fileSizeBytes)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartPlaySurah(item.surahNumber || 1)}
                      className="p-2 rounded-lg bg-[#d4af37] text-[#0b1311] hover:bg-[#e4be46] transition-all"
                      title="تشغيل"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => handleDeleteAudio(item.id)}
                      className="p-2 rounded-lg bg-[#0b1b14] text-red-400 hover:bg-red-950/40 transition-colors"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : readingMode === 'mushaf' ? (
        /* ============================================================== */
        /* MODE 1: PHYSICAL MUSHAF PAGES (1 - 604)                        */
        /* ============================================================== */
        <div className="space-y-4">
          {/* Top Page Meta Ribbon Bar */}
          <div className="px-4 py-2.5 rounded-xl bg-[#0d221a] border border-[#1c4737] flex flex-wrap items-center justify-between gap-2 text-xs text-[#c4ded3]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#d4af37]">سورة {pageMeta.surahName}</span>
              <span className="text-[#84a395]">•</span>
              <span>الجزء {pageMeta.juz}</span>
            </div>

            {isPlaying && currentTrack?.type === 'quran' && quranState && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#143427] border border-[#d4af37]/50 text-[#d4af37] text-[11px] font-medium shadow-sm animate-pulse">
                <Volume2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>
                  الآية {quranState.currentAyahNumber} ({quranState.surahName}) - {quranState.reciterName}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#d4af37] text-sm">
                صفحة {currentPageNum} / 604
              </span>
              <button
                onClick={handleToggleBookmark}
                className={`p-1.5 rounded-lg border transition-all ${
                  isCurrentBookmarked
                    ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]'
                    : 'bg-[#122e23] text-[#8fa89c] border-[#22523f] hover:text-[#d4af37]'
                }`}
                title={isCurrentBookmarked ? 'إزالة العلامة المرجعية' : 'إضافة علامة مرجعية'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Interactive Vector Mushaf Page Container with Swipe & Chevrons */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative"
          >
            <MushafInteractivePage
              pageNumber={currentPageNum}
              themeMode={themeMode}
              activeAyahNumber={activeAyahNum}
              activeSurahNumber={selectedSurahNum}
              isPlaying={isPlaying}
              ayahs={pageAyahs}
              isLoadingAyahs={isLoadingPageAyahs}
              pageZoom={pageZoom}
              onZoomChange={setPageZoom}
              onAyahClick={handleMushafAyahClick}
              onSwitchToTextMode={handleJumpFromMushafToText}
              isAutoScrollPaused={isAutoScrollPaused}
              onResumeAutoScroll={handleResumeAutoScroll}
              surahName={pageMeta.surahName}
              juzNumber={pageMeta.juz}
            />

            {/* Floating Left / Right Navigation Chevrons */}
            <button
              onClick={handlePrevPage}
              disabled={currentPageNum <= 1}
              className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#102920]/90 hover:bg-[#d4af37] text-white hover:text-[#0b1311] border border-[#d4af37]/50 shadow-2xl transition-all disabled:opacity-20 disabled:pointer-events-none z-20 cursor-pointer"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={handleNextPage}
              disabled={currentPageNum >= 604}
              className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#102920]/90 hover:bg-[#d4af37] text-white hover:text-[#0b1311] border border-[#d4af37]/50 shadow-2xl transition-all disabled:opacity-20 disabled:pointer-events-none z-20 cursor-pointer"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Bottom Slider & Navigation Row */}
          <div className="p-3 sm:p-4 rounded-xl bg-[#0e231c] border border-[#1c4737] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePrevPage}
                disabled={currentPageNum <= 1}
                className="px-3 py-1.5 rounded-lg bg-[#143328] hover:bg-[#1f4a3b] text-white font-bold transition-all disabled:opacity-30 cursor-pointer"
              >
                السابقة
              </button>
              <span className="font-mono font-bold text-[#d4af37] px-2 text-sm">{currentPageNum} / 604</span>
              <button
                onClick={handleNextPage}
                disabled={currentPageNum >= 604}
                className="px-3 py-1.5 rounded-lg bg-[#143328] hover:bg-[#1f4a3b] text-white font-bold transition-all disabled:opacity-30 cursor-pointer"
              >
                التالية
              </button>
            </div>

            <div className="w-full sm:flex-1 max-w-md flex items-center gap-2">
              <span className="text-[10px] text-[#8fa79c]">١</span>
              <input
                type="range"
                min="1"
                max="604"
                value={currentPageNum}
                onChange={(e) => handlePageChange(parseInt(e.target.value, 10))}
                className="w-full accent-[#d4af37] cursor-pointer"
              />
              <span className="text-[10px] text-[#8fa79c]">٦٠٤</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsJumpModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#143328] hover:bg-[#1e4a39] text-[#c4ded3] font-bold border border-[#235340] transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>انتقال سريع</span>
              </button>
            </div>
          </div>

          {/* Comprehensive Audio & Reciter Toolbar (Requirements 5 & 6) */}
          <div className="p-3 sm:p-4 rounded-xl bg-[#0d221a] border border-[#1d4637] flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
            {/* Reciter Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#8fa79c] shrink-0 font-medium">القارئ:</label>
              <select
                value={selectedReciter.id}
                onChange={(e) => {
                  const r = RECITERS_LIST.find((item) => item.id === e.target.value);
                  if (r) handleReciterChange(r);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#122e23] border border-[#235340] text-white text-xs font-bold focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                {RECITERS_LIST.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#0e231c] text-white">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Audio Playback Controls */}
            <div className="flex items-center gap-2">
              {/* Seek -10s */}
              <button
                onClick={() => seekRelative(-10)}
                className="p-1.5 rounded-lg bg-[#143328] hover:bg-[#1e4938] text-[#c4ded3] border border-[#235340] transition-all"
                title="ترجيع 10 ثوانٍ"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                onClick={() => {
                  if (isPlaying && currentTrack?.type === 'quran') {
                    togglePlay();
                  } else {
                    handleStartPlaySurah(selectedSurahNum, activeAyahNum);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#d4af37] text-[#0b1311] font-bold text-xs shadow hover:bg-amber-400 transition-all cursor-pointer"
              >
                {isPlaying && currentTrack?.type === 'quran' ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>تشغيل التلاوة</span>
                  </>
                )}
              </button>

              {/* Seek +10s */}
              <button
                onClick={() => seekRelative(10)}
                className="p-1.5 rounded-lg bg-[#143328] hover:bg-[#1e4938] text-[#c4ded3] border border-[#235340] transition-all"
                title="تقديم 10 ثوانٍ"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Repeat Mode & Speed Controls (Requirement 5) */}
            <div className="flex items-center gap-2">
              {/* Repeat Mode Button */}
              <button
                onClick={() => {
                  if (repeatMode === 'off') setRepeatMode('ayah');
                  else if (repeatMode === 'ayah') setRepeatMode('track');
                  else setRepeatMode('off');
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  repeatMode === 'ayah'
                    ? 'bg-[#183d2e] text-[#d4af37] border-[#d4af37]'
                    : repeatMode === 'track'
                    ? 'bg-[#16382b] text-emerald-400 border-emerald-500'
                    : 'bg-[#10241c] text-[#7f9e92] border-[#1d4334]'
                }`}
                title="تكرار الآية أو السورة"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>
                  {repeatMode === 'ayah'
                    ? 'تكرار الآية'
                    : repeatMode === 'track'
                    ? 'تكرار السورة'
                    : 'تكرار: معطل'}
                </span>
              </button>

              {/* Playback Speed Pills */}
              <div className="flex items-center rounded-lg bg-[#112a20] border border-[#234d3d] p-0.5">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                      playbackSpeed === speed
                        ? 'bg-[#d4af37] text-[#0b1311] font-bold'
                        : 'text-[#8ea89c] hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* MODE 2: TEXT VIEW (ALL 114 SURAHS & CONTINUOUS AYAHS)          */
        /* ============================================================== */
        <div className="space-y-4">
          {/* Surah Selector & Audio Reciter Row */}
          <div className="p-4 rounded-xl bg-[#0e231c] border border-[#1c4737] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#d4af37] shrink-0">اختر السورة:</label>
              <select
                value={selectedSurahNum}
                onChange={(e) => handleSurahSelect(parseInt(e.target.value, 10))}
                className="px-3 py-2 rounded-xl bg-[#122e23] border border-[#235340] text-white text-xs font-bold focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                {ALL_114_SURAHS.map((s) => (
                  <option key={s.number} value={s.number} className="bg-[#0e231c] text-white">
                    {s.number}. سورة {s.name} ({s.revelationType} - {s.numberOfAyahs} آية)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Reciter Selector */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-[#8fa79c]">القارئ:</label>
                <select
                  value={selectedReciter.id}
                  onChange={(e) => {
                    const r = RECITERS_LIST.find((item) => item.id === e.target.value);
                    if (r) handleReciterChange(r);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#122e23] border border-[#235340] text-white text-xs focus:outline-none focus:border-[#d4af37] cursor-pointer"
                >
                  {RECITERS_LIST.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#0e231c] text-white">
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Play / Pause button */}
              <button
                onClick={() => {
                  if (isPlaying && currentTrack?.type === 'quran') {
                    togglePlay();
                  } else {
                    handleStartPlaySurah(selectedSurahNum);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37] text-[#0b1311] font-bold text-xs shadow hover:bg-[#e4be46] transition-all"
              >
                {isPlaying && currentTrack?.type === 'quran' ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>تشغيل السورة كاملة</span>
                  </>
                )}
              </button>

              {/* Auto Scroll Toggle */}
              <button
                onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  autoScrollEnabled
                    ? 'bg-[#153629] text-[#d4af37] border-[#d4af37]/50'
                    : 'bg-[#10241c] text-[#7f9e92] border-[#1d4334]'
                }`}
                title="التمرير التلقائي لموضع الآية"
              >
                <span>التمرير التلقائي</span>
                <span className={`w-2 h-2 rounded-full ${autoScrollEnabled ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              </button>

              {/* Download */}
              <button
                onClick={() => handleDownload(selectedSurahNum)}
                disabled={downloadingMap[`${selectedReciter.id}_surah_${selectedSurahNum}`]}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#153629] text-[#d4af37] hover:bg-[#1e4a39] font-bold text-xs border border-[#d4af37]/30 transition-all disabled:opacity-40"
              >
                {downloadingMap[`${selectedReciter.id}_surah_${selectedSurahNum}`] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>تحميل</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShareSurah}
                className="p-2 rounded-lg bg-[#153629] text-[#8ea89c] hover:text-white transition-colors"
                title="مشاركة السورة"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Surah Detail View */}
          {isLoadingSurah ? (
            <div className="p-12 text-center rounded-2xl bg-[#0e231c] border border-[#1c4737] text-[#d4af37] space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <p className="text-sm font-bold">
                جاري تحميل آيات سورة {ALL_114_SURAHS.find((s) => s.number === selectedSurahNum)?.name}...
              </p>
            </div>
          ) : currentSurahDetail ? (
            <div
              className={`p-6 sm:p-8 rounded-2xl shadow-xl border space-y-6 ${
                themeMode === 'night'
                  ? 'bg-[#091510] border-[#1b3e31] text-[#f7ecd7]'
                  : 'bg-[#fbf7ee] border-[#dfcdab] text-[#1c1810]'
              }`}
            >
              {/* Surah Decorative Header */}
              <div className="text-center space-y-2 pb-6 border-b border-[#d4af37]/40">
                <div className="inline-block px-6 py-1.5 rounded-full border border-[#d4af37] bg-[#d4af37]/10 text-base sm:text-xl font-bold font-quran text-[#d4af37]">
                  سُورَةُ {currentSurahDetail.name}
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-[#8aa598]">
                  <span>{currentSurahDetail.revelationType}</span>
                  <span>•</span>
                  <span>{currentSurahDetail.numberOfAyahs} آيات</span>
                  <span>•</span>
                  <span>
                    تبدأ من صفحة {ALL_114_SURAHS.find((s) => s.number === currentSurahDetail.number)?.startPage}
                  </span>
                </div>
                <p className="text-xs text-[#9fb8ad] font-amiri max-w-xl mx-auto pt-1">
                  {currentSurahDetail.virtue}
                </p>
              </div>

              {/* Bismillah Header (if applicable) */}
              {currentSurahDetail.bismillahPre && (
                <div className="text-center py-4">
                  <div className="font-quran text-xl sm:text-2xl text-[#d4af37]">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                </div>
              )}

              {/* Ayahs List */}
              <div className="space-y-4">
                {currentSurahDetail.ayahs.map((ayah) => {
                  const isCurrentActive = activeAyahNum === ayah.numberInSurah;
                  const isThisAyahPlaying =
                    isPlaying &&
                    currentTrack?.type === 'quran' &&
                    quranState?.surahNumber === selectedSurahNum &&
                    quranState?.currentAyahNumber === ayah.numberInSurah;

                  return (
                    <div
                      key={ayah.numberInSurah}
                      id={`ayah-node-${ayah.numberInSurah}`}
                      onClick={() => {
                        handlePlayAyahDirect(ayah.numberInSurah);
                      }}
                      className={`p-4 rounded-xl transition-all border cursor-pointer ${
                        isCurrentActive
                          ? 'bg-[#183d2e] border-r-4 border-[#d4af37] text-white shadow-lg ring-1 ring-[#d4af37]/30'
                          : themeMode === 'night'
                          ? 'bg-[#0e231c]/60 border-[#1a3d2f] hover:border-[#d4af37]/40'
                          : 'bg-white/80 border-[#ede2cd] hover:border-[#bfa260]'
                      } flex flex-col gap-2 group`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className="font-quran leading-loose flex-1"
                          style={{ fontSize: `${textFontSize}px` }}
                        >
                          {ayah.text}
                          <span className={`inline-flex items-center justify-center w-7 h-7 mx-1.5 rounded-full border font-mono text-xs font-bold align-middle ${
                            isCurrentActive
                              ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]'
                              : 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                          }`}>
                            {ayah.numberInSurah}
                          </span>
                        </p>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Jump to Mushaf Mode for this Ayah (Requirement 7) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJumpFromTextToMushaf(selectedSurahNum, ayah.numberInSurah);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#143328]/50 hover:bg-[#d4af37] text-[#8fa89b] hover:text-[#0b1311] border border-[#204a3a] transition-all text-[11px] font-medium cursor-pointer"
                            title="عرض وتحديد هذه الآية في صفحة المصحف الشريف"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">في المصحف</span>
                          </button>

                          {/* Play / Pause this Ayah */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isThisAyahPlaying) {
                                pause();
                              } else {
                                handlePlayAyahDirect(ayah.numberInSurah);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-all ${
                              isThisAyahPlaying
                                ? 'bg-[#d4af37] text-[#0b1311] shadow'
                                : 'bg-[#143328]/30 hover:bg-[#d4af37] text-[#8fa89b] hover:text-[#0b1311]'
                            }`}
                            title={isThisAyahPlaying ? 'إيقاف مؤقت للآية' : 'تشغيل التلاوة من هذه الآية'}
                          >
                            {isThisAyahPlaying ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            )}
                          </button>

                          {/* Copy */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyAyah(ayah.text, ayah.numberInSurah);
                            }}
                            className="p-1.5 rounded-lg bg-[#143328]/30 hover:bg-[#d4af37] text-[#8fa89b] hover:text-[#0b1311] transition-all"
                            title="نسخ الآية"
                          >
                            {copiedAyah === ayah.numberInSurah ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {ayah.simpleMeaning && (
                        <p className="text-xs text-[#8aa396] font-amiri pr-2 border-r-2 border-[#d4af37]/40">
                          {ayah.simpleMeaning}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. PERSISTENT MINI PLAYER & FULL PLAYER MODAL                  */}
      {/* ============================================================== */}
      <QuranMiniPlayer
        activeReadingMode={readingMode}
        onSwitchReadingMode={handleReadingModeChange}
      />

      <QuranFullPlayerModal
        isOpen={isFullPlayerOpen}
        onClose={() => setIsFullPlayerOpen(false)}
        activeReadingMode={readingMode}
        onSwitchReadingMode={handleReadingModeChange}
      />
    </div>
  );
};
