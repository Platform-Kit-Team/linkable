import type { BioModel } from "./model";
import { sanitizeModel, stableStringify } from "./model";

// use a unique path that won't collide with Vite's internal module
// handling for JSON files. `/cms-data` was being rewritten by the server, so
// fetching it returned a JS module rather than raw JSON.
declare const __PK_CMS_DATA_ENDPOINT__: string | undefined;
const DEV_ENDPOINT = typeof __PK_CMS_DATA_ENDPOINT__ !== "undefined" ? __PK_CMS_DATA_ENDPOINT__ : "/__cms-data";
const PROD_ENDPOINT = "/data.json";

const PENDING_CMS_KEY = "pending-cms";

export type PersistResult = "dev" | "staged" | "skipped";

/**
 * In production, check localStorage for staged (uncommitted) edits.
 * If found, use those instead of the remote data.json so the user
 * sees their in-progress work.
 */
export const fetchModel = async (): Promise<BioModel> => {
  // In production, prefer staged data from localStorage
  if (!import.meta.env.DEV) {
    try {
      const staged = window.localStorage.getItem(PENDING_CMS_KEY);
      if (staged) {
        return sanitizeModel(JSON.parse(staged));
      }
    } catch {
      // fall through to remote fetch
    }
  }

  const endpoint = import.meta.env.DEV ? DEV_ENDPOINT : PROD_ENDPOINT;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cache: import.meta.env.DEV ? "no-store" : "default",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CMS data: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return sanitizeModel(payload);
};

export const persistModel = async (input: BioModel): Promise<PersistResult> => {
  const sanitized = sanitizeModel(input);
  const serialized = stableStringify(sanitized);

  if (import.meta.env.DEV) {
    // development writes to local server endpoint
    await fetch(DEV_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serialized,
    });
    return "dev";
  }

  // production: stage changes in localStorage until user commits
  try {
    window.localStorage.setItem(PENDING_CMS_KEY, serialized);
  } catch {
    // ignore if storage unavailable
  }
  return "staged";
};

/** Check if there are uncommitted staged changes in localStorage. */
export const hasStagedChanges = (): boolean => {
  try {
    return !!window.localStorage.getItem(PENDING_CMS_KEY);
  } catch {
    return false;
  }
};

/** Get the staged JSON string (for committing to GitHub). */
export const getStagedData = (): string | null => {
  try {
    return window.localStorage.getItem(PENDING_CMS_KEY);
  } catch {
    return null;
  }
};

/** Clear staged data after a successful commit. */
export const clearStagedData = (): void => {
  try {
    window.localStorage.removeItem(PENDING_CMS_KEY);
  } catch {
    // ignore
  }
};