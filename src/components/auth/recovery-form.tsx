"use client";

import { CheckCircleIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { SIGN_IN_CONNECTION_ERROR } from "@/lib/auth-errors";
import { AuthFormHeading } from "./auth-flow";
import styles from "./sign-in.module.css";

export function RecoveryForm({ reset = false }: { reset?: boolean }) {
  const search = useSearchParams();
  const token = search.get("token");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const focusEmail = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const invalidLink =
    reset && (!token || token.length > 512 || search.has("error"));
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lock.current || invalidLink) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setError(null);
    const password = String(values.get("password") ?? "");
    if (reset && password !== values.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    lock.current = true;
    setPending(true);
    try {
      const result =
        reset && token
          ? await authClient.resetPassword({
              token,
              newPassword: password,
            })
          : await authClient.requestPasswordReset({
              email: String(values.get("email") ?? "").trim(),
              redirectTo: new URL("/reset-password", window.location.origin)
                .href,
            });
      if (!mounted.current) return;
      if (result.error) {
        setError(
          result.error.status === 429
            ? "Too many attempts. Wait a minute before trying again."
            : reset
              ? result.error.status === 400
                ? "This reset link is invalid or expired. Request a new link."
                : "Unable to reset your password. Please try again."
              : "Unable to send the request. Please try again.",
        );
      } else {
        form.reset();
        setDone(true);
        if (reset)
          window.history.replaceState(
            window.history.state,
            "",
            "/reset-password",
          );
      }
    } catch {
      if (mounted.current) setError(SIGN_IN_CONNECTION_ERROR);
    } finally {
      lock.current = false;
      if (mounted.current) setPending(false);
    }
  };
  return (
    <AuthFormHeading
      compact={done}
      footer={
        done ? (
          <div className={styles.confirmationActions}>
            <Button
              role="link"
              render={<Link href="/sign-in" />}
              nativeButton={false}
              size="lg"
            >
              Back to sign in
            </Button>
            {!reset && (
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  focusEmail.current = true;
                  setDone(false);
                  setError(null);
                }}
              >
                Try another email
              </Button>
            )}
          </div>
        ) : undefined
      }
      title={
        done
          ? reset
            ? "Password updated"
            : "Check your inbox"
          : reset
            ? "Reset your password"
            : "Forgot your password?"
      }
      description={
        done
          ? reset
            ? "You can sign in with your new password."
            : undefined
          : reset
            ? "Choose a new password to secure your account."
            : "We’ll send you a link to reset your password."
      }
    >
      {done ? (
        <div role="status" className={styles.confirmation}>
          {reset ? (
            <CheckCircleIcon
              aria-hidden="true"
              className={styles.confirmationIcon}
            />
          ) : (
            <EnvelopeSimpleIcon
              aria-hidden="true"
              className={styles.confirmationIcon}
            />
          )}
          <p>
            {reset
              ? "All sessions have been signed out. If two-factor authentication is enabled, you’ll still need your authenticator or a backup code."
              : "If an eligible account matches that address, we’ll send a password reset link."}
          </p>
          {!reset && (
            <p className="text-muted-foreground">
              The link expires in 30 minutes. Check your spam folder too.
            </p>
          )}
        </div>
      ) : invalidLink ? (
        <p role="alert" className={styles.error}>
          This reset link is invalid or expired.{" "}
          <Link href="/forgot-password" className="underline">
            Request a new link
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={onSubmit} className={styles.form}>
          {reset ? (
            <>
              <div className={styles.field}>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  placeholder=" "
                  required
                  disabled={pending}
                  className={styles.input}
                  aria-describedby="password-guidance"
                />
                <label htmlFor="new-password" className={styles.label}>
                  New password
                </label>
              </div>
              <p
                id="password-guidance"
                className="text-muted-foreground text-sm"
              >
                Use 8–128 characters. A long, unique password is best.
              </p>
              <div className={styles.field}>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  placeholder=" "
                  required
                  disabled={pending}
                  className={styles.input}
                />
                <label htmlFor="confirm-password" className={styles.label}>
                  Confirm new password
                </label>
              </div>
            </>
          ) : (
            <div className={styles.field}>
              <input
                id="recovery-email"
                ref={(input) => {
                  if (input && focusEmail.current) {
                    input.focus();
                    focusEmail.current = false;
                  }
                }}
                name="email"
                type="email"
                autoComplete="email"
                placeholder=" "
                required
                disabled={pending}
                className={styles.input}
              />
              <label htmlFor="recovery-email" className={styles.label}>
                Email
              </label>
            </div>
          )}
          {error && (
            <p role="alert" className={styles.error}>
              {error}
              {reset && (
                <>
                  {" "}
                  <Link className="underline" href="/forgot-password">
                    Request a new link
                  </Link>
                  .
                </>
              )}
            </p>
          )}
          <Button type="submit" className={styles.action} disabled={pending}>
            {pending
              ? "Please wait…"
              : reset
                ? "Reset password"
                : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthFormHeading>
  );
}
