import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://itashin1201.github.io",
  base: "/",
  trailingSlash: "always",
  build: { format: "directory" },
});
