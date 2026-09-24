import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { templateCompilerOptions } from "@tresjs/core";

export default defineConfig({
  plugins: [
    vue(templateCompilerOptions),
  ],
  build: {
    rollupOptions: {
      input: {
        index: new URL("./index.html", import.meta.url).pathname,
        background: new URL("./background.html", import.meta.url).pathname,
        buttons: new URL("./buttons.html", import.meta.url).pathname,
        glow: new URL("./glow.html", import.meta.url).pathname,
      },
    },
  },
});
