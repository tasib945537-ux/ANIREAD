import { AnimeItem } from '../types/anime';
import { VERIFIED_HINDI_ANIME_CATALOG } from './verifiedHindiAnimeCatalog';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\\/$/, '');

export interface ServerHindiDubRecord {
  id: string;
  anilistId: number | null;
  malId: number | null;
  title: string;
  englishTitle: string;
  original_title: string;
  type: 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special';
  season: number | null;
  part: string | number | null;
  episodes: number | null;
  verified_episodes: number | null;
  hindi_audio: boolean;
  dub_status: 'Complete' | 'Partial' | 'Announced';
  platforms: string[];
  official_sources: string[];
  source_urls: string[];
  verification_date: string;
  availability_status: 'Available' | 'Unavailable' | 'Unknown';
  notes: string;
  coverImage: string;
  bannerImage: string;
  year: number | null;
  genres: string[];
  studios: string[];
  score: number | null;
  popularity: number;
  synopsis: string;
  needs_verification: boolean;
  airTime?: string;
  simulcastSchedule?: string;
  broadcastTiming?: string;
}

let activeHindiCatalog: AnimeItem[] = [...VERIFIED_HINDI_ANIME_CATALOG];
const registryListeners = new Set<() => void>();

export function subscribeHindiRegistry(listener: () => void): () => void {
  registryListeners.add(listener);
  return () => registryListeners.delete(listener);
}

export function getActiveHindiCatalog(): AnimeItem[] {
  return activeHindiCatalog;
}

function mapIconType(platform: string): any {
  const pl = platform.toLowerCase();
  if (pl.includes('crunchyroll')) return 'crunchyroll';
  if (pl.includes('netflix')) return 'netflix';
  if (pl.includes('prime') || pl.includes('amazon')) return 'prime';
  if (pl.includes('muse')) return 'youtube';
  if (pl.includes('jio') || pl.includes('hotstar') || pl.includes('disney')) return 'disney';
  if (pl.includes('apple')) return 'apple';
  return 'default';
}

export function serverRecordToAnimeItem(r: ServerHindiDubRecord, idx: number = 0): AnimeItem {
  const runtimeId = r.anilistId && r.anilistId > 0 ? r.anilistId : r.malId && r.malId > 0 ? r.malId : 700000 + idx;
  const isReleased = r.dub_status === 'Complete' || r.dub_status === 'Partial';
  return {
    id: runtimeId,
    ...(r.malId ? { malId: r.malId } : {}),
    ...(r.anilistId ? { anilistId: r.anilistId } : {}),
    title: r.title,
    englishTitle: r.englishTitle || r.title,
    nativeTitle: r.original_title || r.title,
    coverImage: r.coverImage || `${API_BASE_URL}/api/anime-cover?title=${encodeURIComponent(r.title)}&malId=${r.malId || ''}`,
    bannerImage: r.bannerImage || r.coverImage || `${API_BASE_URL}/api/anime-cover?title=${encodeURIComponent(r.title)}`,
    format: r.type,
    status:
      r.dub_status === 'Announced'
        ? 'Not Yet Released'
        : r.dub_status === 'Partial'
        ? 'Releasing'
        : 'Finished Airing',
    ...(r.episodes !== null ? { episodes: r.episodes } : {}),
    ...(r.year ? { year: r.year } : {}),
    ...(r.score ? { score: r.score } : {}),
    popularity: r.popularity || 100000,
    synopsis: r.synopsis || r.notes,
    genres: r.genres?.length ? r.genres : ['Anime'],
    studios: r.studios || [],
    sourceApi: 'anilist',
    audioLanguages: isReleased ? ['Hindi Audio', 'Japanese Audio'] : ['Japanese Audio'],
    subtitles: ['English', 'Hindi'],
    watchLinks: r.platforms.map((plat, pIdx) => ({
      name: plat,
      url:
        r.source_urls[pIdx] ||
        r.source_urls[0] ||
        `https://www.google.com/search?q=${encodeURIComponent(`${r.title} ${plat} Hindi`)}`,
      badge:
        r.dub_status === 'Complete'
          ? 'Official Complete Hindi Dub'
          : r.dub_status === 'Partial'
          ? 'Official Partial Hindi Dub'
          : 'Announced Hindi Dub',
      iconType: mapIconType(plat),
      isOfficial: true,
      audioTracks: isReleased ? ['Hindi', 'Japanese'] : ['Japanese'],
      subtitles: ['English', 'Hindi'],
      region: 'India',
    })),
    hindiDbId: r.id,
    hindiDubStatus: r.dub_status,
    hindiVerifiedEpisodes: r.verified_episodes,
    hindiSeason: r.season,
    hindiPart: r.part,
    hindiType: r.type,
    hindiPlatforms: r.platforms,
    hindiSourceUrls: r.source_urls,
    hindiVerificationDate: r.verification_date,
    hindiAvailabilityStatus: r.availability_status,
    hindiNotes: r.notes,
    hindiNeedsVerification: r.needs_verification,
    ...(r.airTime ? { airTime: r.airTime } : {}),
    ...(r.simulcastSchedule ? { simulcastSchedule: r.simulcastSchedule } : {}),
    ...(r.broadcastTiming ? { broadcastTiming: r.broadcastTiming } : {}),
  };
}

export async function syncHindiCatalogFromServer(): Promise<AnimeItem[]> {
  try {
    const res = await fetch('/api/dubs/hindi?perPage=1000');
    if (!res.ok) return activeHindiCatalog;
    const json = await res.json();
    if (Array.isArray(json?.items) && json.items.length > 0) {
      const usedIds = new Set<number>();
      activeHindiCatalog = json.items.map((r: ServerHindiDubRecord, idx: number) => {
        const mapped = serverRecordToAnimeItem(r, idx);
        if (usedIds.has(mapped.id)) {
          mapped.id = 710000 + idx;
        }
        usedIds.add(mapped.id);
        return mapped;
      });
      registryListeners.forEach((fn) => fn());
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aniread-hindi-db-updated', { detail: { count: activeHindiCatalog.length } }));
      }
    }
  } catch {
    // Keep preloaded VERIFIED_HINDI_ANIME_CATALOG cleanly if offline
  }
  return activeHindiCatalog;
}

function normStrict(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/\([^)]*hindi[^)]*\)/gi, '')
    .replace(/[^a-z0-9]/g, '');
}

function extractSeasonNumber(s: string): number | null {
  const m = s.match(/\bseason\s*(\d+)\b/i) || s.match(/\bs(\d+)\b/i) || s.match(/\b(\d+)(?:nd|rd|th)\s+season\b/i);
  if (m) return Number(m[1]);
  if (/\b(?:part|cour)\s*2\b|\bii\b/i.test(s)) return 2;
  if (/\biii\b/i.test(s)) return 3;
  return null;
}

/**
 * Strictly finds a matching entry in the rebuilt Hindi database without false franchise inheritance.
 */
export function findVerifiedHindiItem(
  animeOrTitle: Partial<AnimeItem> | string
): AnimeItem | undefined {
  if (typeof animeOrTitle === 'object' && animeOrTitle.hindiDbId && animeOrTitle.hindiDubStatus) {
    return animeOrTitle as AnimeItem;
  }

  const title = typeof animeOrTitle === 'string' ? animeOrTitle : animeOrTitle.title || '';
  const englishTitle = typeof animeOrTitle === 'object' ? animeOrTitle.englishTitle : undefined;
  const nativeTitle = typeof animeOrTitle === 'object' ? animeOrTitle.nativeTitle : undefined;
  const format = typeof animeOrTitle === 'object' ? (animeOrTitle.format || '').toLowerCase() : '';
  const anilistId = typeof animeOrTitle === 'object' ? animeOrTitle.anilistId : undefined;

  const qNorm = normStrict(title);
  const qEngNorm = englishTitle ? normStrict(englishTitle) : '';
  const qSeason = extractSeasonNumber(title) || (englishTitle ? extractSeasonNumber(englishTitle) : null);

  if (!qNorm && !anilistId) return undefined;

  // 1. Exact ID match (if query doesn't specify a conflicting season/movie format)
  if (anilistId) {
    const byIdMatches = activeHindiCatalog.filter((c) => c.anilistId === anilistId);
    if (byIdMatches.length === 1) {
      const candidate = byIdMatches[0];
      const cSeason = candidate.hindiSeason || extractSeasonNumber(candidate.title);
      if (!qSeason || !cSeason || qSeason === cSeason) {
        return candidate;
      }
    } else if (byIdMatches.length > 1) {
      const exactTitleMatch = byIdMatches.find(
        (c) => normStrict(c.title) === qNorm || (qEngNorm && normStrict(c.englishTitle || '') === qEngNorm)
      );
      if (exactTitleMatch) return exactTitleMatch;
    }
  }

  // 2. Exact title match (with or without Season 1 equivalence when query has no season number)
  for (const c of activeHindiCatalog) {
    const cTitleNorm = normStrict(c.title);
    const cEngNorm = normStrict(c.englishTitle || '');
    const cOrigNorm = normStrict(c.nativeTitle || '');

    if (
      qNorm === cTitleNorm ||
      (cEngNorm && qNorm === cEngNorm) ||
      (qEngNorm && (qEngNorm === cTitleNorm || qEngNorm === cEngNorm)) ||
      (nativeTitle && cOrigNorm && nativeTitle.trim() === c.nativeTitle?.trim())
    ) {
      return c;
    }
  }

  // 3. Base TV title match ONLY for Season 1 (prevents Season 2/Movies inheriting Season 1 falsely)
  if (!qSeason && (!format || format === 'tv' || format === 'tv series' || format === 'ona')) {
    const qBase = normStrict(title.replace(/\bseason\s*1\b/gi, ''));
    const qEngBase = englishTitle ? normStrict(englishTitle.replace(/\bseason\s*1\b/gi, '')) : '';
    for (const c of activeHindiCatalog) {
      if (c.format === 'Movie' || c.format === 'OVA') continue;
      if (c.hindiSeason && c.hindiSeason > 1) continue;
      const cNoS1 = normStrict(c.title.replace(/\bseason\s*1\b/gi, '').replace(/\(hindi[^)]*\)/gi, ''));
      if (qBase && cNoS1 && (qBase === cNoS1 || (qEngBase && qEngBase === cNoS1))) {
        return c;
      }
    }
  }

  return undefined;
}
