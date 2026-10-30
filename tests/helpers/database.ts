import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../../src/lib/db/schema";

const legacyMigrations = [
  "20260606140843_init",
  "20260615113000_add_project_contribution",
  "20260620000000_add_gallery_item_size",
];

export async function createTestDatabase({
  authRateLimits = false,
  authMfa = true,
  currentSchema = true,
} = {}) {
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
  // Apply the new additive auth table on top of archived legacy fixtures.
  if (authRateLimits) {
    await client.exec(
      await readFile(
        new URL("../../drizzle/0002_auth_rate_limits.sql", import.meta.url),
        "utf8",
      ),
    );
  }
  if (authMfa) {
    await client.exec(
      await readFile(
        new URL("../../drizzle/0003_auth_two_factor.sql", import.meta.url),
        "utf8",
      ),
    );
  }
  // Historical baseline tests opt out; application tests use retired Home schema.
  if (currentSchema) {
    for (const migration of ["0001_home_hero", "0004_retire_testimonials"]) {
      await client.exec(
        await readFile(
          new URL(`../../drizzle/${migration}.sql`, import.meta.url),
          "utf8",
        ),
      );
    }
  }
  return { client, db: drizzle(client, { schema }) };
}
