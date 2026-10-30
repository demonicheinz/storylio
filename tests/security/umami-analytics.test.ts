import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { actionRefreshUmamiAnalytics } from "@/features/dashboard/analytics/actions";
import { getUmamiAnalytics } from "@/lib/umami";

const session = vi.hoisted(() => ({ getActionSession: vi.fn() }));
vi.mock("@/lib/auth-session", () => session);

const fetchMock = vi.fn<typeof fetch>();
const endAt = Date.parse("2026-10-29T12:00:00Z");
const rangeDuration = 30 * 24 * 60 * 60 * 1000;
const range = { startAt: endAt - rangeDuration, endAt };

function mockProvider({
  current = {
    pageviews: 100,
    visitors: 20,
    visits: 25,
    bounces: 5,
    totaltime: 1500,
  },
  previous = {
    pageviews: 50,
    visitors: 10,
    visits: 10,
    bounces: 4,
    totaltime: 300,
  },
  metrics = [] as unknown,
  failedType = "",
  failPrevious = false,
}: {
  current?: unknown;
  previous?: unknown;
  metrics?: unknown;
  failedType?: string;
  failPrevious?: boolean;
} = {}) {
  fetchMock.mockImplementation(async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/auth/login")) {
      return Response.json({ token: "fixture-token" });
    }
    if (url.pathname.endsWith("/stats")) {
      const isPrevious =
        Number(url.searchParams.get("endAt")) === range.startAt;
      if (isPrevious && failPrevious)
        return new Response(null, { status: 503 });
      return Response.json(isPrevious ? previous : current);
    }
    if (url.searchParams.get("type") === failedType) {
      throw new DOMException("Fixture request timeout", "TimeoutError");
    }
    return Response.json(metrics);
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(endAt);
  vi.stubEnv("UMAMI_API_URL", "https://analytics.example.test/api/");
  vi.stubEnv("UMAMI_USERNAME", "fixture-user");
  vi.stubEnv("UMAMI_PASSWORD", "fixture-password");
  vi.stubEnv("UMAMI_WEBSITE_ID", "fixture/site");
  vi.stubGlobal("fetch", fetchMock);
  session.getActionSession.mockResolvedValue({ user: { id: "fixture-owner" } });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Umami provider analytics", () => {
  it("does not fetch when configuration is missing", async () => {
    vi.stubEnv("UMAMI_PASSWORD", " ");
    expect(await getUmamiAnalytics()).toMatchObject({
      status: "not-configured",
      topPages: [],
      pageviews: {},
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes numeric stats, derived metrics and the previous 30-day comparison", async () => {
    mockProvider();
    const analytics = await getUmamiAnalytics();
    expect(analytics).toMatchObject({
      status: "available",
      pageviews: { value: 100, previous: 50, change: 100 },
      visitors: { value: 20, previous: 10, change: 100 },
      visits: { value: 25, previous: 10, change: 150 },
      bounceRate: { value: 20, previous: 40, change: -50 },
      visitDuration: { value: 60, previous: 30, change: 100 },
      range,
      fetchedAt: new Date(endAt).toISOString(),
      comparisonStatus: "available",
    });
    for (const [url, options] of fetchMock.mock.calls) {
      expect(options?.cache).toBe("no-store");
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      if (String(url).includes("/websites/")) {
        expect(String(url)).toContain("/websites/fixture%2Fsite/");
        expect(options?.headers).toMatchObject({
          Authorization: "Bearer fixture-token",
        });
      }
    }
  });

  it("distinguishes an empty detail response from a failed detail request", async () => {
    mockProvider({ failedType: "browser" });
    const analytics = await getUmamiAnalytics();
    expect(analytics.status).toBe("available");
    expect(analytics.browsers).toEqual([]);
    expect(analytics.topPages).toEqual([]);
    expect(analytics.details).toMatchObject({
      topPages: {
        status: "empty",
        range,
        fetchedAt: new Date(endAt).toISOString(),
      },
      referrers: { status: "empty" },
      browsers: { status: "error" },
      locations: { status: "empty" },
    });
    expect(analytics.details?.browsers?.fetchedAt).toBeUndefined();
  });

  it("records successful response time separately from the requested range", async () => {
    mockProvider();
    const provider = fetchMock.getMockImplementation();
    fetchMock.mockImplementation(async (...args) => {
      vi.setSystemTime(endAt + 2000);
      return provider?.(...args) as Promise<Response>;
    });
    const analytics = await getUmamiAnalytics();
    expect(analytics.range).toEqual(range);
    expect(analytics.fetchedAt).toBe(new Date(endAt + 2000).toISOString());
    expect(analytics.details?.topPages?.range).toEqual(range);
  });

  it("preserves supported aliases and metric fallbacks without coercing strings", async () => {
    mockProvider({
      current: {
        views: { current: 15, previousValue: 10, growth: 50 },
        visitors: { total: 8, prev: 4, delta: 100 },
        sessions: { value: 5, previous: 0 },
        bounceRate: 12,
        visitDuration: { value: 119.6 },
      },
      previous: {},
      metrics: [
        { x: "/valid", y: 4 },
        { name: "fallback", pageviews: 3 },
        { name: "people", visitors: 2 },
        { name: "sessions", visits: 1 },
        { x: "string", y: "9" },
        { x: "null", y: null },
      ],
    });
    const analytics = await getUmamiAnalytics();
    expect(analytics.pageviews).toEqual({
      value: 15,
      previous: 10,
      change: 50,
    });
    expect(analytics.visitors).toEqual({ value: 8, previous: 4, change: 100 });
    expect(analytics.visits).toEqual({ value: 5, previous: 0, change: 100 });
    expect(analytics.bounceRate.value).toBe(12);
    expect(analytics.visitDuration.value).toBe(119.6);
    expect(analytics.topPages).toEqual([
      { name: "/valid", value: 4 },
      { name: "fallback", value: 3 },
      { name: "people", value: 2 },
      { name: "sessions", value: 1 },
    ]);
  });

  it("keeps current values when comparison fails and converts country codes", async () => {
    mockProvider({ failPrevious: true, metrics: [{ x: "id", y: 3 }] });
    const analytics = await getUmamiAnalytics();
    expect(analytics.pageviews.value).toBe(100);
    expect(analytics.pageviews.previous).toBeUndefined();
    expect(analytics.pageviews.change).toBeUndefined();
    expect(analytics.comparisonStatus).toBe("error");
    expect(analytics.locations).toEqual([{ name: "Indonesia", value: 3 }]);
  });

  it.each([null, {}, "not metrics"])(
    "marks malformed detail payload %j as failed",
    async (metrics) => {
      mockProvider({ metrics });
      const analytics = await getUmamiAnalytics();
      expect(analytics.details?.topPages?.status).toBe("error");
      expect(analytics.topPages).toEqual([]);
    },
  );

  it.each([null, [], "not stats"])(
    "returns an error for malformed stats %j without a fresh timestamp",
    async (current) => {
      mockProvider({ current });
      const analytics = await getUmamiAnalytics();
      expect(analytics.status).toBe("error");
      expect(analytics.fetchedAt).toBeUndefined();
      expect(analytics.range).toBeUndefined();
    },
  );

  it("does not leak transport errors, credentials or token data", async () => {
    fetchMock.mockRejectedValue(new Error("fixture-password fixture-token"));
    const analytics = await getUmamiAnalytics();
    expect(analytics.status).toBe("error");
    expect(analytics.fetchedAt).toBeUndefined();
    expect(JSON.stringify(analytics)).not.toMatch(
      /fixture-password|fixture-token/,
    );
  });

  it("retains the default API origin when its environment override is absent", async () => {
    vi.stubEnv("UMAMI_API_URL", undefined);
    mockProvider();
    expect((await getUmamiAnalytics()).status).toBe("available");
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://analytics.heinz.id/api/auth/login",
    );
  });
});

describe("private Umami refresh action", () => {
  it("authorizes before making any provider request", async () => {
    session.getActionSession.mockRejectedValue(new Error("Unauthorized"));
    const analytics = await actionRefreshUmamiAnalytics();
    expect(analytics.status).toBe("error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows an authorized owner to refresh", async () => {
    mockProvider();
    expect((await actionRefreshUmamiAnalytics()).status).toBe("available");
    expect(session.getActionSession).toHaveBeenCalledOnce();
    expect(session.getActionSession.mock.invocationCallOrder[0]).toBeLessThan(
      fetchMock.mock.invocationCallOrder[0],
    );
  });
});
