"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
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

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const dashboardIndex = segments.indexOf("dashboard");
  const dashboardSegments =
    dashboardIndex >= 0 ? segments.slice(dashboardIndex + 1) : [];

  if (dashboardSegments.length === 0) {
    return [{ href: "/dashboard", label: "Overview" }];
  }

  return dashboardSegments.map((segment, index) => {
    const href = `/dashboard/${dashboardSegments.slice(0, index + 1).join("/")}`;
    const label = segmentLabels[segment] ?? segment;

    return {
      href,
      label,
    };
  });
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const items = getBreadcrumbItems(pathname);

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
            <Fragment key={item.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
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
