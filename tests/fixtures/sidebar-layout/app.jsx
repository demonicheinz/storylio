import { createRoot } from "react-dom/client";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebarProvider } from "@/features/dashboard/shell/components/dashboard-sidebar-provider";
import { AppSidebar } from "@/features/dashboard/shell/components/sidebar/app-sidebar";

createRoot(document.getElementById("root")).render(
  <DashboardSidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header>
        <SidebarTrigger />
      </header>
      <h1>Sidebar layout fixture</h1>
    </SidebarInset>
  </DashboardSidebarProvider>,
);
