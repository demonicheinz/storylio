import assert from "node:assert/strict";
import { afterAll, beforeAll, describe, it, vi } from "vitest";
import { isOwnerEmail } from "../../src/lib/owner-guard";
import { createTestDatabase } from "../helpers/database";

const origin = "https://storylio.test";
let auth: typeof import("../../src/lib/auth").auth;
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;

beforeAll(async () => {
  fixture = await createTestDatabase({ authRateLimits: true });
  vi.doMock("../../src/lib/db", () => ({ db: fixture.db }));
  // These checks must never use developer credentials or a real database.
  for (const [name, value] of Object.entries({
    // Better Auth skips origin checks in test mode; exercise production guards.
    NODE_ENV: "production",
    TEST: "false",
    DATABASE_URL: "postgresql://test:test@127.0.0.1:1/storylio_test",
    BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: "security-regression-test-secret-not-for-production",
    OWNER_EMAIL: "owner@example.test, second@example.test",
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
    RESEND_API_KEY: "",
  })) {
    vi.stubEnv(name, value);
  }
  ({ auth } = await import("../../src/lib/auth"));
});

afterAll(async () => {
  vi.doUnmock("../../src/lib/db");
  vi.unstubAllEnvs();
  await fixture.client.close();
});

describe("auth security boundaries", () => {
  it("returns no session when a request has no session cookie", async () => {
    const response = await auth.handler(
      new Request(`${origin}/api/auth/get-session`),
    );

    assert.equal(response.status, 200);
    assert.equal(await response.json(), null);
  });

  it("keeps public email/password registration disabled", async () => {
    const response = await auth.handler(
      new Request(`${origin}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({
          name: "Uninvited user",
          email: "outsider@example.test",
          password: "test-password-never-used-for-login",
        }),
      }),
    );

    assert.equal(response.status, 400);
    assert.equal(
      (await response.json()).code,
      "EMAIL_PASSWORD_SIGN_UP_DISABLED",
    );
  });

  it("rejects an untrusted origin before credential authentication", async () => {
    const response = await auth.handler(
      new Request(`${origin}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://untrusted.example.test",
        },
        body: JSON.stringify({
          email: "owner@example.test",
          password: "test-password-never-used-for-login",
        }),
      }),
    );

    assert.equal(response.status, 403);
  });

  it("accepts configured owners with normalized email casing", () => {
    assert.equal(isOwnerEmail(" OWNER@EXAMPLE.TEST "), true);
    assert.equal(isOwnerEmail("second@example.test"), true);
  });

  it("denies missing, unrelated, and lookalike owner emails", () => {
    for (const email of [
      null,
      undefined,
      "",
      "outsider@example.test",
      "owner@example.test.attacker.test",
    ]) {
      assert.equal(isOwnerEmail(email), false);
    }
  });
});
