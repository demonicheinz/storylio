import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({ init: vi.fn(), captureRequestError: vi.fn() }));
vi.mock("@sentry/nextjs", () => sdk);
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SENTRY_ENABLED", "true");
  vi.stubEnv(
    "NEXT_PUBLIC_SENTRY_DSN",
    "https://fixturekey@ingest.sentry.test/123",
  );
  vi.stubEnv("SENTRY_DSN", "");
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
});
afterEach(() => vi.unstubAllEnvs());

describe("server error instrumentation", () => {
  it("does nothing until explicitly enabled with a valid DSN", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENABLED", "false");
    const { register, onRequestError } = await import("@/instrumentation");
    await register();
    await onRequestError(
      new Error("Fixture"),
      { path: "/", method: "GET", headers: {} },
      {
        routerKind: "App Router",
        routePath: "/",
        routeType: "render",
        revalidateReason: undefined,
      },
    );
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.captureRequestError).not.toHaveBeenCalled();
  });
  it("initializes the Node SDK with the shared privacy policy and no tracing", async () => {
    const { register } = await import("@/instrumentation");
    await register();
    expect(sdk.init).toHaveBeenCalledOnce();
    const options = sdk.init.mock.calls[0][0];
    expect(options.sendDefaultPii).toBe(false);
    expect(options.enableLogs).toBe(false);
    expect(options.enableOpenTelemetrySetup).toBe(false);
    expect(options.beforeSend).toBeTypeOf("function");
    expect(options.tracesSampleRate).toBeUndefined();
  });
  it("ignores navigation control flow and forwards unexpected request errors", async () => {
    const { onRequestError } = await import("@/instrumentation");
    const request = { path: "/projects/missing", method: "GET", headers: {} };
    const context = {
      routerKind: "App Router",
      routePath: "/projects/[slug]",
      routeType: "render",
      revalidateReason: undefined,
    } as const;
    await onRequestError(
      { digest: "NEXT_HTTP_ERROR_FALLBACK;404" },
      request,
      context,
    );
    await onRequestError(
      { digest: "NEXT_REDIRECT;replace;/;307;" },
      request,
      context,
    );
    expect(sdk.captureRequestError).not.toHaveBeenCalled();
    const error = new Error("Unexpected database failure");
    await onRequestError(error, request, context);
    expect(sdk.captureRequestError).toHaveBeenCalledWith(
      error,
      request,
      context,
    );
  });
});
