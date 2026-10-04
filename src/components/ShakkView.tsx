import React, { useState } from 'react';
import { HelpCircle, CheckCircle, AlertTriangle, XCircle, Search, Sparkles } from 'lucide-react';
import { SHAKK_RULES } from '../data/shakkData';
import { ShakkRule } from '../types';

export const ShakkView: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedRule, setSelectedRule] = useState<ShakkRule | null>(SHAKK_RULES[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRules = SHAKK_RULES.filter((rule) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      rule.title.includes(searchQuery) ||
      rule.situation.includes(searchQuery) ||
      rule.ruling.includes(searchQuery);

    const matchesCategory = filterCategory === 'all' || rule.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#143126] via-[#1a4435] to-[#112c22] p-5 border-2 border-[#d4af37]/60 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37] mb-1">
          <HelpCircle className="w-4 h-4 text-[#d4af37]" />
          <span>فِقْهُ شُكُوكِ الصَّلَاةِ وَأَحْكَامُهَا الْجَعْفَرِيَّةُ</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-quran text-white">
          دليل أحكام الشك في الصلاة وصلاة الاحتياط وسجدتي السهو
        </h2>
        <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-1">
          وفق فتاوى المرجع الديني الأعلى السيد علي السيستاني وسائر فقهاء مدرسة أهل البيت (عليهم السلام).
        </p>
      </div>

      {/* Filter and Search */}
      <div className="rounded-xl bg-[#0f241d] p-4 border border-[#1f4a3b] space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#a2beb3] absolute top-3 right-3" />
          <input
            type="text"
            placeholder="ابحث في حالة الشك (مثلاً: بين الركعة الثالثة والرابعة، السهو، صلاة الفجر)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a1813] border border-[#234d3d] rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-white placeholder-[#7f9e92] outline-none focus:border-[#d4af37]"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterCategory === 'all' ? 'bg-[#d4af37] text-[#0b1311] font-bold' : 'bg-[#152e24] text-[#bcd0c7]'
            }`}
          >
            جميع الشكوك
          </button>
          <button
            onClick={() => setFilterCategory('correctable')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterCategory === 'correctable'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-[#152e24] text-emerald-300'
            }`}
          >
            الشكوك الصحيحة (تُعالج بصلاة الاحتياط)
          </button>
          <button
            onClick={() => setFilterCategory('ignorable')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterCategory === 'ignorable'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-[#152e24] text-amber-300'
            }`}
          >
            الشكوك التي لا يُعتنى بها
          </button>
          <button
            onClick={() => setFilterCategory('invalidating')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterCategory === 'invalidating'
                ? 'bg-red-700 text-white font-bold'
                : 'bg-[#152e24] text-red-300'
            }`}
          >
            الشكوك المبطلة للصلاة
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-2xl border transition-all ${
              rule.category === 'correctable'
                ? 'bg-[#0e231c] border-emerald-600/40 hover:border-emerald-500'
                : rule.category === 'ignorable'
                ? 'bg-[#162013] border-amber-600/40 hover:border-amber-500'
                : 'bg-[#1f1013] border-red-700/40 hover:border-red-600'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {rule.category === 'correctable' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : rule.category === 'ignorable' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span>{rule.title}</span>
              </h3>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
                  rule.category === 'correctable'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : rule.category === 'ignorable'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-red-950 text-red-300 border border-red-800'
                }`}
              >
                {rule.category === 'correctable'
                  ? 'شك صحيح'
                  : rule.category === 'ignorable'
                  ? 'لا اعتناء'
                  : 'مبطل للصلاة'}
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="p-2.5 rounded-lg bg-[#091612]/70 border border-[#16382c] text-[#cbdad3]">
                <strong className="text-[#d4af37] block text-xs mb-0.5">الحالة:</strong>
                {rule.situation}
              </div>

              <div className="p-2.5 rounded-lg bg-[#091612]/70 border border-[#16382c] text-white">
                <strong className="text-emerald-400 block text-xs mb-0.5">الحكم الشرعي:</strong>
                {rule.ruling}
              </div>

              <div className="p-2.5 rounded-lg bg-[#091612]/70 border border-[#16382c] text-[#cbdad3]">
                <strong className="text-amber-300 block text-xs mb-0.5">الكيفية والعمل:</strong>
                {rule.procedure}
              </div>

              <p className="text-[11px] text-[#8fa79c] pt-1 leading-relaxed">
                {rule.details}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
