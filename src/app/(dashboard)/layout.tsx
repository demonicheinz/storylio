"use client";

import { Suspense } from "react";
import { RouteMotion } from "@/components/common";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardBreadcrumb } from "@/features/dashboard/shell/components/dashboard-breadcrumb";
import { AppSidebar } from "@/features/dashboard/shell/components/sidebar/app-sidebar";
import { Providers } from "@/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <SidebarProvider>
        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        <SidebarInset>
          <header className="top-0 z-30 sticky flex items-center gap-3 bg-background/95 backdrop-blur px-4 border-b h-14 shrink-0">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="self-center data-vertical:self-center h-4 data-vertical:h-4"
            />
            <Suspense fallback={null}>
              <DashboardBreadcrumb />
            </Suspense>
          </header>
          <Suspense fallback={null}>
            <RouteMotion className="mx-auto p-4 md:p-6 min-w-0 max-w-7xl overflow-x-clip container">
              {children}
            </RouteMotion>
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </Providers>
  );
}
