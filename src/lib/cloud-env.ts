/**
 * Runtime backend env helpers.
 *
 * Supports published builds where env injection can be incomplete by deriving
 * backend URL from project ID/JWT and finally falling back to this project's
 * Cloud defaults.
 */

// Use direct static property access — Vite's `define` only replaces literal
// `import.meta.env.FOO` expressions, not dynamic property lookups on a stored reference.

const base64UrlToBase64 = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  return pad ? normalized + "=".repeat(4 - pad) : normalized;
};

const extractProjectIdFromJwt = (jwt: string | undefined): string | undefined => {
  if (!jwt) return undefined;
  const parts = jwt.split(".");
  if (parts.length < 2 || typeof globalThis.atob !== "function") return undefined;
  try {
    const payload = JSON.parse(globalThis.atob(base64UrlToBase64(parts[1])));
    return typeof payload?.ref === "string" ? payload.ref : undefined;
  } catch {
    return undefined;
  }
};

const normalizeProjectId = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(trimmed) ? trimmed : undefined;
};

const backendApiKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_FALLBACK_ANON_KEY
)?.trim();

const projectId = normalizeProjectId(
  import.meta.env.VITE_SUPABASE_PROJECT_ID ||
  extractProjectIdFromJwt(backendApiKey),
);

const backendBaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  (projectId ? `https://${projectId}.supabase.co` : undefined) ||
  import.meta.env.VITE_SUPABASE_FALLBACK_URL
)
  ?.trim()
  .replace(/\/+$/, "");

export const getBackendBaseUrl = (): string => backendBaseUrl || "";

export const getBackendApiKey = (): string => backendApiKey || "";

export const hasBackendConfig = (): boolean => !!(backendBaseUrl && backendApiKey);
