import { defineConfig } from "drizzle-kit";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import * as schema from "./src/lib/db/schema";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["public"],
  // Keep Prisma's historical ledger and unrelated tables outside push/pull scope.
  tablesFilter: Object.values(schema)
    .filter((table) => is(table, PgTable))
    .map((table) => getTableName(table)),
  dbCredentials: process.env.DIRECT_URL
    ? { url: process.env.DIRECT_URL }
    : undefined,
  strict: true,
});
