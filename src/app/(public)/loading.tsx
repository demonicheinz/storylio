"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { PublicPageSkeleton } from "@/components/common/public-page-skeleton";

function RouteSkeleton() {
  const pathname = usePathname();
  const variant =
    pathname === "/about"
      ? "about"
      : pathname === "/gallery"
        ? "gallery"
        : "collection";

  return <PublicPageSkeleton variant={variant} />;
}

export default function PublicRouteLoading() {
  return (
    <Suspense fallback={<PublicPageSkeleton />}>
      <RouteSkeleton />
    </Suspense>
  );
}
