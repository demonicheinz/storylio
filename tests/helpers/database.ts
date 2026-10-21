import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../../src/lib/db/schema";

const legacyMigrations = [
  "20260606140843_init",
  "20260615113000_add_project_contribution",
  "20260620000000_add_gallery_item_size",
];

export async function createTestDatabase() {
  const client = new PGlite();
  for (const migration of legacyMigrations) {
    const ddl = await readFile(
      new URL(
        "../../db/legacy-prisma/migrations/" + migration + "/migration.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await client.exec(ddl);
  }
  return { client, db: drizzle(client, { schema }) };
}
