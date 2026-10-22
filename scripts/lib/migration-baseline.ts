import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import {
  differingSchemaSections,
  type QueryExecutor,
  readDatabaseSchema,
} from "./database-schema";

export type MigrationConnection = {
  execute: QueryExecutor;
  transaction: <T>(
    callback: (execute: QueryExecutor) => Promise<T>,
  ) => Promise<T>;
};

export function migrationFiles() {
  return readMigrationFiles({ migrationsFolder: resolve("drizzle") });
}

export async function migrationStatus(execute: QueryExecutor) {
  const files = migrationFiles();
  const exists = await execute(
    sql.raw(
      "SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS present",
    ),
  );
  const applied = exists.rows[0]?.present
    ? (
        await execute(
          sql.raw(
            'SELECT hash, created_at FROM "drizzle"."__drizzle_migrations" ORDER BY created_at',
          ),
        )
      ).rows
    : [];
  for (const [index, row] of applied.entries()) {
    const local = files[index];
    if (
      !local ||
      local.folderMillis !== Number(row.created_at) ||
      local.hash !== row.hash
    ) {
      throw new Error(
        "Database migration history differs from the local Drizzle history. Refusing to continue.",
      );
    }
  }
  const last = applied.length
    ? Number(applied[applied.length - 1].created_at)
    : 0;
  return {
    applied: applied.length,
    pending: files.filter((file) => file.folderMillis > last).length,
  };
}

export async function checkBaseline(execute: QueryExecutor) {
  const metadata = JSON.parse(
    await readFile(resolve("drizzle/baseline-schema.json"), "utf8"),
  ) as {
    migration: { hash: string; folderMillis: number };
    schema: Awaited<ReturnType<typeof readDatabaseSchema>>;
  };
  const first = migrationFiles()[0];
  if (
    !first ||
    first.hash !== metadata.migration.hash ||
    first.folderMillis !== metadata.migration.folderMillis
  ) {
    throw new Error(
      "The initial migration changed after its schema fingerprint was generated.",
    );
  }
  const actual = await readDatabaseSchema(execute);
  const differences = differingSchemaSections(metadata.schema, actual);
  if (differences.length) {
    throw new Error(
      "Existing database does not match the migration baseline (" +
        differences.join(", ") +
        "). No changes were made.",
    );
  }
  return { first, tables: actual.tables.length };
}

/** Without apply=true this is catalog-only. Apply writes only the migration ledger. */
export async function adoptBaseline(
  connection: MigrationConnection,
  apply = false,
) {
  const checked = await checkBaseline(connection.execute);
  const status = await migrationStatus(connection.execute);
  if (!apply)
    return {
      tables: checked.tables,
      applied: false,
      alreadyApplied: status.applied > 0,
    };
  return connection.transaction(async (execute) => {
    await execute(
      sql.raw(
        "SELECT pg_advisory_xact_lock(hashtext('storylio-drizzle-migrations'))",
      ),
    );
    await checkBaseline(execute);
    const current = await migrationStatus(execute);
    if (current.applied > 0)
      return { tables: checked.tables, applied: false, alreadyApplied: true };
    await execute(sql.raw('CREATE SCHEMA IF NOT EXISTS "drizzle"'));
    await execute(
      sql.raw(
        'CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" ("id" serial PRIMARY KEY, "hash" text NOT NULL, "created_at" bigint)',
      ),
    );
    await execute(
      sql`INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES (${checked.first.hash}, ${checked.first.folderMillis})`,
    );
    return { tables: checked.tables, applied: true, alreadyApplied: false };
  });
}
