export type MediaType = 'anime' | 'manga';

export interface VoiceActor {
  id: number;
  name: string;
  language: string; // 'Japanese', 'Hindi', 'English', 'Spanish', 'French', 'German', etc.
  image?: string;
}

export interface WatchLink {
  name: string; // 'Crunchyroll', 'Netflix', 'Disney+ Hotstar', 'Hulu', 'Amazon Prime', 'YouTube', 'Bilibili', 'HIDIVE'
  url: string;
  badge?: string; // 'Sub & Dub', 'Hindi Dub', 'Official Stream', 'Free with Ads'
  iconType?: 'crunchyroll' | 'netflix' | 'disney' | 'prime' | 'hulu' | 'youtube' | 'bilibili' | 'hidive' | 'apple' | 'jiocinema' | 'everythingmoe' | 'hianime' | 'default';
  isOfficial?: boolean;
  audioTracks?: string[]; // e.g. ['Japanese', 'Hindi', 'English']
  subtitles?: string[]; // e.g. ['English', 'Hindi', 'Bengali']
  region?: string; // 'India & South Asia', 'Global', etc.
}

export type DubVerificationStatus =
  | 'CONFIRMED'
  | 'PARTIALLY_CONFIRMED'
  | 'REPORTED_UNVERIFIED'
  | 'UNKNOWN'
  | 'NOT_FOUND'
  | 'CONFIRMED_UNAVAILABLE'
  | 'Available'
  | 'Confirmed'
  | 'Partial'
  | 'Sub Only';

export type AudioType = 'original' | 'dub';

export interface DubEvidence {
  id: string;
  audioReleaseId: string;
  sourceName: string; // 'Crunchyroll' | 'Netflix' | 'Muse Asia' | 'Muse India' | 'AniList' | 'Jikan / MyAnimeList' | 'Prime Video' | 'Disney+' | 'Studio Announcement' | 'Official Licensing Registry'
  sourceUrl: string;
  evidenceType:
    | 'official_catalog'
    | 'streaming_audio_track'
    | 'simuldub_announcement'
    | 'voice_actor_credit'
    | 'subtitle_feed_only'
    | 'secondary_report';
  evidenceSummary: string;
  checkedAt: string; // ISO date string
  verificationStatus: DubVerificationStatus;
}

export interface AnimeAudioRelease {
  id: string;
  animeId: number;
  animeTitle: string;
  seasonId?: string | number;
  seasonNumber?: number;
  seasonTitle?: string;
  episodeRange?: string; // e.g. "Episodes 1-12", "Season 1 Complete (12/12)"
  languageCode: string; // BCP 47 / ISO 639-1 code ('hi', 'bn', 'en', 'ja', 'ta', 'te', 'es', 'pt', 'fr', 'de', 'ar', 'ko', etc.)
  languageName: string; // 'Hindi', 'Bengali', 'English', etc.
  flag?: string; // Optional language flag or empty string
  audioType: AudioType; // 'original' | 'dub'
  status: DubVerificationStatus;
  regionCode?: string; // e.g. 'IN', 'BD', 'US', 'GLOBAL'
  platformName?: string; // 'Crunchyroll India', 'Netflix', 'Muse India', etc.
  officialUrl?: string;
  releaseDate?: string;
  episodesDubbedCount?: number;
  totalEpisodesCount?: number;
  studios?: string[];
  voiceDirector?: string;
  voiceActors?: { name: string; character?: string; role?: string }[];
  audioQuality?: string;
  notes?: string;
  evidence: DubEvidence[];
  verifiedAt: string;
  isDisputed?: boolean;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DubDetail {
  language: string;
  code: string; // 'ja', 'hi', 'en', 'bn', 'ta', 'te', 'es', 'fr', 'de', 'pt'
  flag?: string; // Optional code or empty
  name: string; // 'Japanese (Original)', 'Hindi Dub (हिन्दी)', 'English Dub', etc.
  status: DubVerificationStatus;
  castCount?: number;
  platforms?: string[]; // ['Crunchyroll', 'Netflix', 'JioCinema/Hotstar', 'Muse India']
  verificationSource?: string; // 'Crunchyroll Official Catalog' | 'Netflix Global' | 'Muse India Official Dub' | 'AniList Verified Voice Cast' | 'Unverified / Subtitle Only'
  isVerified?: boolean;
  releaseDate?: string; // e.g. 'SimulDub 2024', 'October 2023', 'Catalog Classic'
  episodesDubbed?: string; // e.g. 'All Episodes', 'Season 1-2', 'Ongoing'
  audioQuality?: string; // 'Dolby 5.1 / Stereo 2.0', 'Lossless Master'
  studios?: string[]; // Localization/recording studio or production house
  voiceDirector?: string;
  watchUrl?: string; // Direct streaming/search link
  voiceActorsList?: VoiceActor[];
  notes?: string;
  seasonNumber?: number;
  seasonTitle?: string;
  episodeRange?: string;
  regionCode?: string;
  evidenceList?: DubEvidence[];
  verifiedAt?: string;
  airTime?: string; // e.g. "Every Saturday at 8:30 PM IST (15:00 UTC)"
  simulcastSchedule?: string; // e.g. "Weekly SimulDub / Same-day Worldwide Release on Crunchyroll India"
  broadcastTiming?: string; // e.g. "Advance streaming on Prime Video & Crunchyroll: Sep 27, 2026; TV Broadcast: Oct 2, 2026"
  nextEpisodeAirDate?: string;
  timeZone?: string; // "IST (Indian Standard Time)"
}

export interface AnimeTrailer {
  youtubeId?: string;
  url?: string;
  embedUrl?: string;
  images?: {
    maximumImageUrl?: string;
    largeImageUrl?: string;
    mediumImageUrl?: string;
  };
}

export interface AnimeRelation {
  relation: string; // 'Prequel', 'Sequel', 'Side story', 'Parent story', 'Spin-off'
  entry: {
    id: number;
    type: string;
    name: string;
    url?: string;
    image?: string;
  }[];
}

export interface AnimeItem {
  id: number;
  malId?: number;
  anilistId?: number;
  title: string;
  englishTitle?: string;
  nativeTitle?: string;
  coverImage: string;
  bannerImage?: string;
  format: string; // TV, Movie, OVA, Manga, Manhwa, etc.
  status: string; // Airing, Finished, Publishing, etc.
  episodes?: number;
  duration?: string;
  season?: string;
  year?: number;
  score?: number;
  rank?: number;
  popularity?: number;
  synopsis: string;
  genres: string[];
  studios?: string[];
  producers?: string[];
  licensors?: string[];
  source?: string;
  rating?: string; // PG-13, R-17+, etc.
  broadcast?: string;
  airedString?: string;
  isLicensed?: boolean;
  countryOfOrigin?: string;
  sourceApi: 'jikan' | 'anilist' | 'mangadex';
  characters?: CharacterPreview[];
  pictures?: string[];
  relatedMangaId?: string | number;
  trailer?: AnimeTrailer;
  watchLinks?: WatchLink[];
  dubs?: DubDetail[];
  audioLanguages?: string[];
  themeSongs?: {
    openings: string[];
    endings: string[];
  };
  relations?: AnimeRelation[];
  externalLinks?: { name: string; url: string }[];
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  };
  favourites?: number;
  contentAdvisories?: string[];
  copyright?: string;
  subtitles?: string[];
  awards?: string[];
  // Structured Rebuilt Hindi Dub Metadata
  hindiDbId?: string;
  hindiDubStatus?: 'Complete' | 'Partial' | 'Announced';
  hindiVerifiedEpisodes?: number | null;
  hindiSeason?: number | null;
  hindiPart?: string | number | null;
  hindiType?: 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special';
  hindiPlatforms?: string[];
  hindiSourceUrls?: string[];
  hindiVerificationDate?: string;
  hindiAvailabilityStatus?: 'Available' | 'Unavailable' | 'Unknown';
  hindiNotes?: string;
  hindiNeedsVerification?: boolean;
  airTime?: string;
  simulcastSchedule?: string;
  broadcastTiming?: string;
}

export interface CharacterPreview {
  id: number;
  name: string;
  nativeName?: string;
  role: string;
  image: string;
  favorites?: number;
  about?: string;
  voiceActors?: VoiceActor[];
}

export interface CharacterDetail {
  id: number;
  name: string;
  nativeName?: string;
  nicknames?: string[];
  image: string;
  about: string;
  favorites: number;
  gallery: string[]; // 20+ high-res photos/art/stills
  voiceActors?: VoiceActor[];
  animeAppearances?: { id: number; title: string; role: string; image?: string }[];
  mangaAppearances?: { id: number; title: string; role: string; image?: string }[];
}

export interface MangaItem {
  id: string | number;
  malId?: number;
  anilistId?: number;
  mangadexId?: string;
  title: string;
  englishTitle?: string;
  nativeTitle?: string;
  coverImage: string;
  bannerImage?: string;
  format?: string; // Manga, Manhwa, Manhua, Light Novel, One-shot
  countryOfOrigin?: string; // KR, JP, CN
  authors: string[];
  artists?: string[];
  status: string;
  releaseYear?: number;
  genres: string[];
  tags?: string[];
  chapterCount?: number;
  volumeCount?: number;
  synopsis: string;
  score?: number;
  rank?: number;
  popularity?: number;
  sourceApi: 'mangadex' | 'jikan' | 'anilist';
  characters?: CharacterPreview[];
  relations?: AnimeRelation[];
  serializations?: string[];
  demographics?: string[];
  externalLinks?: { name: string; url: string }[];
  background?: string;
  availableLanguages?: { code: string; name: string; count: number }[];
}

export interface MangaChapter {
  id: string;
  mangaId: string | number;
  mangaTitle: string;
  chapterNumber: string;
  volumeNumber?: string;
  title: string;
  language: string;
  pageCount: number;
  publishAt?: string;
  scanlationGroup?: string;
  pages?: string[]; // URLs of pages
  isDownloaded?: boolean;
}

export interface OfflineChapterData {
  id: string;
  mangaId: string | number;
  mangaTitle: string;
  chapterNumber: string;
  title: string;
  pageCount: number;
  pages: string[]; // Base64 or object URLs stored in IndexedDB
  downloadedAt: number;
  sizeBytes: number;
}

export interface ReadingProgress {
  mangaId: string | number;
  mangaTitle: string;
  coverImage: string;
  lastChapterId: string;
  lastChapterNumber: string;
  lastPage: number;
  totalPages: number;
  updatedAt: number;
}

export interface FilterState {
  type: 'all' | 'anime' | 'manga';
  search: string;
  genre: string;
  status: string;
  sort: 'score' | 'popularity' | 'trending' | 'newest';
  page: number;
}

export interface TranslationTarget {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// ==========================================
// REQUIREMENT 9: AUDIO TRACK & VERIFICATION MODELS
// ==========================================

export type AudioVerificationState = 'Verified' | 'Unverified' | 'Unavailable' | 'Unknown';
export type DubTypeCategory = 'Official' | 'Licensed' | 'Original' | 'Unknown';
export type PlatformDistributorType = 'Official streaming platform' | 'Official dub distributor' | 'Original broadcaster';

export interface AudioTrack {
  id: string;
  animeId: number | string;
  language: 'Hindi' | 'English' | 'Bangla' | 'Japanese' | 'Tamil' | 'Telugu' | string;
  languageCode: string; // 'hi', 'en', 'bn', 'ja', 'ta', 'te'
  audioType: 'original' | 'dub';
  verificationStatus: AudioVerificationState;
  dubType: DubTypeCategory;
  provider: string; // e.g. 'Crunchyroll India', 'Netflix', 'Muse Asia'
  sourceUrl: string;
  verifiedAt: string; // ISO date or "November 2026"
  totalEpisodes: number;
  dubbedEpisodes: number;
  missingEpisodes: number;
  episodeRange?: string; // e.g. "1–12", "1–24"
  releaseDate?: string;
  airTime?: string; // e.g. "Every Saturday at 8:30 PM IST (15:00 UTC)"
  simulcastSchedule?: string; // e.g. "Weekly SimulDub / Same-day Worldwide Release on Crunchyroll India"
  broadcastTiming?: string; // e.g. "Advance streaming on Prime Video & Crunchyroll: Sep 27, 2026; TV Broadcast: Oct 2, 2026"
  nextEpisodeAirDate?: string;
  timeZone?: string; // "IST (Indian Standard Time)"
  notes?: string;
  isPartiallyDubbed?: boolean;
}

export interface EpisodeAudio {
  id: string;
  animeId: number | string;
  episodeNumber: number;
  language: string;
  availabilityStatus: 'Available' | 'Unavailable' | 'Unknown';
  releaseDate?: string;
  sourceUrl?: string;
}

export interface PlatformAvailability {
  id: string;
  animeId: number | string;
  platform: string;
  language: string;
  availabilityStatus: 'Available' | 'Unavailable' | 'Unknown';
  distributorType: PlatformDistributorType;
  sourceUrl: string;
  verifiedAt: string;
}

export interface EpisodeAudioMatrixRow {
  episodeNumber: number;
  japanese: boolean;
  hindi: boolean | null; // true = Available, false = Unavailable, null = Unknown
  english: boolean | null;
  bangla: boolean | null;
  tamil?: boolean | null;
  telugu?: boolean | null;
}

export interface AnimeAudioAvailabilityData {
  animeId: number | string;
  animeTitle: string;
  totalEpisodes: number;
  tracks: AudioTrack[];
  episodeMatrix: EpisodeAudioMatrixRow[];
  platforms: PlatformAvailability[];
  summary: {
    hindiDubbedCount: number;
    englishDubbedCount: number;
    banglaDubbedCount: number;
    japaneseCount: number;
    totalEpisodes: number;
  };
}
