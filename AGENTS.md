# Tech Stack

- You are building a Vue application.
- Use TypeScript.
- Use Vite.
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is src/pages/Index.tsx
- UPDATE the main page to include the new components. OTHERWISE, the user can NOT see any components!
- Tailwind CSS: always use Tailwind CSS for styling components. Utilize Tailwind classes extensively for layout, spacing, colors, and other design aspects.

Available packages and libraries:

- ALWAYS try to use the PrimeVue UI library instead of creating components from scratch. Most of the low-level components you need already exist here.
- The lucide-vue-next package is installed for icons.

***

# Content Schema & Migration System

The content data model lives in `src/lib/model.ts` (`BioModel` type). Every persisted JSON file carries a `schemaVersion` number. When the app loads data, `sanitizeModel()` calls `migrateToLatest()` (from `src/lib/migrations.ts`) to auto-upgrade old data to the current schema.

## Rules for changing the data model

Whenever you add, rename, or remove a field on `BioModel`, `BioProfile`, `BioLink`, or `SocialLink`:

1. **Bump** **`CURRENT_SCHEMA_VERSION`** **CURRENT_SCHEMA_VERSION** in `src/lib/migrations.ts` (increment by 1).
2. **Add a migration entry** to the `migrations` array in the same file. The migration function receives the raw JSON object at the previous version and must return it at the new version. Example:

   ```ts
   {
     toVersion: 3,
     migrate: (data) => {
       // add the new field with a sensible default
       data.profile.newField = "default";
       data.schemaVersion = 3;
       return data;
     },
   }
   ```
3. **Update** **`sanitizeModel()`** **sanitizeModel()** in `src/lib/model.ts` so it reads/validates the new field.
4. **Update** **`defaultModel()`** **defaultModel()** in `src/lib/model.ts` to include the new field.
5. **Update** **`default-data.json`** **default-data.json** (the template seed file) with the new field and the new `schemaVersion`.
6. **Never delete a migration** — old users may jump multiple versions.

## Content file separation

- `default-data.json` — committed to the repo; generic placeholder content for new users.
- `cms-data.json` — gitignored; local working copy of CMS data.
- `content/` — gitignored; all user-owned source content (markdown blog posts, collection files, etc.).
- `public/content/` — gitignored; all build output for user content:
  - `public/content/data.json` — exported CMS data
  - `public/content/uploads/` — uploaded images, audio, etc.
  - `public/content/blog/` — built blog post JSON files
  - `public/content/blog/audio/` — TTS-generated audio files
  - `public/content/collections/{key}/` — built collection JSON files
  - `public/content/rss.xml` — generated RSS feed(s)
- `npm run push` exports local content to a private GitHub repo; `npm run import` pulls it back.
- **All user content output MUST go under `public/content/`** to ensure it is gitignored and never contaminates the framework repo.

***

# Theme & Override Dependencies

Themes in `src/themes/` and user overrides in `src/overrides/` may each have their own `package.json` declaring extra dependencies. These dependencies are **not** listed in the root `package.json` — they live exclusively in their own `package.json`.

## How dependencies are installed

`scripts/install-layout-deps.mjs` runs automatically before `dev` and `build`. It:

1. Scans every directory under `src/themes/` **and** `src/overrides/` for a `package.json`.
2. Collects all `dependencies` and `devDependencies` from each.
3. Skips any package already present in local `node_modules/`.
4. Installs missing packages via `npm install` (or `pnpm install` as fallback).

## Rules for theme/override dependencies

- **Never add a theme- or override-specific dependency to the root `package.json`**. Declare it in the relevant `package.json` instead.
- The install script handles installation — no pnpm workspaces or manual install steps needed.
- If you create a new theme that needs extra packages, create a `package.json` in its directory (e.g. `src/themes/newtheme/package.json`) with the dependencies. The script will discover and install them automatically.
- User overrides can do the same: create `src/overrides/package.json` with any dependencies the override components need.
- Example (`src/themes/bento/package.json`):

  ```json
  {
    "name": "@themes/bento",
    "private": true,
    "dependencies": {
      "grid-layout-plus": "^1.1.1"
    }
  }
  ```

***

# Collection Schema Migrations

File-based content collections (defined in `platformkit.config.ts` under `contentCollections`) have their own migration system, separate from the system-level `BioModel` migrations. This lives in `src/lib/collection-migrations.ts`.

## Two migration mechanisms

1. **Declarative (idempotent, always runs):**
   - `fieldRenames`: `{ newFieldName: "oldFieldName" }` — moves values from old keys to new ones.
   - `fieldDefaults`: `{ fieldName: defaultValue }` — fills in missing fields with defaults.
2. **Imperative (version-gated, runs once):**
   - `migrations`: Array of `{ toVersion, transform }` — arbitrary JS transforms that run in version order when `_schemaVersion` is behind.

Pipeline per item: read `_schemaVersion` (default 0) → run imperative migrations → apply declarative renames → apply declarative defaults → stamp `_schemaVersion`.

When a migration modifies an item, it is written back to disk so the migration only runs once.

## How to add a collection migration

In `platformkit.config.ts`, on the collection's config object:

1. **Bump `version`** (increment by 1).
2. **(Optional) Add declarative entries** to `fieldRenames` and/or `fieldDefaults`.
3. **(Optional) Add an imperative migration** to the `migrations` array.

Example:

```ts
contentCollections: {
  projects: {
    directory: "content/projects",
    format: "yaml",
    version: 2,
    fieldRenames: { coverImage: "thumbnail" },     // "thumbnail" was renamed to "coverImage"
    fieldDefaults: { featured: false, tags: [] },   // new fields with defaults
    migrations: [
      {
        toVersion: 2,
        transform: (item) => {
          // Imperative: split old "fullName" into "firstName" + "lastName"
          if (typeof item.fullName === "string") {
            const [first, ...rest] = item.fullName.split(" ");
            item.firstName = first;
            item.lastName = rest.join(" ");
            delete item.fullName;
          }
          return item;
        },
      },
    ],
    // ... itemSchema, label, etc.
  },
},
```

## Rules

- **Never delete a migration entry** — old items may jump multiple versions.
- Declarative entries are idempotent and always run; imperative entries are version-gated and run once.
- The `_schemaVersion` field on each item is an internal bookkeeping field — do not use it in schemas or editors.

***

# Supabase Database Rules

- **NEVER** use `supabase db reset` or `npm run supabase:reset` — it destroys all data.
- To apply new migrations, **always** use `npm run supabase:migrate:up` (`npx supabase migration up --local`). This applies only pending migrations without touching existing data.
- Never run destructive database commands (DROP TABLE, TRUNCATE, DELETE without WHERE, etc.) without explicit user confirmation.
- When creating new migrations, use `npm run supabase:migrate <name>` to generate the file, then edit it.