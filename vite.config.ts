import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/LifeSafe/",
  root: "src",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true
  }
});
