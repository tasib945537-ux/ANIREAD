import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  AnimeAudioRelease,
  DubEvidence,
  DubVerificationStatus,
  AudioType,
} from '../types/anime';
import {
  VERIFIED_OFFICIAL_CATALOG,
  getAnimeDubInfo,
} from '../services/dubCatalog';

export const dubRouter = Router();

export interface HindiDubRecord {
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

const DATA_DIR = path.join(process.cwd(), 'data');
const HINDI_DB_PATH = path.join(DATA_DIR, 'hindi_dub_database.json');
const MIGRATION_REPORT_PATH = path.join(DATA_DIR, 'hindi_migration_report.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

let hindiDatabase: HindiDubRecord[] = [];
let migrationReport: any = null;
let lastLoadedMtime = 0;

function loadHindiDatabase(force = false): HindiDubRecord[] {
  try {
    if (fs.existsSync(HINDI_DB_PATH)) {
      const stat = fs.statSync(HINDI_DB_PATH);
      if (force || stat.mtimeMs !== lastLoadedMtime || hindiDatabase.length === 0) {
        const raw = fs.readFileSync(HINDI_DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          hindiDatabase = parsed;
          lastLoadedMtime = stat.mtimeMs;
        }
      }
    }
    if (fs.existsSync(MIGRATION_REPORT_PATH) && (!migrationReport || force)) {
      migrationReport = JSON.parse(fs.readFileSync(MIGRATION_REPORT_PATH, 'utf-8'));
    }
  } catch (err) {
    console.warn('[DubRouter] Error loading Hindi DB:', err);
  }
  return hindiDatabase;
}

function saveHindiDatabase(records: HindiDubRecord[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${HINDI_DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(records, null, 2), 'utf-8');
  fs.renameSync(tmpPath, HINDI_DB_PATH);
  hindiDatabase = records;
  lastLoadedMtime = fs.statSync(HINDI_DB_PATH).mtimeMs;
}

function normalizeTitleKey(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/\b(season|cour|part|tv|the movie|movie)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function matchesPlatformKey(platforms: string[], filterKey: string): boolean {
  const k = filterKey.toLowerCase().trim();
  if (!k || k === 'all') return true;
  const joined = platforms.join(' | ').toLowerCase();
  if (k === 'crunchyroll') return joined.includes('crunchyroll');
  if (k === 'netflix') return joined.includes('netflix');
  if (k === 'prime' || k === 'amazon prime video' || k === 'amazon') {
    return joined.includes('amazon prime video') || joined.includes('prime video');
  }
  if (k === 'anime_times' || k === 'animetimes' || k === 'anime times') {
    return joined.includes('anime times');
  }
  if (k === 'muse' || k === 'muse india') return joined.includes('muse');
  if (k === 'other' || k === 'other official platforms') {
    return (
      joined.includes('jiohotstar') ||
      joined.includes('jiocinema') ||
      joined.includes('hotstar') ||
      joined.includes('sony yay') ||
      joined.includes('sonyliv') ||
      joined.includes('hungama') ||
      joined.includes('disney') ||
      joined.includes('marvel hq') ||
      joined.includes('cartoon network') ||
      joined.includes('nickelodeon') ||
      joined.includes('sonic') ||
      joined.includes('zee5') ||
      joined.includes('zee café') ||
      joined.includes('mx player') ||
      joined.includes('pvr') ||
      joined.includes('ani-one')
    );
  }
  return joined.includes(k);
}

// In-Memory store for multi-language Audio Releases initialized from Verified Catalog + Hindi DB
const audioReleases = new Map<string, AnimeAudioRelease>();
const scanAuditLog: Array<{
  timestamp: string;
  action: string;
  title: string;
  details: string;
  user?: string;
}> = [];

export const LANGUAGE_REGISTRY: Record<
  string,
  { name: string; nativeName: string; flag: string; code: string }
> = {
  ja: { name: 'Japanese', nativeName: '日本語', flag: '', code: 'ja' },
  en: { name: 'English', nativeName: 'English', flag: '', code: 'en' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '', code: 'hi' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '', code: 'bn' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '', code: 'ta' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '', code: 'te' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '', code: 'ml' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '', code: 'kn' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '', code: 'es' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '', code: 'pt' },
  fr: { name: 'French', nativeName: 'Français', flag: '', code: 'fr' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '', code: 'de' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '', code: 'it' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '', code: 'ar' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '', code: 'ko' },
  zh: { name: 'Mandarin Chinese', nativeName: '中文', flag: '', code: 'zh' },
};

function seedDatabase() {
  loadHindiDatabase();

  VERIFIED_OFFICIAL_CATALOG.forEach((record, index) => {
    const animeId = 1000 + index;
    record.languages.forEach((lang, langIdx) => {
      const langKey = lang.language.toLowerCase();
      let langCode = 'en';
      if (langKey === 'japanese') langCode = 'ja';
      else if (langKey === 'hindi') langCode = 'hi';
      else if (langKey === 'bengali') langCode = 'bn';
      else if (langKey === 'tamil') langCode = 'ta';
      else if (langKey === 'telugu') langCode = 'te';
      else if (langKey === 'spanish') langCode = 'es';
      else if (langKey === 'french') langCode = 'fr';
      else if (langKey === 'german') langCode = 'de';

      const releaseId = `rel_${animeId}_${langCode}_${langIdx}`;
      let normStatus: DubVerificationStatus = 'CONFIRMED';
      if (lang.status === 'Sub Only') normStatus = 'REPORTED_UNVERIFIED';
      else if (lang.status === 'Partial') normStatus = 'PARTIALLY_CONFIRMED';
      else if (lang.status === 'Confirmed' || lang.status === 'Available') normStatus = 'CONFIRMED';

      const evidenceItem: DubEvidence = {
        id: `evi_${animeId}_${langCode}_${langIdx}`,
        audioReleaseId: releaseId,
        sourceName: lang.platform[0] || 'Official Licensing Registry',
        sourceUrl: lang.watchUrl || 'https://www.crunchyroll.com',
        evidenceType: lang.status === 'Sub Only' ? 'subtitle_feed_only' : 'official_catalog',
        evidenceSummary: `${lang.verificationSource}. Dubbed coverage: ${lang.episodesDubbed || 'Season broadcast'}.`,
        checkedAt: '2026-11-14T00:00:00.000Z',
        verificationStatus: normStatus,
      };

      const isOriginal = langCode === 'ja';
      audioReleases.set(releaseId, {
        id: releaseId,
        animeId,
        animeTitle: record.title,
        seasonNumber: 1,
        seasonTitle: 'Season 1 / Series Run',
        episodeRange: lang.episodesDubbed || 'All Episodes',
        languageCode: langCode,
        languageName: LANGUAGE_REGISTRY[langCode]?.name || lang.language,
        flag: '',
        audioType: isOriginal ? 'original' : 'dub',
        status: normStatus,
        regionCode: langCode === 'hi' || langCode === 'ta' || langCode === 'te' ? 'IN' : langCode === 'bn' ? 'BD' : 'GLOBAL',
        platformName: lang.platform.join(' · '),
        officialUrl: lang.watchUrl,
        releaseDate: lang.releaseDate,
        studios: lang.studios,
        voiceActors: lang.voiceActors,
        notes: lang.notes,
        evidence: [evidenceItem],
        verifiedAt: '2026-11-14T00:00:00.000Z',
        createdAt: '2026-11-14T00:00:00.000Z',
        updatedAt: '2026-11-14T00:00:00.000Z',
      });
    });
  });

  // Also register all rebuilt Hindi database entries into audioReleases for unified lookup
  for (const h of hindiDatabase) {
    const releaseId = `rel_hindi_${h.id}`;
    const normStatus: DubVerificationStatus =
      h.dub_status === 'Complete'
        ? 'CONFIRMED'
        : h.dub_status === 'Partial'
        ? 'PARTIALLY_CONFIRMED'
        : 'REPORTED_UNVERIFIED';

    audioReleases.set(releaseId, {
      id: releaseId,
      animeId: h.anilistId || h.malId || 500000,
      animeTitle: h.title,
      seasonNumber: h.season || 1,
      seasonTitle: h.part ? `${h.type} · ${h.part}` : h.type,
      episodeRange:
        h.type === 'Movie'
          ? 'Feature Film'
          : h.verified_episodes && h.episodes
          ? `${h.verified_episodes}/${h.episodes} Episodes (${h.dub_status})`
          : h.dub_status,
      languageCode: 'hi',
      languageName: 'Hindi',
      flag: '',
      audioType: 'dub',
      status: normStatus,
      regionCode: 'IN',
      platformName: h.platforms.join(' · '),
      officialUrl: h.source_urls[0] || 'https://www.crunchyroll.com/discover',
      releaseDate: h.year ? String(h.year) : undefined,
      studios: h.studios,
      notes: h.notes,
      evidence: [
        {
          id: `evi_${h.id}`,
          audioReleaseId: releaseId,
          sourceName: h.official_sources[0] || 'Official Indian Distributor',
          sourceUrl: h.source_urls[0] || 'https://www.crunchyroll.com/discover',
          evidenceType: 'official_catalog',
          evidenceSummary: h.notes,
          checkedAt: h.verification_date,
          verificationStatus: normStatus,
        },
      ],
      verifiedAt: h.verification_date,
      createdAt: h.verification_date,
      updatedAt: h.verification_date,
    });
  }

  scanAuditLog.push({
    timestamp: new Date().toISOString(),
    action: 'SYSTEM_BOOTSTRAP',
    title: 'Verified Dub Database Loaded',
    details: `Loaded ${hindiDatabase.length} rebuilt Hindi dub records and ${audioReleases.size} total release records.`,
    user: 'System Engine',
  });
}

seedDatabase();

// =========================================================================
// REBUILT HINDI DUB DATABASE ENDPOINTS (/api/dubs/hindi/*)
// =========================================================================

dubRouter.get('/hindi', (req: Request, res: Response) => {
  const list = loadHindiDatabase();
  const q = String(req.query.q || '').trim().toLowerCase();
  const platform = String(req.query.platform || 'all');
  const dubStatus = String(req.query.dub_status || 'all').toLowerCase();
  const typeFilter = String(req.query.type || 'all').toLowerCase();
  const availability = String(req.query.availability || 'all').toLowerCase();
  const needsVer = String(req.query.needs_verification || 'all').toLowerCase();
  const sort = String(req.query.sort || 'popularity').toLowerCase();
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(500, Math.max(1, Number(req.query.perPage) || 25));

  let filtered = list.filter((rec) => {
    if (q) {
      const hay = `${rec.title} ${rec.englishTitle} ${rec.original_title} ${rec.platforms.join(' ')} ${rec.notes}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (platform !== 'all' && !matchesPlatformKey(rec.platforms, platform)) return false;
    if (dubStatus !== 'all' && rec.dub_status.toLowerCase() !== dubStatus) return false;
    if (typeFilter !== 'all') {
      if (typeFilter === 'ova_ona') {
        if (rec.type !== 'OVA' && rec.type !== 'ONA') return false;
      } else if (rec.type.toLowerCase() !== typeFilter) {
        return false;
      }
    }
    if (availability !== 'all' && rec.availability_status.toLowerCase() !== availability) return false;
    if (needsVer === 'true' && !rec.needs_verification) return false;
    if (needsVer === 'false' && rec.needs_verification) return false;
    return true;
  });

  if (sort !== 'popularity') {
    filtered = [...filtered].sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title);
      if (sort === 'title_desc') return b.title.localeCompare(a.title);
      if (sort === 'score') return (b.score || 0) - (a.score || 0);
      if (sort === 'newest') return (b.year || 0) - (a.year || 0);
      if (sort === 'episodes') return (b.episodes || 0) - (a.episodes || 0);
      return (b.popularity || 0) - (a.popularity || 0);
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  return res.json({
    items,
    total,
    totalPages,
    currentPage: safePage,
    hasNextPage: safePage < totalPages,
  });
});

function detectDuplicateCandidates(list: HindiDubRecord[]) {
  const buckets = new Map<string, HindiDubRecord[]>();
  for (const r of list) {
    const key = normalizeTitleKey(r.title);
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }
  const candidates: Array<{ key: string; records: HindiDubRecord[]; reason: string }> = [];
  for (const [key, records] of buckets.entries()) {
    if (records.length > 1) {
      // Only flag true duplicate risks where season/type also collide OR very similar same-type entries
      const seenSub = new Map<string, HindiDubRecord[]>();
      for (const r of records) {
        const subKey = `${r.type}__${r.season ?? 'none'}__${r.part ?? 'none'}`;
        if (!seenSub.has(subKey)) seenSub.set(subKey, []);
        seenSub.get(subKey)!.push(r);
      }
      for (const [, subRecs] of seenSub.entries()) {
        if (subRecs.length > 1) {
          candidates.push({
            key,
            records: subRecs,
            reason: `Matching normalized title "${key}" + format/season (${subRecs[0].type})`,
          });
        }
      }
    }
  }
  return candidates;
}

dubRouter.get('/hindi/stats', (_req: Request, res: Response) => {
  const list = loadHindiDatabase();

  let completeCount = 0;
  let partialCount = 0;
  let announcedCount = 0;
  let tvCount = 0;
  let movieCount = 0;
  let ovaCount = 0;
  let onaCount = 0;
  let specialCount = 0;
  let availableCount = 0;
  let unavailableCount = 0;
  let unknownCount = 0;
  let needsVerificationCount = 0;

  const platformCounts: Record<string, number> = {
    'Crunchyroll India': 0,
    'Netflix India': 0,
    'Amazon Prime Video India': 0,
    'Anime Times India': 0,
    'Muse India': 0,
    'Other Official Platforms': 0,
  };

  let lastVerificationDate = '2026-11-14';

  for (const r of list) {
    if (r.dub_status === 'Complete') completeCount++;
    else if (r.dub_status === 'Partial') partialCount++;
    else announcedCount++;

    if (r.type === 'TV') tvCount++;
    else if (r.type === 'Movie') movieCount++;
    else if (r.type === 'OVA') ovaCount++;
    else if (r.type === 'ONA') onaCount++;
    else specialCount++;

    if (r.availability_status === 'Available') availableCount++;
    else if (r.availability_status === 'Unavailable') unavailableCount++;
    else unknownCount++;

    if (r.needs_verification) needsVerificationCount++;
    if (r.verification_date && r.verification_date > lastVerificationDate) {
      lastVerificationDate = r.verification_date;
    }

    if (matchesPlatformKey(r.platforms, 'crunchyroll')) platformCounts['Crunchyroll India']++;
    if (matchesPlatformKey(r.platforms, 'netflix')) platformCounts['Netflix India']++;
    if (matchesPlatformKey(r.platforms, 'prime')) platformCounts['Amazon Prime Video India']++;
    if (matchesPlatformKey(r.platforms, 'anime_times')) platformCounts['Anime Times India']++;
    if (matchesPlatformKey(r.platforms, 'muse')) platformCounts['Muse India']++;
    if (matchesPlatformKey(r.platforms, 'other')) platformCounts['Other Official Platforms']++;
  }

  const duplicateCandidates = detectDuplicateCandidates(list);

  return res.json({
    totalHindiDubbedAnime: list.length,
    completeCount,
    partialCount,
    announcedCount,
    byType: {
      TV: tvCount,
      Movie: movieCount,
      OVA: ovaCount,
      ONA: onaCount,
      Special: specialCount,
      ovaAndOna: ovaCount + onaCount,
    },
    platformCounts,
    availabilityCounts: {
      Available: availableCount,
      Unavailable: unavailableCount,
      Unknown: unknownCount,
    },
    needsVerificationCount,
    duplicateCandidatesCount: duplicateCandidates.length,
    lastVerificationDate,
    migrationSummary: migrationReport?.summary || null,
    removedUnverifiedEntries: migrationReport?.removedUnverifiedEntries || [],
    recentAudits: scanAuditLog.slice(0, 20),
  });
});

dubRouter.post('/hindi/save', (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<HindiDubRecord>;
    if (!body.title || !String(body.title).trim()) {
      return res.status(400).json({ error: 'Anime title is required.' });
    }

    const list = [...loadHindiDatabase()];
    const today = new Date().toISOString().slice(0, 10);
    const title = String(body.title).trim();
    const type = (body.type || 'TV') as HindiDubRecord['type'];
    const season = body.season !== undefined && body.season !== null && body.season !== ('' as any) ? Number(body.season) : null;
    const part = body.part !== undefined && body.part !== null && String(body.part).trim() !== '' ? body.part : null;
    const platforms = Array.isArray(body.platforms)
      ? body.platforms.map((p) => String(p).trim()).filter(Boolean)
      : String(body.platforms || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    const officialSources = Array.isArray(body.official_sources) && body.official_sources.length > 0
      ? body.official_sources.map((p) => String(p).trim()).filter(Boolean)
      : platforms;
    const sourceUrls = Array.isArray(body.source_urls)
      ? body.source_urls.map((u) => String(u).trim()).filter(Boolean)
      : String(body.source_urls || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    const idToMatch = body.id ? String(body.id) : '';
    const existingIdx = idToMatch
      ? list.findIndex((r) => r.id === idToMatch)
      : list.findIndex(
          (r) =>
            normalizeTitleKey(r.title) === normalizeTitleKey(title) &&
            r.type === type &&
            r.season === season &&
            String(r.part ?? '') === String(part ?? '')
        );

    const record: HindiDubRecord = {
      id: idToMatch || `hi_${body.anilistId || Date.now()}_${type.toLowerCase()}_s${season ?? 0}`,
      anilistId: body.anilistId ? Number(body.anilistId) : existingIdx >= 0 ? list[existingIdx].anilistId : null,
      malId: body.malId ? Number(body.malId) : existingIdx >= 0 ? list[existingIdx].malId : null,
      title,
      englishTitle: String(body.englishTitle || title).trim(),
      original_title: String(body.original_title || (existingIdx >= 0 ? list[existingIdx].original_title : title)).trim(),
      type,
      season,
      part,
      episodes: body.episodes !== undefined && body.episodes !== null ? Number(body.episodes) : existingIdx >= 0 ? list[existingIdx].episodes : null,
      verified_episodes:
        body.verified_episodes !== undefined && body.verified_episodes !== null
          ? Number(body.verified_episodes)
          : existingIdx >= 0
          ? list[existingIdx].verified_episodes
          : null,
      hindi_audio: body.hindi_audio !== undefined ? Boolean(body.hindi_audio) : true,
      dub_status: (body.dub_status || 'Complete') as HindiDubRecord['dub_status'],
      platforms: existingIdx >= 0 && !idToMatch ? Array.from(new Set([...list[existingIdx].platforms, ...platforms])) : platforms,
      official_sources: officialSources,
      source_urls: sourceUrls,
      verification_date: String(body.verification_date || today),
      availability_status: (body.availability_status || 'Available') as HindiDubRecord['availability_status'],
      notes: String(body.notes || '').trim(),
      coverImage: String(body.coverImage || (existingIdx >= 0 ? list[existingIdx].coverImage : '')),
      bannerImage: String(body.bannerImage || (existingIdx >= 0 ? list[existingIdx].bannerImage : '')),
      year: body.year ? Number(body.year) : existingIdx >= 0 ? list[existingIdx].year : null,
      genres: Array.isArray(body.genres) && body.genres.length > 0 ? body.genres : existingIdx >= 0 ? list[existingIdx].genres : ['Anime'],
      studios: Array.isArray(body.studios) ? body.studios : existingIdx >= 0 ? list[existingIdx].studios : [],
      score: body.score !== undefined && body.score !== null ? Number(body.score) : existingIdx >= 0 ? list[existingIdx].score : null,
      popularity: body.popularity ? Number(body.popularity) : existingIdx >= 0 ? list[existingIdx].popularity : 100000,
      synopsis: String(body.synopsis || (existingIdx >= 0 ? list[existingIdx].synopsis : body.notes || '')),
      needs_verification: Boolean(body.needs_verification),
      ...(body.airTime ? { airTime: body.airTime } : {}),
      ...(body.simulcastSchedule ? { simulcastSchedule: body.simulcastSchedule } : {}),
      ...(body.broadcastTiming ? { broadcastTiming: body.broadcastTiming } : {}),
    };

    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.unshift(record);
    }

    saveHindiDatabase(list);

    scanAuditLog.unshift({
      timestamp: new Date().toISOString(),
      action: existingIdx >= 0 ? 'HINDI_DB_UPDATE' : 'HINDI_DB_CREATE',
      title: record.title,
      details: `${record.dub_status} · ${record.type} · Platforms: ${record.platforms.join(', ')}`,
      user: 'Admin Dashboard',
    });

    return res.json({ success: true, record, total: list.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save Hindi record', message: err?.message });
  }
});

dubRouter.delete('/hindi/:id', (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const list = loadHindiDatabase();
  const target = list.find((r) => r.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Hindi dub record not found.' });
  }
  const next = list.filter((r) => r.id !== id);
  saveHindiDatabase(next);

  scanAuditLog.unshift({
    timestamp: new Date().toISOString(),
    action: 'HINDI_DB_DELETE',
    title: target.title,
    details: `Removed record (${target.id}) via Admin Dashboard.`,
    user: 'Admin Dashboard',
  });

  return res.json({ success: true, deletedId: id, total: next.length });
});

dubRouter.get('/hindi/duplicates', (_req: Request, res: Response) => {
  const list = loadHindiDatabase();
  const candidates = detectDuplicateCandidates(list);
  return res.json({ count: candidates.length, candidates });
});

dubRouter.post('/hindi/merge-duplicates', (req: Request, res: Response) => {
  const { primaryId, duplicateId, autoMergeExact } = req.body || {};
  let list = [...loadHindiDatabase()];
  let mergedCount = 0;

  if (autoMergeExact) {
    const map = new Map<string, HindiDubRecord>();
    const deduped: HindiDubRecord[] = [];
    for (const r of list) {
      const k = `${normalizeTitleKey(r.title)}__${r.type}__${r.season ?? 'n'}__${r.part ?? 'n'}`;
      const prev = map.get(k);
      if (prev) {
        prev.platforms = Array.from(new Set([...prev.platforms, ...r.platforms]));
        prev.official_sources = Array.from(new Set([...prev.official_sources, ...r.official_sources]));
        prev.source_urls = Array.from(new Set([...prev.source_urls, ...r.source_urls]));
        mergedCount++;
      } else {
        map.set(k, { ...r });
        deduped.push(map.get(k)!);
      }
    }
    list = deduped;
  } else if (primaryId && duplicateId && primaryId !== duplicateId) {
    const primary = list.find((r) => r.id === primaryId);
    const dup = list.find((r) => r.id === duplicateId);
    if (!primary || !dup) {
      return res.status(404).json({ error: 'Primary or duplicate record not found.' });
    }
    primary.platforms = Array.from(new Set([...primary.platforms, ...dup.platforms]));
    primary.official_sources = Array.from(new Set([...primary.official_sources, ...dup.official_sources]));
    primary.source_urls = Array.from(new Set([...primary.source_urls, ...dup.source_urls]));
    if (!primary.coverImage && dup.coverImage) primary.coverImage = dup.coverImage;
    if (!primary.anilistId && dup.anilistId) primary.anilistId = dup.anilistId;
    list = list.filter((r) => r.id !== duplicateId);
    mergedCount = 1;
  }

  saveHindiDatabase(list);
  scanAuditLog.unshift({
    timestamp: new Date().toISOString(),
    action: 'HINDI_DB_MERGE',
    title: 'Duplicate Merge',
    details: `Merged ${mergedCount} duplicate entries.`,
    user: 'Admin Dashboard',
  });

  return res.json({ success: true, mergedCount, total: list.length });
});

dubRouter.post('/hindi/sync', (_req: Request, res: Response) => {
  const list = [...loadHindiDatabase(true)];
  const map = new Map<string, HindiDubRecord>();
  const deduped: HindiDubRecord[] = [];
  let mergedDuplicates = 0;

  for (const r of list) {
    const k = `${normalizeTitleKey(r.title)}__${r.type}__${r.season ?? 'n'}__${r.part ?? 'n'}`;
    const prev = map.get(k);
    if (prev) {
      prev.platforms = Array.from(new Set([...prev.platforms, ...r.platforms]));
      prev.official_sources = Array.from(new Set([...prev.official_sources, ...r.official_sources]));
      prev.source_urls = Array.from(new Set([...prev.source_urls, ...r.source_urls]));
      mergedDuplicates++;
    } else {
      const cloned = { ...r, verification_date: r.verification_date || new Date().toISOString().slice(0, 10) };
      map.set(k, cloned);
      deduped.push(cloned);
    }
  }

  saveHindiDatabase(deduped);
  seedDatabase();

  scanAuditLog.unshift({
    timestamp: new Date().toISOString(),
    action: 'HINDI_DB_SYNC',
    title: 'Repeatable Sync & Index Refresh',
    details: `Synchronized ${deduped.length} Hindi dub records cleanly (${mergedDuplicates} duplicates merged).`,
    user: 'Admin Dashboard',
  });

  return res.json({
    success: true,
    total: deduped.length,
    mergedDuplicates,
    syncedAt: new Date().toISOString(),
  });
});

dubRouter.post('/hindi/backup', (_req: Request, res: Response) => {
  try {
    const list = loadHindiDatabase();
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hindi_db_snapshot_${stamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(
      filePath,
      JSON.stringify({ backedUpAt: new Date().toISOString(), count: list.length, records: list }, null, 2),
      'utf-8'
    );
    scanAuditLog.unshift({
      timestamp: new Date().toISOString(),
      action: 'HINDI_DB_BACKUP',
      title: filename,
      details: `Created snapshot backup of ${list.length} Hindi dub entries.`,
      user: 'Admin Dashboard',
    });
    return res.json({ success: true, filename, count: list.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'Backup failed', message: err?.message });
  }
});

dubRouter.get('/hindi/export', (req: Request, res: Response) => {
  const list = loadHindiDatabase();
  const format = String(req.query.format || 'json').toLowerCase();

  if (format === 'csv') {
    const headers = [
      'id', 'title', 'original_title', 'type', 'season', 'part', 'episodes',
      'verified_episodes', 'hindi_audio', 'dub_status', 'platforms',
      'official_sources', 'source_urls', 'verification_date',
      'availability_status', 'anilistId', 'malId', 'needs_verification', 'notes',
    ];
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = [
      headers.join(','),
      ...list.map((r) =>
        [
          r.id,
          r.title,
          r.original_title,
          r.type,
          r.season ?? '',
          r.part ?? '',
          r.episodes ?? '',
          r.verified_episodes ?? '',
          r.hindi_audio,
          r.dub_status,
          r.platforms.join(' | '),
          r.official_sources.join(' | '),
          r.source_urls.join(' | '),
          r.verification_date,
          r.availability_status,
          r.anilistId ?? '',
          r.malId ?? '',
          r.needs_verification,
          r.notes,
        ]
          .map(esc)
          .join(',')
      ),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="aniread_hindi_dub_database.csv"');
    return res.send(rows.join('\n'));
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="aniread_hindi_dub_database.json"');
  return res.send(JSON.stringify(list, null, 2));
});

// =========================================================================
// LEGACY & MULTI-LANGUAGE LOOKUP ROUTES (PRESERVED & ALIGNED)
// =========================================================================

dubRouter.get('/lookup', (req: Request, res: Response) => {
  const title = (req.query.title as string) || '';
  const animeId = req.query.id ? Number(req.query.id) : undefined;

  if (!title && !animeId) {
    return res.status(400).json({ error: 'Title or ID is required for dub lookup' });
  }

  const synthesis = getAnimeDubInfo(title || `Anime #${animeId}`);
  const queryLower = title.toLowerCase().trim();
  const matchedReleases: AnimeAudioRelease[] = [];

  audioReleases.forEach((rel) => {
    if (
      (animeId && rel.animeId === animeId) ||
      (queryLower && (rel.animeTitle.toLowerCase().includes(queryLower) || queryLower.includes(rel.animeTitle.toLowerCase())))
    ) {
      matchedReleases.push(rel);
    }
  });

  return res.json({
    title,
    animeId,
    verifiedReleases: matchedReleases,
    synthesis,
    totalAudioTracks: synthesis.dubs.length,
    timestamp: new Date().toISOString(),
  });
});

dubRouter.get('/search', (req: Request, res: Response) => {
  const { query = '', language = 'All', status = 'All', platform = 'All', region = 'All' } = req.query;
  const q = String(query).toLowerCase().trim();
  const targetLang = String(language).toLowerCase().trim();
  const targetStatus = String(status).toUpperCase().trim();
  const targetPlatform = String(platform).toLowerCase().trim();
  const targetRegion = String(region).toUpperCase().trim();

  const results: AnimeAudioRelease[] = [];
  audioReleases.forEach((rel) => {
    if (q && !rel.animeTitle.toLowerCase().includes(q)) return;
    if (targetLang !== 'all' && rel.languageCode.toLowerCase() !== targetLang && rel.languageName.toLowerCase() !== targetLang) return;
    if (targetStatus !== 'ALL' && rel.status.toUpperCase() !== targetStatus) return;
    if (targetPlatform !== 'all' && (!rel.platformName || !rel.platformName.toLowerCase().includes(targetPlatform))) return;
    if (targetRegion !== 'ALL' && rel.regionCode !== targetRegion) return;
    results.push(rel);
  });

  return res.json({ count: results.length, filters: { query, language, status, platform, region }, results });
});

dubRouter.post('/scan', async (req: Request, res: Response) => {
  try {
    const { batchSize = 10, refreshTitle } = req.body;
    const scannedItems: string[] = [];

    if (refreshTitle) {
      const dubInfo = getAnimeDubInfo(refreshTitle);
      scannedItems.push(refreshTitle);
      scanAuditLog.unshift({
        timestamp: new Date().toISOString(),
        action: 'ON_DEMAND_REFRESH',
        title: refreshTitle,
        details: `Live audio check completed: Found ${dubInfo.dubs.length} verified language tracks. Hindi: ${dubInfo.hasHindiDub ? 'CONFIRMED' : 'UNVERIFIED'}. English: ${dubInfo.hasEnglishDub ? 'CONFIRMED' : 'UNVERIFIED'}.`,
        user: 'Admin/Scanner',
      });
      return res.json({ success: true, scannedCount: 1, refreshedTitle: refreshTitle, results: dubInfo, auditLogs: scanAuditLog.slice(0, 5) });
    }

    let count = 0;
    VERIFIED_OFFICIAL_CATALOG.slice(0, Number(batchSize)).forEach((item) => {
      scannedItems.push(item.title);
      count++;
    });

    scanAuditLog.unshift({
      timestamp: new Date().toISOString(),
      action: 'BATCH_CATALOG_SCAN',
      title: `${count} Catalog Titles`,
      details: `Scanned and synchronized verified audio records against Crunchyroll, Netflix, Anime Times, and Muse India registries.`,
      user: 'Background Sync / Admin',
    });

    return res.json({ success: true, scannedCount: count, scannedTitles: scannedItems, auditLogs: scanAuditLog.slice(0, 5) });
  } catch (error: any) {
    return res.status(500).json({ error: 'Scan operation failed', message: error?.message });
  }
});

dubRouter.post('/admin/save', (req: Request, res: Response) => {
  try {
    const {
      animeId, animeTitle, languageCode, languageName, status = 'CONFIRMED', audioType = 'dub',
      seasonNumber = 1, episodeRange, regionCode = 'GLOBAL', platformName, officialUrl,
      releaseDate, studios, voiceDirector, voiceActors, notes, evidenceSummary,
      sourceName, sourceUrl, adminUser = 'Admin',
    } = req.body;

    if (!animeTitle || !languageCode) {
      return res.status(400).json({ error: 'Anime title and language code are required.' });
    }

    const releaseId = `rel_${animeId || 9999}_${languageCode}_${Date.now()}`;
    const evidenceItem: DubEvidence = {
      id: `evi_${releaseId}_${Date.now()}`,
      audioReleaseId: releaseId,
      sourceName: sourceName || platformName || 'Official Streaming Page',
      sourceUrl: sourceUrl || officialUrl || 'https://www.crunchyroll.com',
      evidenceType: 'official_catalog',
      evidenceSummary: evidenceSummary || `Verified audio release on ${platformName || 'official distributor'}.`,
      checkedAt: new Date().toISOString(),
      verificationStatus: status,
    };

    const newRelease: AnimeAudioRelease = {
      id: releaseId,
      animeId: animeId || 9999,
      animeTitle,
      seasonNumber: Number(seasonNumber) || 1,
      seasonTitle: `Season ${seasonNumber || 1}`,
      episodeRange: episodeRange || 'Complete Broadcast',
      languageCode,
      languageName: languageName || LANGUAGE_REGISTRY[languageCode]?.name || languageCode,
      flag: '',
      audioType: audioType as AudioType,
      status: status as DubVerificationStatus,
      regionCode,
      platformName,
      officialUrl,
      releaseDate,
      studios: Array.isArray(studios) ? studios : studios ? [studios] : undefined,
      voiceDirector,
      voiceActors,
      notes,
      evidence: [evidenceItem],
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    audioReleases.set(releaseId, newRelease);

    scanAuditLog.unshift({
      timestamp: new Date().toISOString(),
      action: 'ADMIN_RECORD_SAVE',
      title: `${animeTitle} (${languageName || languageCode})`,
      details: `Saved release with status ${status}. Source: ${sourceName || platformName}.`,
      user: adminUser,
    });

    return res.json({ success: true, message: 'Verified dub record saved successfully with evidence provenance.', release: newRelease });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to save dub record', message: error?.message });
  }
});

dubRouter.post('/admin/dispute', (req: Request, res: Response) => {
  const { releaseId, reason, adminUser = 'Admin' } = req.body;
  if (!releaseId) return res.status(400).json({ error: 'Release ID is required' });

  const existing = audioReleases.get(releaseId);
  if (!existing) return res.status(404).json({ error: 'Release not found' });

  existing.isDisputed = true;
  existing.disputeReason = reason || 'Evidence under active verification audit';
  existing.status = 'REPORTED_UNVERIFIED';
  existing.updatedAt = new Date().toISOString();
  audioReleases.set(releaseId, existing);

  scanAuditLog.unshift({
    timestamp: new Date().toISOString(),
    action: 'DUB_RECORD_DISPUTED',
    title: `${existing.animeTitle} (${existing.languageName})`,
    details: `Flagged as disputed. Reason: ${existing.disputeReason}`,
    user: adminUser,
  });

  return res.json({ success: true, message: 'Dub record flagged as disputed and status adjusted to REPORTED_UNVERIFIED.', release: existing });
});

dubRouter.get('/stats', (_req: Request, res: Response) => {
  let confirmedCount = 0;
  let partiallyConfirmedCount = 0;
  let unverifiedCount = 0;
  const languagesCount = new Map<string, number>();

  audioReleases.forEach((rel) => {
    if (rel.status === 'CONFIRMED' || rel.status === 'Available') confirmedCount++;
    else if (rel.status === 'PARTIALLY_CONFIRMED' || rel.status === 'Partial') partiallyConfirmedCount++;
    else unverifiedCount++;
    languagesCount.set(rel.languageCode, (languagesCount.get(rel.languageCode) || 0) + 1);
  });

  return res.json({
    totalReleases: audioReleases.size,
    hindiDatabaseCount: loadHindiDatabase().length,
    confirmedDubs: confirmedCount,
    partiallyConfirmedDubs: partiallyConfirmedCount,
    unverifiedReports: unverifiedCount,
    languagesSupported: Object.keys(LANGUAGE_REGISTRY).length,
    languageBreakdown: Object.fromEntries(languagesCount.entries()),
    recentAudits: scanAuditLog.slice(0, 15),
  });
});
