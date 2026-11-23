import React from 'react';
import { BookOpen, ExternalLink, ArrowRight, Layers, Star } from 'lucide-react';
import { AnimeItem } from '../../types/anime';

interface Props {
  anime: AnimeItem;
  onReadManga?: (queryTitle: string) => void;
  onCloseModal?: () => void;
}

export const AnimeMangaRelated: React.FC<Props> = ({ anime, onReadManga, onCloseModal }) => {
  const isDarling =
    anime.title.toLowerCase().includes('darling in the franxx') ||
    anime.englishTitle?.toLowerCase().includes('darling in the franxx') ||
    anime.id === 99423 ||
    anime.id === 100937;

  const isAssassination =
    anime.title.toLowerCase().includes('assassination classroom') ||
    anime.englishTitle?.toLowerCase().includes('assassination classroom') ||
    anime.title.toLowerCase().includes('ansatsu kyoushitsu') ||
    anime.id === 20605 ||
    anime.id === 20755;

  const rawMangaRelations = (anime.relations || []).filter(
    (r) =>
      r.relation?.toLowerCase().includes('adaptation') ||
      r.relation?.toLowerCase().includes('source') ||
      r.relation?.toLowerCase().includes('manga') ||
      r.relation?.toLowerCase().includes('spin') ||
      r.relation?.toLowerCase().includes('side') ||
      r.relation?.toLowerCase().includes('other') ||
      r.entry.some((e) => e.type?.toLowerCase() === 'manga')
  );

  // Curated franchise editions for top series to ensure 100% coverage
  const franchiseEditions = isDarling
    ? [
        {
          title: 'DARLING in the FRANXX',
          author: 'Kentaro Yabuki & Code:000',
          relation: 'Official Manga Serialization',
          chapters: '60 Chapters (Complete)',
          format: 'Manga (Shonen Jump+)',
          id: 100937,
        },
        {
          title: 'DARLING in the FRANXX! (4-Koma Spinoff)',
          author: 'Mato & Code:000',
          relation: 'Official Comedy Spinoff',
          chapters: '73 Chapters (Complete)',
          format: '4-Koma Comedy Manga',
          id: 101037,
        },
      ]
    : isAssassination
    ? [
        {
          title: 'Assassination Classroom',
          author: 'Yusei Matsui',
          relation: 'Original Manga Serialization',
          chapters: '180 Chapters (Complete)',
          format: 'Weekly Shonen Jump',
          id: 69883,
        },
        {
          title: 'Koro-sensei Q!',
          author: 'Kizuku Watanabe & Jo Aoto',
          relation: 'Official Fantasy Chibi Spinoff',
          chapters: '25 Chapters (Complete)',
          format: 'Saikyo Jump',
          id: 86551,
        },
      ]
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border border-purple-800/40 shadow-xl space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Original Manga, Light Novel & Adaptations</span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
            MangaDex & ANIREAD Full Reader Integrated
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Read all official manga serializations and published spin-offs for <strong className="text-white">{anime.title}</strong> directly inside ANIREAD with our Google Lens OCR translator, chapter download, and offline reader.
        </p>
      </div>

      {/* Main Manga Reader Launch Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-700/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-indigo-500/30 shadow-md">
            <img
              src={anime.coverImage}
              alt={anime.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
              Primary Franchise Reading
            </span>
            <h4 className="text-sm font-bold text-white">{anime.title} (Official Manga)</h4>
            <p className="text-xs text-slate-400">
              Source Material: {anime.source || 'Manga'} · Read all released chapters in English, Bengali, or Hindi.
            </p>
          </div>
        </div>

        {onReadManga && (
          <button
            onClick={() => {
              onReadManga(anime.title);
              onCloseModal?.();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/30 transition-all cursor-pointer shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            <span>Launch Manga Reader</span>
          </button>
        )}
      </div>

      {/* Franchise Editions & Spinoffs */}
      {franchiseEditions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Verified Franchise Manga Series ({franchiseEditions.length})</span>
            <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-[10px] text-indigo-300 font-mono">
              ALL EDITIONS READY
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {franchiseEditions.map((ed, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between gap-3 transition-colors shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      {ed.relation}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                      {ed.chapters}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-white line-clamp-1">{ed.title}</h5>
                  <p className="text-[11px] text-slate-400">{ed.author} · {ed.format}</p>
                </div>

                {onReadManga && (
                  <button
                    onClick={() => {
                      onReadManga(ed.title);
                      onCloseModal?.();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read {ed.title}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Adaptations List from AniList */}
      {rawMangaRelations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            All Manga & Light Novel Relations ({rawMangaRelations.length}):
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rawMangaRelations.map((rel, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                    {rel.relation}
                  </span>
                  <h5 className="text-xs font-bold text-white line-clamp-1">{rel.entry[0]?.name}</h5>
                </div>

                {onReadManga && (
                  <button
                    onClick={() => {
                      onReadManga(rel.entry[0]?.name || anime.title);
                      onCloseModal?.();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Read</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
