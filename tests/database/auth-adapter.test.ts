import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "../../src/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

const origin = "https://auth-migration.test";
const ownerId = "cllegacyowner0000000000001";
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let auth: typeof import("../../src/lib/auth").auth;
let passwordHash: string;

beforeAll(async () => {
  fixture = await createTestDatabase({ authRateLimits: true });
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TEST", "false");
  vi.stubEnv("BETTER_AUTH_URL", origin);
  vi.stubEnv(
    "BETTER_AUTH_SECRET",
    "auth-migration-fixture-secret-not-for-production",
  );
  vi.stubEnv("OWNER_EMAIL", "owner@example.test");
  vi.stubEnv("GITHUB_CLIENT_ID", "");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "");
  vi.stubEnv("RESEND_API_KEY", "");
  passwordHash = await hashPassword("fixture-owner-password");
  const created = new Date("2024-01-01T00:00:00Z");
  await fixture.db.insert(schema.user).values({
    id: ownerId,
    email: "owner@example.test",
    name: "Owner",
    createdAt: created,
    updatedAt: created,
  });
  await fixture.db.insert(schema.account).values({
    id: "cllegacyaccount00000000001",
    userId: ownerId,
    accountId: ownerId,
    providerId: "credential",
    password: passwordHash,
    createdAt: created,
    updatedAt: created,
  });
  await fixture.db.insert(schema.session).values({
    id: "cllegacysession00000000001",
    userId: ownerId,
    token: "legacy-session-fixture",
    expiresAt: new Date(Date.now() + 3_600_000),
    createdAt: created,
    updatedAt: created,
  });
  await fixture.db.insert(schema.passkey).values({
    id: "legacy-passkey",
    userId: ownerId,
    credentialID: "legacy-credential",
    publicKey: "legacy-public-key",
    counter: 7,
    deviceType: "multiDevice",
    backedUp: true,
    createdAt: created,
  });
  vi.doMock("../../src/lib/db", () => ({ db: fixture.db }));
  ({ auth } = await import("../../src/lib/auth"));
});
afterAll(async () => {
  vi.doUnmock("../../src/lib/db");
  vi.unstubAllEnvs();
  await fixture.client.close();
});

describe("Better Auth Drizzle adapter on legacy PostgreSQL tables", () => {
  it("reads an existing session without changing user/session IDs", async () => {
    const context = await auth.$context;
    const found = await context.internalAdapter.findSession(
      "legacy-session-fixture",
    );
    expect(found?.session.id).toBe("cllegacysession00000000001");
    expect(found?.user.id).toBe(ownerId);
    expect(found?.user.email).toBe("owner@example.test");
  });

  it("authenticates the existing password hash and produces a usable signed session", async () => {
    const response = await auth.handler(
      new Request(origin + "/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({
          email: "owner@example.test",
          password: "fixture-owner-password",
        }),
      }),
    );
    expect(response.status).toBe(200);
    const cookies = response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
    expect(cookies).toContain("session_token");
    const session = await auth.handler(
      new Request(origin + "/api/auth/get-session", {
        headers: { Cookie: cookies },
      }),
    );
    expect(session.status).toBe(200);
    expect((await session.json()).user.id).toBe(ownerId);
    const account = await fixture.db.query.account.findFirst({
      where: eq(schema.account.userId, ownerId),
    });
    expect(account?.password).toBe(passwordHash);
    expect(account?.id).toBe("cllegacyaccount00000000001");
  });

  it("keeps passkey material and counters readable through the adapter", async () => {
    const context = await auth.$context;
    const keys = await context.adapter.findMany<{
      id: string;
      credentialID: string;
      publicKey: string;
      counter: number;
    }>({
      model: "passkey",
      where: [{ field: "userId", value: ownerId }],
    });
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatchObject({
      id: "legacy-passkey",
      credentialID: "legacy-credential",
      publicKey: "legacy-public-key",
      counter: 7,
    });
  });

  it("unlinks only an owned local account ID and preserves password login", async () => {
    const now = new Date();
    await fixture.db.insert(schema.user).values({
      id: "other-owner-fixture",
      email: "other@example.test",
      name: "Other",
      createdAt: now,
      updatedAt: now,
    });
    await fixture.db.insert(schema.account).values([
      {
        id: "owned-social-row",
        userId: ownerId,
        accountId: "provider-subject",
        providerId: "github",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "foreign-social-row",
        userId: "other-owner-fixture",
        accountId: "other-subject",
        providerId: "github",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const login = await auth.handler(
      new Request(origin + "/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({
          email: "owner@example.test",
          password: "fixture-owner-password",
        }),
      }),
    );
    expect(login.status).toBe(200);
    const cookie = login.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const unlink = (accountId: string) =>
      auth.handler(
        new Request(origin + "/api/auth/unlink-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: origin,
            Cookie: cookie,
          },
          body: JSON.stringify({ accountId }),
        }),
      );
    expect((await unlink("foreign-social-row")).status).toBe(400);
    expect((await unlink("provider-subject")).status).toBe(400);
    expect((await unlink("owned-social-row")).status).toBe(200);
    expect(
      await fixture.db.query.account.findFirst({
        where: eq(schema.account.id, "owned-social-row"),
      }),
    ).toBeUndefined();
    expect(
      await fixture.db.query.account.findFirst({
        where: eq(schema.account.id, "foreign-social-row"),
      }),
    ).toBeDefined();
    expect(
      await fixture.db.query.account.findFirst({
        where: eq(schema.account.id, "cllegacyaccount00000000001"),
      }),
    ).toBeDefined();
    await fixture.db
      .delete(schema.user)
      .where(eq(schema.user.id, "other-owner-fixture"));
  });

  it("still blocks public registration and foreign origins", async () => {
    const blocked = await auth.handler(
      new Request(origin + "/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({
          name: "Uninvited",
          email: "intruder@example.test",
          password: "fixture-uninvited-password",
        }),
      }),
    );
    expect(blocked.status).toBe(400);
    const foreign = await auth.handler(
      new Request(origin + "/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://untrusted.example.test",
        },
        body: JSON.stringify({
          email: "owner@example.test",
          password: "fixture-owner-password",
        }),
      }),
    );
    expect(foreign.status).toBe(403);
    expect(await fixture.db.query.user.findMany()).toHaveLength(1);
  });
});
