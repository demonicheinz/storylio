import { describe, expect, it } from "vitest";
import { getAuthAllowedHosts, isAllowedGitHubAccount } from "@/lib/auth-policy";

describe("auth deployment hosts", () => {
  it("limits production to the canonical host and explicit Vercel deployment", () => {
    expect(
      getAuthAllowedHosts("https://heinz.id", {
        NODE_ENV: "production",
        VERCEL_URL: "storylio-abc-team.vercel.app",
      }),
    ).toEqual(["heinz.id", "storylio-abc-team.vercel.app"]);
  });
  it("accepts local development without trusting arbitrary preview hosts", () => {
    expect(
      getAuthAllowedHosts("http://localhost:3000", {
        NODE_ENV: "development",
        VERCEL_URL: "evil.test/path",
      }),
    ).toEqual(["localhost:3000", "localhost:*"]);
  });
  it("requires a pinned GitHub identity for account creation", () => {
    expect(isAllowedGitHubAccount("123")).toBe(false);
    expect(isAllowedGitHubAccount("123", "456")).toBe(false);
    expect(isAllowedGitHubAccount("123", "123")).toBe(true);
  });
});
