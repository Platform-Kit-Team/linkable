/**
 * Database-mode persistence helpers.
 *
 * When Lovable Cloud is connected (via URL or project/key env vars), the CMS
 * reads/writes data via the `cms-sync` edge function and uploads files
 * to the `cms-uploads` storage bucket.
 */

import type { BioModel } from "./model";
import { encryptPayload } from "./admin-crypto";
import { getCmsPassword } from "./cms-auth";

import { getBackendApiKey, getBackendBaseUrl, hasBackendConfig } from "./cloud-env";

const supabaseAnonKey = getBackendApiKey();
const supabaseUrl = getBackendBaseUrl();

export const getDbBaseUrl = (): string | null => supabaseUrl || null;

/**
 * Returns true when the app is connected to Lovable Cloud,
 * meaning we should use database mode instead of file/git mode.
 */
export const isDbMode = (): boolean => hasBackendConfig();

// ── Edge function URL builder ──────────────────────────────────────────

const edgeFnUrl = (params: Record<string, string>): string => {
  const base = supabaseUrl
    ? `${supabaseUrl}/functions/v1/cms-sync`
    : "";
  const qs = new URLSearchParams(params).toString();
  return `${base}?${qs}`;
};

// ── Admin token ────────────────────────────────────────────────────────

const getAdminHeaders = async (): Promise<Record<string, string>> => {
  const password = getCmsPassword();
  if (!password || !supabaseAnonKey) {
    throw new Error("CMS password or anon key not available for admin auth.");
  }
  const payload = JSON.stringify({ password, ts: Date.now() });
  const encrypted = await encryptPayload(payload, supabaseAnonKey);
  return {
    "Content-Type": "application/json",
    "x-admin-token": encrypted,
    apikey: supabaseAnonKey,
  };
};

const readHeaders = (): Record<string, string> => {
  const h: Record<string, string> = { Accept: "application/json" };
  if (supabaseAnonKey) h.apikey = supabaseAnonKey;
  return h;
};

// ── Site model ─────────────────────────────────────────────────────────

export const fetchModelFromDb = async (): Promise<BioModel | null> => {
  const res = await fetch(edgeFnUrl({ scope: "site" }), {
    headers: readHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch site model: ${res.status}`);
  const data = await res.json();
  return data ?? null;
};

export const persistModelToDb = async (model: BioModel): Promise<void> => {
  const headers = await getAdminHeaders();
  const res = await fetch(edgeFnUrl({ scope: "site" }), {
    method: "POST",
    headers,
    body: JSON.stringify(model),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `Failed to persist site model: ${res.status}`);
  }
};

// ── Collections ────────────────────────────────────────────────────────

export const fetchCollectionFromDb = async (
  key: string,
): Promise<Record<string, unknown>[]> => {
  const res = await fetch(
    edgeFnUrl({ scope: "collection", key }),
    { headers: readHeaders() },
  );
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to fetch collection ${key}: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchCollectionItemFromDb = async (
  key: string,
  slug: string,
): Promise<Record<string, unknown> | null> => {
  const res = await fetch(
    edgeFnUrl({ scope: "collection", key, slug }),
    { headers: readHeaders() },
  );
  if (!res.ok) return null;
  return await res.json();
};

export const saveCollectionItemToDb = async (
  key: string,
  slug: string,
  data: Record<string, unknown>,
): Promise<void> => {
  const headers = await getAdminHeaders();
  const res = await fetch(edgeFnUrl({ scope: "collection", key, slug }), {
    method: "POST",
    headers,
    body: JSON.stringify({ ...data, slug }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `Failed to save collection item: ${res.status}`);
  }
};

export const deleteCollectionItemFromDb = async (
  key: string,
  slug: string,
): Promise<void> => {
  const headers = await getAdminHeaders();
  const res = await fetch(edgeFnUrl({ scope: "collection", key, slug }), {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `Failed to delete collection item: ${res.status}`);
  }
};

// ── File uploads to storage ────────────────────────────────────────────

export const uploadToStorage = async (file: File): Promise<string> => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase not configured for uploads.");
  }

  // Generate a unique filename
  const ext = (file.name || "file").split(".").pop()?.toLowerCase() || "bin";
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const safeName = (file.name || "file")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 40) || "file";
  const storagePath = `${safeName}-${timestamp}-${rand}.${ext}`;

  // Upload using the Storage REST API with service role via edge function
  // We use the Supabase Storage API directly here
  const uploadUrl = `${supabaseUrl}/storage/v1/object/cms-uploads/${storagePath}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${err}`);
  }

  // Return the public URL
  return `${supabaseUrl}/storage/v1/object/public/cms-uploads/${storagePath}`;
};
