import { hashPassword } from "better-auth/crypto";
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
import * as schema from "@/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

const origin = "https://recovery.test";
const mail = vi.fn();
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let auth: typeof import("../../src/lib/auth").auth;
let hash: string;
const ownerId = "recovery-owner";
const request = (path: string, body: unknown, ip = "192.0.2.1") =>
  auth.handler(
    new Request(origin + "/api/auth" + path, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        "X-Forwarded-For": ip,
      },
      body: JSON.stringify(body),
    }),
  );
const resetRequest = (email = "owner@example.test", ip?: string) =>
  request(
    "/request-password-reset",
    { email, redirectTo: origin + "/reset-password" },
    ip,
  );
const token = () => {
  const match = /\/reset-password\/([^?"<]+)/.exec(
    mail.mock.calls.at(-1)?.[0].html ?? "",
  );
  if (!match) throw new Error("Expected reset email");
  return match[1];
};

beforeAll(async () => {
  fixture = await createTestDatabase({ authRateLimits: true });
  for (const [key, value] of Object.entries({
    NODE_ENV: "production",
    TEST: "false",
    BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: "recovery-fixture-secret-never-for-production",
    OWNER_EMAIL: "owner@example.test",
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
    RESEND_API_KEY: "",
  }))
    vi.stubEnv(key, value);
  vi.doMock("../../src/lib/db", () => ({ db: fixture.db }));
  vi.doMock("../../src/lib/email", () => ({ sendEmail: mail }));
  vi.doMock("next/server", () => ({
    after: (task: Promise<unknown> | (() => unknown)) => {
      if (typeof task === "function") void task();
      else void task;
    },
  }));
  ({ auth } = await import("../../src/lib/auth"));
  hash = await hashPassword("original-fixture-password");
});
beforeEach(async () => {
  mail.mockReset();
  await fixture.db.delete(schema.verification);
  await fixture.db.delete(schema.rateLimit);
  await fixture.db.delete(schema.user);
  await fixture.db
    .insert(schema.user)
    .values({ id: ownerId, name: "Owner", email: "owner@example.test" });
  await fixture.db.insert(schema.account).values({
    userId: ownerId,
    accountId: ownerId,
    providerId: "credential",
    password: hash,
  });
});
afterAll(async () => {
  vi.doUnmock("../../src/lib/db");
  vi.doUnmock("../../src/lib/email");
  vi.doUnmock("next/server");
  vi.unstubAllEnvs();
  await fixture.client.close();
});

describe("password recovery", () => {
  it("returns the same successful response for known and unknown addresses", async () => {
    const known = await resetRequest();
    const unknown = await resetRequest("unknown@example.test");
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(await known.json()).toEqual(await unknown.json());
    expect(mail).toHaveBeenCalledTimes(1);
  });
  it("uses a 30-minute token and rejects expiration without changing the password", async () => {
    const start = Date.now();
    await resetRequest();
    const value = token();
    const record = await fixture.db.query.verification.findFirst({
      where: eq(schema.verification.identifier, "reset-password:" + value),
    });
    expect(record!.expiresAt.getTime() - start).toBeGreaterThan(29 * 60_000);
    expect(record!.expiresAt.getTime() - start).toBeLessThanOrEqual(
      31 * 60_000,
    );
    await fixture.db
      .update(schema.verification)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.verification.id, record!.id));
    expect(
      (
        await request("/reset-password", {
          token: value,
          newPassword: "replacement-fixture-password",
        })
      ).status,
    ).toBe(400);
    expect((await fixture.db.query.account.findFirst())?.password).toBe(hash);
  });
  it("changes the password once, revokes every session, and rejects replay", async () => {
    await fixture.db.insert(schema.session).values(
      [1, 2].map((n) => ({
        userId: ownerId,
        token: "session-" + n,
        expiresAt: new Date(Date.now() + 3600_000),
      })),
    );
    await resetRequest();
    const value = token();
    const reset = await request("/reset-password", {
      token: value,
      newPassword: "replacement-fixture-password",
    });
    expect(reset.status).toBe(200);
    expect(reset.headers.getSetCookie().join(";")).not.toMatch(
      /session_token=[^;]/,
    );
    expect(await fixture.db.query.session.findMany()).toEqual([]);
    expect(
      (
        await request("/reset-password", {
          token: value,
          newPassword: "replayed-fixture-password",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request("/sign-in/email", {
          email: "owner@example.test",
          password: "original-fixture-password",
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await request("/sign-in/email", {
          email: "owner@example.test",
          password: "replacement-fixture-password",
        })
      ).status,
    ).toBe(200);
  });
  it("throttles recovery requests and rejects untrusted reset callbacks", async () => {
    for (let i = 0; i < 3; i++)
      expect(
        (await resetRequest("unknown@example.test", "192.0.2.9")).status,
      ).toBe(200);
    expect(
      (await resetRequest("unknown@example.test", "192.0.2.9")).status,
    ).toBe(429);
    expect(
      (
        await request(
          "/request-password-reset",
          {
            email: "owner@example.test",
            redirectTo: "https://evil.test/reset",
          },
          "192.0.2.10",
        )
      ).status,
    ).toBe(403);
  });
  it("allows only one winner when a token is submitted concurrently", async () => {
    await resetRequest();
    const value = token();
    const responses = await Promise.all(
      ["first", "second"].map((suffix, index) =>
        request(
          "/reset-password",
          { token: value, newPassword: suffix + "-replacement-password" },
          `192.0.2.${30 + index}`,
        ),
      ),
    );
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 400,
    ]);
  });
  it("preserves enabled MFA during password recovery", async () => {
    await fixture.db
      .update(schema.user)
      .set({ twoFactorEnabled: true })
      .where(eq(schema.user.id, ownerId));
    await resetRequest();
    expect(
      (
        await request("/reset-password", {
          token: token(),
          newPassword: "replacement-fixture-password",
        })
      ).status,
    ).toBe(200);
    expect((await fixture.db.query.user.findFirst())?.twoFactorEnabled).toBe(
      true,
    );
  });
  it("keeps the generic response when background email delivery fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mail.mockRejectedValueOnce(new Error("Fixture mail failure"));
      const known = await resetRequest();
      const unknown = await resetRequest("unknown@example.test");
      expect(known.status).toBe(200);
      expect(await known.json()).toEqual(await unknown.json());
      expect(mail).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });
});
