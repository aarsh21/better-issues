import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

import { env } from "@better-issues/env/api";

import { schema } from "./schema";

const resolveDatabasePath = (databaseUrl: string) => {
  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length);
  }

  return databaseUrl;
};

const databasePath = resolveDatabasePath(env.DATABASE_URL);
const absoluteDatabasePath =
  databasePath === ":memory:" ? databasePath : resolve(process.cwd(), databasePath);

if (absoluteDatabasePath !== ":memory:") {
  mkdirSync(dirname(absoluteDatabasePath), {
    recursive: true,
  });
}

export const sqlite = new Database(absoluteDatabasePath, {
  create: true,
});

sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, {
  schema,
});

export * from "./schema";
