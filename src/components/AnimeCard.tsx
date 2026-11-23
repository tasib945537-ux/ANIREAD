import React, { useState, useEffect } from 'react';
import { Star, BookOpen, Layers } from 'lucide-react';
import { AnimeItem, MangaItem } from '../types/anime';
import { getAnimeAudioAvailability } from '../services/dubVerificationStorage';

interface Props {
  item: AnimeItem | MangaItem;
  type: 'anime' | 'manga';
  onClick: () => void;
  onDubBadgeClick?: (anime: AnimeItem, langCode: string) => void;
  showHindiDetails?: boolean;
  showUpcomingDetails?: boolean;
}

export const AnimeCard: React.FC<Props> = ({
  item,
  type,
  onClick,
  onDubBadgeClick,
  showHindiDetails = false,
  showUpcomingDetails = false,
}) => {
  const [currentSrc, setCurrentSrc] = useState(item.coverImage);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(item.coverImage);
    setHasFailed(false);
  }, [item.coverImage]);

  const handleImageError = () => {
    if (
      currentSrc &&
      !currentSrc.includes('/api/anime-cover') &&
      !currentSrc.includes('/api/image-proxy')
    ) {
      setCurrentSrc(`/api/anime-cover?title=${encodeURIComponent(item.title)}&malId=${(item as any).malId || ''}`);
    } else if (
      currentSrc &&
      !currentSrc.includes('/api/image-proxy') &&
      !currentSrc.includes('/api/proxy-image') &&
      (currentSrc.includes('anilist.co') || currentSrc.includes('myanimelist.net') || currentSrc.includes('mangadex.org'))
    ) {
      setCurrentSrc(`/api/image-proxy?url=${encodeURIComponent(currentSrc)}`);
    } else if (item.bannerImage && currentSrc !== item.bannerImage && !currentSrc?.includes('/api/anime-cover')) {
      setCurrentSrc(item.bannerImage);
    } else {
      setHasFailed(true);
    }
  };

  const isAnime = type === 'anime';
  const animeItem = item as AnimeItem;

  const displayTitle = item.title;
  const scoreFormatted = item.score ? item.score.toFixed(1) : null;

  // Countdown helper for upcoming AniList releases
  const upcomingBadge = (() => {
    if (!showUpcomingDetails || !isAnime) return null;
    if (animeItem.nextAiringEpisode?.timeUntilAiring && animeItem.nextAiringEpisode.timeUntilAiring > 0) {
      const days = Math.ceil(animeItem.nextAiringEpisode.timeUntilAiring / 86400);
      return `Ep ${animeItem.nextAiringEpisode.episode} in ${days}d`;
    }
    return animeItem.airedString || (animeItem.year ? String(animeItem.year) : 'TBA');
  })();

  // Hindi verified summary helper
  const hindiStatus = animeItem.hindiDubStatus;
  const hindiPlatformsText =
    animeItem.hindiPlatforms && animeItem.hindiPlatforms.length > 0
      ? animeItem.hindiPlatforms.slice(0, 2).join(' · ')
      : undefined;

  const hindiTypeOrSeasonLabel = (() => {
    if (animeItem.format === 'Movie' || animeItem.hindiType === 'Movie') return 'Movie';
    if (animeItem.hindiSeason) {
      return animeItem.hindiPart
        ? `S${animeItem.hindiSeason} Pt ${animeItem.hindiPart}`
        : `Season ${animeItem.hindiSeason}`;
    }
    return animeItem.hindiType || animeItem.format || 'TV';
  })();

  const hindiEpisodeSummary = (() => {
    if (animeItem.format === 'Movie' || animeItem.hindiType === 'Movie') return '1 Film';
    if (animeItem.hindiVerifiedEpisodes != null && animeItem.episodes != null) {
      return `${animeItem.hindiVerifiedEpisodes}/${animeItem.episodes} eps`;
    }
    if (animeItem.hindiVerifiedEpisodes != null) {
      return `${animeItem.hindiVerifiedEpisodes} eps`;
    }
    if (animeItem.episodes != null) {
      return `${animeItem.episodes} eps`;
    }
    return null;
  })();

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group flex flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl transition-transform duration-200 hover:-translate-y-1 cursor-pointer"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800/80 shadow-md group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/10 transition-all duration-300">
        {!hasFailed && currentSrc ? (
          <img
            src={currentSrc}
            alt={displayTitle}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950/40 text-center">
            {isAnime ? (
              <Layers className="w-8 h-8 text-indigo-400 mb-2 opacity-60" />
            ) : (
              <BookOpen className="w-8 h-8 text-rose-400 mb-2 opacity-60" />
            )}
            <span className="text-xs font-medium text-slate-300 line-clamp-3">{displayTitle}</span>
          </div>
        )}

        {/* Audio Dub badges on Anime Poster with interactive Dub Details Modal click */}
        {isAnime && !showUpcomingDetails && (
          <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 z-20">
            {(() => {
              const audioData = getAnimeAudioAvailability(animeItem);
              const hiTrack = audioData.tracks.find((t) => t.languageCode === 'hi');
              const enTrack = audioData.tracks.find((t) => t.languageCode === 'en');

              return (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDubBadgeClick?.(animeItem, 'ja');
                    }}
                    className="px-1.5 py-0.5 rounded-md bg-red-950/90 backdrop-blur-xs text-[9px] font-mono font-bold text-red-200 border border-red-500/60 shadow-xs shadow-red-950/50 hover:scale-110 active:scale-95 transition-transform cursor-pointer pointer-events-auto"
                    title="Japanese Original Master Audio · Click for Audio Evidence"
                  >
                    JP
                  </button>

                  {hiTrack && hiTrack.verificationStatus === 'Verified' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDubBadgeClick?.(animeItem, 'hi');
                      }}
                      className="px-1.5 py-0.5 rounded-md bg-red-600/95 backdrop-blur-xs text-[9px] font-mono font-extrabold text-white border border-red-400/80 shadow-xs shadow-red-600/40 hover:scale-110 active:scale-95 transition-transform cursor-pointer pointer-events-auto flex items-center justify-center"
                      title={`Official Hindi Dub (${hiTrack.dubbedEpisodes}/${hiTrack.totalEpisodes} eps on ${hiTrack.provider}) · Click for Details`}
                    >
                      <span>HI</span>
                    </button>
                  )}

                  {hiTrack && hiTrack.verificationStatus === 'Unverified' && showHindiDetails && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDubBadgeClick?.(animeItem, 'hi');
                      }}
                      className="px-1.5 py-0.5 rounded-md bg-amber-900/90 backdrop-blur-xs text-[9px] font-mono font-bold text-amber-200 border border-amber-500/60 shadow-xs hover:scale-110 active:scale-95 transition-transform cursor-pointer pointer-events-auto"
                      title="Announced Hindi Dub · Click for Details"
                    >
                      HI SOON
                    </button>
                  )}

                  {enTrack && enTrack.verificationStatus === 'Verified' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDubBadgeClick?.(animeItem, 'en');
                      }}
                      className="px-1.5 py-0.5 rounded-md bg-rose-600/95 backdrop-blur-xs text-[9px] font-mono font-bold text-white border border-rose-400/80 shadow-xs shadow-rose-600/40 hover:scale-110 active:scale-95 transition-transform cursor-pointer pointer-events-auto flex items-center justify-center"
                      title={`Official English Dub (${enTrack.dubbedEpisodes}/${enTrack.totalEpisodes} eps) · Click for Details`}
                    >
                      <span>EN</span>
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Top-right indicator ONLY when viewing Hindi Section (Complete/Partial/Announced) or Upcoming Section */}
        {isAnime && showHindiDetails && hindiStatus && (
          <span
            className={`absolute top-2 right-2 px-1.5 py-0.5 rounded backdrop-blur-xs text-[9px] font-mono font-bold border pointer-events-none ${
              hindiStatus === 'Complete'
                ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/50'
                : hindiStatus === 'Partial'
                ? 'bg-amber-950/85 text-amber-300 border-amber-500/50'
                : 'bg-sky-950/85 text-sky-300 border-sky-500/50'
            }`}
          >
            {hindiStatus.toUpperCase()}
          </span>
        )}

        {isAnime && showUpcomingDetails && upcomingBadge && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-indigo-950/90 backdrop-blur-xs text-[10px] font-mono font-bold text-indigo-200 border border-indigo-500/50 pointer-events-none">
            {upcomingBadge}
          </span>
        )}

        {/* Gradient scrim for text legibility at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-90 group-hover:opacity-75 transition-opacity pointer-events-none" />

        {/* Hover Center Overlay Quick Action */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px] pointer-events-none">
          <span className="px-3 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            {isAnime ? <Layers className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
            <span>{isAnime ? 'View Details' : 'Read Manga'}</span>
          </span>
        </div>

        {/* Bottom subtle rating (clean poster corner) */}
        {scoreFormatted && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[11px] font-mono font-medium text-amber-300 pointer-events-none">
            <Star className="w-3 h-3 fill-amber-300 stroke-none" />
            {scoreFormatted}
          </div>
        )}
      </div>

      {/* Card Caption: Home Page stays ultra-clean (Title only); Hindi & Upcoming modes show contextual info */}
      <div className="mt-2.5 flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-slate-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">
          {displayTitle}
        </h3>

        {isAnime && showHindiDetails && (
          <div className="text-[11px] text-slate-400 leading-snug space-y-0.5">
            <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-300 truncate">
              <span>{hindiTypeOrSeasonLabel}</span>
              {hindiEpisodeSummary && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{hindiEpisodeSummary}</span>
                </>
              )}
            </div>
            {hindiPlatformsText && (
              <p className="text-[11px] text-amber-300/90 truncate">{hindiPlatformsText}</p>
            )}
          </div>
        )}

        {isAnime && showUpcomingDetails && (
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
            <span className="font-mono text-indigo-300">{animeItem.format || 'TV'}</span>
            {animeItem.studios && animeItem.studios.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{animeItem.studios[0]}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
