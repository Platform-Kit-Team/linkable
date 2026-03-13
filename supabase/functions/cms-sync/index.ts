/**
 * cms-sync edge function
 *
 * Single CRUD endpoint for CMS data (site model + collections).
 * Auth via x-admin-token header using verifyAdminToken().
 * Writes use SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
 *
 * Query params:
 *   ?scope=site                         GET/POST  site model
 *   ?scope=collection&key={k}           GET/POST  full collection
 *   ?scope=collection&key={k}&slug={s}  GET/POST/DELETE  single item
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { verifyAdminToken } from "../_shared/admin-auth.ts";

const TABLE = "cms_data";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

async function requireAuth(req: Request): Promise<Response | null> {
  const token = req.headers.get("x-admin-token");
  if (!token) return errorResponse("Missing x-admin-token", 401);
  const keyHint = req.headers.get("apikey");
  const valid = await verifyAdminToken(token, keyHint);
  if (!valid) return errorResponse("Invalid admin token", 403);
  return null;
}

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

function getAnonClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(url, key);
}

// ── Site model handlers ────────────────────────────────────────────────

async function getSiteModel() {
  const sb = getAnonClient();
  const { data, error } = await sb
    .from(TABLE)
    .select("data, schema_version")
    .eq("id", "site")
    .maybeSingle();

  if (error) return errorResponse(error.message, 500);
  if (!data) return jsonResponse(null);
  return jsonResponse(data.data);
}

async function postSiteModel(req: Request) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const body = await req.json();
  const sb = getServiceClient();

  const { error } = await sb.from(TABLE).upsert({
    id: "site",
    data: body,
    schema_version: 0,
    updated_at: new Date().toISOString(),
  });

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ ok: true });
}

// ── Collection handlers ────────────────────────────────────────────────

async function getCollection(key: string) {
  const sb = getAnonClient();
  const { data, error } = await sb
    .from(TABLE)
    .select("data, schema_version")
    .eq("id", `collection:${key}`)
    .maybeSingle();

  if (error) return errorResponse(error.message, 500);
  if (!data) return jsonResponse([]);
  const items = (data.data as any)?.items ?? [];
  return jsonResponse(items);
}

async function getCollectionItem(key: string, slug: string) {
  const sb = getAnonClient();
  const { data, error } = await sb
    .from(TABLE)
    .select("data")
    .eq("id", `collection:${key}`)
    .maybeSingle();

  if (error) return errorResponse(error.message, 500);
  if (!data) return jsonResponse(null);
  const items = (data.data as any)?.items ?? [];
  const item = items.find((i: any) => i.slug === slug);
  return jsonResponse(item ?? null);
}

async function postCollection(key: string, req: Request) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const body = await req.json();
  const sb = getServiceClient();

  // body is expected to be the full items array
  const items = Array.isArray(body) ? body : (body.items ?? []);
  const schemaVersion = body.schema_version ?? 0;

  const { error } = await sb.from(TABLE).upsert({
    id: `collection:${key}`,
    data: { items },
    schema_version: schemaVersion,
    updated_at: new Date().toISOString(),
  });

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ ok: true });
}

async function postCollectionItem(key: string, slug: string, req: Request) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const itemData = await req.json();
  const sb = getServiceClient();

  // Fetch existing collection
  const { data: existing } = await sb
    .from(TABLE)
    .select("data, schema_version")
    .eq("id", `collection:${key}`)
    .maybeSingle();

  const items: any[] = (existing?.data as any)?.items ?? [];
  const idx = items.findIndex((i: any) => i.slug === slug);

  if (idx >= 0) {
    items[idx] = { ...itemData, slug };
  } else {
    items.push({ ...itemData, slug });
  }

  const { error } = await sb.from(TABLE).upsert({
    id: `collection:${key}`,
    data: { items },
    schema_version: existing?.schema_version ?? 0,
    updated_at: new Date().toISOString(),
  });

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ ok: true });
}

async function deleteCollectionItem(key: string, slug: string, req: Request) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const sb = getServiceClient();

  const { data: existing } = await sb
    .from(TABLE)
    .select("data, schema_version")
    .eq("id", `collection:${key}`)
    .maybeSingle();

  if (!existing) return jsonResponse({ ok: true });

  const items: any[] = (existing.data as any)?.items ?? [];
  const filtered = items.filter((i: any) => i.slug !== slug);

  const { error } = await sb.from(TABLE).upsert({
    id: `collection:${key}`,
    data: { items: filtered },
    schema_version: existing.schema_version ?? 0,
    updated_at: new Date().toISOString(),
  });

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ ok: true });
}

// ── Main handler ───────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");
    const key = url.searchParams.get("key");
    const slug = url.searchParams.get("slug");

    if (scope === "auth-check") {
      if (req.method === "POST") {
        const authErr = await requireAuth(req);
        if (authErr) return authErr;
        return jsonResponse({ ok: true });
      }
      return errorResponse("Method not allowed", 405);
    }

    if (scope === "site") {
      if (req.method === "GET") return await getSiteModel();
      if (req.method === "POST") return await postSiteModel(req);
      return errorResponse("Method not allowed", 405);
    }

    if (scope === "collection") {
      if (!key) return errorResponse("Missing 'key' query param");

      if (slug) {
        if (req.method === "GET") return await getCollectionItem(key, slug);
        if (req.method === "POST") return await postCollectionItem(key, slug, req);
        if (req.method === "DELETE") return await deleteCollectionItem(key, slug, req);
        return errorResponse("Method not allowed", 405);
      }

      if (req.method === "GET") return await getCollection(key);
      if (req.method === "POST") return await postCollection(key, req);
      return errorResponse("Method not allowed", 405);
    }

    return errorResponse("Missing or invalid 'scope' query param. Use 'site', 'collection', or 'auth-check'.");
  } catch (err) {
    console.error("[cms-sync] unhandled error:", err);
    return errorResponse("Internal server error", 500);
  }
});
