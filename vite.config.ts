import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Workaround for environments where globalThis.crypto isn't Node's WebCrypto.
// @vitejs/plugin-vue uses crypto.hash when available.
import { webcrypto as nodeWebcrypto } from "node:crypto";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [vue()],
  define: {
    "globalThis.crypto": nodeWebcrypto as unknown,
  },
}));
