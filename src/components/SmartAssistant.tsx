import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Trash2, 
  X, 
  Sparkles, 
  ExternalLink, 
  Search, 
  BookOpen, 
  HelpCircle, 
  BookMarked, 
  Layers, 
  Calendar, 
  Users, 
  Clock, 
  Compass, 
  Heart,
  ChevronDown,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { 
  generateSmartAssistantResponse, 
  UnifiedSearchResult 
} from '../utils/unifiedSearchEngine';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  results?: UnifiedSearchResult[];
  suggestions?: string[];
}

interface SmartAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, targetId?: string) => void;
  isFullPage?: boolean;
  initialQuery?: string;
}

const SAMPLE_QUESTIONS = [
  'وين دعاء كميل؟',
  'افتح زيارة عاشوراء',
  'شلون أصلي صلاة الاحتياط؟',
  'أريد أعمال ليلة الجمعة',
  'وين سورة يس؟',
  'أريد دعاء الفرج',
  'شنو أقرأ في يوم عاشوراء؟',
  'شلون اصلي صلاة الصبح',
  'سجدتا السهو وما يوجبهما',
  'ما هي مبطلات الصلاة؟',
  'دعاء الجوشن الكبير',
  'بوصلة القبلة'
];

export const SmartAssistant: React.FC<SmartAssistantProps> = ({
  isOpen,
  onClose,
  onNavigate,
  isFullPage = false,
  initialQuery
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'سلامٌ عليكم ورحمة الله وبركاته. أهلاً بكم في المساعد الذكي لتطبيق «نور العترة». أنا دليلك للبحث السريع والتنقل الذكي بين القرآن الكريم، مفاتيح الجنان، أحكام الصلاة وفتاوى السيد السيستاني، والمناسبات. كيف أخدمك اليوم؟',
      timestamp: 'الآن',
      suggestions: [
        'وين دعاء كميل؟',
        'افتح زيارة عاشوراء',
        'شلون أصلي صلاة الاحتياط؟',
        'أريد أعمال ليلة الجمعة'
      ]
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (!isFullPage) {
        inputRef.current?.focus();
      }
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery);
    }
  }, [isOpen, initialQuery]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    const currentTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: currentTime
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsProcessing(true);

    // 2. Process query via Unified Search Engine
    setTimeout(() => {
      try {
        const response = generateSmartAssistantResponse(text);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: response.replyText,
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          results: response.results,
          suggestions: response.followUpSuggestions
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant',
          text: 'عذراً، حدث خطأ أثناء معالجة السؤال. يرجى إعادة المحاولة أو التحقق من صيغة السؤال.',
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsProcessing(false);
      }
    }, 250);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'تم مسح المحادثة. يمكنك البدء بسؤال جديد عن الأدعية، الزيارات، السور القرآنية، أو الأحكام الفقهية.',
        timestamp: 'الآن',
        suggestions: [
          'وين دعاء كميل؟',
          'شلون أصلي صلاة الاحتياط؟',
          'وين سورة يس؟',
          'أريد دعاء الفرج'
        ]
      }
    ]);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'quran':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'mafatih':
        return <BookMarked className="w-4 h-4 text-amber-400" />;
      case 'prayer_learn':
      case 'prayer_ruling':
      case 'prayer_mistake':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'shakk':
        return <HelpCircle className="w-4 h-4 text-purple-400" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-orange-400" />;
      case 'infallibles':
        return <Users className="w-4 h-4 text-teal-400" />;
      case 'tool':
        return <Sparkles className="w-4 h-4 text-yellow-400" />;
      default:
        return <Search className="w-4 h-4 text-[#d4af37]" />;
    }
  };

  if (!isOpen && !isFullPage) return null;

  const containerClasses = isFullPage
    ? 'w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-130px)] rounded-3xl bg-[#0b1b15] border border-[#d4af37]/40 shadow-2xl overflow-hidden'
    : 'fixed z-50 bottom-4 left-4 right-4 sm:right-auto sm:w-[480px] h-[580px] max-h-[85vh] flex flex-col rounded-3xl bg-[#0b1b15]/95 backdrop-blur-xl border-2 border-[#d4af37]/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200';

  return (
    <div className={containerClasses} dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d261d] via-[#15382b] to-[#0a1e16] border-b border-[#234d3d] p-3.5 sm:p-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d4af37] to-amber-600 p-0.5 shadow-md flex items-center justify-center text-[#0b1b15] shrink-0 font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-[#f5ebd7] flex items-center gap-1.5">
                المساعد الذكي
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  بحث موحد موثق
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-[#97b3a6]">
              يفهم اللهجة ويوجهك داخل القرآن، مفاتيح الجنان، وفقه الصلاة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg text-[#97b3a6] hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
            title="مسح المحادثة"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {!isFullPage && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#97b3a6] hover:text-white hover:bg-[#1a4032] transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-tajawal scrollbar-thin scrollbar-thumb-[#1e4839]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-start' : 'items-end'
            } space-y-2 max-w-[92%] sm:max-w-[88%] ${msg.sender === 'user' ? 'mr-auto' : 'ml-auto'}`}
          >
            {/* Sender Label & Timestamp */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#8ea79b] px-1">
              {msg.sender === 'assistant' ? (
                <>
                  <Bot className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="font-bold text-[#d4af37]">نور العترة</span>
                </>
              ) : (
                <span className="font-bold text-emerald-300">أنت</span>
              )}
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Bubble */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-l from-emerald-800 to-emerald-900 text-white rounded-br-none shadow-md border border-emerald-600/40'
                  : 'bg-[#12281f] text-[#efe8d8] rounded-bl-none shadow-lg border border-[#234d3d]'
              }`}
            >
              <p className="whitespace-pre-line font-medium">{msg.text}</p>

              {/* Result Cards inside Assistant Bubble */}
              {msg.results && msg.results.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-[#234d3d] space-y-2.5">
                  <div className="text-[11px] font-bold text-[#d4af37] flex items-center justify-between">
                    <span>النتائج المباشرة ({msg.results.length}):</span>
                    <span className="text-[#8ea79b] font-normal">اضغط للفتح المباشر</span>
                  </div>

                  <div className="space-y-2">
                    {msg.results.slice(0, 4).map((res) => (
                      <div
                        key={res.id}
                        className="bg-[#0b1913] hover:bg-[#0f241c] border border-[#234d3d] hover:border-[#d4af37] p-2.5 rounded-xl transition-all group flex flex-col gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(res.category)}
                            <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-[#d4af37] transition-colors">
                              {res.title}
                            </h4>
                          </div>
                          {res.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#193d30] text-[#9fc2b2] border border-[#245341] shrink-0">
                              {res.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-[#a4beb2] line-clamp-2 leading-relaxed">
                          {res.snippet}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-[#173629] text-[10px]">
                          <span className="text-[#7d9b8e] truncate max-w-[220px]" title={res.source}>
                            المصدر: {res.source}
                          </span>

                          <button
                            onClick={() => {
                              onNavigate(res.targetTab, res.targetId);
                              if (!isFullPage) onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d4af37] hover:bg-amber-400 text-[#0b1913] font-bold transition-all shadow active:scale-95 shrink-0"
                          >
                            <span>فتح</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clickable Follow-up Suggestions */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {msg.suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(sug)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[#142e23] hover:bg-[#1e4838] text-[#c5ddd2] hover:text-[#d4af37] border border-[#275342] transition-all active:scale-95"
                  >
                    «{sug}»
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 p-3 bg-[#12281f] text-[#efe8d8] rounded-2xl w-fit border border-[#234d3d] text-xs">
            <Sparkles className="w-4 h-4 text-[#d4af37] animate-spin" />
            <span className="text-[#a4beb2]">جاري البحث في مصادر التطبيق الموثقة...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions Bar (Shown when only 1 message) */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 border-t border-[#1b3d30] bg-[#0c1f18] shrink-0">
          <div className="text-[11px] font-bold text-[#d4af37] mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>أسئلة شائعة مقترحة:</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SAMPLE_QUESTIONS.slice(0, 6).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="whitespace-nowrap text-xs px-2.5 py-1 rounded-xl bg-[#143126] hover:bg-[#1d4435] text-[#b9d4c7] hover:text-white border border-[#244f3d] transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-[#0a1813] border-t border-[#1b3d30] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب سؤالك (مثلاً: وين دعاء كميل؟ شلون أصلي؟)..."
              className="w-full bg-[#12281f] text-white placeholder-[#6f8d80] text-xs sm:text-sm rounded-xl py-2.5 px-3.5 pr-9 border border-[#234d3d] focus:outline-none focus:border-[#d4af37] transition-all"
            />
            <Search className="w-4 h-4 text-[#729283] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className={`p-2.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center shrink-0 ${
              inputText.trim() && !isProcessing
                ? 'bg-gradient-to-r from-[#d4af37] to-amber-500 text-[#0b1b15] hover:scale-105 active:scale-95'
                : 'bg-[#18362a] text-[#557567] cursor-not-allowed'
            }`}
            title="إرسال"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
