import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import SignInPage from "@/app/sign-in/page";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`redirect:${path}`);
  }),
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/auth/sign-in-form", () => ({ SignInForm: () => null }));
vi.mock("@/lib/github-config", () => ({ isGitHubEnabled: false }));
afterAll(() => vi.unstubAllEnvs());
beforeEach(() => {
  vi.stubEnv("OWNER_EMAIL", "owner@example.test");
  vi.clearAllMocks();
});

describe("sign-in server redirects", () => {
  it("preserves a safe return destination for an authenticated owner", async () => {
    mocks.session.mockResolvedValue({ user: { email: "owner@example.test" } });
    const page = SignInPage({
      searchParams: Promise.resolve({
        callbackUrl: "/dashboard/settings?tab=security",
      }),
    });
    const content = page.props.children[1].props.children;
    await expect(content.type(content.props)).rejects.toThrow(
      "redirect:/dashboard/settings?tab=security",
    );
  });
  it("denies an authenticated non-owner without entering the dashboard", async () => {
    mocks.session.mockResolvedValue({
      user: { email: "outsider@example.test" },
    });
    const page = SignInPage({
      searchParams: Promise.resolve({ callbackUrl: "/dashboard" }),
    });
    const content = page.props.children[1].props.children;
    await expect(content.type(content.props)).rejects.toThrow(
      "redirect:/unauthorized",
    );
  });
  it("uses the same safe fallback for a malicious authenticated callback", async () => {
    mocks.session.mockResolvedValue({ user: { email: "owner@example.test" } });
    const page = SignInPage({
      searchParams: Promise.resolve({ callbackUrl: "//evil.test" }),
    });
    const content = page.props.children[1].props.children;
    await expect(content.type(content.props)).rejects.toThrow(
      "redirect:/dashboard",
    );
  });
});
