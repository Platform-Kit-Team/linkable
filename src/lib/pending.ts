/**
 * Generic pending-changes system for content collections and uploads.
 *
 * In production (no dev server), edits made through the CMS are staged
 * in localStorage so the UI reflects changes immediately, even before
 * they've been committed to GitHub or another backend. Each collection
 * gets its own namespace. Upload URLs are tracked separately so newly
 * uploaded files can be resolved from pending state.
 *
 * The pending store is write-through: reads merge staged entries on top
 * of the server response, and writes stage optimistically.
 */

// ── Types ────────────────────────────────────────────────────────────

export interface PendingEntry {
  slug: string;
  data?: Record<string, unknown>;
  deleted?: boolean;
}

// ── Storage key helpers ──────────────────────────────────────────────

const collectionStorageKey = (collectionKey: string) =>
  `pending-collection:${collectionKey}`;

const PENDING_UPLOADS_KEY = "pending-uploads";

// ── Collection pending entries ───────────────────────────────────────

/** Read all pending entries for a given collection. */
export const readPendingEntries = (
  collectionKey: string,
): Record<string, PendingEntry> => {
  try {
    const raw = window.localStorage.getItem(collectionStorageKey(collectionKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, PendingEntry>;
  } catch {
    return {};
  }
};

/** Write all pending entries for a given collection. */
export const writePendingEntries = (
  collectionKey: string,
  entries: Record<string, PendingEntry>,
): void => {
  try {
    const keys = Object.keys(entries);
    if (keys.length === 0) {
      window.localStorage.removeItem(collectionStorageKey(collectionKey));
    } else {
      window.localStorage.setItem(
        collectionStorageKey(collectionKey),
        JSON.stringify(entries),
      );
    }
  } catch {
    // localStorage may be full or unavailable
  }
};

/** Stage a save (create or update) for a collection item. */
export const stagePendingSave = (
  collectionKey: string,
  slug: string,
  data: Record<string, unknown>,
): void => {
  const entries = readPendingEntries(collectionKey);
  entries[slug] = { slug, data, deleted: false };
  writePendingEntries(collectionKey, entries);
};

/** Stage a deletion for a collection item. */
export const stagePendingDelete = (
  collectionKey: string,
  slug: string,
): void => {
  const entries = readPendingEntries(collectionKey);
  entries[slug] = { slug, deleted: true };
  writePendingEntries(collectionKey, entries);
};

/** Clear a single pending entry (e.g. after successful commit). */
export const clearPendingEntry = (
  collectionKey: string,
  slug: string,
): void => {
  const entries = readPendingEntries(collectionKey);
  delete entries[slug];
  writePendingEntries(collectionKey, entries);
};

/** Clear all pending entries for a collection. */
export const clearPendingCollection = (collectionKey: string): void => {
  try {
    window.localStorage.removeItem(collectionStorageKey(collectionKey));
  } catch {
    // ignore
  }
};

/**
 * Apply pending entries on top of a fetched item list.
 * Deleted items are removed; saved items are merged/added.
 * Returns a new array — does not mutate the input.
 */
export const applyPendingToList = (
  collectionKey: string,
  items: Record<string, unknown>[],
  sortField?: string,
  sortOrder?: "asc" | "desc",
): Record<string, unknown>[] => {
  const entries = readPendingEntries(collectionKey);
  if (Object.keys(entries).length === 0) return items;

  const bySlug = new Map<string, Record<string, unknown>>();
  for (const item of items) {
    const slug = String(item.slug ?? "");
    if (slug) bySlug.set(slug, item);
  }

  for (const [slug, entry] of Object.entries(entries)) {
    if (entry.deleted) {
      bySlug.delete(slug);
      continue;
    }
    if (entry.data) {
      bySlug.set(slug, { ...entry.data, slug });
    }
  }

  const result = Array.from(bySlug.values());

  if (sortField) {
    const dir = sortOrder === "asc" ? 1 : -1;
    result.sort((a, b) => {
      const av = String(a[sortField] ?? "");
      const bv = String(b[sortField] ?? "");
      return av > bv ? dir : av < bv ? -dir : 0;
    });
  }

  return result;
};

/**
 * Apply pending entries for a single item fetch.
 * Returns the pending version if one exists, null if deleted, or
 * undefined if no pending entry (caller should use server response).
 */
export const applyPendingToItem = (
  collectionKey: string,
  slug: string,
): Record<string, unknown> | null | undefined => {
  const entries = readPendingEntries(collectionKey);
  const entry = entries[slug];
  if (!entry) return undefined;
  if (entry.deleted) return null;
  if (entry.data) return { ...entry.data, slug };
  return undefined;
};

// ── Pending uploads ──────────────────────────────────────────────────

/**
 * Track a pending upload URL so the UI can resolve it before the file
 * has been committed to the content repo.
 */
export const addPendingUpload = (url: string): void => {
  try {
    const existing = getPendingUploads();
    if (!existing.includes(url)) {
      existing.push(url);
      window.localStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(existing));
    }
  } catch {
    // ignore
  }
};

/** Get all pending upload URLs. */
export const getPendingUploads = (): string[] => {
  try {
    const raw = window.localStorage.getItem(PENDING_UPLOADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Remove a pending upload URL (e.g. after commit). */
export const removePendingUpload = (url: string): void => {
  try {
    const existing = getPendingUploads().filter((u) => u !== url);
    if (existing.length === 0) {
      window.localStorage.removeItem(PENDING_UPLOADS_KEY);
    } else {
      window.localStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(existing));
    }
  } catch {
    // ignore
  }
};

/** Clear all pending uploads. */
export const clearPendingUploads = (): void => {
  try {
    window.localStorage.removeItem(PENDING_UPLOADS_KEY);
  } catch {
    // ignore
  }
};
