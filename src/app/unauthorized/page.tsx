"use client";

import { ShieldWarningIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <ShieldWarningIcon
        className="size-16 text-destructive"
        weight="duotone"
      />
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold">Access Denied</h1>
        <p className="max-w-md text-muted-foreground">
          This dashboard is restricted to the site owner. If you believe this is
          an error, sign in with the owner account.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
        <Button variant="destructive" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
