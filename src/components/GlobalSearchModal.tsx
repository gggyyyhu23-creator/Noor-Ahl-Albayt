import React, { useState, useMemo } from 'react';
import { Search, X, Sparkles, BookOpen, Users, Calendar, ArrowLeft, Heart, Flame, Layers } from 'lucide-react';
import { unifiedSearch, UnifiedSearchResult } from '../utils/unifiedSearchEngine';

export interface SearchResultItem {
  id: string;
  section: string;
  sectionKey: 'quran' | 'infallibles' | 'stories' | 'mafatih' | 'library' | 'calendar' | 'prayer';
  title: string;
  snippet: string;
  targetTab: string;
  targetId?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, targetId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  const searchResults: SearchResultItem[] = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return [];

    const rawResults = unifiedSearch(query.trim(), 40);

    return rawResults.map((item) => {
      let sectionKey: SearchResultItem['sectionKey'] = 'mafatih';
      if (item.category === 'quran') sectionKey = 'quran';
      else if (item.category === 'infallibles') sectionKey = item.id.startsWith('story-') ? 'stories' : 'infallibles';
      else if (item.category === 'mafatih') sectionKey = item.id.startsWith('library-') ? 'library' : 'mafatih';
      else if (item.category === 'calendar') sectionKey = 'calendar';
      else if (item.category === 'prayer_learn' || item.category === 'prayer_ruling' || item.category === 'prayer_mistake' || item.category === 'shakk') {
        sectionKey = 'prayer';
      }

      return {
        id: item.id,
        section: item.categoryLabel,
        sectionKey,
        title: item.title,
        snippet: item.snippet,
        targetTab: item.targetTab,
        targetId: item.targetId,
      };
    });
  }, [query]);

  // Filtered by selected section category tab
  const filteredResults = useMemo(() => {
    if (selectedSectionFilter === 'all') return searchResults;
    return searchResults.filter((r) => r.sectionKey === selectedSectionFilter);
  }, [searchResults, selectedSectionFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-[#0b1b15] border-2 border-[#d4af37]/60 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-4 space-y-4">
        {/* Modal Search Header */}
        <div className="p-4 sm:p-5 border-b border-[#1f4a3b] bg-[#0e241c] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-white flex-1">
            <Search className="w-5 h-5 text-[#d4af37] shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="ابحث في القرآن، سيرة أهل البيت، مفاتيح الجنان، الأدعية، المناسبات..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-[#7f9e92] outline-none font-tajawal"
            />
          </div>

          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[#a2beb3] hover:text-white px-2 py-1 rounded bg-[#173a2f]"
            >
              مسح
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#143126] text-[#a2beb3] hover:text-white hover:bg-[#1e4637] transition-all"
            title="إغلاق البحث"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Filter Pills */}
        <div className="px-5 flex gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: `الكل (${searchResults.length})` },
            { id: 'quran', label: 'القرآن الكريم' },
            { id: 'infallibles', label: 'سيرة أهل البيت' },
            { id: 'stories', label: 'قصص أهل البيت' },
            { id: 'mafatih', label: 'مفاتيح الجنان' },
            { id: 'library', label: 'الأدعية والزيارات' },
            { id: 'calendar', label: 'المناسبات والتقويم' },
            { id: 'prayer', label: 'أحكام الصلاة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSectionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                selectedSectionFilter === tab.id
                  ? 'bg-[#d4af37] text-[#0b1311] font-bold shadow'
                  : 'bg-[#122a21] text-[#bcd0c7] hover:bg-[#1a3d30] border border-[#234d3d]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="px-5 pb-6 max-h-[60vh] overflow-y-auto space-y-3">
          {query.trim().length < 2 ? (
            <div className="py-12 text-center text-[#8fa79c] space-y-2">
              <Search className="w-8 h-8 mx-auto text-[#2b5947]" />
              <p className="text-sm">اكتب كلمة للبحث (مثل: عاشوراء، الغدير، كميل، الصبر، الفرج...)</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center text-[#8fa79c] space-y-2">
              <p className="text-sm">لم يتم العثور على نتائج مطابقة لـ «{query}».</p>
              <p className="text-xs text-[#6e8a7f]">جرب كلمة مفتاحية أخرى أو تحقق من الإملاء.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs text-[#8fa79c] font-semibold px-1">
                تم العثور على {filteredResults.length} نتيجة مرتبة حسب الأقسام:
              </div>

              {filteredResults.map((res) => (
                <div
                  key={res.id}
                  onClick={() => {
                    onNavigate(res.targetTab, res.targetId);
                    onClose();
                  }}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#0e231c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all cursor-pointer group shadow flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#163a2e] text-[#d4af37] font-semibold border border-[#275947]">
                        {res.section}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-[#d4af37] transition-colors leading-snug">
                      {res.title}
                    </h4>

                    <p className="text-xs text-[#bcd0c7] font-amiri leading-relaxed">
                      {res.snippet}
                    </p>
                  </div>

                  <button
                    className="flex items-center gap-1 text-xs text-[#d4af37] px-2.5 py-1 rounded-lg bg-[#143126] group-hover:bg-[#d4af37] group-hover:text-[#0b1311] font-semibold shrink-0 transition-colors mt-1"
                  >
                    <span>عرض</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
