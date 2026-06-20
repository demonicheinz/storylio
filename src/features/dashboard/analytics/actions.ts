"use server";

import { getUmamiAnalytics } from "@/lib/umami";

export async function actionRefreshUmamiAnalytics() {
  return getUmamiAnalytics();
}
