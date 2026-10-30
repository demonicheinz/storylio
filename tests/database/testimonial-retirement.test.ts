import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { readDatabaseSchema } from "../../scripts/lib/database-schema";
import * as schema from "../../src/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

const preservedFiles = {
  "drizzle/0000_existing_schema.sql":
    "8affe92180c039c515f7770dcadab62026e7fd4a450b80b7bb7f4662d1dbc1e0",
  "drizzle/0001_home_hero.sql":
    "e721e0ac217752b7aca69f6efa83de332f1dda377cb828b8d669de9aba1af2e9",
  "drizzle/0002_auth_rate_limits.sql":
    "09691e9e7414f4e466f0b90bb00cfa76747e3213b8b393daec71b50e51ecf294",
  "drizzle/0003_auth_two_factor.sql":
    "fd72e7e89a76f50eb87c8909bdb1f27d09b274436c99392e3879773e5736a727",
  "drizzle/baseline-schema.json":
    "7549afd816a06539934799e2d202312890269b5a552d5f5f01f8ed5f03f3fd77",
  "db/legacy-prisma/migrations/20260606140843_init/migration.sql":
    "6788c61e66e6324ce73eba3506b9f284c7f7d41a1d2f545d26fe555e4ef8850e",
  "db/legacy-prisma/migrations/20260615113000_add_project_contribution/migration.sql":
    "e58581dc965fe293774edc02492b405fa9e2ddf3ca2ce97ff9e9616042ed1eb4",
  "db/legacy-prisma/migrations/20260620000000_add_gallery_item_size/migration.sql":
    "ef66c8be3242088655ea00c4e54e5fade690ea6b7d6ff59425a5bd8a5452e251",
};

describe("Testimonial retirement migration", () => {
  it("drops only Testimonial without cascading to unknown dependencies", async () => {
    const migration = await readFile(
      "drizzle/0004_retire_testimonials.sql",
      "utf8",
    );
    expect(migration.trim()).toBe('DROP TABLE "Testimonial";');
    expect(migration).not.toMatch(/\bCASCADE\b/i);
  });

  it("preserves historical migrations and the original baseline fingerprint", async () => {
    for (const [path, hash] of Object.entries(preservedFiles)) {
      const source = (await readFile(path, "utf8")).replace(/\r\n/g, "\n");
      expect(createHash("sha256").update(source).digest("hex"), path).toBe(
        hash,
      );
    }
  });

  it("drops only Testimonial, retains every other populated table and media, and can restore backed-up rows", async () => {
    const fixture = await createTestDatabase({
      currentSchema: false,
      authRateLimits: true,
    });
    try {
      await fixture.client.exec(
        await readFile("drizzle/0001_home_hero.sql", "utf8"),
      );
      const { db, client } = fixture;
      const avatar = "https://example.test/retired-avatar.png";
      await db.insert(schema.user).values({
        id: "owner",
        email: "owner@example.test",
        bio: "Bio",
        image: avatar,
      });
      await db.insert(schema.account).values({
        id: "account",
        accountId: "owner",
        userId: "owner",
        providerId: "credential",
        password: "fixture-hash",
      });
      await db.insert(schema.session).values({
        id: "session",
        userId: "owner",
        token: "fixture-token",
        expiresAt: new Date("2030-01-01"),
      });
      await db.insert(schema.passkey).values({
        id: "passkey",
        userId: "owner",
        publicKey: "fixture-key",
        credentialID: "fixture-id",
        counter: 7,
        deviceType: "singleDevice",
        backedUp: false,
      });
      await db.insert(schema.twoFactor).values({
        id: "mfa",
        userId: "owner",
        secret: "fixture-secret",
        backupCodes: "fixture-codes",
      });
      await db.insert(schema.verification).values({
        id: "verification",
        identifier: "fixture",
        value: "fixture",
        expiresAt: new Date("2030-01-01"),
      });
      await db
        .insert(schema.rateLimit)
        .values({ id: "limit", key: "fixture", count: 3, lastRequest: 42 });
      await db.insert(schema.post).values({
        id: "post",
        title: "Post",
        slug: "post",
        content: "Body",
        authorId: "owner",
        viewCount: 15,
      });
      await db.insert(schema.tag).values({ id: "tag", name: "notes" });
      await db
        .insert(schema.postToTag)
        .values({ postId: "post", tagId: "tag" });
      await db.insert(schema.project).values({
        id: "project",
        title: "Project",
        slug: "project",
        authorId: "owner",
        techStack: ["TypeScript"],
      });
      await db
        .insert(schema.projectScreenshot)
        .values({ id: "screenshot", projectId: "project", imageUrl: avatar });
      await db
        .insert(schema.viewEvent)
        .values({ id: "view", type: "post", slug: "post" });
      await db
        .insert(schema.galleryItem)
        .values({ id: "gallery", imageUrl: avatar });
      await db.insert(schema.media).values({
        id: "media",
        url: avatar,
        publicId: "retired-avatar",
        filename: "avatar.png",
        format: "png",
        size: 123,
      });
      await db.insert(schema.homeSection).values([
        { id: "home-hero", type: "HERO", label: "Headline" },
        { id: "phase", type: "PHASE", label: "Build" },
        { id: "logo", type: "LOGO", label: "Logo", imageUrl: avatar },
      ]);
      await db
        .insert(schema.aboutContent)
        .values({ id: "about", introEn: "About" });
      await db
        .insert(schema.workExperience)
        .values({ id: "work", title: "Developer" });
      await db
        .insert(schema.education)
        .values({ id: "education", institution: "School" });
      await db
        .insert(schema.skillCategory)
        .values({ id: "category", name: "Tools" });
      await db
        .insert(schema.skill)
        .values({ id: "skill", categoryId: "category", name: "TypeScript" });
      await client.exec(
        `INSERT INTO "Testimonial" ("id", "name", "content", "avatar") VALUES ('retired', 'Author', 'Quote', '${avatar}')`,
      );
      const backup = (
        await client.query(
          'SELECT *, "createdAt"::text AS "createdAt" FROM "Testimonial"',
        )
      ).rows;
      const execute = (query: Parameters<typeof db.execute>[0]) =>
        db.execute<Record<string, unknown>>(query);
      const catalog = await readDatabaseSchema(execute);
      const tables = catalog.tables
        .map(({ name }) => String(name))
        .filter((name) => name !== "Testimonial");
      async function readSurvivors() {
        const rows: Record<string, unknown[]> = {};
        for (const name of tables) {
          rows[name] = (
            await client.query(`SELECT * FROM "${name}" ORDER BY 1`)
          ).rows;
        }
        return rows;
      }
      const before = await readSurvivors();
      expect(tables).toHaveLength(21);
      expect(Object.values(before).every((rows) => rows.length > 0)).toBe(true);
      const migration = await readFile(
        "drizzle/0004_retire_testimonials.sql",
        "utf8",
      );
      await client.exec(
        'CREATE VIEW "RetirementDependency" AS SELECT "id" FROM "Testimonial"',
      );
      await expect(client.exec(migration)).rejects.toThrow();
      expect(
        (await client.query('SELECT * FROM "RetirementDependency"')).rows,
      ).toEqual([{ id: "retired" }]);
      expect(await readSurvivors()).toEqual(before);
      await client.exec('DROP VIEW "RetirementDependency"');
      await client.exec(migration);
      expect(
        (
          await db.execute(
            sql`SELECT to_regclass('public."Testimonial"') AS name`,
          )
        ).rows[0].name,
      ).toBeNull();
      expect(await readSurvivors()).toEqual(before);
      const expectedCatalog = Object.fromEntries(
        Object.entries(catalog).map(([key, rows]) => [
          key,
          rows.filter((row) =>
            key === "tables"
              ? row.name !== "Testimonial"
              : row.table_name !== "Testimonial",
          ),
        ]),
      );
      expect(await readDatabaseSchema(execute)).toEqual(expectedCatalog);

      // A drop has no data-only undo: reconstruct the old definition and restore a backup.
      const initial = await readFile(
        "drizzle/0000_existing_schema.sql",
        "utf8",
      );
      const ddl = initial.match(/CREATE TABLE "Testimonial" \([\s\S]*?\n\);/);
      if (!ddl) throw new Error("Missing immutable Testimonial definition");
      await client.exec(ddl[0]);
      const row = backup[0] as Record<string, unknown>;
      await client.query(
        'INSERT INTO "Testimonial" ("id", "name", "role", "company", "avatar", "content", "isVisible", "order", "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [
          row.id,
          row.name,
          row.role,
          row.company,
          row.avatar,
          row.content,
          row.isVisible,
          row.order,
          row.createdAt,
        ],
      );
      expect(
        (
          await client.query(
            'SELECT *, "createdAt"::text AS "createdAt" FROM "Testimonial"',
          )
        ).rows,
      ).toEqual(backup);
      expect(await readSurvivors()).toEqual(before);
    } finally {
      await fixture.client.close();
    }
  }, 30_000);
});
