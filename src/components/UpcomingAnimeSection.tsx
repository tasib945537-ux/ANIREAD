import React, { useState, useEffect } from 'react';
import { Calendar, Search, X, Sparkles, Compass, ExternalLink } from 'lucide-react';
import { AnimeItem } from '../types/anime';
import { getUpcomingAniListAnime } from '../services/api';
import { FormatFilterType } from '../services/animeExplorerService';
import { AnimeCard } from './AnimeCard';
import { AnimeLoadingState } from './AnimeLoadingState';
import { PaginationWithJump } from './PaginationWithJump';

interface Props {
  onSelectAnime: (anime: AnimeItem) => void;
}

const SEASON_PRESETS: Array<{
  id: string;
  label: string;
  season: 'ALL' | 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  year?: number;
}> = [
  { id: 'all', label: 'All Upcoming', season: 'ALL' },
  { id: 'winter_2027', label: 'Winter 2027', season: 'WINTER', year: 2027 },
  { id: 'spring_2027', label: 'Spring 2027', season: 'SPRING', year: 2027 },
  { id: 'summer_2027', label: 'Summer 2027', season: 'SUMMER', year: 2027 },
  { id: 'fall_2027', label: 'Fall 2027', season: 'FALL', year: 2027 },
  { id: 'winter_2028', label: 'Winter 2028', season: 'WINTER', year: 2028 },
];

const UPCOMING_GENRES = [
  'All',
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Supernatural',
];

const FORMAT_OPTIONS: Array<{ id: FormatFilterType; label: string }> = [
  { id: 'all', label: 'All Formats' },
  { id: 'TV', label: 'TV Series' },
  { id: 'Movie', label: 'Movies' },
  { id: 'OVA_ONA', label: 'OVA / ONA' },
  { id: 'Special', label: 'Special' },
];

export const UpcomingAnimeSection: React.FC<Props> = ({ onSelectAnime }) => {
  const [search, setSearch] = useState('');
  const [seasonPresetId, setSeasonPresetId] = useState('all');
  const [format, setFormat] = useState<FormatFilterType>('all');
  const [genre, setGenre] = useState('All');
  const [sort, setSort] = useState<'POPULARITY_DESC' | 'START_DATE' | 'FAVOURITES_DESC' | 'TRENDING_DESC'>('POPULARITY_DESC');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AnimeItem[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalItems, setTotalItems] = useState<number | undefined>(undefined);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const activePreset = SEASON_PRESETS.find((s) => s.id === seasonPresetId) || SEASON_PRESETS[0];

  useEffect(() => {
    let active = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      const res = await getUpcomingAniListAnime({
        page,
        perPage: 15,
        season: activePreset.season,
        seasonYear: activePreset.year,
        format,
        genre,
        search,
        sort,
      });
      if (active) {
        setItems(res.items);
        setHasNextPage(res.hasNextPage);
        setTotalItems(res.total);
        setTotalPages(res.totalPages);
        setLoading(false);
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [page, activePreset.season, activePreset.year, format, genre, search, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-400" />
            <span>Upcoming Anime on AniList</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Live upcoming seasons, premieres, theatrical films, and OVAs synced from AniList.com (`NOT_YET_RELEASED`) with offline catalog fallback.
          </p>
        </div>

        <a
          href="https://anilist.co/search/anime?airing%20status=NOT_YET_RELEASED"
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>AniList Upcoming Source</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search upcoming anime titles..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Clear upcoming search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as FormatFilterType);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
            >
              {FORMAT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
            >
              <option value="POPULARITY_DESC">Most Anticipated</option>
              <option value="START_DATE">Soonest Release Date</option>
              <option value="FAVOURITES_DESC">Most Favorited</option>
              <option value="TRENDING_DESC">Trending</option>
            </select>
          </div>
        </div>

        {/* Season Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Season:</span>
          </span>
          {SEASON_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setSeasonPresetId(preset.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-colors cursor-pointer ${
                seasonPresetId === preset.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Genre Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {UPCOMING_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGenre(g);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                genre === g
                  ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div id="upcoming-grid-top" className="scroll-mt-24" />

      {/* Results Grid */}
      {loading ? (
        <AnimeLoadingState
          message="Loading Upcoming Schedule..."
          subMessage="Fetching live upcoming anime & release countdowns from AniList..."
          size="lg"
          characterTheme="monarch"
        />
      ) : items.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
          <Compass className="w-10 h-10 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No upcoming anime found for these filters</p>
          <p className="text-xs text-slate-400">Try switching back to All Upcoming seasons or clearing search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {items.map((item, idx) => (
            <AnimeCard
              key={`${item.id}-upcoming-${idx}`}
              item={item}
              type="anime"
              showUpcomingDetails={true}
              onClick={() => onSelectAnime(item)}
            />
          ))}
        </div>
      )}

      {!loading && (
        <PaginationWithJump
          currentPage={page}
          hasNextPage={hasNextPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(p) => setPage(p)}
          targetScrollId="upcoming-grid-top"
          itemName="upcoming anime"
        />
      )}
    </div>
  );
};
