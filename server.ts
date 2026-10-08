import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Shared Gemini client setup with mandatory telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API endpoint: Ask Shia Islamic Knowledge Assistant (Gemini 3.8 Flash)
app.post('/api/gemini/shia-qa', async (req, res) => {
  try {
    const { question, category = 'عام' } = req.body;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'السؤال مطلوب' });
      return;
    }

    const systemInstruction = `أنت "نور العترة" - مستشار وباحث إسلامي متخصص في معارف وعلوم مذهب أهل البيت عليهم السلام (المذهب الجعفري) وتراث الثقلين (القرآن الكريم والعترة الطاهرة).
مهمتك:
1. الإجابة بدقة وموثوقية استناداً إلى مصادر مدرسة أهل البيت (نهج البلاغة، الصحيفة السجادية، الكافي للكليني، من لا يحضره الفقيه، بحار الأنوار، مفاتيح الجنان، وفتاوى المراجع العظام كالمرجع الديني الأعلى السيد السيستاني).
2. عند الإجابة عن مسألة فقهية، اذكر القاعدة العامة ووضح أن الفتاوى التفصيلية يُرجع فيها لرسالة المكلف العملية ومرجع تقليده.
3. دعم الأجوبة بالآيات القرآنية وأحاديث الرسول (ص) والأئمة المعصومين (عليهم السلام) مع ذكر المصدر.
4. استخدم لغة عربية فصحى راقية، مفعمة بالأدب والاحترام والمحبة، والتنسيق الواضح باستخدام النقاط والعناوين.
5. لا تصدر أحكاماً تكفيرية أو تثير فتناً طائفية؛ ركز على القيم الإيمانية والأخلاقية الرفيعة لآل محمد (ع).`;

    const prompt = `التصنيف: ${category}
السؤال: ${question}

يرجى تقديم إجابة شافية، مدعومة بالنصوص الشريفة من القرآن وأحاديث أهل البيت (عليهم السلام) مع ذكر المنابع والمصادر.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const reply = response.text || 'عذراً، لم أتمكن من استحضار الإجابة حالياً. يرجى إعادة المحاولة.';
    res.json({ answer: reply });
  } catch (error: any) {
    console.error('Error in shia-qa:', error);
    res.status(500).json({
      error: error?.message || 'حدث خطأ أثناء معالجة السؤال الشرعي',
    });
  }
});

// API endpoint: Generate Hadith & Reflection Card
app.post('/api/gemini/hadith-reflection', async (req, res) => {
  try {
    const { topic = 'الصبر والتوكل' } = req.body;
    const prompt = `استخرج حديثاً شريفاً معتبراً عن أحد أئمة أهل البيت عليهم السلام (الإمام علي، فاطمة الزهراء، الإمام الحسين، الإمام الصادق، أو سائر المعصومين) في موضوع "${topic}".
أعد النتيجة بصيغة JSON حصراً بالشكل التالي:
{
  "imam": "اسم الإمام أو المعصوم عليه السلام",
  "hadithArabic": "متن الحديث الشريف مضبوطاً بالشكل التام",
  "source": "المصدر (مثلاً: الكافي، نهج البلاغة، بحار الأنوار، تحف العقول)",
  "explanation": "شرح بياني تربوي موجز (فقرة واحدة)",
  "practicalTip": "فائدة عملية لتطبيق الحديث في الحياة اليومية"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (error: any) {
    console.error('Error in hadith reflection:', error);
    res.status(500).json({
      error: 'تعذر توليد الحديث الشريف',
    });
  }
});

// Helper function to extract user-friendly error message from Google GenAI errors
function parseGenAIImageError(error: any): { code: string; message: string; details?: string } {
  const errMsg = error?.message || String(error || '');
  if (
    errMsg.includes('429') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('limit: 0') ||
    errMsg.includes('Quota exceeded')
  ) {
    return {
      code: 'PAID_KEY_REQUIRED',
      message: 'تتطلب نماذج توليد وتعديل الصور (Gemini 3.1 Flash Image) تفعيل حساب فوترة في Google AI Studio (Paid API Key). الحصة المجانية لنماذج الصور في Google محددة بصفر (Limit: 0).',
      details: 'يرجى ربط مشروع Google Cloud به حساب فوترة نشط من خلال لوحة Settings > Secrets في Google AI Studio لاستخدام ميزة توليد الصور الحية.',
    };
  }
  if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
    return {
      code: 'INVALID_API_KEY',
      message: 'مفتاح Gemini API غير صالح أو غير مهيأ بالشكل الصحيح.',
    };
  }
  return {
    code: 'GENERATION_ERROR',
    message: 'تعذر إنشاء اللوحة بالذكاء الاصطناعي حالياً. يرجى إعادة المحاولة لاحقاً.',
    details: errMsg.slice(0, 300),
  };
}

// API endpoint: Generate Islamic Art / Shrine / Calligraphy Image
// Feature: users use text prompts to create images using gemini-3.1-flash-lite-image
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', style = 'calligraphy' } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'الوصف مطلوب لتوليد الصورة' });
      return;
    }

    // Enhance prompt for sacred Islamic aesthetic and respectful representation
    let enhancedPrompt = prompt.trim();
    if (style === 'calligraphy') {
      enhancedPrompt = `Masterpiece of ornate Islamic calligraphy in glowing gold Thuluth and Diwani script, sacred geometric arabesque motifs, lapis lazuli and turquoise background, ethereal lighting, high resolution, sacred art: ${prompt.trim()}`;
    } else if (style === 'shrine') {
      enhancedPrompt = `Magnificent Shia Islamic holy shrine dome and minarets in Karbala or Najaf architectural style, illuminated golden dome, Persian turquoise tilework mosaics, twilight sky with crescent moon, spiritual reverence, 8k photographic quality: ${prompt.trim()}`;
    } else if (style === 'spiritual') {
      enhancedPrompt = `Spiritual Islamic artwork, glowing warm lantern light, olive wood prayer beads, sacred holy stone, emerald green and gold silk texture, peaceful meditative atmosphere: ${prompt.trim()}`;
    }

    // Supported aspect ratios in Gemini Image Models: '1:1', '3:4', '4:3', '9:16', '16:9'
    const allowedRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    const validAspectRatio = allowedRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    let response;
    // Primary: gemini-3.1-flash-lite-image (official default image generation model in @google/genai)
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: validAspectRatio as any,
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn('gemini-3.1-flash-lite-image error, trying gemini-3.1-flash-image:', primaryErr?.message);
      // Secondary attempt: gemini-3.1-flash-image
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: validAspectRatio as any,
          },
        },
      });
    }

    let imageUrl = '';
    let textDescription = '';

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          textDescription += part.text;
        }
      }
    }

    if (!imageUrl) {
      res.status(500).json({
        code: 'NO_IMAGE_RETURNED',
        error: 'لم تتمكن الخدمة من استخراج الصورة المنتجة من استجابة النموذج',
        details: textDescription,
      });
      return;
    }

    res.json({
      imageUrl,
      prompt: enhancedPrompt,
      notes: textDescription,
      modelUsed: 'gemini-3.1-flash-lite-image',
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    const parsed = parseGenAIImageError(error);
    const status = parsed.code === 'PAID_KEY_REQUIRED' ? 429 : 500;
    res.status(status).json({
      code: parsed.code,
      error: parsed.message,
      details: parsed.details,
    });
  }
});

// API endpoint: Edit Image with text prompts
app.post('/api/gemini/edit-image', async (req, res) => {
  try {
    const { base64Image, editPrompt } = req.body;
    if (!base64Image || !editPrompt || typeof editPrompt !== 'string' || !editPrompt.trim()) {
      res.status(400).json({ error: 'الصورة وتعليمات التعديل مطلوبة' });
      return;
    }

    // Extract mime type if formatted as data URL
    let mimeType = 'image/png';
    const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9+]+);base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }

    // Clean base64 prefix
    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: `Edit this Islamic image according to this instruction while preserving sacred Islamic aesthetic and beauty: ${editPrompt.trim()}`,
          },
        ],
      },
    });

    let imageUrl = '';
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      res.status(500).json({ code: 'NO_IMAGE_RETURNED', error: 'تعذر تعديل الصورة' });
      return;
    }

    res.json({ imageUrl, modelUsed: 'gemini-3.1-flash-lite-image' });
  } catch (error: any) {
    console.error('Error editing image:', error);
    const parsed = parseGenAIImageError(error);
    const status = parsed.code === 'PAID_KEY_REQUIRED' ? 429 : 500;
    res.status(status).json({
      code: parsed.code,
      error: parsed.message,
      details: parsed.details,
    });
  }
});

// Cache for Quran Page SVGs (in-memory)
const quranSvgCache = new Map<number, string>();

// API endpoint: Proxy & Cache Quran Vector SVG Page (1 - 604)
app.get('/api/quran/page-svg/:page', async (req, res) => {
  try {
    const pageNum = parseInt(req.params.page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 604) {
      res.status(400).send('Invalid page number (1-604)');
      return;
    }

    if (quranSvgCache.has(pageNum)) {
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.send(quranSvgCache.get(pageNum));
      return;
    }

    const padded = pageNum.toString().padStart(3, '0');
    const upstreamUrl = `https://www.mp3quran.net/api/quran_pages_svg/${padded}.svg`;
    const response = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NoorAhlAlBayt/1.0)',
      },
    });

    if (!response.ok) {
      res.status(502).send('Failed to fetch SVG page upstream');
      return;
    }

    const svgText = await response.text();
    // Cache in memory (cap at 120 pages to conserve memory)
    if (quranSvgCache.size > 120) {
      const firstKey = quranSvgCache.keys().next().value;
      if (firstKey !== undefined) quranSvgCache.delete(firstKey);
    }
    quranSvgCache.set(pageNum, svgText);

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.send(svgText);
  } catch (error: any) {
    console.error('Error fetching Quran SVG page:', error);
    res.status(500).send('Error retrieving SVG page');
  }
});

// Cache for Quran Ayah Timings (in-memory)
const quranTimingCache = new Map<string, any>();

// API endpoint: Proxy & Cache Quran Ayah Timings & Polygons
app.get('/api/quran/timing/:surah/:readId', async (req, res) => {
  try {
    const surah = parseInt(req.params.surah, 10);
    const readId = parseInt(req.params.readId, 10);

    if (isNaN(surah) || surah < 1 || surah > 114 || isNaN(readId) || readId < 1) {
      res.status(400).json({ error: 'Invalid surah (1-114) or readId' });
      return;
    }

    const cacheKey = `${readId}_${surah}`;
    if (quranTimingCache.has(cacheKey)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.json(quranTimingCache.get(cacheKey));
      return;
    }

    const upstreamUrl = `https://www.mp3quran.net/api/v3/ayat_timing?surah=${surah}&read=${readId}`;
    const response = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NoorAhlAlBayt/1.0)',
      },
    });

    if (!response.ok) {
      res.status(502).json({ error: 'Failed to fetch timings upstream' });
      return;
    }

    const data = await response.json();
    if (quranTimingCache.size > 300) {
      const firstKey = quranTimingCache.keys().next().value;
      if (firstKey !== undefined) quranTimingCache.delete(firstKey);
    }
    quranTimingCache.set(cacheKey, data);

    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Quran timings:', error);
    res.status(500).json({ error: 'Error retrieving timings' });
  }
});

// Cache for all 604 Quran pages text
const quranPagesCache = new Map<number, any>();

function preloadQuranPages() {
  try {
    const quranJsonPath = path.resolve(__dirname, 'public/data/quran/quranComplete.json');
    if (!fs.existsSync(quranJsonPath)) {
      console.warn('quranComplete.json not found on disk at', quranJsonPath);
      return;
    }
    const rawData = fs.readFileSync(quranJsonPath, 'utf-8');
    const completeQuran = JSON.parse(rawData);

    for (const surah of completeQuran) {
      for (const ayah of surah.ayahs) {
        const pageNum = ayah.page;
        if (!quranPagesCache.has(pageNum)) {
          quranPagesCache.set(pageNum, []);
        }
        quranPagesCache.get(pageNum).push({
          surahNumber: surah.number,
          surahName: surah.name,
          ayahNumber: ayah.numberInSurah,
          globalAyahNumber: ayah.number,
          text: ayah.text,
          juz: ayah.juz,
        });
      }
    }
    console.log(`Preloaded ${quranPagesCache.size} Quran pages in memory.`);
  } catch (err) {
    console.error('Failed preloading Quran pages:', err);
  }
}

preloadQuranPages();

// API endpoint: Get authentic Quran text for a specific page (1 to 604)
app.get('/api/quran/page/:page', (req, res) => {
  const pageNum = parseInt(req.params.page, 10);
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 604) {
    res.status(400).json({ error: 'Page number must be between 1 and 604' });
    return;
  }

  const pageAyahs = quranPagesCache.get(pageNum);
  if (!pageAyahs || pageAyahs.length === 0) {
    res.status(404).json({ error: `Page ${pageNum} not found` });
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.json({
    page: pageNum,
    ayahs: pageAyahs,
  });
});

// Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
