import { createRouter, createWebHistory } from "vue-router";
import type { Router } from "vue-router";
import IndexPage from "./pages/Index.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: IndexPage,
    },
    {
      // Deep links (e.g. /about) should still bootstrap the SPA.
      // Layout-specific routing can then resolve inside the app.
      path: "/:pathMatch(.*)*",
      name: "spa-fallback",
      component: IndexPage,
    },
  ],
});

// ── User router hook ─────────────────────────────────────────────────
// Drop `src/overrides/router.ts` to add navigation guards, extra routes,
// or other router customizations:
//   export default (router: Router) => {
//     router.beforeEach((to, from) => { ... });
//   };
const routerModules = import.meta.glob<{ default: (r: Router) => void }>(
  ["./overrides/router.ts", "./overrides/router.js"],
  { eager: true },
);
const userRouterHook = Object.values(routerModules)[0]?.default;
if (typeof userRouterHook === "function") userRouterHook(router);

export default router;
