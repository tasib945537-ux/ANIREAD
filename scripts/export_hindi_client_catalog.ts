import fs from 'node:fs';
import path from 'node:path';

interface HindiRecord {
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

const ROOT = process.cwd();
const INPUT_JSON = path.join(ROOT, 'data', 'hindi_dub_database.json');
const OUTPUT_TS = path.join(ROOT, 'src', 'services', 'verifiedHindiAnimeCatalog.ts');

function mapIconType(platform: string): string {
  const pl = platform.toLowerCase();
  if (pl.includes('crunchyroll')) return 'crunchyroll';
  if (pl.includes('netflix')) return 'netflix';
  if (pl.includes('prime') || pl.includes('amazon')) return 'prime';
  if (pl.includes('muse')) return 'youtube';
  if (pl.includes('jio') || pl.includes('hotstar') || pl.includes('disney')) return 'disney';
  if (pl.includes('apple')) return 'apple';
  return 'default';
}

function stableNumericId(rec: HindiRecord, idx: number): number {
  if (rec.anilistId && rec.anilistId > 0) {
    // Disambiguate multiple seasons sharing an AniList base ID cleanly if needed, or preserve anilistId on item.anilistId
    return rec.anilistId;
  }
  if (rec.malId && rec.malId > 0) return rec.malId;
  return 700000 + idx;
}

function main() {
  const raw = fs.readFileSync(INPUT_JSON, 'utf-8');
  const records: HindiRecord[] = JSON.parse(raw);

  const usedIds = new Set<number>();
  const items = records.map((r, idx) => {
    let runtimeId = stableNumericId(r, idx);
    if (usedIds.has(runtimeId)) {
      runtimeId = 710000 + idx;
    }
    usedIds.add(runtimeId);

    const isReleased = r.dub_status === 'Complete' || r.dub_status === 'Partial';
    const watchLinks = r.platforms.map((plat, pIdx) => ({
      name: plat,
      url: r.source_urls[pIdx] || r.source_urls[0] || `https://www.google.com/search?q=${encodeURIComponent(r.title + ' ' + plat + ' Hindi')}`,
      badge:
        r.dub_status === 'Complete'
          ? 'Official Complete Hindi Dub'
          : r.dub_status === 'Partial'
          ? 'Official Partial Hindi Dub'
          : 'Announced Hindi Dub',
      iconType: mapIconType(plat) as any,
      isOfficial: true,
      audioTracks: isReleased ? ['Hindi', 'Japanese'] : ['Japanese'],
      subtitles: ['English', 'Hindi'],
      region: 'India',
    }));

    return {
      id: runtimeId,
      ...(r.malId ? { malId: r.malId } : {}),
      ...(r.anilistId ? { anilistId: r.anilistId } : {}),
      title: r.title,
      englishTitle: r.englishTitle || r.title,
      nativeTitle: r.original_title || r.title,
      coverImage: r.coverImage || `/api/anime-cover?title=${encodeURIComponent(r.title)}&malId=${r.malId || ''}`,
      bannerImage: r.bannerImage || r.coverImage || `/api/anime-cover?title=${encodeURIComponent(r.title)}`,
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
      sourceApi: 'anilist' as const,
      audioLanguages: isReleased ? ['Hindi Audio', 'Japanese Audio'] : ['Japanese Audio'],
      subtitles: ['English', 'Hindi'],
      watchLinks,
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
  });

  const fileContent = `import { AnimeItem } from '../types/anime';

/**
 * ANIREAD Rebuilt Official Hindi Dubbed Anime Catalog
 * Auto-generated from verified /data/hindi_dub_database.json (${items.length} entries, verified ${records[0]?.verification_date || '2026-11-14'}).
 * Includes TV Series seasons, Movies, OVAs, ONAs, and Specials across Crunchyroll India, Netflix India,
 * Amazon Prime Video India, Anime Times India, Muse India, JioHotstar, Sony YAY!, and Disney/Hungama TV.
 */
export const VERIFIED_HINDI_ANIME_CATALOG: AnimeItem[] = ${JSON.stringify(items, null, 2)};
`;

  fs.writeFileSync(OUTPUT_TS, fileContent, 'utf-8');
  console.log(`Generated ${OUTPUT_TS} with ${items.length} verified Hindi entries.`);
}

main();
