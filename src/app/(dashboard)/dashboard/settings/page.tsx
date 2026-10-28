import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { SettingsManager } from "@/features/dashboard/settings/components/profile-settings-form";
import { DashboardRouteBoundary } from "@/features/dashboard/shared/components/route-boundary";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

async function getProfile(userId: string) {
  return db.query.user
    .findFirst({
      where: (table) => eq(table.id, userId),
      columns: {
        id: true,
        email: true,
        name: true,
        image: true,
        tagline: true,
        bio: true,
        github: true,
        instagram: true,
        twitter: true,
        websiteUrl: true,
        publicEmail: true,
      },
    })
    .then((row) => row ?? null);
}

async function getLinkedAccounts(userId: string) {
  return db.query.account.findMany({
    where: (table) => eq(table.userId, userId),
    columns: { id: true, providerId: true, accountId: true, createdAt: true },
  });
}

export default function SettingsPage() {
  return (
    <DashboardRouteBoundary title="Settings">
      <SettingsContent />
    </DashboardRouteBoundary>
  );
}

async function SettingsContent() {
  await connection();

  const session = await getActionSession();
  const [profile, linkedAccounts] = await Promise.all([
    getProfile(session.user.id),
    getLinkedAccounts(session.user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-bold text-3xl">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile, account, and security preferences.
        </p>
      </div>

      <SettingsManager
        profile={
          profile ?? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image ?? null,
            tagline: null,
            bio: null,
            github: null,
            instagram: null,
            twitter: null,
            websiteUrl: null,
            publicEmail: null,
          }
        }
        linkedAccounts={linkedAccounts}
      />
    </div>
  );
}
