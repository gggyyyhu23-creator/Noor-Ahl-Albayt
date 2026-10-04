import React, { useState } from 'react';
import { Palette, Sparkles, Image as ImageIcon, Download, Edit3, Wand2, RefreshCw, Upload, Check } from 'lucide-react';

interface ShowcaseImage {
  id: string;
  url: string;
  title: string;
  prompt: string;
  category: string;
}

const INITIAL_SHOWCASE: ShowcaseImage[] = [
  {
    id: 'art-1',
    url: '/src/assets/images/shrine_golden_dome_1790924563350.jpg',
    title: 'قبة الذهب في الغروب الروحاني',
    prompt: 'مرقد إسلامي شريف بقبة ذهبية ومآذن شامخة وزخارف قاشانية فيروزية في وقت الغروب وسماء هادئة',
    category: 'أضرحة ومراقد',
  },
  {
    id: 'art-2',
    url: '/src/assets/images/turbah_prayer_1790924576345.jpg',
    title: 'سجدة الشكر وتربة كربلاء الحسينية',
    prompt: 'تربة صلاة حسينية من طين كربلاء المقدس مع سبحة خشب الزيتون وسجادة خضراء وإضاءة دافئة',
    category: 'صلوات وأدعية',
  },
  {
    id: 'art-3',
    url: '/src/assets/images/islamic_art_1790924595759.jpg',
    title: 'لوحة الخط الإسلامي الثلث المذهب',
    prompt: 'خط عربي إسلامي أصيل بحروف ذهبية مشعة وزخارف هندسية أندلسية وإسلامية باللازورد',
    category: 'خط وزخرفة',
  },
];

export const IslamicArtStudioView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState<string>('');
  const [stylePreset, setStylePreset] = useState<'calligraphy' | 'shrine' | 'spiritual'>('calligraphy');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results & Gallery
  const [generatedImages, setGeneratedImages] = useState<ShowcaseImage[]>(INITIAL_SHOWCASE);
  const [currentResult, setCurrentResult] = useState<string | null>(INITIAL_SHOWCASE[0].url);

  // Edit Mode State
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');

  const promptSuggestions = [
    'لوحة خط ثلث ذهبية: «إِنَّمَا وَلِيُّكُمُ اللَّهُ وَرَسُولُهُ وَالَّذِينَ آمَنُوا» مع زخارف فيروزية',
    'مرقد الإمام علي في النجف الأشرف مع القبة الذهبية والمنارات وأنوار الليل البهية',
    'بطاقة تهنئة فاخرة بذكرى مولد الإمام المهدي (عج) ليلة النصف من شعبان بنقوش إسلامية',
    'تصميم فني لحديث الثقلين «كتاب الله وعترتي أهل بيتي» مع كتاب مفتوح ونور علوي',
    'تربة كربلاء ومسبحة تسبيح الزهراء مع سحر هادئ وشمعة مضيئة',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage('يرجى كتابة وصف للوحة المطلوبة');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: stylePreset,
          aspectRatio,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'تعذر إنشاء اللوحة بالذكاء الاصطناعي');
      }

      if (data.imageUrl) {
        const newArt: ShowcaseImage = {
          id: `gen-${Date.now()}`,
          url: data.imageUrl,
          title: prompt.slice(0, 30) + '...',
          prompt: data.prompt || prompt,
          category: 'إنشاء بالذكاء الاصطناعي',
        };

        setGeneratedImages([newArt, ...generatedImages]);
        setCurrentResult(data.imageUrl);
      }
    } catch (err: any) {
      console.error('Error generating image:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء الاتصال بنموذج الذكاء الاصطناعي لتوليد الصور.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditImage = async () => {
    if (!editImageBase64 || !editPrompt.trim()) {
      setErrorMessage('يرجى تحديد الصورة وإدخال تعليمات التعديل');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: editImageBase64,
          editPrompt: editPrompt.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'تعذر تعديل اللوحة');
      }

      if (data.imageUrl) {
        const newArt: ShowcaseImage = {
          id: `edit-${Date.now()}`,
          url: data.imageUrl,
          title: 'صورة معدلة: ' + editPrompt.slice(0, 25),
          prompt: editPrompt,
          category: 'تعديل بالذكاء الاصطناعي',
        };
        setGeneratedImages([newArt, ...generatedImages]);
        setCurrentResult(data.imageUrl);
      }
    } catch (err: any) {
      console.error('Error editing image:', err);
      setErrorMessage(err.message || 'تعذر تعديل الصورة بالذكاء الاصطناعي.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (imgUrl: string, title: string) => {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `${title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#173a2f] via-[#215343] to-[#143429] p-5 border-2 border-[#d4af37]/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37]">
            <Palette className="w-4 h-4 text-[#d4af37]" />
            <span>اسْتُودِيُو اللَّوْحَاتِ وَالْبِطَاقَاتِ الْإِسْلَامِيَّةِ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-quran text-white mt-1">
            إنشاء وتعديل الصور الدينية بالذكاء الاصطناعي (Gemini)
          </h2>
          <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-0.5">
            صمم بطاقات التهنئة، لوحات الخط العربي الثلث المذهب، ومناظر الأضرحة والقباب المقدسة بمجرد كتابة الوصف.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 bg-[#0c221a] p-1.5 rounded-xl border border-[#234d3d] shrink-0">
          <button
            onClick={() => setActiveMode('create')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeMode === 'create'
                ? 'bg-[#d4af37] text-[#0b1311] shadow'
                : 'text-[#c0d4cb] hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>إنشاء لوحة</span>
          </button>
          <button
            onClick={() => setActiveMode('edit')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeMode === 'edit'
                ? 'bg-[#d4af37] text-[#0b1311] shadow'
                : 'text-[#c0d4cb] hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>تعديل صورة</span>
          </button>
        </div>
      </div>

      {/* Main Creation / Edit Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Input Controls Column */}
        <div className="lg:col-span-6 space-y-4">
          {activeMode === 'create' ? (
            <div className="rounded-2xl bg-[#0e231c] border border-[#1f4a3b] p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-[#d4af37] flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                <span>أدخل وصف اللوحة الإسلامية:</span>
              </h3>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="اكتب وصف اللوحة الإسلامية بالتفصيل (مثلاً: قبة ذهبية لمرقد الإمام الحسين ع تحت ضوء القمر مع خط ثلث 'يا حسين')..."
                  className="w-full bg-[#081510] border border-[#245241] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-[#7f9e92] outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Style Presets */}
              <div>
                <span className="text-xs text-[#a2beb3] block mb-1.5 font-semibold">نمط اللوحة:</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStylePreset('calligraphy')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      stylePreset === 'calligraphy'
                        ? 'bg-[#18483b] border-[#d4af37] text-white font-bold'
                        : 'bg-[#112a20] border-[#1d4334] text-[#a2beb3]'
                    }`}
                  >
                    خط عربي مذهب
                  </button>
                  <button
                    type="button"
                    onClick={() => setStylePreset('shrine')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      stylePreset === 'shrine'
                        ? 'bg-[#18483b] border-[#d4af37] text-white font-bold'
                        : 'bg-[#112a20] border-[#1d4334] text-[#a2beb3]'
                    }`}
                  >
                    أضرحة وقباب مقدسة
                  </button>
                  <button
                    type="button"
                    onClick={() => setStylePreset('spiritual')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      stylePreset === 'spiritual'
                        ? 'bg-[#18483b] border-[#d4af37] text-white font-bold'
                        : 'bg-[#112a20] border-[#1d4334] text-[#a2beb3]'
                    }`}
                  >
                    أجواء روحانية وتربة
                  </button>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <span className="text-xs text-[#a2beb3] block mb-1.5 font-semibold">أبعاد الصورة:</span>
                <div className="flex gap-2 text-xs">
                  {['1:1', '16:9', '4:3', '9:16'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-1.5 rounded-lg border font-mono transition-all ${
                        aspectRatio === ratio
                          ? 'bg-[#d4af37] text-[#0b1311] font-bold'
                          : 'bg-[#112a20] border-[#1d4334] text-[#a2beb3]'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <span className="text-xs text-[#a2beb3] block mb-1">اقتراحات ملهمة للوحات:</span>
                <div className="flex flex-wrap gap-1.5">
                  {promptSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrompt(sug)}
                      className="text-[11px] bg-[#11271f] hover:bg-[#193a2e] text-[#cbdad3] px-2.5 py-1 rounded-lg border border-[#1f4a3b] transition-all text-right"
                    >
                      {sug.slice(0, 36)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#d4af37] to-amber-400 text-[#0b1311] hover:brightness-105 shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري توليد اللوحة بالذكاء الاصطناعي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>توليد اللوحة الإسلامية</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* EDIT MODE */
            <div className="rounded-2xl bg-[#0e231c] border border-[#1f4a3b] p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-[#d4af37] flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>تعديل وتحسين اللوحة الإسلامية:</span>
              </h3>

              {/* File Upload or select existing */}
              <div className="space-y-2">
                <label className="text-xs text-[#a2beb3] block">حدد الصورة أو ارفع صورة من جهازك:</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#142e23] hover:bg-[#1a3d30] border border-[#275947] text-xs text-white cursor-pointer">
                    <Upload className="w-4 h-4 text-[#d4af37]" />
                    <span>رفع صورة من الجهاز</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {editImageBase64 && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> تم تحميل الصورة
                    </span>
                  )}
                </div>
              </div>

              {/* Prompt for editing */}
              <div>
                <label className="text-xs text-[#a2beb3] block mb-1">تعليمات التعديل والتطوير:</label>
                <textarea
                  rows={3}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="مثلاً: أضف كتابة ذهبية بخط الثلث 'يا حسين'، أو غيّر الإضاءة إلى وقت الغسق والغروب، أو أضف شمعة..."
                  className="w-full bg-[#081510] border border-[#245241] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-[#7f9e92] outline-none focus:border-[#d4af37]"
                />
              </div>

              <button
                type="button"
                onClick={handleEditImage}
                disabled={isGenerating || !editImageBase64 || !editPrompt.trim()}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:brightness-105 shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري تطبيق التعديلات بالذكاء الاصطناعي...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>تطبيق التعديلات على الصورة</span>
                  </>
                )}
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right / Preview & Active Result Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl bg-[#091712] border-2 border-[#d4af37]/40 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#d4af37] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                <span>اللوحة الحالية المعروضة:</span>
              </span>

              {currentResult && (
                <button
                  onClick={() => handleDownload(currentResult, 'islamic_art')}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#143226] text-white hover:bg-[#1a4031] text-xs font-semibold border border-[#255743]"
                  title="تنزيل اللوحة بدقة عالية"
                >
                  <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>تنزيل اللوحة</span>
                </button>
              )}
            </div>

            {/* Main Preview Container */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-black/40 border border-[#1b3d30] flex items-center justify-center">
              {currentResult ? (
                <img
                  src={currentResult}
                  alt="Islamic Artwork"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-all"
                />
              ) : (
                <div className="text-center p-8 text-[#719284] text-xs">
                  اضغط على زر التوليد لعرض اللوحة الفنية
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery / Showcase */}
      <div className="space-y-3 pt-4 border-t border-[#1d4334]">
        <h3 className="text-base font-bold text-[#d4af37] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#d4af37]" />
          <span>معرض اللوحات الإسلامية المختارة والمولدة:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {generatedImages.map((art) => (
            <div
              key={art.id}
              onClick={() => {
                setCurrentResult(art.url);
                setEditImageBase64(art.url);
              }}
              className="rounded-xl overflow-hidden bg-[#0d211a] border border-[#1f4a3b] hover:border-[#d4af37] transition-all cursor-pointer group shadow-lg"
            >
              <div className="aspect-video relative overflow-hidden bg-black/30">
                <img
                  src={art.url}
                  alt={art.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-black/70 text-[#d4af37] border border-[#d4af37]/40">
                  {art.category}
                </span>
              </div>
              <div className="p-3 space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">{art.title}</h4>
                <p className="text-[11px] text-[#8fa79c] line-clamp-1">{art.prompt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
