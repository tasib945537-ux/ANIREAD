/**
 * Resolve backend API paths for both browser and native Android builds.
 * VITE_API_BASE_URL is injected at build time by the Android workflow.
 */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const configuredBase = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  return configuredBase ? `${configuredBase}${normalizedPath}` : normalizedPath;
}
