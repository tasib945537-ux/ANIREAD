import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Filter,
  Flame,
  Star,
  BookOpen,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  User,
  Compass,
  Volume2,
  Calendar,
  FileText,
  X,
  Clock,
  Film,
} from 'lucide-react';
import {
  AnimeItem,
  MangaItem,
  MangaChapter,
  CharacterPreview,
  FilterState,
} from './types/anime';
import {
  getTopAnime,
  searchAnime,
  searchManga,
  getTopCharacters,
  getAnimeDetails,
  getTrendingSpotlight,
  getUpcomingAniListAnime,
  getMangaChaptersWithInfo,
  getMangaDetails,
  resolveMangaDexId,
} from './services/api';
import {
  getAllReadingProgress,
} from './services/offlineStorage';
import { ReadingProgress } from './types/anime';
import { Header, NavTab } from './components/Header';
import { AnimeCard } from './components/AnimeCard';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { MangaDetailModal } from './components/MangaDetailModal';
import { MangaReadPage } from './components/MangaReadPage';
import { MangaReader, ReadingSessionStats } from './components/MangaReader';
import { CharacterModal } from './components/CharacterModal';
import { LibraryView } from './components/LibraryView';
import { OfflineBanner } from './components/OfflineBanner';
import { FloatingTranslationPanel } from './components/FloatingTranslationPanel';
import { SubDetailsModal } from './components/SubDetailsModal';
import { AnimeLoadingState } from './components/AnimeLoadingState';
import { ServicesDirectoryPage } from './components/directory/ServicesDirectoryPage';
import { DubDetailsModal } from './components/DubDetailsModal';
import { DubReleaseCalendarModal } from './components/DubReleaseCalendarModal';
import { UpcomingAnimeSection } from './components/UpcomingAnimeSection';
import { GoogleAITranslator } from './components/GoogleAITranslator';
import { VoiceSearchButton } from './components/VoiceSearchButton';
import { PaginationWithJump } from './components/PaginationWithJump';
import { GeminiApiKeyPage } from './components/GeminiApiKeyPage';
import { getAnimeDubInfo } from './services/dubCatalog';
import { getUIText } from './services/translator';
import {
  syncHindiCatalogFromServer,
  subscribeHindiRegistry,
} from './services/hindiRegistry';
import {
  AudioDubFilterType,
  PlatformFilterType,
  FormatFilterType,
  SortFilterType,
} from './services/animeExplorerService';

const GENRES = [
  'All',
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Suspense',
];

const AUDIO_FILTER_OPTIONS: { id: AudioDubFilterType; label: string }[] = [
  { id: 'all', label: 'All Audio' },
  { id: 'hindi_only', label: 'Hindi Dub Only' },
  { id: 'hindi_complete', label: 'Complete Hindi Dub' },
  { id: 'hindi_partial', label: 'Partial Hindi Dub' },
  { id: 'hindi_announced', label: 'Announced Hindi Dub' },
  { id: 'english_only', label: 'English Dub Only' },
  { id: 'japanese_original', label: 'Japanese Original (Subtitles)' },
  { id: 'multi_audio', label: 'Multi Audio / Multiple Dubs' },
  { id: 'hindi_english', label: 'Hindi + English Dub' },
  { id: 'subtitles_only', label: 'Subtitles Only' },
  { id: 'partially_dubbed', label: 'Partially Dubbed' },
  { id: 'no_confirmed_dub', label: 'No Confirmed Dub' },
  { id: 'recently_updated', label: 'Recently Updated' },
  { id: 'any_dubbed', label: 'Any Dubbed Anime' },
];

const FORMAT_FILTER_OPTIONS: { id: FormatFilterType; label: string }[] = [
  { id: 'all', label: 'All Formats' },
  { id: 'TV', label: 'TV Series' },
  { id: 'Movie', label: 'Movies' },
  { id: 'OVA_ONA', label: 'OVA / ONA' },
  { id: 'Special', label: 'Special' },
];

export default function App() {
  // Navigation & Language
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.startsWith('/api-keys') || hash === '#api-keys') {
        return 'api-keys';
      }
      if (path.startsWith('/read') || hash === '#read' || hash.startsWith('#read/')) {
        return 'read';
      }
      if (path === '/directory' || hash === '#directory' || hash.startsWith('#directory/')) {
        return 'directory';
      }
      if (path.startsWith('/upcoming') || hash.startsWith('#upcoming')) {
        return 'upcoming';
      }
    }
    return 'anime';
  });
  const [currentLang, setCurrentLang] = useState<string>('en');

  // Synchronize URL hash with directory & upcoming routes
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.startsWith('/api-keys') || hash === '#api-keys') {
        setActiveTab('api-keys');
      } else if (path.startsWith('/read') || hash === '#read' || hash.startsWith('#read/')) {
        setActiveTab('read');
      } else if (path === '/directory' || hash === '#directory' || hash.startsWith('#directory/')) {
        setActiveTab('directory');
      } else if (path.startsWith('/upcoming') || hash.startsWith('#upcoming')) {
        setActiveTab('upcoming');
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSort, setSelectedSort] = useState<SortFilterType>('popularity');
  const [selectedDubFilter, setSelectedDubFilter] = useState<AudioDubFilterType>('all');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<PlatformFilterType>('all');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<FormatFilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalAnimeCount, setTotalAnimeCount] = useState<number | undefined>(undefined);
  const [totalAnimePages, setTotalAnimePages] = useState<number | undefined>(undefined);

  // Dub Details & Sub Details Modals state
  const [selectedDubBadgeModal, setSelectedDubBadgeModal] = useState<{ anime: AnimeItem; langCode: string } | null>(null);
  const [selectedSubModal, setSelectedSubModal] = useState<{ anime: AnimeItem; langCode?: string } | null>(null);
  const [showDubCalendarModal, setShowDubCalendarModal] = useState(false);
  const [hindiRegistryVersion, setHindiRegistryVersion] = useState(0);
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);

  // Open API key setup automatically when a translation is requested without a key.
  useEffect(() => {
    const openApiKeySetup = () => {
      setActiveReadingChapter(null);
      setActiveTab('api-keys');
      window.history.pushState(null, '', '#api-keys');
    };
    window.addEventListener('aniread:request-api-key', openApiKeySetup);
    return () => window.removeEventListener('aniread:request-api-key', openApiKeySetup);
  }, []);

  // Manga Reading Session Stats Toast Notification
  const [readingSessionToast, setReadingSessionToast] = useState<ReadingSessionStats | null>(null);

  // Auto-dismiss reading session timer toast
  useEffect(() => {
    if (!readingSessionToast) return;
    const timer = setTimeout(() => {
      setReadingSessionToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [readingSessionToast]);

  // Content items
  const [animeList, setAnimeList] = useState<AnimeItem[]>([]);
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [charactersList, setCharactersList] = useState<CharacterPreview[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<AnimeItem[]>([]);
  const [trendingManga, setTrendingManga] = useState<MangaItem[]>([]);
  const [upcomingPreview, setUpcomingPreview] = useState<AnimeItem[]>([]);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [recentReading, setRecentReading] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Anime list is pre-filtered and paginated by searchAnime / animeExplorerService,
  // guaranteeing exactly 10 anime per page across all pages without client-side dropping
  const displayedAnimeList = animeList;

  // Modals & Reader state
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);
  const [selectedManga, setSelectedManga] = useState<MangaItem | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<{
    id: number;
    name: string;
    image: string;
    animePics?: string[];
  } | null>(null);
  const [activeReadingChapter, setActiveReadingChapter] = useState<{
    chapter: MangaChapter;
    allChapters: MangaChapter[];
    mangaTitle: string;
    mangaCover: string;
    initialPage?: number;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Register Service Worker for PWA & offline caching, and fetch trending spotlight & reading progress
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    }

    // Load recent reading progress from IndexedDB
    getAllReadingProgress().then((progs) => {
      if (progs && progs.length > 0) {
        setRecentReading(progs[0]);
      }
    });

    // Load trending spotlight & upcoming AniList preview strip
    getTrendingSpotlight().then(({ anime, manga }) => {
      setTrendingAnime(anime);
      setTrendingManga(manga);
    });

    getUpcomingAniListAnime({ page: 1, perPage: 8, sort: 'POPULARITY_DESC' }).then((res) => {
      if (res.items?.length) setUpcomingPreview(res.items);
    });

    // Synchronize live server Hindi Dub DB into runtime registry
    syncHindiCatalogFromServer();
    const unsubscribeRegistry = subscribeHindiRegistry(() => {
      setHindiRegistryVersion((v) => v + 1);
    });

    // Detect direct URL route or hash navigation
    const checkRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.startsWith('/api-keys') || hash === '#api-keys') {
        setActiveTab('api-keys');
      } else if (path.startsWith('/read') || hash === '#read' || hash.startsWith('#read/')) {
        setActiveTab('read');
      } else if (path.startsWith('/manga') || hash.startsWith('#manga')) {
        setActiveTab('manga');
      } else if (path.startsWith('/library') || hash.startsWith('#library')) {
        setActiveTab('library');
      } else if (path.startsWith('/characters') || hash.startsWith('#characters')) {
        setActiveTab('characters');
      } else if (path.startsWith('/upcoming') || hash.startsWith('#upcoming')) {
        setActiveTab('upcoming');
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      unsubscribeRegistry();
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  // Fetch Media based on active tab & filters
  useEffect(() => {
    let isMounted = true;
    if (activeTab === 'upcoming' || activeTab === 'library' || activeTab === 'directory') {
      setLoading(false);
      return;
    }
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        if (activeTab === 'anime') {
          const res = await searchAnime(
            searchQuery,
            currentPage,
            selectedGenre !== 'All' ? selectedGenre : undefined,
            selectedStatus !== 'all' ? selectedStatus : undefined,
            selectedSort,
            10,
            selectedDubFilter,
            selectedPlatformFilter,
            selectedFormatFilter
          );
          if (isMounted) {
            setAnimeList(res.items);
            setHasNextPage(res.hasNextPage);
            setTotalAnimeCount(res.total);
            setTotalAnimePages(res.totalPages);
            setLoading(false);
          }
        } else if (activeTab === 'manga' || activeTab === 'read') {
          const res = await searchManga(
            searchQuery,
            currentPage,
            selectedGenre !== 'All' ? selectedGenre : undefined
          );
          if (isMounted) {
            setMangaList(res.items);
            setHasNextPage(res.hasNextPage);
            setLoading(false);
          }
        } else if (activeTab === 'characters') {
          const res = await getTopCharacters(currentPage);
          if (isMounted) {
            setCharactersList(res.characters);
            setHasNextPage(res.hasNextPage);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (isMounted) setLoading(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeTab, searchQuery, selectedGenre, selectedStatus, selectedSort, currentPage, selectedDubFilter, selectedPlatformFilter, selectedFormatFilter, hindiRegistryVersion]);

  // Handle cross-navigation
  const handleReadMangaFromAnime = async (animeTitle: string) => {
    setActiveTab('manga');
    setSearchQuery(animeTitle);
    setCurrentPage(1);
    setSelectedAnimeId(null);
    setSelectedAnime(null);
    try {
      const res = await searchManga(animeTitle, 1);
      if (res.items.length > 0) {
        setSelectedManga(res.items[0]);
      }
    } catch (e) {
      console.warn('Auto-open manga error:', e);
    }
  };

  const refreshReadingProgress = () => {
    getAllReadingProgress().then((progs) => {
      if (progs && progs.length > 0) {
        setRecentReading(progs[0]);
      }
    });
  };

  const handleContinueReading = async (reading: ReadingProgress) => {
    try {
      // 1. Fetch chapters for this manga
      const mangaDexId = resolveMangaDexId(reading.mangaId, reading.mangaTitle);
      const res = await getMangaChaptersWithInfo(mangaDexId, 'all', reading.mangaTitle);

      const targetChapter =
        res.chapters.find((c) => c.id === reading.lastChapterId) ||
        res.chapters.find((c) => c.chapterNumber === reading.lastChapterNumber) ||
        (res.chapters.length > 0 ? res.chapters[0] : null);

      if (targetChapter) {
        setActiveReadingChapter({
          chapter: targetChapter,
          allChapters: res.chapters,
          mangaTitle: reading.mangaTitle,
          mangaCover: reading.coverImage,
          initialPage: reading.lastPage || 1,
        });
        return;
      }
    } catch (e) {
      console.warn('Direct continue reading fetch error:', e);
    }

    // 2. Direct fallback chapter
    const fallbackChapter: MangaChapter = {
      id: reading.lastChapterId,
      mangaId: reading.mangaId,
      mangaTitle: reading.mangaTitle,
      chapterNumber: reading.lastChapterNumber,
      title: `Chapter ${reading.lastChapterNumber}`,
      language: 'en',
      pageCount: reading.totalPages,
    };

    setActiveReadingChapter({
      chapter: fallbackChapter,
      allChapters: [fallbackChapter],
      mangaTitle: reading.mangaTitle,
      mangaCover: reading.coverImage,
      initialPage: reading.lastPage || 1,
    });
  };

  const handleOpenAnimeFromLibrary = (animeId: number) => {
    setSelectedAnimeId(animeId);
  };

  const handleOpenMangaFromLibrary = async (mangaId: string | number) => {
    const found = mangaList.find((m) => m.id === mangaId);
    if (found) {
      setSelectedManga(found);
      return;
    }

    // Check reading progress
    const allProgress = await getAllReadingProgress();
    const prog = allProgress.find((p) => p.mangaId === mangaId);
    if (prog) {
      setSelectedManga({
        id: mangaId,
        title: prog.mangaTitle,
        coverImage: prog.coverImage,
        authors: ['Author'],
        status: 'Publishing',
        genres: ['Action', 'Fantasy'],
        synopsis: `Continue reading ${prog.mangaTitle} from Chapter ${prog.lastChapterNumber}.`,
        sourceApi: 'mangadex',
      });
      return;
    }

    try {
      const details = await getMangaDetails(mangaId, String(mangaId));
      setSelectedManga(details);
    } catch {
      setSelectedManga({
        id: mangaId,
        title: 'Manga Details',
        coverImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
        authors: ['Author'],
        status: 'Publishing',
        genres: ['Action', 'Fantasy'],
        synopsis: 'Manga from library.',
        sourceApi: 'mangadex',
      });
    }
  };

  const handleReadOfflineChapter = (chapter: MangaChapter) => {
    setActiveReadingChapter({
      chapter,
      allChapters: [chapter],
      mangaTitle: chapter.mangaTitle || 'Offline Manga',
      mangaCover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    });
  };

  const handleReadMangaChapterDirect = async (
    mangaId: string | number,
    chapterNumber: string,
    mangaTitle?: string,
    mangaCover?: string,
    startPage: number = 1
  ) => {
    try {
      const mangaDexId = resolveMangaDexId(mangaId, mangaTitle);
      const res = await getMangaChaptersWithInfo(mangaDexId, 'all', mangaTitle);
      const targetChapter =
        res.chapters.find((c) => String(c.chapterNumber) === String(chapterNumber)) ||
        (res.chapters.length > 0 ? res.chapters[0] : null);

      if (targetChapter) {
        setActiveReadingChapter({
          chapter: targetChapter,
          allChapters: res.chapters,
          mangaTitle: mangaTitle || targetChapter.mangaTitle || 'Manga',
          mangaCover: mangaCover || '',
          initialPage: startPage || 1,
        });
        return;
      }
    } catch (err) {
      console.warn('Direct read chapter fetch error:', err);
    }

    // Direct resilient fallback chapter
    const fallbackChapter: MangaChapter = {
      id: `${mangaId}_ch${chapterNumber}`,
      mangaId: mangaId,
      mangaTitle: mangaTitle || 'Manga',
      chapterNumber: chapterNumber,
      title: `Chapter ${chapterNumber}`,
      language: 'en',
      pageCount: 30,
    };
    setActiveReadingChapter({
      chapter: fallbackChapter,
      allChapters: [fallbackChapter],
      mangaTitle: mangaTitle || 'Manga',
      mangaCover: mangaCover || '',
      initialPage: startPage || 1,
    });
  };

  const spotlightItem = animeList.length > 0 ? animeList[0] : null;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-600/40">
      {/* 3-Zone Top Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
          if (tab === 'directory') {
            try {
              if (!window.location.hash.startsWith('#directory/')) {
                window.history.pushState(null, '', '#directory');
              }
            } catch {
              // ignore
            }
          } else if (tab === 'upcoming') {
            try {
              window.history.pushState(null, '', '#upcoming');
            } catch {
              // ignore
            }
          } else if (tab === 'read') {
            try {
              window.history.pushState(null, '', '#read');
            } catch {
              // ignore
            }
          } else if (tab === 'manga') {
            try {
              window.history.pushState(null, '', '#manga');
            } catch {
              // ignore
            }
          } else if (tab === 'api-keys') {
            try {
              window.history.pushState(null, '', '#api-keys');
            } catch {
              // ignore
            }
          } else if (tab === 'anime') {
            try {
              window.history.pushState(null, '', '#home');
            } catch {
              // ignore
            }
          }
        }}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onSearchFocus={() => {
          searchInputRef.current?.focus();
        }}
        onOpenTranslator={() => setIsTranslatorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeTab === 'api-keys' && <GeminiApiKeyPage />}

        {/* TAB 1: ANIME EXPLORER & TAB 2: MANGA DIRECTORY */}
        {(activeTab === 'anime' || activeTab === 'manga') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
            {/* 1. Continue Reading Ribbon (if user has read any chapter) */}
            {recentReading && !searchQuery && currentPage === 1 && (
              <div
                onClick={() => handleContinueReading(recentReading)}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-700/50 shadow-xl cursor-pointer hover:border-indigo-500/80 transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-indigo-800/60 group-hover:scale-105 transition-transform flex items-center justify-center">
                    {recentReading.coverImage && recentReading.coverImage.trim() !== '' ? (
                      <img
                        src={recentReading.coverImage}
                        alt={recentReading.mangaTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-indigo-400 font-semibold uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Continue Reading</span>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {recentReading.mangaTitle}
                    </h4>
                    <p className="text-xs text-slate-300 font-mono">
                      Ch. {recentReading.lastChapterNumber} · Page {recentReading.lastPage} of {recentReading.totalPages}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContinueReading(recentReading);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <span>Resume (Page {recentReading.lastPage})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. Dynamic Hero Carousel (Featured AniList Trending Anime & Manga) */}
            {currentPage === 1 && !searchQuery && (
              (() => {
                const currentHeroList = activeTab === 'anime' ? (trendingAnime.length > 0 ? trendingAnime : animeList) : (trendingManga.length > 0 ? trendingManga : mangaList);
                const heroItem = currentHeroList[spotlightIndex % Math.max(currentHeroList.length, 1)] || spotlightItem;

                if (!heroItem) return null;

                const isAnimeHero = activeTab === 'anime';
                const heroScore = heroItem.score ? heroItem.score.toFixed(1) : null;

                return (
                  <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl min-h-[340px] sm:min-h-[400px] flex items-end p-6 sm:p-12 transition-all">
                    {/* Backdrop */}
                    {heroItem.bannerImage && heroItem.bannerImage.trim() !== '' && (
                      <img
                        src={heroItem.bannerImage}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/75 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19]/90 via-[#0b0f19]/40 to-transparent" />

                    {/* Content */}
                    <div className="relative z-10 max-w-3xl space-y-3.5 text-left">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 text-indigo-400 font-semibold tracking-wide uppercase">
                          <Flame className="w-4 h-4 text-indigo-400" />
                          <span>Featured {isAnimeHero ? 'Anime' : 'Manga'}</span>
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="font-mono text-slate-300 font-medium">
                          {heroItem.format || (isAnimeHero ? 'TV Series' : 'Manga')}
                          {(() => {
                            const heroYear = isAnimeHero ? (heroItem as AnimeItem).year : (heroItem as MangaItem).releaseYear;
                            return heroYear ? ` · ${heroYear}` : '';
                          })()}
                        </span>
                        {heroScore && (
                          <>
                            <span className="text-slate-500">·</span>
                            <span className="flex items-center gap-1 font-mono text-amber-300 font-semibold">
                              <Star className="w-3.5 h-3.5 fill-amber-300" />
                              {heroScore} / 10
                            </span>
                          </>
                        )}
                      </div>

                      <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                        {heroItem.title}
                      </h1>

                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-2xl">
                        {heroItem.synopsis}
                      </p>

                      {/* Clean Unboxed Genres */}
                      {heroItem.genres && heroItem.genres.length > 0 && (
                        <p className="text-xs text-indigo-300/90 font-medium">
                          {heroItem.genres.slice(0, 4).join(' · ')}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {isAnimeHero ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAnime(heroItem as AnimeItem);
                                setSelectedAnimeId(Number(heroItem.id));
                              }}
                              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition-colors flex items-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>{getUIText('details', currentLang)}</span>
                            </button>
                            <button
                              onClick={() => handleReadMangaFromAnime(heroItem.title)}
                              className="px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>{getUIText('readManga', currentLang)}</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setSelectedManga(heroItem as MangaItem)}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition-colors flex items-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>Read Manga Chapters →</span>
                          </button>
                        )}

                        {/* Carousel Switcher Dots */}
                        {currentHeroList.length > 1 && (
                          <div className="flex items-center gap-1.5 ml-auto">
                            {currentHeroList.slice(0, 5).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setSpotlightIndex(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                  (spotlightIndex % Math.min(currentHeroList.length, 5)) === i
                                    ? 'bg-indigo-500 w-6'
                                    : 'bg-slate-700 hover:bg-slate-500'
                                }`}
                                aria-label={`Go to slide ${i + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* 3. Top Ranked Trending Showcase Row */}
            {currentPage === 1 && !searchQuery && (
              (() => {
                const showcaseList = activeTab === 'anime' ? trendingAnime : trendingManga;
                if (showcaseList.length === 0) return null;

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-rose-500" />
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          Top Trending {activeTab === 'anime' ? 'Anime' : 'Manga'} This Week
                        </h2>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Top Charts</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
                      {showcaseList.slice(0, 8).map((item, idx) => (
                        <div
                          key={`${item.id}-${idx}`}
                          onClick={() => {
                            if (activeTab === 'anime') {
                              setSelectedAnime(item as AnimeItem);
                              setSelectedAnimeId(Number(item.id));
                            } else {
                              setSelectedManga(item as MangaItem);
                            }
                          }}
                          className="relative w-36 sm:w-44 shrink-0 cursor-pointer group"
                        >
                          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg relative group-hover:border-indigo-500/60 transition-all duration-300 flex items-center justify-center">
                            {item.coverImage && item.coverImage.trim() !== '' ? (
                              <img
                                src={item.coverImage}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <Layers className="w-8 h-8 text-slate-500" />
                            )}
                            {/* Giant Ranking Number Badge */}
                            <span className="absolute bottom-1 left-2 font-black text-4xl sm:text-5xl text-white/90 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] italic font-mono pointer-events-none">
                              #{idx + 1}
                            </span>
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-indigo-300">
                              HD
                            </div>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-200 mt-2 line-clamp-1 group-hover:text-indigo-400">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {item.score ? `★ ${item.score.toFixed(1)}` : 'Trending'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}

            {/* 3B. Upcoming Anime on AniList Preview Strip (Home Page) */}
            {activeTab === 'anime' && currentPage === 1 && !searchQuery && upcomingPreview.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Upcoming Anime on AniList
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('upcoming');
                      setCurrentPage(1);
                      try {
                        window.history.pushState(null, '', '#upcoming');
                      } catch {
                        // ignore
                      }
                    }}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Upcoming</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
                  {upcomingPreview.map((item, idx) => (
                    <div key={`${item.id}-up-${idx}`} className="w-36 sm:w-44 shrink-0">
                      <AnimeCard
                        item={item}
                        type="anime"
                        showUpcomingDetails={true}
                        onClick={() => {
                          setSelectedAnime(item);
                          setSelectedAnimeId(Number(item.id));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Search Input with Web Speech API Voice-to-Text */}
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={
                      activeTab === 'anime'
                        ? (getUIText('searchPlaceholder', currentLang) || 'Search anime...')
                        : (getUIText('mangaSearchPlaceholder', currentLang) || 'Search manga...')
                    }
                    className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500 transition-colors"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="Clear search"
                        aria-label="Clear search query"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <VoiceSearchButton
                      onSpeechResult={(transcript) => {
                        setSearchQuery(transcript);
                        setCurrentPage(1);
                      }}
                      currentLang={currentLang}
                      activeTab={activeTab}
                    />
                  </div>
                </div>

                {/* Sort & Status Controls */}
                <div className="flex items-center gap-2 text-xs">
                  {activeTab === 'anime' && (
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Status</option>
                      <option value="airing">Currently Airing</option>
                      <option value="complete">Completed</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  )}

                  <select
                    value={selectedSort}
                    onChange={(e) => {
                      setSelectedSort(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="popularity">Most Popular</option>
                    <option value="score">Highest Rated</option>
                    <option value="updated">Recently Updated</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title_asc">A–Z</option>
                    <option value="title_desc">Z–A</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Chips & Clear All Filters */}
              {activeTab === 'anime' &&
                (searchQuery ||
                  selectedGenre !== 'All' ||
                  selectedStatus !== 'all' ||
                  selectedDubFilter !== 'all' ||
                  selectedPlatformFilter !== 'all' ||
                  selectedFormatFilter !== 'all') && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                    <span className="text-[11px] font-semibold text-slate-400">Active Filters:</span>
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 text-xs font-medium hover:bg-indigo-900 transition-colors cursor-pointer"
                        title="Remove search filter"
                      >
                        <span>Search: "{searchQuery}"</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {selectedGenre !== 'All' && (
                      <button
                        onClick={() => {
                          setSelectedGenre('All');
                          setCurrentPage(1);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 text-xs font-medium hover:bg-indigo-900 transition-colors cursor-pointer"
                        title="Remove genre filter"
                      >
                        <span>Genre: {selectedGenre}</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {selectedStatus !== 'all' && (
                      <button
                        onClick={() => {
                          setSelectedStatus('all');
                          setCurrentPage(1);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 text-xs font-medium hover:bg-indigo-900 transition-colors cursor-pointer"
                        title="Remove status filter"
                      >
                        <span className="capitalize">Status: {selectedStatus}</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {selectedDubFilter !== 'all' && (
                      <button
                        onClick={() => {
                          setSelectedDubFilter('all');
                          setCurrentPage(1);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-700/60 text-amber-200 text-xs font-medium hover:bg-amber-900 transition-colors cursor-pointer"
                        title="Remove audio filter"
                      >
                        <span>
                          Audio: {AUDIO_FILTER_OPTIONS.find((o) => o.id === selectedDubFilter)?.label || selectedDubFilter}
                        </span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {selectedPlatformFilter !== 'all' && (
                      <button
                        onClick={() => {
                          setSelectedPlatformFilter('all');
                          setCurrentPage(1);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-700/60 text-purple-200 text-xs font-medium hover:bg-purple-900 transition-colors cursor-pointer"
                        title="Remove platform filter"
                      >
                        <span>Platform: {selectedPlatformFilter}</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {selectedFormatFilter !== 'all' && (
                      <button
                        onClick={() => {
                          setSelectedFormatFilter('all');
                          setCurrentPage(1);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs font-medium hover:bg-emerald-900 transition-colors cursor-pointer"
                        title="Remove format filter"
                      >
                        <span>
                          Format: {FORMAT_FILTER_OPTIONS.find((o) => o.id === selectedFormatFilter)?.label || selectedFormatFilter}
                        </span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedGenre('All');
                        setSelectedStatus('all');
                        setSelectedDubFilter('all');
                        setSelectedPlatformFilter('all');
                        setSelectedFormatFilter('all');
                        setSelectedSort('popularity');
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-semibold hover:bg-rose-900 transition-colors ml-auto cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear All Filters</span>
                    </button>
                  </div>
                )}

              {/* Genre Segmented Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setSelectedGenre(g);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                      selectedGenre === g
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Audio Dub Segmented Filter Bar */}
              {activeTab === 'anime' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Audio Dub:</span>
                      </span>
                      {AUDIO_FILTER_OPTIONS.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setSelectedDubFilter(tab.id);
                            setCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-[11px] font-bold transition-all cursor-pointer ${
                            selectedDubFilter === tab.id
                              ? 'bg-amber-600 text-white shadow-sm shadow-amber-900/40 border border-amber-400/50'
                              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <button
                        onClick={() => setShowDubCalendarModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md border border-indigo-400/30 transition-all cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Dub Release Calendar</span>
                      </button>
                    </div>
                  </div>

                  {/* Format Filter Bar (TV Series, Movies, OVA/ONA, Special) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
                        <Film className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Format:</span>
                      </span>
                      {FORMAT_FILTER_OPTIONS.map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => {
                            setSelectedFormatFilter(fmt.id);
                            setCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-[11px] font-bold transition-all cursor-pointer ${
                            selectedFormatFilter === fmt.id
                              ? 'bg-emerald-600 text-white shadow-sm border border-emerald-400/50'
                              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>

                    {spotlightItem && (
                      <button
                        onClick={() => setSelectedSubModal({ anime: spotlightItem, langCode: 'all' })}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto border border-slate-700 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Sub Details Catalog</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Media Grid Top Anchor for smooth Jump Page scrolling */}
            <div id="catalog-grid-top" className="scroll-mt-24" />

            {/* Media Grid */}
            {loading ? (
              <AnimeLoadingState
                message="Loading..."
                subMessage={`Summoning ${activeTab === 'anime' ? 'anime catalog (10 per page) & verified streaming links' : 'manga chapter archives'}...`}
                size="lg"
                characterTheme={activeTab === 'anime' ? 'monarch' : 'chibi'}
                showThemeToggle={true}
              />
            ) : (activeTab === 'anime' ? displayedAnimeList : mangaList).length === 0 ? (
              <div className="text-center py-20 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
                <Compass className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No results found</p>
                <p className="text-xs text-slate-400">
                  Try adjusting your search terms, clearing the dub filter, or picking another genre.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {activeTab === 'anime'
                  ? displayedAnimeList.map((item, idx) => {
                      const isHindiFilterActive =
                        selectedDubFilter.startsWith('hindi') ||
                        selectedPlatformFilter === 'anime_times' ||
                        selectedPlatformFilter === 'muse';
                      return (
                        <AnimeCard
                          key={`${item.id}-${item.sourceApi || 'local'}-${idx}`}
                          item={item}
                          type="anime"
                          showHindiDetails={isHindiFilterActive}
                          onClick={() => {
                            setSelectedAnime(item);
                            setSelectedAnimeId(item.id);
                          }}
                          onDubBadgeClick={(anime, langCode) => {
                            setSelectedDubBadgeModal({ anime, langCode });
                          }}
                        />
                      );
                    })
                  : mangaList.map((item, idx) => (
                      <AnimeCard
                        key={`${item.id}-${idx}`}
                        item={item}
                        type="manga"
                        onClick={() => setSelectedManga(item)}
                      />
                    ))}
              </div>
            )}

            {/* Pagination with Jump to Page (10 anime per page) */}
            {!loading && (
              <PaginationWithJump
                currentPage={currentPage}
                hasNextPage={hasNextPage}
                totalPages={activeTab === 'anime' ? totalAnimePages : undefined}
                totalItems={activeTab === 'anime' ? totalAnimeCount : undefined}
                onPageChange={(p) => setCurrentPage(p)}
                targetScrollId="catalog-grid-top"
                itemName={activeTab === 'anime' ? 'anime' : 'manga'}
              />
            )}
          </div>
        )}

        {activeTab === 'read' && (
          <MangaReadPage
            mangaItems={mangaList}
            recentReading={recentReading}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
            onOpenManga={(manga) => setSelectedManga(manga)}
            onResume={handleContinueReading}
            onExploreManga={() => {
              setActiveTab('manga');
              setCurrentPage(1);
              try {
                window.history.pushState(null, '', '#manga');
              } catch {
                // ignore
              }
            }}
          />
        )}

        {/* TAB 3: TOP CHARACTERS & 20+ PHOTOS GALLERIES */}
        {activeTab === 'characters' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-400" />
                <span>{getUIText('topCharacters', currentLang)}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Explore iconic anime and manga characters. Click any character to access their complete profile, lore translation, and a guaranteed <strong className="text-white">20+ Photos Gallery</strong> with full-screen lightbox.
              </p>
            </div>

            {loading ? (
              <AnimeLoadingState
                message="Loading..."
                subMessage="Summoning legendary character roster & 20+ photo galleries..."
                size="lg"
                characterTheme="chibi"
                showThemeToggle={true}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {charactersList.map((char) => (
                  <div
                    key={char.id}
                    onClick={() =>
                      setSelectedCharacter({
                        id: char.id,
                        name: char.name,
                        image: char.image,
                      })
                    }
                    className="group flex flex-col p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:-translate-y-1 shadow-md"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-950 mb-2.5 relative flex items-center justify-center">
                      {char.image && char.image.trim() !== '' ? (
                        <img
                          src={char.image}
                          alt={char.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-500" />
                      )}
                      <span className="absolute bottom-2 right-2 bg-black/70 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        20+ Photos
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-white truncate group-hover:text-indigo-400">
                      {char.name}
                    </h3>
                    {char.nativeName && (
                      <p className="text-[11px] text-slate-400 truncate">{char.nativeName}</p>
                    )}

                    {char.favorites && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-300/90 font-mono mt-1">
                        <Star className="w-3 h-3 fill-amber-300" />
                        <span>{char.favorites.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Characters Grid Top Anchor for smooth Jump Page scrolling */}
            <div id="characters-grid-top" className="scroll-mt-24" />

            {/* Pagination with Jump to Page */}
            {!loading && (
              <PaginationWithJump
                currentPage={currentPage}
                hasNextPage={hasNextPage}
                onPageChange={(p) => setCurrentPage(p)}
                targetScrollId="characters-grid-top"
                itemName="characters"
              />
            )}
          </div>
        )}

        {/* TAB 4: MY LIBRARY & OFFLINE HUB */}
        {activeTab === 'library' && (
          <LibraryView
            currentLang={currentLang}
            onReadOfflineChapter={handleReadOfflineChapter}
            onOpenAnime={handleOpenAnimeFromLibrary}
            onOpenManga={handleOpenMangaFromLibrary}
            onContinueReading={handleContinueReading}
            onReadMangaChapter={handleReadMangaChapterDirect}
          />
        )}


        {/* TAB 5: UPCOMING ANIME (ANILIST.COM) */}
        {activeTab === 'upcoming' && (
          <UpcomingAnimeSection
            onSelectAnime={(anime) => {
              setSelectedAnime(anime);
              setSelectedAnimeId(Number(anime.id));
            }}
          />
        )}

        {/* TAB 6: ANIME & MANGA SERVICES DIRECTORY (inspired by EverythingMoe) */}
        {activeTab === 'directory' && (
          <ServicesDirectoryPage
            currentLang={currentLang}
            onOpenAnime={(id) => {
              setSelectedAnimeId(id);
            }}
          />
        )}
      </main>

      {/* Anime Detail Modal */}
      {selectedAnimeId !== null && (
        <AnimeDetailModal
          key={selectedAnimeId}
          animeId={selectedAnimeId}
          initialAnime={
            (selectedAnime && (String(selectedAnime.id) === String(selectedAnimeId) || String(selectedAnime.malId) === String(selectedAnimeId) || String(selectedAnime.anilistId) === String(selectedAnimeId)) ? selectedAnime : null) ||
            animeList.find((a) => String(a.id) === String(selectedAnimeId) || String(a.malId) === String(selectedAnimeId) || String(a.anilistId) === String(selectedAnimeId)) ||
            trendingAnime.find((a) => String(a.id) === String(selectedAnimeId) || String(a.malId) === String(selectedAnimeId) || String(a.anilistId) === String(selectedAnimeId)) ||
            upcomingPreview.find((a) => String(a.id) === String(selectedAnimeId) || String(a.malId) === String(selectedAnimeId) || String(a.anilistId) === String(selectedAnimeId)) ||
            undefined
          }
          currentLang={currentLang}
          onClose={() => {
            setSelectedAnimeId(null);
            setSelectedAnime(null);
          }}
          onSelectCharacter={(charId, name, image, animePics) => {
            setSelectedCharacter({ id: charId, name, image, animePics });
          }}
          onReadManga={handleReadMangaFromAnime}
          onSelectAnime={(newId, seedItem) => {
            if (seedItem) setSelectedAnime(seedItem);
            else setSelectedAnime(null);
            setSelectedAnimeId(newId);
          }}
        />
      )}

      {/* Manga Detail Modal */}
      {selectedManga !== null && (
        <MangaDetailModal
          key={selectedManga.id}
          manga={selectedManga}
          currentLang={currentLang}
          onClose={() => setSelectedManga(null)}
          onReadChapter={(chapter, allChapters, initialPage) => {
            setActiveReadingChapter({
              chapter,
              allChapters,
              mangaTitle: selectedManga.title,
              mangaCover: selectedManga.coverImage,
              initialPage: initialPage || 1,
            });
          }}
          onSelectAnime={(animeId) => {
            setSelectedManga(null);
            setSelectedAnime(null);
            setSelectedAnimeId(animeId);
          }}
          onSelectCharacter={(charId, name, image) => {
            setSelectedCharacter({ id: charId, name, image });
          }}
        />
      )}

      {/* Character Profile & 20+ Photos Gallery Modal */}
      {selectedCharacter !== null && (
        <CharacterModal
          characterId={selectedCharacter.id}
          initialName={selectedCharacter.name}
          initialImage={selectedCharacter.image}
          animePictures={selectedCharacter.animePics}
          currentLang={currentLang}
          onClose={() => setSelectedCharacter(null)}
          onSelectAnime={(animeId) => {
            setSelectedAnime(null);
            setSelectedAnimeId(animeId);
          }}
        />
      )}

      {/* Fullscreen Manga Reader */}
      {activeReadingChapter !== null && (
        <MangaReader
          chapter={activeReadingChapter.chapter}
          allChapters={activeReadingChapter.allChapters}
          mangaTitle={activeReadingChapter.mangaTitle}
          mangaCover={activeReadingChapter.mangaCover}
          initialPage={activeReadingChapter.initialPage}
          onClose={(stats) => {
            setActiveReadingChapter(null);
            refreshReadingProgress();
            if (stats && stats.seconds > 0) {
              setReadingSessionToast(stats);
            }
          }}
          onSelectChapter={(nextCh) => {
            setActiveReadingChapter((prev) =>
              prev ? { ...prev, chapter: nextCh, initialPage: 1 } : null
            );
          }}
        />
      )}

      {/* Offline Status Alert Banner */}
      <OfflineBanner />

      {/* Dub Details Panel (Rule 5: Clicking HI, EN, TA, TE shows full evidence panel) */}
      <DubDetailsModal
        isOpen={selectedDubBadgeModal !== null}
        onClose={() => setSelectedDubBadgeModal(null)}
        anime={selectedDubBadgeModal?.anime || null}
        initialLanguageCode={selectedDubBadgeModal?.langCode || 'hi'}
        onOpenEpisodeTimers={() => {
          if (selectedDubBadgeModal?.anime) {
            setSelectedAnime(selectedDubBadgeModal.anime);
            setSelectedAnimeId(selectedDubBadgeModal.anime.id);
          }
        }}
      />

      {/* Sub Details Modal (New Sub Details Page / Subtitle Catalog) */}
      <SubDetailsModal
        isOpen={selectedSubModal !== null}
        onClose={() => setSelectedSubModal(null)}
        anime={selectedSubModal?.anime || null}
        initialLangCode={selectedSubModal?.langCode || 'all'}
      />

      {/* Dub Release Calendar Modal (Rule 7: Announced & confirmed upcoming dubbed episodes) */}
      <DubReleaseCalendarModal
        isOpen={showDubCalendarModal}
        onClose={() => setShowDubCalendarModal(false)}
        onSelectAnimeTitle={(title) => {
          setSearchQuery(title);
          setShowDubCalendarModal(false);
        }}
      />

      {/* Interactive Google AI Translator Modal */}
      {isTranslatorOpen && (
        <GoogleAITranslator
          onClose={() => setIsTranslatorOpen(false)}
        />
      )}

      {/* 'Time spent reading' Toast Notification upon closing MangaReader */}
      {readingSessionToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-950/95 border border-indigo-500/60 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 shadow-inner">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Reading Session Recorded
                </span>
                <button
                  onClick={() => setReadingSessionToast(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                  aria-label="Close reading session notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm font-semibold text-white truncate mt-0.5">
                {readingSessionToast.mangaTitle}
              </p>
              <div className="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="bg-slate-900 border border-slate-700/80 text-slate-200 px-1.5 py-0.5 rounded font-mono text-[11px]">
                  Ch. {readingSessionToast.chapterNumber}
                </span>
                <span className="text-slate-400">Time spent reading:</span>
                <span className="font-bold text-amber-300 font-mono bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded text-[12px]">
                  ⏱️ {readingSessionToast.formattedDuration}
                </span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Persistent Floating Background Manga Translation Progress Panel */}
      <FloatingTranslationPanel onOpenReader={handleReadMangaChapterDirect} />
    </div>
  );
}
