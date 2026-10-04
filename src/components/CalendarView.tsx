import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Star, 
  BookOpen, 
  Grid, 
  List, 
  ArrowLeft,
  Flame,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Bell,
  BellOff,
  Info,
  Clock,
  ExternalLink,
  Heart
} from 'lucide-react';
import { 
  SHIA_OCCASIONS, 
  HIJRI_MONTH_NAMES, 
  WEEK_DAYS_DEEDS,
  WeekDayDeed,
  getHijriDate 
} from '../data/calendarOccasions';
import { OccasionItem } from '../types';
import { isFavorite, toggleFavorite } from '../utils/favoritesStorage';
import { getTracksForItem, MafatihAudioTrack } from '../data/mafatihAudioData';
import { 
  isOccasionNotificationSupported, 
  isOccasionReminderEnabled, 
  setOccasionReminderEnabled, 
  requestNotificationPermission,
  sendOccasionNotification 
} from '../utils/occasionNotification';

interface CalendarViewProps {
  onGoToMafatih?: (itemId: string) => void;
  initialOccasionId?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  onGoToMafatih,
  initialOccasionId 
}) => {
  // Calendar view mode: 'detailed' (current original view) or 'monthly' (new grid)
  const [viewMode, setViewMode] = useState<'detailed' | 'monthly'>('detailed');

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [hijriAdjustment, setHijriAdjustment] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('shia_hijri_adjustment') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [selectedOccasionType, setSelectedOccasionType] = useState<string>('all');

  // Occasion Details Modal state
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionItem | null>(() => {
    if (initialOccasionId) {
      return SHIA_OCCASIONS.find((o) => o.id === initialOccasionId) || null;
    }
    return null;
  });

  // Weekday deed tab switcher (default to current day's weekday index)
  const currentDayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const [activeWeekDayTab, setActiveWeekDayTab] = useState<number>(currentDayOfWeek);

  // Sync active weekday tab when currentDate changes
  useEffect(() => {
    setActiveWeekDayTab(currentDate.getDay());
  }, [currentDate]);

  // Audio playback state
  const [activeAudioTrack, setActiveAudioTrack] = useState<MafatihAudioTrack | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Notifications reminder state
  const [isReminderActive, setIsReminderActive] = useState<boolean>(() => isOccasionReminderEnabled());

  // Favorites trigger state (to force re-render when favorited)
  const [favVersion, setFavVersion] = useState<number>(0);

  const today = new Date();
  const todayHijri = getHijriDate(today, hijriAdjustment);
  const currentHijri = getHijriDate(currentDate, hijriAdjustment);

  // Deep link sync if initialOccasionId prop changes
  useEffect(() => {
    if (initialOccasionId) {
      const found = SHIA_OCCASIONS.find((o) => o.id === initialOccasionId);
      if (found) {
        setSelectedOccasion(found);
      }
    }
  }, [initialOccasionId]);

  // Handle audio stop on modal close or unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleToggleAudio = (track: MafatihAudioTrack) => {
    if (activeAudioTrack?.id === track.id) {
      if (isPlayingAudio) {
        audioRef.current?.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current?.play();
        setIsPlayingAudio(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActiveAudioTrack(track);
      setIsPlayingAudio(true);
      const audio = new Audio(track.audioUrl);
      audioRef.current = audio;
      audio.play().catch(() => setIsPlayingAudio(false));
      audio.onended = () => setIsPlayingAudio(false);
    }
  };

  const handlePrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAdjustmentChange = (delta: number) => {
    setHijriAdjustment(delta);
    try {
      localStorage.setItem('shia_hijri_adjustment', delta.toString());
    } catch {}
  };

  const handleToggleReminder = async () => {
    if (!isReminderActive) {
      const granted = await requestNotificationPermission();
      if (granted || !isOccasionNotificationSupported()) {
        setOccasionReminderEnabled(true);
        setIsReminderActive(true);
        if (occasionsToday.length > 0) {
          sendOccasionNotification(
            `مناسبة اليوم: ${occasionsToday[0].title}`,
            occasionsToday[0].description
          );
        }
      }
    } else {
      setOccasionReminderEnabled(false);
      setIsReminderActive(false);
    }
  };

  const handleToggleOccasionFavorite = (occ: OccasionItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleFavorite({
      id: `occ-${occ.id}`,
      type: 'occasion',
      title: occ.title,
      subtitle: `${occ.day} من شهر ${HIJRI_MONTH_NAMES[occ.month - 1]} • ${occ.figure}`,
      snippet: occ.description,
      targetTab: 'calendar',
      targetId: occ.id,
    });
    setFavVersion((v) => v + 1);
  };

  const handleToggleDeedFavorite = (deedTitle: string, deedDesc: string, mafatihId?: string) => {
    toggleFavorite({
      id: `deed-${deedTitle}`,
      type: 'work',
      title: deedTitle,
      subtitle: `أعمال يومية • ${currentHijri.day} ${currentHijri.monthName}`,
      snippet: deedDesc,
      targetTab: 'mafatih',
      targetId: mafatihId,
    });
    setFavVersion((v) => v + 1);
  };

  // Occasions in this month
  const occasionsThisMonth = SHIA_OCCASIONS.filter(
    (occ) => occ.month === currentHijri.month
  );

  // Occasions on selected day
  const occasionsToday = occasionsThisMonth.filter(
    (occ) => occ.day === currentHijri.day
  );

  // Filtered list by type
  const filteredMonthOccasions = occasionsThisMonth.filter((occ) => {
    if (selectedOccasionType === 'all') return true;
    return occ.type === selectedOccasionType;
  });

  // Arabic Gregorian formatters
  const gregorianFormatted = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  const todayGregorianFormatted = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(today);

  // Active weekday deeds object
  const activeWeekDayDeed: WeekDayDeed = 
    WEEK_DAYS_DEEDS.find((w) => w.dayIndex === activeWeekDayTab) || WEEK_DAYS_DEEDS[0];

  // Helper to get Deeds & Mafatih links for selected day
  const getDailyDeedsInfo = () => {
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 5 is Friday, 4 is Thursday
    const isFriday = dayOfWeek === 5;
    const isThursday = dayOfWeek === 4;

    const deedsList: {
      id: string;
      title: string;
      desc: string;
      mafatihId?: string;
      isHighlighted?: boolean;
    }[] = [];

    // Friday specific deeds
    if (isFriday) {
      deedsList.push({
        id: 'deed-friday-main',
        title: 'أعمال يوم الجمعة الشريفة وغسل الجمعة',
        desc: 'غسل الجمعة، الصلاة على محمد وآل محمد ألف مرة، قراءة دعاء الندبة صباحاً، وزيارة الإمام الحسين (ع).',
        mafatihId: 'mafatih-day-friday',
        isHighlighted: true,
      });
      deedsList.push({
        id: 'deed-friday-nudba',
        title: 'دعاء الندبة لصاحب الزمان (عج)',
        desc: 'يُستحب قراءته في صبيحة يوم الجمعة والأعياد الأربعة شوقاً لظهور قائم آل محمد.',
        mafatihId: 'mafatih-day-friday',
        isHighlighted: true,
      });
      deedsList.push({
        id: 'deed-friday-simat',
        title: 'دعاء السمات قبيل غروب شمس الجمعة',
        desc: 'يُدعى به في الساعة الأخيرة من نهار الجمعة لكفاية شر الأعداء وقضاء الحوائج العظيمة.',
        mafatihId: 'mafatih-simat',
        isHighlighted: true,
      });
    }

    // Thursday / Thursday Night specific deeds
    if (isThursday) {
      deedsList.push({
        id: 'deed-thursday-night',
        title: 'أعمال ليلة الجمعة المباركة',
        desc: 'قراءة دعاء كميل بن زياد، وزيارة وارث لسيد الشهداء (ع)، والاستغفار للأموات، وتلاوة سورة يس والواقعة والجمعة.',
        mafatihId: 'mafatih-kumayl',
        isHighlighted: true,
      });
      deedsList.push({
        id: 'deed-thursday-kumayl',
        title: 'دعاء كميل بن زياد النخعي',
        desc: 'الدعاء التوحيدي العظيم المأثور عن أمير المؤمنين (ع) لغفران الذنوب وتوسعة الرزق ودفع البلاء.',
        mafatihId: 'mafatih-kumayl',
        isHighlighted: true,
      });
    }

    // Occasions deeds mapping
    occasionsToday.forEach((occ) => {
      if (occ.recommendedDeeds && occ.recommendedDeeds.length > 0) {
        deedsList.push({
          id: `deed-occ-${occ.id}`,
          title: `أعمال مناسبة: ${occ.title}`,
          desc: occ.recommendedDeeds.join(' • '),
          mafatihId: occ.mafatihId,
          isHighlighted: true,
        });
      } else if (occ.mafatihId) {
        deedsList.push({
          id: `deed-occ-linked-${occ.id}`,
          title: `أعمال وذكرى: ${occ.title}`,
          desc: `${occ.description} • يُستحب فيه زيارة ${occ.figure} والأدعية المأثورة.`,
          mafatihId: occ.mafatihId,
          isHighlighted: true,
        });
      }
    });

    // General Weekday Deed for today
    const todayWeekDayObj = WEEK_DAYS_DEEDS.find((w) => w.dayIndex === dayOfWeek);
    if (todayWeekDayObj) {
      deedsList.push({
        id: `deed-weekday-${todayWeekDayObj.dayIndex}`,
        title: `${todayWeekDayObj.duaTitle} (${todayWeekDayObj.attributedFigure})`,
        desc: `التسبيح: ${todayWeekDayObj.tasbeeh} • ${todayWeekDayObj.ziyaratTitle}.`,
        mafatihId: todayWeekDayObj.mafatihId,
      });
    }

    // Default daily taqibat if none
    deedsList.push({
      id: 'deed-taqibat-general',
      title: 'التعقيبات العامة وتسبيح فاطمة الزهراء (ع)',
      desc: 'التكبير ثلاثاً، تسبيح الزهراء (34 الله أكبر، 33 الحمد لله، 33 سبحان الله)، آية الكرسي، والتوحيد.',
      mafatihId: 'mafatih-taqibat-general',
    });

    return deedsList;
  };

  const dailyDeeds = getDailyDeedsInfo();

  // Generate days array for current Gregorian Month for Monthly Grid
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateFirst = new Date(year, month, 1);
    const dateLast = new Date(year, month + 1, 0);

    const firstDayIndex = dateFirst.getDay(); // 0 is Sunday, 6 is Saturday
    const arabicFirstDay = (firstDayIndex + 1) % 7;

    const daysCount = dateLast.getDate();
    const days: {
      gregorianDay: number;
      date: Date;
      hijri: { day: number; month: number; monthName: string; year: number };
      isToday: boolean;
      isSelected: boolean;
      occasion?: OccasionItem;
    }[] = [];

    for (let i = 1; i <= daysCount; i++) {
      const dayDate = new Date(year, month, i);
      const dayHijri = getHijriDate(dayDate, hijriAdjustment);
      const isDayToday =
        dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getFullYear() === today.getFullYear();
      const isDaySelected =
        dayDate.getDate() === currentDate.getDate() &&
        dayDate.getMonth() === currentDate.getMonth() &&
        dayDate.getFullYear() === currentDate.getFullYear();

      const occ = SHIA_OCCASIONS.find(
        (o) => o.month === dayHijri.month && o.day === dayHijri.day
      );

      days.push({
        gregorianDay: i,
        date: dayDate,
        hijri: dayHijri,
        isToday: isDayToday,
        isSelected: isDaySelected,
        occasion: occ,
      });
    }

    return { paddingDays: arabicFirstDay, days };
  };

  const monthGridData = getDaysInMonth();
  const weekDayHeaders = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Audio tracks for the selected modal occasion
  const modalAudioTracks = selectedOccasion?.mafatihId 
    ? getTracksForItem(selectedOccasion.mafatihId) 
    : [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Prominent Today Card */}
      <div className="rounded-2xl bg-gradient-to-r from-[#14352b] via-[#1c4d3e] to-[#123127] p-5 sm:p-6 border-2 border-[#d4af37]/60 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-right space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-[#d4af37]">
              <CalendarIcon className="w-4 h-4 text-[#d4af37]" />
              <span>تَارِيخُ الْيَوْمِ الْمُبَارَكِ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-quran text-[#f4edd9]">
              {todayHijri.day} {todayHijri.monthName} {todayHijri.year} هـ
            </h2>
            <div className="text-xs sm:text-sm text-[#bcd4cb] font-amiri">
              الموافق: {todayGregorianFormatted}
            </div>
          </div>

          {/* Right Controls: View Switcher (Detailed vs Monthly) & Hijri Adjustment & Notification */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            {/* View Mode Toggle Button */}
            <div className="flex items-center gap-1 bg-[#0e241c] p-1 rounded-xl border border-[#234d3d]">
              <button
                onClick={() => setViewMode('detailed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'detailed'
                    ? 'bg-[#d4af37] text-[#0b1311] shadow'
                    : 'text-[#a2beb3] hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>العرض التفصيلي</span>
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'monthly'
                    ? 'bg-[#d4af37] text-[#0b1311] shadow'
                    : 'text-[#a2beb3] hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>العرض الشهري (شبكة)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Reminder toggle */}
              <button
                onClick={handleToggleReminder}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  isReminderActive
                    ? 'bg-amber-500/20 text-[#d4af37] border-[#d4af37]/60'
                    : 'bg-[#0e241c] text-[#8fa79c] border-[#234d3d] hover:text-white'
                }`}
                title="تفعيل/تعطيل التذكير بالمناسبات"
              >
                {isReminderActive ? <Bell className="w-3.5 h-3.5 text-[#d4af37]" /> : <BellOff className="w-3.5 h-3.5" />}
                <span>{isReminderActive ? 'التذكير مفعّل' : 'تفعيل التذكير'}</span>
              </button>

              {/* Hijri Adjustment selector (for moon sighting differences) */}
              <div className="flex items-center gap-1.5 bg-[#0e241c] px-2.5 py-1 rounded-lg border border-[#234d3d] text-[11px] text-[#9db7ad]">
                <span>ضبط الهلال:</span>
                <div className="flex items-center gap-1 text-xs">
                  {[-2, -1, 0, 1, 2].map((adj) => (
                    <button
                      key={adj}
                      onClick={() => handleAdjustmentChange(adj)}
                      className={`px-1.5 py-0.5 rounded font-mono transition-all ${
                        hijriAdjustment === adj
                          ? 'bg-[#d4af37] text-[#0b1311] font-bold'
                          : 'bg-[#18392d] text-[#c0d4cb] hover:bg-[#20493a]'
                      }`}
                    >
                      {adj > 0 ? `+${adj}` : adj}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MONTHLY GRID VIEW (When selected) */}
      {viewMode === 'monthly' && (
        <div className="rounded-2xl bg-[#0e231c] border-2 border-[#d4af37]/40 p-4 sm:p-6 shadow-2xl space-y-4">
          {/* Header of month navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#143126] text-white hover:bg-[#1a3f32] text-xs font-bold border border-[#255241]"
            >
              <ChevronRight className="w-4 h-4 text-[#d4af37]" />
              <span>الشهر السابق</span>
            </button>

            <div className="text-center">
              <h3 className="text-base sm:text-xl font-bold font-quran text-[#f7ecd6]">
                {currentHijri.monthName} {currentHijri.year} هـ
              </h3>
              <span className="text-xs text-[#a2beb3]">
                {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#143126] text-white hover:bg-[#1a3f32] text-xs font-bold border border-[#255241]"
            >
              <span>الشهر التالي</span>
              <ChevronLeft className="w-4 h-4 text-[#d4af37]" />
            </button>
          </div>

          {/* Weekday headers (Sat to Fri) */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-[#d4af37] pb-2 border-b border-[#1b3e31]">
            {weekDayHeaders.map((dayName, idx) => (
              <div key={idx} className="py-1">
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: monthGridData.paddingDays }).map((_, pIdx) => (
              <div key={`pad-${pIdx}`} className="h-16 sm:h-20 rounded-xl bg-transparent" />
            ))}

            {monthGridData.days.map((dItem) => {
              const hasOccasion = !!dItem.occasion;
              return (
                <div
                  key={dItem.gregorianDay}
                  onClick={() => {
                    setCurrentDate(dItem.date);
                    if (dItem.occasion) {
                      setSelectedOccasion(dItem.occasion);
                    }
                  }}
                  className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden select-none ${
                    dItem.isSelected
                      ? 'bg-[#1b4435] border-[#d4af37] ring-2 ring-[#d4af37] shadow-lg'
                      : dItem.isToday
                      ? 'bg-[#153428] border-emerald-500 shadow'
                      : 'bg-[#091712] border-[#18392d] hover:border-[#285b48] hover:bg-[#0e241c]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-mono font-bold text-sm sm:text-base ${
                      dItem.isSelected ? 'text-[#d4af37]' : 'text-white'
                    }`}>
                      {dItem.hijri.day}
                    </span>

                    <span className="text-[10px] text-[#719183] font-mono">
                      {dItem.gregorianDay}
                    </span>
                  </div>

                  {hasOccasion && (
                    <div className="mt-auto">
                      <span
                        className={`block text-[9px] sm:text-[10px] truncate px-1 py-0.2 rounded font-semibold text-right ${
                          dItem.occasion?.type === 'wiladat'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : dItem.occasion?.type === 'shahadat'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                        title={dItem.occasion?.title}
                      >
                        • {dItem.occasion?.title}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAILED DATE NAVIGATOR (Preserved original style) */}
      <div className="rounded-xl bg-[#0f241d] p-4 border border-[#1f4a3b] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="px-2.5 py-1.5 rounded-lg bg-[#153428] text-white hover:bg-[#1d4435] text-xs font-medium border border-[#275342]"
            title="الشهر السابق"
          >
            شهر سابق
          </button>
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg bg-[#153428] text-[#d4af37] hover:bg-[#1d4435] border border-[#275342]"
            title="اليوم السابق"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Current viewed date display */}
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold font-quran text-white">
            {currentHijri.day} {currentHijri.monthName} {currentHijri.year} هـ
          </div>
          <div className="text-xs text-[#a2beb3]">{gregorianFormatted}</div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg bg-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/30 text-xs font-bold border border-[#d4af37]/40 shadow-sm"
          >
            اليوم الحالي
          </button>
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg bg-[#153428] text-[#d4af37] hover:bg-[#1d4435] border border-[#275342]"
            title="اليوم التالي"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="px-2.5 py-1.5 rounded-lg bg-[#153428] text-white hover:bg-[#1d4435] text-xs font-medium border border-[#275342]"
            title="الشهر التالي"
          >
            شهر تالٍ
          </button>
        </div>
      </div>

      {/* Occasions for the Selected Day (If any) */}
      {occasionsToday.length > 0 ? (
        <div className="rounded-2xl bg-gradient-to-r from-[#241315] via-[#3d181c] to-[#241315] p-5 border-2 border-red-500/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-red-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" />
              <span>مناسبة هذا اليوم ({currentHijri.day} {currentHijri.monthName}):</span>
            </div>
            <span className="text-[11px] text-red-200/80 font-normal">اضغط لعرض التفاصيل الكاملة والأعمال</span>
          </div>

          <div className="space-y-3">
            {occasionsToday.map((occ) => {
              const isFav = isFavorite(`occ-${occ.id}`);
              return (
                <div 
                  key={occ.id} 
                  onClick={() => setSelectedOccasion(occ)}
                  className="p-3.5 rounded-xl bg-black/30 border border-red-700/50 hover:border-red-400 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#d4af37] transition-colors">
                        {occ.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/60 text-red-200 border border-red-700/50">
                        {occ.figure}
                      </span>
                      {occ.divergenceNote && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                          محل اختلاف روائي
                        </span>
                      )}
                      {occ.mafatihId && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          occ.mafatihRelationship === 'specific'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : 'bg-blue-950 text-blue-300 border-blue-700'
                        }`}>
                          {occ.mafatihRelationship === 'specific' ? 'عمل خاص منصوص' : 'زيارة عامة'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed font-amiri line-clamp-2">
                      {occ.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={(e) => handleToggleOccasionFavorite(occ, e)}
                      className={`p-2 rounded-lg border transition-all ${
                        isFav 
                          ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]' 
                          : 'bg-[#18392d] text-white border-[#245341] hover:text-[#d4af37]'
                      }`}
                      title={isFav ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOccasion(occ);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#d4af37] text-[#0b1311] text-xs font-bold hover:bg-amber-400 transition-all shadow"
                    >
                      عرض التفاصيل والأعمال
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty Occasion Notice for the Selected Day */
        <div className="rounded-xl bg-[#0e231c] p-4 sm:p-5 border border-[#1f4a3b] shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-[#9cb6ab]">
            <CalendarIcon className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span>لا توجد مناسبة مسجلة لهذا اليوم ({currentHijri.day} {currentHijri.monthName})</span>
          </div>
          <span className="text-[11px] text-[#719183] hidden sm:inline">
            يُستحب تعقيب الصلوات وأذكار اليوم وتسبيح الزهراء (ع)
          </span>
        </div>
      )}

      {/* "أذكار وأعمال أيام الأسبوع" (Weekly Deeds Navigation Pills) */}
      <div className="rounded-2xl bg-[#0d211a] border border-[#1f4a3b] p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1b3e31] pb-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#d4af37]">
            <Clock className="w-4 h-4 text-[#d4af37]" />
            <span>أذكار وأدعية أيام الأسبوع عن أهل البيت (ع):</span>
          </div>
          <span className="text-[11px] text-[#8fa79c]">لكل يوم دعاء وزيارة وتسبيح مخصوص</span>
        </div>

        {/* 7 Days Pills */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-xs">
          {WEEK_DAYS_DEEDS.map((dayItem) => {
            const isSelected = activeWeekDayTab === dayItem.dayIndex;
            const isTodayDay = currentDayOfWeek === dayItem.dayIndex;
            return (
              <button
                key={dayItem.dayIndex}
                onClick={() => setActiveWeekDayTab(dayItem.dayIndex)}
                className={`py-2 px-1.5 rounded-xl font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 border ${
                  isSelected
                    ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37] shadow-md'
                    : isTodayDay
                    ? 'bg-[#15382b] text-emerald-300 border-emerald-500/60'
                    : 'bg-[#081510] text-[#a0bcaf] border-[#183a2d] hover:bg-[#122e23]'
                }`}
              >
                <span>يوم {dayItem.dayName}</span>
                {isTodayDay && (
                  <span className={`text-[9px] px-1 rounded font-normal ${
                    isSelected ? 'bg-black/20 text-[#0b1311]' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    اليوم
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Weekday Detail Card */}
        <div className="p-3.5 rounded-xl bg-[#081611] border border-[#18392d] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span>أعمال يوم {activeWeekDayDeed.dayName}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-[#133226] text-[#d4af37] border border-[#224f3e]">
                  منسوب إلى: {activeWeekDayDeed.attributedFigure}
                </span>
              </h4>
              <p className="text-xs text-[#a2beb3] font-amiri mt-1">
                تسبيح اليوم: <strong className="text-white">{activeWeekDayDeed.tasbeeh}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleToggleDeedFavorite(
                  `أعمال يوم ${activeWeekDayDeed.dayName}`,
                  `تسبيح وأعمال يوم ${activeWeekDayDeed.dayName} المنسوب إلى ${activeWeekDayDeed.attributedFigure}`,
                  activeWeekDayDeed.mafatihId
                )}
                className={`p-2 rounded-xl border transition-all ${
                  isFavorite(`deed-أعمال يوم ${activeWeekDayDeed.dayName}`)
                    ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]'
                    : 'bg-[#143226] text-[#a2beb3] hover:text-[#d4af37] border-[#234d3d]'
                }`}
                title="حفظ في المفضلة"
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite(`deed-أعمال يوم ${activeWeekDayDeed.dayName}`) ? 'fill-current' : ''}`} />
              </button>

              {onGoToMafatih && (
                <button
                  onClick={() => onGoToMafatih(activeWeekDayDeed.mafatihId)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d4af37] hover:bg-amber-400 text-[#0b1311] font-bold text-xs transition-all shadow"
                >
                  <span>فتح في مفاتيح الجنان</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Recommended actions list for this weekday */}
          <ul className="text-xs text-[#b8cec3] space-y-1 font-amiri pr-3 list-disc list-inside">
            {activeWeekDayDeed.recommendedActions.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>

          {/* Special Quick Portals for Friday and Thursday Night */}
          {activeWeekDayDeed.dayIndex === 5 && onGoToMafatih && (
            <div className="pt-2 border-t border-[#132d23] space-y-2">
              <div className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>أدعية وزيارات يوم الجمعة المباركة الموثقة في مفاتيح الجنان:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => onGoToMafatih('mafatih-kumayl')}
                  className="p-2.5 rounded-xl bg-[#0f281e] border border-[#23503e] hover:border-[#d4af37] text-right transition-all group"
                >
                  <div className="font-bold text-white group-hover:text-[#d4af37]">دعاء كميل بن زياد</div>
                  <div className="text-[10px] text-[#91b0a2]">يُقرأ ليلة الجمعة لمغفرة الذنوب</div>
                </button>
                <button
                  onClick={() => onGoToMafatih('mafatih-day-friday')}
                  className="p-2.5 rounded-xl bg-[#0f281e] border border-[#23503e] hover:border-[#d4af37] text-right transition-all group"
                >
                  <div className="font-bold text-white group-hover:text-[#d4af37]">دعاء الندبة والغسل</div>
                  <div className="text-[10px] text-[#91b0a2]">صبيحة يوم الجمعة لصاحب الزمان</div>
                </button>
                <button
                  onClick={() => onGoToMafatih('mafatih-simat')}
                  className="p-2.5 rounded-xl bg-[#0f281e] border border-[#23503e] hover:border-[#d4af37] text-right transition-all group"
                >
                  <div className="font-bold text-white group-hover:text-[#d4af37]">دعاء السمات المأثور</div>
                  <div className="text-[10px] text-[#91b0a2]">آخر ساعة من نهار الجمعة</div>
                </button>
              </div>
            </div>
          )}

          {activeWeekDayDeed.dayIndex === 4 && onGoToMafatih && (
            <div className="pt-2 border-t border-[#132d23] space-y-2">
              <div className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>استقبال ليلة الجمعة المباركة:</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => onGoToMafatih('mafatih-kumayl')}
                  className="px-3 py-1.5 rounded-xl bg-[#0f281e] border border-[#23503e] hover:border-[#d4af37] text-white hover:text-[#d4af37] font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>قراءة دعاء كميل بن زياد</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onGoToMafatih('mafatih-warith')}
                  className="px-3 py-1.5 rounded-xl bg-[#0f281e] border border-[#23503e] hover:border-[#d4af37] text-white hover:text-[#d4af37] font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>زيارة وارث لسيد الشهداء (ع)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="text-[10px] text-[#719183] pt-1 border-t border-[#132d23]">
            المصدر: {activeWeekDayDeed.source}
          </div>
        </div>
      </div>

      {/* "أعمال هذا اليوم" - DAILY DEEDS & MAFATIH DIRECT LINK */}
      <div className="rounded-2xl bg-[#0d211a] border-2 border-[#d4af37]/60 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1b3e31] pb-3">
          <h3 className="text-base sm:text-lg font-bold text-[#d4af37] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#d4af37]" />
            <span>أعمال هذا اليوم المبارك ({currentHijri.day} {currentHijri.monthName})</span>
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#163a2e] text-[#a2beb3]">
            مستخرجة من مفاتيح الجنان
          </span>
        </div>

        <div className="space-y-3">
          {dailyDeeds.map((deed) => (
            <div
              key={deed.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                deed.isHighlighted
                  ? 'bg-gradient-to-r from-[#112d22] to-[#0c1f18] border-[#d4af37]/60 shadow-md'
                  : 'bg-[#081510] border-[#18392d] hover:border-[#285d49]'
              }`}
            >
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{deed.title}</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#b5cbbf] font-amiri leading-relaxed pr-5">
                  {deed.desc}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button
                  onClick={() => handleToggleDeedFavorite(deed.title, deed.desc, deed.mafatihId)}
                  className="p-2 rounded-xl bg-[#143226] text-[#a2beb3] hover:text-[#d4af37] border border-[#234d3d] transition-all"
                  title="حفظ في المفضلة"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>

                {onGoToMafatih && deed.mafatihId && (
                  <button
                    onClick={() => onGoToMafatih(deed.mafatihId!)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#d4af37] text-[#0b1311] hover:bg-[#e4be46] transition-all shrink-0 shadow active:scale-95"
                    title="عرض نص الأعمال والأدعية في كتاب مفاتيح الجنان"
                  >
                    <span>عرض الأعمال والأدعية</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Occasions of the Whole Month Section (Preserved) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base sm:text-lg font-bold text-[#d4af37] flex items-center gap-2">
            <Star className="w-4 h-4 fill-current" />
            <span>مناسبات شهر {currentHijri.monthName} ({occasionsThisMonth.length} مناسبة)</span>
          </h3>

          {/* Filter by occasion type */}
          <div className="flex flex-wrap gap-1 text-xs">
            <button
              onClick={() => setSelectedOccasionType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedOccasionType === 'all'
                  ? 'bg-[#d4af37] text-[#0b1311] font-bold'
                  : 'bg-[#122a21] text-[#bcd0c7] hover:bg-[#1a3b2f]'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSelectedOccasionType('wiladat')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedOccasionType === 'wiladat'
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'bg-[#122a21] text-emerald-300 hover:bg-[#1a3b2f]'
              }`}
            >
              ولادات وأفراح
            </button>
            <button
              onClick={() => setSelectedOccasionType('shahadat')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedOccasionType === 'shahadat'
                  ? 'bg-red-700 text-white font-bold'
                  : 'bg-[#122a21] text-red-300 hover:bg-[#1a3b2f]'
              }`}
            >
              شهادات وأحزان
            </button>
            <button
              onClick={() => setSelectedOccasionType('eid')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedOccasionType === 'eid'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-[#122a21] text-amber-300 hover:bg-[#1a3b2f]'
              }`}
            >
              أعياد إسلامية
            </button>
            <button
              onClick={() => setSelectedOccasionType('historical')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedOccasionType === 'historical'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-[#122a21] text-sky-300 hover:bg-[#1a3b2f]'
              }`}
            >
              أحداث تاريخية
            </button>
          </div>
        </div>

        {/* Occasions List */}
        {filteredMonthOccasions.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#0d1e18] border border-[#1b3a2e] text-[#8ea89d] text-sm">
            لا توجد مناسبات مطابقة للتصنيف في هذا الشهر.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMonthOccasions.map((occ) => {
              const isFav = isFavorite(`occ-${occ.id}`);
              return (
                <div
                  key={occ.id}
                  onClick={() => setSelectedOccasion(occ)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between gap-2.5 ${
                    occ.day === currentHijri.day
                      ? 'bg-[#18392d] border-[#d4af37] ring-1 ring-[#d4af37]'
                      : 'bg-[#0d201a] border-[#1d4334] hover:border-[#2d624d]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-[#143026] border border-[#23503f] flex items-center justify-center font-mono font-bold text-sm text-[#d4af37]">
                          {occ.day}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-snug group-hover:text-[#d4af37] transition-colors">
                            {occ.title}
                          </h4>
                          <span className="text-[11px] text-[#93b3a5]">{occ.figure}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold ${
                          occ.type === 'wiladat'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : occ.type === 'shahadat'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : occ.type === 'eid'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-sky-950 text-sky-300 border border-sky-800'
                        }`}
                      >
                        {occ.type === 'wiladat'
                          ? 'ولادة'
                          : occ.type === 'shahadat'
                          ? 'شهادة'
                          : occ.type === 'eid'
                          ? 'عيد'
                          : 'تاريخي'}
                      </span>
                      {occ.divergenceNote && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                          محل اختلاف
                        </span>
                      )}
                      {occ.mafatihRelationship && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          occ.mafatihRelationship === 'specific'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : 'bg-blue-950 text-blue-300 border-blue-700'
                        }`}>
                          {occ.mafatihRelationship === 'specific' ? 'عمل خاص' : 'زيارة عامة'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#b8cdc4] font-amiri leading-relaxed pr-10 line-clamp-2">
                      {occ.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#173a2e] text-xs">
                    <button
                      onClick={(e) => handleToggleOccasionFavorite(occ, e)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isFav 
                          ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]' 
                          : 'text-[#8ea79b] hover:text-[#d4af37] border-[#224838]'
                      }`}
                      title={isFav ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#d4af37] font-bold">
                        عرض التفاصيل ←
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OCCASION DETAILS MODAL (Pop-up dialog when an occasion is tapped) */}
      {selectedOccasion && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => {
            setSelectedOccasion(null);
            if (audioRef.current) audioRef.current.pause();
            setIsPlayingAudio(false);
          }}
        >
          <div 
            className="bg-[#0b1b15] border-2 border-[#d4af37]/70 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-4 space-y-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#1f4a3b] bg-[#0e241c] flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                    selectedOccasion.type === 'wiladat'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600'
                      : selectedOccasion.type === 'shahadat'
                      ? 'bg-red-900/60 text-red-300 border border-red-600'
                      : 'bg-amber-900/60 text-amber-300 border border-amber-600'
                  }`}>
                    {selectedOccasion.type === 'wiladat' ? 'ولادة مباركة' : selectedOccasion.type === 'shahadat' ? 'ذكرى شهادة أليمة' : 'مناسبة إسلامية'}
                  </span>
                  <span className="text-xs text-[#d4af37] font-mono font-bold">
                    {selectedOccasion.day} {HIJRI_MONTH_NAMES[selectedOccasion.month - 1]} هـ
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-quran">
                  {selectedOccasion.title}
                </h3>
                <div className="text-xs text-[#a2beb3]">
                  المنسوب إليه: <strong className="text-white">{selectedOccasion.figure}</strong>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggleOccasionFavorite(selectedOccasion)}
                  className={`p-2 rounded-xl border transition-all ${
                    isFavorite(`occ-${selectedOccasion.id}`)
                      ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]'
                      : 'bg-[#153428] text-white border-[#275342] hover:text-[#d4af37]'
                  }`}
                  title="المفضلة"
                >
                  <Star className={`w-4 h-4 ${isFavorite(`occ-${selectedOccasion.id}`) ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    setSelectedOccasion(null);
                    if (audioRef.current) audioRef.current.pause();
                    setIsPlayingAudio(false);
                  }}
                  className="p-2 rounded-xl bg-[#143126] text-[#a2beb3] hover:text-white hover:bg-[#1f4a3a] border border-[#275342] transition-colors"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm font-tajawal scrollbar-thin scrollbar-thumb-[#1e4839]">
              {/* Date Card showing both Hijri and Gregorian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[#091712] border border-[#16382a] text-xs">
                <div className="flex items-center gap-2 text-[#d4af37]">
                  <CalendarIcon className="w-4 h-4 shrink-0 text-[#d4af37]" />
                  <span>التاريخ الهجري: <strong className="text-white font-mono">{selectedOccasion.day} {HIJRI_MONTH_NAMES[selectedOccasion.month - 1]} هـ</strong></span>
                </div>
                <div className="flex items-center gap-2 text-[#a2beb3]">
                  <Clock className="w-4 h-4 shrink-0 text-[#d4af37]" />
                  <span>تاريخ اليوم المعروض: <strong className="text-white font-mono">{gregorianFormatted}</strong></span>
                </div>
              </div>
              {/* Divergence note if any */}
              {selectedOccasion.divergenceNote && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">تنبيه روائي / تاريخي: </span>
                    <span>{selectedOccasion.divergenceNote}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#d4af37]">
                  شرح وبيان المناسبة:
                </h4>
                <p className="text-sm leading-relaxed text-[#e1eee8] font-amiri p-3.5 rounded-2xl bg-[#091712] border border-[#16382a]">
                  {selectedOccasion.description}
                </p>
              </div>

              {/* Recommended deeds */}
              {selectedOccasion.recommendedDeeds && selectedOccasion.recommendedDeeds.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>الأعمال والسنن المستحبة الموثقة:</span>
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-[#081611] border border-[#183a2d] space-y-2">
                    <ul className="space-y-1.5 text-xs text-[#c6dbd1] font-amiri list-disc list-inside">
                      {selectedOccasion.recommendedDeeds.map((deed, dIdx) => (
                        <li key={dIdx} className="leading-relaxed">
                          {deed}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Relationship with Mafatih al-Jinan: Specific vs General Deed */}
              {selectedOccasion.mafatihId && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  selectedOccasion.mafatihRelationship === 'specific'
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                    : 'bg-blue-950/40 border-blue-600/50 text-blue-200'
                }`}>
                  <BookOpen className={`w-4 h-4 shrink-0 mt-0.5 ${
                    selectedOccasion.mafatihRelationship === 'specific' ? 'text-emerald-400' : 'text-blue-400'
                  }`} />
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <span>
                        {selectedOccasion.mafatihRelationship === 'specific' 
                          ? 'عمل خاص منصوص لهذه المناسبة في مفاتيح الجنان' 
                          : 'عمل / زيارة عامة مستحبة (ليست منصوصة بخصوص هذا اليوم)'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90 font-amiri">
                      {selectedOccasion.mafatihRelationship === 'specific'
                        ? 'هذا العمل أو الدعاء أو الزيارة منصوص عليه بالخصوص في كتب الأدعية المعتمدة (كمفاتيح الجنان ومصباح المتهجد) لإقامته في هذه المناسبة بعينها.'
                        : 'العمل المرتبط هنا (كالزيارة الجامعة أو حرز الحفظ) مستحب لعموم الأئمة المعصومين أو الحفظ العام، ولم يرد نص بتخصيصه لهذا اليوم بعينه، وإنما أُدرج في التطبيق تيسيراً للزيارة والتوسل والتبرك.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Audio tracks for this occasion if available in Mafatih audio data */}
              {modalAudioTracks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>تلاوات وزيارات صوتية مرتبطة:</span>
                  </h4>
                  <div className="space-y-2">
                    {modalAudioTracks.map((track) => {
                      const isThisPlaying = activeAudioTrack?.id === track.id && isPlayingAudio;
                      return (
                        <div
                          key={track.id}
                          className="p-3 rounded-xl bg-[#0d221a] border border-[#1e4838] flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-xs text-white">{track.title}</div>
                            <div className="text-[11px] text-[#91b1a3]">
                              بصوت: {track.reciterName} • المدة: {track.durationLabel}
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleAudio(track)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow ${
                              isThisPlaying
                                ? 'bg-amber-500 text-black'
                                : 'bg-[#193d2f] hover:bg-[#d4af37] text-white hover:text-black'
                            }`}
                          >
                            {isThisPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>إيقاف</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>استماع</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Source Information */}
              {selectedOccasion.source && (
                <div className="pt-2 border-t border-[#16382a] text-[11px] text-[#7ea192]">
                  <span className="font-bold text-[#a0c4b5]">المصدر المعتمد: </span>
                  <span>{selectedOccasion.source}</span>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-[#1f4a3b] bg-[#091712] flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  setSelectedOccasion(null);
                  if (audioRef.current) audioRef.current.pause();
                  setIsPlayingAudio(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#143226] text-white text-xs font-bold hover:bg-[#1a3f32] transition-colors"
              >
                إغلاق
              </button>

              {onGoToMafatih && selectedOccasion.mafatihId && (
                <button
                  onClick={() => {
                    const mId = selectedOccasion.mafatihId!;
                    setSelectedOccasion(null);
                    if (audioRef.current) audioRef.current.pause();
                    setIsPlayingAudio(false);
                    onGoToMafatih(mId);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 text-[#0b1311] font-bold text-xs hover:scale-105 transition-all shadow-lg active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {selectedOccasion.mafatihRelationship === 'specific'
                      ? 'فتح العمل الخاص في مفاتيح الجنان'
                      : 'تصفح الزيارة/الدعاء العام في مفاتيح الجنان'}
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
