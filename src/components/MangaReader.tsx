import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Check,
  Settings2,
  Layers,
  FileText,
  Columns,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Languages,
  Eye,
  Sliders,
  Bug,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
} from 'lucide-react';
import { MangaChapter, OfflineChapterData } from '../types/anime';
import { getChapterPages } from '../services/api';
import {
  getOfflineChapter,
  saveReadingProgress,
  downloadChapterForOffline,
} from '../services/offlineStorage';
import { GoogleAITranslator, ALL_WORLD_LANGUAGES } from './GoogleAITranslator';
import { MangaPageDifferenceViewer } from './MangaPageDifferenceViewer';
import { MangaCanvasPage } from './MangaCanvasPage';
import { translateMangaPage, TranslatedMangaPageResult } from '../services/translator';
import {
  mangaTranslationQueue,
  getChapterTranslations,
  saveTranslatedPage,
} from '../services/mangaTranslationService';
import { AnimeLoadingState } from './AnimeLoadingState';
import { formatChapterDisplayLabel, sortChaptersNumerically } from '../services/chapterFormatter';

export interface ReadingSessionStats {
  seconds: number;
  formattedDuration: string;
  mangaTitle: string;
  chapterNumber: string | number;
  chapterTitle?: string;
}

interface Props {
  chapter: MangaChapter;
  allChapters: MangaChapter[];
  mangaTitle: string;
  mangaCover: string;
  initialPage?: number;
  onClose: (stats?: ReadingSessionStats) => void;
  onSelectChapter: (chapter: MangaChapter) => void;
}

type ReadingMode = 'vertical' | 'single' | 'double';
type ReaderTheme = 'black' | 'slate' | 'sepia' | 'light';

export const MangaReader: React.FC<Props> = ({
  chapter,
  allChapters,
  mangaTitle,
  mangaCover,
  initialPage = 1,
  onClose,
  onSelectChapter,
}) => {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1);
  const [readingMode, setReadingMode] = useState<ReadingMode>('vertical');
  const [gapless, setGapless] = useState(true);
  const [fitMode, setFitMode] = useState<'width' | 'contain'>('width');
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('black');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showJumpPageModal, setShowJumpPageModal] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAiTranslator, setShowAiTranslator] = useState(false);
  const [showPageDiffModal, setShowPageDiffModal] = useState(false);
  const [diffTargetPage, setDiffTargetPage] = useState(1);
  const [chapterLangFilter, setChapterLangFilter] = useState<string>('all');
  const [isOfflineSource, setIsOfflineSource] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [readingDirection, setReadingDirection] = useState<'rtl' | 'ltr'>('ltr');

  // AI Manga Page Translation States
  const [viewMode, setViewMode] = useState<'original' | 'translated'>('translated');
  const [targetLang, setTargetLang] = useState<string>(() => {
    try {
      return sessionStorage.getItem('aniread_target_lang') || localStorage.getItem('aniread_target_lang') || 'bn';
    } catch {
      return 'bn';
    }
  });
  const [translationOpacity, setTranslationOpacity] = useState<number>(100);
  const [showOpacitySlider, setShowOpacitySlider] = useState<boolean>(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [translatedPages, setTranslatedPages] = useState<Record<number, TranslatedMangaPageResult>>({});
  const [translatingPageSet, setTranslatingPageSet] = useState<Set<number>>(new Set());
  const [failedPageSet, setFailedPageSet] = useState<Set<number>>(new Set());
  const [isTranslatingChapter, setIsTranslatingChapter] = useState(false);
  const [chapterProgress, setChapterProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [rateLimitCooldownSec, setRateLimitCooldownSec] = useState<number>(0);
  const [statusPillDismissed, setStatusPillDismissed] = useState(false);

  const cancelBatchRef = useRef<boolean>(false);

  // Auto-scroll for webtoons
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<1 | 2 | 3>(2);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Unique languages in available chapters
  const availableChapterLangs = Array.from(
    new Set(allChapters.map((c) => c.language).filter(Boolean))
  );

  // Find next and previous chapters in sequence using authoritative numeric sorting
  const sortedChapters = sortChaptersNumerically(
    [...allChapters].filter((c) => (chapterLangFilter === 'all' ? true : c.language === chapterLangFilter))
  );
  const currentChapterIdx = sortedChapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentChapterIdx > 0 ? sortedChapters[currentChapterIdx - 1] : null;
  const nextChapter = currentChapterIdx < sortedChapters.length - 1 ? sortedChapters[currentChapterIdx + 1] : null;

  // Chapter Reading Session Timer
  const sessionStartTimeRef = useRef<number>(Date.now());
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Track active chapter reading duration with live ticking
  useEffect(() => {
    sessionStartTimeRef.current = Date.now();
    setSessionSeconds(0);
    const intervalId = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
      setSessionSeconds(elapsed);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [chapter.id]);

  const formatTimerDigital = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDurationReadable = (totalSec: number) => {
    if (totalSec < 60) {
      return `${totalSec}s`;
    }
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins < 60) {
      return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs} hr`;
  };

  const handleClose = useCallback(() => {
    const elapsed = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    const stats: ReadingSessionStats = {
      seconds: elapsed,
      formattedDuration: formatDurationReadable(elapsed),
      mangaTitle: mangaTitle || chapter.mangaTitle || 'Manga',
      chapterNumber: chapter.chapterNumber,
      chapterTitle: chapter.title,
    };
    onClose(stats);
  }, [onClose, mangaTitle, chapter.mangaTitle, chapter.chapterNumber, chapter.title]);

  const currentLangObj =
    ALL_WORLD_LANGUAGES.find((l) => l.code === targetLang) || ALL_WORLD_LANGUAGES[0];

  // Load chapter pages
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const startPage = initialPage && initialPage > 0 ? initialPage : 1;
    setCurrentPage(startPage);
    setIsAutoScrolling(false);
    cancelBatchRef.current = true;
    setIsTranslatingChapter(false);
    setRateLimitCooldownSec(0);
    setTranslatedPages({});
    setTranslatingPageSet(new Set());

    async function loadPages() {
      try {
        const offlineData: OfflineChapterData | null = await getOfflineChapter(chapter.id);
        if (offlineData && offlineData.pages && offlineData.pages.length > 0) {
          if (isMounted) {
            setPages(offlineData.pages);
            setIsOfflineSource(true);
            setIsDownloaded(true);
            setLoading(false);

            // Load saved translations for this offline chapter
            getChapterTranslations(chapter.mangaId, String(chapter.chapterNumber), targetLang).then((saved) => {
              if (isMounted && saved && Object.keys(saved).length > 0) {
                setTranslatedPages((prev) => ({ ...prev, ...saved }));
              }
            });

            if (startPage > 1) {
              setTimeout(() => {
                const targetEl = pageRefs.current[startPage - 1];
                if (targetEl && containerRef.current) {
                  targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 300);
            }
          }
          return;
        }

        const onlinePages = await getChapterPages(chapter.id);
        if (isMounted) {
          setPages(onlinePages);
          setIsOfflineSource(false);
          setIsDownloaded(false);
          setLoading(false);

          // Smart Auto-Load: Load existing translations permanently stored in IndexedDB
          getChapterTranslations(chapter.mangaId, String(chapter.chapterNumber), targetLang).then((saved) => {
            if (isMounted && saved && Object.keys(saved).length > 0) {
              setTranslatedPages((prev) => ({ ...prev, ...saved }));
            }
          });

          if (startPage > 1) {
            setTimeout(() => {
              const targetEl = pageRefs.current[startPage - 1];
              if (targetEl && containerRef.current) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 300);
          }
        }
      } catch (err) {
        console.error('Error loading chapter pages:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadPages();

    return () => {
      isMounted = false;
      cancelBatchRef.current = true;
    };
  }, [chapter.id]);

  // Synchronize with background Translation Queue
  useEffect(() => {
    const unsubscribe = mangaTranslationQueue.subscribe((job) => {
      if (!job) return;
      const isThisChapter =
        String(job.mangaId) === String(chapter.mangaId) &&
        String(job.chapterNumber) === String(chapter.chapterNumber) &&
        job.targetLanguage === targetLang;

      if (isThisChapter) {
        setIsTranslatingChapter(job.status === 'running');
        setChapterProgress({ current: job.completedPages, total: job.totalPages });

        // Merge any newly translated pages from queue
        getChapterTranslations(chapter.mangaId, String(chapter.chapterNumber), targetLang).then((saved) => {
          if (saved && Object.keys(saved).length > 0) {
            setTranslatedPages((prev) => ({ ...prev, ...saved }));
          }
        });
      }
    });

    return unsubscribe;
  }, [chapter.mangaId, chapter.chapterNumber, targetLang]);

  // Track and save reading progress on page turn
  useEffect(() => {
    if (pages.length === 0) return;

    saveReadingProgress({
      mangaId: chapter.mangaId,
      mangaTitle: mangaTitle || chapter.mangaTitle,
      coverImage: mangaCover,
      lastChapterId: chapter.id,
      lastChapterNumber: chapter.chapterNumber,
      lastPage: currentPage,
      totalPages: pages.length,
      updatedAt: Date.now(),
    }).catch(console.warn);
  }, [currentPage, chapter.id, pages.length]);

  // Auto-scroll loop
  useEffect(() => {
    if (!isAutoScrolling || readingMode !== 'vertical' || !containerRef.current) return;

    const interval = setInterval(() => {
      if (containerRef.current) {
        const step = autoScrollSpeed === 1 ? 1 : autoScrollSpeed === 2 ? 2.5 : 4.5;
        containerRef.current.scrollTop += step;

        if (
          containerRef.current.scrollTop + containerRef.current.clientHeight >=
          containerRef.current.scrollHeight - 20
        ) {
          setIsAutoScrolling(false);
        }
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isAutoScrolling, autoScrollSpeed, readingMode]);

  // Track current page in vertical scroll mode
  const handleScroll = useCallback(() => {
    if (readingMode !== 'vertical' || !containerRef.current) return;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;

    for (let i = 0; i < pageRefs.current.length; i++) {
      const el = pageRefs.current[i];
      if (el) {
        const top = el.offsetTop - container.offsetTop;
        const height = el.clientHeight;
        if (scrollTop >= top - 200 && scrollTop < top + height - 200) {
          setCurrentPage(i + 1);
          break;
        }
      }
    }
  }, [readingMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        readingDirection === 'rtl' ? prevPage() : nextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        readingDirection === 'rtl' ? nextPage() : prevPage();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'translated' ? 'original' : 'translated'));
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsImmersive((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages.length, readingMode, readingDirection, nextChapter, prevChapter, handleClose]);

  const nextPage = () => {
    if (currentPage >= pages.length) {
      if (nextChapter) {
        onSelectChapter(nextChapter);
      }
      return;
    }
    const increment = readingMode === 'double' ? 2 : 1;
    const target = Math.min(currentPage + increment, pages.length);
    setCurrentPage(target);
    if (readingMode === 'vertical' && containerRef.current && pageRefs.current[target - 1]) {
      const container = containerRef.current;
      const targetEl = pageRefs.current[target - 1];
      if (targetEl) {
        const targetTop = targetEl.offsetTop - container.offsetTop;
        container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      }
    }
  };

  const prevPage = () => {
    if (currentPage <= 1) {
      if (prevChapter) {
        onSelectChapter(prevChapter);
      }
      return;
    }
    const decrement = readingMode === 'double' ? 2 : 1;
    const target = Math.max(currentPage - decrement, 1);
    setCurrentPage(target);
    if (readingMode === 'vertical' && containerRef.current && pageRefs.current[target - 1]) {
      const container = containerRef.current;
      const targetEl = pageRefs.current[target - 1];
      if (targetEl) {
        const targetTop = targetEl.offsetTop - container.offsetTop;
        container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isImmersive) {
      setIsImmersive(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeft = clickX < rect.width * 0.45;
    const isRight = clickX > rect.width * 0.55;

    if (readingDirection === 'rtl') {
      if (isLeft) nextPage();
      else if (isRight) prevPage();
    } else {
      if (isLeft) prevPage();
      else if (isRight) nextPage();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleDownload = async () => {
    if (isDownloading || isDownloaded || pages.length === 0) return;
    setIsDownloading(true);

    try {
      await downloadChapterForOffline(
        chapter.id,
        chapter.mangaId,
        mangaTitle || chapter.mangaTitle,
        chapter.chapterNumber,
        chapter.title,
        pages
      );
      setIsDownloaded(true);
    } catch (err) {
      console.error('Failed to download chapter:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const jumpToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
    setShowThumbnails(false);
    setShowJumpPageModal(false);
    if (readingMode === 'vertical' && containerRef.current && pageRefs.current[pageNum - 1]) {
      const container = containerRef.current;
      const targetEl = pageRefs.current[pageNum - 1];
      if (targetEl) {
        const targetTop = targetEl.offsetTop - container.offsetTop;
        container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      }
    }
  };

  const handleJumpPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput.trim(), 10);
    if (!isNaN(target) && target >= 1 && target <= pages.length) {
      jumpToPage(target);
      setJumpPageInput('');
    }
  };

  // --- Manga Translation Handlers --- //

  // Translate a single manga page with retry tracking, base64 support, and permanent auto-save
  const handleTranslateSinglePage = async (pageNum: number, base64Data?: string) => {
    const imgUrl = pages[pageNum - 1] || '';
    if (!imgUrl && !base64Data) return;

    const isInlineData = imgUrl.startsWith('data:image/');
    let effectiveBase64 = base64Data || (isInlineData ? imgUrl : undefined);

    // If base64 wasn't passed directly (e.g. header P.X button), try extracting from loaded page image DOM
    if (!effectiveBase64 && pageRefs.current[pageNum - 1]) {
      try {
        const imgEl = pageRefs.current[pageNum - 1]?.querySelector('img');
        if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
          const canvas = document.createElement('canvas');
          const maxDim = 1600;
          let targetW = imgEl.naturalWidth;
          let targetH = imgEl.naturalHeight;
          if (targetW > maxDim || targetH > maxDim) {
            if (targetW > targetH) {
              targetH = Math.round((targetH * maxDim) / targetW);
              targetW = maxDim;
            } else {
              targetW = Math.round((targetW * maxDim) / targetH);
              targetH = maxDim;
            }
          }
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(imgEl, 0, 0, targetW, targetH);
            effectiveBase64 = canvas.toDataURL('image/jpeg', 0.88);
          }
        }
      } catch {
        // Ignore tainted canvas; server will fetch imageUrl
      }
    }

    setViewMode('translated');
    setTranslatingPageSet((prev) => new Set(prev).add(pageNum));
    setFailedPageSet((prev) => {
      const next = new Set(prev);
      next.delete(pageNum);
      return next;
    });

    try {
      const res = await translateMangaPage({
        imageUrl: isInlineData ? '' : imgUrl,
        imageDataBase64: effectiveBase64,
        pageNumber: pageNum,
        chapterNumber: chapter.chapterNumber,
        mangaTitle: mangaTitle || chapter.mangaTitle,
        targetLanguage: targetLang,
        force: true,
      });

      const hasValidDialogues = Boolean(res.dialogues && res.dialogues.length > 0 && res.provider !== 'untranslated');
      if (!hasValidDialogues) {
        if (res.provider === 'untranslated') {
          setFailedPageSet((prev) => new Set(prev).add(pageNum));
        }
      } else {
        // Permanent Auto Save into IndexedDB & localStorage cache immediately
        await saveTranslatedPage({
          id: `${chapter.mangaId}_ch${chapter.chapterNumber}_p${pageNum}_${targetLang}`,
          mangaId: chapter.mangaId,
          chapterId: chapter.id,
          chapterNumber: String(chapter.chapterNumber),
          mangaTitle: mangaTitle || chapter.mangaTitle || 'Manga',
          mangaCoverImage: mangaCover,
          pageNumber: pageNum,
          originalImageUrl: imgUrl || '',
          targetLanguage: targetLang,
          status: 'completed',
          timestamp: Date.now(),
          result: res,
        });
      }

      setTranslatedPages((prev) => ({
        ...prev,
        [pageNum]: res,
      }));
    } catch (err) {
      console.warn(`Translation failed for page ${pageNum}:`, err);
      setFailedPageSet((prev) => new Set(prev).add(pageNum));
    } finally {
      setTranslatingPageSet((prev) => {
        const next = new Set(prev);
        next.delete(pageNum);
        return next;
      });
    }
  };

  // Translate Entire Chapter via Background Translation Manager
  // Supports smart resume (skipping completed pages), auto save, speed tracking, and background persistence
  const handleTranslateEntireChapter = async (forceRetranslate: boolean = false) => {
    if (pages.length === 0) return;

    setViewMode('translated');
    setIsTranslatingChapter(true);
    cancelBatchRef.current = false;

    // Start background translation queue job
    await mangaTranslationQueue.startTranslation({
      mangaId: chapter.mangaId,
      chapterId: chapter.id,
      chapterNumber: String(chapter.chapterNumber),
      mangaTitle: mangaTitle || chapter.mangaTitle || 'Manga',
      mangaCoverImage: mangaCover,
      pageUrls: pages,
      targetLanguage: targetLang,
      forceRetranslate,
      startFromPage: currentPage,
    });
  };

  const handleCancelChapterTranslation = () => {
    mangaTranslationQueue.pauseTranslation();
    setRateLimitCooldownSec(0);
    setIsTranslatingChapter(false);
  };

  // Switch target language and save to session
  const handleSelectTargetLanguage = (code: string) => {
    setTargetLang(code);
    setShowLangMenu(false);
    try {
      sessionStorage.setItem('aniread_target_lang', code);
      localStorage.setItem('aniread_target_lang', code);
    } catch {
      // ignore
    }
    // Load previously translated pages for the selected language
    getChapterTranslations(chapter.mangaId, String(chapter.chapterNumber), code).then((saved) => {
      setTranslatedPages(saved || {});
    });
    setFailedPageSet(new Set());
  };

  // Filtered world languages for language picker
  const filteredLanguages = ALL_WORLD_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const themeClasses =
    readerTheme === 'black'
      ? 'bg-black text-slate-100'
      : readerTheme === 'slate'
      ? 'bg-slate-950 text-slate-100'
      : readerTheme === 'sepia'
      ? 'bg-[#1e1914] text-[#ebdcc6]'
      : 'bg-slate-100 text-slate-900';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${themeClasses} select-none animate-in fade-in duration-200`}>
      {/* 1. Header Toolbar (Can be hidden in Immersive Mode) */}
      {!isImmersive && (
        <header className="bg-slate-950/98 border-b border-slate-800/80 px-2 sm:px-4 pt-2 pb-2.5 sm:py-2.5 shrink-0 z-30 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
          {/* Top Tier (Mobile) / Left Tier (Desktop): Close, Title, Ch jump, and Quick View actions */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            {/* Left group: Close, Title, Chapter Selector, Session Timer */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <button
                onClick={handleClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Exit Reader (Esc)"
                aria-label="Exit Reader"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="min-w-0 flex items-center gap-1 sm:gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs drop-shadow-sm">
                  {mangaTitle || chapter.mangaTitle}
                </span>
                <span className="text-slate-600 text-xs">·</span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-indigo-400 shrink-0 bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.5 rounded-md">
                  Ch. {chapter.chapterNumber}
                </span>
              </div>

              {/* Quick Chapter Selector Dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowChapterMenu(!showChapterMenu)}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-700/60"
                  title="Jump to Chapter"
                >
                  <span>Ch ({sortedChapters.length})</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showChapterMenu && (
                  <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] max-h-96 overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 flex flex-col divide-y divide-slate-800">
                    <div className="px-3 py-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Jump to Chapter
                      </span>
                      <button
                        onClick={() => setShowChapterMenu(false)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                      {sortedChapters.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => {
                            onSelectChapter(ch);
                            setCurrentPage(1);
                            setShowChapterMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                            ch.id === chapter.id ? 'bg-indigo-950/70 text-indigo-300 font-bold' : 'text-slate-300'
                          }`}
                        >
                          <span className="truncate">{formatChapterDisplayLabel(ch.chapterNumber, ch.title)}</span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0 ml-2">
                            {ch.language}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Chapter Reading Session Timer */}
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-indigo-300 shrink-0 shadow-inner"
                title={`Reading session time: ${formatDurationReadable(sessionSeconds)}`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                <span>{formatTimerDigital(sessionSeconds)}</span>
              </div>
            </div>

            {/* Mobile-only right view actions (Fit, Immersive & Fullscreen) */}
            <div className="flex md:hidden items-center gap-1 shrink-0">
              <button
                onClick={() => setFitMode(fitMode === 'width' ? 'contain' : 'width')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={`Fit Mode (${fitMode === 'width' ? 'Fit Width' : 'Fit Screen'})`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsImmersive(!isImmersive)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle Immersive Mode"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom Tier (Mobile) / Right Tier (Desktop): Manga Translator Suite & Tools */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pt-2 pb-2.5 px-1 border-t border-slate-800/70 md:border-t-0 shrink-0 min-h-[50px] touch-pan-x">
            {/* 1. Mode Switcher: Original vs Translated */}
            <div className="h-9 flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode('original')}
                className={`h-full px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center ${
                  viewMode === 'original'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View untouched original scans (HotKey: T)"
              >
                Original
              </button>
              <button
                onClick={() => setViewMode('translated')}
                className={`h-full px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'translated'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-400 hover:text-indigo-300'
                }`}
                title="View translated manga artwork (HotKey: T)"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                <span>Translated</span>
              </button>
            </div>

            {/* 2. Target Language Picker Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95 shadow-xs"
                title="Choose translation target language"
              >
                <Languages className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{currentLangObj.flag} {currentLangObj.nativeName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showLangMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-xs"
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 w-auto sm:w-80 max-w-sm max-h-[75vh] sm:max-h-96 overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-[70] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 border-b border-slate-800 flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search languages (Bengali, Hindi, etc)..."
                          value={langSearch}
                          onChange={(e) => setLangSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 text-xs text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-indigo-500"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => setShowLangMenu(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="overflow-y-auto max-h-64 divide-y divide-slate-800/40">
                      {filteredLanguages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => handleSelectTargetLanguage(l.code)}
                          className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                            targetLang === l.code ? 'bg-indigo-950/70 text-indigo-300 font-bold' : 'text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{l.flag}</span>
                            <span>{l.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-400">{l.nativeName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 3. Opacity Slider Trigger & Popover */}
            {viewMode === 'translated' && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowOpacitySlider(!showOpacitySlider)}
                  className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95 shadow-xs ${
                    showOpacitySlider || translationOpacity < 100
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Translation Opacity Slider (compare original artwork)"
                >
                  <Sliders className="w-3.5 h-3.5 shrink-0" />
                  <span>{translationOpacity}%</span>
                </button>

                {showOpacitySlider && (
                  <>
                    <div
                      className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-xs"
                      onClick={() => setShowOpacitySlider(false)}
                    />
                    <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-64 max-w-xs p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-[70] flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                        <span>Overlay Opacity</span>
                        <span className="font-mono text-indigo-400 font-bold">{translationOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={translationOpacity}
                        onChange={(e) => setTranslationOpacity(Number(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      {/* Quick Presets */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[100, 75, 50, 25].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setTranslationOpacity(preset)}
                            className={`py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                              translationOpacity === preset
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 4. Translate Current Page Button */}
            <button
              onClick={() => handleTranslateSinglePage(currentPage)}
              disabled={translatingPageSet.has(currentPage)}
              className="h-9 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
              title={`Translate current page ${currentPage}`}
            >
              {translatingPageSet.has(currentPage) ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              )}
              <span>P.{currentPage}</span>
            </button>

            {/* 5. Translate Entire Chapter Button & Retry */}
            {!isTranslatingChapter ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleTranslateEntireChapter(false)}
                  className="h-9 px-3 sm:px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                  title={`Translate all ${pages.length} pages of Chapter ${chapter.chapterNumber}`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                  <span>Translate All ({pages.length})</span>
                </button>

                {failedPageSet.size > 0 && (
                  <button
                    onClick={() => handleTranslateEntireChapter(true)}
                    className="h-9 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                    title={`Retry ${failedPageSet.size} failed pages`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>Retry ({failedPageSet.size})</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleCancelChapterTranslation}
                className="h-9 px-3 sm:px-3.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer animate-pulse shrink-0 whitespace-nowrap active:scale-95"
                title="Cancel batch chapter translation"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>P.{chapterProgress.current}/{chapterProgress.total} · Cancel</span>
              </button>
            )}

            {/* 6. Reading Mode Switcher (Webtoon / Single / Double) */}
            <div className="h-9 flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 shrink-0">
              <button
                onClick={() => setReadingMode('vertical')}
                className={`h-full px-2.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center ${
                  readingMode === 'vertical' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Continuous Webtoon Scroll"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReadingMode('single')}
                className={`h-full px-2.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center ${
                  readingMode === 'single' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Single Page Turn"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReadingMode('double')}
                className={`h-full px-2.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center ${
                  readingMode === 'double' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Double Spread View"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Desktop Only View Tools */}
            <div className="hidden md:flex items-center gap-1 shrink-0">
              {/* Fit Mode Toggle */}
              <button
                onClick={() => setFitMode(fitMode === 'width' ? 'contain' : 'width')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={`Switch Fit Mode (Currently ${fitMode === 'width' ? 'Fit Width' : 'Fit Screen'})`}
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Immersive Mode (Fullscreen Reading without bars) */}
              <button
                onClick={() => setIsImmersive(!isImmersive)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle Immersive Edge-to-Edge Reading Mode (I)"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle Fullscreen (F)"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>
      )}


      {/* Floating Re-enter Toolbar Button when in Immersive Mode */}
      {isImmersive && (
        <button
          onClick={() => setIsImmersive(false)}
          className="fixed top-4 right-4 z-50 bg-black/80 hover:bg-black text-white p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl transition-transform hover:scale-105 cursor-pointer"
          title="Show Reader Toolbar (I or Tap)"
        >
          <Eye className="w-4 h-4 text-indigo-400" />
        </button>
      )}

      {/* 2. Main Reader Canvas */}
      <main
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center relative scroll-smooth focus:outline-none"
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 w-full">
            <AnimeLoadingState
              message="Loading..."
              subMessage={`Fetching high-resolution scans for Chapter ${chapter.chapterNumber}...`}
              size="lg"
              characterTheme="monarch"
            />
          </div>
        ) : pages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
            <p className="text-base font-bold text-white">No page scans available for this chapter.</p>
            <p className="text-xs text-slate-400 max-w-md">
              Please choose another chapter or translation language from the chapters directory.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors cursor-pointer"
            >
              Back to Manga Overview
            </button>
          </div>
        ) : (
          <>
            {/* Mode 1: Webtoon Continuous Vertical Scroll */}
            {readingMode === 'vertical' && (
              <div
                style={{ width: `${zoomLevel}%` }}
                className={`w-full flex flex-col items-center max-w-4xl transition-all ${
                  gapless ? 'space-y-0 py-0' : 'space-y-4 py-4'
                }`}
              >
                {pages.map((pageUrl, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <div
                      key={pageNum}
                      ref={(el) => {
                        pageRefs.current[idx] = el;
                      }}
                      className="relative w-full flex justify-center overflow-hidden"
                    >
                      <MangaCanvasPage
                        src={pageUrl}
                        pageNumber={pageNum}
                        totalPages={pages.length}
                        alt={`Page ${pageNum}`}
                        isTranslatedView={viewMode === 'translated'}
                        targetLangCode={targetLang}
                        translatedData={translatedPages[pageNum]}
                        isTranslating={translatingPageSet.has(pageNum)}
                        onTranslatePage={handleTranslateSinglePage}
                        fitMode={fitMode}
                        zoomLevel={zoomLevel}
                        translationOpacity={translationOpacity}
                        onClick={() => {
                          if (isImmersive) setIsImmersive(false);
                        }}
                      />
                    </div>
                  );
                })}

                {/* Chapter End Celebration Banner */}
                <div className="w-full py-16 px-6 flex flex-col items-center justify-center border-t border-slate-800/80 text-center space-y-4 bg-slate-950/40 my-6 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">You completed Chapter {chapter.chapterNumber}!</h4>
                    <p className="text-xs text-slate-400 mt-1">Ready for the next chapter?</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {prevChapter && (
                      <button
                        onClick={() => onSelectChapter(prevChapter)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                      >
                        ← Ch. {prevChapter.chapterNumber}
                      </button>
                    )}
                    {nextChapter ? (
                      <button
                        onClick={() => onSelectChapter(nextChapter)}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-xl transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>Next: Ch. {nextChapter.chapterNumber}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleClose}
                        className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        Finish & Return to Manga
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Single Page Mode */}
            {readingMode === 'single' && (
              <div className="w-full h-full flex flex-col items-center justify-center relative p-2 sm:p-4 min-h-[85vh]">
                <div
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
                  className="relative max-h-full max-w-full flex items-center justify-center transition-transform"
                >
                  <MangaCanvasPage
                    src={pages[currentPage - 1]}
                    pageNumber={currentPage}
                    totalPages={pages.length}
                    alt={`Page ${currentPage}`}
                    isTranslatedView={viewMode === 'translated'}
                    targetLangCode={targetLang}
                    translatedData={translatedPages[currentPage]}
                    isTranslating={translatingPageSet.has(currentPage)}
                    onTranslatePage={handleTranslateSinglePage}
                    fitMode={fitMode}
                    zoomLevel={zoomLevel}
                    translationOpacity={translationOpacity}
                    onClick={handleCanvasClick}
                  />
                </div>

                {/* Left & Right Page Navigation Arrows */}
                <button
                  onClick={prevPage}
                  disabled={currentPage <= 1 && !prevChapter}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-slate-950/75 hover:bg-slate-900 text-white/90 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-xs transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-0 z-20 cursor-pointer"
                  title={currentPage <= 1 && prevChapter ? `Previous Chapter (Ch. ${prevChapter.chapterNumber})` : "Previous Page (Left Arrow)"}
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage >= pages.length && !nextChapter}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-slate-950/75 hover:bg-slate-900 text-white/90 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-xs transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-0 z-20 cursor-pointer"
                  title={currentPage >= pages.length && nextChapter ? `Next Chapter (Ch. ${nextChapter.chapterNumber})` : "Next Page (Right Arrow / Space)"}
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            )}

            {/* Mode 3: Double Spread Mode */}
            {readingMode === 'double' && (
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
                className="w-full h-full flex items-center justify-center relative p-4 gap-4 min-h-[85vh] transition-transform"
              >
                {currentPage < pages.length && (
                  <div className="max-h-[88vh] max-w-[48%] flex items-center justify-center">
                    <MangaCanvasPage
                      src={pages[currentPage]}
                      pageNumber={currentPage + 1}
                      totalPages={pages.length}
                      alt={`Page ${currentPage + 1}`}
                      isTranslatedView={viewMode === 'translated'}
                      targetLangCode={targetLang}
                      translatedData={translatedPages[currentPage + 1]}
                      isTranslating={translatingPageSet.has(currentPage + 1)}
                      onTranslatePage={handleTranslateSinglePage}
                      fitMode="contain"
                      zoomLevel={zoomLevel}
                      translationOpacity={translationOpacity}
                      onClick={handleCanvasClick}
                    />
                  </div>
                )}
                <div className="max-h-[88vh] max-w-[48%] flex items-center justify-center">
                  <MangaCanvasPage
                    src={pages[currentPage - 1]}
                    pageNumber={currentPage}
                    totalPages={pages.length}
                    alt={`Page ${currentPage}`}
                    isTranslatedView={viewMode === 'translated'}
                    targetLangCode={targetLang}
                    translatedData={translatedPages[currentPage]}
                    isTranslating={translatingPageSet.has(currentPage)}
                    onTranslatePage={handleTranslateSinglePage}
                    fitMode="contain"
                    zoomLevel={zoomLevel}
                    translationOpacity={translationOpacity}
                    onClick={handleCanvasClick}
                  />
                </div>

                <button
                  onClick={prevPage}
                  disabled={currentPage <= 1 && !prevChapter}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-slate-950/75 hover:bg-slate-900 text-white/90 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-xs transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-0 z-20 cursor-pointer"
                  title={currentPage <= 1 && prevChapter ? `Previous Chapter (Ch. ${prevChapter.chapterNumber})` : "Previous Page (Left Arrow)"}
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage >= pages.length - 1 && !nextChapter}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-slate-950/75 hover:bg-slate-900 text-white/90 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-xs transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-0 z-20 cursor-pointer"
                  title={currentPage >= pages.length - 1 && nextChapter ? `Next Chapter (Ch. ${nextChapter.chapterNumber})` : "Next Page (Right Arrow / Space)"}
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. Bottom Footer & Navigation (Hidden in Immersive Mode) */}
      {!isImmersive && (
        <footer className="h-12 bg-slate-950/95 border-t border-slate-800/80 px-2 sm:px-4 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
          {/* Left: Progress info & Page nav for ALL reading modes */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs font-mono font-medium text-slate-300 whitespace-nowrap">
              Page {currentPage} of {pages.length}
            </span>
            <span className="text-xs font-mono text-indigo-400 hidden xs:inline">
              ({pages.length > 0 ? Math.round((currentPage / pages.length) * 100) : 0}%)
            </span>

            {/* Quick Page Nav Buttons in Footer for ALL modes */}
            {pages.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 ml-1">
                <button
                  onClick={prevPage}
                  disabled={currentPage <= 1 && !prevChapter}
                  className="px-2.5 py-1 rounded text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title={currentPage <= 1 && prevChapter ? `Previous Chapter (Ch. ${prevChapter.chapterNumber})` : "Previous Page"}
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">
                    {currentPage <= 1 && prevChapter ? `Ch.${prevChapter.chapterNumber}` : 'Prev'}
                  </span>
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage >= pages.length && !nextChapter}
                  className="px-2.5 py-1 rounded text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title={currentPage >= pages.length && nextChapter ? `Next Chapter (Ch. ${nextChapter.chapterNumber})` : "Next Page"}
                  aria-label="Next Page"
                >
                  <span className="text-[11px] font-medium">
                    {currentPage >= pages.length && nextChapter ? `Ch.${nextChapter.chapterNumber}` : 'Next'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="text-xs text-slate-400 hover:text-white underline underline-offset-2 transition-colors hidden sm:inline cursor-pointer"
            >
              {showThumbnails ? 'Hide Thumbnails' : 'All Pages'}
            </button>

            <button
              onClick={() => {
                setJumpPageInput(String(currentPage));
                setShowJumpPageModal(true);
              }}
              className="text-xs text-indigo-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer flex items-center gap-1"
              title="Jump to specific page number"
            >
              <Hash className="w-3 h-3 text-indigo-400" />
              <span>Jump Page</span>
            </button>
          </div>

          {/* Center: Page Slider */}
          {pages.length > 1 && (
            <div className="hidden md:flex items-center gap-2 w-64 lg:w-72">
              <input
                type="range"
                min={1}
                max={pages.length}
                value={currentPage}
                onChange={(e) => jumpToPage(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          )}

          {/* Right: Offline status, Diff Inspector, prev/next chapter */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Diff Inspector Modal Trigger */}
            <button
              onClick={() => {
                setDiffTargetPage(currentPage);
                setShowPageDiffModal(true);
              }}
              className="text-xs text-indigo-300 hover:text-indigo-200 underline hidden sm:inline cursor-pointer"
              title="Compare side-by-side original vs translated difference"
            >
              Diff Inspector
            </button>

            {isDownloaded ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            ) : (
              <button
                onClick={handleDownload}
                disabled={isDownloading || pages.length === 0}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-1 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                title="Download Chapter for Offline Reading"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isDownloading ? 'Saving...' : 'Download'}</span>
              </button>
            )}

            {/* Chapter Navigation Buttons */}
            {prevChapter && (
              <button
                onClick={() => onSelectChapter(prevChapter)}
                className="px-2 py-1 text-slate-300 hover:text-white rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-medium"
                title={`Previous: Ch. ${prevChapter.chapterNumber}`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ch.{prevChapter.chapterNumber}</span>
              </button>
            )}
            {nextChapter && (
              <button
                onClick={() => onSelectChapter(nextChapter)}
                className="px-2 py-1 text-slate-300 hover:text-white rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-medium"
                title={`Next: Ch. ${nextChapter.chapterNumber}`}
              >
                <span className="hidden sm:inline">Ch.{nextChapter.chapterNumber}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </footer>
      )}

      {/* 4. Thumbnail Drawer Tray */}
      {showThumbnails && pages.length > 0 && (
        <div className="h-24 bg-slate-950/98 border-t border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto z-40 shrink-0">
          {pages.map((p, idx) => {
            const pageNum = idx + 1;
            const isTranslated = !!translatedPages[pageNum]?.dialogues?.length;
            return (
              <button
                key={idx}
                onClick={() => jumpToPage(pageNum)}
                className={`h-20 aspect-[3/4] shrink-0 rounded overflow-hidden border-2 transition-all relative cursor-pointer ${
                  currentPage === pageNum ? 'border-indigo-500 scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={p} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                {isTranslated && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" title="Translated" />
                )}
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-white/90 bg-black/70 px-1 rounded">
                  {pageNum}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4b. Floating Quick Page Nav Dock for Vertical Scroll Mode */}
      {readingMode === 'vertical' && pages.length > 1 && !isImmersive && (
        <aside
          aria-label="Vertical Quick Navigation"
          className="fixed right-3 sm:right-6 bottom-16 sm:bottom-20 z-40 flex flex-col items-center gap-1.5 pointer-events-auto"
        >
          <button
            onClick={prevPage}
            disabled={currentPage <= 1 && !prevChapter}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title={currentPage <= 1 && prevChapter ? `Previous Chapter (Ch. ${prevChapter.chapterNumber})` : `Previous Page (${currentPage > 1 ? currentPage - 1 : 1})`}
            aria-label="Previous Page"
          >
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => {
              setJumpPageInput(String(currentPage));
              setShowJumpPageModal(true);
            }}
            className="px-2 py-1 bg-slate-950/95 border border-slate-700/90 hover:border-indigo-500 rounded-lg text-[10px] sm:text-xs font-mono font-bold text-indigo-300 hover:text-white shadow-xl text-center select-none backdrop-blur-md cursor-pointer transition-colors"
            title="Jump to Page"
            aria-label={`Page ${currentPage} of ${pages.length}. Click to jump to page.`}
          >
            {currentPage}/{pages.length}
          </button>
          <button
            onClick={nextPage}
            disabled={currentPage >= pages.length && !nextChapter}
            className="p-2 sm:p-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-400/50 shadow-2xl backdrop-blur-md transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title={currentPage >= pages.length && nextChapter ? `Next Chapter (Ch. ${nextChapter.chapterNumber})` : `Next Page (${currentPage < pages.length ? currentPage + 1 : pages.length})`}
            aria-label="Next Page"
          >
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </aside>
      )}

      {/* Translation progress is cleanly displayed directly in the header action button */}

      {/* 5. Google AI Translator Text Dialog Modal */}
      {showAiTranslator && (
        <GoogleAITranslator
          titleContext={`${mangaTitle || chapter.mangaTitle} · Ch. ${chapter.chapterNumber}`}
          defaultTargetLang="bn"
          onClose={() => setShowAiTranslator(false)}
        />
      )}

      {/* 6. Manga Difference Inspector Modal */}
      {showPageDiffModal && pages.length > 0 && (
        <MangaPageDifferenceViewer
          pages={pages}
          initialPageNumber={diffTargetPage}
          mangaTitle={mangaTitle || chapter.mangaTitle || 'Manga'}
          chapterNumber={chapter.chapterNumber}
          defaultTargetLang={targetLang}
          onClose={() => setShowPageDiffModal(false)}
          onSelectPage={(newPage) => {
            jumpToPage(newPage);
          }}
        />
      )}

      {/* 7. Quick Jump to Page Modal Dialog */}
      {showJumpPageModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowJumpPageModal(false)}
        >
          <div
            className="w-full max-w-xs bg-slate-900 border border-slate-700/90 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span>Jump to Page</span>
              </h3>
              <button
                onClick={() => setShowJumpPageModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                aria-label="Close Jump Page Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter page number between <span className="text-white font-mono font-bold">1</span> and{' '}
              <span className="text-white font-mono font-bold">{pages.length}</span>:
            </p>

            <form onSubmit={handleJumpPageSubmit} className="space-y-3">
              <input
                type="number"
                min={1}
                max={pages.length}
                value={jumpPageInput}
                autoFocus
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder={`1 - ${pages.length}`}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-base text-center text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowJumpPageModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Jump
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
