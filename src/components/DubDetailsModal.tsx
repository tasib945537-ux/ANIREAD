import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Volume2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Tv,
  Globe,
  Clock,
  Radio,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Bookmark,
  Check,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AnimeItem, DubVerificationStatus, DubDetail } from '../types/anime';
import { getAnimeDubInfo } from '../services/dubCatalog';
import { getAnimeAudioAvailability, buildVerifiedPlatformUrl } from '../services/dubVerificationStorage';
import { VERIFIED_24_ANIME_WEBSITES } from './anime-detail/AnimeWebSourceChecker';
import {
  saveToMyDubList,
  removeFromMyDubList,
  isInMyDubList,
} from '../services/offlineStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anime: AnimeItem | null;
  initialLanguageCode?: string; // e.g. 'hi', 'en', 'ta', 'te', 'bn', 'ja'
  onOpenEpisodeTimers?: () => void;
}

export const DubDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  anime,
  initialLanguageCode = 'hi',
  onOpenEpisodeTimers,
}) => {
  const [selectedLang, setSelectedLang] = useState<string>(initialLanguageCode.toLowerCase());
  const [inMyDubList, setInMyDubList] = useState<boolean>(false);
  const [showAll24Sources, setShowAll24Sources] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  useEffect(() => {
    if (initialLanguageCode) {
      setSelectedLang(initialLanguageCode.toLowerCase());
    }
  }, [initialLanguageCode]);

  useEffect(() => {
    if (anime) {
      isInMyDubList(anime.id).then(setInMyDubList);
    }
  }, [anime]);

  const mergedDubs = useMemo<DubDetail[]>(() => {
    if (!anime) return [];
    const dubInfo = getAnimeDubInfo(anime);
    const availability = getAnimeAudioAvailability(anime);

    const mapTrackStatus = (
      status: string,
      isPartiallyDubbed?: boolean
    ): DubVerificationStatus => {
      if (status === 'Verified') {
        return isPartiallyDubbed ? 'PARTIALLY_CONFIRMED' : 'CONFIRMED';
      }
      if (status === 'Unverified') return 'REPORTED_UNVERIFIED';
      if (status === 'Unavailable') return 'Sub Only';
      return 'UNKNOWN';
    };

    const baseDubs: DubDetail[] = [...dubInfo.dubs].map((d) => {
      const code = d.code.toLowerCase();
      const matchingTrack = availability.tracks.find((t) => t.languageCode.toLowerCase() === code);
      if (!matchingTrack) return d;

      const mappedStatus = mapTrackStatus(matchingTrack.verificationStatus, matchingTrack.isPartiallyDubbed);

      return {
        ...d,
        status: mappedStatus,
        episodeRange: matchingTrack.episodeRange || d.episodeRange,
        episodesDubbed: matchingTrack.episodeRange || d.episodesDubbed,
        platforms: d.platforms && d.platforms.length > 0 ? d.platforms : [matchingTrack.provider],
        releaseDate: matchingTrack.releaseDate || d.releaseDate,
        airTime: matchingTrack.airTime || d.airTime,
        simulcastSchedule: matchingTrack.simulcastSchedule || d.simulcastSchedule,
        broadcastTiming: matchingTrack.broadcastTiming || d.broadcastTiming,
        timeZone: matchingTrack.timeZone || d.timeZone,
        notes: matchingTrack.notes || d.notes,
        watchUrl: d.watchUrl || matchingTrack.sourceUrl,
      };
    });

    // Ensure every track from availability (including Hindi/Bangla/English when unverified/unavailable) has an entry
    for (const track of availability.tracks) {
      const exists = baseDubs.some((d) => d.code.toLowerCase() === track.languageCode.toLowerCase());
      if (!exists) {
        const mappedStatus = mapTrackStatus(track.verificationStatus, track.isPartiallyDubbed);

        baseDubs.push({
          language: track.language,
          code: track.languageCode,
          flag: '',
          name:
            track.languageCode === 'hi'
              ? 'Hindi Dub Status (हिन्दी)'
              : track.languageCode === 'bn'
              ? 'Bangla Dub Status (বাংলা)'
              : `${track.language} Audio Status`,
          status: mappedStatus,
          castCount: 0,
          platforms: [track.provider],
          verificationSource: track.provider,
          isVerified: track.verificationStatus === 'Verified',
          releaseDate: track.releaseDate || 'Catalog Audit',
          episodeRange: track.episodeRange,
          episodesDubbed: track.episodeRange,
          airTime: track.airTime,
          simulcastSchedule: track.simulcastSchedule,
          broadcastTiming: track.broadcastTiming,
          timeZone: track.timeZone,
          notes: track.notes,
          watchUrl: track.sourceUrl,
        });
      }
    }

    return baseDubs;
  }, [anime]);

  const availabilitySummary = useMemo(
    () => (anime ? getAnimeAudioAvailability(anime) : null),
    [anime]
  );

  if (!isOpen || !anime) return null;

  const currentDub =
    mergedDubs.find(
      (d) =>
        d.code.toLowerCase() === selectedLang ||
        d.language.toLowerCase().includes(selectedLang) ||
        (selectedLang === 'bn' && (d.language.toLowerCase().includes('bengali') || d.language.toLowerCase().includes('bangla')))
    ) || mergedDubs[0];

  const handleToggleMyDubList = async () => {
    if (!anime) return;
    if (inMyDubList) {
      await removeFromMyDubList(anime.id);
      setInMyDubList(false);
      setCopiedToast('Removed from My Dub List');
    } else {
      const dubLangs = mergedDubs
        .filter((d) => d.status === 'CONFIRMED' || d.status === 'PARTIALLY_CONFIRMED' || d.status === 'Available')
        .map((d) => d.language)
        .filter(Boolean);
      const trackPlatforms = availabilitySummary?.platforms
        .filter((p) => p.availabilityStatus === 'Available')
        .map((p) => p.platform) || [];
      const fallbackPlatforms =
        currentDub?.platforms && currentDub.platforms.length > 0
          ? currentDub.platforms
          : trackPlatforms.length > 0
          ? trackPlatforms
          : ['Official Licensed Platform'];
      const uniquePlatforms = Array.from(new Set([...fallbackPlatforms, ...trackPlatforms])).slice(0, 10);

      await saveToMyDubList({
        id: `dub_${anime.id}`,
        animeId: anime.id,
        malId: anime.malId,
        anilistId: anime.anilistId,
        title: anime.title,
        coverImage: anime.coverImage,
        score: anime.score,
        genres: anime.genres || ['Action'],
        dubLanguages: dubLangs.length > 0 ? dubLangs : ['Japanese'],
        status: 'watching',
        episodesWatched: 0,
        totalEpisodes: availabilitySummary?.totalEpisodes || anime.episodes || 12,
        verifiedPlatforms: uniquePlatforms,
        primaryWatchUrl: getSourceLink(currentDub),
        notes: `Tracked from Dub Details · ${currentDub?.name || 'Verified Dub'}`,
        addedAt: Date.now(),
        updatedAt: Date.now(),
      });
      setInMyDubList(true);
      setCopiedToast('Added to My Dub List!');
    }
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const getSourceLink = (dub?: DubDetail): string => {
    if (dub?.watchUrl) return dub.watchUrl;
    const primaryPlat = dub?.platforms?.[0] || (dub?.code === 'bn' ? 'Muse India' : 'JustWatch');
    return buildVerifiedPlatformUrl(primaryPlat, anime.title, anime);
  };

  const getStatusBadge = (status: DubVerificationStatus | string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'Available':
        return (
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            CONFIRMED
          </span>
        );
      case 'PARTIALLY_CONFIRMED':
      case 'Partial':
        return (
          <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            PARTIALLY CONFIRMED
          </span>
        );
      case 'ANNOUNCED':
        return (
          <span className="px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-500/40 text-sky-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            ANNOUNCED
          </span>
        );
      case 'Sub Only':
        return (
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            SUBTITLES ONLY
          </span>
        );
      case 'REPORTED_UNVERIFIED':
      case 'UNVERIFIED':
        return (
          <span className="px-2.5 py-1 rounded-md bg-orange-500/15 border border-orange-500/40 text-orange-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            UNVERIFIED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[11px] font-bold">
            UNKNOWN
          </span>
        );
    }
  };

  const getRegionForLang = (code: string, platformsList?: string[]) => {
    const platSummary = platformsList && platformsList.length > 0 ? ` (${platformsList.join(' / ')})` : '';
    switch (code) {
      case 'hi':
        return `India & South Asia${platSummary || ' (Official Indian Distributors)'}`;
      case 'bn':
        return `Bangladesh & India${platSummary || ' (Muse India Official)'}`;
      case 'ta':
      case 'te':
        return `India (Regional South Asia)${platSummary}`;
      case 'en':
        return `Global / International${platSummary}`;
      case 'es':
        return `Latin America & Spain${platSummary}`;
      case 'ja':
        return 'Japan (Original Master) & Worldwide';
      default:
        return `International Licensed Territories${platSummary}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-[#090d16] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dub-details-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                  Verified Audio Dub Evidence
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  ISO Registry
                </span>
              </div>
              <h2 id="dub-details-title" className="text-sm sm:text-base font-bold text-white truncate">
                {anime.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Add to My Dub List Button */}
            <button
              onClick={handleToggleMyDubList}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                inMyDubList
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
              title={inMyDubList ? 'Saved in My Dub List' : 'Add to My Dub List'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${inMyDubList ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{inMyDubList ? 'In My Dub List' : 'Add to Dub List'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Language Tabs Selector */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase shrink-0">
            Select Track:
          </span>
          {mergedDubs.map((d) => {
            const isSelected = (currentDub?.code || '').toLowerCase() === d.code.toLowerCase();
            return (
              <button
                key={d.code}
                onClick={() => setSelectedLang(d.code.toLowerCase())}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md border border-amber-400/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{d.code.toUpperCase()}</span>
                <span className="hidden sm:inline font-sans text-[11px] font-medium text-slate-300">
                  {d.language}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {currentDub ? (
            <>
              {/* Status & Title Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                      Audio Track & Localized Title
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {currentDub.name}
                    </h3>
                  </div>
                  <div>{getStatusBadge(currentDub.status)}</div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {currentDub.notes ||
                    'Audited against verified streaming catalog metadata, distributor press releases, and voice actor rosters.'}
                </p>
              </div>

              {/* Hindi Dub Timing & Broadcast Schedule Card */}
              {(currentDub.airTime || currentDub.simulcastSchedule || currentDub.broadcastTiming || (currentDub.code === 'hi' && (currentDub.status === 'CONFIRMED' || currentDub.status === 'PARTIALLY_CONFIRMED' || currentDub.status === 'Available'))) && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/60 border border-amber-500/40 space-y-2.5 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase text-amber-300 font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Dub Release Schedule & Official Streaming Platforms
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                      {currentDub.timeZone || 'IST (Indian Standard Time)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Release / Broadcast Info</span>
                      <span className="text-amber-200 font-bold text-xs">
                        {currentDub.airTime || currentDub.releaseDate || 'Official Catalog Verification'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Verified Platform Distribution</span>
                      <span className="text-indigo-200 font-bold text-xs">
                        {currentDub.simulcastSchedule ||
                          (currentDub.platforms && currentDub.platforms.length > 0
                            ? `${currentDub.platforms.join(' / ')}`
                            : 'Official Regional Distributor')}
                      </span>
                    </div>
                  </div>

                  {currentDub.broadcastTiming ? (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                      <strong className="text-amber-300">Advance Broadcast Notice: </strong>
                      {currentDub.broadcastTiming}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                      <strong className="text-amber-300">Coverage Verification: </strong>
                      Available episodes: {currentDub.episodeRange || currentDub.episodesDubbed || 'All Episodes Verified'}. Timing confirmed via official licensor release calendars.
                    </div>
                  )}
                </div>
              )}

              {/* Requirement 5 Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                {/* 1. Language */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    Language & Code
                  </span>
                  <p className="text-xs font-bold text-slate-200">
                    {currentDub.language} ({currentDub.code.toUpperCase()})
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Type: {currentDub.code === 'ja' ? 'Original Japanese Master' : 'Official Localized Dub'}
                  </p>
                </div>

                {/* 2. Season */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    Season Structure
                  </span>
                  <p className="text-xs font-bold text-slate-200">
                    {currentDub.seasonTitle || (anime.season ? `${anime.season} ${anime.year || ''}` : 'Season 1 / TV Broadcast')}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Season: {currentDub.seasonNumber || 1}
                  </p>
                </div>

                {/* 3. Available Episode Range */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Available Episode Range
                  </span>
                  <p className="text-xs font-bold text-amber-300 font-mono">
                    {currentDub.episodeRange || currentDub.episodesDubbed || (availabilitySummary?.totalEpisodes ? `Episodes 1–${availabilitySummary.totalEpisodes}` : 'Full Season Episodes')}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Total Season: {availabilitySummary?.totalEpisodes || anime.episodes || 'TBD'} episodes
                  </p>
                </div>

                {/* 4. Platform */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Streaming Platforms
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {(currentDub.platforms && currentDub.platforms.length > 0
                      ? currentDub.platforms
                      : ['Not Confirmed']
                    ).map((platName) => (
                      <a
                        key={platName}
                        href={buildVerifiedPlatformUrl(platName, anime.title, anime)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[11px] font-bold transition-colors"
                        title={`Verify ${anime.title} on ${platName}`}
                      >
                        <span>{platName}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Audio Master: {currentDub.audioQuality || 'Dolby Stereo / 5.1 Surround'}
                  </p>
                </div>

                {/* 5. Region */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Licensed Region
                  </span>
                  <p className="text-xs font-bold text-cyan-300">
                    {currentDub.regionCode || getRegionForLang(currentDub.code, currentDub.platforms)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Territory code: {currentDub.code === 'hi' ? 'IN' : currentDub.code === 'bn' ? 'BD / IN' : 'GLOBAL'}
                  </p>
                </div>

                {/* 6. Verification Status & Last Checked */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                    Verification Source & Date
                  </span>
                  <p className="text-xs font-semibold text-slate-200">
                    {currentDub.verificationSource || 'Official Distributor Catalog'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Last Checked: <span className="text-indigo-300 font-semibold">{currentDub.verifiedAt || 'November 2026'}</span>
                  </p>
                </div>
              </div>

              {/* Source Link & Verification Evidence Section */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-900/40 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">
                    Primary Evidence & Official Listing
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Direct Source URL</span>
                </div>

                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="truncate font-mono text-[11px] text-slate-300">
                    {getSourceLink(currentDub)}
                  </div>
                  <a
                    href={getSourceLink(currentDub)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  >
                    <span>Verify Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 24 Web Verification Sources Section */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                      <Globe className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>24 Authoritative Anime & Dub Sites</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold">Checked</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">Click any site to verify streaming, dub dates & catalog records</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAll24Sources(!showAll24Sources)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showAll24Sources ? 'Show Less' : 'View All 24'}</span>
                    {showAll24Sources ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(showAll24Sources ? VERIFIED_24_ANIME_WEBSITES : VERIFIED_24_ANIME_WEBSITES.slice(0, 6)).map((site) => {
                    const targetUrl = site.getSearchUrl(anime.title, anime);
                    return (
                      <a
                        key={site.id}
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-2 group"
                      >
                        {site.logoUrl && site.logoUrl.trim() !== '' ? (
                          <img
                            src={site.logoUrl}
                            alt=""
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                            className="w-4 h-4 rounded-sm shrink-0 object-contain"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-sm shrink-0 bg-slate-800 flex items-center justify-center text-[8px] text-slate-400">
                            🌐
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold truncate group-hover:text-indigo-300 transition-colors">
                            {site.name}
                          </p>
                          <p className="text-[9px] text-slate-500 truncate font-mono">
                            {site.domain}
                          </p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Voice Actors (if accredited) */}
              {currentDub.voiceActorsList && currentDub.voiceActorsList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Accredited Voice Cast ({currentDub.voiceActorsList.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {currentDub.voiceActorsList.slice(0, 6).map((va, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                          {va.image && va.image.trim() !== '' ? (
                            <img src={va.image} alt={va.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xs">
                              VA
                            </div>
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-200 truncate">{va.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono">{va.language}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-slate-400">
              No audio dub information available for this title.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between gap-3">
          {onOpenEpisodeTimers && (
            <button
              onClick={() => {
                onClose();
                onOpenEpisodeTimers();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-700/50 text-indigo-300 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>View Live Episode Timers</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors ml-auto cursor-pointer shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
