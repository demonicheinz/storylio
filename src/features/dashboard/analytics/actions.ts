"use server";

import { getActionSession } from "@/lib/auth-session";
import { getUmamiAnalytics, type UmamiAnalytics } from "@/lib/umami";

export async function actionRefreshUmamiAnalytics(): Promise<UmamiAnalytics> {
  try {
    await getActionSession();
  } catch {
    return {
      status: "error",
      error: "Unauthorized",
      pageviews: {},
      visitors: {},
      visits: {},
      bounceRate: {},
      visitDuration: {},
      topPages: [],
      referrers: [],
      browsers: [],
      locations: [],
    };
  }

  return getUmamiAnalytics();
}
