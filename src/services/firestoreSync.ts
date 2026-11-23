import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
  clampStr,
  sanitizeDocId,
} from './firebase';
import type { MyDubListItem, FavoriteItem } from './offlineStorage';
import type { ReadingProgress } from '../types/anime';

function canSyncUser(): { uid: string; emailVerified: boolean } | null {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return null;
  return { uid: sanitizeDocId(user.uid), emailVerified: true };
}

export async function syncDubListItemToCloud(item: MyDubListItem): Promise<void> {
  const active = canSyncUser();
  if (!active) return;

  const entryId = sanitizeDocId(`dub_${item.animeId}`);
  const docPath = `users/${active.uid}/dubList/${entryId}`;
  const docRef = doc(db, 'users', active.uid, 'dubList', entryId);
  const numericAnimeId = Math.max(1, Number(item.animeId) || 1);

  const validStatus = (
    ['watching', 'completed', 'plan_to_watch', 'on_hold'].includes(item.status)
      ? item.status
      : 'watching'
  ) as MyDubListItem['status'];

  const dubLanguages = (item.dubLanguages || ['Japanese'])
    .map((s) => clampStr(s, 40))
    .filter(Boolean)
    .slice(0, 10);

  const verifiedPlatforms = (item.verifiedPlatforms || ['Official Platform'])
    .map((s) => clampStr(s, 80))
    .filter(Boolean)
    .slice(0, 10);

  try {
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      await setDoc(docRef, {
        id: entryId,
        userId: active.uid,
        animeId: numericAnimeId,
        title: clampStr(item.title || 'Untitled Anime', 240) || 'Untitled Anime',
        coverImage: clampStr(item.coverImage || '', 600),
        dubLanguages,
        verifiedPlatforms,
        status: validStatus,
        episodesWatched: Math.max(0, Math.min(10000, Math.floor(Number(item.episodesWatched) || 0))),
        totalEpisodes: Math.max(0, Math.min(10000, Math.floor(Number(item.totalEpisodes) || 12))),
        primaryWatchUrl: clampStr(item.primaryWatchUrl || '', 600),
        notes: clampStr(item.notes || '', 500),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        title: clampStr(item.title || 'Untitled Anime', 240) || 'Untitled Anime',
        coverImage: clampStr(item.coverImage || '', 600),
        dubLanguages,
        verifiedPlatforms,
        totalEpisodes: Math.max(0, Math.min(10000, Math.floor(Number(item.totalEpisodes) || 12))),
        primaryWatchUrl: clampStr(item.primaryWatchUrl || '', 600),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(docRef, {
        status: validStatus,
        episodesWatched: Math.max(0, Math.min(10000, Math.floor(Number(item.episodesWatched) || 0))),
        totalEpisodes: Math.max(0, Math.min(10000, Math.floor(Number(item.totalEpisodes) || 12))),
        notes: clampStr(item.notes || '', 500),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function removeDubListItemFromCloud(animeId: number | string): Promise<void> {
  const active = canSyncUser();
  if (!active) return;

  const entryId = sanitizeDocId(`dub_${animeId}`);
  const docPath = `users/${active.uid}/dubList/${entryId}`;
  try {
    await deleteDoc(doc(db, 'users', active.uid, 'dubList', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function fetchDubListFromCloud(): Promise<MyDubListItem[]> {
  const active = canSyncUser();
  if (!active) return [];

  const listPath = `users/${active.uid}/dubList`;
  try {
    const q = query(
      collection(db, 'users', active.uid, 'dubList'),
      where('userId', '==', active.uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        animeId: Number(data.animeId) || 1,
        title: String(data.title || ''),
        coverImage: String(data.coverImage || ''),
        genres: [],
        dubLanguages: Array.isArray(data.dubLanguages) ? data.dubLanguages.map(String) : ['Japanese'],
        verifiedPlatforms: Array.isArray(data.verifiedPlatforms)
          ? data.verifiedPlatforms.map(String)
          : ['Official Platform'],
        status: (['watching', 'completed', 'plan_to_watch', 'on_hold'].includes(data.status)
          ? data.status
          : 'watching') as MyDubListItem['status'],
        episodesWatched: Number(data.episodesWatched) || 0,
        totalEpisodes: Number(data.totalEpisodes) || 12,
        primaryWatchUrl: data.primaryWatchUrl ? String(data.primaryWatchUrl) : undefined,
        notes: data.notes ? String(data.notes) : undefined,
        addedAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, listPath);
  }
}

export async function syncFavoriteToCloud(
  fav: FavoriteItem,
  action: 'upsert' | 'delete'
): Promise<void> {
  const active = canSyncUser();
  if (!active) return;

  const favId = sanitizeDocId(fav.id);
  const docPath = `users/${active.uid}/favorites/${favId}`;
  const docRef = doc(db, 'users', active.uid, 'favorites', favId);

  if (action === 'delete') {
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
    return;
  }

  const numericMediaId = Math.max(
    1,
    parseInt(String(fav.id).replace(/^(anime_|manga_)/, ''), 10) || 1
  );

  try {
    const snap = await getDoc(docRef);
    const score =
      typeof fav.score === 'number' && fav.score >= 0 && fav.score <= 10
        ? Number(fav.score.toFixed(2))
        : 0;

    if (!snap.exists()) {
      await setDoc(docRef, {
        id: favId,
        userId: active.uid,
        mediaId: numericMediaId,
        mediaType: fav.type === 'manga' ? 'manga' : 'anime',
        title: clampStr(fav.title || 'Untitled', 240) || 'Untitled',
        coverImage: clampStr(fav.coverImage || '', 600),
        score,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        title: clampStr(fav.title || 'Untitled', 240) || 'Untitled',
        coverImage: clampStr(fav.coverImage || '', 600),
        score,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function syncReadingProgressToCloud(progress: ReadingProgress): Promise<void> {
  const active = canSyncUser();
  if (!active) return;

  const mangaDocId = sanitizeDocId(`manga_${progress.mangaId}`);
  const docPath = `users/${active.uid}/readingProgress/${mangaDocId}`;
  const docRef = doc(db, 'users', active.uid, 'readingProgress', mangaDocId);
  const numericMangaId = Math.max(1, parseInt(String(progress.mangaId), 10) || 1);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        id: mangaDocId,
        userId: active.uid,
        mangaId: numericMangaId,
        mangaTitle: clampStr(progress.mangaTitle || 'Manga', 240) || 'Manga',
        coverImage: clampStr(progress.coverImage || '', 600),
        lastChapterId: clampStr(progress.lastChapterId || '1', 160) || '1',
        lastChapterNumber: clampStr(progress.lastChapterNumber || '1', 32) || '1',
        lastPage: Math.max(0, Math.min(10000, Math.floor(Number(progress.lastPage) || 0))),
        totalPages: Math.max(0, Math.min(10000, Math.floor(Number(progress.totalPages) || 0))),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        mangaTitle: clampStr(progress.mangaTitle || 'Manga', 240) || 'Manga',
        coverImage: clampStr(progress.coverImage || '', 600),
        lastChapterId: clampStr(progress.lastChapterId || '1', 160) || '1',
        lastChapterNumber: clampStr(progress.lastChapterNumber || '1', 32) || '1',
        lastPage: Math.max(0, Math.min(10000, Math.floor(Number(progress.lastPage) || 0))),
        totalPages: Math.max(0, Math.min(10000, Math.floor(Number(progress.totalPages) || 0))),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function saveAdminHindiOverrideToCloud(params: {
  animeId: number;
  title: string;
  dubStatus: 'Complete' | 'Partial' | 'Announced';
  platforms: string[];
  hindiEpisodeCount: number;
  sourceUrl: string;
  notes: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.email !== ADMIN_EMAIL) return;

  const overrideId = sanitizeDocId(`hi_${params.animeId}`);
  const docPath = `hindiDubOverrides/${overrideId}`;
  const docRef = doc(db, 'hindiDubOverrides', overrideId);

  try {
    const snap = await getDoc(docRef);
    const platforms = (params.platforms || []).map((p) => clampStr(p, 80)).filter(Boolean).slice(0, 10);
    if (!snap.exists()) {
      await setDoc(docRef, {
        id: overrideId,
        animeId: Math.max(1, Number(params.animeId) || 1),
        title: clampStr(params.title, 240) || 'Untitled',
        dubStatus: params.dubStatus,
        platforms,
        hindiEpisodeCount: Math.max(0, Math.min(10000, Math.floor(params.hindiEpisodeCount || 0))),
        sourceUrl: clampStr(params.sourceUrl || '', 600),
        verifiedByUid: sanitizeDocId(user.uid),
        notes: clampStr(params.notes || '', 500),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        title: clampStr(params.title, 240) || 'Untitled',
        dubStatus: params.dubStatus,
        platforms,
        hindiEpisodeCount: Math.max(0, Math.min(10000, Math.floor(params.hindiEpisodeCount || 0))),
        sourceUrl: clampStr(params.sourceUrl || '', 600),
        verifiedByUid: sanitizeDocId(user.uid),
        notes: clampStr(params.notes || '', 500),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}
