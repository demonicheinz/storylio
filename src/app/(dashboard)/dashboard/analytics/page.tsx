import { connection } from "next/server";
import { Suspense } from "react";
import { AnalyticsLocalView } from "@/features/dashboard/analytics/components/analytics-local-view";
import { AnalyticsTabs } from "@/features/dashboard/analytics/components/analytics-tabs";
import {
  UmamiPanelClient,
  UmamiPanelSkeleton,
} from "@/features/dashboard/analytics/components/umami-panel";
import { getAnalyticsData } from "@/features/dashboard/analytics/queries";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { getUmamiAnalytics } from "@/lib/umami";
import AnalyticsLoading from "./loading";

async function LocalContent() {
  await connection();
  return <AnalyticsLocalView data={await getAnalyticsData()} />;
}

async function TrafficContent() {
  await connection();
  return (
    <UmamiPanelClient
      initialAnalytics={await getUmamiAnalytics()}
      shareUrl={process.env.UMAMI_SHARE_URL?.trim() || undefined}
    />
  );
}

export default function AnalyticsPage() {
  return (
    <div className={dashboardStyles.page}>
      <header>
        <h1 className="font-heading font-semibold text-3xl">Analytics</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
          See how your content is being read, and explore website traffic
          separately.
        </p>
      </header>
      <AnalyticsTabs
        content={
          <Suspense fallback={<AnalyticsLoading contentOnly />}>
            <LocalContent />
          </Suspense>
        }
        traffic={
          <Suspense fallback={<UmamiPanelSkeleton />}>
            <TrafficContent />
          </Suspense>
        }
      />
    </div>
  );
}
