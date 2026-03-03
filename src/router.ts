import { createRouter, createWebHistory } from "vue-router";

/**
 * Minimal router used purely for URL management.
 * App.vue watches the current route to load blog posts from /content/:slug.
 * No <router-view> is needed — the component is always App.vue.
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: { render: () => null },
    },
    {
      path: "/content/:slug",
      name: "blog-post",
      component: { render: () => null },
    },
  ],
});

export default router;
