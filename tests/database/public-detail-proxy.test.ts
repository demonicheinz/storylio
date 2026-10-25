import { NextRequest } from "next/server";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import * as schema from "../../src/lib/db/schema";
import proxy from "../../src/proxy";
import { createTestDatabase } from "../helpers/database";

type Fixture = Awaited<ReturnType<typeof createTestDatabase>>;
const state = vi.hoisted(() => ({
  db: undefined as Fixture["db"] | undefined,
  session: vi.fn(),
  owner: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  get db() {
    if (!state.db) throw new Error("Test DB unavailable");
    return state.db;
  },
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: state.session } } }));
vi.mock("@/lib/owner-guard", () => ({ isOwnerEmail: state.owner }));
let fixture: Fixture;
beforeAll(async () => {
  fixture = await createTestDatabase();
  state.db = fixture.db;
  await fixture.db
    .insert(schema.user)
    .values({ id: "owner", email: "owner@example.test" });
  await fixture.db.insert(schema.post).values(
    (
      [
        {
          slug: "published",
          status: "PUBLISHED",
          publishedAt: new Date("2020-01-01"),
        },
        { slug: "undated", status: "PUBLISHED", publishedAt: null },
        { slug: "draft", status: "DRAFT", publishedAt: null },
        {
          slug: "future",
          status: "PUBLISHED",
          publishedAt: new Date("2099-01-01"),
        },
      ] as const
    ).map((row) => ({
      ...row,
      title: row.slug,
      content: "Body",
      authorId: "owner",
    })),
  );
  await fixture.db.insert(schema.project).values(
    [
      { slug: "published", status: "PUBLISHED" as const },
      { slug: "draft", status: "DRAFT" as const },
    ].map((row) => ({ ...row, title: row.slug, authorId: "owner" })),
  );
});
beforeEach(() => {
  vi.clearAllMocks();
  state.session.mockResolvedValue(null);
  state.owner.mockReturnValue(true);
});
afterAll(async () => {
  state.db = undefined;
  await fixture.client.close();
});
const request = (path: string, headers?: HeadersInit) =>
  new NextRequest(`https://storylio.test${path}`, { headers });

describe("public detail HTTP guard", () => {
  it.each([
    "/blog/missing",
    "/projects/missing",
    "/blog/draft",
    "/projects/draft",
    "/blog/future",
    "/blog/%E0%A4%A",
  ])("rewrites %s to the 404 UI before rendering", async (path) => {
    const response = await proxy(request(path));
    expect(response.status).toBe(404);
    expect(
      new URL(response.headers.get("x-middleware-rewrite")!).pathname,
    ).toBe("/not-found");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(state.session).not.toHaveBeenCalled();
  });
  it.each([
    "/blog/published",
    "/blog/undated",
    "/projects/published",
    "/blog/%70ublished",
  ])("allows %s without authentication", async (path) => {
    const response = await proxy(request(path));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(state.session).not.toHaveBeenCalled();
  });
  it("guards RSC and prefetch requests too", async () => {
    const response = await proxy(
      request("/blog/missing?_rsc=review", {
        rsc: "1",
        "next-router-prefetch": "1",
      }),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://storylio.test/not-found",
    );
  });
  it("does not query detail content for collection and unrelated routes", async () => {
    for (const path of [
      "/blog",
      "/projects",
      "/about",
      "/blog/a/b",
      "/preview/posts/draft",
    ]) {
      const response = await proxy(request(path));
      expect(response.headers.get("x-middleware-next")).toBe("1");
    }
    expect(state.session).not.toHaveBeenCalled();
  });
  it("preserves dashboard redirects and owner authorization", async () => {
    let response = await proxy(request("/dashboard/posts?sort=title"));
    expect(response.headers.get("location")).toBe(
      "https://storylio.test/sign-in?callbackUrl=%2Fdashboard%2Fposts%3Fsort%3Dtitle",
    );
    state.session.mockResolvedValue({ user: { email: "owner@example.test" } });
    state.owner.mockReturnValue(false);
    response = await proxy(request("/dashboard"));
    expect(response.headers.get("location")).toBe(
      "https://storylio.test/unauthorized",
    );
    state.owner.mockReturnValue(true);
    response = await proxy(request("/dashboard"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
  it("does not disguise database errors as missing content", async () => {
    const query = vi
      .spyOn(fixture.db.query.post, "findFirst")
      .mockRejectedValueOnce(new Error("DB unavailable"));
    try {
      await expect(proxy(request("/blog/published"))).rejects.toThrow(
        "DB unavailable",
      );
    } finally {
      query.mockRestore();
    }
  });
});
