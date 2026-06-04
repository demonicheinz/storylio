import { connection } from "next/server";
import { SettingsManager } from "@/components/dashboard/profile-settings-form";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

async function getProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      tagline: true,
      bio: true,
      github: true,
      instagram: true,
      twitter: true,
    },
  });
}

export default async function SettingsPage() {
  await connection();

  const session = await getActionSession();
  const profile = await getProfile(session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage profile content and account credentials for the dashboard.
        </p>
      </div>

      <SettingsManager
        profile={
          profile ?? {
            id: session.user.id,
            name: session.user.name,
            image: session.user.image ?? null,
            tagline: null,
            bio: null,
            github: null,
            instagram: null,
            twitter: null,
          }
        }
      />
    </div>
  );
}
