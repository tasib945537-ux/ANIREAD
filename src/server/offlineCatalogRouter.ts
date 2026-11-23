import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';

export const offlineCatalogRouter = Router();

interface RawManamiEntry {
  sources?: string[];
  title: string;
  type?: string; // TV | MOVIE | OVA | ONA | SPECIAL | UNKNOWN
  episodes?: number;
  status?: string; // FINISHED | ONGOING | UPCOMING | UNKNOWN
  animeSeason?: { season?: string; year?: number };
  picture?: string;
  thumbnail?: string;
  score?: { arithmeticMean?: number; median?: number; arithmeticGeometricMean?: number };
  synonyms?: string[];
  studios?: string[];
  producers?: string[];
  tags?: string[];
}

export interface CompactCatalogEntry {
  id: number;
  anilistId?: number;
  malId?: number;
  title: string;
  synonyms: string[];
  searchBlob: string;
  type: string; // TV | Movie | OVA | ONA | Special
  status: string; // Finished Airing | Currently Airing | Not yet aired
  episodes: number;
  season?: string;
  year?: number;
  score?: number;
  coverImage: string;
  genres: string[];
  studios: string[];
  popularityProxy: number;
  sources: string[];
}

let catalogEntries: CompactCatalogEntry[] = [];
let catalogLastUpdate = '';
let isLoaded = false;
let byAnilistId = new Map<number, CompactCatalogEntry>();
let byMalId = new Map<number, CompactCatalogEntry>();

function normalizeFormat(raw?: string): string {
  const up = (raw || 'TV').toUpperCase();
  if (up === 'MOVIE') return 'Movie';
  if (up === 'OVA') return 'OVA';
  if (up === 'ONA') return 'ONA';
  if (up === 'SPECIAL') return 'Special';
  return 'TV';
}

function normalizeStatus(raw?: string): string {
  const up = (raw || '').toUpperCase();
  if (up === 'ONGOING') return 'Currently Airing';
  if (up === 'UPCOMING') return 'Not yet aired';
  return 'Finished Airing';
}

function capitalizeWords(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const KNOWN_ANIME_GENRES = new Set([
  'action', 'adventure', 'comedy', 'drama', 'fantasy', 'horror',
  'mystery', 'romance', 'sci-fi', 'slice of life', 'sports',
  'supernatural', 'suspense', 'thriller', 'mecha', 'music',
  'psychological', 'ecchi', 'isekai', 'historical', 'school',
  'shonen', 'seinen', 'shoujo', 'josei', 'martial arts', 'magic',
]);

function extractGenres(tags: string[] = []): string[] {
  const out: string[] = [];
  for (const t of tags) {
    const clean = t.trim().toLowerCase();
    if (KNOWN_ANIME_GENRES.has(clean)) {
      out.push(clean === 'sci-fi' ? 'Sci-Fi' : clean === 'slice of life' ? 'Slice of Life' : capitalizeWords(clean));
    }
    if (out.length >= 4) break;
  }
  if (out.length === 0 && tags.length > 0) {
    for (const t of tags.slice(0, 3)) {
      out.push(capitalizeWords(t));
    }
  }
  return out.length > 0 ? out : ['Anime'];
}

export function loadOfflineCatalog(forceReload = false): void {
  if (isLoaded && !forceReload) return;
  const dbPath = path.join(process.cwd(), 'data', 'raw', 'anime-offline-database-minified.json');
  if (!fs.existsSync(dbPath)) {
    isLoaded = false;
    catalogEntries = [];
    console.warn('[OfflineCatalog] Dataset missing. Run the deployment dataset download step.');
    return;
  }

  try {
    const rawStr = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(rawStr);
    catalogLastUpdate = parsed?.lastUpdate || new Date().toISOString().slice(0, 10);
    const list: RawManamiEntry[] = Array.isArray(parsed?.data) ? parsed.data : [];

    const nextEntries: CompactCatalogEntry[] = [];
    const nextAniMap = new Map<number, CompactCatalogEntry>();
    const nextMalMap = new Map<number, CompactCatalogEntry>();
    let syntheticId = 800000;

    for (const row of list) {
      if (!row?.title) continue;
      let anilistId: number | undefined;
      let malId: number | undefined;
      for (const s of row.sources || []) {
        if (!anilistId && s.includes('anilist.co/anime/')) {
          const m = s.match(/anilist\.co\/anime\/(\d+)/);
          if (m) anilistId = Number(m[1]);
        } else if (!malId && s.includes('myanimelist.net/anime/')) {
          const m = s.match(/myanimelist\.net\/anime\/(\d+)/);
          if (m) malId = Number(m[1]);
        }
      }

      const id = anilistId || malId || syntheticId++;
      const score =
        row.score?.arithmeticMean ||
        row.score?.median ||
        row.score?.arithmeticGeometricMean ||
        undefined;
      const year = row.animeSeason?.year;
      const synonyms = Array.isArray(row.synonyms) ? row.synonyms.slice(0, 8) : [];
      const studios = Array.isArray(row.studios) ? row.studios.slice(0, 4) : [];
      const tags = Array.isArray(row.tags) ? row.tags : [];
      const genres = extractGenres(tags);

      const coverImage = row.picture || row.thumbnail || '';
      const hasScoreBonus = score ? score * 10000 : 0;
      const hasAnilistBonus = anilistId ? 50000 : 0;
      const hasMalBonus = malId ? 30000 : 0;
      const yearBonus = year && year >= 2000 ? (year - 1990) * 800 : 0;
      const formatBonus = row.type === 'TV' ? 15000 : row.type === 'MOVIE' ? 12000 : 0;
      const popularityProxy = Math.round(hasScoreBonus + hasAnilistBonus + hasMalBonus + yearBonus + formatBonus + Math.min((row.episodes || 1) * 80, 5000));

      const searchBlob = [row.title, ...synonyms, ...studios, ...tags.slice(0, 10)]
        .join(' ')
        .toLowerCase();

      const item: CompactCatalogEntry = {
        id,
        anilistId,
        malId,
        title: row.title,
        synonyms,
        searchBlob,
        type: normalizeFormat(row.type),
        status: normalizeStatus(row.status),
        episodes: row.episodes || (row.type === 'MOVIE' ? 1 : 12),
        season: row.animeSeason?.season && row.animeSeason.season !== 'UNDEFINED' ? row.animeSeason.season : undefined,
        year,
        score: score ? Number(score.toFixed(1)) : undefined,
        coverImage,
        genres,
        studios,
        popularityProxy,
        sources: (row.sources || []).slice(0, 6),
      };

      nextEntries.push(item);
      if (anilistId && !nextAniMap.has(anilistId)) nextAniMap.set(anilistId, item);
      if (malId && !nextMalMap.has(malId)) nextMalMap.set(malId, item);
    }

    // Default sort by popularity proxy DESC
    nextEntries.sort((a, b) => b.popularityProxy - a.popularityProxy);
    catalogEntries = nextEntries;
    byAnilistId = nextAniMap;
    byMalId = nextMalMap;
    isLoaded = true;
    console.log(`[OfflineCatalog] Loaded ${catalogEntries.length} anime records from anime-offline-database (updated ${catalogLastUpdate}).`);
  } catch (err) {
    console.warn('[OfflineCatalog] Failed to load offline database:', err);
    catalogEntries = [];
    isLoaded = true;
  }
}

// Lazy-load on first import or router access
loadOfflineCatalog();

offlineCatalogRouter.get('/stats', (_req: Request, res: Response) => {
  loadOfflineCatalog();
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const e of catalogEntries) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  }
  return res.json({
    totalAnime: catalogEntries.length,
    lastUpdate: catalogLastUpdate,
    byType,
    byStatus,
  });
});

offlineCatalogRouter.get('/search', (req: Request, res: Response) => {
  loadOfflineCatalog();
  const q = String(req.query.q || '').trim().toLowerCase();
  const genre = String(req.query.genre || '').trim().toLowerCase();
  const format = String(req.query.type || req.query.format || '').trim().toLowerCase();
  const status = String(req.query.status || '').trim().toLowerCase();
  const yearParam = req.query.year ? Number(req.query.year) : undefined;
  const sort = String(req.query.sort || 'popularity').toLowerCase();
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 10));

  let filtered = catalogEntries;

  if (q || (genre && genre !== 'all') || (format && format !== 'all') || (status && status !== 'all') || yearParam) {
    const qTerms = q.split(/\s+/).filter(Boolean);
    filtered = catalogEntries.filter((e) => {
      if (qTerms.length > 0 && !qTerms.every((t) => e.searchBlob.includes(t))) return false;
      if (genre && genre !== 'all' && !e.genres.some((g) => g.toLowerCase().includes(genre)) && !e.searchBlob.includes(genre)) return false;
      if (format && format !== 'all') {
        if (format === 'ova_ona') {
          if (e.type !== 'OVA' && e.type !== 'ONA') return false;
        } else if (e.type.toLowerCase() !== format) {
          return false;
        }
      }
      if (status && status !== 'all' && !e.status.toLowerCase().includes(status)) return false;
      if (yearParam && e.year !== yearParam) return false;
      return true;
    });
  }

  // Sort only if non-default sort requested (default is already sorted by popularityProxy DESC)
  let sorted = filtered;
  if (sort !== 'popularity') {
    sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === 'score') return (b.score || 0) - (a.score || 0);
      if (sort === 'newest' || sort === 'updated') return (b.year || 0) - (a.year || 0);
      if (sort === 'oldest') return (a.year || 9999) - (b.year || 9999);
      if (sort === 'title_asc') return a.title.localeCompare(b.title);
      if (sort === 'title_desc') return b.title.localeCompare(a.title);
      return b.popularityProxy - a.popularityProxy;
    });
  }

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const slice = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const items = slice.map((e) => ({
    id: e.id,
    anilistId: e.anilistId,
    malId: e.malId,
    title: e.title,
    englishTitle: e.synonyms[0] || e.title,
    coverImage: e.coverImage,
    bannerImage: e.coverImage,
    format: e.type,
    status: e.status,
    episodes: e.episodes,
    season: e.season,
    year: e.year,
    score: e.score,
    popularity: e.popularityProxy,
    synopsis: `${e.title} (${e.type}${e.year ? `, ${e.year}` : ''}). ${e.synonyms.length ? `Also known as: ${e.synonyms.slice(0, 3).join(', ')}.` : ''}`.trim(),
    genres: e.genres,
    studios: e.studios,
    sourceApi: 'anilist' as const,
    isLicensed: Boolean(e.anilistId || e.malId),
    countryOfOrigin: 'JP',
    externalLinks: e.sources.map((url) => ({
      name: url.includes('anilist') ? 'AniList' : url.includes('myanimelist') ? 'MyAnimeList' : url.includes('kitsu') ? 'Kitsu' : 'Database',
      url,
    })),
  }));

  return res.json({
    items,
    total,
    totalPages,
    currentPage: safePage,
    hasNextPage: safePage < totalPages,
    lastUpdate: catalogLastUpdate,
  });
});

offlineCatalogRouter.get('/lookup', (req: Request, res: Response) => {
  loadOfflineCatalog();
  const id = req.query.id ? Number(req.query.id) : undefined;
  const title = String(req.query.title || '').trim().toLowerCase();

  let match: CompactCatalogEntry | undefined;
  if (id) {
    match = byAnilistId.get(id) || byMalId.get(id);
  }
  if (!match && title) {
    match = catalogEntries.find(
      (e) => e.title.toLowerCase() === title || e.synonyms.some((s) => s.toLowerCase() === title)
    );
  }
  if (!match) return res.status(404).json({ error: 'Anime not found in offline catalog' });
  return res.json(match);
});

export function lookupOfflineCover(params: { id?: number; malId?: number; title?: string }): string | null {
  loadOfflineCatalog();
  let match: CompactCatalogEntry | undefined;
  if (params.id) {
    match = byAnilistId.get(params.id) || byMalId.get(params.id);
  }
  if (!match && params.malId) {
    match = byMalId.get(params.malId);
  }
  if (!match && params.title) {
    const q = params.title.trim().toLowerCase();
    match = catalogEntries.find(
      (e) => e.title.toLowerCase() === q || e.synonyms.some((s) => s.toLowerCase() === q)
    );
  }
  return match?.coverImage || null;
}

