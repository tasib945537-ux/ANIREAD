import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Download,
  Check,
  Star,
  Bookmark,
  BookmarkCheck,
  Globe,
  Sparkles,
  ArrowRight,
  Tv,
  Users,
  ExternalLink,
  Layers,
  Info,
} from 'lucide-react';
import { MangaItem, MangaChapter } from '../types/anime';
import {
  getMangaDetails,
  getMangaChaptersWithInfo,
  getChapterPages,
  LANGUAGE_NAMES,
} from '../services/api';
import { translateText, SUPPORTED_LANGUAGES, getUIText } from '../services/translator';
import {
  downloadChapterForOffline,
  getOfflineChapter,
  toggleFavorite,
  isFavorite,
  getReadingProgress,
} from '../services/offlineStorage';
import { GoogleAITranslator } from './GoogleAITranslator';
import { AnimeLoadingState } from './AnimeLoadingState';

interface Props {
  manga: MangaItem;
  currentLang: string;
  onClose: () => void;
  onReadChapter: (chapter: MangaChapter, allChapters: MangaChapter[], initialPage?: number) => void;
  onSelectAnime?: (animeId: number) => void;
  onSelectCharacter?: (charId: number, name: string, image: string) => void;
}

export const MangaDetailModal: React.FC<Props> = ({
  manga: initialManga,
  currentLang,
  onClose,
  onReadChapter,
  onSelectAnime,
  onSelectCharacter,
}) => {
  const [manga, setManga] = useState<MangaItem>(initialManga);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<{ code: string; name: string; count: number }[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [chapterLanguage, setChapterLanguage] = useState('en');
  const [chapterNotice, setChapterNotice] = useState<string | null>(null);
  const [chapterSearch, setChapterSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [downloadedSet, setDownloadedSet] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState(false);
  const [translatedSynopsis, setTranslatedSynopsis] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showGoogleTranslator, setShowGoogleTranslator] = useState(false);
  const [lastReadInfo, setLastReadInfo] = useState<{ chapterId: string; chapterNum: string; page: number } | null>(null);

  // 1. Fetch comprehensive manga details from AniList + Jikan + MangaDex
  useEffect(() => {
    let isMounted = true;
    setManga(initialManga);
    setChapterLanguage('en');
    setChapters([]);
    setAvailableLanguages([]);
    setChapterNotice(null);
    setLoadingDetails(true);
    setTranslatedSynopsis(null);
    setShowGoogleTranslator(false);

    getMangaDetails(initialManga.id, initialManga.title, initialManga.malId)
      .then((detailed) => {
        if (isMounted) {
          setManga(detailed);
          if (detailed.availableLanguages && detailed.availableLanguages.length > 0) {
            setAvailableLanguages(detailed.availableLanguages);
          }
          setLoadingDetails(false);
        }
      })
      .catch((err) => {
        console.warn('Manga detailed enrichment failed:', err);
        if (isMounted) setLoadingDetails(false);
      });

    // Check favorite status
    isFavorite(initialManga.id, 'manga').then((res) => {
      if (isMounted) setBookmarked(res);
    });

    // Check reading progress
    getReadingProgress(initialManga.id).then((prog) => {
      if (isMounted && prog) {
        setLastReadInfo({
          chapterId: prog.lastChapterId,
          chapterNum: prog.lastChapterNumber,
          page: prog.lastPage,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [initialManga.id, initialManga.title]);

  // 2. Load chapters strictly in the selected language
  useEffect(() => {
    let isMounted = true;
    setLoadingChapters(true);
    const mangaDexId = manga.mangadexId || String(manga.id);

    getMangaChaptersWithInfo(mangaDexId, chapterLanguage, manga.title)
      .then(async (result) => {
        if (!isMounted) return;

        // Check which chapters are saved offline
        const downloaded = new Set<string>();
        for (const ch of result.chapters) {
          const offlineData = await getOfflineChapter(ch.id);
          if (offlineData) downloaded.add(ch.id);
        }

        setChapters(result.chapters);
        if (result.availableLanguages && result.availableLanguages.length > 0) {
          setAvailableLanguages(result.availableLanguages);
        }
        setChapterNotice(result.notice || null);
        setDownloadedSet(downloaded);
        setLoadingChapters(false);
      })
      .catch((err) => {
        console.warn('Failed to load manga chapters:', err);
        if (isMounted) {
          setChapters([]);
          setLoadingChapters(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [manga.id, manga.title, chapterLanguage]);

  const handleToggleFavorite = async () => {
    const newState = await toggleFavorite(manga, 'manga');
    setBookmarked(newState);
  };

  const handleTranslate = async () => {
    if (!manga.synopsis || isTranslating) return;
    setIsTranslating(true);
    try {
      const translated = await translateText(manga.synopsis, currentLang, 'English');
      setTranslatedSynopsis(translated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = async (chapter: MangaChapter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingId) return;

    setDownloadingId(chapter.id);
    setDownloadProgress({ current: 0, total: 1 });

    try {
      const pageUrls = await getChapterPages(chapter.id);
      setDownloadProgress({ current: 0, total: pageUrls.length });

      await downloadChapterForOffline(
        chapter.id,
        manga.id,
        manga.title,
        chapter.chapterNumber,
        chapter.title,
        pageUrls,
        (current, total) => {
          setDownloadProgress({ current, total });
        }
      );

      setDownloadedSet((prev) => new Set(prev).add(chapter.id));
    } catch (err) {
      console.error('Failed to download chapter:', err);
    } finally {
      setDownloadingId(null);
      setDownloadProgress(null);
    }
  };

  const activeLangName = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.nativeName || currentLang;

  // Format badge display
  const originCode = manga.countryOfOrigin || (manga.format === 'MANHWA' ? 'KR' : manga.format === 'MANHUA' ? 'CN' : 'JP');
  const formatLabel = manga.format || (manga.countryOfOrigin === 'KR' ? 'Manhwa' : 'Manga');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header Bar with Close */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-md">
              {manga.title}
            </h2>
            <span className="px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-700/50 text-[10px] font-mono text-indigo-300 shrink-0">
              {formatLabel} · {originCode}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Cinematic Backdrop Banner */}
          <div className="relative h-44 sm:h-56 w-full bg-slate-950 overflow-hidden shrink-0">
            {manga.bannerImage || manga.coverImage ? (
              <img
                src={manga.bannerImage || manga.coverImage}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-50 blur-xs scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-slate-950 via-indigo-950/50 to-slate-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
          </div>

          {/* Manga Hero Showcase Floating over Banner */}
          <div className="px-6 -mt-24 sm:-mt-28 relative z-10 flex flex-col sm:flex-row gap-6">
            <div className="w-36 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800/90 bg-slate-950 shrink-0 mx-auto sm:mx-0 relative group flex items-center justify-center">
              {manga.coverImage && manga.coverImage.trim() !== '' ? (
                <img
                  src={manga.coverImage}
                  alt={manga.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="w-10 h-10 text-slate-600" />
              )}
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-mono text-indigo-300">
                HD Quality
              </div>
            </div>

            <div className="flex-1 space-y-3 text-left sm:pt-14">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm">
                  {manga.title}
                </h3>
                {manga.nativeTitle && (
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">{manga.nativeTitle}</p>
                )}
                {manga.englishTitle && manga.englishTitle !== manga.title && (
                  <p className="text-xs text-slate-500 font-mono">{manga.englishTitle}</p>
                )}
              </div>

              {/* Clean metadata line */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="font-semibold text-white">{formatLabel} · {originCode}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-medium">{manga.status}</span>
                {manga.releaseYear && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{manga.releaseYear}</span>
                  </>
                )}
                {manga.score && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-mono text-amber-300 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      {manga.score.toFixed(2)}
                    </span>
                  </>
                )}
                {manga.chapterCount && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{manga.chapterCount} Chapters</span>
                  </>
                )}
                {manga.serializations && manga.serializations.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-300">{manga.serializations.join(', ')}</span>
                  </>
                )}
              </div>

              {/* Authors & Creators */}
              {manga.authors && manga.authors.length > 0 && (
                <div className="text-xs text-slate-400 flex flex-wrap gap-1">
                  <span className="text-slate-500 font-medium">Creators:</span>
                  <span>{manga.authors.slice(0, 3).join(' · ')}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {chapters.length > 0 && (
                  <button
                    onClick={() => {
                      const firstChapter = lastReadInfo
                        ? chapters.find(
                            (c) =>
                              c.id === lastReadInfo.chapterId ||
                              c.chapterNumber === lastReadInfo.chapterNum ||
                              parseFloat(c.chapterNumber) === parseFloat(lastReadInfo.chapterNum)
                          ) || chapters[0]
                        : chapters.find((c) => parseFloat(c.chapterNumber) === 1) || chapters[0];
                      const resumePage =
                        lastReadInfo &&
                        (firstChapter.id === lastReadInfo.chapterId ||
                          firstChapter.chapterNumber === lastReadInfo.chapterNum ||
                          parseFloat(firstChapter.chapterNumber) === parseFloat(lastReadInfo.chapterNum))
                          ? lastReadInfo.page
                          : 1;
                      onReadChapter(firstChapter, chapters, resumePage);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-xl transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>
                      {lastReadInfo
                        ? `Continue Ch. ${lastReadInfo.chapterNum} (P. ${lastReadInfo.page})`
                        : 'Start Reading Chapter 1'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => setShowGoogleTranslator(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  title="Open Google AI Translator for Manga"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Google AI Translator</span>
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    bookmarked
                      ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                >
                  {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  <span>{bookmarked ? 'Saved in Library' : 'Save to Library'}</span>
                </button>
              </div>

              {/* Genres Chips */}
              {manga.genres && manga.genres.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1.5 text-xs text-slate-300">
                  {manga.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded-md bg-slate-800/70 border border-slate-700/60 text-[11px] text-slate-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Synopsis with AI Localization */}
          <div className="px-6 space-y-3 pt-4 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>
                  {translatedSynopsis ? (
                    <>
                      {getUIText('translatedInto', currentLang)} <strong className="text-white">{activeLangName}</strong>
                    </>
                  ) : (
                    'Read synopsis in multiple languages (Gemini 3.8 Flash)'
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {translatedSynopsis && (
                  <button
                    onClick={() => setTranslatedSynopsis(null)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {getUIText('original', currentLang)}
                  </button>
                )}
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isTranslating ? 'Translating...' : `Translate to ${activeLangName}`}</span>
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {translatedSynopsis || manga.synopsis || 'No synopsis recorded.'}
            </p>
          </div>

          {/* Chapters Directory */}
          <div className="px-6 pb-6 space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>MangaDex Chapters ({chapters.length})</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                    Online & Offline Reader
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Read high-resolution scanned chapters or download for offline reading.
                </p>
              </div>

              {/* Controls: Search & Order */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="Filter chapters..."
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs w-28 sm:w-36 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  title="Toggle chapter order"
                >
                  {sortAsc ? 'Asc (1→N)' : 'Desc (N→1)'}
                </button>
              </div>
            </div>

            {/* Translation Languages Selection Bar */}
            {availableLanguages.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Available Translations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setChapterLanguage(lang.code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        chapterLanguage === lang.code
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      <span>{lang.name}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                        {lang.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter language note (including chapters with source-language fallback) */}
            {chapterNotice && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-700/50 flex items-center gap-2 text-xs text-indigo-300">
                <Info className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>{chapterNotice}</span>
              </div>
            )}

            {loadingChapters ? (
              <div className="py-4">
                <AnimeLoadingState
                  message="Loading..."
                  subMessage="Summoning chapters from global manga archives..."
                  size="sm"
                  characterTheme="chibi"
                />
              </div>
            ) : chapters.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <p>No chapters available for the selected language filter.</p>
                <button
                  onClick={() => setChapterLanguage('all')}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow-sm"
                >
                  Show All Available Translations
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950/40 border border-slate-800/80 max-h-80 overflow-y-auto">
                {chapters
                  .filter((ch) => {
                    if (!chapterSearch) return true;
                    return (
                      ch.chapterNumber.includes(chapterSearch) ||
                      ch.title.toLowerCase().includes(chapterSearch.toLowerCase())
                    );
                  })
                  .sort((a, b) => {
                    const numA = parseFloat(a.chapterNumber) || 0;
                    const numB = parseFloat(b.chapterNumber) || 0;
                    return sortAsc ? numA - numB : numB - numA;
                  })
                  .map((ch) => {
                    const isDownloaded = downloadedSet.has(ch.id);
                    const isDownloading = downloadingId === ch.id;

                    const isReadingThis =
                      lastReadInfo &&
                      (lastReadInfo.chapterId === ch.id ||
                        lastReadInfo.chapterNum === ch.chapterNumber ||
                        parseFloat(lastReadInfo.chapterNum) === parseFloat(ch.chapterNumber));

                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          const resumePage = isReadingThis && lastReadInfo ? lastReadInfo.page : 1;
                          onReadChapter(ch, chapters, resumePage);
                        }}
                        className={`flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition-colors cursor-pointer group ${
                          isReadingThis ? 'bg-indigo-950/30 border-l-2 border-indigo-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs font-bold text-indigo-400 shrink-0">
                            Ch. {ch.chapterNumber}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                              {ch.title}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span>{ch.language.toUpperCase()} {ch.pageCount ? `· ${ch.pageCount} pages` : ''}</span>
                              {isReadingThis && lastReadInfo && (
                                <span className="text-[10px] text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 px-1.5 py-0.5 rounded font-mono font-medium">
                                  Resume P.{lastReadInfo.page}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Download / Read Action */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isDownloaded ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/60 px-2 py-1 rounded-md">
                              <Check className="w-3 h-3" />
                              <span>Offline</span>
                            </span>
                          ) : isDownloading ? (
                            <span className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded-md">
                              <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              <span>
                                {downloadProgress
                                  ? `${downloadProgress.current}/${downloadProgress.total}`
                                  : 'Saving...'}
                              </span>
                            </span>
                          ) : (
                            <button
                              onClick={(e) => handleDownload(ch, e)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
                              title="Download chapter for offline reading"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Main Characters Showcase */}
          {manga.characters && manga.characters.length > 0 && (
            <div className="px-6 space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Main Characters ({manga.characters.length})</span>
                </h4>
                <span className="text-xs text-slate-400">Click character for full photo profile</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {manga.characters.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => onSelectCharacter?.(char.id, char.name, char.image)}
                    className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-indigo-500/60 hover:bg-slate-800/60 transition-all cursor-pointer flex flex-col items-center text-center group"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-900 border border-slate-800 mb-2 group-hover:scale-105 transition-transform">
                      {char.image ? (
                        <img
                          src={char.image}
                          alt={char.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">?</div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate w-full">
                      {char.name}
                    </p>
                    {char.nativeName && (
                      <p className="text-[10px] text-slate-500 truncate w-full">{char.nativeName}</p>
                    )}
                    <span className="text-[10px] font-mono text-indigo-400 mt-1">{char.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Anime Adaptations & Spin-offs */}
          {manga.relations && manga.relations.length > 0 && (
            <div className="px-6 space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Tv className="w-4 h-4 text-indigo-400" />
                <span>Related Anime Adaptations & Series</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {manga.relations.map((rel, idx) => {
                  const entry = rel.entry[0];
                  if (!entry) return null;
                  const isAnime = entry.type?.toUpperCase() === 'ANIME';

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isAnime && onSelectAnime) {
                          onSelectAnime(entry.id);
                        }
                      }}
                      className={`p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-3 ${
                        isAnime && onSelectAnime ? 'hover:border-indigo-500/60 hover:bg-slate-800/60 cursor-pointer' : ''
                      } transition-colors`}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-semibold uppercase text-indigo-400">
                          {rel.relation.replace(/_/g, ' ')}
                        </span>
                        <h5 className="text-xs font-bold text-white truncate">{entry.name}</h5>
                        <span className="text-[11px] text-slate-400">{entry.type}</span>
                      </div>
                      {isAnime && onSelectAnime && (
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600/80 text-[11px] font-medium text-white shrink-0 flex items-center gap-1">
                          <span>View Anime</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* External Links */}
          {manga.externalLinks && manga.externalLinks.length > 0 && (
            <div className="px-6 pb-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Official Links:</span>
              {manga.externalLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <span>{link.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Google AI Translator Dialog */}
      {showGoogleTranslator && (
        <GoogleAITranslator
          initialText={manga.synopsis || manga.title}
          titleContext={`${manga.title} · Manga Synopsis`}
          defaultTargetLang="bn"
          onClose={() => setShowGoogleTranslator(false)}
        />
      )}
    </div>
  );
};
