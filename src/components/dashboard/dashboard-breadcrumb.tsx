"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const segmentLabels: Record<string, string> = {
  analytics: "Analytics",
  edit: "Edit",
  gallery: "Gallery",
  home: "Home",
  media: "Media",
  new: "New",
  posts: "Posts",
  projects: "Projects",
  settings: "Settings",
  testimonials: "Testimonials",
};

type BreadcrumbItemData = {
  href: string;
  label: string;
};

type BreadcrumbLabelMap = Record<string, BreadcrumbItemData>;
type BreadcrumbItem = BreadcrumbItemData & {
  isDynamic: boolean;
};

function getStoredLabels(pathname: string): BreadcrumbLabelMap {
  if (typeof window === "undefined") {
    return {};
  }

  const segments = pathname.split("/").filter(Boolean);
  const labels: BreadcrumbLabelMap = {};

  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index - 1] !== "posts") {
      continue;
    }

    const postId = segments[index];
    const item = window.localStorage.getItem(
      `dashboard-breadcrumb:post:${postId}`,
    );

    if (!item) {
      continue;
    }

    try {
      const parsed = JSON.parse(item) as BreadcrumbItemData;
      if (parsed.label && parsed.href) {
        labels[postId] = parsed;
      }
    } catch {
      window.localStorage.removeItem(`dashboard-breadcrumb:post:${postId}`);
    }
  }

  return labels;
}

function getBreadcrumbItems(
  pathname: string,
  dynamicLabels: BreadcrumbLabelMap,
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const dashboardIndex = segments.indexOf("dashboard");
  const dashboardSegments =
    dashboardIndex >= 0 ? segments.slice(dashboardIndex + 1) : [];

  if (dashboardSegments.length === 0) {
    return [{ href: "/dashboard", isDynamic: false, label: "Overview" }];
  }

  return dashboardSegments.map((segment, index) => {
    const href = `/dashboard/${dashboardSegments.slice(0, index + 1).join("/")}`;
    const dynamicLabel = dynamicLabels[segment];
    const label = dynamicLabel?.label ?? segmentLabels[segment] ?? segment;

    return {
      href,
      isDynamic: !!dynamicLabel,
      label,
    };
  });
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const [dynamicLabels, setDynamicLabels] = useState<BreadcrumbLabelMap>({});
  const items = useMemo(
    () => getBreadcrumbItems(pathname, dynamicLabels),
    [dynamicLabels, pathname],
  );

  useEffect(() => {
    const syncLabels = () => setDynamicLabels(getStoredLabels(pathname));

    syncLabels();
    window.addEventListener("dashboard-breadcrumb-labels-changed", syncLabels);
    window.addEventListener("storage", syncLabels);

    return () => {
      window.removeEventListener(
        "dashboard-breadcrumb-labels-changed",
        syncLabels,
      );
      window.removeEventListener("storage", syncLabels);
    };
  }, [pathname]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {items.length === 1 && items[0]?.href === "/dashboard" ? (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isDashboardRoot = item.href === "/dashboard";

          if (isDashboardRoot) {
            return null;
          }

          return (
            <Fragment key={`${item.href}-${index}`}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast || item.isDynamic ? (
                  <BreadcrumbPage
                    aria-current={isLast ? "page" : undefined}
                    className={!isLast ? "text-muted-foreground" : undefined}
                  >
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
