const STORAGE_KEY = 'aniread_gemini_api_key_v1';

export function getGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(STORAGE_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(value: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, value.trim());
}

export function clearGeminiApiKey(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
