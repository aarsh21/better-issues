import { join } from "node:path";

import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { db } from "./index";

const migrationsFolder = join(import.meta.dir, "..", "migrations");

migrate(db, {
  migrationsFolder,
});
