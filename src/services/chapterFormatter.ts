/**
 * Authoritative Manga Chapter Parser and Formatter for AniRead
 *
 * Requirements:
 * 1. Parse chapter number and chapter title separately.
 * 2. Remove duplicated prefixes such as "Ch. 1:", "Chapter 1:", and repeated chapter numbers.
 * 3. Display each chapter exactly once, using this format: "Ch. 1 — Chapter Name"
 * 4. Preserve original chapter titles and their original language. Never invent missing titles.
 * 5. If a chapter title is missing, display "Ch. 11 — Untitled Chapter".
 * 6. Sort chapters by their actual chapter number (numeric), not alphabetically.
 */

export interface ParsedChapterInfo {
  chapterNumber: string;
  cleanTitle: string;
  displayLabel: string;
  isUntitled: boolean;
}

/**
 * Parses chapter number and chapter title separately, removing any duplicated prefixes
 * like "Ch. 1:", "Chapter 1 -", "Ch. 1: Ch. 1:", etc.
 */
export function parseChapterInfo(
  rawChapterNum: string | number | undefined | null,
  rawTitle?: string | null
): ParsedChapterInfo {
  // 1. Normalize chapter number
  let chNum = rawChapterNum !== undefined && rawChapterNum !== null ? String(rawChapterNum).trim() : '1';
  if (!chNum || chNum === 'null' || chNum === 'undefined') {
    chNum = '1';
  }

  // If chapterNumber contains a prefix like "Chapter 1" or "Ch. 1", strip it down to the number
  const chNumClean = chNum.replace(/^(?:ch(?:apter)?\.?\s*)/i, '').trim() || chNum;

  // 2. Normalize and clean the title
  let cleanTitle = (rawTitle || '').trim();

  if (!cleanTitle) {
    return {
      chapterNumber: chNumClean,
      cleanTitle: 'Untitled Chapter',
      displayLabel: `Ch. ${chNumClean} — Untitled Chapter`,
      isUntitled: true,
    };
  }

  // Remove repeated prefixes: "Ch. 1:", "Chapter 1:", "Ch. 1 -", "Ch 1 :", etc. (repeated 1 or more times)
  // Handles decimal chapters like "Ch. 10.5:" or "Chapter 11:"
  const prefixPattern = /^(?:(?:ch(?:apter)?\.?\s*\d+(?:\.\d+)?|ch(?:apter)?\.?)\s*[:—–-]\s*|\s*ch(?:apter)?\.?\s*\d+(?:\.\d+)?\s+)+/i;
  cleanTitle = cleanTitle.replace(prefixPattern, '').trim();

  // Also remove standalone repeated prefixes like "Ch. 1", "Chapter 1"
  const repeatedExactNumberPattern = new RegExp(`^(?:ch(?:apter)?\\.?\\s*${chNumClean}\\s*[:—–-]?\\s*)+`, 'i');
  cleanTitle = cleanTitle.replace(repeatedExactNumberPattern, '').trim();

  // Strip any leftover leading dashes or colons
  cleanTitle = cleanTitle.replace(/^[:—–-]\s*/, '').trim();

  // Check if title is generic or just the chapter number itself, e.g. "Chapter 11", "Ch. 11", "11", etc.
  const isGenericChapterName =
    !cleanTitle ||
    cleanTitle.toLowerCase() === `chapter ${chNumClean}`.toLowerCase() ||
    cleanTitle.toLowerCase() === `chapter` ||
    cleanTitle.toLowerCase() === `ch. ${chNumClean}`.toLowerCase() ||
    cleanTitle.toLowerCase() === `ch ${chNumClean}`.toLowerCase() ||
    cleanTitle.toLowerCase() === `ch.` ||
    cleanTitle === chNumClean;

  if (isGenericChapterName) {
    return {
      chapterNumber: chNumClean,
      cleanTitle: 'Untitled Chapter',
      displayLabel: `Ch. ${chNumClean} — Untitled Chapter`,
      isUntitled: true,
    };
  }

  return {
    chapterNumber: chNumClean,
    cleanTitle,
    displayLabel: `Ch. ${chNumClean} — ${cleanTitle}`,
    isUntitled: false,
  };
}

/**
 * Returns the exact standardized display label: "Ch. 1 — Chapter Name" or "Ch. 11 — Untitled Chapter"
 */
export function formatChapterDisplayLabel(
  rawChapterNum: string | number | undefined | null,
  rawTitle?: string | null
): string {
  return parseChapterInfo(rawChapterNum, rawTitle).displayLabel;
}

/**
 * Sorts chapters by their actual chapter number numerically (e.g. 1, 2, 2.5, 10, 11)
 * instead of alphabetical sorting ('1', '10', '11', '2').
 */
export function sortChaptersNumerically<T extends { chapterNumber: string | number }>(
  chapters: T[],
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...chapters].sort((a, b) => {
    const numA = parseFloat(String(a.chapterNumber).replace(/[^0-9.]/g, '')) || 0;
    const numB = parseFloat(String(b.chapterNumber).replace(/[^0-9.]/g, '')) || 0;
    if (numA !== numB) {
      return order === 'asc' ? numA - numB : numB - numA;
    }
    // If numbers are identical (e.g. sub-chapters or string keys), fallback to stable string comparison
    return String(a.chapterNumber).localeCompare(String(b.chapterNumber), undefined, { numeric: true });
  });
}
