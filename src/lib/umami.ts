type UmamiMetric = {
  name: string;
  value: number;
};

export type UmamiAnalytics = {
  status: "available" | "not-configured" | "error";
  error?: string;
  pageviews?: number;
  visitors?: number;
  visits?: number;
  topPages: UmamiMetric[];
  referrers: UmamiMetric[];
};

const REQUEST_TIMEOUT_MS = 10_000;

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
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

function getUmamiConfig() {
  const apiUrl = process.env.UMAMI_API_URL?.trim();
  const apiKey = process.env.UMAMI_API_KEY?.trim();
  const websiteId = process.env.UMAMI_WEBSITE_ID?.trim();

  if (!apiUrl || !apiKey || !websiteId) return null;

  return {
    apiKey,
    apiUrl: apiUrl.replace(/\/+$/, ""),
    websiteId,
  };
}

async function requestUmami(
  config: NonNullable<ReturnType<typeof getUmamiConfig>>,
  path: string,
) {
  const response = await fetch(`${config.apiUrl}${path}`, {
    headers: {
      Accept: "application/json",
      "x-umami-api-key": config.apiKey,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Umami API returned HTTP ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

export async function getUmamiAnalytics(): Promise<UmamiAnalytics> {
  const config = getUmamiConfig();
  if (!config) {
    return { status: "not-configured", topPages: [], referrers: [] };
  }

  const endAt = Date.now();
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000;
  const query = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt),
  });

  try {
    const [statsResult, pagesResult, referrersResult] =
      await Promise.allSettled([
        requestUmami(
          config,
          `/websites/${encodeURIComponent(config.websiteId)}/stats?${query}`,
        ),
        requestUmami(
          config,
          `/websites/${encodeURIComponent(config.websiteId)}/metrics?${query}&type=path&limit=5`,
        ),
        requestUmami(
          config,
          `/websites/${encodeURIComponent(config.websiteId)}/metrics?${query}&type=referrer&limit=5`,
        ),
      ]);

    if (statsResult.status === "rejected") {
      return {
        status: "error",
        error:
          statsResult.reason instanceof Error
            ? statsResult.reason.message
            : "Unable to load Umami statistics.",
        topPages: [],
        referrers: [],
      };
    }

    const stats =
      statsResult.value && typeof statsResult.value === "object"
        ? (statsResult.value as Record<string, unknown>)
        : {};

    return {
      status: "available",
      pageviews: readNumber(stats.pageviews),
      visitors: readNumber(stats.visitors),
      visits: readNumber(stats.visits) ?? readNumber(stats.sessions),
      topPages:
        pagesResult.status === "fulfilled"
          ? normalizeMetrics(pagesResult.value)
          : [],
      referrers:
        referrersResult.status === "fulfilled"
          ? normalizeMetrics(referrersResult.value)
          : [],
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unable to load Umami.",
      topPages: [],
      referrers: [],
    };
  }
}
