/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/App.vue",
    "./src/components/**/*.vue",
    "./src/pages/**/*.vue",
    "./src/layouts/**/*.vue",
    "./src/overrides/**/*.vue",
    "./src/*.{js,ts}",
    "./src/components/**/*.{js,ts}",
    "./src/lib/**/*.{js,ts}",
    "./src/pages/**/*.{js,ts}",
    "./src/utils/**/*.{js,ts}",
    "./src/overrides/**/*.{js,ts}",
    "./src/layouts/*/*.{js,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};