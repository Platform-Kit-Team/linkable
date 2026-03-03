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
git clone https://github.com/platform-kit-team/linkable.git
cd linkable
npm install
npm run dev
```

Open `http://localhost:5173` and click the **CMS** button (bottom-right) to edit your content.

### Option 2: Serve with npx (no clone needed)

If you already have a content directory with `data.json` and an optional `uploads/` folder:

```bash
npx github:platform-kit-team/linkable serve ./my-content
```

### Option 3: Build a static site with npx

Build a deployable `dist/` folder using your own content — no need to clone the Linkable repo:

```bash
npx github:platform-kit-team/linkable build ./my-content
```

Output to a custom directory:

```bash
npx github:platform-kit-team/linkable build ./my-content --out ./public
```

This is ideal for deploying on Vercel, Netlify, or any static host. Create a content repo with your `data.json` and `uploads/`, then set the build command to:

```bash
npx github:platform-kit-team/linkable build .
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
| **Build Command**    | `npx github:platform-kit-team/linkable build .` |
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