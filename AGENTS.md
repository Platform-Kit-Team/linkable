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
- `cms-data.json` / `public/data.json` / `public/uploads/` — gitignored; personal content that lives locally or in a private repo.
- `npm run push` exports local content to a private GitHub repo; `npm run import` pulls it back.

***

# Layout Dependencies

Each layout in `src/layouts/` may have its own `package.json` declaring layout-specific dependencies. These dependencies are **not** listed in the root `package.json` — they live exclusively in the layout's own `package.json`.

## How layout dependencies are installed

`scripts/install-layout-deps.mjs` runs automatically before `dev` and `build`. It:

1. Scans every directory under `src/layouts/` for a `package.json`.
2. Collects all `dependencies` and `devDependencies` from each layout.
3. Skips any package already present in `node_modules/`.
4. Installs missing packages via `pnpm add`.

## Rules for layout dependencies

- **Never add a layout-specific dependency to the root `package.json`**. Declare it in `src/layouts/<layout>/package.json` instead.
- The install script handles installation — no pnpm workspaces or manual install steps needed.
- If you create a new layout that needs extra packages, create a `package.json` in its directory (e.g. `src/layouts/newlayout/package.json`) with the dependencies. The script will discover and install them automatically.
- Example (`src/layouts/bento/package.json`):
  ```json
  {
    "name": "@layouts/bento",
    "private": true,
    "dependencies": {
      "grid-layout-plus": "^1.1.1"
    }
  }
  ```

***

# Supabase Database Rules

- **NEVER** use `supabase db reset` or `npm run supabase:reset` — it destroys all data.
- To apply new migrations, **always** use `npm run supabase:migrate:up` (`npx supabase migration up --local`). This applies only pending migrations without touching existing data.
- Never run destructive database commands (DROP TABLE, TRUNCATE, DELETE without WHERE, etc.) without explicit user confirmation.
- When creating new migrations, use `npm run supabase:migrate <name>` to generate the file, then edit it.