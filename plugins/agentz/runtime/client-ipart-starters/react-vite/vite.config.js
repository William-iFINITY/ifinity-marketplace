import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "__PACKAGE_BASE_URL__",
  plugins: [react()],
  build: {
    sourcemap: false,
    target: "es2022",
  },
});
