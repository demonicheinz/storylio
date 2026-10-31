import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import {
  discardBreadcrumb,
  errorMonitoringOptions,
  errorOnlyIntegrations,
  getSentryDsn,
  getSentryIngestOrigin,
  isExpectedNavigationError,
  scrubErrorEvent,
} from "@/lib/monitoring";

describe("Sentry error-only privacy policy", () => {
  it.each([
    '{"password":"x"}',
    '{"token":"fixture-secret"}',
    '{"secret" : "fixture-secret"}',
    "{'cookie':'fixture-secret'}",
    '{"session_id":"fixture-secret"}',
    '{"SESSION-ID" : "fixture-secret"}',
  ])("redacts quoted credential keys in message fields: %s", (message) => {
    const clean = scrubErrorEvent({
      type: undefined,
      message,
      logentry: { message },
      exception: { values: [{ value: message }] },
    });
    for (const text of [
      clean?.message,
      clean?.logentry?.message,
      clean?.exception?.values?.[0].value,
    ]) {
      expect(text).toContain("[redacted]");
      expect(text).not.toContain('"x"');
      expect(text).not.toContain("fixture-secret");
    }
  });
  it("keeps error handlers but excludes automatic session and console telemetry", () => {
    const integrations = [
      "GlobalHandlers",
      "Dedupe",
      "BrowserSession",
      "ProcessSession",
      "ConversationId",
      "Console",
      "Breadcrumbs",
      "BrowserTracing",
      "Replay",
    ].map((name) => ({ name }));
    expect(
      errorOnlyIntegrations(integrations).map(
        (integration) => integration.name,
      ),
    ).toEqual(["GlobalHandlers", "Dedupe"]);
  });
  it("validates the public DSN and exposes only its exact origin for CSP", () => {
    const dsn = "https://publickey@o123.ingest.us.sentry.io/456";
    expect(getSentryDsn(dsn)).toBe(dsn);
    expect(getSentryIngestOrigin(dsn)).toBe("https://o123.ingest.us.sentry.io");
    for (const invalid of [
      undefined,
      "",
      "javascript:alert(1)",
      "http://key@localhost/1",
      "https://host/1",
      "https://key:secret@host/1",
      "https://key@host/1?secret=x",
    ]) {
      expect(getSentryDsn(invalid)).toBeUndefined();
      expect(getSentryIngestOrigin(invalid)).toBeUndefined();
    }
  });
  it("drops expected 404 and redirect control flow without hiding 500s", () => {
    expect(
      isExpectedNavigationError({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" }),
    ).toBe(true);
    expect(
      isExpectedNavigationError({
        digest: "NEXT_REDIRECT;replace;/sign-in;307;",
      }),
    ).toBe(true);
    expect(isExpectedNavigationError(new Error("Database failed"))).toBe(false);
    expect(
      isExpectedNavigationError({ digest: "NEXT_HTTP_ERROR_FALLBACK;500" }),
    ).toBe(false);
    expect(
      scrubErrorEvent({
        type: undefined,
        exception: { values: [{ value: "NEXT_HTTP_ERROR_FALLBACK;404" }] },
      }),
    ).toBeNull();
  });
  it("retains only allowlisted render diagnostic values", () => {
    const event: ErrorEvent = {
      type: undefined,
      tags: {
        "next.route_type": "render",
        "next.render_source": "server-rendering",
        "next.revalidate_reason": "stale",
        "next.resume": "true",
        secret: "private",
      },
    };
    expect(scrubErrorEvent(event)?.tags).toEqual({
      "next.route_type": "render",
      "next.render_source": "server-rendering",
      "next.revalidate_reason": "stale",
      "next.resume": "true",
    });
    expect(
      scrubErrorEvent({
        type: undefined,
        tags: {
          "next.route_type": "password=private",
          "next.resume": "private",
        },
      })?.tags,
    ).toEqual({});
  });
  it("strips request payloads, identity, context dumps and breadcrumbs", () => {
    const event: ErrorEvent = {
      type: undefined,
      user: {
        email: "owner@example.test",
        ip_address: "192.0.2.1",
        id: "owner-id",
      },
      extra: { password: "fixture-secret" },
      contexts: { custom: { token: "fixture-token" } },
      breadcrumbs: [
        { message: "Password typed", data: { password: "fixture-secret" } },
      ],
      request: {
        url: "https://storylio.test/sign-in?token=fixture-token#secret",
        method: "POST",
        headers: {
          cookie: "fixture-cookie",
          authorization: "Bearer fixture-bearer",
        },
        cookies: { session: "fixture-session" },
        data: { password: "fixture-secret" },
        query_string: "token=fixture-token",
      },
      tags: { boundary: "public", secret: "fixture-secret" },
      message:
        "owner@example.test password=fixture-secret Bearer fixture-bearer https://storylio.test/path?token=fixture-token",
      exception: {
        values: [
          {
            type: "Error",
            value: "secret=fixture-secret owner@example.test",
            stacktrace: {
              frames: [
                {
                  filename: "https://storylio.test/app.js?token=fixture-token",
                  lineno: 42,
                  vars: { password: "fixture-secret" },
                },
              ],
            },
          },
        ],
      },
    };
    const clean = scrubErrorEvent(event);
    expect(clean?.request).toEqual({
      url: "https://storylio.test/sign-in",
      method: "POST",
    });
    expect(clean?.tags).toEqual({ boundary: "public" });
    expect(clean?.exception?.values?.[0].stacktrace?.frames?.[0]).toEqual({
      filename: "https://storylio.test/app.js",
      lineno: 42,
    });
    const json = JSON.stringify(clean);
    for (const secret of [
      "owner@example.test",
      "192.0.2.1",
      "fixture-secret",
      "fixture-token",
      "fixture-bearer",
      "fixture-cookie",
      "fixture-session",
    ])
      expect(json).not.toContain(secret);
    expect(json).toContain("[redacted]");
  });
  it("does not enable Replay, tracing, logs, breadcrumbs or default PII", () => {
    const options = errorMonitoringOptions(
      "https://key@sentry.test/1",
      "fixture",
    );
    expect(options.sendDefaultPii).toBe(false);
    expect(options.enableLogs).toBe(false);
    expect(options.maxBreadcrumbs).toBe(0);
    expect(options).not.toHaveProperty("tracesSampleRate");
    expect(options).not.toHaveProperty("replaysSessionSampleRate");
    expect(discardBreadcrumb({ message: "Sensitive input" })).toBeNull();
  });
  it("preserves source-map identifiers while removing source URL queries", () => {
    const clean = scrubErrorEvent({
      type: undefined,
      exception: {
        values: [
          {
            value: "Fixture",
            stacktrace: {
              frames: [
                {
                  filename: "app:///src/page.tsx?token=fixture",
                  abs_path: "webpack-internal:///src/page.tsx#secret",
                },
              ],
            },
          },
        ],
      },
    });
    expect(clean?.exception?.values?.[0].stacktrace?.frames?.[0]).toEqual({
      filename: "app:///src/page.tsx",
      abs_path: "webpack-internal:///src/page.tsx",
    });
  });
});
