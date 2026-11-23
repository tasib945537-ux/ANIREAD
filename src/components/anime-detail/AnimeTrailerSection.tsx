import React from 'react';
import { Film, Play, ExternalLink, AlertCircle } from 'lucide-react';
import { AnimeTrailer } from '../../types/anime';

interface Props {
  trailer?: AnimeTrailer;
  animeTitle: string;
}

export const AnimeTrailerSection: React.FC<Props> = ({ trailer, animeTitle }) => {
  const youtubeId = trailer?.youtubeId;

  if (!youtubeId) {
    return (
      <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-3">
        <Film className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="font-semibold text-slate-300">Official trailer not indexed for this entry.</p>
        <p className="text-slate-500">
          Search for official promotional teasers and trailers directly on YouTube.
        </p>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(animeTitle)}+official+trailer`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-red-950/30"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Search YouTube Trailers</span>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-bold text-white">
          <Film className="w-4 h-4 text-rose-500" />
          <span>Official Promotional Trailer (1080p Theater Mode)</span>
        </span>

        <a
          href={trailer.url || `https://www.youtube.com/watch?v=${youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
        >
          <span>Open on YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1`}
          title={`${animeTitle} Official Trailer`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};
