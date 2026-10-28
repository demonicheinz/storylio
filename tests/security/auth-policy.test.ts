import { describe, expect, it } from "vitest";
import {
  getAuthAllowedHosts,
  getAuthProtocol,
  isAllowedGitHubAccount,
} from "@/lib/auth-policy";

describe("auth deployment hosts", () => {
  it.each([
    "localhost",
    "127.0.0.1",
    "[::1]",
  ])("uses HTTP for explicitly configured local %s even with next start", (host) => {
    expect(
      getAuthProtocol(`http://${host}:3000`, { NODE_ENV: "production" }),
    ).toBe("http");
  });
  it("keeps remote deployments and HTTPS localhost secure", () => {
    expect(
      getAuthProtocol("https://localhost:3000", { NODE_ENV: "production" }),
    ).toBe("https");
    expect(getAuthProtocol("http://heinz.id", { NODE_ENV: "production" })).toBe(
      "https",
    );
    expect(
      getAuthProtocol("http://localhost:3000", {
        NODE_ENV: "production",
        VERCEL: "1",
      }),
    ).toBe("https");
    expect(
      getAuthProtocol("http://localhost.evil.test:3000", {
        NODE_ENV: "production",
      }),
    ).toBe("https");
  });
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
