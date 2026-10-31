import { afterEach, assert, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Sentry deployment configuration", () => {
  it("keeps monitoring and uploads inactive by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENABLED", "false");
    vi.stubEnv("SENTRY_UPLOAD_SOURCEMAPS", "false");
    const { default: config } = await import("../../next.config");
    expect(config.cacheComponents).toBe(true);
    expect(config.partialPrefetching).toBe(true);
    assert.exists(config.headers);
    const headers = await config.headers();
    const csp = headers[0].headers.find(
      (header) => header.key === "Content-Security-Policy",
    )?.value;
    expect(csp).not.toContain("sentry");
  });
  it("allows only the configured ingest origin and retains the Next feature flags", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENABLED", "true");
    vi.stubEnv(
      "NEXT_PUBLIC_SENTRY_DSN",
      "https://fixturekey@o123.ingest.us.sentry.io/1",
    );
    vi.stubEnv("SENTRY_UPLOAD_SOURCEMAPS", "false");
    const { default: config } = await import("../../next.config");
    expect(config.cacheComponents).toBe(true);
    expect(config.partialPrefetching).toBe(true);
    assert.exists(config.headers);
    const headers = await config.headers();
    const csp = headers[0].headers.find(
      (header) => header.key === "Content-Security-Policy",
    )?.value;
    expect(csp).toContain("https://o123.ingest.us.sentry.io");
    expect(csp).not.toContain("*.sentry.io");
    expect(csp).not.toContain("fixturekey");
  });
});
