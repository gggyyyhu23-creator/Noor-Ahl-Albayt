import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Star, 
  Filter, 
  Heart, 
  Award, 
  Shield, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Calendar, 
  BookMarked, 
  Bot, 
  ExternalLink, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2
} from 'lucide-react';
import { INFALLIBLES_LIST, STORIES_LIST, InfallibleProfile, InfallibleStory } from '../data/shiaInfallibles';
import { MAFATIH_BOOK_ITEMS } from '../data/mafatihBookData';
import { SHIA_OCCASIONS } from '../data/calendarOccasions';
import { 
  getFavorites, 
  toggleFavorite, 
  isFavorite, 
  getLastReadPosition, 
  saveLastReadPosition, 
  LastReadPosition 
} from '../utils/favoritesStorage';
import { normalizeArabicText } from '../utils/textSearch';

interface InfalliblesViewProps {
  initialInfallibleId?: string;
  onNavigate?: (tab: string, targetId?: string) => void;
  onAskAssistant?: (query: string) => void;
}

export const InfalliblesView: React.FC<InfalliblesViewProps> = ({
  initialInfallibleId,
  onNavigate,
  onAskAssistant,
}) => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'profiles' | 'stories'>('profiles');
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>(initialInfallibleId ? 'detail' : 'grid');
  const [selectedInfallibleId, setSelectedInfallibleId] = useState<string>(
    initialInfallibleId || INFALLIBLES_LIST[0].id
  );

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'kisa' | 'imams' | 'ladies'>('all');

  // Favorites state for fast visual response
  const [favMap, setFavMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    INFALLIBLES_LIST.forEach((inf) => {
      map[inf.id] = isFavorite(inf.id);
    });
    return map;
  });

  // Last read position
  const [lastRead, setLastRead] = useState<LastReadPosition | null>(() => {
    const pos = getLastReadPosition();
    if (pos && pos.sectionId === 'infallibles') {
      const exists = INFALLIBLES_LIST.some((inf) => inf.id === pos.itemId);
      if (exists) return pos;
    }
    return null;
  });

  // Handle external navigation (from search, calendar, or favorites)
  useEffect(() => {
    if (initialInfallibleId) {
      const match = INFALLIBLES_LIST.find((inf) => inf.id === initialInfallibleId);
      if (match) {
        setSelectedInfallibleId(initialInfallibleId);
        setViewMode('detail');
        setActiveTab('profiles');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [initialInfallibleId]);

  // Selected Profile
  const selectedIndex = useMemo(() => {
    const idx = INFALLIBLES_LIST.findIndex((item) => item.id === selectedInfallibleId);
    return idx >= 0 ? idx : 0;
  }, [selectedInfallibleId]);

  const selectedProfile: InfallibleProfile = useMemo(() => {
    return INFALLIBLES_LIST[selectedIndex] || INFALLIBLES_LIST[0];
  }, [selectedIndex]);

  // Previous & Next Infallibles for smooth sequential reading
  const prevInfallible = selectedIndex > 0 ? INFALLIBLES_LIST[selectedIndex - 1] : null;
  const nextInfallible = selectedIndex < INFALLIBLES_LIST.length - 1 ? INFALLIBLES_LIST[selectedIndex + 1] : null;

  // Open detail view and record last read
  const handleOpenDetail = (id: string) => {
    setSelectedInfallibleId(id);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const inf = INFALLIBLES_LIST.find((item) => item.id === id);
    if (inf) {
      const pos: LastReadPosition = {
        sectionId: 'infallibles',
        itemId: inf.id,
        itemTitle: `${inf.name} (${inf.honorific})`,
        savedAt: Date.now(),
      };
      saveLastReadPosition(pos);
      setLastRead(pos);
    }
  };

  // Toggle favorite with unified system
  const handleToggleFavorite = (e: React.MouseEvent, inf: InfallibleProfile) => {
    e.stopPropagation();
    const added = toggleFavorite({
      id: inf.id,
      type: 'infallible',
      title: inf.name,
      subtitle: `${inf.role} • ${inf.honorific}`,
      snippet: inf.title,
      targetTab: 'infallibles',
      targetId: inf.id,
    });
    setFavMap((prev) => ({ ...prev, [inf.id]: added }));
  };

  // Contextual smart assistant trigger (strictly grounded in verified data)
  const handleAskAssistantClick = (inf: InfallibleProfile) => {
    const query = `حدثني عن سيرة ${inf.name} (${inf.honorific}) وأهم المحطات في حياته الشريفة`;
    if (onAskAssistant) {
      onAskAssistant(query);
    } else if (onNavigate) {
      onNavigate('assistant', query);
    }
  };

  // Filter 14 Infallibles
  const filteredInfallibles = useMemo(() => {
    const qNorm = normalizeArabicText(searchQuery.trim());
    const kisaIds = new Set([
      'prophet-muhammad',
      'imam-ali',
      'fatima-al-zahra',
      'imam-al-hasan',
      'imam-al-husayn',
    ]);

    return INFALLIBLES_LIST.filter((inf) => {
      // Role filter
      if (roleFilter === 'kisa' && !kisaIds.has(inf.id)) return false;
      if (roleFilter === 'imams' && inf.role !== 'إمام') return false;
      if (roleFilter === 'ladies' && inf.role !== 'سيدة نساء العالمين') return false;

      // Text query filter
      if (!qNorm) return true;
      const combined = normalizeArabicText(
        `${inf.name} ${inf.title} ${inf.kunya} ${inf.father} ${inf.mother} ${inf.shrine} ${inf.bio}`
      );
      return combined.includes(qNorm);
    });
  }, [searchQuery, roleFilter]);

  // Stories Filters State (Preserved stories from existing dataset)
  const [storyQuery, setStoryQuery] = useState<string>('');
  const [storyCategory, setStoryCategory] = useState<string>('all');
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(STORIES_LIST[0]?.id || null);

  const filteredStories = useMemo(() => {
    const qNorm = normalizeArabicText(storyQuery.trim());
    return STORIES_LIST.filter((story) => {
      const matchesSearch =
        !qNorm ||
        normalizeArabicText(`${story.title} ${story.content} ${story.infallibleName} ${story.moral}`).includes(qNorm);
      const matchesCategory = storyCategory === 'all' || story.category === storyCategory;
      return matchesSearch && matchesCategory;
    });
  }, [storyQuery, storyCategory]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. TOP HEADER BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-[#112920] via-[#1a4436] to-[#0f251c] p-5 sm:p-7 border-2 border-[#d4af37]/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1.5 text-right w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-[#d4af37]">
            <Sparkles className="w-4 h-4 fill-current text-[#d4af37]" />
            <span>نُورُ الْعِتْرَةِ الطَّاهِرَةِ • ١٤ مَعْصُوماً</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-quran text-[#f7ecd6] leading-tight">
            سيرة أهل البيت (عليهم السلام)
          </h2>
          <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri max-w-2xl leading-relaxed">
            موسوعة سيرة المعصومين الأربعة عشر صلوات الله عليهم، مستندة إلى المصادر التاريخية والحديثية المعتبرة، مع خط زمني للمحطات، ودرر الأقوال، والروابط بمفاتيح الجنان والتقويم.
          </p>
        </div>

        {/* Uncluttered View Switcher */}
        <div className="flex items-center gap-1.5 bg-[#0a1813] p-1.5 rounded-xl border border-[#234d3d] shrink-0 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => {
              setActiveTab('profiles');
              setViewMode('grid');
            }}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'profiles'
                ? 'bg-[#d4af37] text-[#0b1311] shadow'
                : 'text-[#c0d4cb] hover:text-white'
            }`}
          >
            سيرة المعصومين (١٤)
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'stories'
                ? 'bg-[#d4af37] text-[#0b1311] shadow'
                : 'text-[#c0d4cb] hover:text-white'
            }`}
          >
            قصص ومواقف ({STORIES_LIST.length})
          </button>
        </div>
      </div>

      {/* 2. LAST READ RESUME BANNER */}
      {activeTab === 'profiles' && lastRead && viewMode === 'grid' && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-[#143328] via-[#1a4235] to-[#112a21] border border-[#d4af37]/50 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-[#9fc0b3] block">متابعة القراءة وآخر شخصية اطلعت عليها:</span>
              <h4 className="text-sm sm:text-base font-bold text-white font-quran">{lastRead.itemTitle}</h4>
            </div>
          </div>
          <button
            onClick={() => handleOpenDetail(lastRead.itemId)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#d4af37] text-[#0b1311] font-bold text-xs hover:bg-amber-400 transition-all shrink-0 active:scale-95 shadow"
          >
            <span>استئناف القراءة</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SECTION: 14 INFALLIBLES PROFILES                           */}
      {/* ============================================================== */}
      {activeTab === 'profiles' && (
        <>
          {/* VIEW MODE A: GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="space-y-5">
              {/* Search & Filter Bar */}
              <div className="rounded-xl bg-[#0d221b] p-4 border border-[#1d4738] space-y-3.5 shadow-md">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#a2beb3] absolute top-3.5 right-3.5" />
                  <input
                    type="text"
                    placeholder="ابحث في سيرة المعصومين (بالاسم، اللقب، الكنية، أو المرقد)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#081712] border border-[#234d3d] rounded-xl pr-10 pl-16 py-2.5 text-xs sm:text-sm text-white placeholder-[#7f9e92] outline-none focus:border-[#d4af37] transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute top-2.5 left-3 text-xs text-[#a2beb3] hover:text-white px-2 py-0.5 rounded bg-[#16362b]"
                    >
                      مسح
                    </button>
                  )}
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: 'الكل (١٤)' },
                      { id: 'kisa', label: 'النبي وأهل البيت (٥)' },
                      { id: 'imams', label: 'الأئمة (١٢)' },
                      { id: 'ladies', label: 'السيدات (١)' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setRoleFilter(f.id as any)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          roleFilter === f.id
                            ? 'bg-[#d4af37] text-[#0b1311] shadow'
                            : 'bg-[#143126] text-[#b8ccc3] hover:bg-[#1a3d30] border border-[#234d3d]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] text-[#8fa79c]">
                    عرض <strong>{filteredInfallibles.length}</strong> من أصل ١٤ معصوماً
                  </span>
                </div>
              </div>

              {/* Infallibles Cards Grid */}
              {filteredInfallibles.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#0a1712] border border-[#1b3d30] text-[#8fa79c] text-sm">
                  لا توجد شخصية مطابقة لمعايير البحث الحالية. جرب البحث باسم أو لقب آخر.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredInfallibles.map((inf, idx) => {
                    const isFav = favMap[inf.id];
                    return (
                      <div
                        key={inf.id}
                        onClick={() => handleOpenDetail(inf.id)}
                        className="group relative rounded-2xl bg-[#0d221b] border border-[#1d4738] hover:border-[#d4af37] hover:bg-[#112920] p-5 shadow-lg transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Top: Order and Favorite */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-full bg-[#163a2e] border border-[#275947] flex items-center justify-center text-[11px] font-mono font-bold text-[#d4af37]">
                                {idx + 1}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10271f] text-[#9fc0b3] border border-[#1a3d30] font-semibold">
                                {inf.role}
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleToggleFavorite(e, inf)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isFav
                                  ? 'bg-amber-500/20 text-[#d4af37] border-amber-500/40'
                                  : 'bg-[#10271f] text-[#698a7c] border-[#1a3d30] hover:text-[#d4af37]'
                              }`}
                              title={isFav ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current text-[#d4af37]' : ''}`} />
                            </button>
                          </div>

                          {/* Holy Name & Title */}
                          <h3 className="text-lg font-bold font-quran text-white group-hover:text-[#d4af37] transition-colors leading-snug">
                            {inf.name}
                          </h3>
                          <span className="text-[11px] text-[#93b3a5] block mt-0.5">
                            {inf.honorific}
                          </span>

                          <p className="text-xs text-[#cbdad3] font-amiri line-clamp-2 mt-2 leading-relaxed">
                            {inf.title}
                          </p>

                          {/* Kunya & Shrine snippet */}
                          <div className="mt-3 pt-3 border-t border-[#173a2e] space-y-1.5 text-[11px] text-[#8fa79c]">
                            <div className="flex items-center justify-between">
                              <span className="text-[#6d8f82]">الكنية:</span>
                              <span className="font-semibold text-[#cbdad3]">{inf.kunya}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#6d8f82]">المرقد:</span>
                              <span className="font-semibold text-[#cbdad3] truncate max-w-[150px]">
                                {inf.shrine.split('-')[0]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Action */}
                        <div className="mt-4 pt-3 border-t border-[#173a2e] flex items-center justify-between text-xs font-bold text-[#d4af37] group-hover:text-amber-300">
                          <span>عرض السيرة والخط الزمني</span>
                          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE B: DETAIL VIEW (صفحة تفاصيل الشخصية) */}
          {viewMode === 'detail' && (
            <div className="space-y-6">
              {/* Back & Quick Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d221b] p-3 rounded-xl border border-[#1e4839]">
                <button
                  onClick={() => setViewMode('grid')}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#143227] hover:bg-[#1a4234] border border-[#275947] text-xs font-bold text-[#d4af37] transition-all active:scale-95"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة إلى قائمة المعصومين (١٤)</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Prev Infallible */}
                  {prevInfallible && (
                    <button
                      onClick={() => handleOpenDetail(prevInfallible.id)}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#122a21] hover:bg-[#1a3d30] border border-[#234d3d] text-xs text-[#cbdad3] hover:text-white transition-all"
                      title={prevInfallible.name}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span>السابق</span>
                    </button>
                  )}

                  {/* Dropdown Quick Select */}
                  <select
                    value={selectedProfile.id}
                    onChange={(e) => handleOpenDetail(e.target.value)}
                    className="bg-[#122a21] text-white border border-[#234d3d] rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#d4af37]"
                  >
                    {INFALLIBLES_LIST.map((inf, i) => (
                      <option key={inf.id} value={inf.id}>
                        {i + 1}. {inf.name}
                      </option>
                    ))}
                  </select>

                  {/* Next Infallible */}
                  {nextInfallible && (
                    <button
                      onClick={() => handleOpenDetail(nextInfallible.id)}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#122a21] hover:bg-[#1a3d30] border border-[#234d3d] text-xs text-[#cbdad3] hover:text-white transition-all"
                      title={nextInfallible.name}
                    >
                      <span>التالي</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Infallible Profile Full Container */}
              <div className="rounded-2xl bg-[#0e231c] border-2 border-[#d4af37]/50 p-5 sm:p-7 shadow-2xl space-y-6">
                {/* 1. Header with Name, Role, and Action Buttons */}
                <div className="border-b border-[#1f4a3b] pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-[#183d30] text-[#d4af37] border border-[#275c49] font-bold">
                        {selectedProfile.role}
                      </span>
                      <span className="text-xs text-[#a2beb3]">
                        المرقد الشريف: <strong className="text-white">{selectedProfile.shrine}</strong>
                      </span>
                    </div>

                    {/* Action buttons: Favorite & Ask Smart Assistant */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleFavorite(e, selectedProfile)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow ${
                          favMap[selectedProfile.id]
                            ? 'bg-amber-500/20 text-[#d4af37] border-amber-500/40'
                            : 'bg-[#122a21] text-[#b8ccc3] border-[#234d3d] hover:text-[#d4af37]'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${favMap[selectedProfile.id] ? 'fill-current text-[#d4af37]' : ''}`} />
                        <span>{favMap[selectedProfile.id] ? 'في المفضلة' : 'حفظ في المفضلة'}</span>
                      </button>

                      <button
                        onClick={() => handleAskAssistantClick(selectedProfile)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37]/20 via-amber-500/20 to-[#143126] text-[#d4af37] border border-[#d4af37]/60 text-xs font-bold hover:bg-[#d4af37]/30 transition-all shadow"
                        title="اسأل المساعد الذكي عن هذه الشخصية"
                      >
                        <Bot className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>اسأل المساعد الذكي عن هذه الشخصية 🤖</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-extrabold font-quran text-[#f7ebd7] mt-3">
                    {selectedProfile.name}
                  </h3>
                  <span className="text-sm font-semibold text-[#d4af37] block mt-0.5">
                    {selectedProfile.honorific}
                  </span>
                  <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-2 max-w-3xl leading-relaxed">
                    <strong className="text-[#e2ece7]">الألقاب الشريفة:</strong> {selectedProfile.title}
                  </p>
                </div>

                {/* 2. Structured Information Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                  {/* الكنية */}
                  <div className="p-3.5 rounded-xl bg-[#091712] border border-[#1a3d30]">
                    <span className="text-[#89a89b] block mb-1">الكنية الشريفة:</span>
                    <span className="font-bold text-white text-sm">{selectedProfile.kunya}</span>
                  </div>

                  {/* الولادة */}
                  <div className="p-3.5 rounded-xl bg-[#091712] border border-[#1a3d30]">
                    <span className="text-[#89a89b] block mb-1">الولادة المباركة:</span>
                    <span className="font-bold text-white text-sm">{selectedProfile.birthDate}</span>
                    <span className="text-[10px] text-[#a4b5ad] block mt-0.5">{selectedProfile.birthPlace}</span>
                  </div>

                  {/* الشهادة / الوفاة */}
                  <div className="p-3.5 rounded-xl bg-[#091712] border border-[#1a3d30]">
                    <span className="text-[#89a89b] block mb-1">الشهادة / الوفاة:</span>
                    <span className="font-bold text-white text-sm">{selectedProfile.deathDate}</span>
                    <span className="text-[10px] text-[#a4b5ad] block mt-0.5">{selectedProfile.deathPlace}</span>
                  </div>

                  {/* العمر الشريف ومدة الإمامة */}
                  <div className="p-3.5 rounded-xl bg-[#091712] border border-[#1a3d30]">
                    <span className="text-[#89a89b] block mb-1">مدة العمر الشريف:</span>
                    <span className="font-bold text-[#d4af37] text-sm">{selectedProfile.lifeSpan}</span>
                    {selectedProfile.imamatePeriod && (
                      <span className="text-[10px] text-[#93b3a5] block mt-0.5">
                        الإمامة: {selectedProfile.imamatePeriod}
                      </span>
                    )}
                  </div>

                  {/* النسب (الأب والأم) */}
                  <div className="p-3.5 rounded-xl bg-[#091712] border border-[#1a3d30] col-span-2 sm:col-span-1">
                    <span className="text-[#89a89b] block mb-1">النسب المبارك:</span>
                    <span className="font-bold text-white">الأب: {selectedProfile.father}</span>
                    <span className="text-[11px] text-[#cbdad3] block mt-0.5">الأم: {selectedProfile.mother}</span>
                  </div>

                  {/* الذرية والزوج إن وجد */}
                  <div className="p-3.5 rounded-xl bg-[#091712] border border-[#1a3d30] col-span-2 sm:col-span-2 lg:col-span-3">
                    <span className="text-[#89a89b] block mb-1">الذرية والأسرة:</span>
                    <span className="font-bold text-white text-xs">{selectedProfile.children}</span>
                    {selectedProfile.spouse && (
                      <span className="text-[11px] text-[#a4b5ad] block mt-0.5">
                        الزوج / الزوجات: {selectedProfile.spouse}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Biography (نبذة السيرة) */}
                <div className="p-5 rounded-2xl bg-[#0a1813] border border-[#1a3d30] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#d4af37]">
                    <BookOpen className="w-4 h-4" />
                    <span>نبذة وسيرة موجزة:</span>
                  </div>
                  <p className="text-xs sm:text-base text-[#dce7e2] font-amiri leading-loose text-justify">
                    {selectedProfile.bio}
                  </p>
                </div>

                {/* 4. Vertical Timeline (الخط الزمني للمحطات التاريخية الموثقة) */}
                {selectedProfile.keyEvents && selectedProfile.keyEvents.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#d4af37]">
                      <Clock className="w-4 h-4" />
                      <span>الخط الزمني للمحطات والأحداث التاريخية الموثقة:</span>
                    </div>

                    <div className="relative pr-6 border-r-2 border-[#224e3e] space-y-4 py-2">
                      {selectedProfile.keyEvents.map((evt, i) => (
                        <div key={i} className="relative group">
                          {/* Golden Node on the vertical line */}
                          <div className="absolute -right-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#d4af37] border-2 border-[#0e231c] shadow group-hover:scale-125 transition-transform" />

                          <div className="p-3.5 rounded-xl bg-[#0a1813] border border-[#183a2d] hover:border-[#d4af37]/60 transition-colors">
                            <div className="flex items-center gap-2 text-[11px] text-[#d4af37] font-bold mb-1">
                              <span className="w-5 h-5 rounded-full bg-[#143226] border border-[#275947] flex items-center justify-center font-mono">
                                {i + 1}
                              </span>
                              <span>محطة تاريخية</span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri leading-relaxed">
                              {evt}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Historical Notes & Divergence (الملاحظات التاريخية والاختلافات الروائية) */}
                {selectedProfile.historicalNotes && (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1.5">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>الملاحظات التاريخية وتحقيق التواريخ والروايات:</span>
                    </span>
                    <p className="text-xs sm:text-sm text-[#dfd7c5] font-amiri leading-relaxed">
                      {selectedProfile.historicalNotes}
                    </p>
                  </div>
                )}

                {/* 6. Famous Quotes with exact sources (درر الأقوال والأحاديث الشريفة) */}
                {selectedProfile.famousQuotes && selectedProfile.famousQuotes.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>من درر أقواله وأحاديثه الموثقة بالمصادر:</span>
                    </span>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedProfile.famousQuotes.map((q, i) => (
                        <div key={i} className="p-4 rounded-xl bg-[#112a21] border border-[#1f4a3b] space-y-2">
                          <p className="font-quran text-sm sm:text-base text-[#f7ecd6] leading-relaxed">
                            «{q.text}»
                          </p>
                          <div className="pt-2 border-t border-[#183a2d] flex items-center justify-between text-[11px] text-[#d4af37] font-mono">
                            <span>المصدر: {q.source}</span>
                            <span className="text-[10px] text-[#8fa79c] font-sans">محقق</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. Spiritual Lessons (الدروس والعبر المستفادة) */}
                {selectedProfile.spiritualLessons && selectedProfile.spiritualLessons.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#132c23] border border-[#23503f] space-y-2">
                    <span className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>الدروس والعبر المستفادة من سيرته الشريفة:</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#cbdad3]">
                      {selectedProfile.spiritualLessons.map((lesson, i) => (
                        <div key={i} className="flex items-start gap-2 bg-[#0c1f19] p-2.5 rounded-lg border border-[#1a3e31]">
                          <span className="text-[#d4af37] font-bold">•</span>
                          <span>{lesson}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. Sources & References (المصادر المعتمدة) */}
                <div className="p-4 rounded-xl bg-[#091712] border border-[#1a3d30] text-xs space-y-1">
                  <span className="font-bold text-[#d4af37] flex items-center gap-1.5">
                    <BookMarked className="w-3.5 h-3.5" />
                    <span>المصادر الإمامية المعتمدة في التوثيق:</span>
                  </span>
                  <p className="text-[#a2beb3] font-mono leading-relaxed pt-1">
                    {selectedProfile.source}
                  </p>
                </div>

                {/* 9. Internal App Links (الروابط المتكاملة مع مفاتيح الجنان والتقويم) */}
                <div className="p-5 rounded-2xl bg-[#091712] border-2 border-[#1f4a3b] space-y-4">
                  <div className="border-b border-[#1b3e31] pb-2">
                    <h4 className="text-sm font-bold text-[#d4af37] flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <span>الروابط المتكاملة في التطبيق الخاصة بهذه الشخصية المباركة</span>
                    </h4>
                    <p className="text-[11px] text-[#8fa79c] mt-0.5">
                      انقر على أي مناسبة أو زيارة أو دعاء للانتقال المباشر إليها داخل التطبيق.
                    </p>
                  </div>

                  {/* 1. Related Calendar Occasions */}
                  {selectedProfile.relatedCalendarOccasionIds && selectedProfile.relatedCalendarOccasionIds.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#b4ccc1] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>المناسبات المرتبطة في التقويم الإسلامي:</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProfile.relatedCalendarOccasionIds.map((occId) => {
                          const occ = SHIA_OCCASIONS.find((o) => o.id === occId);
                          const title = occ ? occ.title : occId;
                          const dateStr = occ ? `[${occ.day}/${occ.month}]` : '';

                          return (
                            <button
                              key={occId}
                              onClick={() => onNavigate?.('calendar', occId)}
                              className="text-right p-2.5 rounded-xl bg-[#0f251d] hover:bg-[#16382c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all flex items-center justify-between text-xs group"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-white group-hover:text-[#d4af37] block">
                                  {title}
                                </span>
                                {dateStr && <span className="text-[10px] text-[#8fa79c]">{dateStr}</span>}
                              </div>
                              <span className="text-[10px] font-bold text-[#d4af37] px-2 py-1 rounded bg-[#0a1813] border border-[#234d3d] shrink-0">
                                فتح في التقويم ←
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Related Ziyarat in Mafatih */}
                  {selectedProfile.relatedZiyaratIds && selectedProfile.relatedZiyaratIds.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#b4ccc1] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                        <span>الزيارات الشريفة المرتبطة في مفاتيح الجنان:</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProfile.relatedZiyaratIds.map((zid) => {
                          const item = MAFATIH_BOOK_ITEMS.find((m) => m.id === zid);
                          const title = item ? item.title : zid;

                          return (
                            <button
                              key={zid}
                              onClick={() => onNavigate?.('mafatih', zid)}
                              className="text-right p-2.5 rounded-xl bg-[#0f251d] hover:bg-[#16382c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all flex items-center justify-between text-xs group"
                            >
                              <span className="font-bold text-white group-hover:text-[#d4af37] truncate max-w-[200px] sm:max-w-xs">
                                {title}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400 px-2 py-1 rounded bg-[#0a1813] border border-[#234d3d] shrink-0">
                                فتح الزيارة ←
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Related Duas in Mafatih */}
                  {selectedProfile.relatedDuaIds && selectedProfile.relatedDuaIds.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#b4ccc1] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>الأدعية والمناجاة المأثورة في مفاتيح الجنان:</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProfile.relatedDuaIds.map((did) => {
                          const item = MAFATIH_BOOK_ITEMS.find((m) => m.id === did);
                          const title = item ? item.title : did;

                          return (
                            <button
                              key={did}
                              onClick={() => onNavigate?.('mafatih', did)}
                              className="text-right p-2.5 rounded-xl bg-[#0f251d] hover:bg-[#16382c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all flex items-center justify-between text-xs group"
                            >
                              <span className="font-bold text-white group-hover:text-[#d4af37] truncate max-w-[200px] sm:max-w-xs">
                                {title}
                              </span>
                              <span className="text-[10px] font-bold text-amber-300 px-2 py-1 rounded bg-[#0a1813] border border-[#234d3d] shrink-0">
                                فتح الدعاء ←
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Navigation for easy continuity */}
                <div className="flex items-center justify-between pt-4 border-t border-[#1f4a3b]">
                  {prevInfallible ? (
                    <button
                      onClick={() => handleOpenDetail(prevInfallible.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#122a21] hover:bg-[#18392d] border border-[#234d3d] text-xs font-bold text-[#cbdad3] hover:text-[#d4af37] transition-all"
                    >
                      <ArrowRight className="w-4 h-4 text-[#d4af37]" />
                      <span>السابق: {prevInfallible.name}</span>
                    </button>
                  ) : <div />}

                  {nextInfallible ? (
                    <button
                      onClick={() => handleOpenDetail(nextInfallible.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#122a21] hover:bg-[#18392d] border border-[#234d3d] text-xs font-bold text-[#cbdad3] hover:text-[#d4af37] transition-all"
                    >
                      <span>التالي: {nextInfallible.name}</span>
                      <ArrowLeft className="w-4 h-4 text-[#d4af37]" />
                    </button>
                  ) : <div />}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 4. SECTION: STORIES AND HISTORIC STANCES (قصص ومواقف مأثورة)   */}
      {/* ============================================================== */}
      {activeTab === 'stories' && (
        <div className="space-y-5">
          {/* Search and Filters Bar */}
          <div className="rounded-xl bg-[#0f241d] p-4 border border-[#1f4a3b] space-y-3 shadow-md">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#a2beb3] absolute top-3.5 right-3.5" />
              <input
                type="text"
                placeholder="ابحث في القصص، اسم المعصوم، العبرة أو الكلمات المفتاحية..."
                value={storyQuery}
                onChange={(e) => setStoryQuery(e.target.value)}
                className="w-full bg-[#0a1813] border border-[#234d3d] rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#7f9e92] outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[#a2beb3] font-semibold">تصنيف العبرة:</span>
                <select
                  value={storyCategory}
                  onChange={(e) => setStoryCategory(e.target.value)}
                  className="bg-[#173a2f] text-white border border-[#2b5947] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#d4af37]"
                >
                  <option value="all">جميع التصنيفات</option>
                  {[
                    'الأخلاق',
                    'الصبر',
                    'العبادة',
                    'العلم',
                    'الشجاعة',
                    'الكرم',
                    'العفو',
                    'التعامل مع الناس',
                    'المواقف الاجتماعية',
                    'الأحداث التاريخية',
                  ].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[#8fa79c]">
                تم العثور على <strong>{filteredStories.length}</strong> قصة وموقف
              </span>
            </div>
          </div>

          {/* Stories List */}
          {filteredStories.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0a1712] border border-[#1b3d30] text-[#8fa79c] text-sm">
              لا توجد قصص مطابقة لمعايير البحث الحالية. جرب مصطلحات أخرى.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStories.map((story) => {
                const isExpanded = expandedStoryId === story.id;

                return (
                  <div
                    key={story.id}
                    className={`rounded-2xl border transition-all ${
                      isExpanded
                        ? 'bg-[#0f251e] border-[#d4af37] shadow-xl ring-1 ring-[#d4af37]/30'
                        : 'bg-[#0d2019] border-[#1d4335] hover:border-[#2a5d4a]'
                    }`}
                  >
                    {/* Story Header */}
                    <button
                      onClick={() => setExpandedStoryId(isExpanded ? null : story.id)}
                      className="w-full text-right p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#163a2e] text-[#d4af37] border border-[#275947] font-semibold">
                            {story.infallibleName}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#10271f] text-[#a4b5ad] border border-[#1f4a3b]">
                            {story.category}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white pt-1">
                          {story.title}
                        </h3>
                        <p className="text-xs text-[#a2beb3] font-amiri line-clamp-2">
                          {story.summary}
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-[#143227] text-[#d4af37] shrink-0 mt-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* Expanded Story Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-[#1b3e31] space-y-4">
                        {/* Narrative body */}
                        <div className="p-4 sm:p-5 rounded-xl bg-[#091712] border border-[#16382c]">
                          <p className="font-amiri text-sm sm:text-base text-[#e5f0eb] leading-loose text-justify">
                            {story.content}
                          </p>
                        </div>

                        {/* Moral / Lesson */}
                        <div className="p-3.5 rounded-xl bg-[#143126] border border-[#275947] flex items-start gap-2.5">
                          <Heart className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                          <div className="text-xs sm:text-sm text-[#e4efe9]">
                            <strong className="text-[#d4af37] ml-1">الدرس والعبرة المستفادة:</strong>
                            <span>{story.moral}</span>
                          </div>
                        </div>

                        {/* Notes on different narrations if applicable */}
                        {story.differentNarrationsNote && (
                          <div className="p-3 rounded-lg bg-[#182a22] border border-[#2d5243] text-xs text-[#b8ccc3]">
                            <strong className="text-amber-400 block mb-0.5">توضيح حول اختلاف الروايات:</strong>
                            {story.differentNarrationsNote}
                          </div>
                        )}

                        {/* Source Citation */}
                        <div className="text-xs font-mono text-[#8fa79c] flex items-center justify-between pt-1">
                          <span>المصدر والتوثيق: {story.source}</span>
                          <span className="text-[10px] text-[#d4af37] font-sans">معتبر ومحقق</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
