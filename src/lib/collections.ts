/**
 * Generic client-side API for file-based content collections.
 *
 * In dev mode, talks to the Vite CMS middleware at `/__collection/{key}`.
 * In production, reads pre-built static JSON from `/content/collections/{key}/`.
 * Pending (staged) entries are merged on top of fetched data so that CMS edits
 * are immediately visible even before they are committed to a backend.
 */

import type { ContentCollectionDef } from "./layout-manifest";
import {
  applyPendingToItem,
  applyPendingToList,
  stagePendingDelete,
  stagePendingSave,
} from "./pending";
import { isDbMode, fetchCollectionFromDb, fetchCollectionItemFromDb, saveCollectionItemToDb, deleteCollectionItemFromDb } from "./persistence-db";

// Build-time injected collection definitions
const defs: ContentCollectionDef[] =
  typeof __PK_CONTENT_COLLECTIONS__ !== "undefined" ? __PK_CONTENT_COLLECTIONS__ : [];

/** Look up a collection definition by key. */
export const getCollectionDef = (key: string): ContentCollectionDef | undefined =>
  defs.find((d) => d.key === key);

/** Get all collection definitions. */
export const getCollectionDefs = (): ContentCollectionDef[] => defs;

/** Fetch the list of items for a file-based collection. */
export const fetchCollectionItems = async (
  key: string,
): Promise<Record<string, unknown>[]> => {
  let items: Record<string, unknown>[];

  if (isDbMode()) {
    items = await fetchCollectionFromDb(key);
    return applyPendingToList(key, items, getCollectionDef(key)?.sortField, getCollectionDef(key)?.sortOrder);
  }

  if (import.meta.env.DEV) {
    const res = await fetch(`/__collection/${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Failed to fetch collection ${key}: ${res.status}`);
    }
    items = await res.json();
  } else {
    const res = await fetch(`/content/collections/${encodeURIComponent(key)}/index.json`);
    if (!res.ok) {
      if (res.status === 404) items = [];
      else throw new Error(`Failed to fetch collection ${key}: ${res.status}`);
    } else {
      items = await res.json();
    }
  }

  // Merge pending entries on top of fetched data
  const def = getCollectionDef(key);
  return applyPendingToList(key, items, def?.sortField, def?.sortOrder);
};

/** Fetch a single item by slug from a file-based collection. */
export const fetchCollectionItem = async (
  key: string,
  slug: string,
): Promise<Record<string, unknown> | null> => {
  // Check pending state first
  const pending = applyPendingToItem(key, slug);
  if (pending === null) return null; // deleted
  if (pending !== undefined) return pending; // staged save

  if (isDbMode()) {
    return fetchCollectionItemFromDb(key, slug);
  }

  if (import.meta.env.DEV) {
    const res = await fetch(
      `/__collection/${encodeURIComponent(key)}?slug=${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return res.json();
  }

  const res = await fetch(
    `/content/collections/${encodeURIComponent(key)}/${slug.split("/").map(encodeURIComponent).join("/")}.json`,
  );
  if (!res.ok) return null;
  return res.json();
};

/** Save (create or update) a collection item. */
export const saveCollectionItem = async (
  key: string,
  slug: string,
  data: Record<string, unknown>,
): Promise<void> => {
  if (isDbMode()) {
    await saveCollectionItemToDb(key, slug, data);
    return;
  }
  if (import.meta.env.DEV) {
    await fetch(`/__collection/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, slug }),
    });
    return;
  }
  // Production: stage the change in localStorage until committed
  stagePendingSave(key, slug, data);
};

/** Delete a collection item by slug. */
export const deleteCollectionItem = async (
  key: string,
  slug: string,
): Promise<void> => {
  if (isDbMode()) {
    await deleteCollectionItemFromDb(key, slug);
    return;
  }
  if (import.meta.env.DEV) {
    await fetch(
      `/__collection/${encodeURIComponent(key)}?slug=${encodeURIComponent(slug)}`,
      { method: "DELETE" },
    );
    return;
  }
  // Production: stage the deletion in localStorage until committed
  stagePendingDelete(key, slug);
};
