import { type ComponentProps, type ReactNode, Suspense } from "react";
import { PublicPageSkeleton } from "@/components/common/public-page-skeleton";

export function PublicRouteBoundary({
  children,
  variant = "collection",
}: {
  children: ReactNode;
  variant?: ComponentProps<typeof PublicPageSkeleton>["variant"];
}) {
  return (
    <Suspense fallback={<PublicPageSkeleton variant={variant} />}>
      {children}
    </Suspense>
  );
}
