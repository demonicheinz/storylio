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
  fixture = await createTestDatabase();
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
    await fixture.db
      .insert(schema.user)
      .values({ id: "legacy-owner", email: "legacy-baseline@example.test" });
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
    expect(await fixture.db.query.user.findMany()).toMatchObject([
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
        ...baseline.schema,
        enums: baseline.schema.enums.map((entry) =>
          entry.name === "HomeSectionType"
            ? { ...entry, values: [...entry.values, "HERO"] }
            : entry,
        ),
      };
      expect(differingSchemaSections(expected, actual)).toEqual([]);
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
    } finally {
      await empty.close();
    }
  });
});
