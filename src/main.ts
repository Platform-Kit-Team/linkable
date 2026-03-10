import { createApp } from "vue";
import type { App as VueApp } from "vue";

import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import { plugin as formkitPlugin, defaultConfig } from "@formkit/vue";

import Aura from "@primevue/themes/aura";

import "./styles.css";
import "primeicons/primeicons.css";

import App from "./App.vue";
import router from "./router";
import { formkitConfig } from "./lib/formkit-config";

// ── User theme override ─────────────────────────────────────────────
// Drop `src/overrides/primevue-theme.ts` to swap the PrimeVue preset:
//   export { default } from "@primevue/themes/lara";
const themeModules = import.meta.glob<{ default: any }>(
  ["./overrides/primevue-theme.ts", "./overrides/primevue-theme.js"],
  { eager: true },
);
const userThemePreset = Object.values(themeModules)[0]?.default;

// ── User setup hook ──────────────────────────────────────────────────
// Drop `src/overrides/setup.ts` exporting `(app: App) => void` to
// register custom Vue plugins, directives, or global components.
const setupModules = import.meta.glob<{ default: (app: VueApp) => void }>(
  ["./overrides/setup.ts", "./overrides/setup.js"],
  { eager: true },
);

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: userThemePreset || Aura,
  },
});
app.use(ToastService);
app.use(formkitPlugin, defaultConfig(formkitConfig));

// Register PrimeVue tooltip directive globally
import Tooltip from "primevue/tooltip";
app.directive("tooltip", Tooltip);

// Invoke user setup hook if present
const userSetup = Object.values(setupModules)[0]?.default;
if (typeof userSetup === "function") userSetup(app);

app.mount("#app");