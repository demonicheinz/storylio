import * as Sentry from "@sentry/nextjs";
import { afterAll, describe, expect, it } from "vitest";
import { errorMonitoringOptions } from "@/lib/monitoring";

const envelopes: unknown[] = [];
afterAll(async () => {
  await Sentry.close(1000);
});

describe("Sentry local transport", () => {
  it("delivers a scrubbed error envelope and drops ordinary not-found flow", async () => {
    Sentry.init({
      ...errorMonitoringOptions(
        "https://fixturekey@ingest.sentry.test/1",
        "test",
      ),
      defaultIntegrations: [],
      enableOpenTelemetrySetup: false,
      transport: () => ({
        send: async (envelope: unknown) => {
          envelopes.push(envelope);
          return { statusCode: 200 };
        },
        flush: async () => true,
      }),
    });
    Sentry.captureException(
      new Error("Fixture error password=fixture-password owner@example.test"),
      {
        user: { email: "owner@example.test" },
        extra: { token: "fixture-token" },
        tags: { boundary: "public" },
      },
    );
    Sentry.captureException(new Error("NEXT_HTTP_ERROR_FALLBACK;404"));
    await Sentry.flush(1000);
    expect(envelopes).toHaveLength(1);
    const payload = JSON.stringify(envelopes);
    expect(payload).toContain("[redacted]");
    expect(payload).toContain('"boundary":"public"');
    expect(payload).not.toContain("fixture-password");
    expect(payload).not.toContain("fixture-token");
    expect(payload).not.toContain("owner@example.test");
    expect(payload).not.toContain("NEXT_HTTP_ERROR_FALLBACK");
  });
});
