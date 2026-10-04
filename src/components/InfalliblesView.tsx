import React, { useState } from 'react';
import { Search, Sparkles, BookOpen, Star, ChevronDown, ChevronUp, Filter, Heart, Award, Shield, User } from 'lucide-react';
import { INFALLIBLES_LIST, STORIES_LIST, InfallibleProfile, InfallibleStory } from '../data/shiaInfallibles';

export const InfalliblesView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'profiles' | 'stories'>('profiles');
  const [selectedInfallibleId, setSelectedInfallibleId] = useState<string>(INFALLIBLES_LIST[0].id);

  // Search and filter state for stories
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterInfallible, setFilterInfallible] = useState<string>('all');
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(STORIES_LIST[0].id);

  const selectedProfile: InfallibleProfile =
    INFALLIBLES_LIST.find((item) => item.id === selectedInfallibleId) || INFALLIBLES_LIST[0];

  // Filter stories based on query, category, and figure
  const filteredStories = STORIES_LIST.filter((story) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      story.title.includes(searchQuery) ||
      story.content.includes(searchQuery) ||
      story.infallibleName.includes(searchQuery) ||
      story.moral.includes(searchQuery);

    const matchesCategory = filterCategory === 'all' || story.category === filterCategory;
    const matchesInfallible = filterInfallible === 'all' || story.infallibleId === filterInfallible;

    return matchesSearch && matchesCategory && matchesInfallible;
  });

  const categories = [
    'الكل',
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
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#143126] via-[#1c493a] to-[#122c22] p-5 border-2 border-[#d4af37]/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37]">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span>تُرَاثُ أَنْوَارِ الْهُدَى وَسُفُنِ النَّجَاةِ</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold font-quran text-[#f7ecd6] mt-1">
            سيرة أهل البيت (عليهم السلام) وقصصهم ومواقفهم
          </h2>
          <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-0.5">
            سيرة الأربعة عشر معصوماً مستندة إلى المصادر التاريخية والحديثية المعتبرة.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-2 bg-[#0d221b] p-1.5 rounded-xl border border-[#234d3d] shrink-0">
          <button
            onClick={() => setActiveSubTab('profiles')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'profiles'
                ? 'bg-[#d4af37] text-[#0b1311] shadow'
                : 'text-[#c0d4cb] hover:text-white'
            }`}
          >
            سيرة المعصومين (14)
          </button>
          <button
            onClick={() => setActiveSubTab('stories')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'stories'
                ? 'bg-[#d4af37] text-[#0b1311] shadow'
                : 'text-[#c0d4cb] hover:text-white'
            }`}
          >
            قصص ومواقف موثقة
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Infallibles Profiles (14 المعصومين) */}
      {activeSubTab === 'profiles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 14 Infallibles List */}
          <div className="lg:col-span-4 space-y-2 max-h-[700px] overflow-y-auto pr-1">
            <span className="text-xs font-bold text-[#d4af37] block mb-2 px-1">
              اختر الشخصية المباركة (١٤ معصوماً):
            </span>
            {INFALLIBLES_LIST.map((inf, idx) => (
              <button
                key={inf.id}
                onClick={() => setSelectedInfallibleId(inf.id)}
                className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                  selectedInfallibleId === inf.id
                    ? 'bg-[#183f32] border-[#d4af37] ring-1 ring-[#d4af37] shadow-lg'
                    : 'bg-[#0e231c] border-[#1d4436] hover:bg-[#143228] text-[#cbdad3]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#143126] border border-[#2b5947] flex items-center justify-center text-xs font-mono font-bold text-[#d4af37]">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-snug">{inf.name}</h4>
                    <span className="text-[11px] text-[#93b3a5]">{inf.honorific}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#102920] border border-[#234d3d] text-[#a4b5ad]">
                  {inf.role}
                </span>
              </button>
            ))}
          </div>

          {/* Right Column: Detailed Profile of Selected Infallible */}
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl bg-[#0e231c] border-2 border-[#d4af37]/40 p-6 shadow-2xl space-y-5">
              {/* Header with Title and Kunya */}
              <div className="border-b border-[#1f4a3b] pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                    {selectedProfile.role} • {selectedProfile.honorific}
                  </span>
                  <span className="text-xs text-[#a2beb3]">المرقد الشريف: {selectedProfile.shrine}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold font-quran text-[#f7ebd7] mt-1">
                  {selectedProfile.name} ({selectedProfile.honorific})
                </h3>
                <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-1">
                  {selectedProfile.title}
                </p>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#091712] border border-[#1a3d30]">
                  <span className="text-[#89a89b] block">الكنية الشريفة:</span>
                  <span className="font-bold text-white text-sm">{selectedProfile.kunya}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#091712] border border-[#1a3d30]">
                  <span className="text-[#89a89b] block">الولادة المباركة:</span>
                  <span className="font-bold text-white text-sm">{selectedProfile.birthDate}</span>
                  <span className="text-[10px] text-[#a4b5ad] block">{selectedProfile.birthPlace}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#091712] border border-[#1a3d30]">
                  <span className="text-[#89a89b] block">الشهادة / الوفاة:</span>
                  <span className="font-bold text-white text-sm">{selectedProfile.deathDate}</span>
                  <span className="text-[10px] text-[#a4b5ad] block">{selectedProfile.deathPlace}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#091712] border border-[#1a3d30]">
                  <span className="text-[#89a89b] block">الأب والأم:</span>
                  <span className="font-bold text-white">{selectedProfile.father}</span>
                  <span className="text-[11px] text-[#cbdad3] block">وأمه: {selectedProfile.mother}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#091712] border border-[#1a3d30]">
                  <span className="text-[#89a89b] block">مدة العمر المبارك:</span>
                  <span className="font-bold text-[#d4af37] text-sm">{selectedProfile.lifeSpan}</span>
                  {selectedProfile.imamatePeriod && (
                    <span className="text-[10px] text-[#93b3a5] block">الإمامة: {selectedProfile.imamatePeriod}</span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-[#091712] border border-[#1a3d30]">
                  <span className="text-[#89a89b] block">الأبناء:</span>
                  <span className="font-bold text-white text-xs">{selectedProfile.children}</span>
                </div>
              </div>

              {/* Biography (النبذة المختصرة) */}
              <div className="p-4 rounded-xl bg-[#0a1813] border border-[#1a3d30] space-y-1">
                <span className="text-xs font-bold text-[#d4af37] block">نبذة وسيرة موجزة:</span>
                <p className="text-xs sm:text-sm text-[#d4e2dc] font-amiri leading-relaxed">
                  {selectedProfile.bio}
                </p>
              </div>

              {/* Key Milestones and Events (أهم الأحداث والمواقف) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#d4af37] block">أهم الأحداث والمحطات في حياته:</span>
                <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-[#cbdad3]">
                  {selectedProfile.keyEvents.map((evt, i) => (
                    <li key={i} className="leading-relaxed bg-[#0a1813] p-2 rounded-lg border border-[#17382c]">
                      {evt}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Famous Quotes with verified sources */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#d4af37] block">من درر أقواله وأحاديثه الموثقة:</span>
                <div className="space-y-2">
                  {selectedProfile.famousQuotes.map((q, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#112a21] border border-[#1f4a3b] space-y-1">
                      <p className="font-quran text-sm sm:text-base text-[#f7ecd6] leading-relaxed">
                        «{q.text}»
                      </p>
                      <span className="text-[11px] text-[#d4af37] block font-mono">
                        المصدر: {q.source}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spiritual and Moral Lessons (الدروس والعبر المستفادة) */}
              <div className="p-4 rounded-xl bg-[#132c23] border border-[#23503f] space-y-2">
                <span className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>الدروس والعبر المستفادة من سيرته الشريفة:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#cbdad3]">
                  {selectedProfile.spiritualLessons.map((lesson, i) => (
                    <div key={i} className="flex items-start gap-2 bg-[#0c1f19] p-2 rounded-lg border border-[#1a3e31]">
                      <span className="text-[#d4af37] font-bold">•</span>
                      <span>{lesson}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Stories and Historic Stances (قصص ومواقف) */}
      {activeSubTab === 'stories' && (
        <div className="space-y-5">
          {/* Search and Filters Bar */}
          <div className="rounded-xl bg-[#0f241d] p-4 border border-[#1f4a3b] space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#a2beb3] absolute top-3 right-3" />
              <input
                type="text"
                placeholder="ابحث في القصص، اسم الإمام، العبرة أو الكلمات المفتاحية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a1813] border border-[#234d3d] rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-white placeholder-[#7f9e92] outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Category and Infallible Filter Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#a2beb3] font-semibold">الموضوع:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-[#173a2f] text-white border border-[#2b5947] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#d4af37]"
                >
                  <option value="all">جميع الموضوعات</option>
                  {categories.slice(1).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#a2beb3] font-semibold">الشخصية:</span>
                <select
                  value={filterInfallible}
                  onChange={(e) => setFilterInfallible(e.target.value)}
                  className="bg-[#173a2f] text-white border border-[#2b5947] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#d4af37]"
                >
                  <option value="all">جميع أهل البيت (ع)</option>
                  {INFALLIBLES_LIST.map((inf) => (
                    <option key={inf.id} value={inf.id}>
                      {inf.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[#8fa79c]">
                تم العثور على <strong>{filteredStories.length}</strong> قصة وموقف موثق
              </span>
            </div>
          </div>

          {/* Stories List Accordion */}
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
                    {/* Story Header (Always Visible) */}
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
