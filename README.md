# Linkable

A design-forward, open-source link-in-bio page with a built-in CMS. Built with Vue 3, PrimeVue, and Tailwind CSS.

***

## Features

- **Glassmorphism design** — frosted-glass cards, soft shadows, smooth transitions
- **Built-in CMS** — edit your profile, links, and socials
- **Banner image** — full-width hero image displayed inside the profile card
- **Social links** — Instagram, GitHub, Email, etc
- **Image uploads** — drag-and-drop image uploads for avatar, banner, and link thumbnails
- **GitHub sync** — push/pull content to a private GitHub repo
- **CLI / npx support** — serve your site with one command, no cloning required
- **Responsive** — works on mobile and desktop
- **Static export** — builds to a static `dist/` folder, deployable anywhere

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
linkable --help                        Show help

Options:
  --port, -p <port>    Port for serve (default: 3000)
  --out, -o <dir>      Output directory for build (default: ./dist)
```

***

## Project Structure

````
├── bin/cli.mjs             CLI entry point for npx
├── default-data.json       Template seed content (committed)
├── cms-data.json           Your personal CMS data (gitignored)
├── public/
│   ├── data.json           Production content (gitignored)
│   └── uploads/            Uploaded images (gitignored)
├── scripts/
│   ├── export-data.mjs     Export CMS data to clipboard
│   ├── export-to-github.mjs Push content to GitHub repo
│   └── import-from-github.mjs Pull content from GitHub repo
└── src/
    ├── App.vue             Main app layout
    ├── components/         CMS dialogs, editors, UI components
    └── lib/
        ├── github.ts       GitHub API integration
        ├── migrations.ts   Schema versioning & migration pipeline
        ├── model.ts        Data types, sanitization, defaults
        └── persistence.ts  Fetch/save CMS data
```

`

***

## Content Management

### Editing content locally

1. Run `npm run dev`
2. Click the **CMS** button (bottom-right corner)
3. Edit your profile, links, and socials
4. Changes auto-save to `cms-data.json`

### Content files

| File                | Committed? | Purpose                     |
| ------------------- | ---------- | --------------------------- |
| `default-data.json` | Yes        | Template data for new users |
| `cms-data.json`     | No         | Your personal CMS data      |
| `public/data.json`  | No         | Production build content    |
| `public/uploads/`   | No         | Uploaded images             |
| `public/rss.xml`    | No         | Generated RSS feed          |

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

## Security & Password Protection

The CMS and GitHub sync features are protected by a password-based encryption system. Your GitHub Personal Access Token (PAT) is **never** stored in plaintext in the frontend bundle.

### How it works

1. **Build-time encryption** — During `npm run build`, the `GITHUB_TOKEN` from your `.env` file is encrypted using AES-256-GCM with a key derived from your `TOKEN_SECRET` password. Only the encrypted blob is embedded in the JavaScript bundle.
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
| `TOKEN_SECRET`       | Password used to encrypt/decrypt the token           | **No** — used only at build time for key derivation; not prefixed with `VITE_` to prevent accidental client exposure  |
| `GITHUB_OWNER`       | GitHub repo owner                                    | Yes (non-secret)    |
| `GITHUB_REPO`        | GitHub repo name                                     | Yes (non-secret)    |
| `GITHUB_BRANCH`      | GitHub branch                                        | Yes (non-secret)    |
| `VITE_SITE_URL`      | Your production domain (for RSS, OG tags)            | Yes (non-secret)    |

### CMS password gate

The CMS button in the bottom-right corner requires password authentication before opening. The same `TOKEN_SECRET` password unlocks both the CMS and the GitHub sync functionality. Once unlocked, subsequent CMS opens in the same browser tab session skip the password prompt.

### Security guarantees

- The raw PAT is never present in the built JavaScript bundle
- The password is never present in the built JavaScript bundle
- The encrypted token cannot be decrypted without the correct password
- The decrypted token is cached in sessionStorage and cleared when the tab closes
- No secrets are logged, persisted, or transmitted beyond the GitHub API calls

### Choosing a strong password

Set `TOKEN_SECRET` in your `.env` file to a strong, unique password:

```env
TOKEN_SECRET="your-strong-password-here"
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