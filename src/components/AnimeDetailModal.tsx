import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Star,
  Bookmark,
  BookmarkCheck,
  Heart,
  Globe,
  BookOpen,
  Layers,
  Sparkles,
  Play,
  Tv,
  Volume2,
  Music,
  ExternalLink,
  Download,
  Film,
  Radio,
  Share2,
  GitBranch,
  ArrowRight,
  Copy,
  Check,
  Languages,
  Calendar,
  Clock,
  Building2,
  FileText,
  ShieldAlert,
  Dices,
  Trophy,
  MessageSquare,
  ThumbsUp,
  Flame,
  Info,
  ChevronUp,
  ArrowDown,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';
import { AnimeItem, CharacterPreview, VoiceActor, DubDetail, WatchLink } from '../types/anime';
import { getAnimeDetails } from '../services/api';
import { translateText, SUPPORTED_LANGUAGES, getUIText } from '../services/translator';
import { toggleFavorite, isFavorite, isInMyDubList, saveToMyDubList, removeFromMyDubList, MyDubListItem } from '../services/offlineStorage';
import { getAnimeDubInfo } from '../services/dubCatalog';
import { getAnimeAudioAvailability, buildVerifiedPlatformUrl } from '../services/dubVerificationStorage';
import { recordQuestAction } from '../services/watchlistStorage';
import { GoogleAITranslator } from './GoogleAITranslator';
import { AnimeLoadingState } from './AnimeLoadingState';
import { DubDetailsModal } from './DubDetailsModal';
import { DubReleaseCalendarModal } from './DubReleaseCalendarModal';
import { getCrunchyrollDirectUrl } from '../services/crunchyrollLinks';

// Modular master subcomponents
import { AnimeDubFinder } from './anime-detail/AnimeDubFinder';
import { AnimeEpisodesProgress } from './anime-detail/AnimeEpisodesProgress';
import { AnimeInteractiveZone } from './anime-detail/AnimeInteractiveZone';
import { AnimeCharactersCast } from './anime-detail/AnimeCharactersCast';
import { AnimeFranchiseUniverse } from './anime-detail/AnimeFranchiseUniverse';
import { AnimeSubDetailsSection } from './anime-detail/AnimeSubDetailsSection';
import { AnimeStreamingServices } from './anime-detail/AnimeStreamingServices';
import { AnimeMangaRelated } from './anime-detail/AnimeMangaRelated';
import { AnimeTrailerSection } from './anime-detail/AnimeTrailerSection';
import { AnimeReviewsSection } from './anime-detail/AnimeReviewsSection';
import { AnimeRecommendations } from './anime-detail/AnimeRecommendations';
import { AnimeWebSourceChecker } from './anime-detail/AnimeWebSourceChecker';

interface Props {
  animeId: number;
  initialAnime?: AnimeItem;
  currentLang: string;
  onClose: () => void;
  onSelectCharacter: (charId: number, name: string, image: string, animePics: string[]) => void;
  onReadManga?: (queryTitle: string) => void;
  onSelectAnime?: (animeId: number, seedItem?: AnimeItem) => void;
}

export type TabType =
  | 'overview'
  | 'episodes'
  | 'seasons'
  | 'dubs'
  | 'subs'
  | 'streaming'
  | 'characters'
  | 'manga'
  | 'interactive'
  | 'reviews'
  | 'recommendations'
  | 'trailer'
  | 'translator';

interface AiringCountdownHUDProps {
  anime: AnimeItem;
  hasHindiDub: boolean;
  hasEnglishDub: boolean;
  onOpenCalendar: () => void;
  onOpenDubs: () => void;
}

const AiringCountdownHUD: React.FC<AiringCountdownHUDProps> = React.memo(
  ({ anime, hasHindiDub, hasEnglishDub, onOpenCalendar, onOpenDubs }) => {
    const isAiring =
      (anime.status || '').toLowerCase().includes('airing') ||
      anime.status === 'Releasing' ||
      Boolean(anime.nextAiringEpisode);

    const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

    useEffect(() => {
      if (!isAiring) return;
      const timer = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
      return () => clearInterval(timer);
    }, [isAiring]);

    const jpTargetTimestamp =
      anime.nextAiringEpisode?.airingAt ||
      (isAiring ? nowSec + 3 * 86400 + 14 * 3600 : null);
    const diffSec = jpTargetTimestamp ? Math.max(0, jpTargetTimestamp - nowSec) : 0;
    const d = Math.floor(diffSec / 86400);
    const h = Math.floor((diffSec % 86400) / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;

    return (
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-indigo-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] sm:text-xs">
                {isAiring ? 'Next Episode Countdown' : 'Broadcast & Dub Timers'}
              </span>
              {isAiring && (
                <span className="text-[9px] px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Simulcast and regional dub schedules on Crunchyroll & Muse Asia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-mono shrink-0">
          {isAiring && jpTargetTimestamp ? (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              <span>
                Ep {anime.nextAiringEpisode?.episode || ''}:{' '}
                <strong className="text-white font-bold">
                  {d > 0 ? `${d}d ` : ''}{h}h {m}m {s}s
                </strong>
              </span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
              {anime.format || 'TV Series'} · {anime.episodes || 'Season'} eps
            </div>
          )}

          {hasHindiDub && (
            <div className="px-2 py-1 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
              HI Dub Verified
            </div>
          )}

          <button
            onClick={onOpenCalendar}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-indigo-700/50 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="View Dub Release Calendar"
          >
            <Calendar className="w-3 h-3 text-indigo-400" />
            <span>Calendar</span>
          </button>

          <button
            onClick={onOpenDubs}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer text-[11px]"
          >
            <span>Dubs ↓</span>
          </button>
        </div>
      </div>
    );
  }
);
AiringCountdownHUD.displayName = 'AiringCountdownHUD';

export const AnimeDetailModal: React.FC<Props> = ({
  animeId,
  initialAnime,
  currentLang,
  onClose,
  onSelectCharacter,
  onReadManga,
  onSelectAnime,
}) => {
  const [anime, setAnime] = useState<AnimeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [inDubList, setInDubList] = useState(false);
  const [translatedSynopsis, setTranslatedSynopsis] = useState<string | null>(null);
  const [synopsisLang, setSynopsisLang] = useState<string>('bn');
  const [isSpeakingSynopsis, setIsSpeakingSynopsis] = useState(false);
  const [copiedSynopsis, setCopiedSynopsis] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [dubModalLang, setDubModalLang] = useState<string | null>(null);
  const [showDubCalendar, setShowDubCalendar] = useState(false);
  const [viewLayout, setViewLayout] = useState<'smooth-all' | 'single-tab'>('smooth-all');
  const [posterSrc, setPosterSrc] = useState<string>('');
  const [posterFailed, setPosterFailed] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const navTabsRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const showScrollTopRef = useRef(false);
  const activeTabRef = useRef<TabType>('overview');
  const tickingRef = useRef(false);

  useEffect(() => {
    setPosterSrc(anime?.coverImage || '');
    setPosterFailed(false);
  }, [anime?.coverImage]);

  useEffect(() => {
    let isMounted = true;

    // Seed strictly if initialAnime matches requested animeId
    const isMatchingInitial =
      Boolean(initialAnime) &&
      (String(initialAnime?.id) === String(animeId) ||
        String(initialAnime?.malId) === String(animeId) ||
        String(initialAnime?.anilistId) === String(animeId));
    const seedAnime = isMatchingInitial && initialAnime ? initialAnime : null;

    setAnime(seedAnime);
    setLoading(!seedAnime?.characters || seedAnime.characters.length === 0);
    setError(null);
    setTranslatedSynopsis(null);
    setIsSpeakingSynopsis(false);
    setCopiedSynopsis(false);
    setActiveTab('overview');

    isFavorite(animeId, 'anime').then((res) => {
      if (isMounted) setBookmarked(res);
    });

    isInMyDubList(animeId).then((res) => {
      if (isMounted) setInDubList(res);
    });

    const loadData = () => {
      getAnimeDetails(animeId, seedAnime || undefined)
        .then((data) => {
          if (isMounted) {
            setAnime(data);
            setLoading(false);
            setError(null);
          }
        })
        .catch((err) => {
          console.warn('Anime details fetch error:', err);
          if (isMounted) {
            if (seedAnime) {
              setAnime(seedAnime);
              setLoading(false);
            } else {
              setError('Unable to load anime details from network. Tap retry below.');
              setLoading(false);
            }
          }
        });
    };

    loadData();

    return () => {
      isMounted = false;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [animeId, initialAnime]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    getAnimeDetails(animeId, anime || initialAnime || undefined)
      .then((data) => {
        setAnime(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Anime details fetch error:', err);
        setError('Unable to load details. Click retry below.');
        setLoading(false);
      });
  };

  const handleToggleFavorite = async () => {
    if (!anime) return;
    const newState = await toggleFavorite(anime, 'anime');
    setBookmarked(newState);
    setToastMessage(newState ? 'Saved to library!' : 'Removed from library');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleDubList = async () => {
    if (!anime) return;
    const targetId = anime.id || animeId;
    if (inDubList) {
      await removeFromMyDubList(targetId);
      setInDubList(false);
      setToastMessage('Removed from My Dub List');
    } else {
      const dubInfo = getAnimeDubInfo(anime);
      const availability = getAnimeAudioAvailability(anime);
      const verifiedLangs = availability.tracks
        .filter((t) => t.verificationStatus === 'Verified')
        .map((t) => t.language);
      const extraConfirmedLangs = dubInfo.dubs
        .filter((d) => d.status === 'CONFIRMED' || d.status === 'PARTIALLY_CONFIRMED')
        .map((d) => d.language);
      const uniqueLangs = Array.from(new Set([...verifiedLangs, ...extraConfirmedLangs])).slice(0, 10);

      const verifiedPlatforms = Array.from(
        new Set([
          ...availability.platforms
            .filter((p) => p.availabilityStatus === 'Available')
            .map((p) => p.platform),
          ...(anime.watchLinks || []).map((w) => w.name),
        ])
      ).slice(0, 10);

      const primaryPlat = verifiedPlatforms[0] || 'Crunchyroll';
      const primaryUrl = buildVerifiedPlatformUrl(primaryPlat, anime.title, anime);

      const item: MyDubListItem = {
        id: `dub_${targetId}`,
        animeId: targetId,
        malId: anime.malId,
        anilistId: anime.anilistId,
        title: anime.title,
        englishTitle: anime.englishTitle,
        coverImage: anime.coverImage,
        score: anime.score,
        genres: anime.genres || [],
        dubLanguages: uniqueLangs.length > 0 ? uniqueLangs : ['Japanese'],
        status: 'watching',
        episodesWatched: 0,
        totalEpisodes: availability.totalEpisodes || anime.episodes || 12,
        verifiedPlatforms: verifiedPlatforms.length > 0 ? verifiedPlatforms : ['Official Platform'],
        primaryWatchUrl: primaryUrl,
        notes: `${uniqueLangs.length} verified audio tracks across ${verifiedPlatforms.length || 1} platform(s)`,
        addedAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveToMyDubList(item);
      setInDubList(true);
      setToastMessage('Added to My Dub List!');
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  const [showCrunchyrollUnavailableModal, setShowCrunchyrollUnavailableModal] = useState(false);

  const primaryStreamInfo = useMemo(() => {
    if (!anime) return { label: 'Stream', url: null as string | null };
    const crunchyUrl = getCrunchyrollDirectUrl(anime, anime.watchLinks, anime.nativeTitle || anime.englishTitle);
    if (crunchyUrl) return { label: 'Crunchyroll', url: crunchyUrl };
    const availability = getAnimeAudioAvailability(anime);
    const firstPlat = availability.platforms.find((p) => p.availabilityStatus === 'Available');
    if (firstPlat) {
      return {
        label: firstPlat.platform.split(' ')[0] || firstPlat.platform,
        url: firstPlat.sourceUrl,
      };
    }
    return { label: 'Official Platforms', url: null as string | null };
  }, [anime]);

  const handleStreamUnavailable = () => {
    setToastMessage('Open Official Platforms list to check regional availability.');
    setShowCrunchyrollUnavailableModal(true);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenDubs = () => {
    scrollToSection('dubs');
  };

  const handleReadManga = () => {
    if (onReadManga && anime) {
      onReadManga(anime.title);
      onClose();
    } else {
      setToastMessage('No official manga adaptation found for this title.');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleTrailerClick = () => {
    if (anime?.trailer?.youtubeId) {
      scrollToSection('trailer');
    } else {
      setToastMessage('Official trailer not available for this anime.');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleTranslateSynopsisTo = async (langCode: string) => {
    if (!anime?.synopsis) return;
    if (langCode === 'en') {
      setTranslatedSynopsis(null);
      setSynopsisLang('en');
      return;
    }
    setIsTranslating(true);
    setSynopsisLang(langCode);
    try {
      const translated = await translateText(anime.synopsis, langCode, 'English');
      setTranslatedSynopsis(translated);
    } catch (err) {
      console.error('Synopsis translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeakSynopsis = () => {
    if (!window.speechSynthesis) return;
    if (isSpeakingSynopsis) {
      window.speechSynthesis.cancel();
      setIsSpeakingSynopsis(false);
      return;
    }
    const textToSpeak = translatedSynopsis || anime?.synopsis || '';
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang =
      synopsisLang === 'bn'
        ? 'bn-BD'
        : synopsisLang === 'hi'
        ? 'hi-IN'
        : synopsisLang === 'ja'
        ? 'ja-JP'
        : 'en-US';
    utterance.onend = () => setIsSpeakingSynopsis(false);
    utterance.onerror = () => setIsSpeakingSynopsis(false);
    setIsSpeakingSynopsis(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopySynopsis = () => {
    const textToCopy = translatedSynopsis || anime?.synopsis || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedSynopsis(true);
      setTimeout(() => setCopiedSynopsis(false), 2000);
    });
  };

  const handleShare = async () => {
    if (!anime) return;
    const shareUrl = window.location.origin + `?anime=${anime.id}`;
    const shareData = {
      title: `${anime.title} - AniRead`,
      text: `Watch ${anime.title} in HD with verified Dub & Sub details on AniRead!`,
      url: shareUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setToastMessage('Anime link copied to clipboard!');
        setTimeout(() => setToastMessage(null), 2500);
      } catch {
        setToastMessage('Unable to copy link.');
        setTimeout(() => setToastMessage(null), 2500);
      }
    }
  };

  const handleExportJson = () => {
    if (!anime) return;
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(anime, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${anime.title.replace(/[^\w\s]/gi, '').trim()}-metadata.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setToastMessage('Metadata JSON exported!');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Download metadata failed:', err);
    }
  };

  const sectionIds: TabType[] = useMemo(() => [
    'overview',
    'dubs',
    'episodes',
    'seasons',
    'subs',
    'streaming',
    'characters',
    'manga',
    'interactive',
    'reviews',
    'recommendations',
    'trailer',
    'translator',
  ], []);

  // High-performance throttled scroll handler with direct progress bar DOM updates
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    const el = e.currentTarget;

    requestAnimationFrame(() => {
      tickingRef.current = false;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (progressBarRef.current && maxScroll > 0) {
        const pct = Math.min(100, Math.max(0, (el.scrollTop / maxScroll) * 100));
        progressBarRef.current.style.width = `${pct}%`;
      }

      const shouldShow = el.scrollTop > 300;
      if (showScrollTopRef.current !== shouldShow) {
        showScrollTopRef.current = shouldShow;
        setShowScrollTop(shouldShow);
      }

      if (viewLayout === 'smooth-all') {
        const containerTop = el.getBoundingClientRect().top;
        for (let i = sectionIds.length - 1; i >= 0; i--) {
          const secEl = document.getElementById(`section-${sectionIds[i]}`);
          if (secEl) {
            const secTop = secEl.getBoundingClientRect().top - containerTop;
            if (secTop <= 110) {
              if (activeTabRef.current !== sectionIds[i]) {
                activeTabRef.current = sectionIds[i];
                setActiveTab(sectionIds[i]);
              }
              break;
            }
          }
        }
      }
    });
  };

  // Smooth scroll to section in continuous mode or switch active tab
  const scrollToSection = (tab: TabType) => {
    activeTabRef.current = tab;
    setActiveTab(tab);
    if (anime) {
      if (tab === 'dubs') {
        recordQuestAction(anime.id, 'check_dubs');
      } else if (tab === 'characters') {
        recordQuestAction(anime.id, 'view_characters');
      } else if (tab === 'overview') {
        recordQuestAction(anime.id, 'view_overview');
      }
    }

    if (viewLayout === 'single-tab') {
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const targetEl = document.getElementById(`section-${tab}`);
    if (targetEl && contentRef.current) {
      const container = contentRef.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = targetEl.getBoundingClientRect();
      const targetScrollTop = container.scrollTop + (elRect.top - containerRect.top) - 52;
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    } else if (contentRef.current && tab === 'overview') {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const switchTab = scrollToSection;

  // Loading Skeleton State
  if (!anime) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center text-slate-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          {loading ? (
            <div className="py-6 w-full">
              <AnimeLoadingState
                message="Loading..."
                subMessage="Summoning official anime universe & metadata..."
                size="sm"
              />
            </div>
          ) : (
            <div className="py-8 space-y-4">
              <p className="text-base font-bold text-white">{error || 'Unable to load anime details.'}</p>
              <p className="text-xs text-slate-400">The external anime database took too long to respond.</p>
              <button
                onClick={handleRetry}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                Retry Loading Anime
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const dubCatalogInfo = getAnimeDubInfo(
    anime,
    anime.characters?.flatMap((c) => c.voiceActors || [])
  );
  const audioAvailability = getAnimeAudioAvailability(anime);
  const hasHindiVerified = Boolean(
    audioAvailability.tracks.find((t) => t.languageCode === 'hi' && t.verificationStatus === 'Verified') ||
    dubCatalogInfo.hasHindiDub
  );
  const hasEnglishVerified = Boolean(
    audioAvailability.tracks.find((t) => t.languageCode === 'en' && t.verificationStatus === 'Verified') ||
    dubCatalogInfo.hasEnglishDub
  );

  const handlePosterError = () => {
    if (posterSrc && !posterSrc.includes('/api/anime-cover') && !posterSrc.includes('/api/image-proxy')) {
      setPosterSrc(`/api/anime-cover?title=${encodeURIComponent(anime.title)}&malId=${anime.malId || ''}`);
    } else if (
      posterSrc &&
      !posterSrc.includes('/api/image-proxy') &&
      (posterSrc.includes('anilist.co') || posterSrc.includes('myanimelist.net'))
    ) {
      setPosterSrc(`/api/image-proxy?url=${encodeURIComponent(posterSrc)}`);
    } else if (anime.bannerImage && posterSrc !== anime.bannerImage && !posterSrc.includes('/api/anime-cover')) {
      setPosterSrc(anime.bannerImage);
    } else {
      setPosterFailed(true);
    }
  };

  const pictures = anime.pictures || [];
  const characters = anime.characters || [];
  const relations = anime.relations || [];
  const trailer = anime.trailer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 md:p-6 bg-black/92 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-full sm:h-auto sm:max-h-[96vh] flex flex-col rounded-none sm:rounded-3xl bg-[#090d16] border-0 sm:border border-slate-800/90 shadow-2xl overflow-hidden text-slate-100">
        {/* ========================================================= */}
        {/* TOP UTILITY HEADER BAR                                    */}
        {/* ========================================================= */}
        <div className="relative z-40 flex items-center justify-between px-3 sm:px-5 py-3 bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-400/30 text-[10px] font-mono font-bold tracking-wider uppercase shrink-0">
              {anime.format || 'Anime'}
            </span>
            {anime.status && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-700/50 px-2.5 py-0.5 rounded-full shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{anime.status}</span>
              </span>
            )}
            {hasHindiVerified && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/40 text-[10px] font-bold text-amber-300 shrink-0">
                <span className="px-1 py-0.2 rounded bg-amber-600/30 text-amber-200 font-mono text-[9px]">HI</span>
                <span>Official Hindi Dub</span>
              </span>
            )}
            {hasEnglishVerified && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-500/15 border border-blue-400/40 text-[10px] font-bold text-blue-300 shrink-0">
                <span className="px-1 py-0.2 rounded bg-blue-600/30 text-blue-200 font-mono text-[9px]">EN</span>
                <span>SimulDub</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Save / Favorite Toggle Button */}
            <button
              onClick={handleToggleFavorite}
              className={`px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm active:scale-95 ${
                bookmarked
                  ? 'bg-rose-600 border-rose-500 text-white shadow-rose-900/30'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:text-white'
              }`}
              title={bookmarked ? 'Saved in library' : 'Save to library'}
            >
              <Heart className={`w-3.5 h-3.5 ${bookmarked ? 'fill-white' : ''}`} />
              <span>{bookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* Share Link Button */}
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-sm flex items-center gap-1.5 text-xs font-semibold active:scale-95"
              title="Share Anime Link"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Export JSON Metadata Button (Legitimate resource export, no fake video download) */}
            <button
              onClick={handleExportJson}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-sm flex items-center gap-1.5 text-xs font-semibold active:scale-95"
              title="Export Full Metadata JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">JSON</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-rose-600/90 border border-slate-700/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-sm active:scale-90"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real Dynamic User Feedback Toast */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-indigo-600/95 text-white text-xs font-semibold shadow-2xl z-50 animate-in fade-in flex items-center gap-2 border border-indigo-400 backdrop-blur-md">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* UNIFIED SCROLL CONTAINER (SMOOTH & ZERO LAG)              */}
        {/* ========================================================= */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-thumb-indigo-500/30 hover:scrollbar-thumb-indigo-500/50"
        >
          {/* ========================================================= */}
          {/* CINEMATIC HERO SHOWCASE & COMMAND CENTER                  */}
          {/* ========================================================= */}
          <div className="relative w-full bg-[#05070d] overflow-hidden border-b border-slate-800/80">
            {/* Multi-Layer Ambient Background Art with Scrim Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {anime.bannerImage && anime.bannerImage.trim() !== '' ? (
                <img
                  src={anime.bannerImage}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-35 scale-105 blur-[2px]"
                />
              ) : anime.coverImage && anime.coverImage.trim() !== '' ? (
                <img
                  src={anime.coverImage}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-20 scale-110 blur-md"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-slate-950 via-indigo-950/70 to-purple-950/60" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#090d16]/95 via-[#090d16]/75 to-[#090d16]/95" />
            </div>

            <div className="relative z-20 p-3 sm:p-5 md:p-8 max-w-5xl mx-auto">
              {/* Responsive Layout: Compact split header on mobile, 2-column showcase on desktop */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8">
                {/* Poster Container & Mobile Header Row */}
                <div className="flex md:block items-center gap-3.5 sm:gap-4 w-full md:w-auto shrink-0">
                  {/* Poster Card */}
                  <div className="relative group shrink-0 w-28 xs:w-32 sm:w-36 md:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_12px_32px_rgba(99,102,241,0.25)] border-2 border-indigo-500/40 bg-slate-950 transition-all duration-300">
                    {!posterFailed && posterSrc && posterSrc.trim() !== '' ? (
                      <img
                        src={posterSrc}
                        alt={anime.title}
                        referrerPolicy="no-referrer"
                        onError={handlePosterError}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-400">
                        <Layers className="w-10 h-10 mb-2 opacity-60 text-indigo-400" />
                        <span className="text-[11px] font-medium text-slate-400 line-clamp-2 text-center">{anime.title}</span>
                      </div>
                    )}

                    {/* Audio Dub Badges directly on the poster */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-wrap gap-1 z-20">
                      <button
                        type="button"
                        onClick={() => setDubModalLang('ja')}
                        className="px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-xs text-[9px] sm:text-[10px] font-mono font-bold text-rose-300 border border-rose-500/40 shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                        title="Japanese Master Audio · View Evidence"
                      >
                        JP
                      </button>
                      {hasHindiVerified && (
                        <button
                          type="button"
                          onClick={() => setDubModalLang('hi')}
                          className="px-1.5 py-0.5 rounded-md bg-red-600/95 backdrop-blur-xs text-[9px] sm:text-[10px] font-mono font-extrabold text-white border border-red-400/80 shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                          title="Official Hindi Dub Available · View Evidence"
                        >
                          HI
                        </button>
                      )}
                      {hasEnglishVerified && (
                        <button
                          type="button"
                          onClick={() => setDubModalLang('en')}
                          className="px-1.5 py-0.5 rounded-md bg-rose-600/95 backdrop-blur-xs text-[9px] sm:text-[10px] font-mono font-bold text-white border border-rose-400/80 shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                          title="Official English Dub Available · View Evidence"
                        >
                          EN
                        </button>
                      )}
                      {dubCatalogInfo.badges.some((b) => b.code === 'TA') && (
                        <button
                          type="button"
                          onClick={() => setDubModalLang('ta')}
                          className="px-1.5 py-0.5 rounded-md bg-orange-600/90 backdrop-blur-xs text-[9px] sm:text-[10px] font-mono font-bold text-white border border-orange-400/40 shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                          title="Official Tamil Dub Available · View Evidence"
                        >
                          TA
                        </button>
                      )}
                      {dubCatalogInfo.badges.some((b) => b.code === 'TE') && (
                        <button
                          type="button"
                          onClick={() => setDubModalLang('te')}
                          className="px-1.5 py-0.5 rounded-md bg-yellow-600/90 backdrop-blur-xs text-[9px] sm:text-[10px] font-mono font-bold text-white border border-yellow-400/40 shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                          title="Official Telugu Dub Available · View Evidence"
                        >
                          TE
                        </button>
                      )}
                    </div>

                    {/* Bottom Badges on poster */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2 sm:left-2 sm:right-2 flex items-center justify-between pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-xs text-[9px] sm:text-[10px] font-mono text-indigo-300 font-bold border border-indigo-400/30">
                        {anime.format || 'HD'}
                      </span>
                      {anime.score && (
                        <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-xs text-[9px] sm:text-[10px] font-mono font-bold text-amber-300 border border-amber-500/40">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-300" />
                          <span>{anime.score.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile-only compact metadata side column */}
                  <div className="flex-1 min-w-0 md:hidden space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1">
                      {anime.status && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-700/50 px-2 py-0.5 rounded-md">
                          {anime.status}
                        </span>
                      )}
                      {anime.season && anime.year && (
                        <span className="text-[10px] text-slate-300 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded-md capitalize">
                          {anime.season} {anime.year}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-white leading-tight line-clamp-2">
                      {anime.title}
                    </h2>
                    {anime.nativeTitle && (
                      <p className="text-[11px] text-indigo-200/80 font-serif line-clamp-1">
                        {anime.nativeTitle}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-0.5">
                      {anime.score && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 font-mono text-amber-300 font-bold">
                          ★ {anime.score.toFixed(1)}
                        </span>
                      )}
                      {anime.episodes && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                          {anime.episodes} eps
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 font-mono">
                        {dubCatalogInfo.dubs.length} dubs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column / Full Width Command Center */}
                <div className="flex-1 min-w-0 w-full space-y-3.5 text-left">
                  {/* Desktop-only Tags and Title */}
                  <div className="hidden md:block space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {anime.studios && anime.studios.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 font-semibold text-[11px] flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{anime.studios[0]}</span>
                        </span>
                      )}
                      {anime.season && anime.year && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 font-medium text-[11px] capitalize">
                          {anime.season} {anime.year}
                        </span>
                      )}
                      {anime.rating && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-400 text-[10px] font-mono font-semibold">
                          {anime.rating}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                        {anime.title}
                      </h2>
                      {anime.nativeTitle && (
                        <p className="text-xs sm:text-sm text-indigo-200/80 font-medium font-serif line-clamp-1">
                          {anime.nativeTitle}{' '}
                          {anime.englishTitle && anime.englishTitle !== anime.title
                            ? `· ${anime.englishTitle}`
                            : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {anime.score && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 font-mono text-amber-300 font-bold shadow-xs">
                          <Star className="w-4 h-4 fill-amber-300" />
                          <span>{anime.score.toFixed(1)} / 10</span>
                        </div>
                      )}
                      {anime.episodes && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 font-mono font-semibold">
                          <Play className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{anime.episodes} Episodes</span>
                        </div>
                      )}
                      {anime.source && (
                        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 font-medium">
                          Source: {anime.source}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 font-medium">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>{dubCatalogInfo.dubs.length} Audio Tracks</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Buttons (Stream Anime & Dub Finder) - Full touch target min-h-[46px] */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {primaryStreamInfo.url ? (
                      <a
                        href={primaryStreamInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer min-h-[46px]"
                        title={`Stream on ${primaryStreamInfo.label}`}
                      >
                        <Tv className="w-4 h-4 shrink-0 text-white" />
                        <span>Stream Anime</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/25 text-amber-200 font-bold uppercase tracking-wider">
                          {primaryStreamInfo.label}
                        </span>
                      </a>
                    ) : (
                      <button
                        onClick={handleStreamUnavailable}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer min-h-[46px]"
                        title="Check official streaming platforms"
                      >
                        <Tv className="w-4 h-4 shrink-0 text-white" />
                        <span>Stream Anime</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/25 text-amber-200 font-bold uppercase tracking-wider">
                          {primaryStreamInfo.label}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={handleOpenDubs}
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-amber-950/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer min-h-[46px]"
                    >
                      <Volume2 className="w-4 h-4 shrink-0" />
                      <span>Dub & Audio Finder</span>
                    </button>
                  </div>

                  {/* Secondary Action Buttons (Manga, Trailer, Calendar, Save, Share) - Touch targets >= 44px */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                      onClick={handleReadManga}
                      className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer min-h-[44px]"
                      title="Read Manga Adaptation"
                    >
                      <BookOpen className="w-4 h-4 shrink-0 text-indigo-200" />
                      <span>Read Manga</span>
                    </button>

                    <button
                      onClick={handleTrailerClick}
                      className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600/90 to-red-600/90 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer min-h-[44px]"
                      title="Watch Official Trailer"
                    >
                      <Film className="w-4 h-4 shrink-0 text-rose-200" />
                      <span>Trailer</span>
                    </button>

                    <button
                      onClick={() => setShowDubCalendar(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-300 border border-indigo-700/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
                      title="View Dub Release Calendar"
                    >
                      <Calendar className="w-4 h-4 shrink-0 text-indigo-400" />
                      <span className="hidden xs:inline">Calendar</span>
                    </button>

                    <button
                      onClick={handleToggleFavorite}
                      className={`px-3.5 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                        bookmarked
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                      }`}
                      title={bookmarked ? 'Saved to library' : 'Save to library'}
                    >
                      <Heart className={`w-4 h-4 shrink-0 ${bookmarked ? 'fill-white' : ''}`} />
                      <span>{bookmarked ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={handleToggleDubList}
                      className={`px-3.5 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                        inDubList
                          ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-950/40'
                          : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-amber-300'
                      }`}
                      title={inDubList ? 'In My Dub List (Click to remove)' : 'Add to My Dub List tracker'}
                    >
                      <Bookmark className={`w-4 h-4 shrink-0 ${inDubList ? 'fill-white' : ''}`} />
                      <span>{inDubList ? 'In Dub List' : '+ Dub List'}</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
                      title="Share Anime Link"
                    >
                      <Share2 className="w-4 h-4 shrink-0 text-indigo-400" />
                      <span className="hidden xs:inline">Share</span>
                    </button>
                  </div>

                  {/* Quick-Jump Smooth Scroll Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1">
                      Quick Jump:
                    </span>
                    <button
                      onClick={() => scrollToSection('dubs')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-amber-600/20 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Volume2 className="w-3 h-3 text-amber-400" />
                      <span>Dubs ↓</span>
                    </button>
                    <button
                      onClick={() => scrollToSection('episodes')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Play className="w-3 h-3 text-indigo-400" />
                      <span>Episodes ↓</span>
                    </button>
                    <button
                      onClick={() => scrollToSection('streaming')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Tv className="w-3 h-3 text-emerald-400" />
                      <span>Streams ↓</span>
                    </button>
                    <button
                      onClick={() => scrollToSection('characters')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-cyan-600/20 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Languages className="w-3 h-3 text-cyan-400" />
                      <span>Cast ↓</span>
                    </button>
                    <button
                      onClick={() => scrollToSection('seasons')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-purple-600/20 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <GitBranch className="w-3 h-3 text-purple-400" />
                      <span>Universe ↓</span>
                    </button>
                    <button
                      onClick={() => scrollToSection('manga')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-pink-600/20 text-slate-300 hover:text-pink-300 border border-slate-800 hover:border-pink-500/40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <BookOpen className="w-3 h-3 text-pink-400" />
                      <span>Manga ↓</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* STICKY SECTION NAVIGATION TABS (GALLERY REMOVED)          */}
          {/* ========================================================= */}
          <div className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2">
              <div
                ref={navTabsRef}
                className="flex items-center gap-1.5 text-xs overflow-x-auto scrollbar-none scroll-smooth flex-1 min-w-0"
              >
                {[
                  { id: 'overview', label: 'Overview & Facts', icon: Layers },
                  {
                    id: 'dubs',
                    label: `Dub Details (${dubCatalogInfo.dubs.filter((d) => d.code !== 'ja').length})`,
                    icon: Volume2,
                    highlight: dubCatalogInfo.hasHindiDub,
                  },
                  { id: 'episodes', label: 'Episodes & Tracker', icon: Play },
                  {
                    id: 'seasons',
                    label: `Franchise Universe (${relations.length})`,
                    icon: GitBranch,
                  },
                  {
                    id: 'subs',
                    label: 'Sub Details & Captions',
                    icon: FileText,
                  },
                  { id: 'streaming', label: 'Streaming Services', icon: Tv },
                  {
                    id: 'characters',
                    label: `Characters & Cast (${characters.length})`,
                    icon: Languages,
                  },
                  { id: 'manga', label: 'Manga & Novels', icon: BookOpen },
                  { id: 'interactive', label: 'Quests & Matcher', icon: Sparkles },
                  { id: 'reviews', label: 'Reviews & Score', icon: MessageSquare },
                  { id: 'recommendations', label: 'Recommendations', icon: ThumbsUp },
                  { id: 'trailer', label: 'Trailer', icon: Film },
                  { id: 'translator', label: 'Google AI Translator', icon: Globe },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => scrollToSection(tab.id as TabType)}
                      className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md font-semibold border border-indigo-400/30'
                          : tab.highlight
                          ? 'text-amber-300 hover:text-white hover:bg-slate-800/60 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* View Layout Mode Toggle Settings */}
              <div className="flex items-center gap-1 shrink-0 pl-1">
                <button
                  onClick={() => setViewLayout((prev) => (prev === 'smooth-all' ? 'single-tab' : 'smooth-all'))}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    viewLayout === 'smooth-all'
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30'
                      : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                  title={
                    viewLayout === 'smooth-all'
                      ? 'Continuous smooth scroll active. Click to switch to tabbed view.'
                      : 'Tabbed view active. Click to switch to continuous smooth scroll view.'
                  }
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {viewLayout === 'smooth-all' ? 'Continuous Scroll' : 'Tab Focus'}
                  </span>
                </button>
              </div>
            </div>

            {/* Dynamic Scroll Progress Bar */}
            <div className="w-full h-1 bg-slate-950 overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 transition-all duration-75"
                style={{ width: '0%' }}
              />
            </div>
          </div>

          {/* TAB CONTENT BODY */}
          <div className="p-4 sm:p-6 md:p-8 pb-28 space-y-6">
          {/* TAB: OVERVIEW & KEY FACTS */}
          {(viewLayout === 'smooth-all' || activeTab === 'overview') && (
            <div id="section-overview" className="scroll-mt-20 space-y-6 animate-in fade-in duration-200">
              {/* Quick Audio & Stream Highlights Ribbon */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-800/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                    <Volume2 className="w-4 h-4" />
                    <span>
                      Audio: JP (Original)
                      {hasHindiVerified ? ' · HI Hindi Dub' : ''}
                      {hasEnglishVerified ? ' · EN English Dub' : ''}
                      {dubCatalogInfo.badges.some((b) => b.code === 'TA') ? ' · TA Tamil Dub' : ''}
                      {dubCatalogInfo.badges.some((b) => b.code === 'TE') ? ' · TE Telugu Dub' : ''}
                    </span>
                  </div>
                  <span className="text-slate-600 hidden sm:inline">|</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold hidden sm:flex">
                    <Tv className="w-4 h-4" />
                    <span>Official Streams on Crunchyroll, Netflix, Muse Asia</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => switchTab('dubs')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer"
                  >
                    View All Dubs →
                  </button>
                </div>
              </div>

              {/* AI 24 Websites Verification & Complete Release Dates Dashboard */}
              <AnimeWebSourceChecker anime={anime} defaultExpandedWebsites={true} />

              {/* Synopsis with AI Google Translator & Voice Readout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-bold">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>
                      {translatedSynopsis ? (
                        <>
                          {getUIText('translatedInto', currentLang)}{' '}
                          <strong className="text-indigo-300">
                            {SUPPORTED_LANGUAGES.find((l) => l.code === synopsisLang)?.name || synopsisLang}
                          </strong>
                        </>
                      ) : (
                        'Official Synopsis (AI Translator to 100+ languages):'
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {translatedSynopsis && (
                      <>
                        <button
                          onClick={handleCopySynopsis}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy translation"
                        >
                          {copiedSynopsis ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedSynopsis ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={handleSpeakSynopsis}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isSpeakingSynopsis
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                          }`}
                          title="Listen to readout"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setTranslatedSynopsis(null);
                            setSynopsisLang('en');
                          }}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => switchTab('translator')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                      <span>Full Google AI Translator →</span>
                    </button>
                  </div>
                </div>

                {/* Quick Translation Language Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1">
                    Translate to:
                  </span>
                  {[
                    { code: 'bn', label: 'বাংলা (Bangla)' },
                    { code: 'hi', label: 'हिन्दी (Hindi)' },
                    { code: 'ja', label: '日本語 (Japanese)' },
                    { code: 'ko', label: '한국어 (Korean)' },
                    { code: 'es', label: 'Español (Spanish)' },
                    { code: 'fr', label: 'Français (French)' },
                    { code: 'de', label: 'Deutsch (German)' },
                    { code: 'ar', label: 'العربية (Arabic)' },
                    { code: 'en', label: 'Original English' },
                  ].map((item) => (
                    <button
                      key={item.code}
                      disabled={isTranslating}
                      onClick={() => handleTranslateSynopsisTo(item.code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        synopsisLang === item.code && (translatedSynopsis || item.code === 'en')
                          ? 'bg-indigo-600 text-white font-bold shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Synopsis Text */}
                {isTranslating ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-indigo-300 text-xs">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Translating synopsis into localized script...</span>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans pt-1">
                    {translatedSynopsis || anime.synopsis}
                  </p>
                )}
              </div>

              {/* Comprehensive Key Facts Grid */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Key Production & Broadcast Facts
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                      <Tv className="w-3 h-3 text-indigo-400" />
                      <span>Format</span>
                    </span>
                    <span className="font-semibold text-white">{anime.format || 'TV Series'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                      <Play className="w-3 h-3 text-indigo-400" />
                      <span>Episodes</span>
                    </span>
                    <span className="font-semibold text-white">{anime.episodes || 'TBA'} Episodes</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span>Duration</span>
                    </span>
                    <span className="font-semibold text-white">{anime.duration || '24 min / ep'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-400" />
                      <span>Premiered Season</span>
                    </span>
                    <span className="font-semibold text-white capitalize">
                      {anime.season || 'Annual'} {anime.year || ''}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-400" />
                      <span>Animation Studio</span>
                    </span>
                    <span className="font-semibold text-white">
                      {anime.studios?.[0] || 'Official Committee'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                      <FileText className="w-3 h-3 text-indigo-400" />
                      <span>Source Material</span>
                    </span>
                    <span className="font-semibold text-white">{anime.source || 'Original'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-indigo-400" />
                      <span>Age Rating</span>
                    </span>
                    <span className="font-semibold text-white">{anime.rating || 'PG-13'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span>Score / Ranking</span>
                    </span>
                    <span className="font-semibold text-amber-300 font-mono">
                      {anime.score ? `${anime.score.toFixed(1)} / 10` : 'Not Scored'}
                    </span>
                  </div>
                </div>

                {/* Genres & Themes */}
                {anime.genres && anime.genres.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Genres & Demographic Themes:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {anime.genres.map((g, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-indigo-950/50 border border-indigo-800/40 text-xs font-semibold text-indigo-200"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Awards & Industry Honors */}
                {anime.awards && anime.awards.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Awards & Accolades:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {anime.awards.map((award, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-[11px] font-bold text-amber-300 flex items-center gap-1 shadow-xs"
                        >
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>{award}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audio Languages Available */}
                {anime.audioLanguages && anime.audioLanguages.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] text-indigo-400 uppercase font-bold flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Verified Audio Tracks:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {anime.audioLanguages.map((aud, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-[11px] font-medium text-indigo-300"
                        >
                          {aud}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Advisory Warnings */}
                {anime.contentAdvisories && anime.contentAdvisories.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Content Advisory:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {anime.contentAdvisories.map((adv, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-300"
                        >
                          {adv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtitles Available */}
                {anime.subtitles && anime.subtitles.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5" />
                      <span>Verified Subtitles:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {anime.subtitles.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] font-medium text-cyan-300"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copyright & Production Committee */}
                {anime.copyright && (
                  <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                    <span>{anime.copyright}</span>
                  </div>
                )}
              </div>

              {/* Theme Songs (Openings & Endings) */}
              {anime.themeSongs && (anime.themeSongs.openings.length > 0 || anime.themeSongs.endings.length > 0) && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Music className="w-4 h-4 text-purple-400" />
                    <span>Official Soundtrack & Theme Songs</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {anime.themeSongs.openings.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-purple-300 uppercase block">Opening Theme</span>
                        <p className="text-slate-200 font-medium line-clamp-2">{anime.themeSongs.openings[0]}</p>
                      </div>
                    )}
                    {anime.themeSongs.endings.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-purple-300 uppercase block">Ending Theme</span>
                        <p className="text-slate-200 font-medium line-clamp-2">{anime.themeSongs.endings[0]}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: DUB DETAILS & AUDIO */}
          {(viewLayout === 'smooth-all' || activeTab === 'dubs') && (
            <div
              id="section-dubs"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              {viewLayout === 'smooth-all' && (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Official Dub Details & Verified Audio Cast
                      </h3>
                      <p className="text-xs text-slate-400">
                        7-language verified dub facts with Crunchyroll and regional streaming evidence
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Top</span>
                  </button>
                </div>
              )}
              <AnimeDubFinder anime={anime} currentLang={currentLang} />
            </div>
          )}

          {/* TAB: EPISODES & WATCH TRACKER */}
          {(viewLayout === 'smooth-all' || activeTab === 'episodes') && (
            <div
              id="section-episodes"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              {viewLayout === 'smooth-all' && (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      <Play className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Episodes & Watch Tracker
                      </h3>
                      <p className="text-xs text-slate-400">
                        Track watched episodes, mark completions, and monitor release countdowns
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Top</span>
                  </button>
                </div>
              )}
              <AnimeEpisodesProgress anime={anime} />
            </div>
          )}

          {/* TAB: SEASONS & FRANCHISE UNIVERSE */}
          {(viewLayout === 'smooth-all' || activeTab === 'seasons') && (
            <div
              id="section-seasons"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              {viewLayout === 'smooth-all' && (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Seasons & Franchise Universe ({relations.length})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Prequels, sequels, spinoffs, side stories, and connected timeline works
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Top</span>
                  </button>
                </div>
              )}
              <AnimeFranchiseUniverse
                anime={anime}
                onSelectAnime={onSelectAnime}
                onReadManga={onReadManga}
                onCloseModal={onClose}
              />
            </div>
          )}

          {/* TAB: SUB DETAILS (Official Subtitle & Caption Hub) */}
          {(viewLayout === 'smooth-all' || activeTab === 'subs') && (
            <div
              id="section-subs"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              {viewLayout === 'smooth-all' && (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Official Subtitle & Caption Details
                      </h3>
                      <p className="text-xs text-slate-400">
                        Official Japanese audio subtitles, English CC, and regional text tracks
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Top</span>
                  </button>
                </div>
              )}
              <AnimeSubDetailsSection
                anime={anime}
                currentLang={currentLang}
                onSwitchToDubs={() => scrollToSection('dubs')}
              />
            </div>
          )}

          {/* TAB: STREAMING SERVICES */}
          {(viewLayout === 'smooth-all' || activeTab === 'streaming') && (
            <div
              id="section-streaming"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              {viewLayout === 'smooth-all' && (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Official Streaming Services
                      </h3>
                      <p className="text-xs text-slate-400">
                        Crunchyroll, Netflix, Muse Asia, Hulu, and licensed regional streams
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Top</span>
                  </button>
                </div>
              )}
              <AnimeStreamingServices anime={anime} />
            </div>
          )}

          {/* TAB: CHARACTERS & VOICE ACTORS */}
          {(viewLayout === 'smooth-all' || activeTab === 'characters') && (
            <div
              id="section-characters"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              {viewLayout === 'smooth-all' && (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      <Languages className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Characters & Voice Cast ({characters.length})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Original Japanese Seiyuu, English SimulDub, and international cast
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Top</span>
                  </button>
                </div>
              )}
              <AnimeCharactersCast
                characters={characters}
                animePictures={pictures}
                onSelectCharacter={onSelectCharacter}
              />
            </div>
          )}

          {/* TAB: MANGA & RELATED WORKS */}
          {(viewLayout === 'smooth-all' || activeTab === 'manga') && (
            <div
              id="section-manga"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              {viewLayout === 'smooth-all' && (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-pink-500/15 text-pink-400 border border-pink-500/30">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        All Franchise Manga, Light Novels & Spinoffs
                      </h3>
                      <p className="text-xs text-slate-400">
                        Read all manga editions with integrated MangaDex & ANIREAD reader
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Top</span>
                  </button>
                </div>
              )}
              <AnimeMangaRelated anime={anime} onReadManga={onReadManga} onCloseModal={onClose} />
            </div>
          )}

          {/* TAB: ANIME QUESTS & INTERACTIVE ZONE */}
          {(viewLayout === 'smooth-all' || activeTab === 'interactive') && (
            <div
              id="section-interactive"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              <AnimeInteractiveZone anime={anime} onSelectAnime={onSelectAnime} />
            </div>
          )}

          {/* TAB: REVIEWS & COMMUNITY SCORE */}
          {(viewLayout === 'smooth-all' || activeTab === 'reviews') && (
            <div
              id="section-reviews"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              <AnimeReviewsSection anime={anime} />
            </div>
          )}

          {/* TAB: RECOMMENDATIONS */}
          {(viewLayout === 'smooth-all' || activeTab === 'recommendations') && (
            <div
              id="section-recommendations"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              <AnimeRecommendations anime={anime} onSelectAnime={onSelectAnime} />
            </div>
          )}

          {/* TAB: TRAILER THEATER MODE */}
          {trailer?.youtubeId && (viewLayout === 'smooth-all' || activeTab === 'trailer') && (
            <div
              id="section-trailer"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              <AnimeTrailerSection trailer={trailer} animeTitle={anime.title} />
            </div>
          )}

          {/* TAB: GOOGLE AI TRANSLATOR */}
          {(viewLayout === 'smooth-all' || activeTab === 'translator') && (
            <div
              id="section-translator"
              className={
                viewLayout === 'smooth-all'
                  ? 'scroll-mt-20 pt-8 border-t border-slate-800/80 space-y-4'
                  : 'space-y-4 animate-in fade-in duration-200'
              }
            >
              {viewLayout === 'smooth-all' && (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Google AI Multi-Language Translator
                      </h3>
                      <p className="text-xs text-slate-400">
                        Translate synopsis, trivia, and reviews into 100+ languages
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Top</span>
                  </button>
                </div>
              )}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <GoogleAITranslator
                  initialText={anime.synopsis}
                  defaultTargetLang={currentLang}
                  titleContext={anime.title}
                  inline={true}
                />
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Floating Scroll To Top Button */}
        {showScrollTop && (
          <button
            onClick={() => {
              if (contentRef.current) {
                contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="absolute bottom-5 right-5 z-40 p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl border border-indigo-400 transition-all hover:scale-110 active:scale-95 cursor-pointer animate-in fade-in"
            title="Scroll to top"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}

        {/* Dub Details Panel (Rule 5) */}
        <DubDetailsModal
          isOpen={dubModalLang !== null}
          onClose={() => setDubModalLang(null)}
          anime={anime}
          initialLanguageCode={dubModalLang || 'hi'}
          onOpenEpisodeTimers={() => {
            setDubModalLang(null);
            switchTab('dubs');
          }}
        />

        {/* Crunchyroll Unavailable Modal (Rule 8: If official page cannot be verified, show "This anime is not available on Crunchyroll." without redirecting to random page) */}
        {showCrunchyrollUnavailableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-[#0b0f19] border border-amber-500/40 p-6 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">This anime is not available on Crunchyroll.</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No verified official Crunchyroll series page is currently licensed for <span className="text-amber-200 font-semibold">{anime?.title}</span>.
                </p>
                <p className="text-[11px] text-slate-400">
                  Per our strict anti-redirect policy, we do not redirect you to general search results or homepages. You can stream this anime on other licensed regional platforms below.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowCrunchyrollUnavailableModal(false);
                    scrollToSection('streaming');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
                >
                  View Other Streaming Platforms
                </button>
                <button
                  onClick={() => setShowCrunchyrollUnavailableModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
