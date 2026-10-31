import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  captureRequestError: vi.fn(),
  setTags: vi.fn(),
  withScope: vi.fn(),
}));
vi.mock("@sentry/nextjs", () => sdk);
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  sdk.withScope.mockImplementation((callback) =>
    callback({ setTags: sdk.setTags }),
  );
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
  it("records only bounded render diagnostics for resume failures", async () => {
    const { onRequestError } = await import("@/instrumentation");
    await onRequestError(
      new Error("Resume failed"),
      {
        path: "/?token=private",
        method: "POST",
        headers: { "next-resume": "1", cookie: "private" },
      },
      {
        routerKind: "App Router",
        routePath: "/",
        routeType: "render",
        renderSource: "server-rendering",
        revalidateReason: "stale",
      },
    );
    expect(sdk.setTags).toHaveBeenCalledWith({
      "next.route_type": "render",
      "next.render_source": "server-rendering",
      "next.revalidate_reason": "stale",
      "next.resume": "true",
    });
    expect(JSON.stringify(sdk.setTags.mock.calls)).not.toContain("private");
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
