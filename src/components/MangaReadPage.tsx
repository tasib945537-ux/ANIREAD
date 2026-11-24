import React from 'react';
import { BookOpen, Clock3, Search, Languages, LibraryBig } from 'lucide-react';
import { MangaItem, ReadingProgress } from '../types/anime';
import { AnimeCard } from './AnimeCard';
import { AnimeLoadingState } from './AnimeLoadingState';

interface Props {
  mangaItems: MangaItem[];
  recentReading: ReadingProgress | null;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenManga: (manga: MangaItem) => void;
  onResume: (progress: ReadingProgress) => void;
  onExploreManga: () => void;
}

export const MangaReadPage: React.FC<Props> = ({
  mangaItems,
  recentReading,
  loading,
  searchQuery,
  onSearchChange,
  onOpenManga,
  onResume,
  onExploreManga,
}) => (
  <div className="min-h-screen bg-[#0b0f19] text-slate-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-9 space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-[#101827] p-5 sm:p-8">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              <BookOpen className="w-3.5 h-3.5" /> ANIREAD Manga Reader
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">Read Manga & Manhwa</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Browse MangaDex chapter releases, choose available scan languages, read online or offline,
              and use the built-in page translator when an English chapter is not available.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-lg border border-slate-700 bg-slate-950/50 px-2.5 py-1.5 text-slate-200">MangaDex chapters & pages</span>
              <span className="rounded-lg border border-slate-700 bg-slate-950/50 px-2.5 py-1.5 text-slate-200">Language options</span>
              <span className="rounded-lg border border-slate-700 bg-slate-950/50 px-2.5 py-1.5 text-slate-200">AI page translator</span>
              <span className="rounded-lg border border-slate-700 bg-slate-950/50 px-2.5 py-1.5 text-slate-200">Offline reading</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onExploreManga}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-500"
          >
            <LibraryBig className="w-4 h-4" /> Explore Manga Catalog
          </button>
        </div>
      </section>

      {recentReading && (
        <section className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
            <Clock3 className="w-4 h-4" /> Continue Reading
          </div>
          <div className="mt-3 flex items-center gap-3 sm:gap-4">
            <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              {recentReading.coverImage ? (
                <img src={recentReading.coverImage} alt={recentReading.mangaTitle} className="h-full w-full object-cover" loading="lazy" />
              ) : <BookOpen className="m-auto mt-6 h-6 w-6 text-slate-500" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm sm:text-base font-bold text-white">{recentReading.mangaTitle}</h2>
              <p className="mt-1 text-xs text-slate-400">Chapter {recentReading.lastChapterNumber} · Page {recentReading.lastPage}{recentReading.totalPages ? ` of ${recentReading.totalPages}` : ''}</p>
              <button type="button" onClick={() => onResume(recentReading)} className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500">
                Resume Reading
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Choose a Manga to Read</h2>
            <p className="mt-1 text-xs text-slate-400">Open a title to see its MangaDex chapters and language choices.</p>
          </div>
          <label className="relative block w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search manga or manhwa..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition focus:border-indigo-500"
            />
          </label>
        </div>

        {loading ? (
          <AnimeLoadingState message="Loading manga..." subMessage="Finding manga titles and MangaDex reading sources..." size="lg" characterTheme="chibi" />
        ) : mangaItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 py-12 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-slate-200">No manga found</p>
            <p className="mt-1 text-xs text-slate-400">Try another title or clear your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {mangaItems.map((manga, index) => (
              <AnimeCard key={`${manga.id}-read-${index}`} item={manga} type="manga" onClick={() => onOpenManga(manga)} />
            ))}
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
        <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Chapter availability depends on MangaDex scanlation uploads. The reader keeps each chapter's original scan language so the translator can process it into your selected target language.
      </p>
    </div>
  </div>
);
