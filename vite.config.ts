import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/lifesafe/",
  root: "src",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true
  }
});
