import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const isNextBuild =
  process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build";
const rawUrl = isNextBuild
  ? `file:${path.join(process.cwd(), ".next", "cache", `build-${process.pid}.db`)}`
  : (process.env.DATABASE_URL ?? "file:./storage/boltalnya.db");
const dbPath = rawUrl.replace("file:", "");
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const sqlite = new Database(resolvedPath, { timeout: 10_000 });
sqlite.pragma("busy_timeout = 10000");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite };
