import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./db/schema";

neonConfig.webSocketConstructor = ws;

const globalForDb = globalThis as unknown as { storylioPool?: Pool };
export const pool =
  globalForDb.storylioPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForDb.storylioPool = pool;

export const db = drizzle(pool, { schema });
export type Database = typeof db;

export async function closeDb() {
  await pool.end();
}
