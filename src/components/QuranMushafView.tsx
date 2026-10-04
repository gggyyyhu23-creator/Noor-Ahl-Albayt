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
  Compass
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
  saveLastReadQuranPage, 
  getLastReadQuranPage, 
  getPreferredQuranView, 
  savePreferredQuranView,
  QuranBookmark 
} from '../utils/quranBookmarksStorage';

interface QuranMushafViewProps {
  initialPageNumber?: number;
}

export const QuranMushafView: React.FC<QuranMushafViewProps> = ({ initialPageNumber }) => {
  // Reading Mode: 'mushaf' (physical book pages 1-604) vs 'text' (continuous verse text list)
  const [readingMode, setReadingMode] = useState<'mushaf' | 'text'>(() => getPreferredQuranView());
  const [currentPageNum, setCurrentPageNum] = useState<number>(() => initialPageNumber || getLastReadQuranPage() || 1);

  useEffect(() => {
    if (initialPageNumber && initialPageNumber >= 1 && initialPageNumber <= 604) {
      setCurrentPageNum(initialPageNumber);
    }
  }, [initialPageNumber]);
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(1);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS_LIST[0]);
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

  // Audio player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Download state
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [downloadingMap, setDownloadingMap] = useState<{ [key: string]: boolean }>({});
  const [downloadedList, setDownloadedList] = useState<DownloadedAudioItem[]>(() => getDownloadedMetaList('quran'));

  // Bookmarks state
  const [bookmarksList, setBookmarksList] = useState<QuranBookmark[]>(() => getQuranBookmarks());
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  // Touch swipe handling for physical page turning
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Get current metadata for page (1-604)
  const pageMeta = getPageMetadata(currentPageNum);

  // Auto-save last read page
  useEffect(() => {
    saveLastReadQuranPage(currentPageNum);
    setImageError(false);
  }, [currentPageNum]);

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

  // Persist reading mode change
  const handleReadingModeChange = (mode: 'mushaf' | 'text') => {
    setReadingMode(mode);
    savePreferredQuranView(mode);
  };

  const refreshDownloads = () => {
    setDownloadedList(getDownloadedMetaList('quran'));
  };

  const refreshBookmarks = () => {
    setBookmarksList(getQuranBookmarks());
  };

  // Switch page (1 - 604)
  const handlePageChange = (pageNum: number) => {
    const target = Math.max(1, Math.min(604, pageNum));
    setImageError(false);
    setCurrentPageNum(target);
    const meta = getPageMetadata(target);
    setSelectedSurahNum(meta.surahNumber);
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

  const handleSurahSelect = (surahNum: number) => {
    setSelectedSurahNum(surahNum);
    const surahMeta = ALL_114_SURAHS.find((s) => s.number === surahNum);
    if (surahMeta) {
      handlePageChange(surahMeta.startPage);
    }
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

  // Audio Engine
  const handlePlayAudio = async (surahNumber: number) => {
    const audioId = `${selectedReciter.id}_surah_${surahNumber}`;
    let srcUrl: string | null = await getCachedAudioUrl(audioId);

    if (!srcUrl) {
      srcUrl = selectedReciter.sampleUrl(surahNumber);
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    if (isPlaying && audio.src === srcUrl) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.src = srcUrl;
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.warn('Audio playback error:', err);
    });

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setAudioProgress(0);
    };
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setAudioProgress(0);
  };

  // Download Surah audio
  const handleDownload = async (surahNumber: number) => {
    const surahMeta = ALL_114_SURAHS.find(s => s.number === surahNumber);
    if (!surahMeta) return;

    const audioId = `${selectedReciter.id}_surah_${surahNumber}`;
    const url = selectedReciter.sampleUrl(surahNumber);

    setDownloadingMap(prev => ({ ...prev, [audioId]: true }));
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
          setDownloadProgress(prev => ({ ...prev, [audioId]: progress }));
        }
      );
      refreshDownloads();
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setDownloadingMap(prev => ({ ...prev, [audioId]: false }));
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

  return (
    <div className="space-y-4 pb-12 select-none" dir="rtl">
      {/* Top Header Card */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[#122820] via-[#0d1e18] to-[#081510] border border-[#d4af37]/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#d4af37] via-amber-400 to-[#1b4334] p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#0a1813] rounded-[10px] flex items-center justify-center text-[#d4af37]">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-quran text-[#f6ebd7]">
                  الْقُرْآنُ الْكَرِيمُ كَامِلاً
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1b4334] text-[#d4af37] border border-[#d4af37]/30">
                  ١١٤ سورة • ٦٠٤ صفحات
                </span>
              </div>
              <p className="text-xs text-[#a2beb3] font-amiri mt-0.5">
                مصحف المدينة المنورة كامل بدون نقص، مع خياري العرض النصي وعرض صفحات المصحف الحقيقي
              </p>
            </div>
          </div>

          {/* Quick Actions: Search, Jump, Reciter, Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#143025] hover:bg-[#1d4637] text-[#d4af37] border border-[#d4af37]/40 transition-all shadow"
              title="البحث في السور والآيات"
            >
              <Search className="w-4 h-4" />
              <span>بحث في القرآن</span>
            </button>

            {/* Jump Modal Trigger */}
            <button
              onClick={() => setIsJumpModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#143025] hover:bg-[#1d4637] text-white border border-[#235340] transition-all shadow"
              title="انتقال مباشر إلى سورة أو جزء أو صفحة"
            >
              <Compass className="w-4 h-4 text-[#d4af37]" />
              <span>انتقال سريع</span>
            </button>

            {/* Mode Switch: Mushaf vs Text */}
            <div className="flex p-0.5 bg-[#0a1712] rounded-xl border border-[#235340]">
              <button
                onClick={() => handleReadingModeChange('mushaf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  readingMode === 'mushaf'
                    ? 'bg-[#d4af37] text-[#0b1311] shadow'
                    : 'text-[#92aba0] hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>صفحات المصحف</span>
              </button>
              <button
                onClick={() => handleReadingModeChange('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  readingMode === 'text'
                    ? 'bg-[#d4af37] text-[#0b1311] shadow'
                    : 'text-[#92aba0] hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>العرض النصي</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Sub-navigation: Reader, Bookmarks, Audio Downloads */}
        <div className="flex items-center justify-between border-t border-[#1b3e31] pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTabMode('reader')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tabMode === 'reader'
                  ? 'bg-[#1b4334] text-[#d4af37] border border-[#d4af37]/40'
                  : 'text-[#93afa3] hover:text-white'
              }`}
            >
              القراءة والتلاوة
            </button>
            <button
              onClick={() => setTabMode('bookmarks')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tabMode === 'bookmarks'
                  ? 'bg-[#1b4334] text-[#d4af37] border border-[#d4af37]/40'
                  : 'text-[#93afa3] hover:text-white'
              }`}
            >
              <Bookmark className="w-3 h-3" />
              <span>العلامات ({bookmarksList.length})</span>
            </button>
            <button
              onClick={() => setTabMode('downloads')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tabMode === 'downloads'
                  ? 'bg-[#1b4334] text-[#d4af37] border border-[#d4af37]/40'
                  : 'text-[#93afa3] hover:text-white'
              }`}
            >
              <HardDrive className="w-3 h-3" />
              <span>الصوتيات المحفوظة ({downloadedList.length})</span>
            </button>
          </div>

          {/* Theme & Display Options */}
          <div className="flex items-center gap-2">
            {readingMode === 'mushaf' ? (
              <div className="flex items-center gap-1 bg-[#0b1a14] px-2 py-1 rounded-lg border border-[#1b3e31] text-xs">
                <button
                  onClick={() => setPageZoom(prev => Math.max(80, prev - 10))}
                  className="p-1 hover:text-[#d4af37] transition-colors"
                  title="تصغير"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-[#d4af37] px-1">{pageZoom}%</span>
                <button
                  onClick={() => setPageZoom(prev => Math.min(180, prev + 10))}
                  className="p-1 hover:text-[#d4af37] transition-colors"
                  title="تكبير"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-[#0b1a14] px-2 py-1 rounded-lg border border-[#1b3e31] text-xs">
                <button
                  onClick={() => setTextFontSize(prev => Math.max(18, prev - 2))}
                  className="px-1.5 py-0.5 font-bold hover:text-[#d4af37]"
                >
                  أ-
                </button>
                <span className="font-mono text-[11px] text-[#d4af37]">{textFontSize}px</span>
                <button
                  onClick={() => setTextFontSize(prev => Math.min(36, prev + 2))}
                  className="px-1.5 py-0.5 font-bold hover:text-[#d4af37]"
                >
                  أ+
                </button>
              </div>
            )}

            <button
              onClick={() => setThemeMode(themeMode === 'night' ? 'parchment' : 'night')}
              className="p-1.5 rounded-lg bg-[#0b1a14] border border-[#1b3e31] text-[#d4af37] hover:bg-[#163327] transition-colors"
              title={themeMode === 'night' ? 'الوضع المضيء الورقي' : 'الوضع الليلي'}
            >
              {themeMode === 'night' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0e241c] border border-[#d4af37]/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#1b4334] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#d4af37]">
                <Search className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">البحث في القرآن الكريم</h3>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1b4334] text-[#8ea89c] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[#1b4334] bg-[#091712]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اكتب كلمة، اسم سورة، أو عبارة قرآنية (مثال: الفاتحة، الكوثر، الله نور السماوات)..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#122e23] border border-[#235340] text-white placeholder-[#789689] focus:outline-none focus:border-[#d4af37] text-sm"
                autoFocus
              />
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {isSearching ? (
                <div className="flex items-center justify-center p-8 text-[#d4af37]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="mr-2 text-sm">جاري البحث في المصحف الشريف...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedSurahNum(item.surahNumber);
                      const surah = ALL_114_SURAHS.find(s => s.number === item.surahNumber);
                      if (surah) handlePageChange(surah.startPage);
                      setIsSearchOpen(false);
                    }}
                    className="p-3 rounded-xl bg-[#122d22] border border-[#1f4b3a] hover:border-[#d4af37] cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#d4af37]">{item.surahName} (آية {item.ayahNumber})</span>
                      <span className="text-[11px] text-[#789689]">اضغط للانتقال</span>
                    </div>
                    <p className="font-quran text-sm text-[#f6ebd7] leading-relaxed line-clamp-2">
                      {item.text}
                    </p>
                  </div>
                ))
              ) : searchQuery.trim() ? (
                <div className="text-center py-8 text-[#8ea89c] text-sm">
                  لم يتم العثور على نتائج مطابقة لـ "{searchQuery}". تأكد من صحة الكلمة.
                </div>
              ) : (
                <div className="text-center py-8 text-[#8ea89c] text-sm">
                  ابحث عن أي سورة أو كلمة في القرآن الكريم للوصول المباشر.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK JUMP MODAL */}
      {isJumpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0e241c] border border-[#d4af37]/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#1b4334] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#d4af37]">
                <Compass className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">انتقال سريع في المصحف</h3>
              </div>
              <button
                onClick={() => setIsJumpModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1b4334] text-[#8ea89c] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-5">
              {/* Direct Page Jump Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#d4af37]">انتقال مباشر برقم الصفحة (من ١ إلى ٦٠٤):</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="604"
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    placeholder="رقم الصفحة (مثال: 50)"
                    className="flex-1 px-4 py-2 rounded-xl bg-[#122e23] border border-[#235340] text-white focus:outline-none focus:border-[#d4af37] text-sm"
                  />
                  <button
                    onClick={() => {
                      const p = parseInt(jumpPageInput, 10);
                      if (!isNaN(p) && p >= 1 && p <= 604) {
                        handlePageChange(p);
                        setIsJumpModalOpen(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#d4af37] text-[#0b1311] font-bold text-xs hover:bg-[#e4be46] transition-all"
                  >
                    انتقال
                  </button>
                </div>
              </div>

              {/* Jump by Juz (1 to 30) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#d4af37]">الانتقال حسب الأجزاء الثلاثين:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-1 bg-[#091712] rounded-xl border border-[#1b3e31]">
                  {JUZ_NAMES.map((j) => (
                    <button
                      key={j.juz}
                      onClick={() => {
                        handlePageChange(j.startPage);
                        setIsJumpModalOpen(false);
                      }}
                      className="p-2 text-right rounded-lg bg-[#112920] hover:bg-[#1a3f31] hover:text-[#d4af37] text-xs text-[#c6ded3] transition-all border border-transparent hover:border-[#d4af37]/30"
                    >
                      <div className="font-bold">{j.name}</div>
                      <div className="text-[10px] text-[#7fa394]">صفحة {j.startPage}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Jump by Surah (1 to 114) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#d4af37]">الانتقال حسب السور (١١٤ سورة):</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto p-1 bg-[#091712] rounded-xl border border-[#1b3e31]">
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
                        <span className="text-[9px] px-1 rounded bg-[#0b1a14] text-[#8fa79c]">{s.revelationType}</span>
                      </div>
                      <div className="text-[10px] text-[#7fa394]">ص {s.startPage} • {s.numberOfAyahs} آية</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIO PLAYER BAR (When playing) */}
      {isPlaying && (
        <div className="sticky top-2 z-30 p-3 rounded-xl bg-gradient-to-r from-[#17382c] via-[#1b4334] to-[#122d23] border border-[#d4af37] shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[#d4af37] animate-pulse" />
            <div>
              <div className="text-xs font-bold text-white">
                تلاوة سورة {currentSurahDetail?.name || pageMeta.surahName} بصوت {selectedReciter.name}
              </div>
              <div className="text-[10px] text-[#a0beae]">{selectedReciter.style}</div>
            </div>
          </div>

          <div className="flex-1 max-w-xs mx-2">
            <div className="w-full bg-[#0d221a] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#d4af37] h-full transition-all duration-300" style={{ width: `${audioProgress}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePlayAudio(selectedSurahNum)}
              className="p-2 rounded-lg bg-[#d4af37] text-[#0b1311] hover:bg-[#e4be46] transition-all"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={handleStopAudio}
              className="p-2 rounded-lg bg-[#0d221a] text-red-400 hover:bg-[#1a382c] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEW AREA BASED ON TAB MODE */}
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
                    <div className="text-xs text-[#8fa89b]">{item.subtitle} • {formatBytes(item.fileSizeBytes)}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePlayAudio(item.surahNumber || 1)}
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
        /* MODE 1: PHYSICAL MUSHAF PAGES (1 - 604) */
        <div className="space-y-3">
          {/* Page Meta Ribbon Bar */}
          <div className="px-4 py-2.5 rounded-xl bg-[#0d221a] border border-[#1c4737] flex items-center justify-between text-xs text-[#c4ded3]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#d4af37]">سورة {pageMeta.surahName}</span>
              <span className="text-[#84a395]">•</span>
              <span>الجزء {pageMeta.juz}</span>
            </div>

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

          {/* Physical Mushaf Book Frame with Page Turn */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative rounded-2xl p-2 sm:p-6 transition-all duration-300 overflow-hidden shadow-2xl border ${
              themeMode === 'night'
                ? 'bg-[#08120e] border-[#1b3f31]'
                : 'bg-[#f7f2e7] border-[#d9c7a3]'
            }`}
            style={{ minHeight: '620px' }}
          >
            {/* Ornate Gold Border for Real Mushaf look */}
            <div className={`w-full h-full rounded-xl p-2 sm:p-4 border-2 ${
              themeMode === 'night' ? 'border-[#d4af37]/30' : 'border-[#b89b58]/50'
            } relative flex flex-col items-center justify-center`}>
              
              {/* Outer Corner Ornaments */}
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#d4af37]/60 pointer-events-none" />
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#d4af37]/60 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#d4af37]/60 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#d4af37]/60 pointer-events-none" />

              {/* Mushaf Page Image Container with Zoom */}
              <div 
                className="w-full flex items-center justify-center overflow-auto transition-transform duration-200"
                style={{ transform: `scale(${pageZoom / 100})`, transformOrigin: 'top center' }}
              >
                {!imageError ? (
                  <img
                    src={getMushafPageImageUrl(currentPageNum)}
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = getMushafPageFallbackUrl(currentPageNum);
                      if (target.src !== fallback) {
                        target.src = fallback;
                      } else {
                        setImageError(true);
                      }
                    }}
                    alt={`صفحة المصحف ${currentPageNum}`}
                    className={`max-w-full h-auto object-contain rounded-lg shadow-md transition-all ${
                      themeMode === 'night' ? 'filter invert brightness-90 contrast-125 hue-rotate-180' : ''
                    }`}
                    style={{ maxHeight: '720px' }}
                    loading="eager"
                  />
                ) : (
                  /* Fallback Vector Text Renderer for Page */
                  <div className={`p-8 text-center space-y-6 ${themeMode === 'night' ? 'text-[#f5ebd7]' : 'text-[#1c1810]'}`}>
                    <div className="border-b-2 border-[#d4af37] pb-3">
                      <span className="text-xl font-bold font-quran">سورة {pageMeta.surahName}</span>
                    </div>
                    <div className="text-sm font-quran leading-loose">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </div>
                    <p className="text-xs text-[#8aa598]">
                      صفحة المصحف رقم {currentPageNum} (الجزء {pageMeta.juz})
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Page Number Badge */}
              <div className="mt-4 pt-2 border-t border-[#d4af37]/30 flex items-center justify-between w-full text-xs text-[#8ea89c]">
                <span>الجزء {pageMeta.juz}</span>
                <span className="font-mono font-bold text-[#d4af37]">« {currentPageNum} »</span>
                <span>سورة {pageMeta.surahName}</span>
              </div>
            </div>

            {/* Floating Left / Right Navigation Arrows */}
            <button
              onClick={handlePrevPage}
              disabled={currentPageNum <= 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#122e23]/80 hover:bg-[#d4af37] text-white hover:text-[#0b1311] border border-[#d4af37]/40 shadow-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <button
              onClick={handleNextPage}
              disabled={currentPageNum >= 604}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#122e23]/80 hover:bg-[#d4af37] text-white hover:text-[#0b1311] border border-[#d4af37]/40 shadow-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Slider & Page Selector */}
          <div className="p-4 rounded-xl bg-[#0e231c] border border-[#1c4737] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePrevPage}
                disabled={currentPageNum <= 1}
                className="px-3 py-1.5 rounded-lg bg-[#143328] hover:bg-[#1f4a3b] text-white font-bold transition-all disabled:opacity-30"
              >
                السابقة
              </button>
              <span className="font-mono font-bold text-[#d4af37] px-2">{currentPageNum} / 604</span>
              <button
                onClick={handleNextPage}
                disabled={currentPageNum >= 604}
                className="px-3 py-1.5 rounded-lg bg-[#143328] hover:bg-[#1f4a3b] text-white font-bold transition-all disabled:opacity-30"
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
                onClick={() => handlePlayAudio(selectedSurahNum)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37] text-[#0b1311] font-bold shadow hover:bg-[#e4be46] transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>استماع للسورة</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MODE 2: TEXT VIEW (ALL 114 SURAHS & ALL AYAHS) */
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
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-[#8fa79c]">القارئ:</label>
                <select
                  value={selectedReciter.id}
                  onChange={(e) => {
                    const r = RECITERS_LIST.find((item) => item.id === e.target.value);
                    if (r) setSelectedReciter(r);
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

              <button
                onClick={() => handlePlayAudio(selectedSurahNum)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37] text-[#0b1311] font-bold text-xs shadow hover:bg-[#e4be46] transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>تشغيل</span>
              </button>

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
                <span>تحميل للاستماع بدون نت</span>
              </button>

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
              <p className="text-sm font-bold">جاري تحميل آيات سورة {ALL_114_SURAHS.find(s => s.number === selectedSurahNum)?.name}...</p>
            </div>
          ) : currentSurahDetail ? (
            <div className={`p-6 sm:p-8 rounded-2xl shadow-xl border space-y-6 ${
              themeMode === 'night'
                ? 'bg-[#091510] border-[#1b3e31] text-[#f7ecd7]'
                : 'bg-[#fbf7ee] border-[#dfcdab] text-[#1c1810]'
            }`}>
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
                  <span>تبدأ من صفحة {ALL_114_SURAHS.find(s => s.number === currentSurahDetail.number)?.startPage}</span>
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
                {currentSurahDetail.ayahs.map((ayah) => (
                  <div
                    key={ayah.numberInSurah}
                    className={`p-4 rounded-xl transition-all border ${
                      themeMode === 'night'
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
                        <span className="inline-flex items-center justify-center w-7 h-7 mx-1.5 rounded-full border border-[#d4af37] font-mono text-xs font-bold text-[#d4af37] bg-[#d4af37]/10 align-middle">
                          {ayah.numberInSurah}
                        </span>
                      </p>

                      <button
                        onClick={() => handleCopyAyah(ayah.text, ayah.numberInSurah)}
                        className="p-1.5 rounded-lg bg-[#143328]/30 hover:bg-[#d4af37] text-[#8fa89b] hover:text-[#0b1311] transition-all shrink-0"
                        title="نسخ الآية"
                      >
                        {copiedAyah === ayah.numberInSurah ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {ayah.simpleMeaning && (
                      <p className="text-xs text-[#8aa396] font-amiri pr-2 border-r-2 border-[#d4af37]/40">
                        {ayah.simpleMeaning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
