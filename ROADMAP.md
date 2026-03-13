# PlatformKit Roadmap

> **Last updated:** 2026-03-13 (rev 32)
>
> ### Rev 32 — Consolidate Products Schema & Fix Bugs
> - Eliminated duplicate `products` definition: removed from `contentCollections`, kept single authoritative entry in `contentSchemas` with `external: true`, `directory`, and `format` fields.
> - Fixed `metadata` default from `[]` (array) to `{}` (object) in `newItem()`.
> - Added `"products"` to `externalKeys` fallback in `model.ts` so product items[] are correctly emptied (data lives in files/DB).
> ### Rev 31 — Move Products to Theme Config
> ### Rev 30 — Fix Content Schema Tab Ordering
> - Changed merge to use override ordering first, then append base-only keys. Products now appears last in the CMS tab bar.
> ### Rev 29 — Product Card Edit Button Fix + Cart Remove Fix
> - **Edit button fix**: Product cards used `product.id` but collection items use `slug`. Changed to `product.slug || product.id` so the edit pencil now appears correctly when CMS is toggled on.
> - **Cart remove**: `removeItem` removes the entire entry (the minus button handles decrementing).
> ### Rev 28 — Shop Admin Convenience
> - **CMS auto-opens to Products**: When on `/shop`, clicking the CMS button now opens directly to the Products tab (`cmsInitialTab` returns `'products'`).
> - **Per-product edit buttons**: Admin users see a pencil edit button (top-left) on each product card in the shop grid. Clicking opens the item editor sidebar for that product. Only visible when CMS is active.
> - **Products schema order confirmed**: Products contentSchema is already last in the theme config (after Newsletter), matching the intended tab order.
> ### Rev 27 — Product Editor Robustness
> - **A. Read-only Stripe fields**: Converted `itemSchema` from static array to a function `(item) => FormKitSchemaNode[]`. When `stripe_product_id` exists, `stripe_product_id`, `stripe_price_id`, `currency`, and `product_type` become disabled with contextual help text.
> - **B. Save & Push to Stripe**: Added a "Push to Stripe" button inside the editor drawer via a new `after-actions` slot in `CollectionItemDrawer`. Users can push without closing the drawer.
> - **C. Stripe price context**: Added a `before-form` slot showing a green info banner when a product is synced, displaying the current Stripe price ID and a note about price immutability.
> - **D. Currency-aware cart**: `CartDrawer.vue` now uses `Intl.NumberFormat` with the item's `currency` field instead of hardcoded `$`.
> - **E. Cleanup**: Removed stale `title: ""` from `newItem()` factory.
> ### Rev 26 — Fix product row layout + remove duplicate title field
> - Product rows used a `<div>` wrapper inside `cms__row` grid, causing content to be squeezed into the first 34px column. Changed to a `<button>` element with `grid-template-columns: 44px 1fr auto auto` so the full row is clickable and text displays correctly.
> - Removed redundant `title` field from product schema (only `name` is needed).
> - CORS fix (rev 25) added `Access-Control-Allow-Methods` including DELETE to shared cors headers.
> ### Rev 24 — Fix Theme Products Override (custom editor + pricing)
> - **Root cause confirmed**: `src/themes/bento/platformkit.config.ts` had a theme-level `products` schema overriding root products config.
> - The override omitted `editorComponent`, so CMS rendered the default schema list editor instead of `ProductCollectionEditor`.
> - The same override also used an outdated product schema (no `price`, `currency`, `stripe_price_id`, or subscription billing fields).
> - **Fix implemented**: updated the bento theme `products` schema to explicitly use `ProductCollectionEditor` and restored complete pricing/subscription fields + sensible defaults.
> - Result: Products tab now resolves to the custom editor and supports price + subscription plan configuration.
>
> ### Rev 23 — Fix Product Collection Editor Integration
> - **Root cause**: `contentCollectionsToSchemas()` was defined but never called during config merging in `component-resolver.ts`. Products defined in root `platformkit.config.ts` under `contentCollections` were never converted to `contentSchemas`, so the CMS fell back to the generic inline `CollectionListEditor` instead of the custom `ProductCollectionEditor`.
> - Fixed `mergeConfigs()` to convert `contentCollections` → `contentSchemas` on both base and override configs, then union-merge by key.
> - Fixed nested `cms__row` class conflict in `ProductCollectionEditor.vue` that broke click-to-edit.
> - Added `"products"` to well-known collection keys in `model.ts` (rev 22.1).
> - Result: Product editor now shows correct schema (price, currency, subscription fields), push-to-Stripe button, and click-to-edit works.
> ### Rev 20 — Import Block Syntax Recovery
> - Fixed: restored the missing `import { ... } from './lib/github'` block structure in `src/App.vue` and moved `GithubSettings` to a dedicated type import.
> - Next: run `vite build --mode development` to confirm the parser error is gone.
>
> ### Rev 19 — Published Cloud Fallback Hardening
> - Root cause identified: published frontend could still enter demo mode if `VITE_SUPABASE_*` env injection was missing at runtime.
> - Hardened runtime backend detection with resilient fallbacks in `cloud-env`, aligned `isLiveMode()` to hosted/runtime signals, and switched CMS auth-check key usage to runtime backend key helper.
> - Next: republish frontend and confirm published site resolves backend mode consistently.
>
> ### Rev 17 — Analytics Table Reset
> - Removed duplicate analytics migration (UUID schema) that was never properly applied.
> - Dropped and recreated `analytics_events` table with correct original schema: bigint identity PK, CHECK constraint, `country` column, proper indexes and RLS policies.
> - Fixed `email.ts` build error by adding `@ts-types` directive for nodemailer.
> - Verified analytics edge function works end-to-end (track event → 200 OK).
>
> ### Rev 16 — Published Env Fallback Normalization
> - Added a shared runtime env resolver (`src/lib/cloud-env.ts`) to derive backend URL + API key from injected vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, publishable/anon key).
> - Rewired frontend callers (CMS dialog, analytics panel, newsletter admin/editor/views, generic client helpers) to use this shared resolver instead of direct `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` assumptions.
> - Removed local `127.0.0.1` URL fallbacks from theme newsletter views to prevent false demo/offline behavior in published builds.
> - Next: verify published site now consistently resolves backend config and no longer falls back due to missing direct URL injection.
>
> ### Rev 15 — Live Mode Detection Hardening
> - Added resilient backend detection for publish builds: if `VITE_SUPABASE_URL` is missing, derive backend URL from `VITE_SUPABASE_PROJECT_ID` (or JWT `ref` in publishable key).
> - Unified mode checks so both initial render (`isLiveMode`) and DB persistence (`isDbMode`) treat Cloud-connected builds as live mode.
> - Updated CMS unlock auth-check call to use resolved runtime backend URL, not only `VITE_SUPABASE_URL`.
> - Next: confirm published build now stays in live mode with no demo fallback banner.
>
> ### Rev 14 — Demo Mode Overhaul
> - `defaultModel()` now ships beautiful demo content: 2 links (one with Unsplash cover image), 1 gallery image, Spotify embed (2×2 inline), YouTube embed (2×2 inline), animated text widget, 3 enabled socials.
> - Removed empty/ugly placeholder items (third link, empty embeds collection).
> - Grid seeding updated: Spotify and YouTube both render inline at 2×2, widget at full width.
> - Added "You're viewing demo content" banner in demo mode with CMS instructions.
> - Live mode empty state unchanged (shows "No content yet" with CMS unlock instructions).
>
> ### Rev 13 — Suppress Demo Data in Live Mode
> - Added `emptyModel()` factory in `model.ts` — same structure as `defaultModel()` but with zero sample items.
> - Added `isLiveMode()` helper — returns `true` when `VITE_SUPABASE_URL` or `VITE_GITHUB_OWNER` env vars are set.
> - `App.vue` and `Index.vue` now use `emptyModel()` as initial state in live mode so demo content never flashes.
> - `persistence.ts` `fetchModel()` no longer falls through to static `data.json` when in DB mode with no data — returns empty model instead.
>
> ### Rev 12 — Admin Token Key Normalization
> - Root cause confirmed: client encrypted `x-admin-token` with JWT anon key, while edge runtime decrypted with `sb_publishable_*`, causing AES-GCM decrypt failures.
> - Refactored `_shared/admin-auth.ts` to validate against deterministic passphrase candidates (request `apikey` first, then env fallbacks) and verify password/timestamp only after successful decrypt.
> - Updated all admin-protected edge functions (`cms-sync`, `analytics`, `newsletter-admin`, `newsletter-send`) to pass request `apikey` as a verification hint.
> - Deployed updated edge functions.
>
> ### Rev 11 — DB Mode Admin Auth Gate
> - Fixed `openCms()` in `App.vue` to show password dialog in DB mode (previously only triggered for embedded GitHub tokens).
> - `submitCmsPassword()` now validates against `cms-sync?scope=auth-check` in DB mode before granting CMS access.
> - Added `auth-check` scope to `cms-sync` edge function for lightweight password verification.
> - Fixed PBKDF2 iteration mismatch (server was 100k, client 250k) in `_shared/admin-auth.ts`.
> - Removed unused `src/utils/toast.ts` (imported missing `sonner` package).
>
> ### Rev 10 — Database Mode CMS with Git Mirror
> - Created `cms_data` table (id text PK, data jsonb, schema_version int) + `cms-uploads` storage bucket with public read RLS policies.
> - New `supabase/functions/cms-sync/index.ts` edge function: full CRUD for site model + collections via query params (`?scope=site`, `?scope=collection&key=...&slug=...`). Auth via `x-admin-token` header using existing `verifyAdminToken()`.
> - New `src/lib/persistence-db.ts` module: `isDbMode()` detection, DB fetch/persist helpers for site model + collections, and `uploadToStorage()` for the `cms-uploads` bucket.
> - Updated `src/lib/persistence.ts`: `fetchModel()` and `persistModel()` now branch on `isDbMode()`. New `PersistResult = "db"` variant.
> - Updated `src/lib/collections.ts`: all four CRUD functions branch on `isDbMode()`, bypassing localStorage staging in DB mode.
> - Updated `src/lib/upload.ts`: `uploadImage()` and `uploadFile()` now route to Supabase Storage when in DB mode.
> - Updated `src/App.vue`: persist watcher handles `"db"` result (sets unsynced only if Git mirror needed), status bar shows "Saved to cloud" / "Push to Git", commit button repurposed for Git mirror in DB mode.

## Vision

A Vite-based CMS + static site generator / full-stack monolith app framework that uses progressive adoption patterns to let the user deploy with as much or little complexity as they want.

---

## Tier Overview & Status

### Tier 1 — Static Site Generator ✅ SOLID

Reads from local markdown and JSON; builds to static output.

| Area | Status | Notes |
|------|--------|-------|
| Markdown parsing | ✅ Done | `src/lib/markdown.ts` — `marked` with GFM, heading anchors, custom image/link renderers |
| Content model & migrations | ✅ Done | `src/lib/model.ts`, `src/lib/migrations.ts` — versioned `BioModel` with auto-upgrade |
| File-based collections | ✅ Done | `platformkit.config.ts` `contentCollections` with YAML/JSON/MD support |
| Collection migrations | ✅ Done | `src/lib/collection-migrations.ts` — declarative renames/defaults + imperative transforms |
| Build pipeline | ✅ Done | Vite plugins for content validation, manifest generation, blog/collection JSON export |
| RSS generation | ✅ Done | `src/lib/rss.ts` — outputs `public/content/rss.xml` |
| Admin UI (local) | ✅ Done | Drawer-based editors for profile, links, socials, blog, gallery, resume, embeds, newsletter |
| Theme system | ✅ Done | `src/themes/bento/` — bento-grid layout with tab nav, profile header, section components |
| Override system | ✅ Done | `src/overrides/` — user component overrides discovered at build time |
| TTS build hook | ✅ Done | `build-hooks/tts-hook.ts` — optional text-to-speech audio generation for blog posts |
| Image optimization hook | ✅ Done | `build-hooks/image-optimize-hook.ts` |

### Tier 2 — GitHub CMS ✅ SOLID

Content synced to/from a private GitHub repo; editable via GitHub API.

| Area | Status | Notes |
|------|--------|-------|
| GitHub API client | ✅ Done | `src/lib/github.ts` — full CRUD: read, create, update, delete files via REST API |
| Token encryption | ✅ Done | `src/lib/admin-crypto.ts` — AES-256-GCM with PBKDF2-derived key |
| Staging & batch commit | ✅ Done | `src/admin/GitCommitDialog.vue` — stage changes, review diff, commit with message |
| Push/pull scripts | ✅ Done | `scripts/export-to-github.mjs`, `scripts/import-from-github.mjs` |
| Content export script | ✅ Done | `scripts/export-data.mjs` |

### Tier 3 — Database-backed CMS 🟡 ~84% COMPLETE

Supabase-powered: auth, DB content, cloud storage, edge functions.

| Area | Status | Notes |
|------|--------|-------|
| Supabase client | ✅ Done | `src/lib/supabase.ts` + `src/lib/cloud-env.ts` runtime env resolver for published builds |
| Analytics edge function | ✅ Done | `supabase/functions/analytics/` — fingerprint-based pageview tracking |
| Newsletter system | ✅ Done | `supabase/functions/newsletter-*` — signup, confirm, send, unsubscribe, cron, worker |
| Email shared utilities | ✅ Done | `supabase/functions/_shared/email.ts`, `email-html.ts` |
| Admin auth (edge) | ✅ Done | `supabase/functions/_shared/admin-auth.ts` |
| **DB-backed content CRUD** | ✅ Done | `cms_data` table + `cms-sync` edge function + `persistence-db.ts` module |
| **Supabase Storage integration** | ✅ Done | `cms-uploads` bucket + `uploadToStorage()` in `persistence-db.ts` |
| **DB mode branching** | ✅ Done | `persistence.ts`, `collections.ts`, `upload.ts` all branch on `isDbMode()` |
| **App.vue DB mode UI** | ✅ Done | Status bar shows "Saved to cloud", commit button becomes "Push to Git" for optional mirror |
| **DB migrations for analytics** | ✅ Done | `analytics_events` table with RLS (anon insert, service_role select) |
| **DB migrations for newsletter** | ❌ Missing | No SQL migration files for newsletter tables the edge functions depend on |
| **DB migrations for edge functions** | ❌ Missing | No SQL migration files for analytics/newsletter tables the edge functions depend on |

### Tier 4 — E-Commerce (Stripe) 🟡 ~84% COMPLETE

| Area | Status | Notes |
|------|--------|-------|
| Product model & CMS schema | ✅ Done | Full schema: product_type, price, currency, stripe IDs, subscription fields, variants, attributes |
| Product composable | ✅ Done | `useProducts.ts` — reads from collections system (file/DB/GitHub) |
| Cart composable & UI | ✅ Done | `useCart.ts` — carries stripe_price_id, product_type, recurring_interval per item |
| Checkout composable | ✅ Done | `useCheckout.ts` — dual-mode: edge function (Supabase) or static fallback |
| Checkout edge function | ✅ Done | `stripe-checkout/index.ts` — creates Stripe Checkout Sessions, supports payment + subscription modes |
| Theme e-commerce components | ✅ Done | `src/themes/bento/ecommerce/` — ProductCard, CartDrawer, ProductList, CheckoutForm |
| Shop route & tab | ✅ Done | `/shop` route with tab nav integration |
| Success/cancel pages | ✅ Done | Reuses `/confirmed?status=purchase-success` confirmation page |
| **Push to Stripe** | ✅ Done | Confirmation dialog after product save — creates/updates Stripe product+price, writes back IDs |
| **Import from Stripe** | ✅ Done | Modal to browse and import Stripe products as CMS entries |
| **Stripe products edge function** | ✅ Done | `stripe-products/index.ts` — list + push operations |
| **Custom product editor** | ✅ Done | `ProductCollectionEditor.vue` is now explicitly wired in bento products schema |
| **Webhook handler** | ❌ Missing | No `supabase/functions/stripe-webhook/` for payment confirmation |
| **Order management** | ❌ Missing | No orders table, no order history UI |

---

## Current Changes

### Rev 24 — Fix Theme Products Override (custom editor + pricing)
- **What:** Updated bento theme’s `products` schema to explicitly use `ProductCollectionEditor` and restored pricing/subscription fields (`price`, `currency`, `stripe_price_id`, `recurring_interval`, `recurring_interval_count`, `billing_scheme`, `usage_type`, `tiers_mode`).
- **Why:** Theme-level products schema was overriding root config and silently removing custom editor wiring + pricing fields.
- **Files changed:** `src/themes/bento/platformkit.config.ts`.
- **Validation:** App loaded on `/shop` with no browser runtime errors; product editor should now resolve to custom editor in CMS.

### Rev 22 — Stripe Two-Way Sync
- **What:** Added bi-directional Stripe sync: push products from CMS to Stripe, and import products from Stripe into CMS.
- **Files changed:**
  - `supabase/functions/stripe-products/index.ts` — new edge function for list + push
  - `src/themes/bento/ecommerce/components/ProductCollectionEditor.vue` — custom product editor with push/import UI
  - `platformkit.config.ts` — wired `editorComponent` on products collection
- **What's next:** Test push/import flows. Add webhook handler and order management.

### Rev 21 — Full Stripe Checkout Integration
- **What:** Built complete dual-mode Stripe checkout with edge function, enhanced product CMS schema, rewired all ecommerce components.
- **Files changed:**
  - `supabase/functions/stripe-checkout/index.ts` — new edge function
  - `src/themes/bento/ecommerce/composables/useCheckout.ts` — dual-mode Stripe checkout
  - `src/themes/bento/ecommerce/components/` — ProductCard, CartDrawer, ProductList, CheckoutForm
  - `platformkit.config.ts` — pricing, subscription, and billing fields
- **What's next:** Two-way Stripe sync (push + import).

### Rev 20 — Import Block Syntax Recovery
- **What:** Repaired the malformed GitHub import block in `src/App.vue` and kept `GithubSettings` as a separate type import.
- **Why:** The dropped `import {` token caused Vue SFC parser failure (`Unexpected token`) during build.
- **Files changed:**
  - `src/App.vue` — restored valid import syntax for `./lib/github`.
- **What's next:** Re-run `vite build --mode development` and then continue debugging published live/demo behavior.

### Rev 19 — Published Cloud Fallback Hardening
- **What:** Hardened runtime backend detection with project-level fallback values and aligned live-mode checks to backend connectivity.
- **Why:** Published URL still rendered demo state even after publish, while preview was already calling backend functions.
- **Files changed:**
  - `src/lib/cloud-env.ts` — added fallback project ID/publishable key and resilient base URL derivation.
  - `src/lib/model.ts` — `isLiveMode()` now safely checks runtime env + hosted domains to avoid demo fallback drift.
  - `src/App.vue` — CMS password auth-check now uses `getBackendApiKey()` instead of direct env reads.

### Rev 16 — Published Env Fallback Normalization
- **What:** Introduced a shared frontend runtime env resolver and switched all Cloud-facing frontend call sites to it.
- **Why:** Published builds could still miss direct `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` references in some UI modules, causing backend features to fail even when Cloud vars were injected.
- **Files changed:**
  - `src/lib/cloud-env.ts` — new shared resolver for backend base URL + API key from URL/project ID/JWT ref.
  - `src/lib/persistence-db.ts`, `src/lib/supabase.ts`, `src/lib/analytics.ts` — centralized backend env usage.
  - `src/admin/CmsDialog.vue`, `src/admin/AnalyticsPanel.vue`, `src/admin/NewsletterComposeDrawer.vue`, `src/admin/editors/NewsletterCollectionEditor.vue` — admin calls now use runtime-resolved backend env.
  - `src/themes/bento/BlogSection.vue`, `src/themes/bento/NewsletterViewPage.vue`, `src/themes/bento/components/NewsletterArchive.vue` — newsletter frontend now uses runtime-resolved backend env, no localhost fallback.
- **What's next:** Confirm published URL performs CMS/newsletter/analytics requests against backend without demo fallback.

### Rev 15 — Live Mode Detection Hardening
- **What:** Added runtime backend URL resolution to avoid false demo mode on published builds when only project ID / publishable key is injected.
- **Why:** `isLiveMode()` and `isDbMode()` previously depended on `VITE_SUPABASE_URL` only, so published builds could fall back to demo mode despite an active Cloud backend.
- **Files changed:**
  - `src/lib/persistence-db.ts` — derive backend URL from `VITE_SUPABASE_PROJECT_ID` or JWT `ref`, export `getDbBaseUrl()`, harden DB mode check.
  - `src/lib/model.ts` — expanded live-mode detection to include Cloud-injected project/key vars.
  - `src/App.vue` — CMS password auth-check now uses `getDbBaseUrl()` fallback instead of only `VITE_SUPABASE_URL`.
- **What's next:** Publish once to verify production now resolves backend mode correctly and removes demo banner fallback.

### Rev 12 — Admin Token Key Normalization
- **What:** Refactored admin token verification in edge functions to accept deterministic key candidates and prioritize the request `apikey` used by the client for encryption.
- **Why:** Fixed persistent `Invalid admin token` failures caused by passphrase drift between client/runtime key names (`JWT anon` vs `sb_publishable_*`).
- **Files changed:**
  - `supabase/functions/_shared/admin-auth.ts` — candidate-based passphrase verification + stricter payload validation
  - `supabase/functions/cms-sync/index.ts` — passes request `apikey` into `verifyAdminToken()`
  - `supabase/functions/analytics/index.ts` — passes request `apikey` into `verifyAdminToken()`
  - `supabase/functions/newsletter-admin/index.ts` — passes request `apikey` into `verifyAdminToken()`
  - `supabase/functions/newsletter-send/index.ts` — passes request `apikey` into `verifyAdminToken()`
- **What's next:** Re-test CMS unlock in DB mode and confirm write operations (`POST ?scope=site` / collection writes) now succeed.

### Rev 10 — Database Mode CMS with Git Mirror
- **What:** Implemented the full "Database Mode CMS" plan — when Lovable Cloud is connected, the CMS stores all data (site model + collections) in a `cms_data` JSONB table and uploads to a `cms-uploads` storage bucket. Optional async Git mirror via existing GitHub sync.
- **Why:** Eliminates the need for localStorage staging in production; data persists immediately in the database. Collections (blog posts, products, etc.) are stored as JSONB arrays alongside the site model, avoiding schema migrations when CMS fields change.
- **Files changed:**
  - `supabase/migrations/` — new migration for `cms_data` table + `cms-uploads` bucket
  - `supabase/functions/cms-sync/index.ts` — new edge function
  - `src/lib/persistence-db.ts` — new module with DB helpers
  - `src/lib/persistence.ts` — added `isDbMode()` branching
  - `src/lib/collections.ts` — added DB mode branching for CRUD
  - `src/lib/upload.ts` — added storage bucket upload path
  - `src/App.vue` — updated persist watcher, status bar, commit flow
- **What's next:** User auth UI, protected admin routes, analytics/newsletter table migrations.

### Rev 9 — Fixed profile card snapping back to 3 columns
- `onLayoutUpdated` in `LinksSection.vue` now forces the profile card to stay full-width (`colSpan = columns`) after grid-layout-plus fires layout change events, preventing the library from shrinking it.
- Seeded `theme.bento.layoutData.grid` in `default-data.json` with pre-wired profile + link/gallery/embed/widget grid items.
- Enabled Lovable Cloud (Supabase) — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are now injected automatically; existing migrations and edge functions will apply.

### Rev 7 — Fixed default seed/source mismatch and empty bento grid
- **Problem:** The landing page looked empty because the grid only had a profile card and did not auto-place link/content items; plus dummy updates were applied to `default-data.json`, while the CMS/preview runtime read `cms-data.json`.
- **Fix:** Added automatic first-load grid seeding in `LinksSection.vue` (links/gallery/embed/widget cards from available items when non-profile cards are absent). Updated `scripts/clear-default-data.mjs` to clear runtime payload files (`cms-data.json`, `public/content/data.json`) before import/build.

### Rev 5 — Bento cards persist after async model load
- **Problem:** `LinksSection` inserted its default profile card only once in setup; when `fetchModel()` replaced the root model, `layoutData.grid` was reset and the content area appeared blank.
- **Fix:** Made grid bootstrap idempotent in `ensureGridData()` (always guarantees a profile card), removed the one-time profile insertion block, and removed the stray module-scope lifecycle hook path causing warnings.

### Rev 3 — Fix layout "default" fallback everywhere
- **Problem:** Even after changing `defaultModel()`, several other code paths still fell back to `"default"` layout: `App.vue` computed, `App.vue` data-layout attribute, and `sanitizeModel` layoutDefaults key.
- **Fix:** Changed all `"default"` layout fallbacks to `"bento"` in `App.vue` (lines 243, 411) and `model.ts` (layoutDefaults key).

### Rev 2 — Fix blank page on default load
- **Problem:** `defaultModel()` and `default-data.json` set `layout: "default"` but no `src/themes/default/` exists — only `bento`. The component resolver fell back to an invisible placeholder.
- **Fix:** Changed default layout to `"bento"` in `defaultTheme()`, `darkTheme()`, and `default-data.json`.

---

## Priority Roadmap

### Phase 1 — Shore up Tier 3 (Database CMS)
1. ~~Create DB-backed content mode (read/write `BioModel` + collections from Supabase)~~ ✅
2. ~~Wire `src/lib/upload.ts` to Supabase Storage~~ ✅
3. Create Supabase migration SQL for analytics + newsletter tables
4. Add user auth UI (login/signup pages) with Supabase Auth
5. Add protected admin routes gated by Supabase Auth

### Phase 2 — Complete Tier 4 (E-Commerce)
1. Integrate Stripe SDK (`@stripe/stripe-js`)
2. Create `stripe-checkout` edge function for session creation
3. Create `stripe-webhook` edge function for payment confirmation
4. Add products + orders tables with migrations
5. Build product admin UI
6. Wire cart → checkout → Stripe flow end-to-end

### Phase 3 — Polish & DX
1. CLI improvements (`bin/cli.mjs` — scaffold themes, collections, etc.)
2. Documentation site / starter guide
3. Test coverage for migrations, content pipeline, auth flows
4. PWA enhancements (offline support, service worker)
