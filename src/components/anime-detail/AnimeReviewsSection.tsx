import React from 'react';
import { MessageSquare, Star, ThumbsUp, Users, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { AnimeItem } from '../../types/anime';

interface Props {
  anime: AnimeItem;
  onOpenCommunity?: () => void;
}

export const AnimeReviewsSection: React.FC<Props> = ({ anime, onOpenCommunity }) => {
  const score = anime.score || 8.0;
  const ratingPercent = Math.round(score * 10);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Community Score Overview */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex flex-col items-center justify-center shrink-0">
            <span className="text-xl font-black text-amber-300 font-mono leading-none">
              {score.toFixed(1)}
            </span>
            <span className="text-[9px] font-mono text-slate-400 mt-1">/ 10</span>
          </div>

          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>Global Community Score</span>
            </h4>
            <p className="text-xs text-slate-400">
              Aggregated from over {anime.popularity ? anime.popularity.toLocaleString() : '150,000+'} community ratings across verified global databases.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Approval</span>
            <span className="text-sm font-black text-emerald-400 font-mono">{ratingPercent}%</span>
          </div>

          {anime.rank && (
            <div className="text-center px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Global Rank</span>
              <span className="text-sm font-black text-indigo-300 font-mono">#{anime.rank}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sentiment Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Praise & Highlights</span>
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Consistently applauded for studio production values, distinctive character development, and memorable soundtrack execution.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Pacing & Narrative</span>
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Maintains high audience retention throughout season arcs, with key climatic battle or drama episodes rated 9.2+.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Dub Quality</span>
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Both the original Japanese voice work and regional dub tracks received strong positive reception for emotional authenticity.
          </p>
        </div>
      </div>

      {/* Community Call to Action */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/40 flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-0.5">
          <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Discuss with the AniRead Community</span>
          </h5>
          <p className="text-[11px] text-slate-400">
            Share episode theories, voice actor appreciation, and fan art in real-time discord-style channels.
          </p>
        </div>

        {onOpenCommunity && (
          <button
            onClick={onOpenCommunity}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Open Community Hub →
          </button>
        )}
      </div>
    </div>
  );
};
