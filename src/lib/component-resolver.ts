/**
 * Component override & layout resolver.
 *
 * Resolution priority (highest → lowest):
 *   1. `src/overrides/user/<Name>.vue`     — content-repo custom override
 *   2. `src/overrides/<Name>.vue`          — core project override
 *   3. `src/layouts/<layout>/<Name>.vue`   — selected layout variant
 *   4. fallback (from `src/components/`)   — default layout
 *
 * User-provided layouts live under `src/layouts/user/<name>/` and are
 * discovered as layout name `user/<name>`.  They are staged from
 * `<content-repo>/layouts/` at build time and gitignored.
 *
 * Usage in App.vue:
 *   const ProfileHeader = useComponent('ProfileHeader', DefaultProfileHeader, layout);
 *
 * `layout` is a Ref<string> (e.g. `computed(() => model.theme.layout)`).
 * When the value changes the resolved component updates reactively.
 */
import { type Component, computed, defineAsyncComponent, type Ref, ref, watch, onScopeDispose, type ShallowRef, shallowRef } from "vue";
import type { LayoutManifest, LayoutRoute } from "./layout-manifest";
import type { BioTheme } from "./model";
import { THEME_PRESETS } from "./model";
import type { Router } from "vue-router";

const overrideModules = import.meta.glob<{ default: Component }>(
  "../overrides/**/*.vue",
);

const layoutModules = import.meta.glob<{ default: Component }>(
  "../layouts/**/*.vue",
);

const manifestModules = import.meta.glob<{ default: LayoutManifest }>(
  "../layouts/**/manifest.ts",
  { eager: true },
);

/**
 * List every layout name that ships at least one component override.
 * Always includes "default" even if no files exist under `src/layouts/default/`.
 */
export function getAvailableLayouts(): string[] {
  const names = new Set<string>();
  for (const key of Object.keys(layoutModules)) {
    // Matches both "../layouts/minimal/X.vue" and "../layouts/user/bento/X.vue"
    const match = key.match(/^\.\.\/layouts\/((?:user\/)?[^/]+)\//);
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
    // Check user override first, then core override
    const userOverrideKey = `../overrides/user/${name}.vue`;
    if (overrideModules[userOverrideKey]) {
      return defineAsyncComponent(overrideModules[userOverrideKey]);
    }
    const overrideKey = `../overrides/${name}.vue`;
    if (overrideModules[overrideKey]) {
      return defineAsyncComponent(overrideModules[overrideKey]);
    }
    return fallback;
  }

  // Reactive: re-resolve whenever layout changes
  return computed(() => {
    // 1. User override (content-repo) wins first
    const userOverrideKey = `../overrides/user/${name}.vue`;
    if (overrideModules[userOverrideKey]) {
      return defineAsyncComponent(overrideModules[userOverrideKey]);
    }

    // 2. Core override
    const overrideKey = `../overrides/${name}.vue`;
    if (overrideModules[overrideKey]) {
      return defineAsyncComponent(overrideModules[overrideKey]);
    }

    // 2. Layout variant (skip "default" — that's what fallback already is)
    const layoutName = layout.value;
    if (layoutName && layoutName !== "default") {
      const layoutKey = `../layouts/${layoutName}/${name}.vue`;
      if (layoutModules[layoutKey]) {
        return defineAsyncComponent(layoutModules[layoutKey]);
      }
    }

    // 3. Fallback (default component)
    return fallback;
  }) as unknown as Component;
}

/**
 * Get the variable manifest for a layout, or null if none exists.
 */
export function getLayoutManifest(layoutName: string): LayoutManifest | null {
  const key = `../layouts/${layoutName}/manifest.ts`;
  const mod = manifestModules[key];
  return mod?.default ?? null;
}

/**
 * Get the theme presets for a layout.
 *
 * Returns the preset record from the layout's manifest, falling back
 * to THEME_PRESETS (generic light/dark) if the layout has no manifest
 * or declares no presets.
 */
export function getLayoutPresets(layoutName: string): Record<string, () => BioTheme> {
  const manifest = getLayoutManifest(layoutName);
  if (manifest?.presets && Object.keys(manifest.presets).length > 0) {
    return manifest.presets;
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
        component: defineAsyncComponent(r.component),
        meta: { ...(r.meta ?? {}), layoutRoute: true },
      });
      names.push(name);
    }
    registeredNames = names;
  };

  watch(
    layout,
    (layoutName) => {
      removeOldRoutes();

      const manifest = getLayoutManifest(layoutName);
      const routes = manifest?.routes ?? [];
      if (routes.length > 0) {
        addNewRoutes(routes);
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
