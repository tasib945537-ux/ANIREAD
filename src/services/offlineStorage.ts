import { apiUrl } from './apiUrl';
import { OfflineChapterData, ReadingProgress, AnimeItem, MangaItem } from '../types/anime';
import {
  syncDubListItemToCloud,
  removeDubListItemFromCloud,
  fetchDubListFromCloud,
  syncFavoriteToCloud,
  syncReadingProgressToCloud,
} from './firestoreSync';

const DB_NAME = 'AniMangaHubDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('offline_chapters')) {
        db.createObjectStore('offline_chapters', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('reading_progress')) {
        db.createObjectStore('reading_progress', { keyPath: 'mangaId' });
      }

      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('cached_media')) {
        db.createObjectStore('cached_media', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Offline Chapter Storage
export async function saveOfflineChapter(chapterData: OfflineChapterData): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_chapters', 'readwrite');
    const store = tx.objectStore('offline_chapters');
    const req = store.put(chapterData);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineChapter(chapterId: string): Promise<OfflineChapterData | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_chapters', 'readonly');
    const store = tx.objectStore('offline_chapters');
    const req = store.get(chapterId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllOfflineChapters(): Promise<OfflineChapterData[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_chapters', 'readonly');
    const store = tx.objectStore('offline_chapters');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteOfflineChapter(chapterId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_chapters', 'readwrite');
    const store = tx.objectStore('offline_chapters');
    const req = store.delete(chapterId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Download Chapter with Progress
export async function downloadChapterForOffline(
  chapterId: string,
  mangaId: string | number,
  mangaTitle: string,
  chapterNumber: string,
  title: string,
  pageUrls: string[],
  onProgress?: (current: number, total: number) => void
): Promise<OfflineChapterData> {
  const downloadedPages: string[] = [];
  let totalBytes = 0;
  const failedPages: number[] = [];

  for (let i = 0; i < pageUrls.length; i++) {
    const url = pageUrls[i];
    try {
      let response: Response;
      if (url.startsWith('data:image/')) {
        response = await fetch(url);
      } else {
        try {
          response = await fetch(url, { mode: 'cors' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch {
          // MangaDex@Home nodes can reject browser CORS. Retry through ANIREAD's
          // allow-listed MangaDex image proxy before declaring the page unavailable.
          response = await fetch(apiUrl(`/api/manga-image?url=${encodeURIComponent(url)}`));
        }
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob.size || !blob.type.startsWith('image/')) {
        throw new Error('The server did not return a valid image.');
      }
      totalBytes += blob.size;

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error || new Error('Could not store image.'));
        reader.readAsDataURL(blob);
      });
      downloadedPages.push(base64);
    } catch (error) {
      console.warn(`Offline page ${i + 1} could not be saved:`, error);
      failedPages.push(i + 1);
    }

    onProgress?.(i + 1, pageUrls.length);
  }

  // Never mark a partial download as offline-ready: remote URLs fail without a connection.
  if (failedPages.length > 0 || downloadedPages.length !== pageUrls.length) {
    throw new Error(
      `Offline download incomplete: ${downloadedPages.length}/${pageUrls.length} pages saved. Retry the download while connected.`
    );
  }

  const chapterData: OfflineChapterData = {
    id: chapterId,
    mangaId,
    mangaTitle,
    chapterNumber,
    title,
    pageCount: downloadedPages.length,
    pages: downloadedPages,
    downloadedAt: Date.now(),
    sizeBytes: totalBytes,
  };

  await saveOfflineChapter(chapterData);
  return chapterData;
}

// Reading Progress
export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('reading_progress', 'readwrite');
    const store = tx.objectStore('reading_progress');
    const req = store.put(progress);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  void syncReadingProgressToCloud(progress).catch((err) => {
    console.warn('Cloud reading progress sync skipped:', err);
  });
}

export async function getReadingProgress(mangaId: string | number): Promise<ReadingProgress | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reading_progress', 'readonly');
    const store = tx.objectStore('reading_progress');
    const req = store.get(String(mangaId));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllReadingProgress(): Promise<ReadingProgress[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reading_progress', 'readonly');
    const store = tx.objectStore('reading_progress');
    const req = store.getAll();
    req.onsuccess = () => {
      const results: ReadingProgress[] = req.result || [];
      results.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

// Favorites (Bookmarks)
export interface FavoriteItem {
  id: string | number;
  type: 'anime' | 'manga';
  title: string;
  coverImage: string;
  score?: number;
  genres: string[];
  addedAt: number;
}

export async function toggleFavorite(item: AnimeItem | MangaItem, type: 'anime' | 'manga'): Promise<boolean> {
  const db = await getDB();
  const id = `${type}_${item.id}`;

  const exists = await new Promise<boolean>((resolve) => {
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const req = store.get(id);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });

  const added = await new Promise<boolean>((resolve, reject) => {
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    if (exists) {
      const req = store.delete(id);
      req.onsuccess = () => resolve(false); // now removed
      req.onerror = () => reject(req.error);
    } else {
      const fav: FavoriteItem = {
        id,
        type,
        title: item.title,
        coverImage: item.coverImage,
        score: item.score,
        genres: item.genres,
        addedAt: Date.now(),
      };
      const req = store.put(fav);
      req.onsuccess = () => resolve(true); // now added
      req.onerror = () => reject(req.error);
    }
  });

  const favPayload: FavoriteItem = {
    id,
    type,
    title: item.title,
    coverImage: item.coverImage,
    score: item.score,
    genres: item.genres || [],
    addedAt: Date.now(),
  };
  void syncFavoriteToCloud(favPayload, added ? 'upsert' : 'delete').catch((err) => {
    console.warn('Cloud favorite sync skipped:', err);
  });

  return added;
}

export async function isFavorite(id: string | number, type: 'anime' | 'manga'): Promise<boolean> {
  const db = await getDB();
  const key = `${type}_${id}`;
  return new Promise((resolve) => {
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const req = store.get(key);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });
}

export async function getAllFavorites(): Promise<FavoriteItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const req = store.getAll();
    req.onsuccess = () => {
      const results: FavoriteItem[] = req.result || [];
      results.sort((a, b) => b.addedAt - a.addedAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getStorageStats(): Promise<{ chaptersCount: number; totalSizeBytes: number; readableSize: string }> {
  const chapters = await getAllOfflineChapters();
  const totalSizeBytes = chapters.reduce((sum, ch) => sum + (ch.sizeBytes || 0), 0);
  const mb = (totalSizeBytes / (1024 * 1024)).toFixed(1);
  return {
    chaptersCount: chapters.length,
    totalSizeBytes,
    readableSize: `${mb} MB`,
  };
}

export async function clearAllOfflineChapters(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_chapters', 'readwrite');
    const store = tx.objectStore('offline_chapters');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteReadingProgress(mangaId: string | number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reading_progress', 'readwrite');
    const store = tx.objectStore('reading_progress');
    const req = store.delete(String(mangaId));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function exportLibraryBackup(): Promise<string> {
  const [history, favorites] = await Promise.all([
    getAllReadingProgress(),
    getAllFavorites(),
  ]);
  const backup = {
    exportedAt: Date.now(),
    app: 'AniRead',
    version: 1,
    readingHistory: history,
    favorites,
  };
  return JSON.stringify(backup, null, 2);
}

export async function importLibraryBackup(jsonStr: string): Promise<{ historyCount: number; favoritesCount: number }> {
  const parsed = JSON.parse(jsonStr);
  const db = await getDB();

  let historyCount = 0;
  if (Array.isArray(parsed.readingHistory)) {
    const tx = db.transaction('reading_progress', 'readwrite');
    const store = tx.objectStore('reading_progress');
    for (const item of parsed.readingHistory) {
      if (item && item.mangaId) {
        store.put(item);
        historyCount++;
      }
    }
  }

  let favoritesCount = 0;
  if (Array.isArray(parsed.favorites)) {
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    for (const item of parsed.favorites) {
      if (item && item.id) {
        store.put(item);
        favoritesCount++;
      }
    }
  }

  return { historyCount, favoritesCount };
}

// ==========================================
// MY DUB LIST (Personal Dub Tracker & Watchlist)
// ==========================================

export interface MyDubListItem {
  id: string; // `dub_${animeId}`
  animeId: number | string;
  malId?: number;
  anilistId?: number;
  title: string;
  englishTitle?: string;
  coverImage: string;
  score?: number;
  genres: string[];
  dubLanguages: string[]; // e.g. ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Japanese']
  status: 'watching' | 'completed' | 'plan_to_watch' | 'on_hold';
  episodesWatched: number;
  totalEpisodes?: number;
  verifiedPlatforms: string[]; // e.g. ['Crunchyroll', 'SonyLIV', 'Prime Video', 'Netflix']
  primaryWatchUrl?: string;
  notes?: string;
  addedAt: number;
  updatedAt: number;
}

const LOCAL_DUB_LIST_KEY = 'aniread_my_dub_list_v1';

function resolveAuthenticCover(title: string, malId?: number, currentCover?: string): string {
  if (currentCover && !currentCover.includes('images.unsplash.com')) {
    return currentCover;
  }
  const params = new URLSearchParams({ title });
  if (malId && malId > 0) params.set('malId', String(malId));
  return `/api/anime-cover?${params.toString()}`;
}

export async function getMyDubList(): Promise<MyDubListItem[]> {
  try {
    const raw = localStorage.getItem(LOCAL_DUB_LIST_KEY);
    if (raw) {
      const parsed: MyDubListItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let migrated = false;
        const normalized = parsed.map((item) => {
          const fixedCover = resolveAuthenticCover(
            item.title,
            item.malId || Number(item.animeId),
            item.coverImage
          );
          if (fixedCover !== item.coverImage) {
            migrated = true;
            return { ...item, coverImage: fixedCover };
          }
          return item;
        });
        if (migrated) {
          localStorage.setItem(LOCAL_DUB_LIST_KEY, JSON.stringify(normalized));
        }
        return normalized.sort((a, b) => (b.updatedAt || b.addedAt) - (a.updatedAt || a.addedAt));
      }
    }
  } catch (err) {
    console.warn('Error reading My Dub List from localStorage:', err);
  }

  // Initial seed list of confirmed dubbed anime across official platforms (real covers via offline DB cover proxy)
  const seedList: MyDubListItem[] = [
    {
      id: 'dub_40748',
      animeId: 40748,
      malId: 40748,
      anilistId: 113415,
      title: 'Jujutsu Kaisen',
      coverImage: '/api/anime-cover?title=Jujutsu+Kaisen&malId=40748',
      score: 8.5,
      genres: ['Action', 'Supernatural', 'Fantasy'],
      dubLanguages: ['Hindi', 'English', 'Tamil', 'Telugu', 'Japanese'],
      status: 'watching',
      episodesWatched: 18,
      totalEpisodes: 24,
      verifiedPlatforms: ['Crunchyroll India', 'Netflix India', 'SonyLIV'],
      primaryWatchUrl: 'https://www.crunchyroll.com/series/GRDV0019R/jujutsu-kaisen',
      notes: 'Season 1 & 2 Complete Hindi Dub verified on Crunchyroll India, Netflix India & SonyLIV.',
      addedAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'dub_38000',
      animeId: 38000,
      malId: 38000,
      anilistId: 101922,
      title: 'Demon Slayer: Kimetsu no Yaiba',
      coverImage: '/api/anime-cover?title=Demon+Slayer%3A+Kimetsu+no+Yaiba&malId=38000',
      score: 8.5,
      genres: ['Action', 'Fantasy', 'Historical'],
      dubLanguages: ['Hindi', 'English', 'Bangla', 'Tamil', 'Telugu', 'Japanese'],
      status: 'watching',
      episodesWatched: 26,
      totalEpisodes: 26,
      verifiedPlatforms: ['Crunchyroll India', 'Netflix India', 'JioHotstar'],
      primaryWatchUrl: 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
      notes: 'Complete Hindi, Tamil & Telugu Dubs verified on Crunchyroll India, Netflix India & JioHotstar.',
      addedAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'dub_52299',
      animeId: 52299,
      malId: 52299,
      anilistId: 151807,
      title: 'Solo Leveling',
      coverImage: '/api/anime-cover?title=Solo+Leveling&malId=52299',
      score: 8.3,
      genres: ['Action', 'Adventure', 'Fantasy'],
      dubLanguages: ['Hindi', 'English', 'Tamil', 'Telugu', 'Japanese'],
      status: 'watching',
      episodesWatched: 12,
      totalEpisodes: 12,
      verifiedPlatforms: ['Crunchyroll India', 'Amazon Prime Video'],
      primaryWatchUrl: 'https://www.crunchyroll.com/series/GDKHZEJ0K/solo-leveling',
      notes: 'Official Hindi SimulDub confirmed on Crunchyroll India.',
      addedAt: Date.now() - 86400000 * 4,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'dub_9253',
      animeId: 9253,
      malId: 9253,
      anilistId: 9253,
      title: 'Steins;Gate',
      coverImage: '/api/anime-cover?title=Steins%3BGate&malId=9253',
      score: 9.1,
      genres: ['Sci-Fi', 'Suspense', 'Psychological'],
      dubLanguages: ['English', 'Japanese'],
      status: 'completed',
      episodesWatched: 24,
      totalEpisodes: 24,
      verifiedPlatforms: ['Crunchyroll', 'Netflix'],
      primaryWatchUrl: 'https://www.crunchyroll.com/series/GY091N856/steinsgate',
      notes: 'Official English dub verified on Crunchyroll & Netflix.',
      addedAt: Date.now() - 86400000 * 10,
      updatedAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'dub_21',
      animeId: 21,
      malId: 21,
      anilistId: 21,
      title: 'One Piece',
      coverImage: '/api/anime-cover?title=One+Piece&malId=21',
      score: 8.7,
      genres: ['Action', 'Adventure', 'Fantasy'],
      dubLanguages: ['Hindi', 'English', 'Japanese'],
      status: 'watching',
      episodesWatched: 130,
      totalEpisodes: 1120,
      verifiedPlatforms: ['Crunchyroll India', 'Netflix India'],
      primaryWatchUrl: 'https://www.crunchyroll.com/series/GRMG8ZQZR/one-piece',
      notes: 'Partial Hindi Dub arcs verified on Crunchyroll India & Netflix India.',
      addedAt: Date.now() - 86400000 * 14,
      updatedAt: Date.now() - 86400000 * 2,
    },
  ];

  try {
    localStorage.setItem(LOCAL_DUB_LIST_KEY, JSON.stringify(seedList));
  } catch {
    // quota
  }
  return seedList;
}

export async function saveToMyDubList(item: MyDubListItem): Promise<void> {
  const current = await getMyDubList();
  const index = current.findIndex((d) => String(d.animeId) === String(item.animeId));
  const updatedItem = {
    ...item,
    coverImage: resolveAuthenticCover(item.title, item.malId || Number(item.animeId), item.coverImage),
    updatedAt: Date.now(),
  };

  if (index >= 0) {
    current[index] = updatedItem;
  } else {
    current.unshift(updatedItem);
  }

  try {
    localStorage.setItem(LOCAL_DUB_LIST_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to save to My Dub List:', err);
  }

  void syncDubListItemToCloud(updatedItem).catch((err) => {
    console.warn('Cloud My Dub List save skipped:', err);
  });
}

export async function removeFromMyDubList(animeId: number | string): Promise<void> {
  const current = await getMyDubList();
  const filtered = current.filter((d) => String(d.animeId) !== String(animeId));
  try {
    localStorage.setItem(LOCAL_DUB_LIST_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to remove from My Dub List:', err);
  }

  void removeDubListItemFromCloud(animeId).catch((err) => {
    console.warn('Cloud My Dub List remove skipped:', err);
  });
}

export async function isInMyDubList(animeId: number | string): Promise<boolean> {
  const current = await getMyDubList();
  return current.some((d) => String(d.animeId) === String(animeId));
}

export async function updateDubListProgress(
  animeId: number | string,
  episodesWatched: number,
  status?: MyDubListItem['status']
): Promise<void> {
  const current = await getMyDubList();
  const item = current.find((d) => String(d.animeId) === String(animeId));
  if (item) {
    item.episodesWatched = episodesWatched;
    if (status) item.status = status;
    item.updatedAt = Date.now();
    try {
      localStorage.setItem(LOCAL_DUB_LIST_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
    void syncDubListItemToCloud(item).catch((err) => {
      console.warn('Cloud My Dub List progress sync skipped:', err);
    });
  }
}

export async function syncMyDubListWithFirestore(): Promise<MyDubListItem[]> {
  const localItems = await getMyDubList();
  const cloudItems = await fetchDubListFromCloud();

  const mergedById = new Map<string, MyDubListItem>();
  for (const item of localItems) {
    mergedById.set(String(item.animeId), item);
  }
  for (const cloud of cloudItems) {
    const key = String(cloud.animeId);
    const local = mergedById.get(key);
    if (!local || (cloud.updatedAt || 0) >= (local.updatedAt || 0)) {
      mergedById.set(key, {
        ...(local || {}),
        ...cloud,
        genres: local?.genres?.length ? local.genres : ['Anime'],
      });
    }
  }

  const merged = Array.from(mergedById.values()).sort(
    (a, b) => (b.updatedAt || b.addedAt) - (a.updatedAt || a.addedAt)
  );

  try {
    localStorage.setItem(LOCAL_DUB_LIST_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }

  // Push any local-only entries up to Firestore
  const cloudIds = new Set(cloudItems.map((c) => String(c.animeId)));
  for (const item of merged) {
    if (!cloudIds.has(String(item.animeId))) {
      void syncDubListItemToCloud(item).catch(() => {});
    }
  }

  return merged;
}
