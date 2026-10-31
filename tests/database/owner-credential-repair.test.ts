import { eq } from "drizzle-orm";
import {
  afterAll,
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { Database } from "@/lib/db";
import { account, user } from "@/lib/db/schema";
import { repairOwnerCredential } from "../../scripts/auth/repair-owner-credential";
import { createTestDatabase } from "../helpers/database";

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let db: Database;
beforeAll(async () => {
  fixture = await createTestDatabase();
  db = fixture.db as unknown as Database;
});
beforeEach(async () => {
  await fixture.db.delete(user);
  await fixture.db.insert(user).values([
    { id: "owner", email: "owner@example.test" },
    { id: "other", email: "other@example.test" },
  ]);
  await fixture.db.insert(account).values([
    {
      id: "legacy",
      userId: "owner",
      accountId: "",
      providerId: "credential",
      password: "existing-hash",
    },
    {
      id: "github",
      userId: "owner",
      accountId: "github-id",
      providerId: "github",
    },
    {
      id: "other",
      userId: "other",
      accountId: "",
      providerId: "credential",
      password: "other-hash",
    },
  ]);
});
afterAll(async () => {
  await fixture?.client.close();
});
describe("legacy owner credential repair", () => {
  it("defaults to a read-only report", async () => {
    expect(await repairOwnerCredential(db, ["owner@example.test"])).toEqual({
      matchedOwners: 1,
      repairable: 1,
      updated: 0,
    });
    expect(
      (
        await fixture.db.query.account.findFirst({
          where: eq(account.id, "legacy"),
        })
      )?.accountId,
    ).toBe("");
  });
  it("changes only the owner's empty identifier, preserves hashes and providers, and is idempotent", async () => {
    const before = await fixture.db.query.account.findMany();
    expect(
      (await repairOwnerCredential(db, ["owner@example.test"], true)).updated,
    ).toBe(1);
    const after = await fixture.db.query.account.findMany();
    for (const row of before) {
      const current = after.find((a) => a.id === row.id);
      assert.exists(current);
      expect({
        ...current,
        accountId: row.accountId,
        updatedAt: row.updatedAt,
      }).toEqual(row);
      expect(current.accountId).toBe(
        row.id === "legacy" ? "owner" : row.accountId,
      );
    }
    expect(
      (await repairOwnerCredential(db, ["owner@example.test"], true)).updated,
    ).toBe(0);
  });
  it("refuses ambiguous credential rows without updating anything", async () => {
    await fixture.db.insert(account).values({
      id: "duplicate",
      userId: "owner",
      accountId: "owner",
      providerId: "credential",
      password: "another-hash",
    });
    await expect(
      repairOwnerCredential(db, ["owner@example.test"], true),
    ).rejects.toThrow("Ambiguous");
    expect(
      (
        await fixture.db.query.account.findFirst({
          where: eq(account.id, "legacy"),
        })
      )?.accountId,
    ).toBe("");
  });
});
