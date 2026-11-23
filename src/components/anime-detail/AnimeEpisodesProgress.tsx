import React, { useState, useEffect } from 'react';
import { Check, Plus, Minus, Star, Bookmark, Play, CheckCircle2, RotateCcw, ListFilter, Sparkles } from 'lucide-react';
import { AnimeItem } from '../../types/anime';
import {
  getWatchlistEntry,
  updateWatchlistEntry,
  incrementWatchedEpisode,
  removeWatchlistEntry,
  WatchStatus,
  WatchlistEntry,
} from '../../services/watchlistStorage';

interface Props {
  anime: AnimeItem;
  onWatchEpisode?: (epNumber: number) => void;
}

const STATUS_LABELS: Record<WatchStatus, { label: string; color: string; border: string }> = {
  watching: { label: 'Watching', color: 'bg-emerald-600 text-white', border: 'border-emerald-500' },
  plan_to_watch: { label: 'Plan to Watch', color: 'bg-indigo-600 text-white', border: 'border-indigo-500' },
  completed: { label: 'Completed', color: 'bg-purple-600 text-white', border: 'border-purple-500' },
  on_hold: { label: 'On Hold', color: 'bg-amber-600 text-white', border: 'border-amber-500' },
  dropped: { label: 'Dropped', color: 'bg-rose-700 text-white', border: 'border-rose-600' },
};

export const AnimeEpisodesProgress: React.FC<Props> = ({ anime }) => {
  const [entry, setEntry] = useState<WatchlistEntry | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const totalEpisodes = anime.episodes || 12;
  const watched = entry?.watchedEpisodes || 0;
  const progressPercent = Math.min(100, Math.round((watched / totalEpisodes) * 100));

  useEffect(() => {
    setEntry(getWatchlistEntry(anime.id));
  }, [anime.id]);

  const handleStatusChange = (status: WatchStatus) => {
    const updated = updateWatchlistEntry(anime, status, watched, entry?.userScore);
    setEntry(updated);
  };

  const handleIncrement = () => {
    const updated = incrementWatchedEpisode(anime);
    setEntry(updated);
  };

  const handleDecrement = () => {
    if (watched <= 0) return;
    const newWatched = watched - 1;
    const updated = updateWatchlistEntry(anime, entry?.status || 'watching', newWatched, entry?.userScore);
    setEntry(updated);
  };

  const handleSetWatched = (count: number) => {
    const newStatus: WatchStatus =
      count >= totalEpisodes && anime.episodes ? 'completed' : entry?.status || 'watching';
    const updated = updateWatchlistEntry(anime, newStatus, count, entry?.userScore);
    setEntry(updated);
  };

  const handleScoreChange = (score: number) => {
    const updated = updateWatchlistEntry(anime, entry?.status || 'plan_to_watch', watched, score);
    setEntry(updated);
  };

  const handleRemove = () => {
    removeWatchlistEntry(anime.id);
    setEntry(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Watchlist Status Selector & Personal Rating */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <span>Personal Watchlist & Tracker</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Keep track of your watched episodes and ratings. Progress saves automatically on this device.
            </p>
          </div>

          {entry && (
            <button
              onClick={handleRemove}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Progress</span>
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['watching', 'plan_to_watch', 'completed', 'on_hold', 'dropped'] as WatchStatus[]).map((st) => {
            const isSelected = entry?.status === st;
            const meta = STATUS_LABELS[st];
            return (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? `${meta.color} shadow-md`
                    : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/80'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Personal Star Rating (1 to 10) */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-medium">Your Rating:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
              const currentScore = hoverRating ?? entry?.userScore ?? 0;
              const isFilled = star <= currentScore;
              return (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => handleScoreChange(star)}
                  className="p-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                  title={`Rate ${star}/10`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
            <span className="ml-2 font-mono font-bold text-amber-300 min-w-8">
              {entry?.userScore ? `${entry.userScore}/10` : 'Not Rated'}
            </span>
          </div>
        </div>
      </div>

      {/* Episode Progress Bar & Counters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Episodes Watched</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              {watched} of {totalEpisodes} episodes completed ({progressPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrement}
              disabled={watched <= 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
              title="Decrement episode"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-white px-2 text-sm">{watched}</span>
            <button
              onClick={handleIncrement}
              disabled={watched >= totalEpisodes}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
              title="Add watched episode"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSetWatched(totalEpisodes)}
              className="px-2.5 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold ml-2 transition-colors cursor-pointer"
            >
              All
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Interactive Episode Grid */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Episode Quick Log (Tap to set current):
          </span>
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5 max-h-56 overflow-y-auto p-1 rounded-xl bg-slate-950/60 border border-slate-800/80">
            {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((ep) => {
              const isWatched = ep <= watched;
              const isCurrent = ep === watched;
              return (
                <button
                  key={ep}
                  onClick={() => handleSetWatched(ep)}
                  className={`py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isWatched
                      ? isCurrent
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50'
                        : 'bg-indigo-600/70 text-indigo-100 hover:bg-indigo-600'
                      : 'bg-slate-800/60 hover:bg-slate-750 text-slate-400 border border-slate-800'
                  }`}
                  title={`Episode ${ep} ${isWatched ? '(Watched)' : ''}`}
                >
                  <span>{ep}</span>
                  {isWatched && <Check className="w-2.5 h-2.5 mt-0.5 text-white/90" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
