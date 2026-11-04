import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getServerEnv } from "@/server/env";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __anbillPool?: Pool };

/** One pool per server instance (hot reload and serverless warm starts reuse it). */
export function getPool(): Pool {
  globalForDb.__anbillPool ??= new Pool({
    connectionString: getServerEnv().DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
    // Deadlines on every call: a hung database must fail the request (or the tool), not hang it.
    connectionTimeoutMillis: 5_000,
    statement_timeout: 8_000,
    ssl: getServerEnv().DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });
  return globalForDb.__anbillPool;
}

export const db = drizzle(getPool(), { schema });
export type Db = typeof db;
