import { createRoot } from "react-dom/client";
import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { Toaster } from "@/components/ui/toast";
import { SettingsManager } from "@/features/dashboard/settings/components/profile-settings-form";
import shell from "@/features/dashboard/shell/dashboard-shell.module.css";

const profile = {
  id: "owner",
  email: "owner@example.test",
  name: "Example portfolio owner",
  image: `${location.origin}/avatar.svg`,
  tagline: "Full Stack Web Developer",
  bio: "I build web applications and write about the decisions behind them.",
  github: "https://github.com/example",
  instagram: null,
  twitter: null,
  websiteUrl: "https://example.test",
  publicEmail: "hello@example.test",
};
createRoot(document.getElementById("root")).render(
  <Toaster>
    <main className={shell.shell}>
      <div className={shell.content}>
        <header className="mb-6">
          <h1 className="font-heading">Settings</h1>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            Manage your public profile, sign-in methods, and account security.
          </p>
        </header>
        {new URLSearchParams(location.search).get("view") === "totp" ? (
          <TwoFactorForm />
        ) : (
          <SettingsManager
            profile={profile}
            linkedAccounts={[
              {
                id: "github",
                providerId: "github",
                accountId: "example",
                createdAt: new Date("2026-10-30T00:00:00Z"),
              },
            ]}
          />
        )}
        <a
          href="/elsewhere"
          className="inline-flex items-center mt-6 min-h-11 text-link"
        >
          Leave Settings fixture
        </a>
      </div>
    </main>
  </Toaster>,
);
