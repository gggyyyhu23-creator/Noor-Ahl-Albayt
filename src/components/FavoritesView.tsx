import React, { useState } from 'react';
import { Star, Trash2, ArrowLeft, Bookmark, BookOpen, Sparkles, Heart } from 'lucide-react';
import { getFavorites, saveFavorites, FavoriteItem } from '../utils/favoritesStorage';

interface FavoritesViewProps {
  onNavigate: (tab: string, targetId?: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onNavigate }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => getFavorites());
  const [filterType, setFilterType] = useState<string>('all');

  const handleDelete = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    saveFavorites(updated);
  };

  const filteredFavs = favorites.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#143328] via-[#1a4a39] to-[#112d22] p-5 border-2 border-[#d4af37]/60 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37]">
            <Star className="w-4 h-4 fill-current text-[#d4af37]" />
            <span>قَائِمَةُ الْمُفَضَّلَاتِ وَالْمَحْفُوظَاتِ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-quran text-white mt-1">
            المفضلة والأعمال المحفوظة
          </h2>
          <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-0.5">
            الأدعية والزيارات والقصص وصفحات مفاتيح الجنان التي قمت بحفظها للرجوع إليها سريعاً.
          </p>
        </div>
        <div className="font-mono text-sm font-bold bg-[#0d221b] text-[#d4af37] px-3.5 py-1.5 rounded-xl border border-[#234d3d]">
          {favorites.length} عنصر
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'infallible', label: 'سيرة أهل البيت' },
          { id: 'occasion', label: 'المناسبات' },
          { id: 'mafatih', label: 'مفاتيح الجنان' },
          { id: 'dua', label: 'الأدعية' },
          { id: 'ziyarat', label: 'الزيارات' },
          { id: 'story', label: 'قصص أهل البيت' },
          { id: 'work', label: 'الأعمال اليومية' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterType === tab.id
                ? 'bg-[#d4af37] text-[#0b1311] font-bold shadow'
                : 'bg-[#122a21] text-[#bcd0c7] hover:bg-[#1a3d30] border border-[#234d3d]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Favorites List */}
      {filteredFavs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0a1712] border border-[#1b3d30] space-y-3">
          <Star className="w-10 h-10 text-[#285746] mx-auto" />
          <h4 className="text-base font-bold text-white">لا توجد عناصر محفوظة في المفضلة</h4>
          <p className="text-xs text-[#8fa79c] max-w-sm mx-auto">
            يمكنك الضغط على زر النجمة (★) في مفاتيح الجنان أو الأدعية أو القصص لإضافتها إلى قائمتك الخاصة هنا.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredFavs.map((fav) => (
            <div
              key={fav.id}
              className="p-4 rounded-xl bg-[#0e231c] border border-[#1f4a3b] hover:border-[#d4af37] transition-all flex flex-col justify-between gap-3 shadow"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#143226] text-[#d4af37] border border-[#245443]">
                    {fav.subtitle}
                  </span>
                  <span className="text-[10px] text-[#719183]">
                    {new Date(fav.savedAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white pt-1">{fav.title}</h4>
                {fav.snippet && (
                  <p className="text-xs text-[#bcd0c7] font-amiri line-clamp-2">
                    {fav.snippet}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#173a2e]">
                <button
                  onClick={() => onNavigate(fav.targetTab, fav.targetId)}
                  className="flex items-center gap-1 text-xs text-[#d4af37] hover:text-white font-bold"
                >
                  <span>فتح والانتقال</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(fav.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/50"
                  title="إزالة من المفضلة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
