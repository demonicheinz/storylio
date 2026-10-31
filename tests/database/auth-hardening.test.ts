import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { afterAll, assert, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

const deliverEmail = vi.fn();
const origin = "https://auth-hardening.test";
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let auth: typeof import("../../src/lib/auth").auth;
let ownerId: string;
let cookie: string;
const request = (
  path: string,
  body: unknown,
  ip: string,
  authenticated = false,
) =>
  auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        "X-Forwarded-For": ip,
        ...(authenticated ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    }),
  );

beforeAll(async () => {
  fixture = await createTestDatabase({ authRateLimits: true });
  for (const [name, value] of Object.entries({
    NODE_ENV: "production",
    TEST: "false",
    BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: "hardening-fixture-secret-not-for-production",
    OWNER_EMAIL: "owner@example.test,new@example.test",
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
    RESEND_API_KEY: "",
  }))
    vi.stubEnv(name, value);
  vi.doMock("../../src/lib/db", () => ({ db: fixture.db }));
  vi.doMock("../../src/lib/email", () => ({ sendEmail: deliverEmail }));
  vi.doMock("next/server", () => ({
    after: (task: Promise<unknown> | (() => unknown)) => {
      if (typeof task === "function") void task();
      else void task;
    },
  }));
  ({ auth } = await import("../../src/lib/auth"));
  const [owner] = await fixture.db
    .insert(schema.user)
    .values({ email: "owner@example.test", name: "Owner", emailVerified: true })
    .returning();
  ownerId = owner.id;
  await fixture.db.insert(schema.account).values({
    userId: ownerId,
    accountId: ownerId,
    providerId: "credential",
    password: await hashPassword("fixture-password"),
  });
  const login = await request(
    "/sign-in/email",
    { email: "owner@example.test", password: "fixture-password" },
    "192.0.2.1",
  );
  expect(login.status).toBe(200);
  cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
});
afterAll(async () => {
  vi.doUnmock("../../src/lib/db");
  vi.doUnmock("../../src/lib/email");
  vi.doUnmock("next/server");
  vi.unstubAllEnvs();
  await fixture.client.close();
});

describe("auth hardening with a local PostgreSQL fixture", () => {
  it("persists login limits and rejects the sixth attempt with Retry-After", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const response = await request(
        "/sign-in/email",
        { email: "owner@example.test", password: "incorrect-fixture-password" },
        "192.0.2.20",
      );
      statuses.push(response.status);
      if (i === 5)
        expect(Number(response.headers.get("x-retry-after"))).toBeGreaterThan(
          0,
        );
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
    const entries = await fixture.db.query.rateLimit.findMany();
    expect(entries.some((entry) => entry.count === 5)).toBe(true);
  });

  it("requires current-address approval before verifying an allowed new address", async () => {
    deliverEmail.mockClear();
    const response = await request(
      "/change-email",
      { newEmail: "new@example.test", callbackURL: "/dashboard/settings" },
      "192.0.2.2",
      true,
    );
    expect(response.status).toBe(200);
    expect(deliverEmail).toHaveBeenCalledTimes(1);
    const approval = deliverEmail.mock.calls[0][0];
    expect(approval.to).toBe("owner@example.test");
    expect(approval.subject).toMatch(/Approve/);
    const url = /href="([^"]+)"/
      .exec(approval.html)?.[1]
      ?.replaceAll("&amp;", "&");
    assert.isOk(url);
    await auth.handler(new Request(url));
    expect(deliverEmail).toHaveBeenCalledTimes(2);
    expect(deliverEmail.mock.calls[1][0].to).toBe("new@example.test");
    const user = await fixture.db.query.user.findFirst({
      where: eq(schema.user.id, ownerId),
    });
    expect(user?.email).toBe("owner@example.test");
    const verificationUrl = /href="([^"]+)"/
      .exec(deliverEmail.mock.calls[1][0].html)?.[1]
      ?.replaceAll("&amp;", "&");
    assert.isOk(verificationUrl);
    await auth.handler(new Request(verificationUrl));
    const changed = await fixture.db.query.user.findFirst({
      where: eq(schema.user.id, ownerId),
    });
    expect(changed?.email).toBe("new@example.test");
  });

  it("enforces the shared limit when login requests arrive concurrently", async () => {
    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        request(
          "/sign-in/email",
          { email: "new@example.test", password: "wrong-fixture-password" },
          "192.0.2.30",
        ),
      ),
    );
    expect(
      responses.filter((response) => response.status === 401),
    ).toHaveLength(5);
    expect(
      responses.filter((response) => response.status === 429),
    ).toHaveLength(3);
  });

  it("rejects a non-owner email through the direct auth endpoint", async () => {
    deliverEmail.mockClear();
    const response = await request(
      "/change-email",
      { newEmail: "outsider@example.test" },
      "192.0.2.3",
      true,
    );
    expect(response.status).toBe(403);
    expect(deliverEmail).not.toHaveBeenCalled();
  });
});
