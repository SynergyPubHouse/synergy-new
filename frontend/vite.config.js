import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
  },
  ssr: {
    external: ["react", "react-dom"],
    noExternal: [
      "react-helmet-async",
      "react-router",
      "react-router-dom",
      "turbo-stream",
    ],
  },
  plugins: [react(), tailwindcss()],
});
