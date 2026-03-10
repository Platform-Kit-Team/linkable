/**
 * Component override & layout resolver.
 *
 * Resolution priority (highest → lowest):
 *   1. `src/overrides/<Name>.vue`          — user override
 *   2. `src/themes/<layout>/<Name>.vue`   — active theme variant
 *   3. fallback                            — default component
 *
 * Config merge chain (each level extends/overrides the previous):
 *   1. Root `platformkit.config.ts`        — system / platform defaults
 *   2. `src/themes/<name>/platformkit.config.ts` — theme-level config
 *   3. `src/overrides/platformkit.config.ts`     — user-level overrides (final say)
 *
 * `layout` is a Ref<string> (e.g. `computed(() => model.theme.layout)`).
 * When the value changes the resolved component updates reactively.
 */
import { type Component, computed, defineAsyncComponent, type Ref, ref, watch, onScopeDispose, type ShallowRef, shallowRef } from "vue";
import type { LayoutRoute, ContentSchema } from "./layout-manifest";
import type { ThemeConfig } from "./model";
import { THEME_PRESETS } from "./model";
import type { Router } from "vue-router";
import type { PlatformKitConfig } from "./config";

// Read config to determine theme/override directories



// ── Three-level config loading ──────────────────────────────────────
// 1. System / root config
const systemConfigModules = import.meta.glob<{ default: PlatformKitConfig }>(
  ["../../platformkit.config.ts", "../../platformkit.config.js", "../../platformkit.config.mjs"],
  { eager: true },
);
const systemConfig: PlatformKitConfig =
  Object.values(systemConfigModules)[0]?.default ?? {};

let themeDir: string;
let overrideDir: string;
if (typeof systemConfig !== "undefined" && systemConfig.paths) {
  themeDir = systemConfig.paths.themeDir || "../themes";
  overrideDir = systemConfig.paths.overrideDir || "../overrides";
} else {
  themeDir = "../themes";
  overrideDir = "../overrides";
}

const overrideModules = {
  ...import.meta.glob("../overrides/*.vue"),
  ...import.meta.glob("../overrides/user/*.vue"),
};

const layoutModules = {
  ...import.meta.glob("../themes/**/*.vue"),
  ...import.meta.glob("../themes/user/**/*.vue"),
};

// 2. Theme configs (loaded per-theme)
const themeConfigModules = {
  ...import.meta.glob("../themes/**/platformkit.config.ts", { eager: true }),
  ...import.meta.glob("../themes/user/**/platformkit.config.ts", { eager: true }),
};

// 3. User overrides (final say)
const userConfigModules = {
  ...import.meta.glob("../overrides/platformkit.config.ts", { eager: true }),
  ...import.meta.glob("../overrides/platformkit.config.js", { eager: true }),
  ...import.meta.glob("../overrides/user/platformkit.config.ts", { eager: true }),
  ...import.meta.glob("../overrides/user/platformkit.config.js", { eager: true }),
};
const userConfig: Partial<PlatformKitConfig> | null =
  Object.values(userConfigModules)[0]?.default ?? null;

/**
 * List every layout name that ships at least one component override.
 * Always includes "default" even if no files exist under `src/themes/default/`.
 */
export function getAvailableLayouts(): string[] {
  const names = new Set<string>();
  for (const key of Object.keys(layoutModules)) {
    // Matches both "../themes/minimal/X.vue" and "../themes/user/bento/X.vue"
    const match = key.match(/^\.\.\/themes\/((?:user\/)?[^/]+)\//);
    if (match) names.add(match[1]);
  }
  return Array.from(names).sort();
}

/**
 * Resolve a component by name, respecting overrides → layout → fallback.
 *
 * @param name     Component name, e.g. "ProfileHeader"
 * @param fallback Default component from `src/components/`
 * @param layout   Reactive ref to the current layout name (e.g. "default", "minimal")
 */
export function useComponent(
  name: string,
  fallback: Component,
  layout?: Ref<string>,
): Component {
  // If no layout ref supplied, behave like the old static resolver
  if (!layout) {
    const overrideKey = `../overrides/${name}.vue`;
    if (overrideModules[overrideKey]) {
      return defineAsyncComponent(overrideModules[overrideKey]);
    }
    return fallback;
  }

  // Reactive: re-resolve whenever layout changes
  return computed(() => {
    // 1. User override wins first
    const overrideKey = `../overrides/${name}.vue`;
    if (overrideModules[overrideKey]) {
      return defineAsyncComponent(overrideModules[overrideKey]);
    }

    // 2. Theme variant (skip "default" — that's what fallback already is)
    const layoutName = layout.value;
    if (layoutName && layoutName !== "default") {
      const layoutKey = `../themes/${layoutName}/${name}.vue`;
      if (layoutModules[layoutKey]) {
        return defineAsyncComponent(layoutModules[layoutKey]);
      }
    }

    // 3. Fallback
    return fallback;
  }) as unknown as Component;
}

// ── Config merge ────────────────────────────────────────────────────

/** Convert contentCollections entries into ContentSchema objects. */
function contentCollectionsToSchemas(config: PlatformKitConfig): ContentSchema[] {
  const collections = config.contentCollections;
  if (!collections) return [];
  return Object.entries(collections).map(([key, cfg]) => ({
    key,
    label: cfg.label ?? key.charAt(0).toUpperCase() + key.slice(1),
    icon: cfg.icon ?? "File",
    defaultEnabled: cfg.defaultEnabled ?? true,
    searchable: cfg.searchable ?? false,
    external: true,
    directory: cfg.directory,
    format: cfg.format,
    slugField: cfg.slugField,
    sortField: cfg.sortField,
    sortOrder: cfg.sortOrder,
    itemSchema: cfg.itemSchema,
    newItem: cfg.newItem,
    itemLabel: cfg.itemLabel,
    itemSublabel: cfg.itemSublabel,
    itemThumbnail: cfg.itemThumbnail,
    editorComponent: cfg.editorComponent,
  }));
}

/**
 * Merge two PlatformKitConfig objects. The `override` wins on conflict.
 * - `contentSchemas`: union-merged by key (override wins per-key)
 * - `routes`: concatenated
 * - `cmsTabs`: union-merged by key
 * - `vars`: union-merged by cssVar
 * - `presets`: shallow-merged (override wins per-key)
 * - `contentCollections`: auto-converted to contentSchemas and merged
 * - Scalar fields: override wins if present
 */
function mergeConfigs(base: PlatformKitConfig, override: Partial<PlatformKitConfig>): PlatformKitConfig {
  const merged = { ...base, ...override };

  // Merge contentSchemas: base + override, override wins per-key
  const baseSchemas = [
    ...(base.contentSchemas ?? []),
    ...contentCollectionsToSchemas(base),
  ];
  const overrideSchemas = [
    ...(override.contentSchemas ?? []),
    ...contentCollectionsToSchemas(override),
  ];
  if (baseSchemas.length > 0 || overrideSchemas.length > 0) {
    const byKey = new Map(baseSchemas.map((s) => [s.key, s]));
    for (const s of overrideSchemas) {
      byKey.set(s.key, s);
    }
    merged.contentSchemas = Array.from(byKey.values());
  }

  // Merge routes: concatenate
  if (base.routes || override.routes) {
    merged.routes = [...(base.routes ?? []), ...(override.routes ?? [])];
  }

  // Merge cmsTabs: union by key
  if (base.cmsTabs || override.cmsTabs) {
    const tabs = new Map((base.cmsTabs ?? []).map((t) => [t.key, t]));
    for (const t of (override.cmsTabs ?? [])) {
      tabs.set(t.key, t);
    }
    merged.cmsTabs = Array.from(tabs.values());
  }

  // Merge vars: union by cssVar
  if (base.vars || override.vars) {
    const vars = new Map((base.vars ?? []).map((v) => [v.cssVar, v]));
    for (const v of (override.vars ?? [])) {
      vars.set(v.cssVar, v);
    }
    merged.vars = Array.from(vars.values());
  }

  // Merge presets: shallow-merge (override wins per preset key)
  if (base.presets || override.presets) {
    merged.presets = { ...(base.presets ?? {}), ...(override.presets ?? {}) };
  }

  // Merge buildHooks: concatenate (all levels run)
  if (base.buildHooks || override.buildHooks) {
    merged.buildHooks = [...(base.buildHooks ?? []), ...(override.buildHooks ?? [])];
  }

  return merged;
}

/**
 * Get the merged config for a layout.
 *
 * Merge chain (each level extends/overrides the previous):
 *   1. Root `platformkit.config.ts`        — system defaults
 *   2. `src/themes/<name>/platformkit.config.ts` — theme config
 *   3. `src/overrides/platformkit.config.ts`     — user overrides (final say)
 */
export function getLayoutConfig(layoutName: string): PlatformKitConfig | null {
  // 1. Start with system config
  let result: PlatformKitConfig = { ...systemConfig };

  // 2. Merge theme config
  const themeKey = `../themes/${layoutName}/platformkit.config.ts`;
  const themeModule = themeConfigModules[themeKey];
  if (themeModule?.default) {
    result = mergeConfigs(result, themeModule.default);
  } else if (!Object.keys(result).some(k => ["presets", "contentSchemas", "vars", "routes", "cmsTabs", "name"].includes(k) && (result as any)[k])) {
    // No theme config and system config has no UI fields — nothing to return
    if (!userConfig) return null;
  }

  // 3. Merge user overrides (final say)
  if (userConfig) {
    result = mergeConfigs(result, userConfig);
  }

  return result;
}

/**
 * @deprecated Use `getLayoutConfig` instead. This is a backwards-compat alias.
 */


/**
 * Get the theme presets for a layout.
 *
 * Returns the preset record from the layout's manifest, falling back
 * to THEME_PRESETS (generic light/dark) if the layout has no manifest
 * or declares no presets.
 */
export function getLayoutPresets(layoutName: string): Record<string, () => ThemeConfig> {
  const config = getLayoutConfig(layoutName);
  if (config?.presets && Object.keys(config.presets).length > 0) {
    return config.presets;
  }
  return THEME_PRESETS;
}

/** Internal route-name prefix to identify layout-contributed routes. */
const LAYOUT_ROUTE_PREFIX = "__layout_route__";

/**
 * Composable that registers / unregisters layout-contributed routes when
 * the active layout changes.
 *
 * Returns a reactive ref of the currently registered `LayoutRoute[]` entries
 * (useful for rendering nav links).
 *
 * Must be called inside a Vue setup scope.
 */
export function useLayoutRoutes(
  router: Router,
  layout: Ref<string>,
): ShallowRef<LayoutRoute[]> {
  const activeRoutes = shallowRef<LayoutRoute[]>([]);
  let registeredNames: string[] = [];

  const removeOldRoutes = () => {
    for (const name of registeredNames) {
      router.removeRoute(name);
    }
    registeredNames = [];
  };

  const addNewRoutes = (routes: LayoutRoute[]) => {
    const names: string[] = [];
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      const name = `${LAYOUT_ROUTE_PREFIX}${i}_${r.path}`;
      router.addRoute({
        path: r.path,
        name,
        component: r.component,
        meta: { ...(r.meta ?? {}), layoutRoute: true },
      });
      names.push(name);
    }
    registeredNames = names;
  };

  const rematchCurrentLocationIfNeeded = async () => {
    // Initial navigation can happen before dynamic layout routes are added.
    // Wait for router readiness, then re-resolve current URL against the
    // updated matcher so deep links like /about can render immediately.
    await router.isReady();

    const fullPath = router.currentRoute.value.fullPath;
    const currentMatched = router.currentRoute.value.matched.length;
    const resolvedMatched = router.resolve(fullPath).matched.length;

    if (currentMatched === 0 && resolvedMatched > 0) {
      void router.replace(fullPath).catch(() => {
        // Ignore redundant-navigation and transient route-sync failures.
      });
    }
  };

  watch(
    layout,
    (layoutName) => {
      removeOldRoutes();

      const config = getLayoutConfig(layoutName);
      const routes = config?.routes ?? [];
      if (routes.length > 0) {
        addNewRoutes(routes);
        void rematchCurrentLocationIfNeeded();
      }
      activeRoutes.value = routes;
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    removeOldRoutes();
  });

  return activeRoutes;
}

/**
 * Check whether the current route was contributed by a layout.
 */
export function isLayoutRoute(route: { name?: string | symbol | null | undefined }): boolean {
  return typeof route.name === "string" && route.name.startsWith(LAYOUT_ROUTE_PREFIX);
}
