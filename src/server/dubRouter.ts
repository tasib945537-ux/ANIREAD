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

// Hindi dub registry is read-only in the public app. Admin mutation routes are removed.

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

// No public write or admin endpoints are exposed for dub records.

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
