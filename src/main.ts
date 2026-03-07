import { createApp } from "vue";

import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import { plugin as formkitPlugin, defaultConfig } from "@formkit/vue";

import Aura from "@primevue/themes/aura";

import "./styles.css";
import "primeicons/primeicons.css";

import App from "./App.vue";
import router from "./router";
import { formkitConfig } from "./lib/formkit-config";

createApp(App)
  .use(router)
  .use(PrimeVue, {
    ripple: true,
    theme: {
      preset: Aura,
    },
  })
  .use(ToastService)
  .use(formkitPlugin, defaultConfig(formkitConfig))
  .mount("#app");