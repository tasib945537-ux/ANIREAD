import React from 'react';
import { Sparkles, Star, ArrowRight, Layers } from 'lucide-react';
import { AnimeItem } from '../../types/anime';
import { getAnimeDubInfo } from '../../services/dubCatalog';

interface Props {
  anime: AnimeItem;
  onSelectAnime?: (animeId: number, seedItem?: AnimeItem) => void;
}

export const AnimeRecommendations: React.FC<Props> = ({ anime, onSelectAnime }) => {
  // Use real franchise relations + genre recommendations
  const relatedEntries = anime.relations?.flatMap((r) => r.entry).filter((e) => e.type === 'anime') || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/40 shadow-xl space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>Recommended Franchise Titles & Companions</span>
        </div>
        <p className="text-xs text-slate-300">
          Handpicked companion series and franchise sequels matching the world of <strong className="text-white">{anime.title}</strong>.
        </p>
      </div>

      {relatedEntries.length === 0 ? (
        <div className="p-10 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
          Explore similar titles by clicking any genre pill above (e.g. {anime.genres?.slice(0, 2).join(', ')}).
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {relatedEntries.map((rec, idx) => {
            const dubs = getAnimeDubInfo(rec.name);

            return (
              <div
                key={idx}
                className="group p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono font-bold text-rose-300 border border-rose-500/30">
                      JP
                    </span>
                    {dubs.hasHindiDub && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-600/90 text-[9px] font-mono font-bold text-white border border-amber-400/40">
                        HI
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-blue-600/80 text-[9px] font-mono font-bold text-white border border-blue-400/30">
                      EN
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {rec.name}
                  </h5>
                </div>

                {onSelectAnime && (
                  <button
                    onClick={() => {
                      onSelectAnime(rec.id, {
                        id: rec.id,
                        title: rec.name,
                        coverImage: rec.image || '',
                        format: 'TV',
                        status: 'Finished',
                        genres: anime.genres || [],
                        sourceApi: 'anilist',
                        synopsis: `Recommended companion for ${anime.title}.`,
                      } as any);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>View Companion Anime</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
