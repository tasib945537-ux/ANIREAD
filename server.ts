import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { communityRouter } from './src/server/communityRouter';
import { dubRouter } from './src/server/dubRouter';
import { offlineCatalogRouter, lookupOfflineCover } from './src/server/offlineCatalogRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Port 3000 is required by the dev environment; port 8080 is reserved for the Nginx proxy
const rawPort = process.env.PORT ? Number(process.env.PORT) : 3000;
const PORT = rawPort === 8080 || !rawPort ? 3000 : rawPort;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gemini-API-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
// Verify a device-supplied Gemini API key directly with Google's model-list endpoint.
// The key is accepted only in the request header and is never persisted or logged by ANIREAD.
app.post('/api/gemini-key-check', async (req: Request, res: Response) => {
  const candidateKey = String(req.header('x-gemini-api-key') || '').trim();
  if (candidateKey.length < 20 || candidateKey.length > 256 || /\s/.test(candidateKey)) {
    return res.status(400).json({ valid: false, message: 'The pasted value is incomplete or contains spaces. Copy the full API key again.' });
  }

  try {
    const googleResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
      method: 'GET',
      headers: { 'x-goog-api-key': candidateKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (googleResponse.ok) {
      return res.json({ valid: true, message: 'Google accepted this API key.' });
    }

    const googleBody: any = await googleResponse.json().catch(() => ({}));
    const googleMessage = String(googleBody?.error?.message || '');
    if (googleResponse.status === 401 || /API_KEY_INVALID|invalid api key/i.test(googleMessage)) {
      return res.status(401).json({ valid: false, message: 'Google rejected this API key. Check that it was copied completely and has not been deleted or rotated.' });
    }
    if (googleResponse.status === 403) {
      return res.status(403).json({ valid: false, message: 'Google received the key but denied access. Check the Google Cloud project, Gemini API enablement, and API-key restrictions.' });
    }
    if (googleResponse.status === 429) {
      return res.status(429).json({ valid: false, message: 'Google temporarily rate-limited verification. Wait a little and try again.' });
    }
    return res.status(502).json({ valid: false, message: 'Google could not verify this key right now. Check the AI Studio project/API settings and try again.' });
  } catch {
    return res.status(502).json({ valid: false, message: 'Could not reach Google to verify the key. Check the server connection and try again.' });
  }
});

// CORS-safe MangaDex image proxy for browser OCR. Only trusted MangaDex image hosts are allowed.
app.get('/api/manga-image', async (req: Request, res: Response) => {
  try {
    const rawUrl = String(req.query.url || '');
    if (!rawUrl || rawUrl.length > 2048) return res.status(400).json({ error: 'A valid image URL is required.' });
    const imageUrl = new URL(rawUrl);
    const allowedHosts = new Set(['uploads.mangadex.org', 'mangadex.org']);
    if (imageUrl.protocol !== 'https:' || !allowedHosts.has(imageUrl.hostname) || !/^\/(data|data-saver)\//.test(imageUrl.pathname)) {
      return res.status(400).json({ error: 'Only MangaDex image URLs are supported.' });
    }
    const upstream = await fetch(imageUrl.toString(), {
      headers: { 'User-Agent': 'AniRead/1.0', Referer: 'https://mangadex.org/' },
      signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Manga image could not be fetched.' });
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    if (!contentType.toLowerCase().startsWith('image/')) return res.status(415).json({ error: 'The source did not return an image.' });
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length || bytes.length > 12 * 1024 * 1024) return res.status(413).json({ error: 'Image is empty or too large.' });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(bytes);
  } catch (error: any) {
    return res.status(502).json({ error: 'Manga image proxy failed.', message: String(error?.message || error).slice(0, 160) });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'ANIREAD API', timestamp: new Date().toISOString() });
});
app.use(express.json({ limit: '15mb' }));

// Discord-style AniRead Community Router
app.use('/api/community', communityRouter);

// Verified Global Anime Dub Router
app.use('/api/dubs', dubRouter);

// Full Offline Anime Database Router (40,000+ Anime with Posters & Metadata)
app.use('/api/catalog', offlineCatalogRouter);

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
let aiClient: GoogleGenAI | null = null;
try {
  aiClient = new GoogleGenAI({
    apiKey: apiKey || undefined,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} catch (err) {
  console.warn('Failed to initialize GoogleGenAI:', err);
}

// In-memory translation cache to save latency and quota
const translationCache = new Map<string, string>();

// Map common language names, native names, and codes to ISO 639-1 language codes for Google Translate
const LANG_NAME_TO_CODE: Record<string, string> = {
  'bn': 'bn',
  'বাংলা': 'bn',
  'bengali': 'bn',
  'bangla': 'bn',
  'hi': 'hi',
  'हिन्दी': 'hi',
  'hindi': 'hi',
  'ja': 'ja',
  '日本語': 'ja',
  'japanese': 'ja',
  'en': 'en',
  'english': 'en',
  'es': 'es',
  'español': 'es',
  'spanish': 'es',
  'fr': 'fr',
  'français': 'fr',
  'french': 'fr',
  'de': 'de',
  'deutsch': 'de',
  'german': 'de',
  'ko': 'ko',
  '한국어': 'ko',
  'korean': 'ko',
  'zh': 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
  'chinese': 'zh-CN',
  'pt': 'pt',
  'pt-br': 'pt-BR',
  'portuguese': 'pt',
  'português': 'pt',
  'ru': 'ru',
  'русский': 'ru',
  'russian': 'ru',
  'ar': 'ar',
  'العربية': 'ar',
  'arabic': 'ar',
  'id': 'id',
  'indonesian': 'id',
  'it': 'it',
  'italiano': 'it',
  'italian': 'it',
  'tr': 'tr',
  'türkçe': 'tr',
  'turkish': 'tr',
  'vi': 'vi',
  'tiếng việt': 'vi',
  'vietnamese': 'vi',
  'th': 'th',
  'ไทย': 'th',
  'thai': 'th',
  'ur': 'ur',
  'اردو': 'ur',
  'urdu': 'ur',
  'tl': 'tl',
  'tagalog': 'tl',
  'filipino': 'tl',
  'ta': 'ta',
  'tamil': 'ta',
  'தமிழ்': 'ta',
  'te': 'te',
  'telugu': 'te',
  'తెలుగు': 'te',
  'mr': 'mr',
  'marathi': 'mr',
  'मराठी': 'mr',
  'gu': 'gu',
  'gujarati': 'gu',
  'pa': 'pa',
  'punjabi': 'pa',
  'ml': 'ml',
  'malayalam': 'ml',
  'kn': 'kn',
  'kannada': 'kn',
  'ne': 'ne',
  'nepali': 'ne',
  'fa': 'fa',
  'persian': 'fa',
  'farsi': 'fa',
  'pl': 'pl',
  'polski': 'pl',
  'polish': 'pl',
  'nl': 'nl',
  'dutch': 'nl',
  'sv': 'sv',
  'swedish': 'sv',
  'uk': 'uk',
  'ukrainian': 'uk',
};

const CODE_TO_NAME: Record<string, string> = {
  bn: 'Bengali (Bangla)',
  hi: 'Hindi',
  ja: 'Japanese',
  ko: 'Korean',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese (Simplified)',
  'zh-cn': 'Chinese (Simplified)',
  'zh-tw': 'Chinese (Traditional)',
  pt: 'Portuguese',
  'pt-br': 'Portuguese (Brazil)',
  ru: 'Russian',
  ar: 'Arabic',
  id: 'Indonesian',
  it: 'Italian',
  tr: 'Turkish',
  vi: 'Vietnamese',
  th: 'Thai',
  ur: 'Urdu',
  tl: 'Filipino / Tagalog',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ml: 'Malayalam',
  kn: 'Kannada',
  ne: 'Nepali',
  fa: 'Persian',
  pl: 'Polish',
  nl: 'Dutch',
  sv: 'Swedish',
  uk: 'Ukrainian',
};

function resolveLangCode(lang: string): string {
  if (!lang) return 'en';
  const clean = lang.trim().toLowerCase();
  if (LANG_NAME_TO_CODE[clean]) return LANG_NAME_TO_CODE[clean];
  if (clean.length === 2 || clean.length === 5) return clean;

  // Split on parentheses, slashes, or dashes (e.g. "Bengali (Bangla)" -> ["bengali", "bangla"])
  const tokens = clean.split(/[\(\)\/\-,\s]+/).filter(Boolean);
  for (const token of tokens) {
    if (LANG_NAME_TO_CODE[token]) return LANG_NAME_TO_CODE[token];
    if (token.length === 2) return token;
  }

  // Check substring matches
  for (const [key, code] of Object.entries(LANG_NAME_TO_CODE)) {
    if (clean.includes(key)) return code;
  }

  return 'en';
}

// Cooldown tracking for Gemini API rate limits (Free tier limit is 5 req/min)
let geminiCooldownUntil = 0;

// Multi-language translation endpoint
app.post('/api/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'Auto' } = req.body || {};
    if (typeof text !== 'string') return res.status(400).json({ error: 'Text is required.' });
    if (typeof targetLanguage !== 'string' || !targetLanguage.trim()) return res.status(400).json({ error: 'Target language is required.' });
    const input = text.trim();
    if (!input) return res.json({ translatedText: '', provider: 'empty' });
    if (input.length > 20000) return res.status(413).json({ error: 'Text is too long. Translate a smaller passage.' });

    const targetCode = resolveLangCode(targetLanguage);
    const sourceRaw = String(sourceLanguage || 'Auto').trim();
    const sourceCode = sourceRaw.toLowerCase() === 'auto' ? 'auto' : resolveLangCode(sourceRaw);
    if (targetCode === sourceCode && targetCode !== 'auto') {
      return res.json({ translatedText: input, cached: true, provider: 'same-language' });
    }

    const cacheKey = `${sourceCode}:${targetCode}:${input}`;
    const cached = translationCache.get(cacheKey);
    if (cached) return res.json({ translatedText: cached, cached: true, provider: 'cache' });

    const chunks: string[] = [];
    for (let offset = 0; offset < input.length; offset += 2800) chunks.push(input.slice(offset, offset + 2800));
    const translatedChunks: string[] = [];
    let provider = 'google-gtx';

    for (const chunk of chunks) {
      let translated = '';
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceCode)}&tl=${encodeURIComponent(targetCode)}&dt=t&q=${encodeURIComponent(chunk)}`;
      try {
        const response = await fetch(googleUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AniRead/1.0)' },
          signal: AbortSignal.timeout(8000),
        });
        if (response.ok) {
          const data: any = await response.json();
          if (Array.isArray(data) && Array.isArray(data[0])) {
            translated = data[0].map((part: any) => String(part?.[0] || '')).join('').trim();
          }
        }
      } catch { /* Try fallback. */ }

      if (!translated || translated === chunk.trim()) {
        if (chunk.length > 480) {
          return res.status(503).json({ error: 'Primary translation provider is unavailable for this long passage. Please retry.', code: 'TRANSLATION_UNAVAILABLE', retryable: true });
        }
        const mmSource = sourceCode === 'auto' ? 'ja' : sourceCode;
        const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(mmSource)}|${encodeURIComponent(targetCode)}`;
        try {
          const response = await fetch(mmUrl, {
            headers: { 'User-Agent': 'AniRead/1.0' },
            signal: AbortSignal.timeout(8000),
          });
          if (response.ok) {
            const data: any = await response.json();
            const candidate = String(data?.responseData?.translatedText || '').trim();
            if (candidate && !candidate.startsWith('MYMEMORY WARNING') && candidate !== chunk.trim()) {
              translated = candidate;
              provider = 'google-gtx+mymemory';
            }
          }
        } catch { /* Return a retryable error below. */ }
      }

      if (!translated || translated === chunk.trim()) {
        return res.status(503).json({ error: 'Translation providers are temporarily unavailable.', code: 'TRANSLATION_UNAVAILABLE', retryable: true });
      }
      translatedChunks.push(translated);
    }

    const translatedText = translatedChunks.join('');
    if (translationCache.size > 5000) translationCache.clear();
    translationCache.set(cacheKey, translatedText);
    return res.json({ translatedText, cached: false, provider });
  } catch (error: any) {
    console.error('Translation endpoint error:', error?.message || error);
    return res.status(503).json({ error: error?.message || 'Translation service is temporarily unavailable.', code: 'TRANSLATION_UNAVAILABLE', retryable: true });
  }
});

// Cache for translated manga page panels/dialogues
const mangaPageCache = new Map<string, any>();

function detectImageMimeType(buf: Buffer, headerContentType?: string | null): string | null {
  if (buf.length >= 4) {
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
    if (
      buf.length >= 12 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'image/webp';
    }
  }
  const cleanCt = (headerContentType || '').split(';')[0].trim().toLowerCase();
  if (cleanCt.startsWith('image/')) {
    return cleanCt;
  }
  return null;
}

function localizedPageLabel(pageNumber: number, targetCode: string): string {
  if (targetCode === 'bn') return `পৃষ্ঠা ${pageNumber}`;
  if (targetCode === 'hi') return `पृष्ठ ${pageNumber}`;
  if (targetCode === 'ja') return `ページ ${pageNumber}`;
  if (targetCode === 'es') return `Página ${pageNumber}`;
  return `Page ${pageNumber}`;
}

// Full Manga Page Image OCR & Translation endpoint
app.post('/api/translate-page', async (req: Request, res: Response) => {
  try {
    const {
      imageUrl,
      imageDataBase64,
      pageNumber = 1,
      chapterNumber = '1',
      mangaTitle = 'Manga',
      targetLanguage = 'bn',
      sourceLanguage = 'Auto',
      mangaId = '',
      chapterId = '',
      force = false,
    } = req.body;

    const targetCode = resolveLangCode(targetLanguage);
    const targetName =
      CODE_TO_NAME[targetCode] ||
      (targetCode === 'bn' ? 'Bengali (Bangla)' : targetCode === 'hi' ? 'Hindi' : targetLanguage);
    const sourceCode = String(sourceLanguage || 'Auto').toLowerCase() === 'auto'
      ? 'auto'
      : resolveLangCode(String(sourceLanguage));
    const sourceName = sourceCode === 'auto' ? 'auto-detected' : CODE_TO_NAME[sourceCode] || sourceLanguage;
    const cacheKey = `${mangaId || mangaTitle}:${chapterId || chapterNumber}:${chapterNumber}:p${pageNumber}:${sourceCode}:${targetCode}`;
    const defaultSummary = localizedPageLabel(pageNumber, targetCode);

    if (!force && mangaPageCache.has(cacheKey)) {
      const cachedPage = mangaPageCache.get(cacheKey);
      if (cachedPage?.dialogues?.length > 0 && cachedPage?.provider !== 'untranslated') {
        return res.json({
          ...cachedPage,
          cached: true,
        });
      }
    }

    let base64Image = '';
    let mimeType = 'image/jpeg';

    if (imageDataBase64 && typeof imageDataBase64 === 'string') {
      const match = imageDataBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1].toLowerCase();
        base64Image = match[2];
      } else {
        base64Image = imageDataBase64;
      }
    }

    if (!base64Image && imageUrl && typeof imageUrl === 'string') {
      try {
        let fetchUrl = imageUrl.trim();
        if (
          fetchUrl.includes('/api/manga-page') ||
          fetchUrl.includes('/api/proxy-image') ||
          fetchUrl.includes('/api/image-proxy')
        ) {
          try {
            const parsed = new URL(fetchUrl, 'http://localhost');
            const urlParam = parsed.searchParams.get('url');
            if (urlParam) {
              fetchUrl = urlParam;
            }
          } catch {
            const rawParam = fetchUrl.split('url=')[1];
            if (rawParam) {
              fetchUrl = decodeURIComponent(rawParam.split('&')[0]);
            }
          }
        }

        if (fetchUrl.startsWith('/')) {
          fetchUrl = `http://localhost:${PORT}${fetchUrl}`;
        }

        const candidateUrls = [fetchUrl];
        if (fetchUrl.includes('/data/')) {
          candidateUrls.push(fetchUrl.replace(/https:\/\/[^/]+\/data\//, 'https://uploads.mangadex.org/data/'));
          candidateUrls.push(fetchUrl.replace(/https:\/\/[^/]+\/data\//, 'https://uploads.mangadex.org/data-saver/'));
        } else if (fetchUrl.includes('/data-saver/')) {
          candidateUrls.push(
            fetchUrl.replace(/https:\/\/[^/]+\/data-saver\//, 'https://uploads.mangadex.org/data-saver/')
          );
        }

        const uniqueCandidates = Array.from(new Set(candidateUrls));
        for (const candidate of uniqueCandidates) {
          if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) continue;
          const imgFetch = await fetch(candidate, {
            signal: AbortSignal.timeout(10000),
            headers: {
              'User-Agent': 'AniRead/1.0 (https://ais-dev.run.app)',
              Referer: 'https://mangadex.org/',
            },
          }).catch(() => null);

          if (imgFetch && imgFetch.ok) {
            const arr = await imgFetch.arrayBuffer();
            const buf = Buffer.from(arr);
            const detectedMime = detectImageMimeType(buf, imgFetch.headers.get('content-type'));
            if (buf.byteLength > 200 && detectedMime) {
              base64Image = buf.toString('base64');
              mimeType = detectedMime;
              break;
            }
          }
        }
      } catch (err: any) {
        console.warn('Failed to fetch image for page translation:', err?.message);
      }
    }

    if (!base64Image) {
      return res.json({
        pageNumber,
        imageUrl: imageUrl || '',
        targetLanguage: targetCode,
        sourceLanguage,
        pageTitle: `Page ${pageNumber}`,
        summary: `Page ${pageNumber}`,
        summaryTranslated: defaultSummary,
        dialogues: [],
        provider: 'untranslated',
        errorCode: 'IMAGE_FETCH_FAILED',
        translatedAt: Date.now(),
        notice: 'Could not load manga page image for OCR. Wait for the page image to finish loading and click Retry.',
      });
    }

    // Prefer the user's device-local key for this request; fall back to the server environment key.
    // Never persist, log, or return the request header.
    const requestApiKey = String(req.header('x-gemini-api-key') || '').trim();
    const activeApiKey = requestApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    const activeClient = requestApiKey
      ? new GoogleGenAI({ apiKey: requestApiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } })
      : (aiClient || (activeApiKey ? new GoogleGenAI({ apiKey: activeApiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } }) : null));

    if (!activeApiKey || !activeClient) {
      return res.json({
        pageNumber,
        imageUrl: imageUrl || '',
        targetLanguage: targetCode,
        sourceLanguage,
        pageTitle: `Page ${pageNumber}`,
        summary: `Page ${pageNumber}`,
        summaryTranslated: defaultSummary,
        dialogues: [],
        provider: 'untranslated',
        errorCode: 'MISSING_API_KEY',
        translatedAt: Date.now(),
        notice:
          'Gemini API key is not configured for server-side Vision OCR. Add your key in ANIREAD Settings > Gemini API Key to translate manga pages.',
      });
    }

    // Check if Gemini is in rate-limit cooldown
    if (Date.now() < geminiCooldownUntil) {
      const remainingSec = Math.ceil((geminiCooldownUntil - Date.now()) / 1000);
      return res.json({
        pageNumber,
        imageUrl: imageUrl || '',
        targetLanguage: targetCode,
        sourceLanguage,
        pageTitle: `Page ${pageNumber}`,
        summary: `Page ${pageNumber}`,
        summaryTranslated: defaultSummary,
        dialogues: [],
        provider: 'untranslated',
        rateLimited: true,
        errorCode: 'RATE_LIMITED',
        retryInSeconds: remainingSec,
        notice: `AI vision cooldown active (${remainingSec}s remaining). Please wait and retry.`,
      });
    }

    // Attempt 1: Multimodal Vision with Gemini 4 Hydrogen
    try {
      const prompt = `You are an expert manga OCR & localization translator.
Analyze this manga page image (Page ${pageNumber} of "${mangaTitle}", Chapter ${chapterNumber}). The source language is ${sourceName}; translate only into ${targetName}.

MANDATORY INSTRUCTIONS:
Detect and translate EVERY SINGLE piece of visible text across all panels of the page without missing any speech bubble, thought bubble, caption box, margin title, vertical banner, or sound effect (SFX).

For each detected text region, output:
- id: incremental integer starting at 1
- box_2d: [ymin, xmin, ymax, xmax] as normalized integers from 0 to 1000 enclosing the text region
- originalText: exact transcribed text from the image
- translatedText: natural, fluent translation in ${targetName} (native script, e.g., বাংলা for Bengali, हिन्दी for Hindi, English for English)
- type: one of "bubble", "narration", "thought", "sfx", "heading", "caption"
- direction: "vertical" or "horizontal"
- fontSize: "small", "medium", "large", or "extra-large"
- background: "white", "dark", "transparent", or "screentone"
- fontColor: "black", "white", or "red"`;

      const response = await activeClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pageTitle: { type: Type.STRING },
              summary: { type: Type.STRING },
              summaryTranslated: { type: Type.STRING },
              dialogues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    box_2d: {
                      type: Type.ARRAY,
                      items: { type: Type.INTEGER },
                    },
                    originalText: { type: Type.STRING },
                    translatedText: { type: Type.STRING },
                    detectedLanguage: { type: Type.STRING },
                    type: { type: Type.STRING },
                    direction: { type: Type.STRING },
                    speaker: { type: Type.STRING },
                    fontSize: { type: Type.STRING },
                    background: { type: Type.STRING },
                    fontColor: { type: Type.STRING },
                  },
                  required: ['id', 'box_2d', 'originalText', 'translatedText', 'type'],
                },
              },
            },
            required: ['pageTitle', 'summary', 'summaryTranslated', 'dialogues'],
          },
        },
      });

      const rawText = (response.text || '').trim();
      const cleanedText = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const rawDialogues = Array.isArray(parsed.dialogues) ? parsed.dialogues : [];

        const dialogues = rawDialogues
          .filter((d: any) => (d.translatedText || d.originalText || '').trim().length > 0)
          .map((d: any, idx: number) => {
            let ymin = 0,
              xmin = 0,
              ymax = 0,
              xmax = 0;
            if (Array.isArray(d.box_2d) && d.box_2d.length === 4) {
              ymin = Number(d.box_2d[0]) || 0;
              xmin = Number(d.box_2d[1]) || 0;
              ymax = Number(d.box_2d[2]) || 0;
              xmax = Number(d.box_2d[3]) || 0;
            } else if (typeof d.top === 'number') {
              ymin = Math.round(d.top * 10);
              xmin = Math.round((d.left ?? 10) * 10);
              ymax = Math.round(ymin + (d.height ?? 10) * 10);
              xmax = Math.round(xmin + (d.width ?? 30) * 10);
            }

            ymin = Math.max(0, Math.min(980, ymin));
            xmin = Math.max(0, Math.min(980, xmin));
            ymax = Math.max(ymin + 15, Math.min(1000, ymax));
            xmax = Math.max(xmin + 15, Math.min(1000, xmax));

            return {
              id: d.id || idx + 1,
              originalText: (d.originalText || '').trim(),
              translatedText: (d.translatedText || d.originalText || '').trim(),
              detectedLanguage: d.detectedLanguage || 'auto',
              type: d.type || 'bubble',
              direction: d.direction || 'horizontal',
              speaker: d.speaker,
              fontSize: d.fontSize || 'medium',
              background: d.background || 'white',
              fontColor: d.fontColor || (d.background === 'dark' ? 'white' : 'black'),
              confidence: typeof d.confidence === 'number' ? d.confidence : 0.95,
              box: {
                ymin: ymin / 1000,
                xmin: xmin / 1000,
                ymax: ymax / 1000,
                xmax: xmax / 1000,
              },
              top: ymin / 10,
              left: xmin / 10,
              width: (xmax - xmin) / 10,
              height: (ymax - ymin) / 10,
            };
          });

        const pageData = {
          pageNumber,
          imageUrl: imageUrl || '',
          targetLanguage: targetCode,
          sourceLanguage,
          pageTitle: parsed.pageTitle || `Page ${pageNumber}`,
          summary: parsed.summary || 'Manga scene',
          summaryTranslated: parsed.summaryTranslated || defaultSummary,
          dialogues,
          provider: dialogues.length > 0 ? 'gemini-vision' : 'gemini-vision-empty',
          translatedAt: Date.now(),
          notice:
            dialogues.length === 0
              ? 'No dialogue text found on this illustration page.'
              : undefined,
        };

        if (dialogues.length > 0) {
          mangaPageCache.set(cacheKey, pageData);
        }
        return res.json(pageData);
      }

      return res.json({
        pageNumber,
        imageUrl: imageUrl || '',
        targetLanguage: targetCode,
        sourceLanguage,
        pageTitle: `Page ${pageNumber}`,
        summary: `Page ${pageNumber}`,
        summaryTranslated: defaultSummary,
        dialogues: [],
        provider: 'untranslated',
        errorCode: 'INVALID_VISION_OUTPUT',
        translatedAt: Date.now(),
        notice: 'Vision model returned non-JSON output. Please tap Retry.',
      });
    } catch (geminiError: any) {
      const msg = geminiError?.message || String(geminiError || '');
      const status = geminiError?.status;
      const is429 =
        status === 'RESOURCE_EXHAUSTED' ||
        status === 429 ||
        msg.includes('429') ||
        msg.includes('Quota exceeded');

      if (is429) {
        const match = msg.match(/retry in ([0-9.]+)s/i);
        const retrySec = match ? Math.ceil(parseFloat(match[1])) : 45;
        geminiCooldownUntil = Date.now() + retrySec * 1000;
        console.warn(`Gemini vision quota rate limit reached (429). Activating ${retrySec}s cooldown.`);
        return res.json({
          pageNumber,
          imageUrl: imageUrl || '',
          targetLanguage: targetCode,
          sourceLanguage,
          pageTitle: `Page ${pageNumber}`,
          summary: `Page ${pageNumber}`,
          summaryTranslated: defaultSummary,
          dialogues: [],
          provider: 'untranslated',
          rateLimited: true,
          errorCode: 'RATE_LIMITED',
          retryInSeconds: retrySec,
          notice: `AI vision rate limit reached. Retry in ${retrySec} seconds.`,
        });
      }

      const isAuthErr =
        status === 'PERMISSION_DENIED' ||
        status === 'INVALID_ARGUMENT' ||
        status === 400 ||
        status === 403 ||
        /api key|permission_denied|api_key_invalid/i.test(msg);

      console.warn('Gemini vision page translation failed:', msg);
      return res.json({
        pageNumber,
        imageUrl: imageUrl || '',
        targetLanguage: targetCode,
        sourceLanguage,
        pageTitle: `Page ${pageNumber}`,
        summary: `Page ${pageNumber}`,
        summaryTranslated: defaultSummary,
        dialogues: [],
        provider: 'untranslated',
        errorCode: isAuthErr ? 'API_KEY_INVALID' : 'VISION_ERROR',
        translatedAt: Date.now(),
        notice: isAuthErr
          ? 'Gemini API key is missing or invalid. Please check Settings > Secrets.'
          : `Vision OCR error: ${msg.slice(0, 140)}`,
      });
    }
  } catch (error: any) {
    console.error('Page translation error:', error);
    return res.status(500).json({
      error: 'Failed to translate manga page',
      message: error?.message || 'Internal server error',
    });
  }
});


// Shikimori public read-only proxy. The provider asks API clients to identify
// themselves with a User-Agent; keep this header on the server rather than mobile clients.
app.get('/api/shikimori/:resource', async (req: Request, res: Response) => {
  const resource = String(req.params.resource || '');
  if (!['animes', 'mangas'].includes(resource)) {
    return res.status(404).json({ error: 'Unsupported Shikimori resource' });
  }
  try {
    const target = new URL(`https://shikimori.one/api/${resource}`);
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') target.searchParams.set(key, value);
    }
    const upstream = await fetch(target.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ANIREAD/1.0 (https://github.com/tasib945537-ux/ANIREAD)',
      },
      signal: AbortSignal.timeout(10000),
    });
    const body = await upstream.text();
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=900');
    return res.status(upstream.status).type('application/json').send(body);
  } catch (error: any) {
    return res.status(502).json({ error: 'Shikimori proxy failed', message: error?.message });
  }
});

// Proxy for MangaDex API to avoid any client CORS blocks
app.get('/api/mangadex/*', async (req: Request, res: Response) => {
  try {
    const endpoint = req.params[0] + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    const targetUrl = `https://api.mangadex.org/${endpoint}`;

    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'AniRead/1.0 (+https://github.com/tasib945537-ux/ANIREAD)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });

    const responseText = await fetchRes.text();
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    if (fetchRes.status === 429) {
      const retryAfter = fetchRes.headers.get('Retry-After');
      if (retryAfter) res.setHeader('Retry-After', retryAfter);
    }
    return res.status(fetchRes.status).type('application/json').send(responseText);
  } catch (error: any) {
    return res.status(500).json({ error: 'Proxy fetch failed', message: error?.message });
  }
});

// Options preflight for image proxy
app.options(['/api/manga-page', '/api/proxy-image', '/api/image-proxy'], (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gemini-API-Key');
  return res.sendStatus(204);
});

// Proxy for Manga Chapter Page images & cover visuals to bypass mobile iframe/CSP/third-party restrictions
app.get(['/api/manga-page', '/api/proxy-image', '/api/image-proxy'], async (req: Request, res: Response) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).send('URL is required');

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return res.status(400).send('Invalid URL');
    }

    const host = parsed.hostname.toLowerCase();
    const allowedDomains = [
      'mangadex.org', 'mangadex.network', 'anilist.co', 'myanimelist.net', 'unsplash.com',
      'kitsu.io', 'kitsu.app', 'anime-planet.com', 'anidb.net', 'livechart.me', 'notify.moe',
      'imgur.com', 'crunchyroll.com', 'googleusercontent.com', 'gstatic.com', 'nocookie.net', 'fandom.com',
    ];
    const isAllowed = allowedDomains.some((domain) => host === domain || host.endsWith('.' + domain));

    if (!isAllowed) {
      return res.status(403).send('Forbidden hostname');
    }

    // Attempt 1: Fetch from specified URL
    let imageRes = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'AniRead/1.0 (https://ais-dev.run.app)',
        'Referer': 'https://mangadex.org/',
      },
    }).catch(() => null);

    // Attempt 2: If failed or returned non-200, try official uploads.mangadex.org fallback
    if (!imageRes || !imageRes.ok) {
      if (rawUrl.includes('/data/')) {
        const fallbackUrl = rawUrl.replace(/https:\/\/[^/]+\/data\//, 'https://uploads.mangadex.org/data/');
        imageRes = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'AniRead/1.0 (https://ais-dev.run.app)',
            'Referer': 'https://mangadex.org/',
          },
        }).catch(() => null);
      } else if (rawUrl.includes('/data-saver/')) {
        const fallbackUrl = rawUrl.replace(/https:\/\/[^/]+\/data-saver\//, 'https://uploads.mangadex.org/data-saver/');
        imageRes = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'AniRead/1.0 (https://ais-dev.run.app)',
            'Referer': 'https://mangadex.org/',
          },
        }).catch(() => null);
      }
    }

    // Attempt 3: If /data/ failed, try /data-saver/ on official uploads server
    if ((!imageRes || !imageRes.ok) && rawUrl.includes('/data/')) {
      const saverFallbackUrl = rawUrl.replace(/https:\/\/[^/]+\/data\//, 'https://uploads.mangadex.org/data-saver/');
      imageRes = await fetch(saverFallbackUrl, {
        headers: {
          'User-Agent': 'AniRead/1.0 (https://ais-dev.run.app)',
          'Referer': 'https://mangadex.org/',
        },
      }).catch(() => null);
    }

    // Attempt 4: If an AniList or external cover URL 404ed, attempt dynamic AniList GraphQL cover recovery
    if ((!imageRes || !imageRes.ok) && (rawUrl.includes('anilist.co') || rawUrl.includes('/cover/'))) {
      const matchId = rawUrl.match(/bx(\d+)/i) || rawUrl.match(/\/(\d+)\.(jpg|png|webp)/i);
      if (matchId && matchId[1]) {
        try {
          const gqlQuery = `query ($id: Int) { Media(id: $id, type: ANIME) { coverImage { extraLarge large } bannerImage } }`;
          const gqlRes = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: gqlQuery, variables: { id: Number(matchId[1]) } }),
            signal: AbortSignal.timeout(3000),
          });
          if (gqlRes.ok) {
            const gqlData = await gqlRes.json();
            const realUrl = gqlData?.data?.Media?.coverImage?.large || gqlData?.data?.Media?.coverImage?.extraLarge;
            if (realUrl && realUrl !== rawUrl) {
              imageRes = await fetch(realUrl, {
                headers: { 'User-Agent': 'AniRead/1.0' },
              }).catch(() => null);
            }
          }
        } catch {
          // ignore
        }
      }
    }

    if (!imageRes || !imageRes.ok) {
      return res.status(404).send('Image not found on the source CDN');
    }

    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    const arrayBuffer = await imageRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('Image proxy error:', error);
    return res.status(502).send('Image proxy temporarily unavailable');
  }
});

// High-speed Anime Cover Art Resolver with in-memory caching and AniList GraphQL lookup
const coverCache = new Map<string, { buffer: Buffer; contentType: string }>();

app.get('/api/anime-cover', async (req: Request, res: Response) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    const title = (req.query.title as string || '').trim();
    const id = (req.query.id as string || '').trim();
    const malId = (req.query.malId as string || '').trim();

    if (!title && !id && !malId) {
      return res.redirect('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80');
    }

    const cacheKey = (title || id || malId).toLowerCase();
    if (coverCache.has(cacheKey)) {
      const cached = coverCache.get(cacheKey)!;
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return res.send(cached.buffer);
    }

    // 1. Check local 40,000+ offline anime catalog first for instant zero-rate-limit cover resolution
    let realCoverUrl: string | null = lookupOfflineCover({
      id: id && !isNaN(Number(id)) ? Number(id) : undefined,
      malId: malId && !isNaN(Number(malId)) ? Number(malId) : undefined,
      title: title || undefined,
    });

    // 2. Fall back to AniList GraphQL if not found locally
    if (!realCoverUrl) {
      try {
        const gqlQuery = `
          query ($search: String, $id: Int, $idMal: Int) {
            Media(search: $search, id: $id, idMal: $idMal, type: ANIME) {
              id
              coverImage { extraLarge large medium }
              bannerImage
            }
          }
        `;
      const cleanSearch = title
        .replace(/season\s*\d+/i, '')
        .replace(/part\s*\d+/i, '')
        .replace(/vs\..*/i, '')
        .replace(/[—–:-].*$/, '')
        .trim();

      const variables: any = {};
      if (id && !isNaN(Number(id))) variables.id = Number(id);
      else if (malId && !isNaN(Number(malId))) variables.idMal = Number(malId);
      else if (cleanSearch || title) variables.search = cleanSearch || title;

      const anilistRes = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: gqlQuery, variables }),
        signal: AbortSignal.timeout(3500),
      });

        if (anilistRes.ok) {
          const data = await anilistRes.json();
          const media = data?.data?.Media;
          realCoverUrl = media?.coverImage?.extraLarge || media?.coverImage?.large || media?.coverImage?.medium || media?.bannerImage;
        }
      } catch {
        // fallback
      }
    }

    // If AniList query was empty, try MAL CDN
    if (!realCoverUrl && malId && !isNaN(Number(malId))) {
      realCoverUrl = `https://cdn.myanimelist.net/images/anime/${Math.floor(Number(malId) % 1000)}/${malId}l.jpg`;
    }

    if (!realCoverUrl) {
      realCoverUrl = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80';
    }

    const imgFetch = await fetch(realCoverUrl, {
      headers: { 'User-Agent': 'AniRead/1.0' },
      signal: AbortSignal.timeout(4000),
    });

    if (imgFetch.ok) {
      const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await imgFetch.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      coverCache.set(cacheKey, { buffer, contentType });
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return res.send(buffer);
    }

    return res.redirect(realCoverUrl);
  } catch (err) {
    return res.redirect('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80');
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.resolve(distPath, 'index.html'));

  if (!isProduction || !hasDist) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for HTML5 SPA routing in dev
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api/')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`AniRead server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
