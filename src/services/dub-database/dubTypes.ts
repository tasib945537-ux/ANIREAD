export type NormalizedAudioType = 'original' | 'dub';

export type NormalizedDubStatus =
  | 'CONFIRMED'
  | 'PARTIALLY_CONFIRMED'
  | 'ANNOUNCED'
  | 'UNVERIFIED'
  | 'UNKNOWN'
  | 'NOT_AVAILABLE';

export interface VerifiedVoiceActor {
  name: string;
  character?: string;
  role?: string;
}

export interface SeasonDubLanguageInfo {
  language: string; // 'Japanese' | 'English' | 'Hindi' | 'Bengali' | 'Tamil' | 'Telugu' | 'Malayalam' | 'Chinese' | 'Spanish' | etc.
  audioType: NormalizedAudioType; // 'original' for JP/Chinese original, 'dub' for dubbed
  status: NormalizedDubStatus;
  dubbedEpisodes?: string | number; // e.g. "12/12", "All", 24
  totalEpisodes?: number;
  platform: string[]; // e.g. ['Crunchyroll India', 'Netflix India']
  region: string; // 'India & South Asia', 'Global', 'North America'
  sourceUrls: string[];
  lastVerified: string; // 'October 2026'
  studios?: string[];
  voiceDirector?: string;
  voiceActors?: VerifiedVoiceActor[];
  notes?: string;
  watchUrl?: string;
  airTime?: string;
  simulcastSchedule?: string;
  broadcastTiming?: string;
  timeZone?: string;
}

export interface SeasonDubRecord {
  seasonNumber: number;
  seasonTitle?: string;
  episodeCount?: number;
  languages: SeasonDubLanguageInfo[];
}

export interface NormalizedAnimeDubRecord {
  animeId: string;
  title: string;
  englishTitle?: string;
  nativeTitle?: string;
  keywords: string[];
  franchiseTotalEpisodes?: number;
  seasons: SeasonDubRecord[];
}

export interface VerifiedDubVoiceActor {
  name: string;
  character?: string;
  role?: string;
}

export interface VerifiedDubRecord {
  keywords: string[];
  title: string;
  languages: {
    language:
      | 'Hindi'
      | 'Bengali'
      | 'English'
      | 'Japanese'
      | 'Spanish'
      | 'Tamil'
      | 'Telugu'
      | 'French'
      | 'German'
      | 'Italian'
      | 'Portuguese';
    status: 'Available' | 'Confirmed' | 'Partial' | 'Sub Only';
    platform: string[];
    verificationSource: string;
    releaseDate?: string;
    episodesDubbed?: string;
    studios?: string[];
    watchUrl?: string;
    voiceActors?: VerifiedDubVoiceActor[];
    notes?: string;
    airTime?: string;
    simulcastSchedule?: string;
    broadcastTiming?: string;
    timeZone?: string;
  }[];
}
