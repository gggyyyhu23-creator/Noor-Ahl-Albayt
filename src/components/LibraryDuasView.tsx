import React, { useState } from 'react';
import { BookOpen, Search, Sparkles, Star, ChevronDown, ChevronUp, Copy, Check, Type, Heart } from 'lucide-react';
import { LIBRARY_DUAS, DetailedDua } from '../data/mafatihDuas';

export const LibraryDuasView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [selectedImam, setSelectedImam] = useState<string>('all');
  const [expandedDuaId, setExpandedDuaId] = useState<string | null>(LIBRARY_DUAS[0].id);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Ziyarat Ashura 100x counters
  const [lanCount, setLanCount] = useState<number>(0);
  const [salamCount, setSalamCount] = useState<number>(0);

  const filteredDuas = LIBRARY_DUAS.filter((dua) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      dua.title.includes(searchQuery) ||
      dua.arabicTitle.includes(searchQuery) ||
      dua.simplifiedMeaning.includes(searchQuery) ||
      dua.imamOrFigure.includes(searchQuery) ||
      dua.arabicText.some((t) => t.includes(searchQuery));

    const matchesOccasion = selectedOccasion === 'all' || dua.occasionCategory === selectedOccasion;
    const matchesImam = selectedImam === 'all' || dua.imamOrFigure.includes(selectedImam);

    return matchesSearch && matchesOccasion && matchesImam;
  });

  const occasions = [
    { id: 'all', label: 'جميع المناسبات' },
    { id: 'friday', label: 'ليالي الجُمَع' },
    { id: 'ramadan', label: 'شهر رمضان' },
    { id: 'ashura', label: 'عاشوراء وكربلاء' },
    { id: 'daily', label: 'الأوراد اليومية والصباح' },
    { id: 'needs', label: 'الحاجات والشدائد' },
    { id: 'special', label: 'أدعية وزيارات خاصة' },
  ];

  const imamsList = [
    'الكل',
    'النبي محمد',
    'الإمام علي',
    'فاطمة الزهراء',
    'الإمام الحسين',
    'الإمام السجاد',
    'الإمام الهادي',
    'الإمام المهدي',
  ];

  const handleCopyText = (dua: DetailedDua) => {
    const full = `${dua.arabicTitle}\n\n${dua.arabicText.join('\n\n')}\n\n[من تطبيق نور العترة]`;
    navigator.clipboard.writeText(full);
    setCopiedId(dua.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFontSizeClass = () => {
    if (fontSize === 'normal') return 'text-lg sm:text-xl leading-relaxed';
    if (fontSize === 'large') return 'text-xl sm:text-2xl md:text-3xl leading-loose';
    return 'text-2xl sm:text-3xl md:text-4xl leading-loose';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#143328] via-[#1a4a39] to-[#122e23] p-5 border-2 border-[#d4af37]/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37]">
            <BookOpen className="w-4 h-4 text-[#d4af37]" />
            <span>مَكْتَبَةُ الْأَدْعِيَةِ وَالزِّيَارَاتِ الْمَأْثُورَةِ</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold font-quran text-[#f7ecd6] mt-1">
            مكتبة مفاتيح الجنان والصحيفة السجادية
          </h2>
          <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-0.5">
            النصوص الشريفة مضبوطة بالشكل، مع الشرح المبسط لمعانيها ومفرداتها، وفضلها، مرتبة بحسب المناسبات والأئمة.
          </p>
        </div>

        {/* Font size control */}
        <div className="flex items-center gap-1.5 bg-[#0d211a] p-1.5 rounded-xl border border-[#234d3d] shrink-0">
          <Type className="w-4 h-4 text-[#a2beb3] ml-1" />
          <button
            onClick={() => setFontSize('normal')}
            className={`px-2.5 py-1 rounded text-xs transition-all ${
              fontSize === 'normal' ? 'bg-[#d4af37] text-[#0b1311] font-bold' : 'text-[#a2beb3] hover:text-white'
            }`}
          >
            عادي
          </button>
          <button
            onClick={() => setFontSize('large')}
            className={`px-2.5 py-1 rounded text-xs transition-all ${
              fontSize === 'large' ? 'bg-[#d4af37] text-[#0b1311] font-bold' : 'text-[#a2beb3] hover:text-white'
            }`}
          >
            كبير
          </button>
          <button
            onClick={() => setFontSize('huge')}
            className={`px-2.5 py-1 rounded text-xs transition-all ${
              fontSize === 'huge' ? 'bg-[#d4af37] text-[#0b1311] font-bold' : 'text-[#a2beb3] hover:text-white'
            }`}
          >
            مكبر
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-[#0f241d] p-4 border border-[#1f4a3b] space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#a2beb3] absolute top-3 right-3" />
          <input
            type="text"
            placeholder="ابحث في عنوان الدعاء، الشرح المبسط، أو النص الشريف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a1813] border border-[#234d3d] rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-white placeholder-[#7f9e92] outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Occasion & Imam Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#a2beb3] font-semibold ml-1">المناسبة:</span>
            {occasions.map((occ) => (
              <button
                key={occ.id}
                onClick={() => setSelectedOccasion(occ.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedOccasion === occ.id
                    ? 'bg-[#d4af37] text-[#0b1311] font-bold'
                    : 'bg-[#142e24] text-[#bcd0c7] hover:bg-[#1a3d30]'
                }`}
              >
                {occ.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#a2beb3] font-semibold">حسب الإمام:</span>
            <select
              value={selectedImam}
              onChange={(e) => setSelectedImam(e.target.value)}
              className="bg-[#173a2f] text-white border border-[#2b5947] rounded-lg px-2.5 py-1 outline-none focus:border-[#d4af37]"
            >
              {imamsList.map((im) => (
                <option key={im} value={im === 'الكل' ? 'all' : im}>
                  {im}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Duas & Ziyarat Content List */}
      <div className="space-y-4">
        {filteredDuas.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0a1712] border border-[#1b3d30] text-[#8fa79c] text-sm">
            لم يتم العثور على أي دعاء أو زيارة مطابقة لمعايير البحث.
          </div>
        ) : (
          filteredDuas.map((dua) => {
            const isExpanded = expandedDuaId === dua.id;

            return (
              <div
                key={dua.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-[#0e231c] border-[#d4af37] shadow-2xl ring-1 ring-[#d4af37]/40'
                    : 'bg-[#0d2019] border-[#1c4234] hover:border-[#275c49]'
                }`}
              >
                {/* Header (Always Visible) */}
                <div
                  onClick={() => setExpandedDuaId(isExpanded ? null : dua.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#183d30] text-[#d4af37] font-semibold border border-[#245443]">
                        {dua.imamOrFigure}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#122a21] text-[#a2beb3]">
                        {dua.occasion}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold font-quran text-white pt-1">
                      {dua.arabicTitle}
                    </h3>

                    <p className="text-xs text-[#a2beb3] font-amiri line-clamp-1">
                      {dua.simplifiedMeaning}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyText(dua);
                      }}
                      className="p-2 rounded-lg bg-[#143227] text-[#a2beb3] hover:text-[#d4af37] hover:bg-[#1a3f32] transition-colors"
                      title="نسخ النص كاملاً"
                    >
                      {copiedId === dua.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <div className="p-2 rounded-lg bg-[#143227] text-[#d4af37]">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content Details */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-[#1b3e31] space-y-5">
                    {/* Simplified Meaning / Explanation Section (شرح مبسط لمعانيها) */}
                    <div className="p-4 rounded-xl bg-[#091712] border border-[#173a2e] space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#d4af37]">
                        <Sparkles className="w-4 h-4 text-[#d4af37]" />
                        <span>الشرح المبسط ومضامين الدعاء:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#d4e2dc] font-amiri leading-relaxed">
                        {dua.simplifiedMeaning}
                      </p>
                    </div>

                    {/* Virtues and Sources (فضلها ومصدرها) */}
                    <div className="p-3.5 rounded-xl bg-[#132c23] border border-[#23503f] space-y-1 text-xs">
                      <span className="font-bold text-[#d4af37] block">فضله ومقامه الشريف:</span>
                      <p className="text-[#c8d8d2] leading-relaxed font-amiri">{dua.virtue}</p>
                      <span className="text-[11px] text-[#8fa79c] block font-mono pt-1">
                        المصدر المعتمد: {dua.narratorAndSource}
                      </span>
                    </div>

                    {/* Vocabulary Explanations if any (معاني الكلمات الغريبة) */}
                    {dua.keywordsExplanation && dua.keywordsExplanation.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-[#d4af37] block">
                          معاني المفردات والعبارات العميقة:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {dua.keywordsExplanation.map((kw, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-[#091712] border border-[#16382c]">
                              <strong className="text-amber-300 font-quran text-sm block mb-0.5">
                                «{kw.word}»
                              </strong>
                              <span className="text-[#b2c8bf]">{kw.meaning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Interactive Counter for Ziyarat Ashura (100x Salam and 100x La'n) */}
                    {dua.id === 'ziyarat-ashura' && (
                      <div className="p-4 rounded-xl bg-[#1a0f12] border-2 border-red-800/60 space-y-3 text-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">
                          عداد اللعن والسلام (١٠٠ مرة) في زيارة عاشوراء
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* La'n counter */}
                          <div className="p-3 rounded-lg bg-[#261216] border border-red-800/40">
                            <span className="text-xs text-red-200 block mb-1">اللعن (100 مرة):</span>
                            <div className="font-mono text-2xl font-bold text-red-400 my-1">{lanCount} / 100</div>
                            <button
                              onClick={() => {
                                if (lanCount < 100) {
                                  setLanCount(lanCount + 1);
                                  if ('vibrate' in navigator) navigator.vibrate(25);
                                }
                              }}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-800 text-white hover:bg-red-700 active:scale-95"
                            >
                              + اضغط بعد قراءة اللعن
                            </button>
                          </div>

                          {/* Salam counter */}
                          <div className="p-3 rounded-lg bg-[#14261d] border border-emerald-800/40">
                            <span className="text-xs text-emerald-200 block mb-1">السلام (100 مرة):</span>
                            <div className="font-mono text-2xl font-bold text-emerald-400 my-1">{salamCount} / 100</div>
                            <button
                              onClick={() => {
                                if (salamCount < 100) {
                                  setSalamCount(salamCount + 1);
                                  if ('vibrate' in navigator) navigator.vibrate(25);
                                }
                              }}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-600 active:scale-95"
                            >
                              + اضغط بعد قراءة السلام
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full Sacred Arabic Text */}
                    <div className="p-5 sm:p-7 rounded-2xl bg-[#081510] border border-[#1b3e31] space-y-4">
                      <div className="text-center pb-3 border-b border-[#142f25]">
                        <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
                          النَّصُّ الشَّرِيفُ الْمَبْرُورُ
                        </span>
                      </div>

                      <div className="space-y-4 text-justify font-quran text-[#f7ecd6]">
                        {dua.arabicText.map((paragraph, pIdx) => (
                          <p key={pIdx} className={`${getFontSizeClass()} tracking-wide`}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
