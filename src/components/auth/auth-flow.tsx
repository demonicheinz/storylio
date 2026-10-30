import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { Logo } from "@/components/common/logo";
import { AuthBackground } from "./auth-background";
import { AuthEntrance } from "./auth-entrance";
import styles from "./sign-in.module.css";

export function AuthFlow({ children }: { children: ReactNode }) {
  return (
    <AuthEntrance className={styles.page}>
      <AuthBackground />
      <Suspense
        fallback={
          <p className={styles.content} role="status">
            Loading…
          </p>
        }
      >
        {children}
      </Suspense>
    </AuthEntrance>
  );
}

export function AuthFormHeading({
  title,
  description,
  children,
  footer,
  compact = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={styles.content}
      data-auth-form
      data-compact={compact || undefined}
    >
      <Link href="/" className={styles.brand} aria-label="Storylio home">
        <Logo size={40} loading="eager" />
      </Link>
      <header className={styles.header}>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </header>
      {children}
      {footer ?? (
        <Link href="/sign-in" className={styles.back}>
          Back to sign in
        </Link>
      )}
    </div>
  );
}
