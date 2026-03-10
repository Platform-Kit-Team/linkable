import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// Attempt to load a user tailwind config from content repo (staged at project root)
let userConfig = null;
const userConfigPath = path.resolve("tailwind.user.config.js");
if (fs.existsSync(userConfigPath)) {
  try {
    const require = createRequire(import.meta.url);
    const mod = require(userConfigPath);
    userConfig = mod.default || mod;
  } catch { /* ignore */ }
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/App.vue",
    "./src/themes/*/**/*.vue",
    "!./src/themes/*/node_modules/**",
    "./src/admin/**/*.vue",
    "./src/pages/**/*.vue",
    "./src/overrides/*/**/*.vue",
    "!./src/overrides/node_modules/**",
    "./src/*.{js,ts}",
    "./src/themes/*/**/*.{js,ts}",
    "!./src/themes/*/node_modules/**",
    "./src/admin/**/*.{js,ts}",
    "./src/lib/**/*.{js,ts}",
    "./src/pages/**/*.{js,ts}",
    "./src/utils/**/*.{js,ts}",
    "./src/overrides/*/**/*.{js,ts}",
    "!./src/overrides/node_modules/**",
    ...(userConfig?.content ?? []),
  ],
  theme: {
    extend: {
      ...(userConfig?.theme?.extend ?? {}),
    },
  },
  plugins: [
    ...(userConfig?.plugins ?? []),
  ],
};