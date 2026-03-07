import { defineConfig } from "drizzle-kit";

import { env } from "@better-issues/env/api";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
