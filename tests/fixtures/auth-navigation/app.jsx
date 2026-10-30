import { Activity, StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { AuthEntrance } from "@/components/auth/auth-entrance";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavUser } from "@/features/dashboard/shell/components/sidebar/nav-user";
import { fixture } from "./auth-mock";

// Exercise explicit passkey handling without invoking a browser ceremony.
window.PublicKeyCredential = class {};
function App() {
  const [route, setRoute] = useState(location.pathname);
  fixture.visit = setRoute;
  fixture.router ??= {
    replace(path) {
      fixture.calls.push(`replace:${path}`);
      setRoute(path);
    },
    push(path) {
      fixture.calls.push(`push:${path}`);
      setRoute(path);
    },
    refresh() {
      fixture.calls.push("refresh");
    },
  };
  return (
    <>
      <output data-testid="route">{route}</output>
      <button type="button" onClick={() => setRoute("/sign-in")}>
        Restore sign in
      </button>
      <button type="button" onClick={() => setRoute("/dashboard")}>
        Leave sign in
      </button>
      <Activity mode={route === "/sign-in" ? "visible" : "hidden"}>
        <AuthEntrance className="auth">
          <SignInForm githubEnabled />
        </AuthEntrance>
      </Activity>
      {route !== "/sign-in" && (
        <SidebarProvider>
          <NavUser
            user={{ name: "Fixture", email: "owner@example.test", avatar: "" }}
          />
        </SidebarProvider>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
