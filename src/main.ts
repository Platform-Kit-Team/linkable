import { createApp } from "vue";

import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";

import Aura from "@primevue/themes/aura";

import "./styles.css";
import "primeicons/primeicons.css";

import App from "./App.vue";

createApp(App)
  .use(PrimeVue, {
    ripple: true,
    theme: {
      preset: Aura,
    },
  })
  .use(ToastService)
  .mount("#app");