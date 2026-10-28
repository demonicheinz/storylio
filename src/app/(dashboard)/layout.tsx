"use client";

import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardBreadcrumb } from "@/features/dashboard/shell/components/dashboard-breadcrumb";
import { DashboardSidebarProvider } from "@/features/dashboard/shell/components/dashboard-sidebar-provider";
import { AppSidebar } from "@/features/dashboard/shell/components/sidebar/app-sidebar";
import styles from "@/features/dashboard/shell/dashboard-shell.module.css";
import { Providers } from "@/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <DashboardSidebarProvider>
        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        <SidebarInset>
          <header className={styles.header}>
            <SidebarTrigger className="size-11" />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:self-center h-4"
            />
            <Suspense fallback={null}>
              <DashboardBreadcrumb />
            </Suspense>
          </header>
          <Suspense fallback={null}>
            <div className={styles.content}>{children}</div>
          </Suspense>
        </SidebarInset>
      </DashboardSidebarProvider>
    </Providers>
  );
}
