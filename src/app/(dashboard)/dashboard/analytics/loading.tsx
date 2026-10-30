import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardStyles } from "@/features/dashboard/shared/styles";

export default function AnalyticsLoading({
  contentOnly = false,
}: {
  contentOnly?: boolean;
}) {
  return (
    <div className={dashboardStyles.page} aria-busy="true">
      <p role="status" className="sr-only">
        Loading content analytics…
      </p>
      {!contentOnly && (
        <div aria-hidden>
          <Skeleton className="w-36 h-9" />
          <Skeleton className="mt-2 w-full max-w-md h-5" />
          <Skeleton className="mt-6 w-56 max-w-full h-13" />
        </div>
      )}
      <div aria-hidden>
        <Skeleton className="w-full max-w-xl h-5" />
      </div>
      <Card aria-hidden>
        <CardHeader className="px-4 sm:px-6">
          <Skeleton className="w-40 max-w-full h-6" />
          <Skeleton className="mt-2 w-full max-w-sm h-4" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Skeleton className="w-full h-56 sm:h-64" />
          <Skeleton className="mt-4 w-36 h-11" />
        </CardContent>
      </Card>
      <div className="gap-6 grid lg:grid-cols-2" aria-hidden>
        {[0, 1].map((item) => (
          <Card key={item}>
            <CardHeader className="px-4 sm:px-6">
              <Skeleton className="w-32 h-6" />
              <Skeleton className="mt-2 w-full h-4" />
            </CardHeader>
            <CardContent className="flex flex-col gap-6 px-4 sm:px-6">
              {[0, 1, 2].map((row) => (
                <div key={row}>
                  <Skeleton className="w-4/5 h-5" />
                  <Skeleton className="mt-2 w-20 h-6" />
                  <Skeleton className="mt-3 w-full h-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <div aria-hidden className="border-border border-y">
        <Skeleton className="my-4 w-32 h-5" />
        <Skeleton className="my-4 w-36 h-5" />
      </div>
    </div>
  );
}
