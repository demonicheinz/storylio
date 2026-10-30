import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { seedOwner } from "../../scripts/seeds/owner";
import { runSeedPlan } from "../../scripts/seeds/run";
import { actionUpdateHomeHero } from "../../src/features/dashboard/home/actions";
import type { Database } from "../../src/lib/db";
import * as schema from "../../src/lib/db/schema";
import {
  DEFAULT_HOME_HERO,
  HOME_HERO_ID,
  resolveHomeHero,
} from "../../src/lib/home-hero";
import { createTestDatabase } from "../helpers/database";

type Fixture = Awaited<ReturnType<typeof createTestDatabase>>;
const effects = vi.hoisted(() => ({
  db: undefined as Fixture["db"] | undefined,
  getActionSession: vi.fn(),
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  get db() {
    if (!effects.db) throw new Error("No fixture");
    return effects.db;
  },
}));
vi.mock("@/lib/auth-session", () => ({
  getActionSession: effects.getActionSession,
}));
vi.mock("next/cache", () => ({
  updateTag: effects.updateTag,
  revalidatePath: effects.revalidatePath,
}));
let fixture: Fixture;
beforeAll(async () => {
  fixture = await createTestDatabase({ currentSchema: false });
  effects.db = fixture.db;
  // The unchanged legacy schema remains readable before the additive migration.
  expect(
    await fixture.db.query.homeSection.findFirst({
      where: eq(schema.homeSection.id, HOME_HERO_ID),
    }),
  ).toBeUndefined();
  await fixture.client.exec(
    await readFile(
      new URL("../../drizzle/0001_home_hero.sql", import.meta.url),
      "utf8",
    ),
  );
});
beforeEach(async () => {
  await fixture.client.exec('TRUNCATE "User", "HomeSection" CASCADE');
  vi.clearAllMocks();
  effects.getActionSession.mockResolvedValue({ user: { id: "owner" } });
  await fixture.db.insert(schema.user).values({
    id: "owner",
    email: "owner@example.test",
    name: "Existing name",
    bio: "Existing bio",
  });
});
afterAll(async () => {
  await fixture?.client.close();
  vi.unstubAllEnvs();
});

describe("Home hero content", () => {
  it("uses the existing bio as subheadline and keeps explicit fallback values", () => {
    expect(resolveHomeHero(null, " Existing bio ")).toEqual({
      ...DEFAULT_HOME_HERO,
      subheadline: "Existing bio",
    });
    expect(resolveHomeHero(" Custom title ", "")).toEqual({
      ...DEFAULT_HOME_HERO,
      headline: "Custom title",
    });
  });
  it("saves a singleton headline and the same bio column atomically", async () => {
    expect(
      await actionUpdateHomeHero({
        headline: "First title",
        subheadline: "First intro",
      }),
    ).toMatchObject({ success: true });
    expect(
      await actionUpdateHomeHero({
        headline: "Updated title",
        subheadline: "Updated intro",
      }),
    ).toMatchObject({ success: true });
    expect(await fixture.db.query.homeSection.findMany()).toMatchObject([
      { id: HOME_HERO_ID, type: "HERO", label: "Updated title" },
    ]);
    expect(await fixture.db.query.user.findFirst()).toMatchObject({
      name: "Existing name",
      bio: "Updated intro",
    });
    expect(effects.updateTag).toHaveBeenCalledWith("public-profile");
    expect(effects.updateTag).toHaveBeenCalledWith("public-home");
  });
  it("restores defaults when fields are cleared", async () => {
    await actionUpdateHomeHero({ headline: "Title", subheadline: "Intro" });
    await actionUpdateHomeHero({ headline: "", subheadline: "" });
    expect(await fixture.db.query.homeSection.findMany()).toEqual([]);
    expect((await fixture.db.query.user.findFirst())?.bio).toBeNull();
  });
  it("blocks anonymous and oversized writes", async () => {
    effects.getActionSession.mockRejectedValueOnce(new Error("Unauthorized"));
    expect(
      await actionUpdateHomeHero({
        headline: "Changed",
        subheadline: "Changed",
      }),
    ).toMatchObject({ success: false });
    expect(
      await actionUpdateHomeHero({
        headline: "x".repeat(161),
        subheadline: "Intro",
      }),
    ).toMatchObject({ success: false });
    expect((await fixture.db.query.user.findFirst())?.bio).toBe("Existing bio");
    expect(await fixture.db.query.homeSection.findMany()).toEqual([]);
  });
  it("rolls back bio if the headline write fails", async () => {
    await fixture.client.exec(
      `ALTER TABLE "HomeSection" ADD CONSTRAINT test_title CHECK ("label" <> 'Reject')`,
    );
    try {
      expect(
        await actionUpdateHomeHero({
          headline: "Reject",
          subheadline: "Must roll back",
        }),
      ).toMatchObject({ success: false });
      expect((await fixture.db.query.user.findFirst())?.bio).toBe(
        "Existing bio",
      );
      expect(effects.updateTag).not.toHaveBeenCalled();
    } finally {
      await fixture.client.exec(
        'ALTER TABLE "HomeSection" DROP CONSTRAINT test_title',
      );
    }
  });
  it("updates only selected seed profile fields without changing credentials", async () => {
    vi.stubEnv("OWNER_EMAIL", "owner@example.test");
    await fixture.db.insert(schema.account).values({
      userId: "owner",
      providerId: "credential",
      accountId: "owner",
      password: "unchanged-fixture-hash",
    });
    const existing = await fixture.db.query.account.findMany();
    const db = fixture.db as unknown as Database;
    await seedOwner(db, { profile: { name: "Ignored", headline: "Ignored" } });
    expect((await fixture.db.query.user.findFirst())?.name).toBe(
      "Existing name",
    );
    expect(await fixture.db.query.homeSection.findMany()).toEqual([]);
    await seedOwner(db, {
      profile: { headline: "My headline", subheadline: "My intro" },
      updateProfile: true,
    });
    expect(await fixture.db.query.account.findMany()).toEqual(existing);
    expect(await fixture.db.query.user.findFirst()).toMatchObject({
      name: "Existing name",
      bio: "My intro",
    });
    expect((await fixture.db.query.homeSection.findFirst())?.label).toBe(
      "My headline",
    );
  });
  it("runs only selected seed groups without resetting an existing owner", async () => {
    const db = fixture.db as unknown as Database;
    await runSeedPlan(db, { parts: ["home"], updateProfile: false });
    expect(await fixture.db.query.homeSection.findMany()).toHaveLength(8);
    expect(await fixture.db.query.post.findMany()).toEqual([]);
    expect(await fixture.db.query.project.findMany()).toEqual([]);
    expect((await fixture.db.query.user.findFirst())?.bio).toBe("Existing bio");
  });
});
