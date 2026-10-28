"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { SIGN_IN_CONNECTION_ERROR } from "@/lib/auth-errors";
import { getAuthRedirect } from "@/lib/auth-redirect";
import { AuthFormHeading } from "./auth-flow";
import styles from "./sign-in.module.css";

export function TwoFactorForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [backup, setBackup] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        lock.current = false;
        setPending(false);
      }
    };
    window.addEventListener("pageshow", restore);
    return () => {
      mounted.current = false;
      window.removeEventListener("pageshow", restore);
    };
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lock.current) return;
    const code = String(
      new FormData(event.currentTarget).get("code") ?? "",
    ).trim();
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const result = backup
        ? await authClient.twoFactor.verifyBackupCode({
            code,
            trustDevice: false,
          })
        : await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
      if (!mounted.current) return;
      if (result.error)
        setError(
          result.error.code === "ACCOUNT_TEMPORARILY_LOCKED"
            ? "Too many incorrect codes. Try again in 15 minutes."
            : result.error.status === 429
              ? "Too many attempts. Wait a minute before trying again."
              : "That code wasn’t accepted. Try again, or sign in again if the challenge has expired.",
        );
      else {
        router.replace(getAuthRedirect(search.get("callbackUrl")));
        router.refresh();
        return;
      }
    } catch {
      if (mounted.current) setError(SIGN_IN_CONNECTION_ERROR);
    }
    lock.current = false;
    if (mounted.current) setPending(false);
  };
  return (
    <AuthFormHeading
      title="Verify it’s you"
      description={
        backup
          ? "Enter one of your saved backup codes. Each code works once."
          : "Enter the six-digit code from your authenticator app."
      }
    >
      <form key={String(backup)} onSubmit={submit} className={styles.form}>
        <div className={styles.field}>
          <input
            id="verification-code"
            name="code"
            autoComplete="one-time-code"
            autoCapitalize="none"
            spellCheck={false}
            inputMode={backup ? "text" : "numeric"}
            pattern={backup ? undefined : "[0-9]{6}"}
            maxLength={backup ? 64 : 6}
            required
            placeholder=" "
            className={styles.input}
            disabled={pending}
          />
          <label htmlFor="verification-code" className={styles.label}>
            {backup ? "Backup code" : "Authenticator code"}
          </label>
        </div>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending} className={styles.action}>
          {pending ? "Verifying…" : "Verify and sign in"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={styles.action}
          disabled={pending}
          onClick={() => {
            setBackup(!backup);
            setError(null);
          }}
        >
          {backup ? "Use authenticator app" : "Use a backup code"}
        </Button>
      </form>
    </AuthFormHeading>
  );
}
