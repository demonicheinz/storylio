import { eq } from "drizzle-orm";
import {
  afterAll,
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { Database } from "@/lib/db";
import { account, rateLimit, user } from "@/lib/db/schema";
import { repairOwnerCredential } from "../../scripts/auth/repair-owner-credential";
import { seedOwner } from "../../scripts/seeds/owner";
import { createTestDatabase } from "../helpers/database";

const origin = "http://localhost:3000";
const email = "owner@example.test";
const password = "local-fixture-password-only";
const mail = vi.fn();
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let auth: typeof import("../../src/lib/auth").auth;

beforeAll(async () => {
  fixture = await createTestDatabase({ authRateLimits: true });
  for (const [key, value] of Object.entries({
    NODE_ENV: "production",
    TEST: "false",
    VERCEL: "",
    VERCEL_URL: "",
    VERCEL_BRANCH_URL: "",
    BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: "local-auth-fixture-secret-never-for-production",
    OWNER_EMAIL: email,
    OWNER_PASSWORD: password,
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
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
});
beforeEach(async () => {
  mail.mockReset();
  await fixture.db.delete(user);
  await fixture.db.delete(rateLimit);
  await seedOwner(fixture.db as unknown as Database);
});
afterAll(async () => {
  vi.doUnmock("../../src/lib/db");
  vi.doUnmock("../../src/lib/email");
  vi.doUnmock("next/server");
  vi.unstubAllEnvs();
  await fixture?.client.close();
});
const post = (path: string, body: unknown) =>
  auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        "X-Forwarded-For": "192.0.2.11",
      },
      body: JSON.stringify(body),
    }),
  );
describe("production-mode local authentication", () => {
  it("signs in the real seeded owner with an HTTP-compatible cookie", async () => {
    const response = await post("/sign-in/email", { email, password });
    expect(response.status).toBe(200);
    const cookies = response.headers.get("set-cookie") ?? "";
    expect(cookies).toContain("session_token=");
    expect(cookies).not.toContain("__Secure-");
    expect(cookies).not.toMatch(/;\s*Secure(?:;|$)/i);
  });
  it("sends an HTTP reset link and redirects to the local reset form", async () => {
    const response = await post("/request-password-reset", {
      email,
      redirectTo: `${origin}/reset-password`,
    });
    expect(response.status).toBe(200);
    expect(mail).toHaveBeenCalledTimes(1);
    const message = mail.mock.calls[0][0] as { html: string };
    const url = message.html
      .match(
        /href="(https?:\/\/[^"\s]+\/api\/auth\/reset-password\/[^"\s]+)"/,
      )?.[1]
      ?.replaceAll("&amp;", "&");
    assert.exists(url);
    expect(url).toMatch(/^http:\/\/localhost:3000\//);
    const callback = await auth.handler(new Request(url));
    expect(callback.status).toBe(302);
    const location = callback.headers.get("location");
    assert.exists(location);
    const redirect = new URL(location);
    expect(redirect.origin).toBe(origin);
    expect(redirect.pathname).toBe("/reset-password");
    expect(redirect.searchParams.get("token")).toBeTruthy();
    const reset = await post("/reset-password", {
      token: redirect.searchParams.get("token"),
      newPassword: "new-fixture-password-only",
    });
    expect(reset.status).toBe(200);
    expect(
      (
        await post("/sign-in/email", {
          email,
          password: "new-fixture-password-only",
        })
      ).status,
    ).toBe(200);
  });
  it("restores legacy seeded email login by repairing only the credential identifier", async () => {
    const original = await fixture.db.query.account.findFirst();
    assert.exists(original);
    await fixture.db
      .update(account)
      .set({ accountId: "" })
      .where(eq(account.id, original.id));
    expect((await post("/sign-in/email", { email, password })).status).toBe(
      401,
    );
    expect(
      (
        await repairOwnerCredential(
          fixture.db as unknown as Database,
          [email],
          true,
        )
      ).updated,
    ).toBe(1);
    const repaired = await fixture.db.query.account.findFirst();
    expect(repaired?.password).toBe(original?.password);
    expect((await post("/sign-in/email", { email, password })).status).toBe(
      200,
    );
  });
});
