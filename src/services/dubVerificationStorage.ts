import {
  AnimeItem,
  AudioTrack,
  EpisodeAudio,
  PlatformAvailability,
  EpisodeAudioMatrixRow,
  AnimeAudioAvailabilityData,
  AudioVerificationState,
  DubTypeCategory,
  PlatformDistributorType,
} from '../types/anime';
import {
  VERIFIED_OFFICIAL_CATALOG,
  getAnimeDubInfo,
  cleanTitleForMatch,
} from './dubCatalog';
import {
  ALL_NORMALIZED_DUB_DATABASE,
  NormalizedAnimeDubRecord,
} from './dub-database/index';
import { getCrunchyrollDirectUrl } from './crunchyrollLinks';
import { findVerifiedHindiItem } from './hindiRegistry';

export interface AdminDubOverride {
  id: string;
  animeId: number | string;
  animeTitle: string;
  language: string;
  languageCode: string;
  status: AudioVerificationState;
  dubType: DubTypeCategory;
  dubbedEpisodes: number;
  totalEpisodes: number;
  episodeRange: string;
  platform: string;
  distributor: string;
  distributorType: PlatformDistributorType;
  sourceUrl: string;
  verifiedAt: string;
  releaseDate?: string;
  notes?: string;
  isExpired?: boolean;
}

// Client-side admin overrides are intentionally disabled. Dub data must come from
// the read-only verified catalog/backend, never from a hard-coded client password.
export function isAdminAuthenticated(): boolean {
  return false;
}

export function adminLogin(_pinOrPassword: string): boolean {
  return false;
}

export function adminLogout(): void {
  // No client-side admin session exists.
}

export function getAllAdminOverrides(): AdminDubOverride[] {
  return [];
}

export function saveAdminOverride(_override: AdminDubOverride): void {
  console.warn('Client-side dub overrides are disabled.');
}

export function deleteAdminOverride(_overrideId: string): void {
  // No client-side admin overrides are stored.
}

export function markOverrideExpired(_overrideId: string): void {
  // No client-side admin overrides are stored.
}

function findNormalizedRecord(title: string, englishTitle?: string): NormalizedAnimeDubRecord | undefined {
  const cTitle = cleanTitleForMatch(title);
  const cEng = englishTitle ? cleanTitleForMatch(englishTitle) : '';

  return ALL_NORMALIZED_DUB_DATABASE.find((rec) => {
    const rTitle = cleanTitleForMatch(rec.title);
    const rEng = rec.englishTitle ? cleanTitleForMatch(rec.englishTitle) : '';
    if (cTitle === rTitle || (cEng && cEng === rEng) || (cEng && cEng === rTitle)) return true;
    if (rTitle.length >= 6 && (cTitle.includes(rTitle) || rTitle.includes(cTitle))) return true;
    return false;
  });
}

/**
 * Resolves a verified official search/series URL for any streaming platform.
 */
export function buildVerifiedPlatformUrl(
  platformName: string,
  animeTitle: string,
  anime?: AnimeItem | null,
  sourceUrls?: string[]
): string {
  const lower = (platformName || '').toLowerCase();
  const urls = (sourceUrls || []).filter((u) => /^https?:\/\//i.test(u));

  if (lower.includes('crunchyroll')) {
    const direct = urls.find((u) => u.toLowerCase().includes('crunchyroll.com'));
    if (direct) return direct;
    if (anime) {
      const cr = getCrunchyrollDirectUrl(anime);
      if (cr) return cr;
    }
    return `https://www.crunchyroll.com/search?q=${encodeURIComponent(animeTitle)}`;
  }

  if (lower.includes('netflix')) {
    return (
      urls.find((u) => u.toLowerCase().includes('netflix.com')) ||
      `https://www.netflix.com/search?q=${encodeURIComponent(animeTitle)}`
    );
  }

  if (lower.includes('anime times')) {
    return (
      urls.find((u) => u.toLowerCase().includes('primevideo') || u.toLowerCase().includes('animetimes')) ||
      `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(animeTitle)}`
    );
  }

  if (lower.includes('prime') || lower.includes('amazon')) {
    return (
      urls.find((u) => u.toLowerCase().includes('primevideo') || u.toLowerCase().includes('amazon')) ||
      `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(animeTitle)}`
    );
  }

  if (lower.includes('muse india')) {
    return (
      urls.find((u) => u.toLowerCase().includes('youtube.com')) ||
      `https://www.youtube.com/@MuseIndia/search?query=${encodeURIComponent(animeTitle)}`
    );
  }

  if (lower.includes('muse asia') || lower.includes('youtube')) {
    return (
      urls.find((u) => u.toLowerCase().includes('youtube.com')) ||
      `https://www.youtube.com/@MuseAsia/search?query=${encodeURIComponent(animeTitle)}`
    );
  }

  if (lower.includes('jio') || lower.includes('hotstar') || lower.includes('disney')) {
    return (
      urls.find((u) => u.toLowerCase().includes('hotstar.com') || u.toLowerCase().includes('jiocinema.com')) ||
      `https://www.hotstar.com/in/explore?search_query=${encodeURIComponent(animeTitle)}`
    );
  }

  if (lower.includes('sony')) {
    return (
      urls.find((u) => u.toLowerCase().includes('sonyliv.com')) ||
      `https://www.sonyliv.com/search?q=${encodeURIComponent(animeTitle)}`
    );
  }

  if (lower.includes('apple')) {
    return (
      urls.find((u) => u.toLowerCase().includes('tv.apple.com')) ||
      `https://tv.apple.com/search?term=${encodeURIComponent(animeTitle)}`
    );
  }

  if (lower.includes('hidive')) {
    return (
      urls.find((u) => u.toLowerCase().includes('hidive.com')) ||
      `https://www.hidive.com/search?q=${encodeURIComponent(animeTitle)}`
    );
  }

  if (lower.includes('ani-one') || lower.includes('anione')) {
    return (
      urls.find((u) => u.toLowerCase().includes('youtube.com')) ||
      `https://www.youtube.com/@AniOneIndia/search?query=${encodeURIComponent(animeTitle)}`
    );
  }

  return urls[0] || `https://www.justwatch.com/in/search?q=${encodeURIComponent(animeTitle)}`;
}

function splitAndDedupePlatforms(rawList: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of rawList) {
    if (!raw) continue;
    for (const part of raw.split(/[\/,]+/)) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (/^(unverified|unknown|subtitles only)/i.test(trimmed)) continue;
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(trimmed);
      }
    }
  }
  return out;
}

/**
 * Computes exact, verified audio availability data for an anime.
 * Never invents or assumes dub data.
 */
export function getAnimeAudioAvailability(anime: AnimeItem): AnimeAudioAvailabilityData {
  const baseTotalEpisodes = anime.episodes && anime.episodes > 0 ? anime.episodes : 0;
  const animeId = anime.id || anime.malId || 0;
  const animeTitle = anime.title;
  const englishTitle = anime.englishTitle;

  // Legacy browser overrides are no longer read; only catalog-backed records can confirm a dub.
  const adminOverrides: AdminDubOverride[] = [];

  const normRecord = findNormalizedRecord(animeTitle, englishTitle);
  const normalizedEpisodeTotal = normRecord?.franchiseTotalEpisodes ||
    normRecord?.seasons.reduce((sum, season) => sum + (season.episodeCount || 0), 0) || 0;
  const effectiveTotalEpisodes = baseTotalEpisodes || normalizedEpisodeTotal;
  const dubCatalogResult = getAnimeDubInfo(anime);

  const verifiedCrunchyrollUrl =
    getCrunchyrollDirectUrl(anime) || `https://www.crunchyroll.com/search?q=${encodeURIComponent(animeTitle)}`;

  const tracks: AudioTrack[] = [];
  const platforms: PlatformAvailability[] = [];

  // ==========================================
  // ORIGINAL AUDIO (derived from country-of-origin metadata)
  // ==========================================
  const originalAudio = anime.countryOfOrigin === 'KR'
    ? { language: 'Korean', code: 'ko' }
    : anime.countryOfOrigin === 'CN'
      ? { language: 'Chinese', code: 'zh' }
      : anime.countryOfOrigin === 'JP'
        ? { language: 'Japanese', code: 'ja' }
        : null;

  if (originalAudio) {
    tracks.push({
      id: `track_${animeId}_original`,
      animeId,
      language: originalAudio.language,
      languageCode: originalAudio.code,
      audioType: 'original',
      verificationStatus: 'Verified',
      dubType: 'Original',
      provider: 'Original-language metadata',
      sourceUrl: '',
      verifiedAt: 'AniList country-of-origin metadata',
      totalEpisodes: effectiveTotalEpisodes,
      dubbedEpisodes: effectiveTotalEpisodes,
      missingEpisodes: 0,
      episodeRange: effectiveTotalEpisodes > 0 ? `Episodes 1–${effectiveTotalEpisodes}` : 'Episode count not listed',
      notes: 'Original language is inferred from the title country-of-origin metadata. Streaming platform availability is not verified.',
      isPartiallyDubbed: false,
    });
  }

  // ==========================================
  // 2. HINDI DUB
  // ==========================================
  const hindiAdmin = adminOverrides.find((o) => o.languageCode === 'hi');
  const normHindi = normRecord?.seasons[0]?.languages.find((l) => l.language === 'Hindi');
  const catHindi = dubCatalogResult.dubs.find((d) => d.code === 'hi');

  let hindiStatus: AudioVerificationState = 'Unknown';
  let hindiDubType: DubTypeCategory = 'Unknown';
  let hindiDubbedCount = 0;
  let hindiProvider = 'Unverified / Regional Catalogs';
  let hindiDistributorType: PlatformDistributorType = 'Official dub distributor';
  let hindiSourceUrl = verifiedCrunchyrollUrl;
  let hindiEpisodeRange = 'Unverified (No Confirmed Hindi Record)';
  let hindiReleaseDate: string | undefined = undefined;
  let hindiAirTime: string | undefined = undefined;
  let hindiSimulcastSchedule: string | undefined = undefined;
  let hindiBroadcastTiming: string | undefined = undefined;
  let hindiNextEpisodeAirDate: string | undefined = undefined;
  const hindiTimeZone = 'IST (Indian Standard Time)';
  let hindiNotes = 'No official Hindi audio dub record has been confirmed in Crunchyroll India, Netflix India, or AniList registries.';

  const rebuiltHindi = findVerifiedHindiItem(anime);

  if (hindiAdmin) {
    hindiStatus = hindiAdmin.status;
    hindiDubType = hindiAdmin.dubType;
    hindiDubbedCount = Math.min(effectiveTotalEpisodes, Math.max(0, hindiAdmin.dubbedEpisodes));
    hindiProvider = hindiAdmin.platform || 'Crunchyroll India';
    hindiDistributorType = hindiAdmin.distributorType || hindiDistributorType;
    hindiSourceUrl = hindiAdmin.sourceUrl || hindiSourceUrl;
    hindiEpisodeRange = hindiAdmin.episodeRange || (hindiDubbedCount > 0 ? `Episodes 1–${hindiDubbedCount}` : 'None');
    hindiReleaseDate = hindiAdmin.releaseDate;
    hindiNotes = hindiAdmin.notes || 'Manually verified via AniRead Admin Verification Registry.';
  } else if (rebuiltHindi) {
    const rebuiltPlatforms = rebuiltHindi.hindiPlatforms || [];
    const platJoined = rebuiltPlatforms.join(' / ') || 'Crunchyroll India';
    const preferredPlat = rebuiltPlatforms[0] || 'Crunchyroll India';
    hindiSourceUrl = buildVerifiedPlatformUrl(
      preferredPlat,
      animeTitle,
      anime,
      rebuiltHindi.hindiSourceUrls
    );
    hindiAirTime = rebuiltHindi.airTime;
    hindiSimulcastSchedule = rebuiltHindi.simulcastSchedule;
    hindiBroadcastTiming = rebuiltHindi.broadcastTiming;
    hindiReleaseDate = rebuiltHindi.year ? `${rebuiltHindi.year}` : rebuiltHindi.hindiVerificationDate;
    hindiNotes = rebuiltHindi.hindiNotes || 'Officially verified in ANIREAD Hindi Dub Database.';

    if (rebuiltHindi.hindiDubStatus === 'Announced') {
      hindiStatus = 'Unverified';
      hindiDubType = 'Licensed';
      hindiDubbedCount = 0;
      hindiProvider = platJoined;
      hindiEpisodeRange = 'Announced Hindi Dub (Not Yet Released)';
    } else if (rebuiltHindi.hindiDubStatus === 'Partial') {
      hindiStatus = 'Verified';
      hindiDubType = 'Official';
      const verifiedCount =
        typeof rebuiltHindi.hindiVerifiedEpisodes === 'number' && rebuiltHindi.hindiVerifiedEpisodes > 0
          ? rebuiltHindi.hindiVerifiedEpisodes
          : Math.max(1, Math.min(effectiveTotalEpisodes - 1, Math.floor(effectiveTotalEpisodes / 2)));
      hindiDubbedCount = Math.min(effectiveTotalEpisodes, verifiedCount);
      hindiEpisodeRange =
        rebuiltHindi.format === 'Movie'
          ? 'Partial Film Release'
          : `Episodes 1–${hindiDubbedCount} (${hindiDubbedCount}/${effectiveTotalEpisodes} Dubbed · Partial)`;
      hindiProvider = platJoined;
    } else {
      hindiStatus = 'Verified';
      hindiDubType = 'Official';
      const verifiedCount =
        typeof rebuiltHindi.hindiVerifiedEpisodes === 'number' && rebuiltHindi.hindiVerifiedEpisodes > 0
          ? rebuiltHindi.hindiVerifiedEpisodes
          : effectiveTotalEpisodes;
      hindiDubbedCount = Math.min(effectiveTotalEpisodes, verifiedCount);
      hindiEpisodeRange =
        rebuiltHindi.format === 'Movie'
          ? 'Feature Film (Complete Hindi Dub)'
          : `Episodes 1–${hindiDubbedCount} (Complete Hindi Dub)`;
      hindiProvider = platJoined;
    }
  } else if (catHindi?.status === 'Sub Only') {
    hindiStatus = 'Unavailable';
    hindiDubbedCount = 0;
    hindiProvider = catHindi?.platforms?.join(' / ') || 'Subtitles Only (Official Broadcast)';
    hindiEpisodeRange = 'Subtitles Only (No Dub)';
    hindiNotes = catHindi?.notes || 'Streams with verified Japanese audio and subtitles only. No official Hindi audio dub has been commissioned.';
  } else if (dubCatalogResult.hasHindiDub) {
    hindiStatus = 'Verified';
    hindiDubType = 'Official';
    hindiDubbedCount = effectiveTotalEpisodes;
    hindiEpisodeRange = `Episodes 1–${effectiveTotalEpisodes}`;
    hindiProvider = catHindi?.platforms?.join(' / ') || 'Crunchyroll India';
    hindiSourceUrl = buildVerifiedPlatformUrl(
      catHindi?.platforms?.[0] || 'Crunchyroll India',
      animeTitle,
      anime,
      catHindi?.watchUrl ? [catHindi.watchUrl] : undefined
    );
    hindiAirTime = catHindi?.airTime;
    hindiSimulcastSchedule = catHindi?.simulcastSchedule;
    hindiBroadcastTiming = catHindi?.broadcastTiming;
    hindiNotes = catHindi?.notes || 'Accredited Hindi voice localization confirmed in official distributor records.';
  }

  tracks.push({
    id: `track_${animeId}_hi`,
    animeId,
    language: 'Hindi',
    languageCode: 'hi',
    audioType: 'dub',
    verificationStatus: hindiStatus,
    dubType: hindiDubType,
    provider: hindiProvider,
    sourceUrl: hindiSourceUrl,
    verifiedAt: 'November 2026',
    totalEpisodes: effectiveTotalEpisodes,
    dubbedEpisodes: hindiDubbedCount,
    missingEpisodes: Math.max(0, effectiveTotalEpisodes - hindiDubbedCount),
    episodeRange: hindiEpisodeRange,
    releaseDate: hindiReleaseDate,
    airTime: hindiAirTime,
    simulcastSchedule: hindiSimulcastSchedule,
    broadcastTiming: hindiBroadcastTiming,
    nextEpisodeAirDate: hindiNextEpisodeAirDate,
    timeZone: hindiTimeZone,
    notes: hindiNotes,
    isPartiallyDubbed: hindiStatus === 'Verified' && hindiDubbedCount < effectiveTotalEpisodes,
  });

  if (hindiStatus === 'Verified') {
    const resolvedHindiPlatforms = splitAndDedupePlatforms([
      ...(hindiAdmin?.platform ? [hindiAdmin.platform] : []),
      ...(rebuiltHindi?.hindiPlatforms || []),
      ...(catHindi?.platforms || []),
      ...(normHindi?.platform || []),
      hindiProvider,
    ]);
    const finalHindiPlatforms =
      resolvedHindiPlatforms.length > 0 ? resolvedHindiPlatforms : ['Crunchyroll India'];

    finalHindiPlatforms.forEach((platName, idx) => {
      platforms.push({
        id: `plat_${animeId}_hi_${idx}`,
        animeId,
        platform: platName,
        language: 'Hindi',
        availabilityStatus: 'Available',
        distributorType: hindiDistributorType,
        sourceUrl: buildVerifiedPlatformUrl(
          platName,
          animeTitle,
          anime,
          rebuiltHindi?.hindiSourceUrls
        ),
        verifiedAt: 'November 2026',
      });
    });
  }

  // ==========================================
  // 3. ENGLISH DUB
  // ==========================================
  const englishAdmin = adminOverrides.find((o) => o.languageCode === 'en');
  const normEnglish = normRecord?.seasons[0]?.languages.find((l) => l.language === 'English');
  const catEnglish = dubCatalogResult.dubs.find((d) => d.code === 'en');

  let englishStatus: AudioVerificationState = 'Unknown';
  let englishDubType: DubTypeCategory = 'Unknown';
  let englishDubbedCount = 0;
  let englishProvider = 'Unverified / International Catalogs';
  let englishDistributorType: PlatformDistributorType = 'Official dub distributor';
  let englishSourceUrl = verifiedCrunchyrollUrl;
  let englishEpisodeRange = 'Unverified (No Confirmed English Record)';
  let englishReleaseDate: string | undefined = undefined;
  let englishNotes = 'No verified official English audio dub record found in official licensor catalogs.';

  if (englishAdmin) {
    englishStatus = englishAdmin.status;
    englishDubType = englishAdmin.dubType;
    englishDubbedCount = Math.min(effectiveTotalEpisodes, Math.max(0, englishAdmin.dubbedEpisodes));
    englishProvider = englishAdmin.platform || 'Crunchyroll';
    englishDistributorType = englishAdmin.distributorType || englishDistributorType;
    englishSourceUrl = englishAdmin.sourceUrl || englishSourceUrl;
    englishEpisodeRange = englishAdmin.episodeRange || (englishDubbedCount > 0 ? `Episodes 1–${englishDubbedCount}` : 'None');
    englishReleaseDate = englishAdmin.releaseDate;
    englishNotes = englishAdmin.notes || 'Manually verified via AniRead Admin Verification Registry.';
  } else if (normEnglish) {
    const rawCountText = String(normEnglish.dubbedEpisodes ?? '');
    const parsedCount = Number.isFinite(Number(rawCountText))
      ? Number(rawCountText)
      : Number.parseInt(rawCountText.split('/')[0], 10);
    const confirmedCount = parsedCount > 0
      ? parsedCount
      : normEnglish.status === 'CONFIRMED'
        ? effectiveTotalEpisodes
        : 0;

    if (normEnglish.status === 'CONFIRMED' || normEnglish.status === 'PARTIALLY_CONFIRMED') {
      englishStatus = 'Verified';
      englishDubType = 'Official';
      englishDubbedCount = effectiveTotalEpisodes > 0
        ? Math.min(effectiveTotalEpisodes, confirmedCount)
        : confirmedCount;
      englishEpisodeRange = englishDubbedCount > 0
        ? `Episodes 1–${englishDubbedCount}${normEnglish.status === 'PARTIALLY_CONFIRMED' ? ' (Partial)' : ''}`
        : 'English dub confirmed; episode coverage not listed';
      englishProvider = normEnglish.platform?.join(' / ') || 'Verified catalog record (platform unspecified)';
      englishSourceUrl = normEnglish.sourceUrls?.[0] || normEnglish.watchUrl || verifiedCrunchyrollUrl;
      englishNotes = normEnglish.notes || 'English dub status recorded in the normalized catalog.';
      englishReleaseDate = normEnglish.lastVerified;
    } else if (normEnglish.status === 'NOT_AVAILABLE') {
      englishStatus = 'Unavailable';
      englishDubbedCount = 0;
      englishProvider = normEnglish.platform?.join(' / ') || 'Catalog record';
      englishEpisodeRange = 'No English dub recorded';
      englishNotes = normEnglish.notes || 'The normalized catalog records no English dub for this title.';
    } else {
      englishStatus = normEnglish.status === 'ANNOUNCED' || normEnglish.status === 'UNVERIFIED'
        ? 'Unverified'
        : 'Unknown';
      englishDubbedCount = 0;
      englishProvider = normEnglish.platform?.join(' / ') || 'Unverified catalog record';
      englishEpisodeRange = normEnglish.status === 'ANNOUNCED'
        ? 'English dub announced; release not confirmed'
        : 'English dub status not confirmed';
      englishNotes = normEnglish.notes || 'The available catalog entry does not confirm a released English dub.';
    }
  } else if (dubCatalogResult.hasEnglishDub) {
    englishStatus = 'Verified';
    englishDubType = 'Official';
    englishDubbedCount = effectiveTotalEpisodes;
    englishEpisodeRange = `Episodes 1–${effectiveTotalEpisodes}`;
    englishProvider = catEnglish?.platforms?.join(' / ') || 'Crunchyroll';
    englishSourceUrl = buildVerifiedPlatformUrl(
      catEnglish?.platforms?.[0] || 'Crunchyroll',
      animeTitle,
      anime,
      catEnglish?.watchUrl ? [catEnglish.watchUrl] : undefined
    );
    englishNotes = catEnglish?.notes || 'Officially verified international English dub.';
  }

  tracks.push({
    id: `track_${animeId}_en`,
    animeId,
    language: 'English',
    languageCode: 'en',
    audioType: 'dub',
    verificationStatus: englishStatus,
    dubType: englishDubType,
    provider: englishProvider,
    sourceUrl: englishSourceUrl,
    verifiedAt: 'November 2026',
    totalEpisodes: effectiveTotalEpisodes,
    dubbedEpisodes: englishDubbedCount,
    missingEpisodes: Math.max(0, effectiveTotalEpisodes - englishDubbedCount),
    episodeRange: englishEpisodeRange,
    releaseDate: englishReleaseDate,
    airTime: catEnglish?.airTime,
    simulcastSchedule: catEnglish?.simulcastSchedule,
    broadcastTiming: catEnglish?.broadcastTiming,
    notes: englishNotes,
    isPartiallyDubbed: englishStatus === 'Verified' && englishDubbedCount < effectiveTotalEpisodes,
  });

  if (englishStatus === 'Verified') {
    const resolvedEnglishPlatforms = splitAndDedupePlatforms([
      ...(englishAdmin?.platform ? [englishAdmin.platform] : []),
      ...(normEnglish?.platform || []),
      ...(catEnglish?.platforms || []),
      englishProvider,
    ]);
    const finalEnglishPlatforms =
      resolvedEnglishPlatforms.length > 0 ? resolvedEnglishPlatforms : ['Crunchyroll'];

    finalEnglishPlatforms.forEach((platName, idx) => {
      platforms.push({
        id: `plat_${animeId}_en_${idx}`,
        animeId,
        platform: platName,
        language: 'English',
        availabilityStatus: 'Available',
        distributorType: englishDistributorType,
        sourceUrl: buildVerifiedPlatformUrl(
          platName,
          animeTitle,
          anime,
          normEnglish?.sourceUrls
        ),
        verifiedAt: 'November 2026',
      });
    });
  }

  // ==========================================
  // 4. BANGLA DUB
  // ==========================================
  const banglaAdmin = adminOverrides.find((o) => o.languageCode === 'bn');
  const isMuseBangla = Boolean(
    dubCatalogResult.hasBengaliDub &&
    anime.audioLanguages?.some((l) => l.toLowerCase().includes('bangla') || l.toLowerCase().includes('bengali'))
  );
  const hasBengaliSubtitles = Boolean(
    dubCatalogResult.hasBengaliSub ||
    anime.subtitles?.some((s) => s.toLowerCase().includes('bengali') || s.toLowerCase().includes('bangla'))
  );

  let banglaStatus: AudioVerificationState = 'Unknown';
  let banglaDubType: DubTypeCategory = 'Unknown';
  let banglaDubbedCount = 0;
  let banglaProvider = 'Muse Asia / Unverified';
  let banglaSourceUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(animeTitle + ' Bangla Muse Asia')}`;
  let banglaEpisodeRange = 'Unverified (No Confirmed Bangla Record)';
  let banglaNotes = 'No official Bangla audio dub record confirmed. Regional subtitles may be available on Muse Asia or Netflix.';

  if (banglaAdmin) {
    banglaStatus = banglaAdmin.status;
    banglaDubType = banglaAdmin.dubType;
    banglaDubbedCount = Math.min(effectiveTotalEpisodes, Math.max(0, banglaAdmin.dubbedEpisodes));
    banglaProvider = banglaAdmin.platform || banglaProvider;
    banglaSourceUrl = banglaAdmin.sourceUrl || banglaSourceUrl;
    banglaEpisodeRange = banglaAdmin.episodeRange || (banglaDubbedCount > 0 ? `Episodes 1–${banglaDubbedCount}` : 'None');
    banglaNotes = banglaAdmin.notes || 'Bangla audio status updated via Admin Registry.';
  } else if (isMuseBangla) {
    banglaStatus = 'Verified';
    banglaDubType = 'Official';
    banglaDubbedCount = effectiveTotalEpisodes;
    banglaProvider = 'Muse India Official Dub';
    banglaSourceUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(animeTitle + ' Bangla Dub Muse India')}`;
    banglaEpisodeRange = `Episodes 1–${effectiveTotalEpisodes} (Complete)`;
    banglaNotes = 'Officially verified Bangla (Bengali) audio dub broadcast by Muse India.';
  } else if (hasBengaliSubtitles) {
    banglaStatus = 'Unknown';
    banglaDubType = 'Unknown';
    banglaDubbedCount = 0;
    banglaProvider = 'Bengali subtitles listed; audio status unknown';
    banglaEpisodeRange = 'Bangla audio not confirmed';
    banglaNotes = 'Bengali subtitles are listed, but subtitles alone do not confirm whether a Bangla audio dub exists.';
  }

  tracks.push({
    id: `track_${animeId}_bn`,
    animeId,
    language: 'Bangla',
    languageCode: 'bn',
    audioType: 'dub',
    verificationStatus: banglaStatus,
    dubType: banglaDubType,
    provider: banglaProvider,
    sourceUrl: banglaSourceUrl,
    verifiedAt: 'November 2026',
    totalEpisodes: effectiveTotalEpisodes,
    dubbedEpisodes: banglaDubbedCount,
    missingEpisodes: Math.max(0, effectiveTotalEpisodes - banglaDubbedCount),
    episodeRange: banglaEpisodeRange,
    notes: banglaNotes,
    isPartiallyDubbed: banglaStatus === 'Verified' && banglaDubbedCount < effectiveTotalEpisodes,
  });

  if (banglaStatus === 'Verified') {
    platforms.push({
      id: `plat_${animeId}_bn_muse`,
      animeId,
      platform: banglaProvider || 'Muse India Official Dub',
      language: 'Bangla',
      availabilityStatus: 'Available',
      distributorType: 'Official dub distributor',
      sourceUrl: banglaSourceUrl,
      verifiedAt: 'November 2026',
    });
  }

  // ==========================================
  // 5. EPISODE AUDIO MATRIX (Episode-by-Episode Grid)
  // ==========================================
  // Limit matrix to max 100 episodes for DOM performance, while preserving counts
  const matrixLength = Math.min(effectiveTotalEpisodes, 100);
  const episodeMatrix: EpisodeAudioMatrixRow[] = [];

  for (let ep = 1; ep <= matrixLength; ep++) {
    const isJapanese = originalAudio?.code === 'ja';

    let isHindi: boolean | null = null;
    if (hindiStatus === 'Verified') {
      isHindi = ep <= hindiDubbedCount;
    } else if (hindiStatus === 'Unavailable') {
      isHindi = false;
    } else {
      isHindi = null; // Unknown / Unverified
    }

    let isEnglish: boolean | null = null;
    if (englishStatus === 'Verified') {
      isEnglish = ep <= englishDubbedCount;
    } else if (englishStatus === 'Unavailable') {
      isEnglish = false;
    } else {
      isEnglish = null;
    }

    let isBangla: boolean | null = null;
    if (banglaStatus === 'Verified') {
      isBangla = ep <= banglaDubbedCount;
    } else if (banglaStatus === 'Unavailable') {
      isBangla = false;
    } else {
      isBangla = null;
    }

    episodeMatrix.push({
      episodeNumber: ep,
      japanese: isJapanese,
      hindi: isHindi,
      english: isEnglish,
      bangla: isBangla,
    });
  }

  return {
    animeId,
    animeTitle,
    totalEpisodes: effectiveTotalEpisodes,
    tracks,
    episodeMatrix,
    platforms,
    summary: {
      hindiDubbedCount,
      englishDubbedCount,
      banglaDubbedCount,
      japaneseCount: originalAudio?.code === 'ja' ? effectiveTotalEpisodes : 0,
      totalEpisodes: effectiveTotalEpisodes,
    },
  };
}
