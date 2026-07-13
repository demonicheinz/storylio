import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { auth } from "@/lib/auth";
import { isGitHubEnabled } from "@/lib/github-config";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}

async function SignInContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex justify-center items-center bg-background px-4 min-h-screen">
      <SignInForm githubEnabled={isGitHubEnabled} />
    </div>
  );
}
