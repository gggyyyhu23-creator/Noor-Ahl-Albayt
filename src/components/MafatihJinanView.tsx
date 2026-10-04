import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Moon, 
  Sun, 
  Star, 
  Copy, 
  Share2, 
  Check, 
  Bookmark, 
  ChevronRight, 
  ChevronLeft,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  HardDrive,
  Loader2,
  Sliders,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { MAFATIH_BOOK_ITEMS, MAFATIH_CATEGORIES, MafatihSection } from '../data/mafatihBookData';
import { MAFATIH_AUDIO_TRACKS, getTracksForItem, MafatihAudioTrack } from '../data/mafatihAudioData';
import { isFavorite, toggleFavorite, saveLastReadPosition, getLastReadPosition } from '../utils/favoritesStorage';
import { searchMatches, getSearchSnippet } from '../utils/textSearch';
import { downloadMediaAudio, getCachedAudioUrl, isAudioDownloaded, formatBytes } from '../utils/audioStorage';

interface MafatihJinanViewProps {
  initialItemId?: string;
  onNavigateToCalendar?: () => void;
}

export const MafatihJinanView: React.FC<MafatihJinanViewProps> = ({ initialItemId, onNavigateToCalendar }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    return initialItemId || getLastReadPosition()?.itemId || MAFATIH_BOOK_ITEMS[0].id;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(22); // font size in px
  const [themeMode, setThemeMode] = useState<'night' | 'parchment'>('night');
  const [copied, setCopied] = useState<boolean>(false);
  const [favUpdated, setFavUpdated] = useState<number>(0);

  // Audio player state
  const [currentTrack, setCurrentTrack] = useState<MafatihAudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0); // 0 to 100
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [downloadProgress, setDownloadProgress] = useState<{ [trackId: string]: number }>({});
  const [downloadingMap, setDownloadingMap] = useState<{ [trackId: string]: boolean }>({});
  const [downloadVersion, setDownloadVersion] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // If initialItemId changes from parent (e.g. from Calendar click)
  useEffect(() => {
    if (initialItemId) {
      setSelectedItemId(initialItemId);
      const item = MAFATIH_BOOK_ITEMS.find((it) => it.id === initialItemId);
      if (item) {
        setSelectedCategory(item.category);
      }
    }
  }, [initialItemId]);

  const currentItem: MafatihSection =
    MAFATIH_BOOK_ITEMS.find((it) => it.id === selectedItemId) || MAFATIH_BOOK_ITEMS[0];

  // Available audio tracks for current section
  const availableTracks = getTracksForItem(currentItem.id);

  // Auto-select first track when item changes if no audio currently playing
  useEffect(() => {
    if (availableTracks.length > 0) {
      if (!currentTrack || currentTrack.itemId !== currentItem.id) {
        if (!isPlaying) {
          setCurrentTrack(availableTracks[0]);
        }
      }
    } else {
      if (!isPlaying) {
        setCurrentTrack(null);
      }
    }
  }, [currentItem.id, availableTracks, isPlaying]);

  // Save last read position automatically
  useEffect(() => {
    if (currentItem) {
      saveLastReadPosition({
        sectionId: currentItem.category,
        itemId: currentItem.id,
        itemTitle: currentItem.title,
        savedAt: Date.now(),
      });
    }
  }, [currentItem]);

  // Filter items
  const filteredItems = MAFATIH_BOOK_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      searchMatches(item.title, searchQuery) ||
      searchMatches(item.arabicTitle, searchQuery) ||
      searchMatches(item.simplifiedExplanation, searchQuery) ||
      item.arabicText.some((t) => searchMatches(t, searchQuery));

    return matchesCategory && matchesSearch;
  });

  // Audio Playback Engine
  const handlePlayPause = async (trackToPlay?: MafatihAudioTrack) => {
    const track = trackToPlay || currentTrack || availableTracks[0];
    if (!track) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    // If same track and playing -> pause
    if (isPlaying && currentTrack?.id === track.id) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    // Set new track or resume
    setCurrentTrack(track);

    // Check if downloaded offline
    let srcUrl = await getCachedAudioUrl(track.id);
    if (!srcUrl) {
      srcUrl = track.audioUrl;
    }

    audio.src = srcUrl;
    audio.playbackRate = playbackSpeed;

    audio.ontimeupdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setCurrentTimeSec(audio.currentTime);
        setDurationSec(audio.duration);
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      } else {
        // Fallback approximation
        setCurrentTimeSec(audio.currentTime);
        setDurationSec(track.approxDurationSec);
        setAudioProgress(Math.min(100, (audio.currentTime / track.approxDurationSec) * 100));
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      setCurrentTimeSec(0);
    };

    audio.onerror = () => {
      console.warn('Direct stream error, playing offline synthesized voice preview');
      setIsPlaying(false);
    };

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      console.warn('Playback error', e);
      setIsPlaying(false);
    }
  };

  const handleSeek = (percent: number) => {
    if (audioRef.current && (audioRef.current.duration || currentTrack?.approxDurationSec)) {
      const dur = audioRef.current.duration || currentTrack!.approxDurationSec;
      audioRef.current.currentTime = (percent / 100) * dur;
      setAudioProgress(percent);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
    }
  };

  const handleSpeedToggle = () => {
    const speeds = [1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // Download track for offline listening
  const handleDownloadTrack = async (track: MafatihAudioTrack) => {
    setDownloadingMap((prev) => ({ ...prev, [track.id]: true }));
    setDownloadProgress((prev) => ({ ...prev, [track.id]: 0 }));

    try {
      await downloadMediaAudio(
        track.audioUrl,
        {
          id: track.id,
          type: 'mafatih',
          title: track.title,
          subtitle: track.reciterName,
          reciterId: track.reciterId,
          reciterName: track.reciterName,
        },
        (percent) => {
          setDownloadProgress((prev) => ({ ...prev, [track.id]: percent }));
        }
      );
      setDownloadVersion((v) => v + 1);
    } catch (err: any) {
      console.error('Download failed', err);
    } finally {
      setDownloadingMap((prev) => ({ ...prev, [track.id]: false }));
    }
  };

  const handleCopy = () => {
    const textToCopy = `${currentItem.arabicTitle}\n\n${currentItem.arabicText.join('\n\n')}\n\n[المصدر: ${currentItem.source} - كتاب مفاتيح الجنان]`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const textToShare = `${currentItem.arabicTitle}\n\n${currentItem.arabicText.slice(0, 3).join('\n\n')}...\n\n[من تطبيق نور العترة - مفاتيح الجنان]`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentItem.title,
          text: textToShare,
        });
      } catch (e) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleToggleFav = () => {
    toggleFavorite({
      id: currentItem.id,
      type: 'mafatih',
      title: currentItem.title,
      subtitle: currentItem.categoryLabel,
      snippet: currentItem.simplifiedExplanation,
      targetTab: 'mafatih',
      targetId: currentItem.id,
    });
    setFavUpdated((prev) => prev + 1);
  };

  const isCurrentFav = isFavorite(currentItem.id);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner & Title */}
      <div className="rounded-2xl bg-gradient-to-r from-[#113126] via-[#1a4435] to-[#113126] p-5 border-2 border-[#d4af37]/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37]">
            <BookOpen className="w-4 h-4 text-[#d4af37]" />
            <span>كِتَابُ مَفَاتِيحِ الْجِنَانِ لِلشَّيْخِ عَبَّاسِ الْقُمِّيِّ (طَابَ ثَرَاهُ)</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold font-quran text-[#f7ecd6] mt-1">
            مفاتيح الجنان الكامل
          </h2>
          <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-0.5">
            النسخة المصدر الشاملة: جميع الأدعية والزيارات التامة، أعمال الشهور والأيام، التعقيبات، والصلوات المستحبة.
          </p>
        </div>

        {/* Global Reader Controls: Font Resizer, Night Mode */}
        <div className="flex items-center gap-2 bg-[#0c221a] p-1.5 rounded-xl border border-[#234d3d] text-xs">
          {/* Font Resizer */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize(Math.max(16, fontSize - 2))}
              className="w-7 h-7 rounded-lg bg-[#142e23] hover:bg-[#1c3e30] text-white flex items-center justify-center font-bold text-xs"
              title="تصغير الخط"
            >
              A-
            </button>
            <span className="font-mono text-xs text-[#a2beb3] px-1">{fontSize}</span>
            <button
              onClick={() => setFontSize(Math.min(40, fontSize + 2))}
              className="w-7 h-7 rounded-lg bg-[#142e23] hover:bg-[#1c3e30] text-white flex items-center justify-center font-bold text-xs"
              title="تكبير الخط"
            >
              A+
            </button>
          </div>

          <div className="h-4 w-px bg-[#234d3d]" />

          {/* Theme Switcher */}
          <button
            onClick={() => setThemeMode(themeMode === 'night' ? 'parchment' : 'night')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#142e23] hover:bg-[#1c3e30] text-[#d4af37] font-semibold"
            title="تبديل الوضع الليلي والورقي"
          >
            {themeMode === 'night' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span>{themeMode === 'night' ? 'ليلي' : 'ورقي'}</span>
          </button>
        </div>
      </div>

      {/* Categories Bar & Search Filter */}
      <div className="rounded-xl bg-[#0f241d] p-3 border border-[#1f4a3b] space-y-3">
        {/* Full-text Search within Mafatih */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#a2beb3] absolute top-3 right-3" />
          <input
            type="text"
            placeholder="ابحث في كامل نصوص وأبواب وأدعية مفاتيح الجنان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a1813] border border-[#234d3d] rounded-xl pr-9 pl-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#7f9e92] outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs">
          {MAFATIH_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-semibold ${
                selectedCategory === cat.id
                  ? 'bg-[#d4af37] text-[#0b1311] shadow'
                  : 'bg-[#152e24] text-[#bcd0c7] hover:bg-[#1c3e30] border border-[#234d3d]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column View: Book Index & Active Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chapters / Topics Index */}
        <div className="lg:col-span-4 space-y-2 max-h-[720px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs text-[#a2beb3] px-1 mb-1 font-semibold">
            <span>فهرس الأبواب والأعمال ({filteredItems.length}):</span>
            {getLastReadPosition() && (
              <span className="text-[10px] text-[#d4af37] bg-[#142e23] px-2 py-0.5 rounded-md border border-[#234d3d]">
                آخر قراءة محفوظة
              </span>
            )}
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-[#091712] border border-[#1a3d30] text-xs text-[#8fa79c]">
              لا توجد أبواب مطابقة لكلمات البحث.
            </div>
          ) : (
            filteredItems.map((item) => {
              const hasAudio = getTracksForItem(item.id).length > 0;
              const isSelected = selectedItemId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#183f32] border-[#d4af37] ring-1 ring-[#d4af37] shadow-lg'
                      : 'bg-[#0e231c] border-[#1d4436] hover:bg-[#143228] text-[#cbdad3]'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10271f] text-[#d4af37] border border-[#234d3d]">
                        {item.categoryLabel}
                      </span>
                      {hasAudio && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 flex items-center gap-1 border border-amber-500/30">
                          <Volume2 className="w-2.5 h-2.5" /> تسجيل صوتي
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white truncate pt-1">{item.title}</h4>
                    <p className="text-[11px] text-[#8fa79c] truncate font-amiri">
                      {item.simplifiedExplanation}
                    </p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-[#a2beb3] shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Full Reader Canvas & Audio Player */}
        <div className="lg:col-span-8 space-y-4">
          {/* Section Audio Player Banner (if tracks available) */}
          {availableTracks.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-[#123126] via-[#1a4435] to-[#123126] p-4 border border-[#d4af37]/50 shadow-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      الاستماع الصوتي المأثور ({availableTracks.length} قراء)
                    </h4>
                    <p className="text-[11px] text-[#a2beb3]">
                      اختر صوت القارئ المفضل واستمع للتسجيل أثناء متابعة النص.
                    </p>
                  </div>
                </div>

                {/* Reciter selector */}
                <select
                  value={currentTrack?.id || availableTracks[0].id}
                  onChange={(e) => {
                    const tr = availableTracks.find((t) => t.id === e.target.value);
                    if (tr) {
                      handlePlayPause(tr);
                    }
                  }}
                  className="bg-[#0b1e17] text-white border border-[#2b5947] text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-[#d4af37]"
                >
                  {availableTracks.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.reciterName} ({tr.durationLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Main Player Controls Bar */}
              {currentTrack && (
                <div className="rounded-xl bg-[#0a1813] p-3 border border-[#234d3d] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* -10s button */}
                    <button
                      onClick={() => handleSkip(-10)}
                      className="p-1.5 rounded-lg bg-[#142e23] hover:bg-[#1e4535] text-[#bcd0c7] hover:text-white"
                      title="تأخير 10 ثوانٍ"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Play/Pause Button */}
                    <button
                      onClick={() => handlePlayPause()}
                      className="w-10 h-10 rounded-full bg-[#d4af37] text-[#0b1311] hover:bg-[#e4be46] flex items-center justify-center shadow-lg transition-transform active:scale-95"
                      title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الاستماع'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current mr-0.5" />}
                    </button>

                    {/* +10s button */}
                    <button
                      onClick={() => handleSkip(10)}
                      className="p-1.5 rounded-lg bg-[#142e23] hover:bg-[#1e4535] text-[#bcd0c7] hover:text-white"
                      title="تقديم 10 ثوانٍ"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    <div className="text-xs">
                      <div className="font-bold text-white">{currentTrack.reciterName}</div>
                      <div className="text-[10px] text-[#8fa79c] font-mono">
                        {formatTime(currentTimeSec)} / {currentTrack.durationLabel}
                      </div>
                    </div>
                  </div>

                  {/* Playback Progress Slider */}
                  <div className="flex-1 max-w-xs min-w-[120px] flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={audioProgress}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#1b3d30] rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                    />
                  </div>

                  {/* Speed & Download Button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSpeedToggle}
                      className="px-2 py-1 rounded-lg bg-[#142e23] hover:bg-[#1e4535] text-white text-[11px] font-mono font-bold border border-[#234d3d]"
                      title="سرعة التشغيل"
                    >
                      {playbackSpeed}x
                    </button>

                    {/* Download offline button */}
                    {isAudioDownloaded(currentTrack.id) ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> بدون إنترنت
                      </span>
                    ) : downloadingMap[currentTrack.id] ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#142e23] border border-[#d4af37] text-[11px] text-[#d4af37]">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{downloadProgress[currentTrack.id] || 0}%</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownloadTrack(currentTrack)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#16382b] hover:bg-[#1e4c3b] text-white border border-[#2b5947] text-[11px] font-semibold transition-all"
                        title="تنزيل الملف الصوتي للاستماع بدون اتصال بالإنترنت"
                      >
                        <Download className="w-3 h-3 text-[#d4af37]" />
                        <span>تنزيل</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reader Canvas Card */}
          <div
            className={`rounded-3xl p-6 sm:p-9 transition-all duration-300 shadow-2xl border-4 ${
              themeMode === 'parchment'
                ? 'bg-[#fcf8ec] text-[#1b1915] border-[#d4af37]'
                : 'bg-[#091712] text-[#f2eee3] border-[#22503f]'
            }`}
          >
            {/* Header Action Bar: Badge, Last Read, Fav, Copy, Share */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b ${
                themeMode === 'parchment' ? 'border-[#b88e3c]/40' : 'border-[#1b3e31]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    themeMode === 'parchment'
                      ? 'bg-[#ebdcb9] text-[#6d5118] border-[#b88e3c]/50'
                      : 'bg-[#142e23] text-[#d4af37] border-[#255241]'
                  }`}
                >
                  {currentItem.categoryLabel}
                </span>

                <span className="text-[11px] text-[#8fa79c]">
                  آخر موضع قراءة محفوظ تلقائياً
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleFav}
                  className={`p-2 rounded-lg border transition-all ${
                    isCurrentFav
                      ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]'
                      : 'bg-[#122a21] text-[#a2beb3] border-[#234d3d] hover:text-white'
                  }`}
                  title={isCurrentFav ? 'محفوظ في المفضلة' : 'إضافة إلى المفضلة'}
                >
                  <Star className={`w-4 h-4 ${isCurrentFav ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-[#122a21] text-[#a2beb3] border border-[#234d3d] hover:text-[#d4af37] transition-all"
                  title="نسخ النص كاملاً"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleShare}
                  className="p-2 rounded-lg bg-[#122a21] text-[#a2beb3] border border-[#234d3d] hover:text-[#d4af37] transition-all"
                  title="مشاركة النص"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title & Authentic Source Information */}
            <div className="text-center my-6 space-y-2">
              <h3
                className={`font-quran text-2xl sm:text-3xl font-bold ${
                  themeMode === 'parchment' ? 'text-[#47340e]' : 'text-[#f7ecd6]'
                }`}
              >
                {currentItem.arabicTitle}
              </h3>
              <p
                className={`text-xs sm:text-sm font-amiri ${
                  themeMode === 'parchment' ? 'text-[#75591c]' : 'text-[#9cb5a9]'
                }`}
              >
                المصدر المعتمد: {currentItem.source}
              </p>
            </div>

            {/* Virtue & Merit Callout */}
            <div
              className={`p-4 rounded-2xl mb-6 text-xs sm:text-sm leading-relaxed border ${
                themeMode === 'parchment'
                  ? 'bg-[#f4ebd0] border-[#d8be7c] text-[#4f3910]'
                  : 'bg-[#0f241d] border-[#204a3c] text-[#c7d9d0]'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-[#d4af37] mb-1">
                <Sparkles className="w-4 h-4" />
                <span>فضل العمل وثوابه المأثور:</span>
              </div>
              <p className="font-amiri">{currentItem.virtue}</p>
              {currentItem.instructions && (
                <p className="mt-2 text-[11px] opacity-90 border-t border-[#d4af37]/20 pt-1.5">
                  <span className="font-bold">طريقة العمل:</span> {currentItem.instructions}
                </p>
              )}
            </div>

            {/* Complete Arabic Text with authentic formatting and customizable font size */}
            <div
              className="space-y-4 font-amiri leading-loose text-justify px-1 sm:px-4"
              style={{ fontSize: `${fontSize}px`, lineHeight: '2.5rem' }}
              dir="rtl"
            >
              {currentItem.arabicText.map((paragraph, pIdx) => (
                <p
                  key={pIdx}
                  className={`tracking-wide ${
                    themeMode === 'parchment' ? 'text-[#1d1b17]' : 'text-[#f2eee3]'
                  }`}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Explanation & Theological Context Footer */}
            <div
              className={`mt-10 pt-5 border-t text-xs sm:text-sm font-amiri ${
                themeMode === 'parchment' ? 'border-[#b88e3c]/30 text-[#634b17]' : 'border-[#1b3e31] text-[#90a89d]'
              }`}
            >
              <div className="font-bold text-[#d4af37] mb-1">مضامين وشرح مختصر:</div>
              <p className="leading-relaxed">{currentItem.simplifiedExplanation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
