import { connection } from "next/server";
import { Suspense } from "react";
import {
  DashboardOverview,
  OverviewFallback,
} from "@/features/dashboard/overview/overview-view";
import { getDashboardOverview } from "@/features/dashboard/overview/queries";

export default function DashboardHomePage() {
  return (
    <Suspense fallback={<OverviewFallback />}>
      <DashboardHomeContent />
    </Suspense>
  );
}

async function DashboardHomeContent() {
  await connection();
  return <DashboardOverview data={await getDashboardOverview()} />;
}
