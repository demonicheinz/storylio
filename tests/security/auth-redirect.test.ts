import { describe, expect, it } from "vitest";
import { getSignInError } from "@/lib/auth-errors";
import { getAuthRedirect } from "@/lib/auth-redirect";

describe("private dashboard return URLs", () => {
  it.each([
    "/dashboard",
    "/dashboard/settings?tab=security#passkeys",
    "/dashboard/posts/abc-123/edit",
    "/dashboard/projects/?page=2&keep=yes",
  ])("retains an internal return URL: %s", (path) =>
    expect(getAuthRedirect(path)).toBe(path));
  it.each([
    undefined,
    "",
    "javascript:alert(1)",
    "https://evil.test/dashboard",
    "//evil.test/dashboard",
    "/\\evil.test/dashboard",
    "/dashboard-evil",
    "/sign-in",
    "/dashboard/../../sign-in",
    "/dashboard/%2e%2e/sign-in",
    "/dashboard/%252e%252e/sign-in",
    "/dashboard/%2f%2fevil.test",
    "/dashboard/\nsettings",
  ])("rejects an unsafe or unrelated destination: %s", (path) =>
    expect(getAuthRedirect(path)).toBe("/dashboard"));
  it("normalizes repeated callback parameters to the first value", () => {
    expect(getAuthRedirect(["/dashboard/settings", "//evil.test"])).toBe(
      "/dashboard/settings",
    );
  });
});

describe("sign-in error messages", () => {
  it("distinguishes credential failures, throttling and provider failures", () => {
    expect(getSignInError({ status: 401 }, "password")).toMatch(/incorrect/);
    expect(getSignInError({ status: 429 }, "password")).toMatch(
      /Too many attempts/,
    );
    expect(getSignInError({ status: 500 }, "password")).not.toMatch(
      /incorrect/,
    );
    expect(getSignInError({ code: "AUTH_CANCELLED" }, "passkey")).toMatch(
      /cancelled/,
    );
    expect(getSignInError({ status: 400 }, "github")).toMatch(/GitHub/);
  });
});
