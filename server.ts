import express from 'express';
import path from 'path';
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

// API endpoint: Generate Islamic Art / Shrine / Calligraphy Image
// Feature: users use text prompts to create or edit images using gemini-3.1-flash-image-preview
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', style = 'calligraphy' } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'الوصف مطلوب لتوليد الصورة' });
      return;
    }

    // Enhance prompt for Islamic spiritual aesthetic
    let enhancedPrompt = prompt;
    if (style === 'calligraphy') {
      enhancedPrompt = `Masterpiece of ornate Islamic calligraphy in glowing gold Thuluth and Diwani script, sacred geometric arabesque motifs, lapis lazuli and turquoise background, ethereal lighting, high resolution, sacred art: ${prompt}`;
    } else if (style === 'shrine') {
      enhancedPrompt = `Magnificent Shia Islamic holy shrine dome and minarets in Karbala or Najaf architectural style, illuminated golden dome, Persian turquoise tilework mosaics, twilight sky with crescent moon, spiritual reverence, 8k photographic quality: ${prompt}`;
    } else if (style === 'spiritual') {
      enhancedPrompt = `Spiritual Islamic artwork, glowing warm lantern light, olive wood prayer beads, sacred holy stone, emerald green and gold silk texture, peaceful meditative atmosphere: ${prompt}`;
    }

    let response;
    // Primary: gemini-3.1-flash-image (or gemini-3.1-flash-image-preview), fallback to gemini-3.1-flash-lite-image if needed
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: '1K',
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn('Primary image model failed, trying fallback:', primaryErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: enhancedPrompt }],
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
        error: 'لم تتمكن الخدمة من استخراج الصورة المنتجة',
        details: textDescription,
      });
      return;
    }

    res.json({
      imageUrl,
      prompt: enhancedPrompt,
      notes: textDescription,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({
      error: error?.message || 'تعذر إنشاء اللوحة الإسلامية. تأكد من تفعيل صلاحيات مفتاح الذكاء الاصطناعي.',
    });
  }
});

// API endpoint: Edit Image with text prompts
app.post('/api/gemini/edit-image', async (req, res) => {
  try {
    const { base64Image, mimeType = 'image/png', editPrompt } = req.body;
    if (!base64Image || !editPrompt) {
      res.status(400).json({ error: 'الصورة وتعليمات التعديل مطلوبة' });
      return;
    }

    // Clean base64 prefix if present
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
            text: `Edit this Islamic image according to this instruction while preserving sacred Islamic aesthetic and beauty: ${editPrompt}`,
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
      res.status(500).json({ error: 'تعذر تعديل الصورة' });
      return;
    }

    res.json({ imageUrl });
  } catch (error: any) {
    console.error('Error editing image:', error);
    res.status(500).json({
      error: error?.message || 'حدث خطأ أثناء تعديل الصورة',
    });
  }
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
