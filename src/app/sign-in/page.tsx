import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthBackground } from "@/components/auth/auth-background";
import { AuthEntrance } from "@/components/auth/auth-entrance";
import styles from "@/components/auth/sign-in.module.css";
import { SignInForm } from "@/components/auth/sign-in-form";
import { auth } from "@/lib/auth";
import { getAuthRedirect } from "@/lib/auth-redirect";
import { isGitHubEnabled } from "@/lib/github-config";
import { isOwnerEmail } from "@/lib/owner-guard";

export const metadata: Metadata = {
  title: "Sign in — Storylio",
  robots: { index: false, follow: false },
};
type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export default function SignInPage(props: SignInPageProps) {
  return (
    <AuthEntrance className={styles.page}>
      <AuthBackground />
      <Suspense
        fallback={
          <p className={styles.content} role="status">
            Loading sign-in…
          </p>
        }
      >
        <SignInContent {...props} />
      </Suspense>
    </AuthEntrance>
  );
}

async function SignInContent({ searchParams }: SignInPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect(
      isOwnerEmail(session.user.email)
        ? getAuthRedirect((await searchParams).callbackUrl)
        : "/unauthorized",
    );
  }

  return <SignInForm githubEnabled={isGitHubEnabled} />;
}
