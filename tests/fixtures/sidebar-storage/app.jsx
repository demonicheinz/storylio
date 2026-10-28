import { createRoot } from "react-dom/client";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { DashboardSidebarProvider } from "@/features/dashboard/shell/components/dashboard-sidebar-provider";

const params = new URLSearchParams(location.search);
const key = "storylio.sidebar";
const getItem = Storage.prototype.getItem;
const setItem = Storage.prototype.setItem;
if (!params.has("retain")) {
  localStorage.removeItem(key);
  if (params.has("preference")) {
    setItem.call(localStorage, key, params.get("preference"));
  }
}
window.sidebarStorage = { reads: 0, writes: 0 };
Storage.prototype.getItem = function (name) {
  if (this === localStorage && name === key) {
    window.sidebarStorage.reads++;
    if (params.has("blockRead"))
      throw new DOMException("Blocked", "SecurityError");
  }
  return getItem.call(this, name);
};
Storage.prototype.setItem = function (name, value) {
  if (this === localStorage && name === key) {
    window.sidebarStorage.writes++;
    if (params.has("blockWrite"))
      throw new DOMException("Blocked", "QuotaExceededError");
  }
  return setItem.call(this, name, value);
};

function Probe() {
  const { state, isMobile, openMobile } = useSidebar();
  return (
    <>
      <SidebarTrigger />
      <output
        data-testid="state"
        data-mobile={isMobile}
        data-mobile-open={openMobile}
      >
        {state}
      </output>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <DashboardSidebarProvider>
    <Probe />
  </DashboardSidebarProvider>,
);
