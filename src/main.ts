import { createApp } from "vue";

import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";

import "@primevue/themes/aura/theme.css";

import "./styles.css";
import "primeicons/primeicons.css";

import App from "./App.vue";

createApp(App)
  .use(PrimeVue, {
    ripple: true,
  })
  .use(ToastService)
  .mount("#app");