import React, { useState } from 'react';
import {
  GitBranch,
  BookOpen,
  Film,
  ArrowRight,
  Layers,
  Star,
  ExternalLink,
  Tv,
  Volume2,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import { AnimeItem, AnimeRelation } from '../../types/anime';
import { getAnimeDubInfo } from '../../services/dubCatalog';

interface Props {
  anime: AnimeItem;
  onSelectAnime?: (animeId: number, seedItem?: AnimeItem) => void;
  onReadManga?: (queryTitle: string) => void;
  onCloseModal?: () => void;
}

export const AnimeFranchiseUniverse: React.FC<Props> = ({
  anime,
  onSelectAnime,
  onReadManga,
  onCloseModal,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'seasons' | 'movies' | 'side' | 'manga'>('all');
  const [searchRelQuery, setSearchRelQuery] = useState('');

  const relations = anime.relations || [];

  const sequels = relations.filter((r) => r.relation.toLowerCase().includes('sequel'));
  const prequels = relations.filter(
    (r) => r.relation.toLowerCase().includes('prequel') || r.relation.toLowerCase().includes('parent')
  );
  const sideStories = relations.filter(
    (r) =>
      r.relation.toLowerCase().includes('side') ||
      r.relation.toLowerCase().includes('spin') ||
      r.relation.toLowerCase().includes('alternative') ||
      r.relation.toLowerCase().includes('summary')
  );
  const adaptations = relations.filter(
    (r) => r.relation.toLowerCase().includes('adaptation') || r.entry.some((e) => e.type === 'manga')
  );
  const moviesAndOvas = relations.filter(
    (r) =>
      r.relation.toLowerCase().includes('movie') ||
      r.relation.toLowerCase().includes('ova') ||
      r.relation.toLowerCase().includes('special')
  );

  // Grouped chronological seasons list
  const chronologicalSeasons = relations.filter((r) => {
    const rel = r.relation.toLowerCase();
    return rel.includes('prequel') || rel.includes('sequel') || rel.includes('parent') || rel.includes('full story');
  });

  const filteredRelations = relations.filter((r) => {
    const rel = r.relation.toLowerCase();
    if (filterCategory === 'seasons') {
      if (!rel.includes('prequel') && !rel.includes('sequel') && !rel.includes('parent') && !rel.includes('full story')) return false;
    } else if (filterCategory === 'movies') {
      if (!rel.includes('movie') && !rel.includes('ova') && !rel.includes('special')) return false;
    } else if (filterCategory === 'side') {
      if (!rel.includes('side') && !rel.includes('spin') && !rel.includes('alternative') && !rel.includes('summary')) return false;
    } else if (filterCategory === 'manga') {
      if (!rel.includes('adaptation') && !r.entry.some((e) => e.type === 'manga')) return false;
    }

    if (searchRelQuery.trim()) {
      const q = searchRelQuery.toLowerCase().trim();
      return (
        r.relation.toLowerCase().includes(q) ||
        r.entry.some((e) => e.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Franchise Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-800/50 space-y-2 shadow-xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold uppercase tracking-wider">
            <GitBranch className="w-4 h-4" />
            <span>Upgraded Franchise Universe & Chronological Seasons</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-950 border border-indigo-800 text-indigo-300">
            {relations.length} Related Media
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Explore the complete narrative timeline for <strong className="text-white">{anime.title}</strong>. Follow consecutive anime seasons, prequels, sequels, canon spin-offs, and original manga arcs with real-time dub availability. Tap any season to switch directly.
        </p>
      </div>

      {/* Quick Chronology Switcher (Prequel vs Sequel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Prequel Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3 shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              ← Previous Storyline / Prequel
            </span>
            {prequels.length > 0 ? (
              <>
                <h5 className="text-sm font-bold text-white line-clamp-2">
                  {prequels[0].entry[0]?.name}
                </h5>
                <p className="text-[11px] text-slate-400">
                  {prequels[0].relation} · Leads directly into current season
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">First chronological entry or standalone start.</p>
            )}
          </div>

          {prequels.length > 0 && prequels[0].entry[0]?.type === 'anime' && onSelectAnime && (
            <button
              onClick={() => {
                const p = prequels[0].entry[0];
                onSelectAnime(p.id, {
                  id: p.id,
                  title: p.name,
                  coverImage: p.image || anime.coverImage || '',
                  format: 'TV',
                  status: 'Finished',
                  genres: anime.genres || [],
                  sourceApi: 'anilist',
                  synopsis: `Chronological prequel to ${anime.title}.`,
                } as any);
              }}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <span>← Switch to Prequel Season</span>
            </button>
          )}
        </div>

        {/* Sequel Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3 shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Next Season / Sequel →
            </span>
            {sequels.length > 0 ? (
              <>
                <h5 className="text-sm font-bold text-white line-clamp-2">
                  {sequels[0].entry[0]?.name}
                </h5>
                <p className="text-[11px] text-slate-400">
                  {sequels[0].relation} · Continues the main storyline
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">Latest broadcast season or concluding arc.</p>
            )}
          </div>

          {sequels.length > 0 && sequels[0].entry[0]?.type === 'anime' && onSelectAnime && (
            <button
              onClick={() => {
                const s = sequels[0].entry[0];
                onSelectAnime(s.id, {
                  id: s.id,
                  title: s.name,
                  coverImage: s.image || anime.coverImage || '',
                  format: 'TV',
                  status: 'Finished',
                  genres: anime.genres || [],
                  sourceApi: 'anilist',
                  synopsis: `Chronological sequel to ${anime.title}.`,
                } as any);
              }}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Switch to Next Season →</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search for Related Universe */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: `All Related (${relations.length})` },
              { id: 'seasons', label: `Seasons & Sequels (${chronologicalSeasons.length})` },
              { id: 'movies', label: `Movies & OVAs (${moviesAndOvas.length})` },
              { id: 'side', label: `Spin-Offs (${sideStories.length})` },
              { id: 'manga', label: `Manga & Source (${adaptations.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                  filterCategory === tab.id
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchRelQuery}
              onChange={(e) => setSearchRelQuery(e.target.value)}
              placeholder="Search related seasons..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Complete Relations Grid */}
      <div className="space-y-3">
        {filteredRelations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            {relations.length === 0
              ? 'Standalone anime series with no registered franchise relations.'
              : 'No related seasons or adaptations matched your search filter.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredRelations.map((rel, idx) => {
              const firstEntry = rel.entry[0];
              const isAnime = firstEntry?.type === 'anime';
              const isManga = firstEntry?.type === 'manga';

              // Infer dub highlights for known franchise titles
              const entryDubInfo = isAnime ? getAnimeDubInfo(firstEntry?.name || '') : null;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-3 shadow-md group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/50">
                            {rel.relation}
                          </span>
                          {entryDubInfo?.hasHindiDub && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-600/30 text-amber-200 font-mono text-[9px] font-bold border border-amber-500/30">
                              HI DUB
                            </span>
                          )}
                          {entryDubInfo?.hasEnglishDub && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-600/30 text-blue-200 font-mono text-[9px] font-bold border border-blue-500/30">
                              EN DUB
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-white line-clamp-2 group-hover:text-indigo-300 transition-colors">
                          {firstEntry?.name}
                        </h5>
                      </div>

                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                        {firstEntry?.type || 'Media'}
                      </span>
                    </div>

                    {isAnime && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <Tv className="w-3 h-3 text-slate-500" />
                        <span>Official broadcast release in {rel.relation.toLowerCase()} arc</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      ID: #{firstEntry?.id}
                    </span>

                    <div className="flex items-center gap-2">
                      {isAnime && onSelectAnime && (
                        <button
                          onClick={() => {
                            onSelectAnime(firstEntry.id, {
                              id: firstEntry.id,
                              title: firstEntry.name,
                              coverImage: firstEntry.image || anime.coverImage || '',
                              format: 'TV',
                              status: 'Finished',
                              genres: anime.genres || [],
                              sourceApi: 'anilist',
                              synopsis: `${rel.relation} season of ${anime.title}.`,
                            } as any);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <span>Explore Season</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isManga && onReadManga && (
                        <button
                          onClick={() => {
                            onReadManga(firstEntry.name);
                            onCloseModal?.();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Read Manga</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
