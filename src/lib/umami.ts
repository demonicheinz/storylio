type UmamiMetric = {
  name: string;
  value: number;
};

type UmamiStat = {
  value?: number;
  previous?: number;
  change?: number;
};

type UmamiRange = { startAt: number; endAt: number };

export type UmamiDetailResult = {
  status: "available" | "empty" | "error";
  fetchedAt?: string;
  range?: UmamiRange;
  stale?: boolean;
};

export type UmamiAnalytics = {
  status: "available" | "not-configured" | "error";
  error?: string;
  fetchedAt?: string;
  range?: UmamiRange;
  comparisonStatus?: "available" | "error";
  details?: Partial<
    Record<
      "topPages" | "referrers" | "browsers" | "locations",
      UmamiDetailResult
    >
  >;
  pageviews: UmamiStat;
  visitors: UmamiStat;
  visits: UmamiStat;
  bounceRate: UmamiStat;
  visitDuration: UmamiStat;
  topPages: UmamiMetric[];
  referrers: UmamiMetric[];
  browsers: UmamiMetric[];
  locations: UmamiMetric[];
};

const REQUEST_TIMEOUT_MS = 3_500;

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readStat(value: unknown): UmamiStat {
  const directValue = readNumber(value);
  if (directValue !== undefined) {
    return { value: directValue };
  }

  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;
  return {
    change:
      readNumber(record.change) ??
      readNumber(record.delta) ??
      readNumber(record.growth),
    previous:
      readNumber(record.prev) ??
      readNumber(record.previous) ??
      readNumber(record.previousValue),
    value:
      readNumber(record.value) ??
      readNumber(record.current) ??
      readNumber(record.total),
  };
}

function calculateChange(value?: number, previous?: number) {
  if (value === undefined || previous === undefined) {
    return undefined;
  }

  if (previous === 0) {
    return value > 0 ? 100 : 0;
  }

  return readNumber(((value - previous) / previous) * 100);
}

function withCalculatedChange(stat: UmamiStat): UmamiStat {
  return {
    ...stat,
    change: stat.change ?? calculateChange(stat.value, stat.previous),
  };
}

function getStatsRecord(stats: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in stats) {
      return readStat(stats[key]);
    }
  }

  return {};
}

function getComparableStatsRecord(
  currentStats: Record<string, unknown>,
  previousStats: Record<string, unknown>,
  keys: string[],
) {
  const current = getStatsRecord(currentStats, keys);
  const previous = getStatsRecord(previousStats, keys);

  return withCalculatedChange({
    ...current,
    previous: current.previous ?? previous.value,
  });
}

function calculateRatioStat(numerator: UmamiStat, denominator: UmamiStat) {
  const value =
    numerator.value !== undefined && denominator.value
      ? readNumber((numerator.value / denominator.value) * 100)
      : undefined;
  const previous =
    numerator.previous !== undefined && denominator.previous
      ? readNumber((numerator.previous / denominator.previous) * 100)
      : undefined;

  return withCalculatedChange({ previous, value });
}

function calculateAverageStat(total: UmamiStat, count: UmamiStat) {
  const value =
    total.value !== undefined && count.value
      ? readNumber(total.value / count.value)
      : undefined;
  const previous =
    total.previous !== undefined && count.previous
      ? readNumber(total.previous / count.previous)
      : undefined;

  return withCalculatedChange({ previous, value });
}

function normalizeMetrics(value: unknown): UmamiMetric[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const name =
      typeof record.x === "string"
        ? record.x
        : typeof record.name === "string"
          ? record.name
          : null;
    const metricValue =
      readNumber(record.y) ??
      readNumber(record.pageviews) ??
      readNumber(record.visitors) ??
      readNumber(record.visits);

    return name && metricValue !== undefined
      ? [{ name, value: metricValue }]
      : [];
  });
}

function getCountryName(countryCode: string) {
  if (countryCode.length !== 2) {
    return countryCode;
  }

  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(
        countryCode.toUpperCase(),
      ) ?? countryCode
    );
  } catch {
    return countryCode;
  }
}

function normalizeCountryMetrics(value: unknown) {
  return normalizeMetrics(value).map((item) => ({
    ...item,
    name: getCountryName(item.name),
  }));
}

function getUmamiConfig() {
  const apiUrl =
    process.env.UMAMI_API_URL?.trim() ?? "https://analytics.heinz.id/api";
  const username = process.env.UMAMI_USERNAME?.trim();
  const password = process.env.UMAMI_PASSWORD?.trim();
  const websiteId = process.env.UMAMI_WEBSITE_ID?.trim();

  if (!apiUrl || !username || !password || !websiteId) return null;

  return {
    apiUrl: apiUrl.replace(/\/+$/, ""),
    password,
    username,
    websiteId,
  };
}

async function getUmamiToken(
  config: NonNullable<ReturnType<typeof getUmamiConfig>>,
) {
  const response = await fetch(`${config.apiUrl}/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: config.password,
      username: config.username,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Umami auth returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (typeof data.token !== "string" || !data.token) {
    throw new Error("Umami auth did not return a token.");
  }

  return data.token;
}

async function requestUmami(
  config: NonNullable<ReturnType<typeof getUmamiConfig>>,
  path: string,
  token: string,
) {
  const response = await fetch(`${config.apiUrl}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Umami API returned HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  return { data, fetchedAt: new Date().toISOString() };
}

function readDetailResult(
  result: PromiseSettledResult<Awaited<ReturnType<typeof requestUmami>>>,
  range: UmamiRange,
  normalize = normalizeMetrics,
): { items: UmamiMetric[]; metadata: UmamiDetailResult } {
  if (result.status === "rejected" || !Array.isArray(result.value.data)) {
    return { items: [], metadata: { status: "error" } };
  }

  const items = normalize(result.value.data);
  return {
    items,
    metadata: {
      status: items.length ? "available" : "empty",
      fetchedAt: result.value.fetchedAt,
      range,
    },
  };
}

function readStatsPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid Umami statistics response.");
  }
  return value as Record<string, unknown>;
}

function emptyAnalytics(
  status: "not-configured" | "error",
  error?: string,
): UmamiAnalytics {
  return {
    status,
    ...(error ? { error } : {}),
    bounceRate: {},
    browsers: [],
    locations: [],
    pageviews: {},
    referrers: [],
    topPages: [],
    visitDuration: {},
    visitors: {},
    visits: {},
  };
}

export async function getUmamiAnalytics(): Promise<UmamiAnalytics> {
  const config = getUmamiConfig();
  if (!config) {
    return emptyAnalytics("not-configured");
  }

  const endAt = Date.now();
  const rangeDuration = 30 * 24 * 60 * 60 * 1000;
  const startAt = endAt - rangeDuration;
  const range = { startAt, endAt };
  const previousEndAt = startAt;
  const previousStartAt = previousEndAt - rangeDuration;
  const query = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt),
  });
  const previousQuery = new URLSearchParams({
    startAt: String(previousStartAt),
    endAt: String(previousEndAt),
  });

  try {
    const token = await getUmamiToken(config);
    const [
      statsResult,
      previousStatsResult,
      pagesResult,
      referrersResult,
      browsersResult,
      locationsResult,
    ] = await Promise.allSettled([
      requestUmami(
        config,
        `/websites/${encodeURIComponent(config.websiteId)}/stats?${query}`,
        token,
      ),
      requestUmami(
        config,
        `/websites/${encodeURIComponent(config.websiteId)}/stats?${previousQuery}`,
        token,
      ),
      requestUmami(
        config,
        `/websites/${encodeURIComponent(config.websiteId)}/metrics?${query}&type=path&limit=5`,
        token,
      ),
      requestUmami(
        config,
        `/websites/${encodeURIComponent(config.websiteId)}/metrics?${query}&type=referrer&limit=5`,
        token,
      ),
      requestUmami(
        config,
        `/websites/${encodeURIComponent(config.websiteId)}/metrics?${query}&type=browser&limit=5`,
        token,
      ),
      requestUmami(
        config,
        `/websites/${encodeURIComponent(config.websiteId)}/metrics?${query}&type=country&limit=5`,
        token,
      ),
    ]);

    if (statsResult.status === "rejected") {
      return emptyAnalytics("error", "Unable to load Umami statistics.");
    }

    const stats = readStatsPayload(statsResult.value.data);
    let previousStats: Record<string, unknown> = {};
    let comparisonStatus: "available" | "error" = "error";
    if (previousStatsResult.status === "fulfilled") {
      try {
        previousStats = readStatsPayload(previousStatsResult.value.data);
        comparisonStatus = "available";
      } catch {
        // Current-period statistics remain useful without a comparison.
      }
    }
    const pageviews = getComparableStatsRecord(stats, previousStats, [
      "pageviews",
      "views",
    ]);
    const visitors = getComparableStatsRecord(stats, previousStats, [
      "visitors",
    ]);
    const visits = getComparableStatsRecord(stats, previousStats, [
      "visits",
      "sessions",
    ]);
    const bounces = getComparableStatsRecord(stats, previousStats, ["bounces"]);
    const totalTime = getComparableStatsRecord(stats, previousStats, [
      "totaltime",
      "totalTime",
      "visitTime",
    ]);
    const explicitBounceRate = getComparableStatsRecord(stats, previousStats, [
      "bounceRate",
    ]);
    const explicitVisitDuration = getComparableStatsRecord(
      stats,
      previousStats,
      ["visitDuration"],
    );
    const bounceRate =
      explicitBounceRate.value !== undefined
        ? explicitBounceRate
        : calculateRatioStat(bounces, visits);
    const visitDuration =
      explicitVisitDuration.value !== undefined
        ? explicitVisitDuration
        : calculateAverageStat(totalTime, visits);

    const pages = readDetailResult(pagesResult, range);
    const referrers = readDetailResult(referrersResult, range);
    const browsers = readDetailResult(browsersResult, range);
    const locations = readDetailResult(
      locationsResult,
      range,
      normalizeCountryMetrics,
    );

    return {
      status: "available",
      fetchedAt: statsResult.value.fetchedAt,
      range,
      comparisonStatus,
      details: {
        topPages: pages.metadata,
        referrers: referrers.metadata,
        browsers: browsers.metadata,
        locations: locations.metadata,
      },
      pageviews,
      visitors,
      visits,
      bounceRate,
      visitDuration,
      topPages: pages.items,
      referrers: referrers.items,
      browsers: browsers.items,
      locations: locations.items,
    };
  } catch {
    return emptyAnalytics("error", "Unable to load Umami statistics.");
  }
}
