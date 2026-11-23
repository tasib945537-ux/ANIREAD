import { AnimeItem } from '../types/anime';
import { EXPANDED_HINDI_ANIME_CATALOG } from './verifiedHindiAnimeCatalogExpanded';
import { AUTHENTIC_SUB_ONLY_ANIME, AUTHENTIC_BANGLA_ANIME } from './catalogSubtitlesAndBangla';
import {
  ALL_NORMALIZED_DUB_DATABASE,
  convertNormalizedToVerifiedDub,
} from './dub-database/index';
import { getAnimeDubInfo } from './dubCatalog';
import { getAnimeAudioAvailability } from './dubVerificationStorage';
import { getActiveHindiCatalog } from './hindiRegistry';

export type AudioDubFilterType =
  | 'all'
  | 'hindi_only'
  | 'hindi_complete'
  | 'hindi_partial'
  | 'hindi_announced'
  | 'english_only'
  | 'japanese_original'
  | 'bangla_only'
  | 'multi_audio'
  | 'hindi_english'
  | 'subtitles_only'
  | 'partially_dubbed'
  | 'no_confirmed_dub'
  | 'recently_updated'
  | 'any_dubbed';

export type PlatformFilterType =
  | 'all'
  | 'crunchyroll'
  | 'netflix'
  | 'prime'
  | 'anime_times'
  | 'muse'
  | 'apple'
  | 'jiocinema'
  | 'other'
  | 'unknown';

export type FormatFilterType = 'all' | 'TV' | 'Movie' | 'OVA_ONA' | 'Special';

export type SortFilterType =
  | 'popularity'
  | 'score'
  | 'updated'
  | 'newest'
  | 'oldest'
  | 'title_asc'
  | 'title_desc';

export interface AnimeExplorerQuery {
  searchQuery?: string;
  page?: number;
  perPage?: number;
  genre?: string;
  status?: string;
  formatFilter?: FormatFilterType;
  sort?: SortFilterType;
  audioFilter?: AudioDubFilterType;
  platformFilter?: PlatformFilterType;
}

export interface AnimeExplorerResult {
  items: AnimeItem[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const normalizeKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function buildMasterCatalog(): AnimeItem[] {
  const map = new Map<string, AnimeItem>();
  const seenRuntimeIds = new Set<number | string>();

  // 1. Rebuilt Official Hindi Dubbed Anime Catalog (seasons, movies, OVAs, ONAs kept distinct by key+type)
  const hindiCatalog = getActiveHindiCatalog();
  for (const item of hindiCatalog) {
    const distinctKey = `${normalizeKey(item.title)}__${item.format || 'TV'}__${item.hindiSeason ?? '0'}__${item.hindiPart ?? ''}`;
    map.set(distinctKey, { ...item });
    if (item.id != null) seenRuntimeIds.add(item.id);
  }

  // 1b. Expanded legacy array (intentionally cleared after rebuild)
  for (const item of EXPANDED_HINDI_ANIME_CATALOG) {
    const key = normalizeKey(item.title);
    if (!map.has(key)) {
      map.set(key, { ...item });
    }
  }

  // 1c. Official Muse India Bangla dubbed titles
  for (const item of AUTHENTIC_BANGLA_ANIME) {
    const key = normalizeKey(item.title);
    const existingHindi = Array.from(map.values()).find((m) => normalizeKey(m.title) === key);
    if (existingHindi) {
      existingHindi.audioLanguages = Array.from(
        new Set([...(existingHindi.audioLanguages || []), 'Bengali Audio (বাংলা)'])
      );
      if (!existingHindi.watchLinks?.some((w) => w.name.includes('Muse India'))) {
        existingHindi.watchLinks = [...(existingHindi.watchLinks || []), ...(item.watchLinks || [])];
      }
    } else {
      map.set(`bn__${key}`, { ...item });
    }
  }

  // 1d. Authentic Subtitles-Only / Japanese Original titles
  for (const item of AUTHENTIC_SUB_ONLY_ANIME) {
    const key = normalizeKey(item.title);
    const alreadyPresent = Array.from(map.values()).some((m) => normalizeKey(m.title) === key);
    if (!alreadyPresent) {
      map.set(`sub__${key}`, { ...item });
    }
  }

  // 2. Legacy normalized English/Japanese/global batch entries (Hindi stripped in index.ts)
  for (const rec of ALL_NORMALIZED_DUB_DATABASE) {
    const key = normalizeKey(rec.title);
    const baseTitle = rec.title.replace(/[\s—–:-]+(Season|\bS\b|\bPart\b|\bCour\b).*/i, '').trim();
    const baseKey = normalizeKey(baseTitle);
    const alreadyPresent = Array.from(map.values()).some(
      (m) => normalizeKey(m.title) === key || (baseKey && normalizeKey(m.title) === baseKey)
    );
    if (alreadyPresent) continue;

    const verified = convertNormalizedToVerifiedDub(rec);
    const charCodeSum = rec.animeId.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
    const stableId = Math.abs(charCodeSum) || 850000;
    if (seenRuntimeIds.has(stableId)) continue;

    const totalEpisodes =
      rec.franchiseTotalEpisodes ||
      rec.seasons.reduce((acc, s) => acc + (s.episodeCount || 0), 0) ||
      12;
    const allStudios = Array.from(new Set(rec.seasons.flatMap((s) => s.languages.flatMap((l) => l.studios || []))));

    const item: AnimeItem = {
      id: stableId,
      title: rec.title,
      englishTitle: rec.englishTitle,
      nativeTitle: rec.nativeTitle,
      coverImage: `/api/anime-cover?title=${encodeURIComponent(rec.title)}`,
      bannerImage: `/api/anime-cover?title=${encodeURIComponent(rec.title)}`,
      format: 'TV',
      status: 'Finished Airing',
      episodes: totalEpisodes,
      year: 2022,
      score: 8.2,
      popularity: 120000,
      genres: ['Action', 'Fantasy'],
      studios: allStudios.length > 0 ? allStudios : ['Official Animation Studio'],
      synopsis: `${rec.title} — Official multi-language licensed anime release.`,
      sourceApi: 'anilist',
      audioLanguages: verified.languages.map((l) => `${l.language} Audio`),
      subtitles: ['English', 'Hindi', 'Bengali'],
      watchLinks: [
        {
          name: 'Crunchyroll',
          url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(rec.title)}`,
          badge: 'Official Multi-Audio Stream',
          iconType: 'crunchyroll',
          isOfficial: true,
          audioTracks: verified.languages.map((l) => l.language),
          subtitles: ['English', 'Hindi', 'Bengali'],
          region: 'Global',
        },
      ],
    };

    map.set(`norm__${key}`, item);
    seenRuntimeIds.add(stableId);
  }

  return Array.from(map.values());
}

/**
 * Filter an AnimeItem by audioDubFilter with strict verification
 */
export function matchesAudioFilter(anime: AnimeItem, filter: AudioDubFilterType): boolean {
  if (filter === 'all') return true;

  // Direct fast-path for rebuilt structured Hindi statuses
  if (filter === 'hindi_complete') {
    if (anime.hindiDubStatus) return anime.hindiDubStatus === 'Complete';
    const audioData = getAnimeAudioAvailability(anime);
    const hiTrack = audioData.tracks.find((t) => t.languageCode === 'hi');
    return Boolean(hiTrack && hiTrack.verificationStatus === 'Verified' && !hiTrack.isPartiallyDubbed);
  }

  if (filter === 'hindi_partial') {
    if (anime.hindiDubStatus) return anime.hindiDubStatus === 'Partial';
    const audioData = getAnimeAudioAvailability(anime);
    const hiTrack = audioData.tracks.find((t) => t.languageCode === 'hi');
    return Boolean(hiTrack && hiTrack.verificationStatus === 'Verified' && hiTrack.isPartiallyDubbed);
  }

  if (filter === 'hindi_announced') {
    if (anime.hindiDubStatus) return anime.hindiDubStatus === 'Announced';
    const audioData = getAnimeAudioAvailability(anime);
    const hiTrack = audioData.tracks.find((t) => t.languageCode === 'hi');
    return Boolean(hiTrack && hiTrack.verificationStatus === 'Unverified');
  }

  if (filter === 'hindi_only') {
    if (anime.hindiDubStatus) {
      return anime.hindiDubStatus === 'Complete' || anime.hindiDubStatus === 'Partial';
    }
    const audioData = getAnimeAudioAvailability(anime);
    const hiTrack = audioData.tracks.find((t) => t.languageCode === 'hi');
    return Boolean(hiTrack && hiTrack.verificationStatus === 'Verified' && hiTrack.dubbedEpisodes > 0);
  }

  const audioData = getAnimeAudioAvailability(anime);
  const hiTrack = audioData.tracks.find((t) => t.languageCode === 'hi');
  const enTrack = audioData.tracks.find((t) => t.languageCode === 'en');
  const bnTrack = audioData.tracks.find((t) => t.languageCode === 'bn');

  const hasVerifiedHindi = Boolean(hiTrack && hiTrack.verificationStatus === 'Verified' && hiTrack.dubbedEpisodes > 0);
  const hasVerifiedEnglish = Boolean(enTrack && enTrack.verificationStatus === 'Verified' && enTrack.dubbedEpisodes > 0);
  const hasVerifiedBangla = Boolean(bnTrack && bnTrack.verificationStatus === 'Verified' && bnTrack.dubbedEpisodes > 0);

  switch (filter) {
    case 'english_only':
      return hasVerifiedEnglish;
    case 'japanese_original':
      return true;
    case 'bangla_only':
      return hasVerifiedBangla;
    case 'multi_audio': {
      const verifiedDubCount = audioData.tracks.filter(
        (t) => t.audioType === 'dub' && t.verificationStatus === 'Verified' && t.dubbedEpisodes > 0
      ).length;
      return verifiedDubCount >= 2;
    }
    case 'hindi_english':
      return hasVerifiedHindi && hasVerifiedEnglish;
    case 'subtitles_only':
      return !hasVerifiedHindi && !hasVerifiedEnglish && !hasVerifiedBangla;
    case 'partially_dubbed':
      if (anime.hindiDubStatus === 'Partial') return true;
      return audioData.tracks.some(
        (t) =>
          t.audioType === 'dub' &&
          (t.isPartiallyDubbed ||
            (t.verificationStatus === 'Verified' && t.dubbedEpisodes < t.totalEpisodes && t.dubbedEpisodes > 0))
      );
    case 'no_confirmed_dub':
      return !hasVerifiedHindi && !hasVerifiedEnglish && !hasVerifiedBangla;
    case 'recently_updated': {
      const isAiring = (anime.status || '').toLowerCase().includes('airing') || anime.status === 'Releasing';
      return isAiring || Boolean(anime.year && anime.year >= 2024);
    }
    case 'any_dubbed':
      return hasVerifiedHindi || hasVerifiedEnglish || hasVerifiedBangla;
    default:
      return true;
  }
}

/**
 * Filter an AnimeItem by platform with verified official Indian & global distributor matching
 */
export function matchesPlatformFilter(anime: AnimeItem, platform: PlatformFilterType): boolean {
  if (platform === 'all') return true;

  const pKey = platform.toLowerCase();
  const matchPlatformString = (plRaw: string): boolean => {
    const pl = (plRaw || '').toLowerCase();
    if (pKey === 'crunchyroll') return pl.includes('crunchyroll');
    if (pKey === 'netflix') return pl.includes('netflix');
    if (pKey === 'prime') return pl.includes('amazon prime video') || pl.includes('prime video') || pl.includes('amazon');
    if (pKey === 'anime_times') return pl.includes('anime times');
    if (pKey === 'muse') return pl.includes('muse');
    if (pKey === 'apple') return pl.includes('apple');
    if (pKey === 'jiocinema') return pl.includes('jiocinema') || pl.includes('jiohotstar') || pl.includes('hotstar') || pl.includes('disney');
    if (pKey === 'other') {
      return (
        pl.includes('jiohotstar') ||
        pl.includes('jiocinema') ||
        pl.includes('hotstar') ||
        pl.includes('sony yay') ||
        pl.includes('sonyliv') ||
        pl.includes('hungama') ||
        pl.includes('disney') ||
        pl.includes('marvel hq') ||
        pl.includes('cartoon network') ||
        pl.includes('nickelodeon') ||
        pl.includes('sonic') ||
        pl.includes('etv bal') ||
        pl.includes('zee5') ||
        pl.includes('zee café') ||
        pl.includes('mx player') ||
        pl.includes('pvr') ||
        pl.includes('bilibili') ||
        pl.includes('hidive') ||
        pl.includes('ani-one')
      );
    }
    return pl.includes(pKey);
  };

  if (anime.hindiPlatforms && anime.hindiPlatforms.length > 0) {
    if (platform === 'unknown') return false;
    return anime.hindiPlatforms.some(matchPlatformString);
  }

  const dub = getAnimeDubInfo(anime);
  const hasDubPlatform = dub.dubs.some((d) => d.platforms?.some(matchPlatformString));
  const hasWatchPlatform = (anime.watchLinks || []).some((w) => matchPlatformString(w.name));
  const hasStudio = (anime.studios || []).some(matchPlatformString);

  if (platform === 'unknown') {
    return !hasDubPlatform && !hasWatchPlatform;
  }

  return hasDubPlatform || hasWatchPlatform || hasStudio;
}

export function matchesFormatFilter(anime: AnimeItem, formatFilter: FormatFilterType = 'all'): boolean {
  if (!formatFilter || formatFilter === 'all') return true;
  const f = (anime.hindiType || anime.format || 'TV').toUpperCase();
  if (formatFilter === 'TV') return f === 'TV' || f === 'TV SERIES' || f === 'TV_SHORT';
  if (formatFilter === 'Movie') return f === 'MOVIE';
  if (formatFilter === 'OVA_ONA') return f === 'OVA' || f === 'ONA';
  if (formatFilter === 'Special') return f === 'SPECIAL';
  return true;
}

/**
 * Executes a full query against the master catalog with guaranteed pagination,
 * accurate total item count, and dynamic filtering across Platform, Status, Dub Status, and Format.
 */
export function queryAnimeMaster(params: AnimeExplorerQuery): AnimeExplorerResult {
  const {
    searchQuery = '',
    page = 1,
    perPage = 10,
    genre,
    status,
    formatFilter = 'all',
    sort = 'popularity',
    audioFilter = 'all',
    platformFilter = 'all',
  } = params;

  const isStrictHindiFilter =
    audioFilter === 'hindi_only' ||
    audioFilter === 'hindi_complete' ||
    audioFilter === 'hindi_partial' ||
    audioFilter === 'hindi_announced';

  let pool = isStrictHindiFilter ? [...getActiveHindiCatalog()] : buildMasterCatalog();

  // 1. Text Search
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    const qNorm = q.replace(/[^a-z0-9]/g, '');
    pool = pool.filter((item) => {
      const titleLower = item.title.toLowerCase();
      const matchTitle =
        titleLower.includes(q) ||
        (qNorm.length >= 3 && titleLower.replace(/[^a-z0-9]/g, '').includes(qNorm));
      const engLower = item.englishTitle ? item.englishTitle.toLowerCase() : '';
      const matchEnglish =
        engLower.includes(q) ||
        (qNorm.length >= 3 && engLower.replace(/[^a-z0-9]/g, '').includes(qNorm));
      const matchNative = item.nativeTitle && item.nativeTitle.toLowerCase().includes(q);
      const matchGenres = item.genres && item.genres.some((g) => g.toLowerCase().includes(q));
      const matchStudios = item.studios && item.studios.some((s) => s.toLowerCase().includes(q));
      const matchPlats = item.hindiPlatforms && item.hindiPlatforms.some((p) => p.toLowerCase().includes(q));
      return matchTitle || matchEnglish || matchNative || matchGenres || matchStudios || Boolean(matchPlats);
    });
  }

  // 2. Genre Filter
  if (genre && genre !== 'All' && genre !== 'all') {
    const gLower = genre.toLowerCase();
    pool = pool.filter((item) =>
      item.genres?.some((g) => g.toLowerCase() === gLower || g.toLowerCase().includes(gLower))
    );
  }

  // 3. Status Filter
  if (status && status !== 'all') {
    const sLower = status.toLowerCase();
    pool = pool.filter((item) => (item.status || '').toLowerCase().includes(sLower));
  }

  // 4. Format Filter (TV Series / Movies / OVA & ONA / Special)
  if (formatFilter && formatFilter !== 'all') {
    pool = pool.filter((item) => matchesFormatFilter(item, formatFilter));
  }

  // 5. Audio & Dub Filter
  if (audioFilter !== 'all') {
    pool = pool.filter((item) => matchesAudioFilter(item, audioFilter));
  }

  // 6. Platform Filter
  if (platformFilter !== 'all') {
    pool = pool.filter((item) => matchesPlatformFilter(item, platformFilter));
  }

  // 7. Sorting
  pool.sort((a, b) => {
    switch (sort) {
      case 'score':
        return (b.score || 0) - (a.score || 0);
      case 'updated': {
        const aAiring = (a.status || '').toLowerCase().includes('airing') || a.status === 'Releasing' ? 1 : 0;
        const bAiring = (b.status || '').toLowerCase().includes('airing') || b.status === 'Releasing' ? 1 : 0;
        if (aAiring !== bAiring) return bAiring - aAiring;
        return (b.year || 0) - (a.year || 0);
      }
      case 'newest':
        return (b.year || 0) - (a.year || 0);
      case 'oldest':
        return (a.year || 0) - (b.year || 0);
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'title_desc':
        return b.title.localeCompare(a.title);
      case 'popularity':
      default:
        return (b.popularity || 0) - (a.popularity || 0);
    }
  });

  // 8. Dynamic Pagination
  const total = pool.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const validPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (validPage - 1) * perPage;
  const items = pool.slice(startIndex, startIndex + perPage);

  return {
    items,
    total,
    totalPages,
    currentPage: validPage,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1,
  };
}
