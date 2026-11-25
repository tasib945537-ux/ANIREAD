import { TranslatedMangaPageResult, translateMangaPage } from './translator';

export interface StoredTranslatedPage {
  id: string; // `${mangaId}_ch${chapterNumber}_p${pageNumber}_${targetLang}`
  mangaId: string | number;
  chapterId?: string;
  chapterNumber: string;
  mangaTitle: string;
  mangaCoverImage?: string;
  pageNumber: number;
  originalImageUrl: string;
  targetLanguage: string;
  sourceLanguage?: string;
  status: 'completed' | 'failed' | 'processing';
  timestamp: number;
  result: TranslatedMangaPageResult;
}

export interface TranslationJob {
  id: string; // `${mangaId}_ch${chapterNumber}_${targetLang}`
  mangaId: string | number;
  chapterId?: string;
  chapterNumber: string;
  mangaTitle: string;
  mangaCoverImage?: string;
  totalPages: number;
  pageUrls: string[];
  targetLanguage: string;
  sourceLanguage: string;
  completedPages: number;
  remainingPages: number;
  currentPage: number;
  progressPercent: number;
  failedPages: number[];
  status: 'running' | 'paused' | 'stopped' | 'completed' | 'failed';
  speedPagesPerMin: number;
  estimatedSecondsRemaining: number;
  startedAt: number;
  updatedAt: number;
  isMinimized?: boolean;
  notice?: string;
}

export interface MangaTranslationSummary {
  mangaId: string | number;
  mangaTitle: string;
  mangaCoverImage?: string;
  chapterNumber: string;
  targetLanguage: string;
  completedPages: number;
  totalPages: number;
  lastTranslatedPage: number;
  progressPercent: number;
  lastUpdated: number;
  pageUrls: string[];
  status: 'completed' | 'in_progress';
}

const DB_NAME = 'AniReadMangaTranslationDB_v2';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getTranslationDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('translated_pages')) {
        const pageStore = db.createObjectStore('translated_pages', { keyPath: 'id' });
        pageStore.createIndex('by_chapter', ['mangaId', 'chapterNumber', 'targetLanguage'], { unique: false });
        pageStore.createIndex('by_manga', 'mangaId', { unique: false });
      }

      if (!db.objectStoreNames.contains('translation_jobs')) {
        db.createObjectStore('translation_jobs', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Permanently save a single translated page into IndexedDB & localStorage cache immediately
 */
export async function saveTranslatedPage(item: StoredTranslatedPage): Promise<void> {
  try {
    const db = await getTranslationDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('translated_pages', 'readwrite');
      const store = tx.objectStore('translated_pages');
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Also mirror in localStorage for instant synchronous lookups
    const localKey = `tr_page:${item.mangaId}:${item.chapterNumber}:${item.pageNumber}:${item.targetLanguage}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(item.result));
    } catch {
      // quota
    }
  } catch (err) {
    console.warn('Failed to save translated page to IndexedDB:', err);
  }
}

/**
 * Retrieve a single translated page
 */
export async function getTranslatedPage(
  mangaId: string | number,
  chapterNumber: string,
  pageNumber: number,
  targetLang: string
): Promise<TranslatedMangaPageResult | null> {
  // Try localStorage first for zero-latency retrieval
  const localKey = `tr_page:${mangaId}:${chapterNumber}:${pageNumber}:${targetLang}`;
  try {
    const local = localStorage.getItem(localKey);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && !parsed.rateLimited && parsed.dialogues) {
        return parsed;
      }
    }
  } catch {
    // continue to IndexedDB
  }

  try {
    const db = await getTranslationDB();
    const id = `${mangaId}_ch${chapterNumber}_p${pageNumber}_${targetLang}`;
    const result = await new Promise<StoredTranslatedPage | null>((resolve) => {
      const tx = db.transaction('translated_pages', 'readonly');
      const store = tx.objectStore('translated_pages');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (result && result.result) {
      return result.result;
    }
  } catch (err) {
    console.warn('IndexedDB read error:', err);
  }

  return null;
}

/**
 * Retrieve all previously translated pages for an entire chapter
 */
export async function getChapterTranslations(
  mangaId: string | number,
  chapterNumber: string,
  targetLang: string,
  chapterId?: string
): Promise<Record<number, TranslatedMangaPageResult>> {
  const map: Record<number, TranslatedMangaPageResult> = {};
  try {
    const db = await getTranslationDB();
    const allPages = await new Promise<StoredTranslatedPage[]>((resolve) => {
      const tx = db.transaction('translated_pages', 'readonly');
      const store = tx.objectStore('translated_pages');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    const prefix = `${mangaId}_ch${chapterNumber}_`;
    const suffix = `_${targetLang}`;
    allPages.forEach((p) => {
      if (
        p.id.startsWith(prefix) &&
        p.id.endsWith(suffix) &&
        (!chapterId || !p.chapterId || p.chapterId === chapterId) &&
        p.status === 'completed' &&
        p.result &&
        p.result.provider !== 'untranslated' &&
        Array.isArray(p.result.dialogues) &&
        p.result.dialogues.length > 0
      ) {
        map[p.pageNumber] = p.result;
      }
    });
  } catch (err) {
    console.warn('Failed to load chapter translations:', err);
  }

  return map;
}

/**
 * Retrieve all translated manga summaries for My Library integration
 */
export async function getAllMangaTranslationSummaries(): Promise<MangaTranslationSummary[]> {
  try {
    const db = await getTranslationDB();
    const allPages = await new Promise<StoredTranslatedPage[]>((resolve) => {
      const tx = db.transaction('translated_pages', 'readonly');
      const store = tx.objectStore('translated_pages');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    // Group by chapter key
    const groups = new Map<string, StoredTranslatedPage[]>();
    for (const p of allPages) {
      const key = `${p.mangaId}_ch${p.chapterNumber}_${p.chapterId || 'legacy'}_${p.targetLanguage}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }

    const summaries: MangaTranslationSummary[] = [];
    for (const [, pages] of groups.entries()) {
      if (pages.length === 0) continue;
      const first = pages[0];
      const completedPages = pages.filter((p) => p.status === 'completed' && p.result?.dialogues).length;
      const maxPage = Math.max(...pages.map((p) => p.pageNumber));
      const lastUpdated = Math.max(...pages.map((p) => p.timestamp));
      const totalPages = Math.max(maxPage, pages.length);

      summaries.push({
        mangaId: first.mangaId,
        mangaTitle: first.mangaTitle,
        mangaCoverImage: first.mangaCoverImage,
        chapterNumber: first.chapterNumber,
        targetLanguage: first.targetLanguage,
        completedPages,
        totalPages,
        lastTranslatedPage: maxPage,
        progressPercent: Math.round((completedPages / totalPages) * 100),
        lastUpdated,
        pageUrls: pages.map((p) => p.originalImageUrl).filter(Boolean),
        status: completedPages >= totalPages ? 'completed' : 'in_progress',
      });
    }

    summaries.sort((a, b) => b.lastUpdated - a.lastUpdated);
    return summaries;
  } catch (err) {
    console.warn('Failed to load translation summaries:', err);
    return [];
  }
}

// ==========================================
// BACKGROUND TRANSLATION MANAGER (Queue Engine)
// ==========================================

class TranslationQueueManager {
  private currentJob: TranslationJob | null = null;
  private isProcessing = false;
  private shouldStop = false;
  private listeners = new Set<(job: TranslationJob | null) => void>();
  private startTime = 0;
  private pagesProcessedThisSession = 0;
  private lastRequestStartedAt = 0;

  constructor() {
    this.restoreActiveJob();
  }

  public subscribe(listener: (job: TranslationJob | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentJob);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentJob ? { ...this.currentJob } : null);
      } catch (err) {
        console.warn('Listener error in TranslationQueueManager:', err);
      }
    });
  }

  public getActiveJob(): TranslationJob | null {
    return this.currentJob ? { ...this.currentJob } : null;
  }

  private async restoreActiveJob() {
    try {
      const db = await getTranslationDB();
      const job = await new Promise<TranslationJob | null>((resolve) => {
        const tx = db.transaction('translation_jobs', 'readonly');
        const store = tx.objectStore('translation_jobs');
        const req = store.getAll();
        req.onsuccess = () => {
          const list: TranslationJob[] = req.result || [];
          const running = list.find((j) => j.status === 'running' || j.status === 'paused');
          resolve(running || null);
        };
        req.onerror = () => resolve(null);
      });

      if (job && job.status === 'running') {
        // Resume running job from where it left off
        this.currentJob = { ...job, status: 'paused', notice: 'Translation paused upon reload. Click Resume to continue.' };
        this.notify();
      }
    } catch {
      // ignore
    }
  }

  private async persistCurrentJob() {
    if (!this.currentJob) return;
    try {
      const db = await getTranslationDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('translation_jobs', 'readwrite');
        const store = tx.objectStore('translation_jobs');
        const req = store.put(this.currentJob);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to persist translation job:', err);
    }
  }

  /**
   * Start or Resume chapter background translation
   * Smart Resume: Scans IndexedDB for previously completed pages and skips them automatically!
   */
  public async startTranslation(params: {
    mangaId: string | number;
    chapterId?: string;
    chapterNumber: string;
    mangaTitle: string;
    mangaCoverImage?: string;
    pageUrls: string[];
    targetLanguage: string;
    sourceLanguage?: string;
    forceRetranslate?: boolean;
    startFromPage?: number;
  }): Promise<void> {
    const {
      mangaId,
      chapterId,
      chapterNumber,
      mangaTitle,
      mangaCoverImage,
      pageUrls,
      targetLanguage,
      sourceLanguage = 'Auto',
      forceRetranslate = false,
      startFromPage = 1,
    } = params;

    const totalPages = pageUrls.length;
    if (totalPages === 0) return;

    const jobId = `${mangaId}_ch${chapterNumber}_${chapterId || 'legacy'}_${targetLanguage}`;

    // Smart check: scan already completed pages in IndexedDB
    const existingTranslations = forceRetranslate ? {} : await getChapterTranslations(mangaId, chapterNumber, targetLanguage, chapterId);
    const existingCompleted = Object.keys(existingTranslations).map(Number);
    const completedCount = existingCompleted.length;

    // Find first untranslated page (Smart Resume)
    let firstUntranslated = startFromPage;
    if (!forceRetranslate) {
      for (let p = 1; p <= totalPages; p++) {
        if (!existingTranslations[p]) {
          firstUntranslated = p;
          break;
        }
      }
    }

    this.currentJob = {
      id: jobId,
      mangaId,
      chapterId,
      chapterNumber,
      mangaTitle,
      mangaCoverImage,
      totalPages,
      pageUrls,
      targetLanguage,
      sourceLanguage,
      completedPages: completedCount,
      remainingPages: Math.max(0, totalPages - completedCount),
      currentPage: firstUntranslated,
      progressPercent: Math.round((completedCount / totalPages) * 100),
      failedPages: [],
      status: 'running',
      speedPagesPerMin: 0,
      estimatedSecondsRemaining: 0,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      isMinimized: false,
    };

    this.shouldStop = false;
    this.startTime = Date.now();
    this.pagesProcessedThisSession = 0;
    this.notify();
    await this.persistCurrentJob();

    // Start background processing loop
    this.processQueue();
  }

  public pauseTranslation() {
    if (!this.currentJob) return;
    this.shouldStop = true;
    this.currentJob.status = 'paused';
    this.currentJob.notice = 'Translation paused by user.';
    this.notify();
    this.persistCurrentJob();
  }

  public resumeTranslation() {
    if (!this.currentJob || this.currentJob.status === 'running') return;
    this.currentJob.status = 'running';
    this.currentJob.notice = undefined;
    this.shouldStop = false;
    this.startTime = Date.now();
    this.pagesProcessedThisSession = 0;
    this.notify();
    this.processQueue();
  }

  public stopTranslation() {
    this.shouldStop = true;
    if (this.currentJob) {
      this.currentJob.status = 'stopped';
      this.currentJob.notice = 'Translation stopped.';
      this.notify();
      this.persistCurrentJob();
    }
  }

  public toggleMinimize() {
    if (!this.currentJob) return;
    this.currentJob.isMinimized = !this.currentJob.isMinimized;
    this.notify();
  }

  public clearJob() {
    this.shouldStop = true;
    this.currentJob = null;
    this.notify();
  }

  /**
   * Main Queue Processor with Parallelism & Smart Resumption
   */
  private async processQueue() {
    if (this.isProcessing || !this.currentJob) return;
    this.isProcessing = true;

    try {
      const job = this.currentJob;
      const totalPages = job.totalPages;

      // Smart Resume: Identify all untranslated page indices
      const existing = await getChapterTranslations(job.mangaId, job.chapterNumber, job.targetLanguage, job.chapterId);

      // Create ordered list of pages to process starting from current page or first untranslated
      const pendingPages: number[] = [];
      for (let p = 1; p <= totalPages; p++) {
        if (!existing[p] || !existing[p].dialogues) {
          pendingPages.push(p);
        }
      }

      // If all pages already completed!
      if (pendingPages.length === 0) {
        job.status = 'completed';
        job.completedPages = totalPages;
        job.remainingPages = 0;
        job.progressPercent = 100;
        job.notice = 'All translated pages saved successfully.';
        this.notify();
        await this.persistCurrentJob();
        this.isProcessing = false;
        return;
      }

      // Process pages with controlled safe concurrency (1 page at a time with instant save & retry)
      for (const pageNum of pendingPages) {
        if (this.shouldStop || !this.currentJob || this.currentJob.status !== 'running') {
          break;
        }

        job.currentPage = pageNum;
        job.remainingPages = Math.max(0, totalPages - job.completedPages);
        job.progressPercent = Math.round((job.completedPages / totalPages) * 100);

        // Calculate dynamic pages per minute speed & estimated time remaining
        const elapsedSec = (Date.now() - this.startTime) / 1000;
        if (elapsedSec > 2 && this.pagesProcessedThisSession > 0) {
          const speed = (this.pagesProcessedThisSession / elapsedSec) * 60;
          job.speedPagesPerMin = Math.round(speed * 10) / 10;
          const remainingSec = Math.round((job.remainingPages / (speed / 60)));
          job.estimatedSecondsRemaining = isFinite(remainingSec) ? Math.max(0, remainingSec) : 0;
        }

        job.updatedAt = Date.now();
        this.notify();

        const imgUrl = job.pageUrls[pageNum - 1] || '';
        const isInlineData = imgUrl.startsWith('data:image/');

        try {
          // Respect the documented free-tier Vision quota: at most one request every 12 seconds.
          // This avoids bursts that trigger 429s; a rate-limited page is retried, never silently skipped.
          let result: TranslatedMangaPageResult;
          let attempts = 0;
          do {
            const waitMs = Math.max(0, 12_000 - (Date.now() - this.lastRequestStartedAt));
            if (waitMs > 0) {
              const waitUntil = Date.now() + waitMs;
              while (Date.now() < waitUntil && !this.shouldStop && this.currentJob) {
                await new Promise((resolve) => setTimeout(resolve, Math.min(500, waitUntil - Date.now())));
              }
            }
            if (this.shouldStop || !this.currentJob) break;

            this.lastRequestStartedAt = Date.now();
            result = await translateMangaPage({
              imageUrl: isInlineData ? '' : imgUrl,
              imageDataBase64: isInlineData ? imgUrl : undefined,
              pageNumber: pageNum,
              chapterNumber: job.chapterNumber,
              mangaId: job.mangaId,
              chapterId: job.chapterId,
              mangaTitle: job.mangaTitle,
              targetLanguage: job.targetLanguage,
              sourceLanguage: job.sourceLanguage,
              force: true,
            });

            if (!result.rateLimited) break;
            attempts++;
            const cooldownSec = Math.max(5, result.retryInSeconds || 15);
            job.notice = `Gemini quota cooldown: retrying this same page in ${cooldownSec}s (attempt ${attempts}/3).`;
            this.notify();
            const waitUntil = Date.now() + cooldownSec * 1000;
            while (Date.now() < waitUntil && !this.shouldStop && this.currentJob) {
              job.notice = `AI cooldown: ${Math.ceil((waitUntil - Date.now()) / 1000)}s remaining. Page ${pageNum} will retry automatically.`;
              this.notify();
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          } while (attempts < 3 && !this.shouldStop && this.currentJob);

          if (this.shouldStop || !this.currentJob) break;
          job.notice = undefined;

          // Rule 3: Auto Save immediately after every successful page!
          const hasDialogues = Boolean(result.dialogues && result.dialogues.length > 0 && result.provider !== 'untranslated');
          if (hasDialogues) {
            const storedRecord: StoredTranslatedPage = {
              id: `${job.mangaId}_ch${job.chapterNumber}_${job.chapterId || 'legacy'}_p${pageNum}_${job.targetLanguage}`,
              mangaId: job.mangaId,
              chapterId: job.chapterId,
              chapterNumber: job.chapterNumber,
              mangaTitle: job.mangaTitle,
              mangaCoverImage: job.mangaCoverImage,
              pageNumber: pageNum,
              originalImageUrl: imgUrl,
              targetLanguage: job.targetLanguage,
              sourceLanguage: job.sourceLanguage,
              status: 'completed',
              timestamp: Date.now(),
              result,
            };

            await saveTranslatedPage(storedRecord);
          }

          if (hasDialogues) {
            job.completedPages++;
            this.pagesProcessedThisSession++;
            // Remove from failed if it was there
            job.failedPages = job.failedPages.filter((p) => p !== pageNum);
          } else {
            // Keep page in failedPages for smart retry
            if (!job.failedPages.includes(pageNum)) {
              job.failedPages.push(pageNum);
            }
          }

          job.remainingPages = Math.max(0, totalPages - job.completedPages);
          job.progressPercent = Math.round((job.completedPages / totalPages) * 100);
          job.updatedAt = Date.now();
          this.notify();
          await this.persistCurrentJob();

        } catch (err) {
          console.warn(`Translation error on page ${pageNum}:`, err);
          if (!job.failedPages.includes(pageNum)) {
            job.failedPages.push(pageNum);
          }
          this.notify();
        }

        // Pacing delay between pages (150ms) to ensure smooth browser rendering and network balance
        if (!this.shouldStop) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      // Final state check
      if (job.completedPages >= totalPages) {
        job.status = 'completed';
        job.remainingPages = 0;
        job.progressPercent = 100;
        job.notice = 'All translated pages saved successfully.';
      } else if (this.shouldStop) {
        if (job.status !== 'stopped') job.status = 'paused';
      } else if (job.failedPages.length > 0) {
        job.status = 'failed';
        job.notice = `${job.failedPages.length} page(s) need retry. Your successful translations are saved; press Resume to retry failed pages.`;
      }

      this.notify();
      await this.persistCurrentJob();

    } finally {
      this.isProcessing = false;
    }
  }
}

// Singleton global background queue manager instance
export const mangaTranslationQueue = new TranslationQueueManager();
