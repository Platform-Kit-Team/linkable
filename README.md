# Linkable

A design-forward, open-source link-in-bio page with a built-in CMS. Built with Vue 3, PrimeVue, and Tailwind CSS.

***

## Features

- **Glassmorphism design** — frosted-glass cards, soft shadows, smooth transitions
- **Built-in CMS** — edit your profile, links, gallery, blog, resume, embeds, and theme
- **Banner image** — full-width hero image displayed inside the profile card
- **Social links** — Instagram, GitHub, Email, etc. with 400+ Lucide icons
- **Image uploads** — drag-and-drop image uploads for avatar, banner, and link thumbnails
- **Gallery** — masonry grid with images and video (YouTube, Vimeo, MP4), lightbox, and tags
- **Blog** — Markdown editor with syntax highlighting, cover images, tags, RSS feed, and per-post OG meta
- **Resume / CV** — employment, education, skills, and achievements sections
- **Custom embeds** — arbitrary HTML/iframe injection as separate tabs (Spotify, donation widgets, etc.)
- **Content scheduling** — publish dates and expiration dates on links, gallery items, embeds, and blog posts
- **Theming** — 20+ CSS variables, light/dark/custom presets, glassmorphism, border-radius control
- **Newsletter** — email signup, subscriber management, scheduled broadcasts with cover images and tags
- **Search & filtering** — per-section search bars with multi-select tag filters
- **Tab navigation** — customizable labels and Lucide icons, default tab setting
- **GitHub sync** — push/pull content to a private GitHub repo
- **CMS password protection** — PBKDF2 + AES-256-GCM encrypted GitHub token
- **PWA** — installable, standalone manifest generated from CMS data
- **SEO** — OG meta tags, custom favicon, per-post OG for blog, robots.txt
- **RSS feed** — auto-generated RSS 2.0 feed for blog posts
- **CLI / npx support** — serve your site with one command, no cloning required
- **Responsive** — works on mobile and desktop
- **Static export** — builds to a static `dist/` folder, deployable anywhere
- **Drag-and-drop reordering** — reorder links, embeds, socials, gallery items, and resume sections
- **Schema migrations** — auto-upgrades data model across versions

***

## Quick Start

### Option 1: Clone and develop

```bash
git clone https://github.com/platform-kit/linkable.git
cd linkable
npm install
npm run dev
```

Open `http://localhost:5173` and click the **CMS** button (bottom-right) to edit your content.

### Option 2: Serve with npx (no clone needed)

If you already have a content directory with `data.json` and an optional `uploads/` folder:

```bash
npx github:platform-kit/linkable serve ./my-content
```

### Option 3: Build a static site with npx

Build a deployable `dist/` folder using your own content — no need to clone the Linkable repo:

```bash
npx github:platform-kit/linkable build ./my-content
```

Output to a custom directory:

```bash
npx github:platform-kit/linkable build ./my-content --out ./public
```

This is ideal for deploying on Vercel, Netlify, or any static host. Create a content repo with your `data.json` and `uploads/`, then set the build command to:

```bash
npx github:platform-kit/linkable build .
```

### Deploying on Vercel with a personal content repo

You don't need to fork or clone the Linkable codebase. Instead, connect your **content repo** to Vercel and use the npx build command to pull the app at build time.

**1. Create a content repo**

Push your content with `npm run push` (this auto-creates the repo if needed). The repo will contain:

```
my-linkable-site/
├── data.json        ← your CMS content
└── uploads/         ← your uploaded images
    ├── avatar.png
    └── banner.jpg
```

**2. Connect it to Vercel**

- Go to [vercel.com/new](https://vercel.com/new) and import your content repo
- Configure the project settings:

| Setting              | Value                                           |
| -------------------- | ----------------------------------------------- |
| **Build Command**    | `npx github:platform-kit/linkable build .` |
| **Output Directory** | `dist`                                          |
| **Install Command**  | _(leave blank)_                                 |

**3. Deploy**

Vercel will run the build command, which:
1. Installs the Linkable package from GitHub (pre-built app included)
2. Copies it to `dist/`
3. Injects your `data.json` and `uploads/` into the output
4. Vercel deploys `dist/` to the edge

**4. Update your site**

Whenever you push changes to your content repo (new links, updated bio, etc.), Vercel automatically rebuilds and redeploys. You can update content locally with `npm run dev` + the CMS, then `npm run push` to sync to your content repo.

### CLI Reference

```
linkable serve <content-dir>           Serve your site locally
linkable build <content-dir>           Build a static site into ./dist
linkable deploy                        Deploy Supabase migrations & edge functions
linkable --help                        Show help

Options:
  --port, -p <port>    Port for serve (default: 3000)
  --out, -o <dir>      Output directory for build (default: ./dist)
  --project-ref        Supabase project ref for deploy
```

***

## Project Structure

```
├── bin/cli.mjs             CLI entry point for npx
├── default-data.json       Template seed content (committed)
├── cms-data.json           Your personal CMS data (gitignored)
├── content/
│   └── blog/               Blog post .md files (gitignored)
├── public/
│   ├── data.json           Production content (gitignored)
│   ├── blog/               Static blog JSON (generated at build)
│   ├── rss.xml             RSS feed (generated)
│   ├── manifest.json       PWA manifest (generated)
│   ├── robots.txt          Search engine crawl rules
│   └── uploads/            Uploaded images (gitignored)
├── scripts/
│   ├── export-data.mjs     Export CMS data to clipboard
│   ├── export-to-github.mjs Push content to GitHub repo
│   ├── import-from-github.mjs Pull content from GitHub repo
│   └── clean-uploads.mjs   Remove orphaned upload files
└── src/
    ├── App.vue             Main app layout
    ├── components/         CMS dialogs, editors, UI components
    └── lib/
        ├── blog.ts         Blog types, frontmatter parsing, rendering
        ├── github.ts       GitHub API integration
        ├── image-convert.ts Image format conversion
        ├── migrations.ts   Schema versioning & migration pipeline
        ├── model.ts        Data types, sanitization, defaults
        ├── persistence.ts  Fetch/save CMS data
        ├── scheduling.ts   Date-based content visibility filtering
        └── upload.ts       Image upload handling
```

***

## Content Management

### Editing content locally

1. Run `npm run dev`
2. Click the **CMS** button (bottom-right corner)
3. Edit your profile, links, and socials
4. Changes auto-save to `cms-data.json`

### Content files

| File                | Committed? | Purpose                          |
| ------------------- | ---------- | -------------------------------- |
| `default-data.json` | Yes        | Template data for new users      |
| `cms-data.json`     | No         | Your personal CMS data           |
| `public/data.json`  | No         | Production build content         |
| `public/uploads/`   | No         | Uploaded images                  |
| `public/rss.xml`    | No         | Generated RSS feed               |
| `public/blog/`      | No         | Static blog JSON (build output)  |
| `content/blog/`     | No         | Blog post Markdown source files  |

On first run, `default-data.json` is automatically copied to `cms-data.json` and `public/data.json` if they don't exist.

***

## GitHub Content Sync

Store your personal content in a private GitHub repo, separate from the Linkable codebase.

### Setup

1. Create a private GitHub repo for your content
2. Copy `.env.example` to `.env` and fill in your values:

```env
GITHUB_OWNER=your-username
GITHUB_REPO=my-linkable-content
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_BRANCH=main
```

### Commands

```bash
npm run push      # Push local content → GitHub repo
npm run import    # Pull GitHub repo → local content
npm run export    # Copy CMS data JSON to clipboard
```

### Build with remote content

For CI/CD deployments (e.g. Vercel), import content at build time:

```bash
npm run import:build
```

Set the environment variables in your hosting provider's dashboard.

***

## Content Scheduling

Links, gallery items, embeds, and blog posts all support **Publish Date** and **Expiration Date** fields.

- **Publish Date** — the item won't appear on the public page before this date. For blog posts, this also serves as the display date.
- **Expiration Date** — the item is hidden after this date.
- Dates are ISO format (e.g. `2025-06-01`). An empty date means "no constraint."

By default, scheduling is **client-side only** — the content is present in the build output but filtered at runtime. To strip scheduled content at build time (so it never reaches the browser), set `VITE_SCHEDULE_EXCLUDE_BUILD=1` in your environment.

***

## Blog

Blog posts are Markdown files stored in `content/blog/` with frontmatter metadata:

```markdown
---
title: My Post
slug: my-post
date: 2025-06-01
excerpt: A short summary
coverImage: /uploads/cover.jpg
published: true
tags: [tutorial, vue]
publishDate: 2025-06-01
expirationDate:
---

Your markdown content here…
```

### Features

- **Markdown editor** — rich Tiptap editor with formatting, inline images, and code blocks
- **Syntax highlighting** — 17 built-in languages (JS, TS, Python, Go, Rust, and more)
- **Cover images** — displayed at the top of each post
- **Tags** — filter posts with multi-select tag filtering
- **RSS feed** — auto-generated RSS 2.0 at `/rss.xml`
- **Per-post OG meta** — pre-rendered HTML at `dist/content/<slug>/index.html` with `og:title`, `og:description`, `og:image` for social sharing previews

In development, posts are read/written via Vite middleware. In production, they're compiled to static JSON files at `/blog/index.json` and `/blog/<slug>.json`.

***

## Gallery

A masonry grid supporting images and video:

- **Images** — uploaded to `public/uploads/`
- **Video** — YouTube URLs, Vimeo URLs, or direct MP4 uploads
- **Cover thumbnails** — optional poster image for videos
- **Tags** — per-item tags for filtering
- **Lightbox** — click to expand
- Up to **50 items**

***

## Resume / CV

A structured resume section with:

| Section | Fields |
|---|---|
| **Bio** | Free-text biography (up to 2000 chars) |
| **Employment** | Company, role, description, start/end year |
| **Education** | Institution, degree, field, start/end year |
| **Skills** | Free-form skill tags (up to 50) |
| **Achievements** | Title, issuer, year, description |

All sections support drag-and-drop reordering.

***

## Custom Embeds

Add custom HTML tabs to your page — useful for Spotify players, donation widgets, embedded forms, or any third-party embed.

Each embed has:
- **Label** — tab name
- **Icon** — Lucide icon for the tab
- **HTML** — raw HTML/iframe content
- **Scheduling** — publish date and expiration date

***

## Theming

Customize your page appearance with 20+ CSS variables through the CMS:

| Variable | Purpose |
|---|---|
| `--color-brand` | Primary brand color |
| `--color-brand-strong` | Hover/strong variant |
| `--color-accent` | Secondary accent color |
| `--color-ink` | Main text color |
| `--color-ink-soft` | Muted text |
| `--bg` | Page background |
| `--glass` | Primary frosted-glass surface |
| `--glass-2` | Secondary glass |
| `--glass-strong` | High-opacity glass |
| `--color-border` | Glass borders |
| `--color-border-2` | Subtle dividers |
| `--card-bg` | Card background |
| `--card-border` | Card border |
| `--card-text` | Card text |
| `--radius-xl` | Large border radius |
| `--radius-lg` | Standard border radius |

Three presets are available: **light**, **dark**, and **custom** (fully manual).

***

## CMS Password Protection

When deploying with a GitHub token baked in, the CMS is protected by password-based encryption:

1. At build time, if `GITHUB_TOKEN` and `CMS_PASSWORD` are both set, the token is encrypted using **PBKDF2** (600,000 iterations, SHA-256) + **AES-256-GCM** and embedded in the JS bundle.
2. At runtime, the CMS prompts for a password to decrypt the token via the Web Crypto API.
3. The decrypted token is held in `sessionStorage` for the browser session only.

This means the plaintext token is never stored in the deployed files.

***

## PWA & SEO

### PWA

The `manifest.json` is auto-generated from CMS data:
- `name` / `short_name` from your display name
- `theme_color` from your brand color
- `icons` from your OG image and favicon

### SEO

- **OG meta tags** — `og:title`, `og:description`, `og:image`, `og:url`, and `twitter:card` injected at build time
- **Per-post OG** — each blog post gets a pre-rendered HTML page with post-specific social sharing meta
- **Favicon** — configurable in the CMS
- **robots.txt** — allows all crawlers
- **RSS** — `<link rel="alternate">` in the HTML head

***

## Custom Scripts

Inject custom JavaScript or HTML into your page via the CMS:

- **Head script** — injected into `<head>` (analytics, fonts, meta tags)
- **Body-end script** — injected before `</body>` (tracking pixels, chat widgets)

***

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SITE_URL` | For SEO | Base URL for RSS feeds, OG meta, and absolute URLs |
| `VITE_SCHEDULE_EXCLUDE_BUILD` | No | Strip expired/future scheduled content at build time |
| `GITHUB_OWNER` | For sync | GitHub repo owner |
| `GITHUB_REPO` | For sync | GitHub repo name |
| `GITHUB_BRANCH` | No | GitHub branch (default: `main`) |
| `GITHUB_TOKEN` | For sync | GitHub personal access token |
| `CMS_PASSWORD` | For CMS lock | Password for encrypting the GitHub token in the build |
| `SUPABASE_ACCESS_TOKEN` | For deploy | Supabase personal access token (for `linkable deploy` in CI) |
| `SUPABASE_PROJECT_REF` | For deploy | Supabase project ref ID (for `linkable deploy` in CI) |

***

## Security & Password Protection

The CMS and GitHub sync features are protected by a password-based encryption system. Your GitHub Personal Access Token (PAT) is **never** stored in plaintext in the frontend bundle.

### How it works

1. **Build-time encryption** — During `npm run build`, the `GITHUB_TOKEN` from your `.env` file is encrypted using AES-256-GCM with a key derived from your `CMS_PASSWORD` password. Only the encrypted blob is embedded in the JavaScript bundle.
2. **Runtime decryption** — When you open the CMS, you're prompted to enter the password. The app uses the Web Crypto API to derive the same key via PBKDF2 and decrypt the token in memory.
3. **Session-only storage** — The decrypted token is cached in `sessionStorage` so you don't need to re-enter the password within the same browser tab session. It is automatically cleared when the tab is closed. It is **never** written to `localStorage`, cookies, or any other persistent storage.

### Encryption details

| Parameter        | Value           |
| ---------------- | --------------- |
| Algorithm        | AES-256-GCM     |
| Key derivation   | PBKDF2          |
| Hash             | SHA-256         |
| Iterations       | 600,000         |
| Salt             | 16 bytes random |
| IV               | 12 bytes random |

### Environment variables

| Variable             | Purpose                                              | Exposed to browser? |
| -------------------- | ---------------------------------------------------- | ------------------- |
| `GITHUB_TOKEN`       | Your GitHub PAT for content sync                     | **No** — encrypted at build time, never in plaintext |
| `CMS_PASSWORD`       | Password used to encrypt/decrypt the token           | **No** — used only at build time for key derivation; not prefixed with `VITE_` to prevent accidental client exposure  |
| `GITHUB_OWNER`       | GitHub repo owner                                    | Yes (non-secret)    |
| `GITHUB_REPO`        | GitHub repo name                                     | Yes (non-secret)    |
| `GITHUB_BRANCH`      | GitHub branch                                        | Yes (non-secret)    |
| `VITE_SITE_URL`      | Your production domain (for RSS, OG tags)            | Yes (non-secret)    |

### CMS password gate

The CMS button in the bottom-right corner requires password authentication before opening. The same `CMS_PASSWORD` password unlocks both the CMS and the GitHub sync functionality. Once unlocked, subsequent CMS opens in the same browser tab session skip the password prompt.

### Security guarantees

- The raw PAT is never present in the built JavaScript bundle
- The password is never present in the built JavaScript bundle
- The encrypted token cannot be decrypted without the correct password
- The decrypted token is cached in sessionStorage and cleared when the tab closes
- No secrets are logged, persisted, or transmitted beyond the GitHub API calls

### Choosing a strong password

Set `CMS_PASSWORD` in your `.env` file to a strong, unique password:

```env
CMS_PASSWORD="your-strong-password-here"
```

This password is required every time you open the CMS in a new browser session.

***

## Schema Migrations

The content data model is versioned. When the app loads data with an older `schemaVersion`, it automatically migrates it to the current schema.

### How it works

- Every `data.json` carries a `schemaVersion` number
- `sanitizeModel()` runs `migrateToLatest()` before processing
- Migrations chain: v0 → v1 → v2 → ... runs all intermediate steps
- Old content is never broken — it upgrades transparently

### Adding a migration

When changing the data model (`BioModel`, `BioProfile`, `BioLink`, `SocialLink`):

1. Bump `CURRENT_SCHEMA_VERSION` in `src/lib/migrations.ts`
2. Add a migration entry:

```ts
{
  toVersion: 2,
  migrate: (data) => {
    data.profile.newField = "default";
    data.schemaVersion = 2;
    return data;
  },
}
```

3. Update `sanitizeModel()` and `defaultModel()` in `src/lib/model.ts`
4. Update `default-data.json` with the new field and version

***

## Deployment

### RSS Feed

An RSS feed is automatically generated at `/rss.xml` containing all published blog posts with full HTML content. It is:

- **Built at build time** — generated into `public/rss.xml` alongside the blog JSON files
- **Served in dev** — available at `http://localhost:8080/rss.xml` from the dev server
- **Auto-discoverable** — an `<link rel="alternate">` tag in the HTML head lets RSS readers find it

The feed uses your display name and tagline from the CMS as the channel title and description. Set the `VITE_SITE_URL` environment variable to your production domain so feed URLs point to the correct host:

```env
VITE_SITE_URL=https://yoursite.com
```

If not set, URLs default to `http://localhost:8080`.

***

### Static hosting (Vercel, Netlify, etc.)

```bash
npm run build
```

The `dist/` folder contains a fully static site. Deploy it anywhere.

For Vercel, the included `vercel.json` handles SPA routing. Set the GitHub env vars in your Vercel project settings to pull content at build time.

### Self-hosted

```bash
npm run build
npx serve dist
```

Or use the built-in CLI:

```bash
node bin/cli.mjs ./my-content
```

### Supabase Deployment

The newsletter feature requires a [Supabase](https://supabase.com) project with edge functions and database migrations. Use the built-in `deploy` command to push everything in one step.

#### Prerequisites

1. Install the Supabase CLI: `npm i -D supabase`
2. Log in: `npx supabase login`
3. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard)
4. Set your environment variables in `.env`:

```env
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

#### Deploy via CLI

Deploy database migrations and all edge functions to your remote Supabase project:

```bash
npx github:platform-kit/linkable deploy --project-ref <your-project-ref>
```

Or set the ref as an environment variable:

```bash
export SUPABASE_PROJECT_REF=abcdefghijklmnop
npx github:platform-kit/linkable deploy
```

If you've already linked the project (`npx supabase link`), the ref is auto-detected and no flag is needed:

```bash
npx github:platform-kit/linkable deploy
```

There is also a convenience npm script:

```bash
npm run deploy:supabase
```

#### What it does

1. **Links the project** — connects to your remote Supabase project (if not already linked)
2. **Pushes migrations** — applies all pending SQL migrations from `supabase/migrations/` to the remote database via `supabase db push`
3. **Deploys edge functions** — deploys all functions from `supabase/functions/` (newsletter-signup, newsletter-admin, newsletter-view, etc.)

#### Full build + deploy

To build the static site and deploy Supabase in sequence:

```bash
npx github:platform-kit/linkable build . && npx github:platform-kit/linkable deploy --project-ref <your-project-ref>
```

Or, if you're developing locally in a cloned repo:

```bash
npm run build && npm run deploy:supabase
```

#### Setting secrets

Edge functions need SMTP credentials and other secrets. Push them to your remote project:

```bash
npx supabase secrets set SMTP_HOST=smtp.example.com SMTP_PORT=587 SMTP_USER=you@example.com SMTP_PASS=secret SMTP_FROM=noreply@example.com
npx supabase secrets set NEWSLETTER_HMAC_SECRET=your-random-secret
npx supabase secrets set CMS_PASSWORD_HASH=your-bcrypt-hash
```

Or use the helper script if available:

```bash
npm run supabase:secrets
```

***

## Layout Extensibility

Layouts can contribute custom settings and CMS pages through the manifest system. Each layout exports a manifest from `src/layouts/<name>/manifest.ts`:

```ts
import type { LayoutManifest } from "../../lib/layout-manifest";

export default {
  name: "My Layout",
  vars: [], // CSS variable overrides (shown in Theme panel)
  schema: [], // FormKit schema for inline settings (optional)
  cmsTabs: [], // Additional CMS tabs (optional)
} satisfies LayoutManifest;
```

### Three levels of extensibility

| Need | Manifest field | Renders in | Author writes |
|---|---|---|---|
| Simple theme settings | `schema` | Theme panel (inline) | FormKit JSON schema |
| Full CMS tab, simple UI | `cmsTabs[].schema` | Own top-level tab | FormKit JSON schema |
| Full CMS tab, complex UI | `cmsTabs[].component` | Own top-level tab | Custom Vue component |
| Custom page with URL | `routes[]` | Full page (replaces default content) | Vue component + path |

### Schema-driven settings (no Vue code required)

The `schema` field on the manifest uses [FormKit schema](https://formkit.com/essentials/schema) to auto-render form inputs in the Theme panel. Available input types include all [FormKit inputs](https://formkit.com/inputs) plus the custom `colorpicker` type.

```ts
export default {
  name: "Bento",
  vars: [],
  schema: [
    { $formkit: "range", name: "gap", label: "Card Gap (px)", min: 4, max: 24, value: 8 },
    { $formkit: "colorpicker", name: "cardAccent", label: "Card Accent", value: "#3b82f6" },
    { $formkit: "toggle", name: "showLabels", label: "Show card labels", value: true },
  ],
} satisfies LayoutManifest;
```

Schema-driven settings read and write to the root of `layoutData` (stored per-layout in `theme.layoutData`).

### CMS tabs

Layouts can add full top-level CMS tabs alongside the built-in tabs (Site, Content, Newsletter, Analytics). Each tab's data is sub-keyed at `layoutData[tab.key]`, preventing collisions.

**Schema-driven tab** (no Vue component needed):

```ts
cmsTabs: [
  {
    key: "integrations",
    label: "Integrations",
    icon: "pi-link",
    schema: [
      { $formkit: "url", name: "spotifyPlaylist", label: "Spotify Playlist URL" },
      { $formkit: "toggle", name: "showGithubActivity", label: "Show activity graph", value: false },
    ],
  },
],
```

**Component-driven tab** (full custom UI):

```ts
cmsTabs: [
  {
    key: "grid",
    label: "Grid Editor",
    icon: "pi-th-large",
    component: () => import("./BentoGridEditor.vue"),
  },
],
```

Component-driven tabs receive `modelValue` (`layoutData[tab.key]`) and emit `update:modelValue`.

### Layout routes

Layouts can contribute full pages with their own URL paths. Routes are registered with Vue Router when the layout is active and automatically removed when the user switches to a different layout.

```ts
// manifest.ts
export default {
  name: "Portfolio",
  vars: [],
  routes: [
    {
      path: "/projects",
      component: () => import("./ProjectsPage.vue"),
      label: "Projects",
      icon: "pi-briefcase",
    },
    {
      path: "/projects/:slug",
      component: () => import("./ProjectDetail.vue"),
    },
  ],
} satisfies LayoutManifest;
```

Route components receive two props automatically:
- `model` — the full `BioModel`
- `layoutData` — `model.theme.layoutData` (convenience shortcut)

When a layout route is active, the default page content (profile header, tabs, sections) is hidden and the route component renders in its place. Navigation can be wired via standard `<router-link>` or programmatic `router.push()`.

The `label` and `icon` fields are surfaced in `layoutRoutes` (available in the template) so nav components can render links to layout-contributed pages.

### Zod validation

Both the root `schema` and individual `cmsTabs` entries support an optional `validation` field accepting a Zod schema:

```ts
import { z } from "zod";

export default {
  name: "Bento",
  vars: [],
  schema: [
    { $formkit: "range", name: "gap", label: "Gap", min: 4, max: 24, value: 8 },
  ],
  validation: z.object({
    gap: z.number().min(4).max(24),
  }),
} satisfies LayoutManifest;
```

### CSS variable overrides

The `vars` array registers layout-specific CSS custom properties that are editable in the Theme panel and persisted in `theme.layoutVars`:

```ts
vars: [
  {
    cssVar: "--bento-card-radius",
    label: "Card Radius",
    type: "text",
    defaultLight: "1rem",
    defaultDark: "1rem",
  },
],
```

### Custom FormKit inputs

Custom FormKit inputs are registered in `src/lib/formkit-config.ts`. Currently available:

- `colorpicker` — color swatch + hex text input

To add more, follow the [FormKit custom input guide](https://formkit.com/guides/create-a-custom-input) and register in the config file.

***

## User-Provided Themes & Overrides

Users can ship custom layouts and component overrides as part of their content repo. These are staged into the core app at build time and kept completely isolated from the core codebase.

### Content repo structure

```
my-content/
  data.json
  uploads/
  blog/
  layouts/              ← custom layouts (optional)
    bento/
      manifest.ts       ← layout manifest (name, schema, cmsTabs, vars)
      ProfileHeader.vue ← component overrides for this layout
      LinksSection.vue
      BentoGridEditor.vue
  overrides/             ← global component overrides (optional)
    ProfileHeader.vue    ← overrides ProfileHeader in ALL layouts
```

### How it works

1. **At build time**, the CLI copies `layouts/` → `src/layouts/user/` and `overrides/` → `src/overrides/user/`
2. **Vite's `import.meta.glob`** discovers the files alongside core layouts
3. **Layout names** are namespaced as `user/<name>` (e.g. `user/bento`) — no collision with built-in layouts
4. **After the build**, staged files are cleaned up — the core repo is never contaminated
5. **`.gitignore`** excludes `src/layouts/user/` and `src/overrides/user/`

### Resolution priority

When rendering a component, the resolver checks in order:

1. **User overrides** — `src/overrides/user/<Name>.vue` (from content repo `overrides/`)
2. **Core overrides** — `src/overrides/<Name>.vue`
3. **Layout variant** — `src/layouts/<layout>/<Name>.vue` (works for both `minimal` and `user/bento`)
4. **Fallback** — default component from `src/components/`

User overrides apply globally across all layouts. Layout-specific overrides only apply when that layout is active.

### Writing a user layout

A minimal user layout needs only a `manifest.ts`:

```ts
// my-content/layouts/bento/manifest.ts
import type { LayoutManifest } from "../../lib/layout-manifest";

export default {
  name: "Bento",
  vars: [],
  schema: [
    { $formkit: "range", name: "columns", label: "Columns", min: 2, max: 6, value: 4 },
    { $formkit: "toggle", name: "showLabels", label: "Show labels", value: true },
  ],
} satisfies LayoutManifest;
```

Add Vue components alongside the manifest to override specific sections (e.g. `ProfileHeader.vue`, `LinksSection.vue`). Any component not overridden falls back to the default.

### Building with user themes

```bash
npx linkable build ./my-content
```

The CLI detects `layouts/` and `overrides/` in the content directory and stages them automatically. No extra flags needed.

### Theme dependencies

User-provided themes can depend on npm packages not included in the core app. The content repo ships its own `package.json` and dependencies are resolved through a Vite plugin at build time.

**Content repo structure:**

```
my-content/
  data.json
  package.json          ← declares theme-specific dependencies
  layouts/
    bento/
      manifest.ts
      BentoGridEditor.vue
  node_modules/          ← installed automatically during build
```

**Example package.json:**

```json
{
  "name": "my-linkable-content",
  "private": true,
  "dependencies": {
    "chart.js": "^4.0.0",
    "vue-chartjs": "^5.3.0"
  }
}
```

**How it works:**

1. During `linkable build ./my-content`, the CLI detects `package.json` in the content directory
2. `npm install --production` runs inside the content directory
3. A `.user-deps.json` marker file is written to the project root with the path to the content repo's `node_modules`
4. A Vite plugin (`user-deps`) intercepts bare imports that exist in the content repo's `node_modules` and resolves them from there
5. `server.fs.allow` is extended so Vite's dev server can serve files from the external `node_modules`
6. After the build completes, the `.user-deps.json` marker is cleaned up

**Using dependencies in layout components:**

```vue
<!-- my-content/layouts/bento/StatsCard.vue -->
<script lang="ts">
import { Bar } from "vue-chartjs";  // resolved from content's node_modules
</script>
```

**Documenting dependencies in the manifest:**

The `peerDependencies` field on the manifest is purely documentary — it tells users which packages the theme needs. The actual install is driven by the content repo's `package.json`.

```ts
export default {
  name: "Bento",
  peerDependencies: {
    "chart.js": "^4.0.0",
    "vue-chartjs": "^5.3.0",
  },
  vars: [],
  schema: [],
} satisfies LayoutManifest;
```

When running `npm run import`, set `GITHUB_CONTENT_DIR` to the local content checkout path to trigger the same dependency install step.

***

## Tech Stack

- **Vue 3** — reactive UI framework
- **PrimeVue** — component library (buttons, dialogs, inputs)
- **Tailwind CSS** — utility-first styling
- **Vite** — build tool and dev server
- **TypeScript** — type safety throughout

***

## License

MIT