import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="h-9 w-40 animate-pulse rounded-xl bg-muted" />
        <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded bg-muted" />
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <div className="h-7 w-56 animate-pulse rounded-xl bg-muted" />
          <div className="mt-2 h-4 w-full max-w-md animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-8 w-16 animate-pulse rounded-xl bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="h-6 w-40 animate-pulse rounded-xl bg-muted" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
