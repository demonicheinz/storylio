import { type ReactNode, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardRouteBoundary({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-busy="true"
          aria-label={`Loading ${title}`}
          className="flex flex-col gap-5 min-w-0"
        >
          <h1 className="font-heading font-bold text-3xl">{title}</h1>
          <span className="sr-only">Loading dashboard content...</span>
          <div aria-hidden="true" className="flex flex-col gap-4">
            <Skeleton className="w-64 max-w-full h-9 motion-reduce:animate-none" />
            <Skeleton className="w-full h-32 motion-reduce:animate-none" />
            <Skeleton className="w-full h-32 motion-reduce:animate-none" />
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
