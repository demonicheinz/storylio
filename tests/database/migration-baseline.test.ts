import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import baseline from "../../drizzle/baseline-schema.json";
import {
  differingSchemaSections,
  readDatabaseSchema,
} from "../../scripts/lib/database-schema";
import {
  adoptBaseline,
  checkBaseline,
  type MigrationConnection,
  migrationFiles,
  migrationStatus,
} from "../../scripts/lib/migration-baseline";
import * as schema from "../../src/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let connection: MigrationConnection;
beforeAll(async () => {
  fixture = await createTestDatabase({ authMfa: false, currentSchema: false });
  connection = {
    execute: (query) => fixture.db.execute<Record<string, unknown>>(query),
    transaction: (callback) =>
      fixture.db.transaction((tx) =>
        callback((query) => tx.execute<Record<string, unknown>>(query)),
      ),
  };
});
afterAll(async () => {
  await fixture.client.close();
});

describe("Drizzle migration baseline safety", () => {
  it("matches the legacy schema including arrays, indexes, enums and foreign keys", async () => {
    expect((await checkBaseline(connection.execute)).tables).toBe(20);
  });

  it("checks an existing database without creating a migration ledger", async () => {
    await fixture.client.exec(
      `INSERT INTO "User" ("id", "email", "updatedAt") VALUES ('legacy-owner', 'legacy-baseline@example.test', NOW())`,
    );
    const result = await adoptBaseline(connection);
    expect(result).toMatchObject({
      tables: 20,
      applied: false,
      alreadyApplied: false,
    });
    const ledger = await fixture.db.execute(
      sql.raw("SELECT to_regclass('drizzle.__drizzle_migrations') AS ledger"),
    );
    expect(ledger.rows[0].ledger).toBeNull();
  });

  it("adopts only migration metadata and is idempotent", async () => {
    expect(await adoptBaseline(connection, true)).toMatchObject({
      applied: true,
      alreadyApplied: false,
    });
    expect(await adoptBaseline(connection, true)).toMatchObject({
      applied: false,
      alreadyApplied: true,
    });
    expect(await migrationStatus(connection.execute)).toEqual({
      applied: 1,
      pending: migrationFiles().length - 1,
    });
    expect(
      await fixture.db.query.user.findMany({
        columns: { id: true, email: true },
      }),
    ).toMatchObject([
      { id: "legacy-owner", email: "legacy-baseline@example.test" },
    ]);
  });

  it("lets the native migrator skip the baseline without replaying CREATE TABLE", async () => {
    await migrate(fixture.db, { migrationsFolder: "./drizzle" });
    expect(await migrationStatus(connection.execute)).toEqual({
      applied: migrationFiles().length,
      pending: 0,
    });
    expect(await fixture.db.query.user.findMany()).toHaveLength(1);
  });

  it("refuses to adopt a database with schema drift", async () => {
    await fixture.client.exec(
      'ALTER TABLE "User" ADD COLUMN "unexpected" text',
    );
    await expect(adoptBaseline(connection, true)).rejects.toThrow(
      "does not match",
    );
    expect(await migrationStatus(connection.execute)).toEqual({
      applied: migrationFiles().length,
      pending: 0,
    });
  });

  it("rejects duplicate or non-prefix migration history", async () => {
    await fixture.db.execute(
      sql.raw(
        'INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) SELECT hash, created_at FROM "drizzle"."__drizzle_migrations" LIMIT 1',
      ),
    );
    try {
      await expect(migrationStatus(connection.execute)).rejects.toThrow(
        "history differs",
      );
    } finally {
      await fixture.db.execute(
        sql.raw(
          'DELETE FROM "drizzle"."__drizzle_migrations" WHERE id NOT IN (SELECT min(id) FROM "drizzle"."__drizzle_migrations" GROUP BY hash, created_at)',
        ),
      );
    }
  });

  it("bootstraps a completely empty database with the same native migrations", async () => {
    const empty = new PGlite();
    try {
      const db = drizzle(empty, { schema });
      await migrate(db, { migrationsFolder: "./drizzle" });
      const actual = await readDatabaseSchema((query) =>
        db.execute<Record<string, unknown>>(query),
      );
      const expected = {
        ...Object.fromEntries(
          Object.entries(baseline.schema).map(([section, rows]) => [
            section,
            rows.filter((row) =>
              section === "tables"
                ? row.name !== "Testimonial"
                : !("table_name" in row) || row.table_name !== "Testimonial",
            ),
          ]),
        ),
        enums: baseline.schema.enums.map((entry) =>
          entry.name === "HomeSectionType"
            ? { ...entry, values: [...entry.values, "HERO"] }
            : entry,
        ),
      };
      expect(
        actual.columns
          .filter((row) => row.table_name === "RateLimit")
          .map(({ name, type, not_null }) => ({ name, type, not_null })),
      ).toEqual([
        { name: "count", type: "integer", not_null: true },
        { name: "id", type: "text", not_null: true },
        { name: "key", type: "text", not_null: true },
        { name: "lastRequest", type: "bigint", not_null: true },
      ]);
      expect(
        actual.indexes
          .filter((row) => row.table_name === "RateLimit")
          .map((row) => row.name),
      ).toEqual([
        "RateLimit_key_key",
        "RateLimit_lastRequest_idx",
        "RateLimit_pkey",
      ]);
      const legacyShape = Object.fromEntries(
        Object.entries(actual).map(([section, rows]) => [
          section,
          rows.filter((row) =>
            section === "tables"
              ? !["RateLimit", "TwoFactor"].includes(String(row.name))
              : !["RateLimit", "TwoFactor"].includes(String(row.table_name)) &&
                !(
                  section === "columns" &&
                  row.table_name === "User" &&
                  row.name === "twoFactorEnabled"
                ),
          ),
        ]),
      );
      expect(differingSchemaSections(expected, legacyShape)).toEqual([]);
      expect(
        await migrationStatus((query) =>
          db.execute<Record<string, unknown>>(query),
        ),
      ).toEqual({ applied: migrationFiles().length, pending: 0 });
      const [owner] = await db
        .insert(schema.user)
        .values({ email: "fresh@example.test" })
        .returning();
      expect(owner.id).toBeTruthy();
      expect(owner.twoFactorEnabled).toBe(false);
      expect(
        actual.columns.filter((row) => row.table_name === "TwoFactor"),
      ).toHaveLength(7);
      expect(
        actual.indexes
          .filter((row) => row.table_name === "TwoFactor")
          .map((row) => row.name),
      ).toEqual([
        "TwoFactor_pkey",
        "TwoFactor_secret_idx",
        "TwoFactor_userId_key",
      ]);
    } finally {
      await empty.close();
    }
  });
});
