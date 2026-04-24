import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@tests": path.resolve(__dirname, "tests"),
      "@scripts": path.resolve(__dirname, "scripts"),
    },
    env: {
      PROJECT_ROOT: __dirname,
    },
  },
});
