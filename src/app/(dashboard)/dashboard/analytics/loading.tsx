import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { cn } from "@/lib/utils";

function Pulse({ className }: { className: string }) {
  return <div className={cn("bg-muted rounded animate-pulse", className)} />;
}

function SectionHeadingSkeleton({
  titleWidth = "w-56",
}: {
  titleWidth?: string;
}) {
  return (
    <div>
      <Pulse className={cn("rounded-xl h-7", titleWidth)} />
      <Pulse className="mt-2 w-full max-w-md h-4" />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card className={dashboardStyles.statCard}>
      <CardContent className={dashboardStyles.statContent}>
        <Pulse className="rounded-2xl size-10 shrink-0" />
        <div className="flex-1 min-w-0">
          <Pulse className="rounded-xl w-14 h-5" />
          <Pulse className="mt-2 w-24 h-3" />
          <Pulse className="mt-1 w-20 h-2.5" />
        </div>
      </CardContent>
    </Card>
  );
}

function UmamiMetricSkeleton() {
  return (
    <div className="bg-background/40 p-4 border border-border/70 rounded-2xl">
      <Pulse className="w-24 h-4" />
      <Pulse className="mt-3 rounded-xl w-20 h-8" />
      <Pulse className="mt-3 rounded-full w-14 h-6" />
    </div>
  );
}

function MetricListSkeleton() {
  return (
    <div className="bg-background/40 p-4 border border-border/70 rounded-2xl">
      <Pulse className="rounded-xl w-28 h-5" />
      <div className="gap-3 grid mt-4">
        <Pulse className="w-full h-4" />
        <Pulse className="w-4/5 h-4" />
        <Pulse className="w-2/3 h-4" />
      </div>
    </div>
  );
}

function AnalyticsPanelSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="bg-card/55 shadow-sm border-border/70">
      <CardHeader>
        <Pulse className="rounded-xl w-48 h-6" />
        <Pulse className="w-full max-w-md h-4" />
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
        <Pulse className="rounded-xl w-40 h-9" />
        <Pulse className="mt-3 w-full max-w-xl h-5" />
      </div>

      <Card className="bg-card/55 shadow-sm border-border/70">
        <CardHeader>
          <Pulse className="rounded-xl w-56 h-6" />
          <Pulse className="w-full max-w-md h-4" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="gap-3 grid md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <UmamiMetricSkeleton key={index} />
            ))}
          </div>
          <div className="gap-4 grid xl:grid-cols-2">
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

      <div className="gap-6 grid xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <AnalyticsPanelSkeleton />
        <AnalyticsPanelSkeleton compact />
      </div>

      <div className="gap-6 grid xl:grid-cols-2">
        <AnalyticsPanelSkeleton compact />
        <AnalyticsPanelSkeleton compact />
      </div>

      <Card className="bg-card/55 shadow-sm border-border/70">
        <CardHeader>
          <Pulse className="rounded-xl w-44 h-6" />
          <Pulse className="w-full max-w-md h-4" />
        </CardHeader>
        <CardContent className="gap-3 grid md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-background/40 p-4 border border-border/70 rounded-2xl min-w-0"
            >
              <Pulse className="rounded-2xl size-10 shrink-0" />
              <div className="flex-1 min-w-0">
                <Pulse className="rounded-xl w-12 h-5" />
                <Pulse className="mt-2 w-20 h-3" />
                <Pulse className="mt-1 w-24 h-2.5" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
