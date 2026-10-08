import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Clock, 
  Calendar as CalendarIcon, 
  Moon, 
  BookOpen, 
  Heart, 
  Compass, 
  HelpCircle, 
  Palette, 
  MessageSquare, 
  Sparkles, 
  Menu, 
  X,
  Star,
  Users,
  Search,
  BookMarked,
  Bell,
  ArrowLeft,
  Layers,
  Bot
} from 'lucide-react';

import { SalawatHeader } from './components/SalawatHeader';
import { PrayerTimesView } from './components/PrayerTimesView';
import { RamadanView } from './components/RamadanView';
import { CalendarView } from './components/CalendarView';
import { TasbeehZahraView } from './components/TasbeehZahraView';
import { QuranMushafView } from './components/QuranMushafView';
import { InfalliblesView } from './components/InfalliblesView';
import { LibraryDuasView } from './components/LibraryDuasView';
import { ShakkView } from './components/ShakkView';
import { QiblaCompassView } from './components/QiblaCompassView';
import { IslamicArtStudioView } from './components/IslamicArtStudioView';
import { ShiaAssistantView } from './components/ShiaAssistantView';
import { MafatihJinanView } from './components/MafatihJinanView';
import { FavoritesView } from './components/FavoritesView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { PrayerGuideView } from './components/PrayerGuideView';
import { SmartAssistant } from './components/SmartAssistant';

import { calculateShiaPrayerTimes, POPULAR_CITIES } from './utils/prayerTimes';
import { prayerAdhanService } from './services/prayerAdhanService';
import { getHijriDate, SHIA_OCCASIONS } from './data/calendarOccasions';
import { getFavorites } from './utils/favoritesStorage';
import { AudioProvider } from './context/AudioContext';

export type AppTab =
  | 'home'
  | 'prayer_guide'
  | 'prayers'
  | 'ramadan'
  | 'calendar'
  | 'tasbeeh'
  | 'quran'
  | 'infallibles'
  | 'mafatih'
  | 'library'
  | 'favorites'
  | 'shakk'
  | 'qibla'
  | 'art_studio'
  | 'assistant';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [mafatihTargetItemId, setMafatihTargetItemId] = useState<string | undefined>(undefined);
  const [prayerRulingTargetId, setPrayerRulingTargetId] = useState<string | undefined>(undefined);
  const [quranTargetPage, setQuranTargetPage] = useState<number | undefined>(undefined);
  const [calendarTargetOccasionId, setCalendarTargetOccasionId] = useState<string | undefined>(undefined);
  const [infalliblesTargetId, setInfalliblesTargetId] = useState<string | undefined>(undefined);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string | undefined>(undefined);

  // Quick summary info for home with live clock
  const [liveNow, setLiveNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const today = liveNow;
  const hijriAdjustment = (() => {
    try {
      return parseInt(localStorage.getItem('shia_hijri_adjustment') || '0', 10);
    } catch {
      return 0;
    }
  })();
  const hijri = getHijriDate(today, hijriAdjustment);
  const city = prayerAdhanService.getSavedCity();
  const prayerResult = calculateShiaPrayerTimes(
    today, 
    city, 
    prayerAdhanService.getSavedMethod(), 
    prayerAdhanService.getSavedOffsets()
  );

  // Check if today has an occasion for in-app banner reminder
  const todayOccasion = SHIA_OCCASIONS.find(
    (occ) => occ.month === hijri.month && occ.day === hijri.day
  );

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'prayer_guide', label: 'الصلاة وأحكامها', icon: Layers, badge: 'جديد' },
    { id: 'mafatih', label: 'مفاتيح الجنان', icon: BookMarked },
    { id: 'prayers', label: 'أوقات الصلاة', icon: Clock },
    { id: 'ramadan', label: 'شهر رمضان', icon: Moon, badge: 'مبارك' },
    { id: 'calendar', label: 'التقويم', icon: CalendarIcon },
    { id: 'tasbeeh', label: 'تسبيح الزهراء', icon: Heart },
    { id: 'quran', label: 'المصحف الشريف', icon: BookOpen },
    { id: 'infallibles', label: 'سيرة أهل البيت (ع)', icon: Users },
    { id: 'library', label: 'مكتبة الأدعية والزيارات', icon: Sparkles },
    { id: 'favorites', label: 'المفضلة', icon: Star },
    { id: 'shakk', label: 'شكوك الصلاة', icon: HelpCircle },
    { id: 'qibla', label: 'القبلة', icon: Compass },
    { id: 'art_studio', label: 'استوديو الصور الذكي', icon: Palette },
    { id: 'assistant', label: 'المساعد الذكي', icon: Bot, badge: '🤖 ذكي' },
  ];

  // Handle deep navigation from Search, Calendar, Favorites, or Smart Assistant
  const handleUniversalNavigate = (tab: string, targetId?: string) => {
    if (tab === 'mafatih' && targetId) {
      setMafatihTargetItemId(targetId);
    }
    if (tab === 'prayer_guide' && targetId) {
      setPrayerRulingTargetId(targetId);
    }
    if (tab === 'quran' && targetId) {
      const pageNum = parseInt(targetId, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= 604) {
        setQuranTargetPage(pageNum);
      }
    }
    if (tab === 'calendar') {
      if (targetId) {
        setCalendarTargetOccasionId(targetId);
      }
    }
    if (tab === 'infallibles') {
      if (targetId) {
        setInfalliblesTargetId(targetId);
      }
    }
    setActiveTab(tab as AppTab);
  };

  return (
    <AudioProvider>
      <div className="min-h-screen bg-[#08120e] text-[#f2eee3] bg-islamic-pattern flex flex-col font-tajawal selection:bg-[#d4af37]/30 selection:text-white" dir="rtl">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0a1813]/95 backdrop-blur-md border-b border-[#d4af37]/30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & App Title */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] via-amber-500 to-[#18483b] p-0.5 shadow-lg group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0d221b] rounded-[10px] flex items-center justify-center text-[#d4af37]">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-quran text-lg sm:text-xl font-extrabold text-[#f7ebd7] tracking-wide">
                  نُورُ الْعِتْرَةِ
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#18483b] text-[#d4af37] border border-[#d4af37]/30">
                  شيعي
                </span>
              </div>
              <p className="text-[10px] text-[#8fa79c] -mt-0.5 font-amiri">
                التطبيق الإسلامي الشيعي الشامل • {hijri.day} {hijri.monthName} {hijri.year} هـ
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.slice(0, 9).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AppTab)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#d4af37] text-[#0b1311] shadow-md'
                      : 'text-[#c0d4cb] hover:text-white hover:bg-[#122e23]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Search Button and Mobile Menu Hamburger */}
          <div className="flex items-center gap-2">
            {/* Smart Assistant Button */}
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37]/20 via-amber-500/20 to-[#143126] text-[#d4af37] hover:bg-[#d4af37]/30 border border-[#d4af37]/60 text-xs font-bold shadow transition-all active:scale-95"
              title="المساعد الذكي والبحث الموحد 🤖"
            >
              <Bot className="w-4 h-4 text-[#d4af37]" />
              <span className="hidden sm:inline">المساعد الذكي</span>
            </button>

            {/* Global Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#143126] text-white hover:bg-[#1d4435] border border-[#275342] text-xs font-semibold shadow transition-all active:scale-95"
              title="البحث الشامل في التطبيق"
            >
              <Search className="w-4 h-4 text-[#d4af37]" />
              <span className="hidden sm:inline">بحث شامل</span>
            </button>

            {/* Favorites Icon Button */}
            <button
              onClick={() => setActiveTab('favorites')}
              className={`p-2 rounded-xl border transition-all ${
                activeTab === 'favorites'
                  ? 'bg-[#d4af37] text-[#0b1311] border-[#d4af37]'
                  : 'bg-[#122a21] text-[#a2beb3] border-[#234d3d] hover:text-[#d4af37]'
              }`}
              title="المفضلة"
            >
              <Star className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#122a21] border border-[#234d3d] text-[#d4af37] hover:bg-[#1a3d30]"
              title="القائمة"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Full Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[#0a1813] border-b border-[#234d3d] px-4 py-4 space-y-2 shadow-2xl">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as AppTab);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                      isActive
                        ? 'bg-[#d4af37] text-[#0b1311] shadow'
                        : 'bg-[#0e231c] text-[#c0d4cb] hover:bg-[#153328]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#d4af37]" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Prominent Salawat Header shown on the Home View */}
        {activeTab === 'home' && <SalawatHeader />}

        {/* «مناسبة اليوم» Card on Home Page */}
        {activeTab === 'home' && (
          <div className="mb-5">
            {todayOccasion ? (
              <div className="rounded-2xl bg-gradient-to-r from-[#2a1215] via-[#45181e] to-[#2a1215] border-2 border-red-500/70 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600/30 border border-red-500 text-red-200 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-red-300 animate-pulse" />
                  </div>
                  <div className="space-y-0.5 text-center sm:text-right">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs text-red-300 font-bold">
                        مناسبة اليوم: {todayOccasion.day} {hijri.monthName} {hijri.year} هـ
                      </span>
                      <span className="text-[10px] text-red-200/70 font-amiri">
                        (الموافق: {new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(today)})
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {todayOccasion.title} ({todayOccasion.figure})
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCalendarTargetOccasionId(todayOccasion.id);
                    setActiveTab('calendar');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#d4af37] text-[#0b1311] hover:bg-[#e4be46] shadow transition-all shrink-0 active:scale-95"
                >
                  <span>عرض التفاصيل والأعمال</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#0e231c]/90 border border-[#1f4a3b] p-3.5 sm:p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#143126] text-[#d4af37] flex items-center justify-center shrink-0 border border-[#245341]">
                    <CalendarIcon className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-xs font-bold text-[#d4af37] flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                      <span>مناسبة اليوم:</span>
                      <span className="text-white">
                        {hijri.day} {hijri.monthName} {hijri.year} هـ
                      </span>
                      <span className="text-[11px] text-[#8fa79c] font-normal font-amiri">
                        • الموافق: {new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(today)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a2beb3] font-amiri mt-0.5">
                      لا توجد مناسبة مسجلة لهذا اليوم • يُستحب تعقيب الصلوات وأذكار اليوم وتسبيح الزهراء (ع)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCalendarTargetOccasionId(undefined);
                    setActiveTab('calendar');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#143226] hover:bg-[#1c4535] text-[#d4af37] hover:text-white text-xs font-bold border border-[#245341] transition-all shrink-0 flex items-center gap-1.5"
                >
                  <span>عرض التقويم الإسلامي</span>
                  <ArrowLeft className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* HOME VIEW: Comprehensive Dashboard */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Quick Hero Banner Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Prayer Times Quick Widget */}
              <div 
                className="p-5 rounded-2xl bg-gradient-to-br from-[#122e23] via-[#16382b] to-[#0c1f18] border-2 border-[#d4af37]/60 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#d4af37] mb-2 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#d4af37]" />
                      <span>مواقيت الصلاة ({city.name})</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d241c] text-[#cbdad3] border border-[#1f4a3b]">
                      الجعفري
                    </span>
                  </div>

                  {/* Current Prayer */}
                  <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1b3d2f]">
                    <span className="text-xs text-[#a2beb3]">الصلاة الحالية:</span>
                    <span className="text-xs font-bold text-white bg-[#143226] px-2.5 py-0.5 rounded-md border border-[#234d3d]">
                      {prayerResult.currentPrayerName}
                    </span>
                  </div>

                  {/* Next Prayer */}
                  <div className="text-base sm:text-lg font-bold font-quran text-white">
                    القادمة: {prayerResult.nextPrayerName}
                  </div>

                  <div className="flex items-baseline justify-between mt-0.5">
                    <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#d4af37]">
                      {prayerResult.nextPrayerTime}
                    </div>

                    <div className="text-xs text-[#a2beb3] font-mono">
                      متبقي: <span className="text-white font-bold">{prayerResult.countdownFormatted || prayerResult.remainingTime}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons for Prayer Times and Qibla */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#1d4334]">
                  <button
                    onClick={() => setActiveTab('prayers')}
                    className="py-2 px-3 rounded-xl bg-[#d4af37] text-[#0b1311] font-bold text-xs hover:brightness-105 shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>أوقات الصلاة</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('qibla')}
                    className="py-2 px-3 rounded-xl bg-[#143226] hover:bg-[#1c4535] text-[#d4af37] border border-[#d4af37]/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>القبلة</span>
                  </button>
                </div>
              </div>

              {/* Mafatih al-Jinan Portal Card */}
              <div 
                onClick={() => setActiveTab('mafatih')}
                className="p-5 rounded-2xl bg-gradient-to-br from-[#183d2f] to-[#0d261e] border-2 border-[#d4af37] shadow-xl cursor-pointer hover:border-amber-300 transition-all hover:scale-[1.01] relative overflow-hidden"
              >
                <div className="flex items-center gap-1.5 text-xs text-[#d4af37] font-bold mb-2">
                  <BookMarked className="w-4 h-4 text-[#d4af37]" />
                  <span>كتاب مفاتيح الجنان الشامل</span>
                </div>
                <div className="text-xl font-bold font-quran text-white">
                  الأدعية، الزيارات، وأعمال الأيام والشهور
                </div>
                <p className="text-xs text-[#b8cdc4] font-amiri mt-1">
                  للشيخ عباس القمي مع وضع ليلي وتكبير الخط وحفظ آخر قراءة.
                </p>
                <span className="inline-block mt-3 text-[11px] font-bold text-[#0b1311] bg-[#d4af37] px-2.5 py-1 rounded-lg">
                  فتح كتاب مفاتيح الجنان ←
                </span>
              </div>

              {/* Ramadan Special Portal */}
              <div 
                onClick={() => setActiveTab('ramadan')}
                className="p-5 rounded-2xl bg-gradient-to-br from-[#1b3a2e] to-[#0d221b] border-2 border-amber-400/50 shadow-xl cursor-pointer hover:border-amber-400 transition-all hover:scale-[1.01] relative overflow-hidden"
              >
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mb-2">
                  <Moon className="w-4 h-4 fill-current" />
                  <span>بوابة شهر رمضان المبارك</span>
                </div>
                <div className="text-xl font-bold font-quran text-white">
                  الأدعية اليومية والإمساك والإفطار
                </div>
                <p className="text-xs text-[#b8cdc4] font-amiri mt-1">
                  أدعية الأيام الثلاثين، وأعمال ليالي القدر المباركة.
                </p>
                <span className="inline-block mt-3 text-[11px] font-bold text-[#d4af37] bg-[#091712] px-2.5 py-1 rounded-lg border border-[#d4af37]/30">
                  تصفح أدعية وأعمال رمضان ←
                </span>
              </div>
            </div>

            {/* Comprehensive Feature Grid for Home Navigation */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base sm:text-lg font-bold text-[#d4af37] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>أقسام التطبيق والخدمات الدينية الشيعية:</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* المساعد الذكي والبحث الموحد */}
                <div 
                  onClick={() => setIsAssistantOpen(true)}
                  className="p-4 rounded-xl bg-[#0e231c] border-2 border-emerald-500/70 hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#143126] text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-white">المساعد الذكي</h4>
                    <span className="text-2xs bg-emerald-500/30 text-emerald-300 font-bold px-1.5 rounded border border-emerald-500/40">🤖 موحد</span>
                  </div>
                  <p className="text-[11px] text-[#8fa79c] mt-1 font-amiri">محادثة ذكية وتوجيه مباشر في القرآن والمفاتيح والأحكام</p>
                </div>

                {/* الصلاة وأحكامها */}
                <div 
                  onClick={() => setActiveTab('prayer_guide')}
                  className="p-4 rounded-xl bg-[#0e231c] border-2 border-[#d4af37]/70 hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#143126] text-[#d4af37] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-white">الصلاة وأحكامها</h4>
                    <span className="text-2xs bg-[#d4af37] text-black font-bold px-1.5 rounded">جديد</span>
                  </div>
                  <p className="text-[11px] text-[#8fa79c] mt-1 font-amiri">تعلّم الصلاة، موسوعة الأحكام (30 باباً)، وأخطاء شائعة</p>
                </div>

                {/* مفاتيح الجنان */}
                <div 
                  onClick={() => setActiveTab('mafatih')}
                  className="p-4 rounded-xl bg-[#0e231c] border-2 border-[#d4af37]/60 hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#143126] text-[#d4af37] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">مفاتيح الجنان (كامل)</h4>
                  <p className="text-[11px] text-[#8fa79c] mt-1 font-amiri">الزيارات والصلوات والتعقيبات وأعمال الشهور</p>
                </div>

                {/* المصحف */}
                <div 
                  onClick={() => setActiveTab('quran')}
                  className="p-4 rounded-xl bg-[#0e231c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#143126] text-[#d4af37] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">المصحف الشريف وتنزيل الصوتيات</h4>
                  <p className="text-[11px] text-[#8fa79c] mt-1 font-amiri">صفحات مصحف حقيقية واستماع بدون إنترنت</p>
                </div>

                {/* سيرة أهل البيت ع */}
                <div 
                  onClick={() => setActiveTab('infallibles')}
                  className="p-4 rounded-xl bg-[#0e231c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#143126] text-[#d4af37] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">سيرة أهل البيت (ع) والقصص</h4>
                  <p className="text-[11px] text-[#8fa79c] mt-1 font-amiri">سيرة الـ ١٤ معصوماً وقصص ومواقف موثقة</p>
                </div>

                {/* التقويم والمناسبات */}
                <div 
                  onClick={() => setActiveTab('calendar')}
                  className="p-4 rounded-xl bg-[#0e231c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#143126] text-[#d4af37] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">التقويم الهجري وأعمال اليوم</h4>
                  <p className="text-[11px] text-[#8fa79c] mt-1 font-amiri">عرض شهري وتفصيلي ومناسبات وأعمال اليوم</p>
                </div>

                {/* تسبيح الزهراء ع */}
                <div 
                  onClick={() => setActiveTab('tasbeeh')}
                  className="p-4 rounded-xl bg-[#0e231c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#143126] text-[#d4af37] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Heart className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">تسبيح فاطمة الزهراء (ع)</h4>
                  <p className="text-[11px] text-[#8fa79c] mt-1 font-amiri">مسبحة مع اهتزاز لطيف عند كل ٣٣ تسبيحة</p>
                </div>

                {/* استوديو الصور الدينية الذكي */}
                <div 
                  onClick={() => setActiveTab('art_studio')}
                  className="p-4 rounded-xl bg-[#0e231c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#143126] text-[#d4af37] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Palette className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">إنشاء وتعديل الصور الدينية</h4>
                  <p className="text-[11px] text-[#8fa79c] mt-1 font-amiri">بالذكاء الاصطناعي (Gemini) خط مذهب وأضرحة</p>
                </div>

                {/* المفضلة */}
                <div 
                  onClick={() => setActiveTab('favorites')}
                  className="p-4 rounded-xl bg-[#0e231c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#143126] text-[#d4af37] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">المفضلة والمحفوظات</h4>
                  <p className="text-[11px] text-[#8fa79c] mt-1 font-amiri">الأدعية والزيارات والقصص المحفوظة</p>
                </div>

                {/* فقه شكوك الصلاة */}
                <div 
                  onClick={() => setActiveTab('shakk')}
                  className="p-4 rounded-xl bg-[#0e231c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#143126] text-[#d4af37] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">دليل شكوك الصلاة</h4>
                  <p className="text-[11px] text-[#8fa79c] mt-1 font-amiri">الشك بين 3 و 4، سجدتا السهو وصلاة الاحتياط</p>
                </div>
              </div>
            </div>

            {/* Hadith Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#143328] via-[#1e4839] to-[#122d23] border border-[#d4af37]/40 shadow-xl space-y-2 text-center">
              <span className="text-xs uppercase tracking-widest text-[#d4af37] font-bold">
                حَدِيثُ الْيَوْمِ عَنْ رَسُولِ اللَّهِ (ص)
              </span>
              <p className="font-quran text-lg sm:text-2xl text-[#f7ecd6] leading-relaxed">
                «مَثَلُ أَهْلِ بَيْتِي فِيكُمْ كَمَثَلِ سَفِينَةِ نُوحٍ، مَنْ رَكِبَهَا نَجَا، وَمَنْ تَخَلَّفَ عَنْهَا غَرِقَ وَهَوَى»
              </p>
              <div className="text-xs text-[#a2beb3] font-mono">
                المصدر: المستدرك على الصحيحين، بحار الأنوار، الكافي
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Views */}
        {activeTab === 'prayer_guide' && (
          <PrayerGuideView 
            initialRulingId={prayerRulingTargetId}
            onNavigateToQibla={() => setActiveTab('qibla')}
            onNavigateToPrayerTimes={() => setActiveTab('prayers')}
          />
        )}
        {activeTab === 'mafatih' && (
          <MafatihJinanView initialItemId={mafatihTargetItemId} />
        )}
        {activeTab === 'prayers' && (
          <PrayerTimesView onGoToQibla={() => setActiveTab('qibla')} />
        )}
        {activeTab === 'ramadan' && <RamadanView />}
        {activeTab === 'calendar' && (
          <CalendarView 
            initialOccasionId={calendarTargetOccasionId}
            onGoToMafatih={(itemId) => {
              setMafatihTargetItemId(itemId);
              setActiveTab('mafatih');
            }} 
          />
        )}
        {activeTab === 'tasbeeh' && <TasbeehZahraView />}
        {activeTab === 'quran' && <QuranMushafView initialPageNumber={quranTargetPage} />}
        {activeTab === 'infallibles' && (
          <InfalliblesView 
            initialInfallibleId={infalliblesTargetId}
            onNavigate={handleUniversalNavigate}
            onAskAssistant={(query) => {
              setAssistantInitialQuery(query);
              setIsAssistantOpen(true);
            }}
          />
        )}
        {activeTab === 'library' && <LibraryDuasView />}
        {activeTab === 'favorites' && (
          <FavoritesView onNavigate={handleUniversalNavigate} />
        )}
        {activeTab === 'shakk' && <ShakkView />}
        {activeTab === 'qibla' && <QiblaCompassView />}
        {activeTab === 'art_studio' && <IslamicArtStudioView />}
        {activeTab === 'assistant' && (
          <SmartAssistant
            isFullPage={true}
            isOpen={true}
            onClose={() => setActiveTab('home')}
            onNavigate={handleUniversalNavigate}
            initialQuery={assistantInitialQuery}
          />
        )}
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleUniversalNavigate}
      />

      {/* Floating Smart Assistant FAB Button (Always accessible anywhere) */}
      <button
        onClick={() => setIsAssistantOpen((prev) => !prev)}
        className="fixed bottom-20 left-4 xl:bottom-6 xl:left-6 z-40 p-3 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] via-amber-500 to-[#18483b] text-[#0b1311] shadow-2xl hover:scale-105 active:scale-95 transition-all group flex items-center gap-2 border-2 border-[#f3e5ab]/70"
        title="المساعد الذكي والبحث الموحد 🤖"
      >
        <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-[#0b1311]" />
        <span className="hidden sm:inline font-bold text-xs text-[#0b1311]">المساعد الذكي 🤖</span>
      </button>

      {/* Persistent Smart Assistant Modal / Drawer */}
      <SmartAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onNavigate={handleUniversalNavigate}
        initialQuery={assistantInitialQuery}
      />

      {/* Floating Bottom Quick Tab Bar for Mobile / Android */}
      <footer className="sticky bottom-0 z-40 bg-[#0a1813]/95 backdrop-blur-md border-t border-[#d4af37]/30 py-2 px-3 shadow-2xl xl:hidden">
        <div className="flex items-center justify-around text-xs">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg ${
              activeTab === 'home' ? 'text-[#d4af37] font-bold' : 'text-[#8fa79c]'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">الرئيسية</span>
          </button>

          <button
            onClick={() => setActiveTab('mafatih')}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg ${
              activeTab === 'mafatih' ? 'text-[#d4af37] font-bold' : 'text-[#8fa79c]'
            }`}
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-[10px]">مفاتيح الجنان</span>
          </button>

          <button
            onClick={() => setActiveTab('prayers')}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg ${
              activeTab === 'prayers' ? 'text-[#d4af37] font-bold' : 'text-[#8fa79c]'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">الصلاة</span>
          </button>

          <button
            onClick={() => setActiveTab('tasbeeh')}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg ${
              activeTab === 'tasbeeh' ? 'text-[#d4af37] font-bold' : 'text-[#8fa79c]'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-[10px]">المسبحة</span>
          </button>

          <button
            onClick={() => setActiveTab('quran')}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg ${
              activeTab === 'quran' ? 'text-[#d4af37] font-bold' : 'text-[#8fa79c]'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px]">المصحف</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg ${
              activeTab === 'calendar' ? 'text-[#d4af37] font-bold' : 'text-[#8fa79c]'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[10px]">التقويم</span>
          </button>
        </div>
      </footer>
    </div>
    </AudioProvider>
  );
}
