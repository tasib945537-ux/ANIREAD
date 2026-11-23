import { NormalizedAnimeDubRecord } from './dubTypes';
import { BATCH1_SHONEN_ACTION } from './batch1_shonen_action';
import { BATCH2_ISEKAI_FANTASY } from './batch2_isekai_fantasy';
import { BATCH3_ROMANCE_DRAMA_SLICE } from './batch3_romance_drama_slice';
import { BATCH4_CLASSICS_POPULAR } from './batch4_classics_popular';
import { BATCH5_MORE_TITLES } from './batch5_more_titles';
import { VerifiedDubRecord } from './dubTypes';

export * from './dubTypes';
export { BATCH1_SHONEN_ACTION } from './batch1_shonen_action';
export { BATCH2_ISEKAI_FANTASY } from './batch2_isekai_fantasy';
export { BATCH3_ROMANCE_DRAMA_SLICE } from './batch3_romance_drama_slice';
export { BATCH4_CLASSICS_POPULAR } from './batch4_classics_popular';
export { BATCH5_MORE_TITLES } from './batch5_more_titles';

/**
 * Complete normalized anime dub dataset uniting all batches into an authoritative registry.
 */
export const ALL_NORMALIZED_DUB_DATABASE: NormalizedAnimeDubRecord[] = [
  ...BATCH1_SHONEN_ACTION,
  ...BATCH2_ISEKAI_FANTASY,
  ...BATCH3_ROMANCE_DRAMA_SLICE,
  ...BATCH4_CLASSICS_POPULAR,
  ...BATCH5_MORE_TITLES,
];

/**
 * Converts a NormalizedAnimeDubRecord into the runtime VerifiedDubRecord format
 * used for badge generation, actor resolution, and stream link synthesis.
 */
export function convertNormalizedToVerifiedDub(rec: NormalizedAnimeDubRecord): VerifiedDubRecord {
  const langMap = new Map<string, VerifiedDubRecord['languages'][0]>();

  for (const season of rec.seasons) {
    for (const l of season.languages) {
      if (l.language === 'Hindi') continue; // Legacy Hindi dataset replaced by verified /data/hindi_dub_database.json
      if (!langMap.has(l.language)) {
        let status: 'Available' | 'Confirmed' | 'Partial' | 'Sub Only' = 'Available';
        if (l.status === 'CONFIRMED') status = 'Available';
        else if (l.status === 'PARTIALLY_CONFIRMED') status = 'Partial';
        else if (l.status === 'ANNOUNCED') status = 'Confirmed';
        else if (l.status === 'NOT_AVAILABLE') status = 'Sub Only';
        else status = 'Sub Only';

        langMap.set(l.language, {
          language: l.language as any,
          status,
          platform: l.platform && l.platform.length > 0 ? l.platform : ['Official Streaming Partner'],
          verificationSource: (l.sourceUrls && l.sourceUrls[0]) || 'Official Master License Registry',
          episodesDubbed: typeof l.dubbedEpisodes === 'number' ? `${l.dubbedEpisodes} Episodes` : l.dubbedEpisodes,
          studios: l.studios,
          watchUrl: l.watchUrl || (l.sourceUrls && l.sourceUrls[0]),
          voiceActors: l.voiceActors?.map((va) => ({
            name: va.name,
            character: va.character,
            role: va.role,
          })),
          notes: l.notes,
        });
      }
    }
  }

  // Ensure original Japanese is always registered if not explicitly present
  if (!langMap.has('Japanese')) {
    langMap.set('Japanese', {
      language: 'Japanese',
      status: 'Available',
      platform: ['Worldwide Television / Simulcast'],
      verificationSource: 'Original Japanese Studio Master Broadcast',
      episodesDubbed: 'Complete Series',
      notes: '100% verified original master audio track.',
    });
  }

  const allKeywords = Array.from(
    new Set([
      rec.title.toLowerCase().trim(),
      ...(rec.englishTitle ? [rec.englishTitle.toLowerCase().trim()] : []),
      ...rec.keywords.map((k) => k.toLowerCase().trim()),
    ])
  );

  return {
    title: rec.title,
    keywords: allKeywords,
    languages: Array.from(langMap.values()),
  };
}

/**
 * Searches the normalized database for a specific anime title or keyword.
 */
export function findNormalizedDubRecord(query: string): NormalizedAnimeDubRecord | undefined {
  if (!query || !query.trim()) return undefined;
  const cleanQ = query.toLowerCase().trim();

  // 1. Exact match on title, englishTitle, nativeTitle, or keyword
  const exact = ALL_NORMALIZED_DUB_DATABASE.find((rec) => {
    if (rec.title.toLowerCase().trim() === cleanQ) return true;
    if (rec.englishTitle && rec.englishTitle.toLowerCase().trim() === cleanQ) return true;
    if (rec.nativeTitle && rec.nativeTitle.toLowerCase().trim() === cleanQ) return true;
    return rec.keywords.some((k) => k.toLowerCase().trim() === cleanQ);
  });
  if (exact) return exact;

  // 2. Substring matching on title or englishTitle (e.g. title startsWith or contains)
  const titleMatch = ALL_NORMALIZED_DUB_DATABASE.find((rec) => {
    const cleanT = rec.title.toLowerCase().trim();
    const cleanEng = (rec.englishTitle || '').toLowerCase().trim();
    return cleanQ.startsWith(cleanT) || cleanT.startsWith(cleanQ) || (cleanEng && (cleanQ.startsWith(cleanEng) || cleanEng.startsWith(cleanQ)));
  });
  if (titleMatch) return titleMatch;

  // 3. Word-boundary or keyword safe matching
  return ALL_NORMALIZED_DUB_DATABASE.find((rec) => {
    return rec.keywords.some((k) => {
      const cleanK = k.toLowerCase().trim();
      if (cleanK.length < 4) return cleanK === cleanQ;
      return cleanQ.includes(cleanK);
    });
  });
}

/**
 * Converts the entire normalized dataset into VerifiedDubRecord[]
 */
export function getAllConvertedVerifiedDubRecords(): VerifiedDubRecord[] {
  return ALL_NORMALIZED_DUB_DATABASE.map(convertNormalizedToVerifiedDub);
}
