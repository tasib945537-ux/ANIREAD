import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Download,
  Trash2,
  Clock,
  Bookmark,
  HardDrive,
  ArrowRight,
  Sparkles,
  WifiOff,
  AlertTriangle,
  Search,
  Filter,
  Flame,
  Check,
  Upload,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Database,
  Layers,
  Play,
  RefreshCw,
  Volume2,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Tv,
  Globe,
  Cloud,
} from 'lucide-react';
import {
  getAllOfflineChapters,
  deleteOfflineChapter,
  clearAllOfflineChapters,
  getAllReadingProgress,
  deleteReadingProgress,
  getAllFavorites,
  getStorageStats,
  exportLibraryBackup,
  importLibraryBackup,
  FavoriteItem,
  getMyDubList,
  saveToMyDubList,
  removeFromMyDubList,
  updateDubListProgress,
  syncMyDubListWithFirestore,
  MyDubListItem,
} from '../services/offlineStorage';
import { ReadingProgress, MangaChapter, OfflineChapterData, AnimeItem } from '../types/anime';
import { getUIText } from '../services/translator';
import { AnimeLoadingState } from './AnimeLoadingState';
import {
  getAllMangaTranslationSummaries,
  MangaTranslationSummary,
  mangaTranslationQueue,
} from '../services/mangaTranslationService';
import { VERIFIED_24_ANIME_WEBSITES } from './anime-detail/AnimeWebSourceChecker';
import { getAnimeAudioAvailability, buildVerifiedPlatformUrl } from '../services/dubVerificationStorage';
import { useFirebase } from '../contexts/FirebaseContext';

interface Props {
  currentLang: string;
  onReadOfflineChapter: (chapter: MangaChapter) => void;
  onOpenAnime: (animeId: number) => void;
  onOpenManga: (mangaId: string | number) => void;
  onContinueReading?: (progress: ReadingProgress) => void;
  onReadMangaChapter?: (
    mangaId: string | number,
    chapterNumber: string,
    mangaTitle?: string,
    mangaCover?: string,
    startPage?: number
  ) => void;
}

export const LibraryView: React.FC<Props> = ({
  currentLang,
  onReadOfflineChapter,
  onOpenAnime,
  onOpenManga,
  onContinueReading,
  onReadMangaChapter,
}) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'history' | 'favorites' | 'translations' | 'dublist' | 'stats'>('downloads');
  const [offlineChapters, setOfflineChapters] = useState<OfflineChapterData[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingProgress[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [translationSummaries, setTranslationSummaries] = useState<MangaTranslationSummary[]>([]);
  const [dubList, setDubList] = useState<MyDubListItem[]>([]);
  const [dubStatusFilter, setDubStatusFilter] = useState<'all' | 'watching' | 'completed' | 'plan_to_watch'>('all');
  const [dubLangFilter, setDubLangFilter] = useState<string>('all');
  const [expandedDubSourcesId, setExpandedDubSourcesId] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState<{ readableSize: string; chaptersCount: number; totalSizeBytes?: number }>({
    readableSize: '0 MB',
    chaptersCount: 0,
    totalSizeBytes: 0,
  });
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [filterQuery, setFilterQuery] = useState('');
  const [favFilterType, setFavFilterType] = useState<'all' | 'anime' | 'manga'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [backupStatusMessage, setBackupStatusMessage] = useState<string | null>(null);

  const { user, profileReady, signInWithGoogle } = useFirebase();
  const [verifyingDubs, setVerifyingDubs] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chapters, history, favs, stats, translations, dubs] = await Promise.all([
        getAllOfflineChapters(),
        getAllReadingProgress(),
        getAllFavorites(),
        getStorageStats(),
        getAllMangaTranslationSummaries(),
        getMyDubList(),
      ]);

      setOfflineChapters(chapters);
      setReadingHistory(history);
      setFavorites(favs);
      setStorageStats(stats);
      setTranslationSummaries(translations);
      setDubList(dubs);
    } catch (err) {
      console.error('Failed to load library data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mangaTranslationQueue.subscribe(() => {
      getAllMangaTranslationSummaries().then(setTranslationSummaries).catch(() => {});
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user && profileReady) {
      syncMyDubListWithFirestore()
        .then((merged) => setDubList(merged))
        .catch((err) => console.warn('Cloud Dub List sync notice:', err));
    }
  }, [user, profileReady]);

  const handleVerifyAllDubList = async () => {
    setVerifyingDubs(true);
    try {
      const updatedList: MyDubListItem[] = [];
      for (const item of dubList) {
        const probeAnime: AnimeItem = {
          id: Number(item.animeId) || 1,
          malId: item.malId || (Number(item.animeId) || undefined),
          anilistId: item.anilistId,
          title: item.title,
          englishTitle: item.englishTitle,
          coverImage: item.coverImage,
          genres: item.genres || [],
          episodes: item.totalEpisodes,
          format: 'TV',
          status: 'Finished',
          synopsis: '',
          sourceApi: 'jikan',
        };
        const availability = getAnimeAudioAvailability(probeAnime);
        const verifiedLangs = availability.tracks
          .filter((t) => t.verificationStatus === 'Verified')
          .map((t) => t.language);
        const verifiedPlats = Array.from(
          new Set(
            availability.platforms
              .filter((p) => p.availabilityStatus === 'Available')
              .map((p) => p.platform)
          )
        ).slice(0, 10);

        const refreshed: MyDubListItem = {
          ...item,
          dubLanguages: verifiedLangs.length > 0 ? verifiedLangs : item.dubLanguages,
          verifiedPlatforms: verifiedPlats.length > 0 ? verifiedPlats : item.verifiedPlatforms,
          totalEpisodes: availability.totalEpisodes || item.totalEpisodes,
          primaryWatchUrl: buildVerifiedPlatformUrl(
            verifiedPlats[0] || item.verifiedPlatforms[0] || 'Crunchyroll',
            item.title,
            probeAnime
          ),
          updatedAt: Date.now(),
        };
        await saveToMyDubList(refreshed);
        updatedList.push(refreshed);
      }
      setDubList(updatedList);
      setBackupStatusMessage(`Verified dub languages & official platforms across ${updatedList.length} My Dub List entries.`);
      setTimeout(() => setBackupStatusMessage(null), 4000);
    } finally {
      setVerifyingDubs(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteOfflineChapter(chapterId);
    setConfirmDeleteId(null);
    await loadData();
  };

  const handleClearAllDownloads = async () => {
    await clearAllOfflineChapters();
    setConfirmClearAll(false);
    await loadData();
  };

  const handleDeleteHistoryItem = async (mangaId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteReadingProgress(mangaId);
    await loadData();
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportLibraryBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aniread-library-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatusMessage('Backup downloaded successfully!');
      setTimeout(() => setBackupStatusMessage(null), 3500);
    } catch (err) {
      console.error('Export failed:', err);
      setBackupStatusMessage('Export failed. Please try again.');
      setTimeout(() => setBackupStatusMessage(null), 3500);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const result = await importLibraryBackup(text);
        setBackupStatusMessage(`Imported ${result.historyCount} history items & ${result.favoritesCount} favorites!`);
        await loadData();
        setTimeout(() => setBackupStatusMessage(null), 4000);
      } catch (err) {
        console.error('Import failed:', err);
        setBackupStatusMessage('Failed to import backup: invalid file format.');
        setTimeout(() => setBackupStatusMessage(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResumeTranslation = async (item: MangaTranslationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    await mangaTranslationQueue.startTranslation({
      mangaId: item.mangaId,
      chapterNumber: item.chapterNumber,
      mangaTitle: item.mangaTitle,
      mangaCoverImage: item.mangaCoverImage,
      pageUrls: item.pageUrls,
      targetLanguage: item.targetLanguage,
      startFromPage: item.lastTranslatedPage || 1,
    });
  };

  const handleReadTranslatedManga = (item: MangaTranslationSummary, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onReadMangaChapter) {
      onReadMangaChapter(item.mangaId, item.chapterNumber, item.mangaTitle, item.mangaCoverImage, 1);
    } else {
      onOpenManga(item.mangaId);
    }
  };

  const handleRemoveDubItem = async (animeId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeFromMyDubList(animeId);
    setDubList((prev) => prev.filter((d) => String(d.animeId) !== String(animeId)));
  };

  const handleUpdateDubProgress = async (item: MyDubListItem, epDelta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newEp = Math.max(0, Math.min(item.totalEpisodes || 999, item.episodesWatched + epDelta));
    const newStatus: MyDubListItem['status'] =
      newEp >= (item.totalEpisodes || 999) && (item.totalEpisodes || 0) > 0
        ? 'completed'
        : newEp > 0
        ? 'watching'
        : item.status;
    await updateDubListProgress(item.animeId, newEp, newStatus);
    setDubList((prev) =>
      prev.map((d) => (String(d.animeId) === String(item.animeId) ? { ...d, episodesWatched: newEp, status: newStatus } : d))
    );
  };

  const handleUpdateDubStatus = async (item: MyDubListItem, newStatus: MyDubListItem['status'], e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    await updateDubListProgress(item.animeId, item.episodesWatched, newStatus);
    setDubList((prev) =>
      prev.map((d) => (String(d.animeId) === String(item.animeId) ? { ...d, status: newStatus } : d))
    );
  };

  // Filtered lists
  const filteredDownloads = offlineChapters.filter((ch) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      ch.mangaTitle.toLowerCase().includes(q) ||
      (ch.title && ch.title.toLowerCase().includes(q)) ||
      String(ch.chapterNumber).includes(q)
    );
  });

  const filteredHistory = readingHistory.filter((item) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return item.mangaTitle.toLowerCase().includes(q) || String(item.lastChapterNumber).includes(q);
  });

  const filteredFavorites = favorites.filter((fav) => {
    if (favFilterType !== 'all' && fav.type !== favFilterType) return false;
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return fav.title.toLowerCase().includes(q);
  });

  const filteredTranslations = translationSummaries.filter((item) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      item.mangaTitle.toLowerCase().includes(q) ||
      String(item.chapterNumber).includes(q) ||
      item.targetLanguage.toLowerCase().includes(q)
    );
  });

  const filteredDubList = dubList.filter((item) => {
    if (dubStatusFilter !== 'all' && item.status !== dubStatusFilter) return false;
    if (dubLangFilter !== 'all' && !item.dubLanguages.some((l) => l.toLowerCase().includes(dubLangFilter.toLowerCase()))) return false;
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.dubLanguages.some((l) => l.toLowerCase().includes(q));
  });

  // Calculate stats
  const totalPagesRead = readingHistory.reduce((sum, h) => sum + (h.lastPage || 0), 0);
  const estimatedReadingHours = (totalPagesRead * 0.8 / 60).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8 animate-fadeIn">
      {/* 1. PREMIUM AMOLED HERO BANNER & STATS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1629] via-[#090e1d] to-[#060913] border border-indigo-500/20 shadow-2xl shadow-indigo-950/40 p-5 sm:p-7">
        {/* Ambient neon backdrop glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Premium Offline Vault</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold">
                <WifiOff className="w-3 h-3" /> Zero Internet Needed
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{getUIText('myLibrary', currentLang)}</span>
              <span className="text-base sm:text-xl font-normal text-slate-400">&amp; Offline Storage</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Your personal library hub for offline manga chapters, continuous reading progress bookmarks, and data sync. All cached locally on your device via secure IndexedDB.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Downloaded</span>
                <Download className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">{offlineChapters.length}</span>
                <span className="text-[11px] text-slate-400 block">chapters</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Storage</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">{storageStats.readableSize}</span>
                <span className="text-[11px] text-emerald-400 font-semibold block">IndexedDB Cache</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Favorites</span>
                <Bookmark className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">{favorites.length}</span>
                <span className="text-[11px] text-slate-400 block">titles saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Row: Export / Import / Clear */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Backup (.json)</span>
            </button>

            <label className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Restore Backup</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>

            {offlineChapters.length > 0 && (
              <button
                onClick={() => setConfirmClearAll(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/50 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Downloads</span>
              </button>
            )}
          </div>

          {backupStatusMessage && (
            <span className="px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-medium text-xs flex items-center gap-1 animate-fadeIn">
              <Check className="w-3.5 h-3.5" /> {backupStatusMessage}
            </span>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Clearing Downloads */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Clear All Offline Chapters?</h3>
              <p className="text-xs text-slate-400">
                This will delete all {offlineChapters.length} downloaded chapters from local storage. You will need to re-download them to read offline.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmClearAll(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllDownloads}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEARCH & NAVIGATION TABS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          {/* Glassmorphic Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('downloads')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'downloads'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Offline Downloads ({offlineChapters.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Reading History ({readingHistory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Favorites ({favorites.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('translations')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'translations'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Manga Translations ({translationSummaries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('dublist')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'dublist'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/25 border border-amber-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Volume2 className="w-4 h-4 text-amber-300" />
              <span>My Dub List ({dubList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Storage</span>
            </button>
          </div>

          {/* Search in library */}
          {activeTab !== 'stats' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter saved titles..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. TAB CONTENT */}

        {/* TAB 1: OFFLINE DOWNLOADS VAULT */}
        {activeTab === 'downloads' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-indigo-200 flex items-start justify-between gap-3 shadow-inner">
              <div className="flex items-start gap-3">
                <WifiOff className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-sm">Offline Chapter Vault Active</p>
                  <p className="text-slate-300 mt-0.5">
                    All downloaded chapters are preserved in high-res inside your browser IndexedDB storage. You can read them completely offline in Airplane Mode, during flights, or with no internet connectivity.
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 font-mono text-[11px] font-semibold">
                {storageStats.readableSize} Saved
              </span>
            </div>

            {loading ? (
              <AnimeLoadingState
                message="Loading..."
                subMessage="Accessing offline encrypted manga vault..."
                size="lg"
              />
            ) : filteredDownloads.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mx-auto">
                  <Download className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-white">
                    {filterQuery ? 'No matching downloaded chapters' : getUIText('noDownloads', currentLang)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {filterQuery
                      ? 'Try adjusting your search filter keywords.'
                      : 'Explore any manga in the Manga Reader section and click the download button on any chapter to save it for high-speed offline reading.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDownloads.map((ch) => {
                  const mb = ((ch.sizeBytes || 0) / (1024 * 1024)).toFixed(1);
                  const dateStr = new Date(ch.downloadedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const isConfirming = confirmDeleteId === ch.id;

                  return (
                    <div
                      key={ch.id}
                      onClick={() =>
                        onReadOfflineChapter({
                          id: ch.id,
                          mangaId: ch.mangaId,
                          mangaTitle: ch.mangaTitle,
                          chapterNumber: ch.chapterNumber,
                          title: ch.title,
                          language: 'en',
                          pageCount: ch.pageCount,
                          pages: ch.pages,
                        })
                      }
                      className="group relative p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/95 to-[#0b1120]/95 hover:from-[#131d36] hover:to-[#0f172a] border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-indigo-950/30 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header bar: Chapter number & Delete button */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 font-mono text-xs font-bold text-indigo-300">
                            Chapter {ch.chapterNumber}
                          </span>

                          {isConfirming ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleDeleteChapter(ch.id, e)}
                                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(ch.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                              title="Delete from offline storage"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Title & info */}
                        <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                          {ch.mangaTitle}
                        </h3>
                        {ch.title && (
                          <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">{ch.title}</p>
                        )}
                      </div>

                      {/* Bottom action footer */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-300 font-semibold">{ch.pageCount} Pages</span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono">{mb} MB</span>
                        </div>

                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Read Offline</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: READING HISTORY & PROGRESS */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No reading history yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Start reading any manga in the reader. Your current page, chapter progress, and last read dates will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHistory.map((item) => {
                  const percent = item.totalPages ? Math.round((item.lastPage / item.totalPages) * 100) : 0;
                  const dateStr = item.updatedAt
                    ? new Date(item.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <div
                      key={item.mangaId}
                      onClick={() => {
                        if (onContinueReading) onContinueReading(item);
                        else onOpenManga(item.mangaId);
                      }}
                      className="group relative p-3.5 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#0a101d] border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-indigo-950/20 flex gap-3.5"
                    >
                      <div className="w-16 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 shadow-md relative">
                        <img
                          src={item.coverImage}
                          alt={item.mangaTitle}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono font-bold text-indigo-300">
                          {percent}%
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                              {item.mangaTitle}
                            </h3>
                            <button
                              onClick={(e) => handleDeleteHistoryItem(item.mangaId, e)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Remove from history"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                            Chapter {item.lastChapterNumber}
                          </p>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                              <span>Page {item.lastPage} of {item.totalPages}</span>
                              <span className="text-[10px] text-slate-500">{dateStr}</span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-indigo-400 font-bold pt-2">
                          <span>Resume Reading</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED FAVORITES */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setFavFilterType('all')}
                className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors ${
                  favFilterType === 'all'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All ({favorites.length})
              </button>
              <button
                onClick={() => setFavFilterType('anime')}
                className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors ${
                  favFilterType === 'anime'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Anime Only ({favorites.filter((f) => f.type === 'anime').length})
              </button>
              <button
                onClick={() => setFavFilterType('manga')}
                className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors ${
                  favFilterType === 'manga'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Manga Only ({favorites.filter((f) => f.type === 'manga').length})
              </button>
            </div>

            {filteredFavorites.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <Bookmark className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No saved favorites yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click the bookmark icon on any anime or manga details modal to save them here for quick access.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {filteredFavorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => {
                      if (fav.type === 'anime') {
                        const cleanId = String(fav.id).replace('anime_', '');
                        onOpenAnime(Number(cleanId));
                      } else {
                        const cleanId = String(fav.id).replace('manga_', '');
                        onOpenManga(cleanId);
                      }
                    }}
                    className="p-2.5 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#090e1a] border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all duration-300 group flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-950/20"
                  >
                    <div>
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-950 mb-2 relative shadow-md">
                        <img
                          src={fav.coverImage}
                          alt={fav.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                          {fav.type}
                        </span>
                        {fav.score && (
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-mono text-amber-300 font-bold">
                            ★ {fav.score.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-indigo-400 transition-colors">
                        {fav.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                      <span className="text-indigo-400 font-medium">Open {fav.type === 'anime' ? 'Anime' : 'Manga'}</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: MANGA TRANSLATION VAULT & PROGRESS */}
        {activeTab === 'translations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Permanent Manga Translation History</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every translated page is automatically stored in permanent local IndexedDB storage. Pick up right where you left off or read cached translations with zero internet.
                </p>
              </div>

              <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-lg shrink-0">
                {filteredTranslations.length} Chapters Translated
              </span>
            </div>

            {filteredTranslations.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-slate-900/30 border border-slate-800/60 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-300">No Translated Manga Yet</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Open any manga in Manga Reader and tap "Translate All" or translate any page. Translated pages and progress will be saved here automatically!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTranslations.map((item) => {
                  const percent = item.progressPercent;
                  const isFullyCompleted = item.completedPages >= item.totalPages && item.totalPages > 0;
                  const lastUpdatedStr = item.lastUpdated
                    ? new Date(item.lastUpdated).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  return (
                    <div
                      key={`${item.mangaId}_ch${item.chapterNumber}_${item.targetLanguage}`}
                      className="group relative p-4 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#0a101d] border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 shadow-xl hover:shadow-indigo-950/20 flex flex-col justify-between space-y-4"
                    >
                      {/* Top Info */}
                      <div className="flex gap-3.5">
                        <div className="w-16 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 shadow-md relative">
                          {item.mangaCoverImage ? (
                            <img
                              src={item.mangaCoverImage}
                              alt={item.mangaTitle}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-950/50 text-indigo-400">
                              <BookOpen className="w-6 h-6" />
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono font-bold text-indigo-300">
                            {percent}%
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Ch. {item.chapterNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Lang: {item.targetLanguage.toUpperCase()}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors mt-1.5">
                            {item.mangaTitle}
                          </h3>

                          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                            <span>Saved: {lastUpdatedStr}</span>
                          </p>

                          {isFullyCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-1">
                              <Check className="w-3.5 h-3.5" /> Fully Translated ({item.completedPages}/{item.totalPages}p)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-300 mt-1">
                              <Clock className="w-3 h-3 text-indigo-400" /> Last page: P.{item.lastTranslatedPage}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar & Counter */}
                      <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-300 font-semibold">
                            {item.completedPages} / {item.totalPages} Pages Completed
                          </span>
                          <span className="text-indigo-400 font-bold">{percent}%</span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                          <span>Remaining: {Math.max(0, item.totalPages - item.completedPages)} pages</span>
                          <span>IndexedDB Cached</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {!isFullyCompleted && (
                          <button
                            onClick={(e) => handleResumeTranslation(item, e)}
                            className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            title="Continue background translation from the first untranslated page"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Resume</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleReadTranslatedManga(item)}
                          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          title="Open Manga Reader with saved translations"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Read Translated</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: MY DUB LIST (Personal Dub Tracker & 24 Web Verification) */}
        {activeTab === 'dublist' && (
          <div className="space-y-5">
            {/* Header & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>My Dub List & Audio Tracker</span>
                  {user && profileReady ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[10px] font-mono">
                      <Cloud className="w-3 h-3" />
                      Firebase Synced
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 text-indigo-300 text-[10px] font-mono cursor-pointer transition-colors"
                    >
                      <Cloud className="w-3 h-3" />
                      Sign in with Google to Cloud Sync
                    </button>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track dubbed episodes & verify availability across Crunchyroll, Netflix, Amazon Prime Video, Anime Times & Muse India.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={handleVerifyAllDubList}
                  disabled={verifyingDubs || dubList.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingDubs ? 'animate-spin' : ''}`} />
                  <span>{verifyingDubs ? 'Verifying...' : 'Verify All Dub Platforms'}</span>
                </button>
                <span className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-800/50 px-3 py-1.5 rounded-xl font-bold">
                  {filteredDubList.length} Tracked
                </span>
              </div>
            </div>

            {/* Quick Filters Bar: Status & Languages */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              {/* Status Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {(['all', 'watching', 'plan_to_watch', 'completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setDubStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all cursor-pointer ${
                      dubStatusFilter === st
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st === 'all' ? 'All Status' : st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              {/* Language Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {['all', 'Hindi', 'English', 'Tamil', 'Telugu', 'Bengali'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setDubLangFilter(lang)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                      dubLangFilter === lang
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {lang === 'all' ? 'All Dubs' : `${lang} Dub`}
                  </button>
                ))}
              </div>
            </div>

            {filteredDubList.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-slate-900/30 border border-slate-800/60 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                  <Volume2 className="w-6 h-6 text-amber-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-300">No Anime in My Dub List</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Click "Add to Dub List" on any anime card or dub badge to track episodes and verified streaming sources here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDubList.map((item) => {
                  const percent = item.totalEpisodes
                    ? Math.round((item.episodesWatched / item.totalEpisodes) * 100)
                    : 0;
                  const isExpandedSources = expandedDubSourcesId === String(item.animeId);

                  return (
                    <div
                      key={item.id}
                      className="group relative p-4 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#0a101d] border border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-xl hover:shadow-amber-950/20 flex flex-col justify-between space-y-4"
                    >
                      {/* Top: Cover, Title & Dub badges */}
                      <div className="flex gap-3.5">
                        <div className="w-20 h-28 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 shadow-md relative">
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {item.score && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-mono font-bold text-amber-300">
                              ★ {item.score}
                            </span>
                          )}
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/85 text-[9px] font-mono font-bold text-amber-400">
                            {percent}%
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h3
                                onClick={() => onOpenAnime(Number(item.animeId))}
                                className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors cursor-pointer"
                              >
                                {item.title}
                              </h3>
                              <button
                                onClick={(e) => handleRemoveDubItem(item.animeId, e)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Remove from My Dub List"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Dub Language Badges */}
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              {item.dubLanguages.map((lang) => (
                                <span
                                  key={lang}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300"
                                >
                                  {lang.toUpperCase()}
                                </span>
                              ))}
                            </div>

                            {/* Verified Official Platform Badges */}
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              {(item.verifiedPlatforms && item.verifiedPlatforms.length > 0
                                ? item.verifiedPlatforms
                                : ['Crunchyroll India']
                              ).slice(0, 4).map((platName) => (
                                <a
                                  key={platName}
                                  href={buildVerifiedPlatformUrl(platName, item.title, {
                                    id: Number(item.animeId) || 1,
                                    malId: item.malId,
                                    anilistId: item.anilistId,
                                    title: item.title,
                                    coverImage: item.coverImage,
                                    genres: item.genres || [],
                                    format: 'TV',
                                    status: 'Finished',
                                    synopsis: '',
                                    sourceApi: 'jikan',
                                  })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 transition-colors"
                                  title={`Open ${item.title} on ${platName}`}
                                >
                                  <span>{platName}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ))}
                            </div>

                            {/* Status Selector Dropdown */}
                            <div className="mt-2 flex items-center gap-1.5 text-xs">
                              <span className="text-[10px] font-mono text-slate-400 uppercase">Status:</span>
                              <select
                                value={item.status}
                                onChange={(e) => handleUpdateDubStatus(item, e.target.value as any, e)}
                                className="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer capitalize"
                              >
                                <option value="watching">Watching Dub</option>
                                <option value="plan_to_watch">Plan to Watch</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Episode Progress Stepper & Slider */}
                      <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-300 font-semibold">Dubbed Progress</span>
                          <span className="text-amber-300 font-bold">
                            Episode {item.episodesWatched} of {item.totalEpisodes || '?'}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(3, percent))}%` }}
                          />
                        </div>

                        {/* Quick Stepper Buttons */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleUpdateDubProgress(item, -1, e)}
                              disabled={item.episodesWatched <= 0}
                              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Previous episode"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-bold text-white px-2">
                              Ep. {item.episodesWatched}
                            </span>
                            <button
                              onClick={(e) => handleUpdateDubProgress(item, +1, e)}
                              disabled={Boolean(item.totalEpisodes && item.episodesWatched >= item.totalEpisodes)}
                              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Next episode"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {item.primaryWatchUrl && (
                            <a
                              href={item.primaryWatchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                              title="Stream on verified platform"
                            >
                              <Tv className="w-3 h-3" />
                              <span>Stream</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* 24 Web Sources Inline Dropdown Trigger */}
                      <div className="space-y-2 pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() =>
                            setExpandedDubSourcesId(isExpandedSources ? null : String(item.animeId))
                          }
                          className="w-full py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-amber-300 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-amber-400" />
                            <span>Check 24 Web Sources & Links</span>
                          </span>
                          {isExpandedSources ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {/* Expanded 24 Websites for this specific anime */}
                        {isExpandedSources && (
                          <div className="p-3 rounded-xl bg-slate-950 border border-amber-900/40 space-y-2 animate-in fade-in duration-200">
                            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                              24 Authoritative Anime & Dub Sites
                            </span>
                            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                              {VERIFIED_24_ANIME_WEBSITES.map((site) => {
                                const dummyAnime: any = {
                                  id: item.animeId,
                                  malId: item.malId,
                                  anilistId: item.anilistId,
                                  title: item.title,
                                };
                                const targetUrl = site.getSearchUrl(item.title, dummyAnime);
                                return (
                                  <a
                                    key={site.id}
                                    href={targetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 group text-[11px] truncate"
                                  >
                                    <img
                                      src={site.logoUrl}
                                      alt=""
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                      }}
                                      className="w-3.5 h-3.5 rounded-xs shrink-0 object-contain"
                                    />
                                    <span className="truncate group-hover:text-amber-300 font-medium">
                                      {site.name}
                                    </span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-500 ml-auto shrink-0" />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: READING ANALYTICS & STORAGE INSIGHTS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Estimated Reading Time</span>
                <p className="text-2xl font-black text-white font-mono">{estimatedReadingHours} Hours</p>
                <span className="text-[11px] text-indigo-400">Calculated from pages read</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Total Pages Read</span>
                <p className="text-2xl font-black text-white font-mono">{totalPagesRead.toLocaleString()}</p>
                <span className="text-[11px] text-emerald-400">Across {readingHistory.length} manga titles</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Offline Storage Allocated</span>
                <p className="text-2xl font-black text-white font-mono">{storageStats.readableSize}</p>
                <span className="text-[11px] text-purple-400">{offlineChapters.length} chapters cached</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Reading Streak</span>
                <p className="text-2xl font-black text-white font-mono flex items-center gap-1.5">
                  <Flame className="w-6 h-6 text-rose-500 fill-rose-500" />
                  <span>Active</span>
                </p>
                <span className="text-[11px] text-slate-400">Continuously updated</span>
              </div>
            </div>

            {/* Storage Quota Progress Card */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span>IndexedDB Quota & Cache Utilization</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Storage space used on your local machine for high-resolution manga scans and chapters.
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-white">{storageStats.readableSize}</span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(8, (storageStats.chaptersCount * 3)))}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span>Offline Chapters: {storageStats.readableSize}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  <span>Reading Progress: {readingHistory.length} records</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>Saved Bookmarks: {favorites.length} entries</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
