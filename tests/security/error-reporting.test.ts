import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReportError } from "@/hooks/use-report-error";

const sdk = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock("@sentry/nextjs", () => sdk);
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useEffect: (effect: () => void) => effect(),
}));
beforeEach(() => {
  sdk.captureException.mockClear();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SENTRY_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://fixture@ingest.sentry.test/1");
});
afterEach(() => vi.unstubAllEnvs());

describe("boundary reporting", () => {
  it("does not crash recovery when application code throws a primitive", async () => {
    expect(() => useReportError("Primitive fixture", "root")).not.toThrow();
    await vi.waitFor(() =>
      expect(sdk.captureException).toHaveBeenCalledWith("Primitive fixture", {
        tags: { boundary: "root" },
      }),
    );
  });
  it("reports the same Error object once and ignores expected control flow", async () => {
    const error = new Error("Fixture failure");
    useReportError(error, "public");
    useReportError(error, "public");
    useReportError({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" }, "root");
    await vi.waitFor(() =>
      expect(sdk.captureException).toHaveBeenCalledTimes(1),
    );
  });
  it("does not contact Sentry when reporting is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENABLED", "false");
    useReportError(new Error("Disabled fixture"), "root");
    expect(sdk.captureException).not.toHaveBeenCalled();
  });
});
