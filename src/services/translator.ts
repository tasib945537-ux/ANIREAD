import { TranslationTarget } from '../types/anime';

export const SUPPORTED_LANGUAGES: TranslationTarget[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '' },
  { code: 'bn', name: 'Bengali (Bangla)', nativeName: 'বাংলা', flag: '' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Tagalog', flag: '' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '' },
  { code: 'fa', name: 'Persian / Farsi', nativeName: 'فارسی', flag: '' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '' },
];

const memoryCache = new Map<string, string>();
const inFlightTranslations = new Map<string, Promise<string>>();
const TRANSLATION_API_BASE = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function stableTextHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function translationEndpoint(path: string): string {
  return TRANSLATION_API_BASE ? `${TRANSLATION_API_BASE}${path}` : path;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Server-first free translation with public-provider fallbacks and persistent caching. */
export async function translateText(
  text: string,
  targetLangCode: string,
  sourceLang: string = 'English'
): Promise<string> {
  const cleanText = String(text || '').trim();
  if (!cleanText) return '';
  const target = String(targetLangCode || 'en').toLowerCase();
  const source = String(sourceLang || 'auto');
  if (target === 'en' && source.toLowerCase() === 'english') return cleanText;

  const cacheKey = `tr:v2:${source.toLowerCase()}:${target}:${stableTextHash(cleanText)}:${cleanText.length}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;
  try {
    const saved = localStorage.getItem(cacheKey);
    if (saved) { memoryCache.set(cacheKey, saved); return saved; }
  } catch { /* storage unavailable */ }
  const pending = inFlightTranslations.get(cacheKey);
  if (pending) return pending;

  const task = (async () => {
    const remember = (value: string) => {
      const result = value.trim();
      if (!result || result === cleanText) return '';
      memoryCache.set(cacheKey, result);
      try { localStorage.setItem(cacheKey, result); } catch { /* storage quota */ }
      return result;
    };

    // 1) Use ANIREAD's own API first. This avoids browser CORS issues with Google endpoints
    // and lets web + Capacitor use the same translation service.
    try {
      const response = await fetchWithTimeout(translationEndpoint('/api/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, targetLanguage: target, sourceLanguage: source }),
      }, 9000);
      if (response.ok) {
        const data = await response.json();
        const result = remember(String(data?.translatedText || ''));
        if (result) return result;
      }
    } catch { /* Continue to independent public providers. */ }

    // 2) Google Translate's keyless endpoint. Keep chunks modest for reliable mobile requests.
    try {
      const pieces: string[] = [];
      for (let offset = 0; offset < cleanText.length; offset += 3500) {
        const piece = cleanText.slice(offset, offset + 3500);
        const src = source.toLowerCase() === 'auto' || source.length !== 2 ? 'auto' : source.toLowerCase();
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(piece)}`;
        const response = await fetchWithTimeout(url, {}, 10000);
        if (!response.ok) throw new Error(`Google Translate returned ${response.status}`);
        const data = await response.json();
        const translated = Array.isArray(data) && Array.isArray(data[0])
          ? data[0].map((chunk: any) => chunk?.[0] || '').join('')
          : '';
        if (!translated) throw new Error('Google Translate returned an empty result');
        pieces.push(translated);
      }
      const result = remember(pieces.join(''));
      if (result) return result;
    } catch { /* Continue to MyMemory. */ }

    // 3) MyMemory fallback for shorter text.
    if (cleanText.length <= 480) {
      try {
        const src = source.toLowerCase() === 'auto' ? 'en' : (source.length === 2 ? source : 'ja');
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${encodeURIComponent(src)}|${encodeURIComponent(target)}`;
        const response = await fetchWithTimeout(url, {}, 8000);
        if (response.ok) {
          const data = await response.json();
          const result = remember(String(data?.responseData?.translatedText || ''));
          if (result) return result;
        }
      } catch { /* Report a real failure instead of pretending original text was translated. */ }
    }

    throw new Error('Translation services are temporarily unavailable. Check your internet connection and retry.');
  })().finally(() => inFlightTranslations.delete(cacheKey));

  inFlightTranslations.set(cacheKey, task);
  return task;
}

export interface MangaPageDialogue {
  id: number;
  originalText: string;
  translatedText: string;
  detectedLanguage?: string;
  type: 'bubble' | 'narration' | 'sfx' | 'thought' | 'heading' | 'caption';
  direction?: 'vertical' | 'horizontal';
  speaker?: string;
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
  background?: 'white' | 'dark' | 'transparent' | 'screentone';
  fontColor?: 'black' | 'white' | 'red';
  confidence?: number;
  box?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TranslatedMangaPageResult {
  pageNumber: number;
  imageUrl: string;
  targetLanguage: string;
  sourceLanguage?: string;
  pageTitle?: string;
  summary?: string;
  summaryTranslated?: string;
  dialogues: MangaPageDialogue[];
  provider?: string;
  cached?: boolean;
  notice?: string;
  errorCode?: string;
  rateLimited?: boolean;
  retryInSeconds?: number;
}

const pageMemoryCache = new Map<string, TranslatedMangaPageResult>();

function getLocalizedPageLabel(pageNumber: number, targetLanguage: string): string {
  const code = (targetLanguage || 'en').toLowerCase();
  if (code === 'bn') return `পৃষ্ঠা ${pageNumber}`;
  if (code === 'hi') return `पृष्ठ ${pageNumber}`;
  if (code === 'ja') return `ページ ${pageNumber}`;
  if (code === 'es') return `Página ${pageNumber}`;
  return `Page ${pageNumber}`;
}

let localJapaneseOcrWorker: Promise<any> | null = null;

async function getLocalJapaneseOcrWorker() {
  if (!localJapaneseOcrWorker) {
    localJapaneseOcrWorker = import('tesseract.js').then(({ createWorker }) =>
      createWorker('jpn_vert', 1, { logger: () => undefined })
    ).catch((error) => { localJapaneseOcrWorker = null; throw error; });
  }
  return localJapaneseOcrWorker;
}

async function translateMangaPageWithLocalOcr(params: {
  imageUrl: string; imageDataBase64?: string; pageNumber: number;
  targetLanguage: string; sourceLanguage: string;
}): Promise<TranslatedMangaPageResult> {
  const { imageUrl, imageDataBase64, pageNumber, targetLanguage, sourceLanguage } = params;
  try {
    let image: Blob;
    if (imageDataBase64) {
      const response = await fetch(imageDataBase64.startsWith('data:') ? imageDataBase64 : `data:image/jpeg;base64,${imageDataBase64}`);
      image = await response.blob();
    } else {
      let response: Response | null = null;
      try {
        const parsedUrl = new URL(imageUrl);
        if (parsedUrl.hostname === 'uploads.mangadex.org' || parsedUrl.hostname === 'mangadex.org') {
          const proxyUrl = translationEndpoint(`/api/manga-image?url=${encodeURIComponent(imageUrl)}`);
          const proxyResponse = await fetchWithTimeout(proxyUrl, {}, 15000);
          if (proxyResponse.ok) response = proxyResponse;
        }
      } catch { /* Use direct image fetch below if URL parsing or proxy is unavailable. */ }
      if (!response) {
        response = await fetchWithTimeout(imageUrl, { mode: 'cors', credentials: 'omit' }, 15000);
      }
      if (!response.ok) throw new Error(`Image request failed (${response.status})`);
      image = await response.blob();
    }
    let worker = await getLocalJapaneseOcrWorker();
    let recognition = await worker.recognize(image);
    let lines = (recognition.data.lines || []).filter((line: any) =>
      String(line.text || '').trim() && Number(line.confidence || 0) >= 20
    );
    if (!lines.length) {
      await worker.terminate();
      localJapaneseOcrWorker = null;
      const { createWorker } = await import('tesseract.js');
      localJapaneseOcrWorker = createWorker('jpn', 1, { logger: () => undefined });
      worker = await localJapaneseOcrWorker;
      recognition = await worker.recognize(image);
      lines = (recognition.data.lines || []).filter((line: any) =>
        String(line.text || '').trim() && Number(line.confidence || 0) >= 20
      );
    }
    if (!lines.length) return {
      pageNumber, imageUrl, targetLanguage, sourceLanguage, pageTitle: `Page ${pageNumber}`,
      summary: `Page ${pageNumber}`, summaryTranslated: getLocalizedPageLabel(pageNumber, targetLanguage),
      dialogues: [], provider: 'local-ocr-empty', errorCode: 'OCR_NO_TEXT',
      notice: 'No readable text was detected in this scan. Try a clearer page image.',
    };
    const width = Math.max(1, recognition.data.imageSize?.width || 1);
    const height = Math.max(1, recognition.data.imageSize?.height || 1);
    const dialogues = await Promise.all(lines.slice(0, 80).map(async (line: any, index: number) => {
      const originalText = String(line.text || '').replace(/\s+/g, ' ').trim();
      const translatedText = await translateText(originalText, targetLanguage, sourceLanguage === 'Auto' ? 'Japanese' : sourceLanguage);
      const b = line.bbox || { x0: 0, y0: 0, x1: width, y1: height };
      const xmin = Math.max(0, Math.min(1, b.x0 / width));
      const ymin = Math.max(0, Math.min(1, b.y0 / height));
      const xmax = Math.max(xmin + .01, Math.min(1, b.x1 / width));
      const ymax = Math.max(ymin + .01, Math.min(1, b.y1 / height));
      return {
        id: index + 1, originalText, translatedText: translatedText || originalText,
        detectedLanguage: 'Japanese', type: 'bubble' as const, direction: 'vertical' as const,
        confidence: Math.max(0, Math.min(1, Number(line.confidence || 0) / 100)),
        box: { ymin, xmin, ymax, xmax }, top: ymin * 100, left: xmin * 100,
        width: (xmax - xmin) * 100, height: (ymax - ymin) * 100,
      };
    }));
    return {
      pageNumber, imageUrl, targetLanguage, sourceLanguage, pageTitle: `Page ${pageNumber}`,
      summary: 'Japanese manga text detected locally',
      summaryTranslated: getLocalizedPageLabel(pageNumber, targetLanguage),
      dialogues, provider: 'local-tesseract-gtx',
      notice: 'Gemini-free OCR is active. Results depend on scan quality and text direction.',
    };
  } catch (error: any) {
    return {
      pageNumber, imageUrl, targetLanguage, sourceLanguage, pageTitle: `Page ${pageNumber}`,
      summary: `Page ${pageNumber}`, summaryTranslated: getLocalizedPageLabel(pageNumber, targetLanguage),
      dialogues: [], provider: 'untranslated', errorCode: 'LOCAL_OCR_ERROR',
      notice: `Local OCR could not read this image: ${String(error?.message || error).slice(0, 120)}`,
    };
  }
}

export async function translateMangaPage(params: {
  imageUrl?: string;
  imageDataBase64?: string;
  mangaId?: string | number;
  chapterId?: string;
  pageNumber: number;
  chapterNumber?: string;
  mangaTitle?: string;
  targetLanguage?: string;
  sourceLanguage?: string;
  force?: boolean;
}): Promise<TranslatedMangaPageResult> {
  const {
    imageUrl = '',
    imageDataBase64,
    mangaId,
    chapterId,
    pageNumber = 1,
    chapterNumber = '1',
    mangaTitle = 'Manga',
    targetLanguage = 'bn',
    sourceLanguage = 'Auto',
    force = false,
  } = params;

  const mangaIdentity = String(mangaId ?? mangaTitle);
  const chapterIdentity = String(chapterId ?? chapterNumber);
  const cacheKey = `manga_page_v5:${encodeURIComponent(mangaIdentity)}:${encodeURIComponent(chapterIdentity)}:${chapterNumber}:${pageNumber}:${sourceLanguage.toLowerCase()}:${targetLanguage}`;
  if (!force && pageMemoryCache.has(cacheKey)) {
    const cachedItem = pageMemoryCache.get(cacheKey)!;
    if (!cachedItem.rateLimited && cachedItem.provider !== 'untranslated' && cachedItem.dialogues?.length > 0) {
      return cachedItem;
    }
  }

  // Also check persistent storage (only accept real non-empty translations)
  if (!force) {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && !parsed.rateLimited && parsed.provider !== 'untranslated' && parsed.dialogues?.length > 0) {
          pageMemoryCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // Manga image translation is intentionally Gemini-independent.
  const localResult = await translateMangaPageWithLocalOcr({
    imageUrl, imageDataBase64, pageNumber, targetLanguage, sourceLanguage,
  });
  if (localResult.dialogues.length > 0) {
    pageMemoryCache.set(cacheKey, localResult);
    try { localStorage.setItem(cacheKey, JSON.stringify(localResult)); } catch { /* storage quota */ }
  }
  return localResult;
}

/**
 * UI Translations dictionary for instant localized interface
 */
export const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    animeExplorer: 'Anime Explorer',
    mangaReader: 'Manga Reader',
    topCharacters: 'Top Characters',
    myLibrary: 'My Library & Offline',
    searchPlaceholder: 'Search anime...',
    mangaSearchPlaceholder: 'Search manga...',
    loading: 'Loading...',
    allMedia: 'All Media',
    animeOnly: 'Anime Only',
    mangaOnly: 'Manga Only',
    score: 'Score',
    popularity: 'Popularity',
    trending: 'Trending',
    newest: 'Newest',
    episodes: 'Episodes',
    chapters: 'Chapters',
    status: 'Status',
    genres: 'Genres',
    synopsis: 'Synopsis',
    characters: 'Characters & Cast',
    gallery: 'Photo Gallery (20+)',
    readManga: 'Read Manga',
    details: 'View Details',
    offlineReading: 'Offline Reading',
    downloadChapter: 'Download Offline',
    downloading: 'Downloading...',
    downloaded: 'Downloaded',
    resumeReading: 'Resume Reading',
    page: 'Page',
    of: 'of',
    nextChapter: 'Next Chapter',
    prevChapter: 'Prev Chapter',
    readingMode: 'Reading Mode',
    vertical: 'Continuous Webtoon',
    single: 'Single Page',
    double: 'Double Page Spread',
    translateSynopsis: 'Translate Synopsis',
    translatedInto: 'Translated into',
    original: 'Original',
    noDownloads: 'No offline chapters downloaded yet.',
    storageUsed: 'Storage Used',
    installApp: 'Install App',
    gameZone: 'Dungeon RPG',
    community: 'Community',
  },
  hi: {
    animeExplorer: 'एनीमे एक्सप्लोरर',
    mangaReader: 'मांगा रीडर',
    topCharacters: 'शीर्ष पात्र',
    myLibrary: 'मेरी लाइब्रेरी व ऑफ़लाइन',
    searchPlaceholder: 'एनीमे खोजें...',
    mangaSearchPlaceholder: 'मांगा खोजें...',
    loading: 'लोड हो रहा है...',
    allMedia: 'सभी मीडिया',
    animeOnly: 'केवल एनीमे',
    mangaOnly: 'केवल मांगा',
    score: 'रेटिंग',
    popularity: 'लोकप्रियता',
    trending: 'ट्रेंडिंग',
    newest: 'नवीनतम',
    episodes: 'एपिसोड',
    chapters: 'अध्याय',
    status: 'स्थिति',
    genres: 'शैलियाँ',
    synopsis: 'सारांश',
    characters: 'पात्र और कलाकार',
    gallery: 'फोटो गैलरी (20+)',
    readManga: 'मांगा पढ़ें',
    details: 'विवरण देखें',
    offlineReading: 'ऑफ़लाइन पढ़ना',
    downloadChapter: 'ऑफ़लाइन डाउनलोड करें',
    downloading: 'डाउनलोड हो रहा है...',
    downloaded: 'डाउनलोड हो गया',
    resumeReading: 'पढ़ना जारी रखें',
    page: 'पृष्ठ',
    of: 'का',
    nextChapter: 'अगला अध्याय',
    prevChapter: 'पिछला अध्याय',
    readingMode: 'पढ़ने का तरीका',
    vertical: 'वर्टिकल वेबटून',
    single: 'एकल पृष्ठ',
    double: 'दोहरा पृष्ठ',
    translateSynopsis: 'सारांश का अनुवाद करें',
    translatedInto: 'अनुवादित भाषा',
    original: 'मूल पाठ',
    noDownloads: 'अभी तक कोई ऑफ़लाइन अध्याय डाउनलोड नहीं किया गया है।',
    storageUsed: 'प्रयुक्त स्टोरेज',
    installApp: 'ऐप इंस्टॉल करें',
    gameZone: 'डंजन आरपीजी',
    community: 'समुदाय',
  },
  bn: {
    animeExplorer: 'অ্যানিমে এক্সপ্লোরার',
    mangaReader: 'মাঙ্গা রিডার',
    topCharacters: 'সেরা চরিত্রসমূহ',
    myLibrary: 'আমার লাইব্রেরি ও অফলাইন',
    searchPlaceholder: 'অ্যানিমে অনুসন্ধান করুন...',
    mangaSearchPlaceholder: 'মাঙ্গা অনুসন্ধান করুন...',
    loading: 'লোড হচ্ছে...',
    allMedia: 'সকল মিডিয়া',
    animeOnly: 'শুধুমাত্র অ্যানিমে',
    mangaOnly: 'শুধুমাত্র মাঙ্গা',
    score: 'রেটিং',
    popularity: 'জনপ্রিয়তা',
    trending: 'ট্রেন্ডিং',
    newest: 'নতুনতম',
    episodes: 'পর্বসমূহ',
    chapters: 'অধ্যায়সমূহ',
    status: 'অবস্থা',
    genres: 'ঘরানা',
    synopsis: 'সারসংক্ষেপ',
    characters: 'চরিত্র ও অভিনয়শিল্পী',
    gallery: 'ফটো গ্যালারি (২০+)',
    readManga: 'মাঙ্গা পড়ুন',
    details: 'বিস্তারিত দেখুন',
    offlineReading: 'অফলাইন পড়া',
    downloadChapter: 'অফলাইনে ডাউনলোড করুন',
    downloading: 'ডাউনলোড হচ্ছে...',
    downloaded: 'ডাউনলোড সম্পন্ন',
    resumeReading: 'পড়া চালিয়ে যান',
    page: 'পৃষ্ঠা',
    of: 'এর',
    nextChapter: 'পরবর্তী অধ্যায়',
    prevChapter: 'পূর্ববর্তী অধ্যায়',
    readingMode: 'পড়ার ধরন',
    vertical: 'ভার্টিক্যাল ওয়েবটুন',
    single: 'একক পৃষ্ঠা',
    double: 'দ্বৈত পৃষ্ঠা',
    translateSynopsis: 'সারসংক্ষেপ অনুবাদ করুন',
    translatedInto: 'অনুবাদিত ভাষা',
    original: 'মূল লেখা',
    noDownloads: 'এখনও কোনো অফলাইন অধ্যায় ডাউনলোড করা হয়নি।',
    storageUsed: 'ব্যবহৃত স্টোরেজ',
    installApp: 'অ্যাপ ইনস্টল করুন',
    gameZone: 'ডাঞ্জিয়ন আরপিজি',
    community: 'কমিউনিটি',
  },
  ja: {
    animeExplorer: 'アニメ詳細検索',
    mangaReader: 'マンガリーダー',
    topCharacters: '人気キャラクター',
    myLibrary: 'ライブラリ＆オフライン',
    searchPlaceholder: 'アニメを検索...',
    mangaSearchPlaceholder: 'マンガを検索...',
    loading: '読み込み中...',
    allMedia: 'すべて',
    animeOnly: 'アニメ',
    mangaOnly: 'マンガ',
    score: '評価',
    popularity: '人気順',
    trending: 'トレンド',
    newest: '最新順',
    episodes: 'エピソード',
    chapters: '話数',
    status: 'ステータス',
    genres: 'ジャンル',
    synopsis: 'あらすじ',
    characters: '登場人物・キャスト',
    gallery: '写真ギャラリー (20枚+)',
    readManga: 'マンガを読む',
    details: '詳細を見る',
    offlineReading: 'オフライン閲覧',
    downloadChapter: 'オフライン保存',
    downloading: 'ダウンロード中...',
    downloaded: '保存済み',
    resumeReading: '続きから読む',
    page: 'ページ',
    of: '/',
    nextChapter: '次の話',
    prevChapter: '前の話',
    readingMode: '表示モード',
    vertical: '縦スクロール (Webtoon)',
    single: '単ページ',
    double: '見開き',
    translateSynopsis: 'あらすじ翻訳',
    translatedInto: '翻訳言語',
    original: '原文',
    noDownloads: 'オフライン保存されたチャプターはありません。',
    storageUsed: '使用容量',
    installApp: 'アプリをインストール',
  },
  es: {
    animeExplorer: 'Explorador Anime',
    mangaReader: 'Lector Manga',
    topCharacters: 'Personajes Populares',
    myLibrary: 'Mi Biblioteca y Offline',
    searchPlaceholder: 'Buscar anime...',
    mangaSearchPlaceholder: 'Buscar manga...',
    loading: 'Cargando...',
    allMedia: 'Todo el contenido',
    animeOnly: 'Solo Anime',
    mangaOnly: 'Solo Manga',
    score: 'Puntuación',
    popularity: 'Popularidad',
    trending: 'Tendencia',
    newest: 'Más recientes',
    episodes: 'Episodios',
    chapters: 'Capítulos',
    status: 'Estado',
    genres: 'Géneros',
    synopsis: 'Sinopsis',
    characters: 'Personajes y Elenco',
    gallery: 'Galería de Fotos (20+)',
    readManga: 'Leer Manga',
    details: 'Ver Detalles',
    offlineReading: 'Lectura Sin Conexión',
    downloadChapter: 'Descargar Offline',
    downloading: 'Descargando...',
    downloaded: 'Descargado',
    resumeReading: 'Continuar Leyendo',
    page: 'Página',
    of: 'de',
    nextChapter: 'Siguiente Capítulo',
    prevChapter: 'Capítulo Anterior',
    readingMode: 'Modo de Lectura',
    vertical: 'Webtoon Vertical',
    single: 'Página Única',
    double: 'Doble Página',
    translateSynopsis: 'Traducir Sinopsis',
    translatedInto: 'Traducido al',
    original: 'Original',
    noDownloads: 'No hay capítulos descargados todavía.',
    storageUsed: 'Almacenamiento usado',
    installApp: 'Instalar Aplicación',
  },
};

export function getUIText(key: string, langCode: string): string {
  if (UI_STRINGS[langCode] && UI_STRINGS[langCode][key]) {
    return UI_STRINGS[langCode][key];
  }
  return UI_STRINGS.en[key] || key;
}
