"use client";

import { Suspense } from "react";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="h-4 self-center data-vertical:h-4 data-vertical:self-center"
          />
          <Suspense fallback={null}>
            <DashboardBreadcrumb />
          </Suspense>
        </header>
        <div className="container mx-auto max-w-7xl p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
