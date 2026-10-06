import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ShieldAlert, 
  Info, 
  BookMarked,
  Layers,
  ArrowRight,
  Compass,
  Clock,
  Heart,
  RotateCcw,
  RotateCw,
  ExternalLink,
  X,
  Headphones,
  Play,
  Pause,
  Volume2,
  Gauge,
  Check,
  CheckCircle
} from 'lucide-react';
import { 
  PRAYER_LEARNING_STAGES, 
  PRAYER_RULINGS, 
  PRAYER_COMMON_MISTAKES,
  PRAYER_AUDIO_LESSONS,
  PrayerRulingItem,
  PrayerStage,
  PrayerCommonMistake,
  PrayerAudioLesson
} from '../data/prayer';
import { useAudioEngine } from '../context/AudioContext';
import { searchMatches } from '../utils/textSearch';

type PrayerSubTab = 'learn' | 'audio_teacher' | 'rulings' | 'mistakes' | 'search';

interface PrayerGuideViewProps {
  initialStage?: number;
  initialRulingId?: string;
  onNavigateToQibla?: () => void;
  onNavigateToPrayerTimes?: () => void;
}

export const PrayerGuideView: React.FC<PrayerGuideViewProps> = ({
  initialStage = 1,
  initialRulingId,
  onNavigateToQibla,
  onNavigateToPrayerTimes,
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    togglePlay,
    playPrayerLessonTrack,
    seekRelative,
    seekPercent,
    setPlaybackSpeed,
  } = useAudioEngine();

  const [activeSubTab, setActiveSubTab] = useState<PrayerSubTab>(() => {
    if (initialRulingId) {
      if (initialRulingId.startsWith('prayer-audio-lesson-')) return 'audio_teacher';
      return 'rulings';
    }
    return 'learn';
  });

  const [currentStageIndex, setCurrentStageIndex] = useState<number>(Math.max(0, Math.min(15, initialStage - 1)));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRuling, setSelectedRuling] = useState<PrayerRulingItem | null>(() => {
    if (initialRulingId) {
      return PRAYER_RULINGS.find((r) => r.id === initialRulingId) || null;
    }
    return null;
  });
  const [selectedMistakeCategory, setSelectedMistakeCategory] = useState<string>('all');

  // Audio Teacher State
  const [selectedAudioLesson, setSelectedAudioLesson] = useState<PrayerAudioLesson>(() => {
    if (initialRulingId && initialRulingId.startsWith('prayer-audio-lesson-')) {
      const found = PRAYER_AUDIO_LESSONS.find((l) => l.id === initialRulingId);
      if (found) return found;
    }
    return PRAYER_AUDIO_LESSONS[0];
  });
  const [audioLessonCategory, setAudioLessonCategory] = useState<string>('all');
  const [audioLessonSearch, setAudioLessonSearch] = useState<string>('');

  // Sync when initialRulingId changes dynamically from universal search or assistant
  React.useEffect(() => {
    if (initialRulingId) {
      if (initialRulingId.startsWith('prayer-audio-lesson-')) {
        const found = PRAYER_AUDIO_LESSONS.find((l) => l.id === initialRulingId);
        if (found) {
          setSelectedAudioLesson(found);
          setActiveSubTab('audio_teacher');
          return;
        }
      }
      const found = PRAYER_RULINGS.find((r) => r.id === initialRulingId);
      if (found) {
        setSelectedRuling(found);
        setActiveSubTab('rulings');
      } else if (initialRulingId.startsWith('stage-')) {
        const stageIdx = PRAYER_LEARNING_STAGES.findIndex((s) => s.id === initialRulingId);
        if (stageIdx !== -1) {
          setCurrentStageIndex(stageIdx);
          setActiveSubTab('learn');
        }
      } else if (initialRulingId.startsWith('mistake-')) {
        setActiveSubTab('mistakes');
      }
    }
  }, [initialRulingId]);

  const currentStage: PrayerStage = PRAYER_LEARNING_STAGES[currentStageIndex];

  // Search results for rulings
  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const words = q.split(/\s+/).filter(Boolean);

    return PRAYER_RULINGS.filter((ruling) => {
      // 1. Direct match on title, category, summary, full text, or keywords
      const directMatch =
        searchMatches(ruling.title, q) ||
        searchMatches(ruling.topicCategory, q) ||
        searchMatches(ruling.summary, q) ||
        searchMatches(ruling.fullRuling, q) ||
        ruling.keywords.some((k) => searchMatches(k, q) || searchMatches(q, k)) ||
        ruling.detailedPoints.some((p) => searchMatches(p, q));

      if (directMatch) return true;

      // 2. Multi-word tokenized search: all words in query match somewhere in the ruling document
      if (words.length > 1) {
        const fullDoc = `${ruling.title} ${ruling.topicCategory} ${ruling.summary} ${ruling.fullRuling} ${ruling.keywords.join(' ')} ${ruling.detailedPoints.join(' ')}`;
        return words.every((w) => searchMatches(fullDoc, w));
      }

      return false;
    });
  }, [searchQuery]);

  // Filtered rulings
  const filteredRulings = useMemo(() => {
    if (selectedCategory === 'all') return PRAYER_RULINGS;
    return PRAYER_RULINGS.filter((r) => r.topicCategory.includes(selectedCategory) || selectedCategory.includes(r.topicCategory));
  }, [selectedCategory]);

  // Filtered mistakes
  const filteredMistakes = useMemo(() => {
    if (selectedMistakeCategory === 'all') return PRAYER_COMMON_MISTAKES;
    return PRAYER_COMMON_MISTAKES.filter((m) => m.category === selectedMistakeCategory);
  }, [selectedMistakeCategory]);

  // Audio teacher helpers & filtered list
  const audioLessonCategories: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'جميع الدروس', count: 20 },
    { id: 'مقدمات الصلاة', label: 'مقدمات الصلاة', count: 1 },
    { id: 'أفعال الصلاة', label: 'أفعال الصلاة', count: 12 },
    { id: 'الصلوات اليومية', label: 'الصلوات اليومية', count: 5 },
    { id: 'أحكام وأخطاء', label: 'أحكام وأخطاء', count: 1 },
    { id: 'مراجعة شاملة', label: 'مراجعة شاملة', count: 1 },
  ];

  const filteredAudioLessons = useMemo(() => {
    return PRAYER_AUDIO_LESSONS.filter((lesson) => {
      const matchCat = audioLessonCategory === 'all' || lesson.category === audioLessonCategory;
      if (!matchCat) return false;
      if (!audioLessonSearch.trim()) return true;
      const q = audioLessonSearch.trim();
      return (
        searchMatches(lesson.title, q) ||
        searchMatches(lesson.shortDescription, q) ||
        searchMatches(lesson.content, q) ||
        searchMatches(lesson.audioTeacherScript, q) ||
        lesson.practicalSteps.some((s) => searchMatches(s, q))
      );
    });
  }, [audioLessonCategory, audioLessonSearch]);

  const handlePlayLesson = (lesson: PrayerAudioLesson) => {
    if (currentTrack?.id === lesson.id) {
      togglePlay();
    } else {
      setSelectedAudioLesson(lesson);
      playPrayerLessonTrack({
        id: lesson.id,
        lessonId: lesson.id,
        title: `الدرس ${lesson.order}: ${lesson.title}`,
        subtitle: `معلّم الصلاة الصوتي • فتاوى السيد السيستاني`,
        audioUrl: lesson.audioUrl,
        approxDurationSec: lesson.durationSec,
        scriptText: lesson.audioTeacherScript,
      });
    }
  };

  const handleGoToAudioLessonForStage = (stageId: string) => {
    const matched = PRAYER_AUDIO_LESSONS.find((l) => l.stageId === stageId);
    if (matched) {
      setSelectedAudioLesson(matched);
      setActiveSubTab('audio_teacher');
      handlePlayLesson(matched);
    } else {
      setActiveSubTab('audio_teacher');
    }
  };

  const handleNextLesson = () => {
    const curIdx = PRAYER_AUDIO_LESSONS.findIndex((l) => l.id === selectedAudioLesson.id);
    if (curIdx < PRAYER_AUDIO_LESSONS.length - 1) {
      const nextLesson = PRAYER_AUDIO_LESSONS[curIdx + 1];
      setSelectedAudioLesson(nextLesson);
      handlePlayLesson(nextLesson);
    }
  };

  const handlePrevLesson = () => {
    const curIdx = PRAYER_AUDIO_LESSONS.findIndex((l) => l.id === selectedAudioLesson.id);
    if (curIdx > 0) {
      const prevLesson = PRAYER_AUDIO_LESSONS[curIdx - 1];
      setSelectedAudioLesson(prevLesson);
      handlePlayLesson(prevLesson);
    }
  };

  const handleCycleLessonSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const cur = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(cur + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  const formatLessonTime = (sec: number): string => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(100, (clickX / width) * 100));
    seekPercent(percent);
  };

  const handleNextStage = () => {
    if (currentStageIndex < PRAYER_LEARNING_STAGES.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
    }
  };

  const handlePrevStage = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex((prev) => prev - 1);
    }
  };

  const rulingCategoriesList = [
    { id: 'all', label: 'كافة الأبواب (30)' },
    { id: 'شروط', label: 'شروط وأوقات الصلاة' },
    { id: 'مكان', label: 'المكان واللباس' },
    { id: 'أركان', label: 'أفعال الصلاة وأركانها' },
    { id: 'مبطلات', label: 'السنن والمبطلات' },
    { id: 'الشك', label: 'الشكوك والاحتياط والسهو' },
    { id: 'المسافر', label: 'صلاة المسافر والآيات' },
    { id: 'الجماعة', label: 'الجماعة والجمعة' },
    { id: 'النساء', label: 'أحكام النساء والمريض' },
  ];

  const mistakeCategoriesList = [
    { id: 'all', label: 'الكل' },
    { id: 'takbir', label: 'التكبيرة' },
    { id: 'recitation', label: 'القراءة' },
    { id: 'ruku', label: 'الركوع' },
    { id: 'sujud', label: 'السجود' },
    { id: 'tashahhud', label: 'التشهد' },
    { id: 'rakat_doubt', label: 'الشك بالركعات' },
    { id: 'addition_omission', label: 'الزيادة والنقصان' },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#113126] via-[#1a4435] to-[#113126] p-5 border-2 border-[#d4af37]/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37]">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span>مَوْسُوعَةُ الصَّلَاةِ وَأَحْكَامِهَا الشَّرْعِيَّةِ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-quran text-white mt-1">
            الصلاة وأحكامها
          </h2>
          <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-1 max-w-2xl leading-relaxed">
            دليل فقهي شامل وتعليم تفاعلي خطوة بخطوة للمبتدئ مع موسوعة الأحكام الفقهية الموثقة وفق فتاوى سماحة آية الله العظمى السيد علي السيستاني (دام ظله).
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2">
          {onNavigateToPrayerTimes && (
            <button
              onClick={onNavigateToPrayerTimes}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0a1c15] text-[#d4af37] border border-[#234d3d] hover:border-[#d4af37]/60 text-xs transition"
            >
              <Clock className="w-4 h-4" />
              <span>مواقيت الصلاة</span>
            </button>
          )}
          {onNavigateToQibla && (
            <button
              onClick={onNavigateToQibla}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0a1c15] text-[#d4af37] border border-[#234d3d] hover:border-[#d4af37]/60 text-xs transition"
            >
              <Compass className="w-4 h-4" />
              <span>اتجاه القبلة</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Sub Tabs Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[#234d3d] pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('learn')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'learn'
                ? 'bg-[#d4af37] text-[#0a1813] shadow-md font-bold'
                : 'bg-[#102920] text-[#bcd0c7] hover:bg-[#15362a] border border-[#234d3d]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>تعلّم الصلاة خطوة بخطوة</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-black/20">16 مرحلة</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audio_teacher')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'audio_teacher'
                ? 'bg-gradient-to-r from-[#d4af37] via-amber-400 to-[#d4af37] text-[#0a1813] shadow-md font-bold'
                : 'bg-[#102920] text-[#bcd0c7] hover:bg-[#15362a] border border-[#234d3d]'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>معلّم الصلاة الصوتي</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-black/20 font-bold">20 درساً 🎙️</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rulings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'rulings'
                ? 'bg-[#d4af37] text-[#0a1813] shadow-md font-bold'
                : 'bg-[#102920] text-[#bcd0c7] hover:bg-[#15362a] border border-[#234d3d]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>فهرس أحكام الصلاة</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-black/20">30 باباً</span>
          </button>

          <button
            onClick={() => setActiveSubTab('mistakes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'mistakes'
                ? 'bg-[#d4af37] text-[#0a1813] shadow-md font-bold'
                : 'bg-[#102920] text-[#bcd0c7] hover:bg-[#15362a] border border-[#234d3d]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>أخطاء شائعة وتحذيرات</span>
          </button>

          <button
            onClick={() => setActiveSubTab('search')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'search'
                ? 'bg-[#d4af37] text-[#0a1813] shadow-md font-bold'
                : 'bg-[#102920] text-[#bcd0c7] hover:bg-[#15362a] border border-[#234d3d]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>البحث الفقهي السريع</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* A) LEARN PRAYER (STEP-BY-STEP INTERACTIVE)                     */}
      {/* ============================================================== */}
      {activeSubTab === 'learn' && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="bg-[#0e241c] rounded-2xl p-4 border border-[#234d3d] shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs text-[#d4af37] font-bold font-mono">
                  المرحلة {currentStage.stepNumber} من 16
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-quran text-white mt-0.5">
                  {currentStage.title}
                </h3>
              </div>

              {/* Progress Bar & Jump Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9bb3a8] font-mono">
                  {Math.round(((currentStageIndex + 1) / 16) * 100)}%
                </span>
                <div className="w-32 sm:w-44 h-2.5 bg-[#081510] rounded-full overflow-hidden border border-[#234d3d]">
                  <div 
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#e6ca65] transition-all duration-300"
                    style={{ width: `${((currentStageIndex + 1) / 16) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stages Slider Dots */}
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 pt-1">
              {PRAYER_LEARNING_STAGES.map((st, idx) => (
                <button
                  key={st.id}
                  onClick={() => setCurrentStageIndex(idx)}
                  title={st.title}
                  className={`h-2 rounded transition-all ${
                    idx === currentStageIndex 
                      ? 'bg-[#d4af37] ring-2 ring-[#d4af37]/40 scale-105' 
                      : idx < currentStageIndex 
                        ? 'bg-[#3b8a6a]' 
                        : 'bg-[#183a2d]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current Stage Card */}
          <div className="bg-[#0b1f18] rounded-2xl border-2 border-[#d4af37]/40 p-5 sm:p-7 shadow-xl space-y-6">
            {/* Header info */}
            <div className="border-b border-[#1c4535] pb-4">
              <span className="text-xs text-[#d4af37] font-semibold bg-[#16382a] px-3 py-1 rounded-full border border-[#2a614a]">
                {currentStage.shortDescription}
              </span>
              <h2 className="text-2xl font-bold font-quran text-white mt-2">
                {currentStage.title}
              </h2>
            </div>

            {/* ماذا يفعل المصلي */}
            <div className="bg-[#122e23] rounded-xl p-4 border border-[#234d3d]">
              <div className="flex items-center gap-2 text-[#d4af37] text-sm font-bold mb-2">
                <Info className="w-4 h-4 text-[#d4af37]" />
                <span>ماذا يفعل المصلي في هذه المرحلة:</span>
              </div>
              <p className="text-sm sm:text-base text-[#e5ede9] leading-relaxed whitespace-pre-line font-amiri">
                {currentStage.whatToDo}
              </p>
            </div>

            {/* النص الذي يقوله إن وجد */}
            {currentStage.recitation && (
              <div className="bg-gradient-to-r from-[#0d261d] via-[#143629] to-[#0d261d] rounded-2xl p-5 border-2 border-[#d4af37]/60 shadow-lg text-center">
                <span className="inline-block text-xs font-semibold px-3 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 mb-3">
                  {currentStage.recitation.isObligatory ? 'الذكر الواجب' : 'الذكر أو الدعاء المستحب'}
                </span>
                <div className="text-xl sm:text-2xl md:text-3xl font-quran text-[#ffd700] leading-loose select-text py-2">
                  {currentStage.recitation.arabic}
                </div>
                {currentStage.recitation.meaning && (
                  <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-2 max-w-xl mx-auto">
                    {currentStage.recitation.meaning}
                  </p>
                )}
                {currentStage.recitation.repeatCount && (
                  <div className="text-xs text-[#d4af37] font-mono mt-2 bg-black/30 inline-block px-3 py-1 rounded-lg">
                    التكرار: {currentStage.recitation.repeatCount}
                  </div>
                )}
              </div>
            )}

            {/* الواجبات والمستحبات جنباً إلى جنب */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ما يجب فعله */}
              <div className="bg-[#0f281f] rounded-xl p-4 border border-[#1e4e3a]">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ما يجب فعله (الواجبات الشرعية):</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-[#cbdad3]">
                  {currentStage.obligatoryActions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ما يستحب فعله */}
              <div className="bg-[#0f281f] rounded-xl p-4 border border-[#1e4e3a]">
                <div className="flex items-center gap-2 text-[#d4af37] text-sm font-bold mb-3">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>ما يستحب فعله (السنن والآداب):</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-[#cbdad3]">
                  {currentStage.recommendedActions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-2 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* الأخطاء الشائعة في هذه المرحلة */}
            {currentStage.commonMistakes.length > 0 && (
              <div className="bg-[#241315] rounded-xl p-4 border border-rose-800/60">
                <div className="flex items-center gap-2 text-rose-300 text-sm font-bold mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>أخطاء شائعة تجنب الوقوع فيها:</span>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-rose-100">
                  {currentStage.commonMistakes.map((mis, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                      <span>{mis}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* الحكم والمصدر الفقهي */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#091712] p-3 rounded-xl border border-[#18392b] text-xs text-[#8fa79c]">
              <div className="flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-[#d4af37]" />
                <span className="font-semibold text-[#cbdad3]">المصدر الفقهي:</span>
                <span>{currentStage.rulingSource}</span>
              </div>
              {currentStage.tips && (
                <div className="text-[#e6ca65] italic">
                  💡 {currentStage.tips}
                </div>
              )}
            </div>

            {/* الربط بمعلّم الصلاة الصوتي */}
            <div className="bg-gradient-to-r from-[#102c20] via-[#143627] to-[#102c20] p-4 rounded-xl border border-[#275947] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>الاستماع لشرح هذه المرحلة في معلّم الصلاة الصوتي</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-sans">درس فقهي صوتي</span>
                  </h5>
                  <p className="text-xs text-[#9bb3a8] font-amiri mt-0.5">
                    شرح فقهي دقيق ومباشر وفق فتاوى سماحة السيد السيستاني مع النطق والبيان العملي.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleGoToAudioLessonForStage(currentStage.id)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-400 hover:from-amber-400 hover:to-[#d4af37] text-[#0a1813] font-bold text-xs flex items-center justify-center gap-2 transition shadow shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>فتح الدرس الصوتي</span>
              </button>
            </div>

            {/* Navigation Buttons (السابق / التالي) */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1c4535]">
              <button
                onClick={handlePrevStage}
                disabled={currentStageIndex === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition text-sm ${
                  currentStageIndex === 0
                    ? 'opacity-40 cursor-not-allowed bg-[#142e23] text-gray-500'
                    : 'bg-[#183a2d] hover:bg-[#204d3c] text-white border border-[#2d6650]'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
                <span>المرحلة السابقة</span>
              </button>

              <div className="text-xs text-[#9bb3a8] font-mono">
                {currentStageIndex + 1} / 16
              </div>

              <button
                onClick={handleNextStage}
                disabled={currentStageIndex === PRAYER_LEARNING_STAGES.length - 1}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition text-sm ${
                  currentStageIndex === PRAYER_LEARNING_STAGES.length - 1
                    ? 'opacity-40 cursor-not-allowed bg-[#142e23] text-gray-500'
                    : 'bg-[#d4af37] hover:bg-[#e0be47] text-[#0a1813] shadow-lg font-bold'
                }`}
              >
                <span>المرحلة التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* B) PRAYER AUDIO TEACHER (معلّم الصلاة الصوتي - 20 درساً)         */}
      {/* ============================================================== */}
      {activeSubTab === 'audio_teacher' && (
        <div className="space-y-6">
          {/* Audio Teacher Hero Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-[#0d261e] via-[#153e30] to-[#0d261e] p-5 border-2 border-[#d4af37]/70 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37]">
                  <Headphones className="w-4 h-4 text-[#d4af37]" />
                  <span>مَنْظُومَةُ التَّعْلِيمِ الصَّوْتِيِّ المُرَتَّبِ • فَتَاوَى السَّيِّدِ السِّيسْتَانِيِّ (دَامَ ظِلُّهُ)</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-quran text-white">
                  معلّم الصلاة الصوتي
                </h3>
                <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri max-w-3xl leading-relaxed">
                  نظام تعليم صوتي منظم يشرح الصلاة وأحكامها خطوة بخطوة من البداية إلى النهاية، استناداً إلى الرسائل العملية المعتمدة: المسائل المنتخبة والوجيز في أحكام العبادات لسماحة آية الله العظمى السيد علي السيستاني.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-[11px]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#081813] border border-[#275947] text-[#e0cf87]">
                    🎙️ 20 درساً صوتياً مرتباً
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#081813] border border-[#275947] text-emerald-300">
                    📚 فتاوى المسائل المنتخبة والوجيز
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#081813] border border-[#275947] text-[#cbdad3]">
                    ⚡ تحكم بالسرعة والتكرار
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#081813] border border-[#275947] text-[#cbdad3]">
                    🔊 محرك الصوت المركزي
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Selector & Search */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs">
                {audioLessonCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setAudioLessonCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-semibold flex items-center gap-1.5 ${
                      audioLessonCategory === cat.id
                        ? 'bg-[#d4af37] text-[#0a1813] shadow font-bold'
                        : 'bg-[#122a21] text-[#bcd0c7] hover:bg-[#1a3d30] border border-[#234d3d]'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search in audio lessons */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={audioLessonSearch}
                  onChange={(e) => setAudioLessonSearch(e.target.value)}
                  placeholder="ابحث في الدروس الصوتية..."
                  className="w-full bg-[#0a1b15] border border-[#234d3d] rounded-xl px-3 py-1.5 pr-8 text-xs text-white placeholder-[#7f998d] focus:outline-none focus:border-[#d4af37]"
                />
                <Search className="w-3.5 h-3.5 text-[#7f998d] absolute right-2.5 top-2.5" />
                {audioLessonSearch && (
                  <button
                    onClick={() => setAudioLessonSearch('')}
                    className="absolute left-2.5 top-2 text-[#7f998d] hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* FEATURED / ACTIVE LESSON PLAYER CARD                       */}
          {/* ========================================================== */}
          {selectedAudioLesson && (() => {
            const isLessonPlaying = currentTrack?.id === selectedAudioLesson.id && isPlaying;
            const lessonCurTime = currentTrack?.id === selectedAudioLesson.id ? currentTime : 0;
            const lessonTotalDur = currentTrack?.id === selectedAudioLesson.id
              ? (duration || selectedAudioLesson.durationSec || 60)
              : (selectedAudioLesson.durationSec || 60);
            const lessonProg = lessonTotalDur > 0 ? (lessonCurTime / lessonTotalDur) * 100 : 0;

            return (
              <div className="bg-[#0b1f18] rounded-2xl p-5 sm:p-6 border-2 border-[#d4af37]/60 shadow-xl space-y-6">
                {/* Header of Active Lesson */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b3d30] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#143226] to-[#1c4736] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] font-bold text-lg font-mono shadow">
                      {selectedAudioLesson.order}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40">
                          {selectedAudioLesson.category}
                        </span>
                        <span className="text-[11px] text-[#8fa79c] font-mono">
                          الدرس {selectedAudioLesson.order} من 20
                        </span>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-bold font-quran text-white mt-1">
                        {selectedAudioLesson.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-0.5">
                        {selectedAudioLesson.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Sistani Source Badge */}
                  <div className="text-xs text-[#d4af37] bg-[#071510] px-3.5 py-2 rounded-xl border border-[#1e4e3a] max-w-xs self-start sm:self-auto">
                    <div className="font-bold flex items-center gap-1.5">
                      <BookMarked className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>المصدر الشرعي المعتمد:</span>
                    </div>
                    <div className="text-[11px] text-[#9fc0b3] mt-0.5">
                      {selectedAudioLesson.source}
                    </div>
                  </div>
                </div>

                {/* ==================================================== */}
                {/* INTERACTIVE AUDIO PLAYER INTERFACE                   */}
                {/* ==================================================== */}
                <div className="bg-gradient-to-r from-[#0c231a] via-[#122e23] to-[#0c231a] rounded-2xl p-4 sm:p-5 border border-[#275947] shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#183d2f] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          مشغل معلّم الصلاة الصوتي
                        </span>
                        <span className="text-[11px] text-[#9fc0b3]">
                          {isLessonPlaying ? 'جاري الاستماع الآن للشرح الصوتي' : 'جاهز للاستماع، انقر زر التشغيل'}
                        </span>
                      </div>
                    </div>

                    {/* Quick navigation prev/next lesson */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={handlePrevLesson}
                        disabled={selectedAudioLesson.order === 1}
                        className={`p-1.5 rounded-lg border text-xs transition ${
                          selectedAudioLesson.order === 1
                            ? 'opacity-30 cursor-not-allowed bg-[#0d1f18] text-gray-500 border-transparent'
                            : 'bg-[#143327] hover:bg-[#1b4333] text-[#cbdad3] border-[#234d3d]'
                        }`}
                        title="الدرس السابق"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-[#cbdad3] font-mono px-2">
                        {selectedAudioLesson.order} / 20
                      </span>
                      <button
                        onClick={handleNextLesson}
                        disabled={selectedAudioLesson.order === 20}
                        className={`p-1.5 rounded-lg border text-xs transition ${
                          selectedAudioLesson.order === 20
                            ? 'opacity-30 cursor-not-allowed bg-[#0d1f18] text-gray-500 border-transparent'
                            : 'bg-[#143327] hover:bg-[#1b4333] text-[#cbdad3] border-[#234d3d]'
                        }`}
                        title="الدرس التالي"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrubber Progress Bar */}
                  <div className="space-y-1">
                    <div
                      onClick={handleScrubberClick}
                      className="relative w-full h-2.5 bg-[#091a13] rounded-full cursor-pointer overflow-hidden border border-[#1b3d30] group"
                      title="تقديم أو ترجيع الدرس"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-[#d4af37] to-amber-300 transition-all rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, lessonProg))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8fa79c] pt-0.5">
                      <span>{formatLessonTime(lessonCurTime)}</span>
                      <span>{formatLessonTime(lessonTotalDur)}</span>
                    </div>
                  </div>

                  {/* Player Controls Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    {/* Rewind / Forward Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => seekRelative(-10)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#122e23] hover:bg-[#183d2f] text-[#cbdad3] hover:text-white border border-[#234d3d] text-xs transition"
                        title="رجوع 10 ثوانٍ"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>-10ث</span>
                      </button>
                      <button
                        onClick={() => seekRelative(10)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#122e23] hover:bg-[#183d2f] text-[#cbdad3] hover:text-white border border-[#234d3d] text-xs transition"
                        title="تقديم 10 ثوانٍ"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>+10ث</span>
                      </button>
                    </div>

                    {/* Central Big Play/Pause Button */}
                    <button
                      onClick={() => handlePlayLesson(selectedAudioLesson)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all ${
                        isLessonPlaying
                          ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/30'
                          : 'bg-gradient-to-r from-[#d4af37] via-amber-400 to-[#d4af37] hover:scale-[1.02] text-[#0a1813] ring-4 ring-[#d4af37]/30'
                      }`}
                    >
                      {isLessonPlaying ? (
                        <>
                          <Pause className="w-5 h-5 fill-current" />
                          <span>إيقاف مؤقت للدرس</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-current" />
                          <span>استماع للدرس الصوتي</span>
                        </>
                      )}
                    </button>

                    {/* Speed Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCycleLessonSpeed}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#122e23] hover:bg-[#183d2f] text-[#d4af37] border border-[#234d3d] text-xs font-mono transition"
                        title="تغيير سرعة التشغيل"
                      >
                        <Gauge className="w-3.5 h-3.5" />
                        <span>{playbackSpeed}x</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ==================================================== */}
                {/* 1. TEACHER SCRIPT (نص الشرح الصوتي للمعلم)           */}
                {/* ==================================================== */}
                <div className="bg-[#091a14] rounded-2xl p-5 border border-[#1b3d30] shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#d4af37] text-sm font-bold">
                      <Volume2 className="w-4 h-4 text-[#d4af37]" />
                      <span>نص الشرح الصوتي للمعلم:</span>
                    </div>
                    <span className="text-[11px] text-[#8fa79c]">
                      استمع للشرح واقرأ النص في آنٍ واحد
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0e241c] border border-[#234d3d] text-sm sm:text-base text-[#e5ede9] font-amiri leading-loose select-text">
                    {selectedAudioLesson.audioTeacherScript}
                  </div>
                </div>

                {/* ==================================================== */}
                {/* 2. KEY RECITATION (الذكر الواجب أو المستحب)          */}
                {/* ==================================================== */}
                {selectedAudioLesson.keyRecitation && (
                  <div className="bg-gradient-to-r from-[#0d261d] via-[#143629] to-[#0d261d] rounded-2xl p-5 border-2 border-[#d4af37]/60 shadow-lg text-center space-y-3">
                    <span className="inline-block text-xs font-semibold px-3 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40">
                      {selectedAudioLesson.keyRecitation.isObligatory ? 'الذكر الواجب' : 'الذكر أو الدعاء المستحب'}
                    </span>
                    <div className="text-xl sm:text-2xl md:text-3xl font-quran text-[#ffd700] leading-loose select-text py-2">
                      {selectedAudioLesson.keyRecitation.arabic}
                    </div>
                    {selectedAudioLesson.keyRecitation.meaning && (
                      <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri max-w-xl mx-auto">
                        {selectedAudioLesson.keyRecitation.meaning}
                      </p>
                    )}
                    {selectedAudioLesson.keyRecitation.repeatCount && (
                      <div className="text-xs text-[#d4af37] font-mono bg-black/30 inline-block px-3 py-1 rounded-lg">
                        التكرار: {selectedAudioLesson.keyRecitation.repeatCount}
                      </div>
                    )}
                  </div>
                )}

                {/* ==================================================== */}
                {/* 3. PRACTICAL STEPS (خطوات التطبيق العملي)             */}
                {/* ==================================================== */}
                <div className="bg-[#0e241c] rounded-2xl p-5 border border-[#1b3d30] space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>خطوات التطبيق العملي في الصلاة:</span>
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#cbdad3]">
                    {selectedAudioLesson.practicalSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed bg-[#0a1b14] p-3 rounded-xl border border-[#18392b]">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/40">
                          {idx + 1}
                        </span>
                        <span className="text-[#e2ece7]">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ==================================================== */}
                {/* 4. RULES & ALERTS (تنبيهات وأحكام فقهية موثقة)        */}
                {/* ==================================================== */}
                {selectedAudioLesson.rulesAndAlerts && selectedAudioLesson.rulesAndAlerts.length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>تنبيهات وأحكام فقهية هامة تتعلق بهذا الدرس:</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedAudioLesson.rulesAndAlerts.map((rule, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                            rule.type === 'خطأ شائع'
                              ? 'bg-[#211113] border-rose-800/60 text-rose-100'
                              : 'bg-[#10241b] border-[#234d3d] text-[#cbdad3]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#d4af37]">{rule.type}:</span>
                            <span className="text-[10px] text-[#8fa79c]">{rule.source}</span>
                          </div>
                          <p className="leading-relaxed">{rule.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ==================================================== */}
                {/* 5. DAILY PRAYER INFO (معلومات الفريضة للدروس 14-18)   */}
                {/* ==================================================== */}
                {selectedAudioLesson.dailyPrayerInfo && (
                  <div className="bg-[#0b1c16] rounded-2xl p-4 border border-[#1b3d30] space-y-2">
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>خصائص {selectedAudioLesson.dailyPrayerInfo.name}:</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-[#0e251d] p-3 rounded-xl border border-[#234d3d]">
                        <span className="text-[#8fa79c] block text-[11px]">عدد الركعات:</span>
                        <strong className="text-[#ffd700] text-sm">
                          {selectedAudioLesson.dailyPrayerInfo.rakats} ركعات
                        </strong>
                      </div>
                      <div className="bg-[#0e251d] p-3 rounded-xl border border-[#234d3d]">
                        <span className="text-[#8fa79c] block text-[11px]">نوع القراءة:</span>
                        <strong className="text-emerald-300">
                          {selectedAudioLesson.dailyPrayerInfo.recitationType}
                        </strong>
                      </div>
                      <div className="bg-[#0e251d] p-3 rounded-xl border border-[#234d3d]">
                        <span className="text-[#8fa79c] block text-[11px]">الوقت الشرعي:</span>
                        <strong className="text-[#cbdad3]">
                          {selectedAudioLesson.dailyPrayerInfo.timing}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Navigation between lessons */}
                <div className="flex items-center justify-between pt-4 border-t border-[#1c4535]">
                  <button
                    onClick={handlePrevLesson}
                    disabled={selectedAudioLesson.order === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                      selectedAudioLesson.order === 1
                        ? 'opacity-40 cursor-not-allowed bg-[#142e23] text-gray-500'
                        : 'bg-[#183a2d] hover:bg-[#204d3c] text-white border border-[#2d6650]'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>الدرس السابق</span>
                  </button>

                  <div className="text-xs text-[#9bb3a8] font-mono">
                    الدرس {selectedAudioLesson.order} من 20
                  </div>

                  <button
                    onClick={handleNextLesson}
                    disabled={selectedAudioLesson.order === 20}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                      selectedAudioLesson.order === 20
                        ? 'opacity-40 cursor-not-allowed bg-[#142e23] text-gray-500'
                        : 'bg-[#d4af37] hover:bg-[#e0be47] text-[#0a1813] shadow font-bold'
                    }`}
                  >
                    <span>الدرس التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ========================================================== */}
          {/* ALL 20 LESSONS GRID / INDEX                                */}
          {/* ========================================================== */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#d4af37]" />
                <span>فهرس الدروس العشرين في معلّم الصلاة الصوتي:</span>
              </h4>
              <span className="text-xs text-[#8fa79c] font-mono">
                {filteredAudioLessons.length} درساً متاحاً
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAudioLessons.map((lesson) => {
                const isThisPlaying = currentTrack?.id === lesson.id && isPlaying;
                const isThisSelected = selectedAudioLesson?.id === lesson.id;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => {
                      setSelectedAudioLesson(lesson);
                      handlePlayLesson(lesson);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isThisSelected
                        ? 'bg-[#122e23] border-[#d4af37] shadow-lg ring-1 ring-[#d4af37]/40'
                        : 'bg-[#0a1a14] hover:bg-[#0f261d] border-[#1b3d30]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                            isThisPlaying
                              ? 'bg-rose-600 text-white animate-pulse'
                              : isThisSelected
                              ? 'bg-[#d4af37] text-[#0a1813]'
                              : 'bg-[#143327] text-[#cbdad3] border border-[#234d3d]'
                          }`}
                        >
                          {lesson.order}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#16382b] text-[#d4af37] border border-[#275947]">
                              {lesson.category}
                            </span>
                            {isThisPlaying && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                                جاري الاستماع
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-bold text-white mt-1">
                            {lesson.title}
                          </h5>
                          <p className="text-xs text-[#9fc0b3] font-amiri line-clamp-2 mt-0.5">
                            {lesson.shortDescription}
                          </p>
                        </div>
                      </div>

                      {/* Play Button Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayLesson(lesson);
                        }}
                        className={`p-2.5 rounded-xl border transition shadow shrink-0 ${
                          isThisPlaying
                            ? 'bg-rose-600 hover:bg-rose-500 text-white border-transparent'
                            : 'bg-[#143327] hover:bg-[#1b4333] text-[#d4af37] border-[#275947]'
                        }`}
                        title={isThisPlaying ? 'إيقاف مؤقت' : 'استماع للدرس'}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#7f998d] pt-1 border-t border-[#16382b]">
                      <span className="truncate max-w-[220px]">
                        {lesson.source.split('-')[0]}
                      </span>
                      <span className="text-[#d4af37] font-sans">
                        انقر للاستماع 🎧
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* B) RULINGS INDEX (30 TOPICS)                                   */}
      {/* ============================================================== */}
      {activeSubTab === 'rulings' && (
        <div className="space-y-6">
          {/* Categories Selector */}
          <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs">
            {rulingCategoriesList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#d4af37] text-[#0b1311] font-bold shadow'
                    : 'bg-[#122a21] text-[#bcd0c7] hover:bg-[#1a3d30] border border-[#234d3d]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Rulings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRulings.map((ruling) => (
              <div
                key={ruling.id}
                className="bg-[#0e251d] rounded-2xl p-5 border border-[#234d3d] hover:border-[#d4af37]/60 transition flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#18392c] text-[#d4af37]">
                      الباب {ruling.topicNumber}
                    </span>
                    <span className="text-xs text-[#8fa79c] truncate max-w-[200px]">
                      {ruling.topicCategory}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-quran text-white mb-2 leading-snug">
                    {ruling.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#cbdad3] line-clamp-3 leading-relaxed font-amiri mb-4">
                    {ruling.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1a4233] flex items-center justify-between text-xs">
                  <span className="text-[#8fa79c] text-2xs truncate max-w-[220px]">
                    {ruling.sourceReference}
                  </span>
                  <button
                    onClick={() => setSelectedRuling(ruling)}
                    className="flex items-center gap-1 text-[#d4af37] hover:text-[#f3cb42] font-semibold transition"
                  >
                    <span>فتح التفاصيل</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* C) OFFLINE SEARCH TAB                                          */}
      {/* ============================================================== */}
      {activeSubTab === 'search' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="bg-[#0e251d] rounded-2xl p-5 border-2 border-[#d4af37]/50 shadow-lg space-y-3">
            <label className="block text-sm font-bold text-[#d4af37]">
              البحث الفوري في أحكام ومسائل الصلاة (يعمل دون إنترنت)
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-[#8fa79c] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اكتب مسألتك مثل: نسيت السجدة، شكيت بين 3 و 4، صلاة المسافر، سجود السهو، القبلة..."
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#081510] border border-[#234d3d] text-white placeholder-[#688277] text-sm focus:outline-none focus:border-[#d4af37]"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Keyword Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
              <span className="text-[#8fa79c] self-center">أمثلة سريعة:</span>
              {[
                'نسيت السجدة',
                'شكيت بين الثالثة والرابعة',
                'صلاة المسافر',
                'سجود السهو',
                'صلاة الاحتياط',
                'القبلة',
                'الوضوء',
                'نسيان التشهد',
                'صلاة الآيات',
                'قضاء الصلاة'
              ].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-2.5 py-1 rounded-lg bg-[#143327] hover:bg-[#1a4435] text-[#d4af37] border border-[#24523f] transition"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Results Display */}
          {searchQuery.trim() === '' ? (
            <div className="text-center py-12 bg-[#0c1f18] rounded-2xl border border-[#1b3d30] p-6">
              <BookOpen className="w-12 h-12 text-[#2a5b48] mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">
                ابحث في أحكام ومسائل الصلاة
              </h4>
              <p className="text-xs sm:text-sm text-[#8fa79c] max-w-md mx-auto">
                أدخل الكلمة أو المسألة التي تبحث عنها لعرض الحكم الفقهي الموثق فوراً مع المصدر.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 bg-[#0c1f18] rounded-2xl border border-[#1b3d30] p-6">
              <AlertTriangle className="w-12 h-12 text-[#d4af37]/60 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">
                لم يتم العثور على نتائج مطابقة لـ «{searchQuery}»
              </h4>
              <p className="text-xs sm:text-sm text-[#8fa79c] max-w-md mx-auto">
                جرب البحث بكلمات أخرى أو تصفح فهرس أبواب الصلاة من تبويب «فهرس أحكام الصلاة».
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-[#d4af37] font-bold">
                تم العثور على {searchResults.length} نتيجة:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((ruling) => (
                  <div
                    key={ruling.id}
                    className="bg-[#0e251d] rounded-2xl p-5 border border-[#234d3d] hover:border-[#d4af37]/60 transition flex flex-col justify-between shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#18392c] text-[#d4af37]">
                          الباب {ruling.topicNumber}
                        </span>
                        <span className="text-xs text-[#8fa79c]">
                          {ruling.topicCategory}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-quran text-white mb-2">
                        {ruling.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#cbdad3] line-clamp-3 leading-relaxed font-amiri mb-4">
                        {ruling.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#1a4233] flex items-center justify-between text-xs">
                      <span className="text-[#8fa79c] text-2xs truncate max-w-[200px]">
                        {ruling.sourceReference}
                      </span>
                      <button
                        onClick={() => setSelectedRuling(ruling)}
                        className="flex items-center gap-1 text-[#d4af37] hover:text-[#f3cb42] font-semibold transition"
                      >
                        <span>فتح التفاصيل</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* D) COMMON MISTAKES TAB                                         */}
      {/* ============================================================== */}
      {activeSubTab === 'mistakes' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs">
            {mistakeCategoriesList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedMistakeCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  selectedMistakeCategory === cat.id
                    ? 'bg-[#d4af37] text-[#0b1311] font-bold shadow'
                    : 'bg-[#122a21] text-[#bcd0c7] hover:bg-[#1a3d30] border border-[#234d3d]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Mistakes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMistakes.map((mistake) => (
              <div
                key={mistake.id}
                className="bg-[#0e251d] rounded-2xl p-5 border border-[#2b5443] shadow-md flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#1c4032] text-[#d4af37]">
                      {mistake.categoryLabel}
                    </span>
                    <span
                      className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                        mistake.consequence === 'invalidates'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : mistake.consequence === 'requires_sujud_sahw'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {mistake.consequenceLabel}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-quran text-rose-200 mb-2">
                    ⚠️ {mistake.mistakeTitle}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#cbdad3] mb-3 leading-relaxed font-amiri">
                    {mistake.description}
                  </p>

                  <div className="bg-[#122e23] rounded-xl p-3 border border-[#234d3d]">
                    <div className="text-xs font-bold text-emerald-400 mb-1">
                      ✅ التصرف الشرعي الصحيح:
                    </div>
                    <div className="text-xs sm:text-sm text-[#e5ede9] leading-relaxed">
                      {mistake.correctAction}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1a4233] text-2xs text-[#8fa79c]">
                  المصدر: {mistake.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RULING DETAILS                                          */}
      {/* ============================================================== */}
      {selectedRuling && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedRuling(null)}
        >
          <div
            className="bg-[#0b1f18] border-2 border-[#d4af37]/60 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl relative select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#1c4535] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#18392c] text-[#d4af37]">
                    الباب {selectedRuling.topicNumber}
                  </span>
                  <span className="text-xs text-[#8fa79c]">
                    {selectedRuling.topicCategory}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-quran text-white">
                  {selectedRuling.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRuling(null)}
                className="p-1.5 rounded-lg bg-[#143328] hover:bg-[#1a4435] text-gray-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="bg-[#122e23] rounded-xl p-3.5 border border-[#234d3d] text-xs sm:text-sm text-[#d4af37] font-semibold leading-relaxed">
              💡 ملخص المسألة: {selectedRuling.summary}
            </div>

            {/* Full Ruling */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#d4af37]" />
                <span>نص الحكم الفقهي:</span>
              </h4>
              <p className="text-sm sm:text-base text-[#e5ede9] font-amiri leading-loose bg-[#071510] p-4 rounded-xl border border-[#1b3d30]">
                {selectedRuling.fullRuling}
              </p>
            </div>

            {/* Detailed Points */}
            {selectedRuling.detailedPoints.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تفاصيل وفروع المسألة:</span>
                </h4>
                <ul className="space-y-2 bg-[#0d221a] p-4 rounded-xl border border-[#1b3d30] text-xs sm:text-sm text-[#cbdad3]">
                  {selectedRuling.detailedPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-2 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source Reference */}
            <div className="bg-[#081510] p-3.5 rounded-xl border border-[#18392b] text-xs text-[#8fa79c] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#d4af37]">المصدر المعتمد: </span>
                <span className="text-[#cbdad3]">{selectedRuling.source}</span>
                <div className="text-2xs text-[#7f968c] mt-0.5">
                  {selectedRuling.sourceBook} — {selectedRuling.sourceReference}
                </div>
              </div>
              <button
                onClick={() => setSelectedRuling(null)}
                className="px-3 py-1.5 rounded-lg bg-[#143328] hover:bg-[#1a4435] text-white text-xs transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
