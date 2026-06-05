import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { auth } from "@/lib/auth";
import { isGitHubEnabled } from "@/lib/github-config";

export default async function SignInPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignInForm githubEnabled={isGitHubEnabled} />
    </div>
  );
}
