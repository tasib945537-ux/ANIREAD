import { TranslationTarget } from '../types/anime';
import { getGeminiApiKey } from './geminiApiKey';

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

function stableTextHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Translate text into the target language using server-side Gemini & Google Translate API with client caching and direct client fallback
 */
export async function translateText(
  text: string,
  targetLangCode: string,
  sourceLang: string = 'English'
): Promise<string> {
  if (!text || text.trim() === '') return '';
  if (targetLangCode === 'en' && sourceLang.toLowerCase() === 'english') {
    return text;
  }

  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === targetLangCode);
  const targetLangName = langObj ? langObj.name : targetLangCode;

  const cacheKey = `tr:${sourceLang.toLowerCase()}:${targetLangCode}:${stableTextHash(text)}:${text.length}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  try {
    const localSaved = localStorage.getItem(cacheKey);
    if (localSaved) {
      memoryCache.set(cacheKey, localSaved);
      return localSaved;
    }
  } catch {
    // localStorage might be unavailable
  }

  // Deduplicate in-flight promises
  if (inFlightTranslations.has(cacheKey)) {
    return inFlightTranslations.get(cacheKey)!;
  }

  const translationPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(getGeminiApiKey() ? { 'X-Gemini-API-Key': getGeminiApiKey() } : {}) },
        body: JSON.stringify({
          text,
          targetLanguage: targetLangName,
          sourceLanguage: sourceLang,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const result = data.translatedText || text;
        if (result && result !== text) {
          memoryCache.set(cacheKey, result);
          try {
            localStorage.setItem(cacheKey, result);
          } catch {
            // ignore
          }
          return result;
        }
      }
    } catch {
      // Server timed out or network error, attempt direct client fallback
    }

    // Direct client fallback via Google Translate GTX (100% reliability, sub-100ms)
    try {
      const src = sourceLang.toLowerCase() === 'auto' ? 'auto' : (sourceLang.length === 2 ? sourceLang : 'auto');
      const gtUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${encodeURIComponent(targetLangCode)}&dt=t&q=${encodeURIComponent(text)}`;
      const fallbackRes = await fetch(gtUrl);
      if (fallbackRes.ok) {
        const gtData = await fallbackRes.json();
        if (Array.isArray(gtData) && Array.isArray(gtData[0])) {
          const parts = gtData[0].map((chunk: any) => (chunk && chunk[0] ? chunk[0] : '')).join('');
          if (parts) {
            memoryCache.set(cacheKey, parts);
            try {
              localStorage.setItem(cacheKey, parts);
            } catch {
              // ignore
            }
            return parts;
          }
        }
      }
    } catch {
      // ignore
    }

    return text;
  })().finally(() => {
    inFlightTranslations.delete(cacheKey);
  });

  inFlightTranslations.set(cacheKey, translationPromise);
  return translationPromise;
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const res = await fetch('/api/translate-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(getGeminiApiKey() ? { 'X-Gemini-API-Key': getGeminiApiKey() } : {}) },
      body: JSON.stringify({
        imageUrl,
        imageDataBase64,
        mangaId,
        chapterId,
        pageNumber,
        chapterNumber,
        mangaTitle,
        targetLanguage,
        sourceLanguage,
        force,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data: TranslatedMangaPageResult = await res.json();

    // Only cache genuine successful translations with dialogues — never cache untranslated errors or rate-limits
    if (!data.rateLimited && data.provider !== 'untranslated' && data.dialogues?.length > 0) {
      pageMemoryCache.set(cacheKey, data);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {
        // quota
      }
    }
    return data;
  } catch (err: any) {
    console.warn('translateMangaPage call failed:', err);
    const fallback: TranslatedMangaPageResult = {
      pageNumber,
      imageUrl,
      targetLanguage,
      sourceLanguage,
      pageTitle: `Page ${pageNumber}`,
      summary: `Page ${pageNumber}`,
      summaryTranslated: getLocalizedPageLabel(pageNumber, targetLanguage),
      dialogues: [],
      provider: 'untranslated',
      errorCode: 'NETWORK_ERROR',
      notice:
        err?.name === 'AbortError'
          ? 'Page OCR timed out after 45s. Please tap Retry.'
          : 'Translation service unavailable or image could not be processed.',
    };
    return fallback;
  }
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
