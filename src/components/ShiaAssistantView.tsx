import React, { useState } from 'react';
import { MessageSquare, Sparkles, Send, BookOpen, RefreshCw, Heart, HelpCircle, Shield, Award } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const ShiaAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'سلام عليكم ورحمة الله وبركاته. أهلاً بكم في «بصائر العترة»؛ نافذتكم الاستشارية المعرفية في عقائد، فقه، وتاريخ مدرسة أهل البيت (عليهم السلام)، المستندة إلى القرآن الكريم وتراث الثقلين الشريف ونهج البلاغة والصحيفة السجادية. كيف يمكنني خدمتكم اليوم في مسألة شرعية أو معرفية؟',
      timestamp: 'الآن',
    },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('عام');

  const quickQuestions = [
    'ما هي فلسفة تسبيح فاطمة الزهراء (ع) وفضله؟',
    'ما حكم الشك بين الركعة الثالثة والرابعة في صلاة العشاء؟',
    'ما هي معاني وأسرار حديث الثقلين في مصادر المسلمين؟',
    'لماذا يتم الإفطار عند الشيعة بعد زوال الحمرة المشرقية؟',
    'ما هي خصائص دولة الإمام المهدي (عج) عند ظهوره؟',
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/shia-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend.trim(),
          category,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء استرجاع الجواب');
      }

      const botMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'عذراً، لم أتمكن من الحصول على إجابة في الوقت الحالي.',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Error in shia assistant:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `تعذر الاتصال بخادم المعارف: ${err.message || 'يرجى إعادة المحاولة'}.`,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#143328] via-[#1a4a39] to-[#112d22] p-5 border-2 border-[#d4af37]/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37]">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span>الْمُسْتَشَارُ الْعَقَائِدِيُّ وَالْفِقْهِيُّ الشِّيعِيُّ (بَصَائِرُ الْعِتْرَةِ)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-quran text-white mt-1">
            اسأل في علوم وفقه أهل البيت (عليهم السلام)
          </h2>
          <p className="text-xs sm:text-sm text-[#cbdad3] font-amiri mt-0.5">
            إجابات مدعمة بالآيات القرآنية وروايات الكافي ونهج البلاغة وبحار الأنوار وفتاوى المراجع العظام.
          </p>
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2 bg-[#0c221a] p-1.5 rounded-xl border border-[#234d3d] text-xs">
          <span className="text-[#a2beb3]">التصنيف:</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#173a2f] text-white border border-[#2b5947] rounded-lg px-2 py-1 outline-none focus:border-[#d4af37]"
          >
            <option value="عام">عام</option>
            <option value="عقائد وكلام">عقائد الإمامية</option>
            <option value="أحكام وفقه">أحكام فقهية</option>
            <option value="سيرة وتاريخ">سيرة الأئمة</option>
            <option value="أخلاق وعرفان">أخلاق وأدعية</option>
          </select>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="space-y-1.5">
        <span className="text-xs text-[#a2beb3] block font-semibold">أسئلة شائعة يمكنك النقر عليها:</span>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-xs bg-[#0f241d] hover:bg-[#183a2e] text-[#cbdad3] hover:text-white px-3 py-1.5 rounded-xl border border-[#1f4a3b] transition-all disabled:opacity-50 text-right active:scale-98"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="rounded-2xl bg-[#091712] border border-[#1c4234] p-4 sm:p-6 shadow-2xl space-y-4 min-h-[420px] max-h-[600px] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-emerald-800 to-teal-700 text-white rounded-br-none shadow-md font-tajawal'
                  : 'bg-[#10271f] border border-[#224f3f] text-[#f2eee3] rounded-bl-none shadow-lg font-amiri text-justify'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="flex items-center gap-1.5 text-xs text-[#d4af37] font-bold mb-2 pb-1 border-b border-[#1b3e31] font-tajawal">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>بصائر العترة (مستند لمصادر مذهب أهل البيت):</span>
                </div>
              )}
              <div className="whitespace-pre-line text-sm sm:text-base leading-loose">{msg.text}</div>
              <div className="mt-2 text-[10px] text-left opacity-70 font-mono font-tajawal">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#10271f] border border-[#224f3f] text-xs text-[#d4af37] w-fit">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>جاري استحضار الأحاديث والفتاوى والأدلة المعتبرة...</span>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="rounded-2xl bg-[#0e231c] border border-[#1f4a3b] p-3 flex items-center gap-2 shadow-xl">
        <textarea
          rows={2}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="اكتب استفسارك العقائدي أو الفقهي أو التاريخي هنا..."
          className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-[#7f9e92] outline-none resize-none px-2"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputValue.trim()}
          className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#d4af37] to-amber-400 text-[#0b1311] hover:brightness-105 transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
        >
          <span>إرسال</span>
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[11px] text-[#789689] text-center leading-relaxed">
        تنبيه: الأجوبة الفقهية تعتمد على القواعد العامة لمذهب أهل البيت وفتاوى المراجع؛ للمسائل الفردية المعقدة يُرجى الرجوع للرسالة العملية لمرجع تقليدكم.
      </div>
    </div>
  );
};
