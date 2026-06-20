import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { cn } from "@/lib/utils";

function Pulse({ className }: { className: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} />;
}

function SectionHeadingSkeleton({
  titleWidth = "w-56",
}: {
  titleWidth?: string;
}) {
  return (
    <div>
      <Pulse className={cn("h-7 rounded-xl", titleWidth)} />
      <Pulse className="mt-2 h-4 w-full max-w-md" />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card className={dashboardStyles.statCard}>
      <CardContent className={dashboardStyles.statContent}>
        <Pulse className="size-10 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <Pulse className="h-5 w-14 rounded-xl" />
          <Pulse className="mt-2 h-3 w-24" />
          <Pulse className="mt-1 h-2.5 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function UmamiMetricSkeleton() {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
      <Pulse className="h-4 w-24" />
      <Pulse className="mt-3 h-8 w-20 rounded-xl" />
      <Pulse className="mt-3 h-6 w-14 rounded-full" />
    </div>
  );
}

function MetricListSkeleton() {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
      <Pulse className="h-5 w-28 rounded-xl" />
      <div className="mt-4 grid gap-3">
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-4/5" />
        <Pulse className="h-4 w-2/3" />
      </div>
    </div>
  );
}

function AnalyticsPanelSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="border-border/70 bg-card/55 shadow-sm">
      <CardHeader>
        <Pulse className="h-6 w-48 rounded-xl" />
        <Pulse className="h-4 w-full max-w-md" />
      </CardHeader>
      <CardContent>
        <Pulse className={compact ? "h-56 rounded-2xl" : "h-72 rounded-2xl"} />
      </CardContent>
    </Card>
  );
}

export default function AnalyticsLoading() {
  return (
    <div className={dashboardStyles.page} aria-busy="true">
      <div>
        <Pulse className="h-9 w-40 rounded-xl" />
        <Pulse className="mt-3 h-5 w-full max-w-xl" />
      </div>

      <Card className="border-border/70 bg-card/55 shadow-sm">
        <CardHeader>
          <Pulse className="h-6 w-56 rounded-xl" />
          <Pulse className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <UmamiMetricSkeleton key={index} />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <MetricListSkeleton key={index} />
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <SectionHeadingSkeleton />
        <div className={dashboardStyles.statGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <AnalyticsPanelSkeleton />
        <AnalyticsPanelSkeleton compact />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsPanelSkeleton compact />
        <AnalyticsPanelSkeleton compact />
      </div>

      <Card className="border-border/70 bg-card/55 shadow-sm">
        <CardHeader>
          <Pulse className="h-6 w-44 rounded-xl" />
          <Pulse className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-background/40 p-4"
            >
              <Pulse className="size-10 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <Pulse className="h-5 w-12 rounded-xl" />
                <Pulse className="mt-2 h-3 w-20" />
                <Pulse className="mt-1 h-2.5 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
