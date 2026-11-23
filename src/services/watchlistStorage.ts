import { AnimeItem } from '../types/anime';

export type WatchStatus = 'plan_to_watch' | 'watching' | 'completed' | 'on_hold' | 'dropped';

export interface WatchlistEntry {
  animeId: number;
  title: string;
  coverImage: string;
  status: WatchStatus;
  watchedEpisodes: number;
  totalEpisodes?: number;
  userScore?: number; // 1 to 10
  notes?: string;
  lastUpdated: number;
}

const WATCHLIST_STORAGE_KEY = 'aniread_user_watchlist_v1';
const QUEST_STORAGE_KEY = 'aniread_anime_quests_v1';
const TRIVIA_STATS_KEY = 'aniread_trivia_stats_v1';

// --- Watchlist Functions --- //

export function getWatchlist(): Record<number, WatchlistEntry> {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getWatchlistEntry(animeId: number): WatchlistEntry | null {
  const list = getWatchlist();
  return list[animeId] || null;
}

export function updateWatchlistEntry(
  anime: AnimeItem,
  status: WatchStatus,
  watchedEpisodes: number = 0,
  userScore?: number
): WatchlistEntry {
  const list = getWatchlist();
  const entry: WatchlistEntry = {
    animeId: anime.id,
    title: anime.title,
    coverImage: anime.coverImage,
    status,
    watchedEpisodes: Math.max(0, watchedEpisodes),
    totalEpisodes: anime.episodes,
    userScore,
    lastUpdated: Date.now(),
  };

  list[anime.id] = entry;
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // quota
  }

  // Trigger quest progress
  recordQuestAction(anime.id, 'added_to_watchlist');
  return entry;
}

export function removeWatchlistEntry(animeId: number): void {
  const list = getWatchlist();
  delete list[animeId];
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // quota
  }
}

export function incrementWatchedEpisode(anime: AnimeItem): WatchlistEntry {
  const existing = getWatchlistEntry(anime.id);
  const currentWatched = existing?.watchedEpisodes || 0;
  const maxEps = anime.episodes || 9999;
  const newWatched = Math.min(currentWatched + 1, maxEps);
  const newStatus: WatchStatus =
    newWatched >= maxEps && anime.episodes ? 'completed' : existing?.status || 'watching';

  recordQuestAction(anime.id, 'logged_episode');
  return updateWatchlistEntry(anime, newStatus, newWatched, existing?.userScore);
}

// --- Anime Quest System --- //

export interface QuestItem {
  id: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
}

export function getAnimeQuests(animeId: number): QuestItem[] {
  let record: Record<string, boolean> = {};
  try {
    const raw = localStorage.getItem(`${QUEST_STORAGE_KEY}_${animeId}`);
    if (raw) record = JSON.parse(raw);
  } catch {
    // ignore
  }

  return [
    {
      id: 'view_overview',
      title: 'Lore Scholar',
      description: 'Read the official synopsis & facts',
      xp: 25,
      completed: Boolean(record['view_overview']),
    },
    {
      id: 'check_dubs',
      title: 'Audio Detective',
      description: 'Verify Japanese, Hindi & English audio tracks',
      xp: 35,
      completed: Boolean(record['check_dubs']),
    },
    {
      id: 'view_characters',
      title: 'Character Explorer',
      description: 'Inspect main cast & voice actors (seiyuu)',
      xp: 40,
      completed: Boolean(record['view_characters']),
    },
    {
      id: 'test_trivia',
      title: 'Anime Otaku Master',
      description: 'Take the anime knowledge quiz',
      xp: 50,
      completed: Boolean(record['test_trivia']),
    },
    {
      id: 'added_to_watchlist',
      title: 'Log Watch Progress',
      description: 'Set episode tracker or watchlist status',
      xp: 50,
      completed: Boolean(record['added_to_watchlist']),
    },
  ];
}

export function recordQuestAction(animeId: number, actionId: string): void {
  try {
    const key = `${QUEST_STORAGE_KEY}_${animeId}`;
    const raw = localStorage.getItem(key);
    const record: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    if (!record[actionId]) {
      record[actionId] = true;
      localStorage.setItem(key, JSON.stringify(record));
    }
  } catch {
    // ignore
  }
}

// --- Anime Trivia Stats --- //

export interface TriviaStats {
  totalQuizzes: number;
  totalCorrect: number;
  highScore: number;
}

export function getTriviaStats(): TriviaStats {
  try {
    const raw = localStorage.getItem(TRIVIA_STATS_KEY);
    return raw ? JSON.parse(raw) : { totalQuizzes: 0, totalCorrect: 0, highScore: 0 };
  } catch {
    return { totalQuizzes: 0, totalCorrect: 0, highScore: 0 };
  }
}

export function recordTriviaScore(score: number, totalQuestions: number): void {
  try {
    const stats = getTriviaStats();
    stats.totalQuizzes += 1;
    stats.totalCorrect += score;
    if (score > stats.highScore) {
      stats.highScore = score;
    }
    localStorage.setItem(TRIVIA_STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}
