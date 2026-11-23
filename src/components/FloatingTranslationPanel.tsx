import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Pause,
  Play,
  Square,
  Minus,
  Maximize2,
  CheckCircle2,
  Clock,
  Gauge,
  BookOpen,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  mangaTranslationQueue,
  TranslationJob,
} from '../services/mangaTranslationService';

interface Props {
  onOpenReader?: (mangaId: string | number, chapterNumber: string) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return '< 1 min';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export const FloatingTranslationPanel: React.FC<Props> = ({ onOpenReader }) => {
  const [job, setJob] = useState<TranslationJob | null>(null);

  useEffect(() => {
    const unsubscribe = mangaTranslationQueue.subscribe((current) => {
      setJob(current);
    });
    return unsubscribe;
  }, []);

  if (!job) return null;

  const isCompleted = job.status === 'completed';
  const isPaused = job.status === 'paused' || job.status === 'stopped';
  const isRunning = job.status === 'running';

  // Minimized floating badge
  if (job.isMinimized) {
    return (
      <aside
        role="status"
        aria-label="Minimized translation progress"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-950/95 border border-indigo-500/70 shadow-2xl backdrop-blur-md text-white animate-in fade-in slide-in-from-bottom-3 duration-200"
      >
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          )}
          {isPaused && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          )}
          {isCompleted && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-100 truncate max-w-[140px] sm:max-w-[200px]">
            {job.mangaTitle} (Ch. {job.chapterNumber})
          </span>
          <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-500/40">
            {job.completedPages}/{job.totalPages} ({job.progressPercent}%)
          </span>
        </div>

        <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2">
          <button
            onClick={() => mangaTranslationQueue.toggleMinimize()}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Expand translation panel"
            aria-label="Expand translation panel"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {isRunning && (
            <button
              onClick={() => mangaTranslationQueue.pauseTranslation()}
              className="p-1 rounded-lg hover:bg-amber-950/60 text-amber-400 transition-colors cursor-pointer"
              title="Pause translation"
              aria-label="Pause translation"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => mangaTranslationQueue.resumeTranslation()}
              className="p-1 rounded-lg hover:bg-emerald-950/60 text-emerald-400 transition-colors cursor-pointer"
              title="Resume translation"
              aria-label="Resume translation"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside
      role="region"
      aria-label="Background Manga Translation Manager"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-[92vw] max-w-sm rounded-2xl bg-[#090d16]/95 border border-indigo-500/70 shadow-2xl backdrop-blur-xl p-4 text-white animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      {/* Header with Title and Control Buttons */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : isPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse'
                }`}
              >
                {isCompleted
                  ? 'TRANSLATION COMPLETED'
                  : isPaused
                  ? 'TRANSLATION PAUSED'
                  : 'TRANSLATING MANGA'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {job.targetLanguage}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-100 truncate mt-0.5" title={job.mangaTitle}>
              {job.mangaTitle} · Ch. {job.chapterNumber}
            </h4>
          </div>
        </div>

        {/* Header Action controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => mangaTranslationQueue.toggleMinimize()}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Minimize"
            aria-label="Minimize translation panel"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => mangaTranslationQueue.clearJob()}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Close"
            aria-label="Close translation panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Counter Section */}
      <div className="space-y-2.5 pt-3">
        {/* Progress Numbers */}
        <div className="flex items-baseline justify-between text-xs">
          <div>
            <span className="text-base font-black text-white font-mono">
              {job.completedPages}
            </span>
            <span className="text-slate-400 font-mono"> / {job.totalPages} Pages</span>
          </div>
          <div className="font-mono font-bold text-indigo-300 text-sm">
            {job.progressPercent}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500'
            }`}
            style={{ width: `${Math.max(2, job.progressPercent)}%` }}
          />
        </div>

        {/* Live Status Description */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>
            {isCompleted
              ? 'All pages saved successfully'
              : `Current: Page ${job.currentPage} Processing...`}
          </span>
          {!isCompleted && (
            <span>{job.remainingPages} remaining</span>
          )}
        </div>

        {/* Metrics Row: Speed & ETA */}
        {!isCompleted && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-800">
              <Gauge className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">
                {job.speedPagesPerMin > 0 ? `${job.speedPagesPerMin} pages/min` : 'Calibrating...'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                {job.estimatedSecondsRemaining > 0
                  ? `ETA: ${formatDuration(job.estimatedSecondsRemaining)}`
                  : 'ETA: calculating...'}
              </span>
            </div>
          </div>
        )}

        {/* Notice/Cooldown Banner */}
        {job.notice && (
          <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-600/40 text-[11px] text-amber-200 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{job.notice}</span>
          </div>
        )}

        {/* Control Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {isRunning && (
            <>
              <button
                onClick={() => mangaTranslationQueue.pauseTranslation()}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
              <button
                onClick={() => mangaTranslationQueue.stopTranslation()}
                className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                title="Stop background translation"
              >
                <Square className="w-3 h-3 fill-rose-300" />
                <span>STOP</span>
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                onClick={() => mangaTranslationQueue.resumeTranslation()}
                className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Resume Translation</span>
              </button>
              <button
                onClick={() => mangaTranslationQueue.clearJob()}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-semibold text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </>
          )}

          {isCompleted && (
            <>
              {onOpenReader && (
                <button
                  onClick={() => onOpenReader(job.mangaId, job.chapterNumber)}
                  className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Translated Manga</span>
                </button>
              )}
              <button
                onClick={() => mangaTranslationQueue.clearJob()}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-semibold text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
