import { defineConfig } from "nitro";

export default defineConfig({
  preset: "vercel",
  vercel: {
    functions: {
      runtime: "nodejs22.x",
    },
  },
});
