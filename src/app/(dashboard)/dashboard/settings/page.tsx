import { connection } from "next/server";
import { SettingsManager } from "@/features/dashboard/settings/components/profile-settings-form";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

async function getProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
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
  });
}

async function getLinkedAccounts(userId: string) {
  return db.account.findMany({
    where: { userId },
    select: {
      providerId: true,
      accountId: true,
      createdAt: true,
    },
  });
}

export default async function SettingsPage() {
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
