import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { isoCBOR } from "@simplewebauthn/server/helpers";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import * as schema from "@/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

const origin = "https://mfa.test";
const password = "mfa-fixture-password";
const ownerId = "mfa-owner";
const jar = new Map<string, string>();
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let auth: typeof import("../../src/lib/auth").auth;
let hash: string;
let ip = 1;
const cookie = () =>
  [...jar].map(([key, value]) => `${key}=${value}`).join("; ");
const applyCookies = (response: Response) => {
  for (const item of response.headers.getSetCookie()) {
    const pair = item.split(";")[0];
    const index = pair.indexOf("=");
    const key = pair.slice(0, index),
      value = pair.slice(index + 1);
    if (value) jar.set(key, value);
    else jar.delete(key);
  }
  return response;
};
const post = async (path: string, body: unknown, fixedIp?: string) =>
  applyCookies(
    await auth.handler(
      new Request(origin + "/api/auth" + path, {
        method: "POST",
        headers: {
          Origin: origin,
          Cookie: cookie(),
          "Content-Type": "application/json",
          "X-Forwarded-For": fixedIp ?? `192.0.2.${ip++}`,
        },
        body: JSON.stringify(body),
      }),
    ),
  );
const login = () =>
  post("/sign-in/email", { email: "owner@example.test", password });
const session = async () =>
  (
    await auth.handler(
      new Request(origin + "/api/auth/get-session", {
        headers: { Cookie: cookie() },
      }),
    )
  ).json();
const setup = async () => {
  expect((await login()).status).toBe(200);
  const response = await post("/two-factor/enable", { password });
  expect(response.status).toBe(200);
  return (await response.json()) as { totpURI: string; backupCodes: string[] };
};
const code = (uri: string) =>
  createOTP(base32.decode(new URL(uri).searchParams.get("secret")!)).totp();
const enable = async () => {
  const data = await setup();
  expect(
    (await post("/two-factor/verify-totp", { code: await code(data.totpURI) }))
      .status,
  ).toBe(200);
  return data;
};

beforeAll(async () => {
  fixture = await createTestDatabase({ authRateLimits: true });
  for (const [key, value] of Object.entries({
    NODE_ENV: "production",
    TEST: "false",
    BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: "mfa-fixture-secret-never-for-production",
    OWNER_EMAIL: "owner@example.test",
    GITHUB_CLIENT_ID: "fixture-client",
    GITHUB_CLIENT_SECRET: "fixture-secret",
    OWNER_GITHUB_ID: "12345",
    RESEND_API_KEY: "",
  }))
    vi.stubEnv(key, value);
  vi.doMock("../../src/lib/db", () => ({ db: fixture.db }));
  ({ auth } = await import("../../src/lib/auth"));
  hash = await hashPassword(password);
});
beforeEach(async () => {
  jar.clear();
  ip = 1;
  await fixture.db.delete(schema.verification);
  await fixture.db.delete(schema.rateLimit);
  await fixture.db.delete(schema.user);
  await fixture.db.insert(schema.user).values({
    id: ownerId,
    email: "owner@example.test",
    name: "Owner",
    emailVerified: true,
  });
  await fixture.db.insert(schema.account).values({
    userId: ownerId,
    accountId: ownerId,
    providerId: "credential",
    password: hash,
  });
});
afterEach(() => vi.unstubAllGlobals());
afterAll(async () => {
  vi.doUnmock("../../src/lib/db");
  vi.unstubAllEnvs();
  await fixture.client.close();
});

describe("optional authenticator MFA", () => {
  it("requires confirmation, encrypts recovery material, and revokes older sessions on enable", async () => {
    const data = await setup();
    const user = await fixture.db.query.user.findFirst();
    expect(user?.twoFactorEnabled).toBe(false);
    const factor = await fixture.db.query.twoFactor.findFirst();
    expect(factor?.backupCodes).not.toContain(data.backupCodes[0]);
    expect(factor?.secret).not.toBe(
      new URL(data.totpURI).searchParams.get("secret"),
    );
    expect(factor?.verified).toBe(false);
    await fixture.db.insert(schema.session).values({
      userId: ownerId,
      token: "old-other-session",
      expiresAt: new Date(Date.now() + 3600_000),
    });
    expect(
      (
        await post("/two-factor/verify-totp", {
          code: await code(data.totpURI),
        })
      ).status,
    ).toBe(200);
    expect((await session()).user.twoFactorEnabled).toBe(true);
    expect(
      await fixture.db.query.session.findFirst({
        where: eq(schema.session.token, "old-other-session"),
      }),
    ).toBeUndefined();
  });
  it("withholds an authenticated session until TOTP succeeds and consumes the challenge", async () => {
    const data = await enable();
    jar.clear();
    expect(await (await login()).json()).toMatchObject({
      twoFactorRedirect: true,
    });
    expect(await session()).toBeNull();
    expect(
      (await post("/two-factor/verify-totp", { code: "invalid" })).status,
    ).toBe(401);
    expect(await session()).toBeNull();
    const pendingCookie = cookie();
    expect(
      (
        await post("/two-factor/verify-totp", {
          code: await code(data.totpURI),
        })
      ).status,
    ).toBe(200);
    expect((await session()).user.id).toBe(ownerId);
    const replay = await auth.handler(
      new Request(origin + "/api/auth/two-factor/verify-totp", {
        method: "POST",
        headers: {
          Origin: origin,
          Cookie: pendingCookie,
          "Content-Type": "application/json",
          "X-Forwarded-For": "192.0.2.210",
        },
        body: JSON.stringify({ code: await code(data.totpURI) }),
      }),
    );
    expect(replay.status).toBe(401);
  });
  it("consumes backup codes once and invalidates previous codes on regeneration", async () => {
    const data = await enable();
    jar.clear();
    await login();
    expect(
      (
        await post("/two-factor/verify-backup-code", {
          code: data.backupCodes[0],
        })
      ).status,
    ).toBe(200);
    jar.clear();
    await login();
    expect(
      (
        await post("/two-factor/verify-backup-code", {
          code: data.backupCodes[0],
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await post("/two-factor/verify-backup-code", {
          code: data.backupCodes[1],
        })
      ).status,
    ).toBe(200);
    const regenerated = await post("/two-factor/generate-backup-codes", {
      password,
    });
    expect(regenerated.status).toBe(200);
    const next = await regenerated.json();
    jar.clear();
    await login();
    expect(
      (
        await post("/two-factor/verify-backup-code", {
          code: data.backupCodes[2],
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await post("/two-factor/verify-backup-code", {
          code: next.backupCodes[0],
        })
      ).status,
    ).toBe(200);
  });
  it("expires incomplete challenges and throttles code guesses", async () => {
    await enable();
    jar.clear();
    await login();
    await fixture.db
      .update(schema.verification)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.verification.value, ownerId));
    expect(
      (await post("/two-factor/verify-totp", { code: "000000" })).status,
    ).toBe(401);
    jar.clear();
    await login();
    const statuses = [];
    for (let i = 0; i < 11; i++)
      statuses.push(
        (
          await post(
            "/two-factor/verify-totp",
            { code: "invalid" },
            "192.0.2.220",
          )
        ).status,
      );
    expect(statuses.at(-1)).toBe(429);
    expect(await session()).toBeNull();
  });
  it("requires the password to disable MFA", async () => {
    await enable();
    expect(
      (await post("/two-factor/disable", { password: "wrong" })).status,
    ).toBe(400);
    expect((await fixture.db.query.user.findFirst())?.twoFactorEnabled).toBe(
      true,
    );
    expect((await post("/two-factor/disable", { password })).status).toBe(200);
    expect((await fixture.db.query.user.findFirst())?.twoFactorEnabled).toBe(
      false,
    );
  });
  it("locks the account across replacement challenges and changing client addresses", async () => {
    const data = await enable();
    for (let attempt = 0; attempt < 10; attempt++) {
      if (attempt % 4 === 0) {
        jar.clear();
        await login();
      }
      expect(
        (await post("/two-factor/verify-totp", { code: "invalid" })).status,
      ).toBe(401);
    }
    jar.clear();
    await login();
    expect(
      (
        await post("/two-factor/verify-totp", {
          code: await code(data.totpURI),
        })
      ).status,
    ).toBe(429);
    expect(
      (
        await post("/two-factor/verify-backup-code", {
          code: data.backupCodes[0],
        })
      ).status,
    ).toBe(429);
    expect(await session()).toBeNull();
  });
  it.each([false, true])(
    "allows a verified passkey only when local MFA is disabled (MFA=%s)",
    async (mfa) => {
      if (mfa) await enable();
      jar.clear();
      await fixture.db.delete(schema.session);
      const credentialID = "Zml4dHVyZS1jcmVkZW50aWFs";
      const keys = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
      const jwk = keys.publicKey.export({ format: "jwk" });
      const cose = isoCBOR.encode(
        new Map<number, number | Uint8Array>([
          [1, 2],
          [3, -7],
          [-1, 1],
          [-2, Buffer.from(jwk.x!, "base64url")],
          [-3, Buffer.from(jwk.y!, "base64url")],
        ]),
      );
      await fixture.db.insert(schema.passkey).values({
        id: "fixture-passkey",
        userId: ownerId,
        credentialID,
        publicKey: Buffer.from(cose).toString("base64"),
        counter: 0,
        deviceType: "singleDevice",
        backedUp: false,
      });
      const options = applyCookies(
        await auth.handler(
          new Request(
            origin + "/api/auth/passkey/generate-authenticate-options",
            { headers: { Origin: origin } },
          ),
        ),
      );
      expect(options.status).toBe(200);
      const { challenge } = await options.json();
      const clientData = Buffer.from(
        JSON.stringify({ type: "webauthn.get", challenge, origin }),
      );
      const authenticatorData = Buffer.concat([
        createHash("sha256").update(new URL(origin).hostname).digest(),
        Buffer.from([1, 0, 0, 0, 1]),
      ]);
      const signature = sign(
        "sha256",
        Buffer.concat([
          authenticatorData,
          createHash("sha256").update(clientData).digest(),
        ]),
        keys.privateKey,
      );
      const response = await post("/passkey/verify-authentication", {
        response: {
          id: credentialID,
          rawId: credentialID,
          type: "public-key",
          response: {
            clientDataJSON: clientData.toString("base64url"),
            authenticatorData: authenticatorData.toString("base64url"),
            signature: signature.toString("base64url"),
          },
        },
      });
      expect(response.status).toBe(mfa ? 403 : 200);
      if (mfa) expect(await session()).toBeNull();
      else expect((await session()).user.id).toBe(ownerId);
    },
  );
  it.each([false, true])(
    "allows GitHub only when local MFA is disabled (MFA=%s)",
    async (mfa) => {
      if (mfa) await enable();
      jar.clear();
      await fixture.db.delete(schema.session);
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: string | URL | Request) => {
          const url = String(input instanceof Request ? input.url : input);
          if (url.includes("github.com/login/oauth/access_token"))
            return Response.json({
              access_token: "fixture-token",
              token_type: "bearer",
              scope: "user:email",
            });
          if (url.includes("api.github.com/user/emails"))
            return Response.json([
              { email: "owner@example.test", primary: true, verified: true },
            ]);
          if (url.startsWith("https://api.github.com/user"))
            return Response.json({
              id: 12345,
              login: "owner",
              name: "Owner",
              email: "owner@example.test",
              avatar_url: "https://example.test/avatar.png",
            });
          throw new Error("Unexpected OAuth fixture request");
        }),
      );
      const start = await post("/sign-in/social", {
        provider: "github",
        callbackURL: origin + "/dashboard",
        errorCallbackURL: origin + "/sign-in?error=oauth",
      });
      expect(start.status).toBe(200);
      const state = new URL((await start.json()).url).searchParams.get(
        "state",
      )!;
      const callback = applyCookies(
        await auth.handler(
          new Request(
            origin +
              "/api/auth/callback/github?" +
              new URLSearchParams({ code: "fixture-code", state }),
            { headers: { Cookie: cookie() } },
          ),
        ),
      );
      expect(callback.status).toBe(302);
      if (mfa) {
        expect(await session()).toBeNull();
        expect(await fixture.db.query.session.findMany()).toHaveLength(0);
      } else expect((await session()).user.id).toBe(ownerId);
    },
  );
});
