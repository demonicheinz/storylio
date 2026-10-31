"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  CircleNotchIcon,
  EyeIcon,
  EyeSlashIcon,
  FingerprintIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react";
import {
  startAuthentication,
  WebAuthnAbortService,
} from "@simplewebauthn/browser";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { getSignInError, SIGN_IN_CONNECTION_ERROR } from "@/lib/auth-errors";
import { getAuthRedirect } from "@/lib/auth-redirect";
import styles from "./sign-in.module.css";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type SignInValues = z.infer<typeof signInSchema>;
type Pending = "password" | "github" | "passkey" | "redirect" | null;

export function SignInForm({
  githubEnabled = false,
}: {
  githubEnabled?: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = getAuthRedirect(search.get("callbackUrl"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [showPassword, setShowPassword] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(false);
  const lifecycle = useRef(0);
  const conditional = useRef<AbortController | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const navigate = () => {
    if (!mounted.current) return;
    setPending("redirect");
    router.replace(redirectTo);
    router.refresh();
  };

  useLayoutEffect(() => {
    mounted.current = true;
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      lifecycle.current += 1;
      lock.current = false;
      setPending(null);
      setError(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      mounted.current = false;
      lifecycle.current += 1;
      // Cache Components hides this form with Activity instead of unmounting it.
      // Transient submission state must not survive the next visit.
      lock.current = false;
      setPending(null);
      setError(null);
      window.removeEventListener("pageshow", onPageShow);
      conditional.current?.abort();
      WebAuthnAbortService.cancelCeremony();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    conditional.current = controller;
    const { signal } = controller;
    // Own the conditional challenge fetch: the SDK doesn't forward its signal.
    // A late autofill response must not interrupt explicit authentication.
    const preload = async () => {
      if (
        !window.isSecureContext ||
        typeof PublicKeyCredential === "undefined" ||
        !PublicKeyCredential.isConditionalMediationAvailable ||
        !(await PublicKeyCredential.isConditionalMediationAvailable()) ||
        signal.aborted ||
        lock.current
      )
        return;
      type Options = Parameters<typeof startAuthentication>[0]["optionsJSON"];
      const options = await authClient.$fetch<Options>(
        "/passkey/generate-authenticate-options",
        { signal },
      );
      if (!options.data || signal.aborted || lock.current) return;
      const abort = () => WebAuthnAbortService.cancelCeremony();
      signal.addEventListener("abort", abort, { once: true });
      try {
        const { clientExtensionResults: _extensions, ...response } =
          await startAuthentication({
            optionsJSON: options.data,
            useBrowserAutofill: true,
          });
        if (signal.aborted || lock.current) return;
        const result = await authClient.$fetch<{
          session: unknown;
          user: unknown;
        }>("/passkey/verify-authentication", {
          method: "POST",
          signal,
          body: { response },
        });
        if (
          result.data?.session &&
          result.data.user &&
          !result.error &&
          !signal.aborted &&
          !lock.current &&
          mounted.current
        ) {
          lock.current = true;
          authClient.$store.notify("$sessionSignal");
          setPending("redirect");
          router.replace(redirectTo);
          router.refresh();
        }
      } finally {
        signal.removeEventListener("abort", abort);
      }
    };
    void preload().catch(() => {
      /* Optional autofill never blocks the form. */
    });
    return () => controller.abort();
  }, [redirectTo, router]);

  const begin = (method: Exclude<Pending, "redirect" | null>) => {
    if (lock.current) return false;
    lock.current = true;
    conditional.current?.abort();
    WebAuthnAbortService.cancelCeremony();
    setError(null);
    setPending(method);
    return true;
  };
  const isCurrent = (attempt: number) =>
    mounted.current && lifecycle.current === attempt;
  const release = (success: boolean, attempt: number) => {
    if (success || !isCurrent(attempt)) return;
    lock.current = false;
    setPending(null);
  };
  const onSubmit = async (values: SignInValues) => {
    if (!begin("password")) return;
    const attempt = lifecycle.current;
    let success = false;
    try {
      const result = await authClient.signIn.email({
        ...values,
        callbackURL: redirectTo,
      });
      if (!isCurrent(attempt)) return;
      if (result.error || !result.data)
        setError(getSignInError(result.error, "password"));
      else {
        if (
          "twoFactorRedirect" in result.data &&
          result.data.twoFactorRedirect
        ) {
          setPending("redirect");
          router.replace(
            `/two-factor?${new URLSearchParams({ callbackUrl: redirectTo })}`,
          );
        } else navigate();
        success = true;
      }
    } catch {
      if (isCurrent(attempt)) setError(SIGN_IN_CONNECTION_ERROR);
    } finally {
      release(success, attempt);
    }
  };
  const signInWithGitHub = async () => {
    if (!begin("github")) return;
    const attempt = lifecycle.current;
    let success = false;
    try {
      const query = new URLSearchParams({
        callbackUrl: redirectTo,
        error: "oauth",
      });
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: redirectTo,
        errorCallbackURL: `/sign-in?${query.toString()}`,
      });
      if (!isCurrent(attempt)) return;
      if (result.error || !result.data?.url)
        setError(getSignInError(result.error, "github"));
      else success = true;
    } catch {
      if (isCurrent(attempt)) setError(SIGN_IN_CONNECTION_ERROR);
    } finally {
      release(success, attempt);
    }
  };
  const signInWithPasskey = async () => {
    if (!begin("passkey")) return;
    const attempt = lifecycle.current;
    let success = false;
    try {
      if (
        !window.isSecureContext ||
        typeof PublicKeyCredential === "undefined"
      ) {
        setError(
          "Passkeys are unavailable in this browser. Use your password instead.",
        );
        return;
      }
      const result = await authClient.signIn.passkey();
      if (!isCurrent(attempt)) return;
      if (result.error || !result.data?.session || !result.data.user)
        setError(getSignInError(result.error, "passkey"));
      else {
        navigate();
        success = true;
      }
    } catch {
      if (isCurrent(attempt)) setError(SIGN_IN_CONNECTION_ERROR);
    } finally {
      release(success, attempt);
    }
  };
  const message =
    error ?? (search.has("error") ? getSignInError(null, "github") : null);

  return (
    <div className={styles.content} data-auth-form>
      <Link href="/" className={styles.brand} aria-label="Storylio home">
        <Logo size={40} loading="eager" />
      </Link>
      <header className={styles.header}>
        <h1>Sign in to Storylio</h1>
        <p>Access your dashboard.</p>
      </header>
      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        aria-busy={pending !== null}
      >
        <div>
          <div className={styles.field}>
            <input
              {...register("email")}
              id="email"
              type="email"
              placeholder=" "
              autoComplete="username webauthn"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={pending !== null}
              className={styles.input}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
          </div>
          {errors.email && (
            <p id="email-error" className={styles.fieldError} role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <div className={styles.field}>
            <input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder=" "
              autoComplete="current-password"
              required
              disabled={pending !== null}
              className={`${styles.input} ${styles.passwordInput}`}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              aria-controls="password"
              disabled={pending !== null}
            >
              {showPassword ? (
                <EyeSlashIcon size={18} aria-hidden="true" />
              ) : (
                <EyeIcon size={18} aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className={styles.fieldError} role="alert">
              {errors.password.message}
            </p>
          )}
        </div>
        {message && (
          <p role="alert" className={styles.error}>
            {message}
          </p>
        )}
        <Button
          type="submit"
          className={styles.action}
          disabled={pending !== null}
        >
          {(pending === "password" || pending === "redirect") && (
            <CircleNotchIcon
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
            />
          )}
          {pending === "password" || pending === "redirect"
            ? "Signing in…"
            : "Sign in"}
        </Button>
      </form>
      <Link href="/forgot-password" className={styles.back}>
        Forgot password?
      </Link>
      <div className={styles.divider} aria-hidden="true">
        or
      </div>
      <div className={styles.alternatives}>
        {githubEnabled && (
          <Button
            type="button"
            variant="outline"
            className={styles.action}
            disabled={pending !== null}
            onClick={signInWithGitHub}
          >
            {pending === "github" ? (
              <CircleNotchIcon
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            ) : (
              <GithubLogoIcon aria-hidden="true" />
            )}
            {pending === "github" ? "Redirecting…" : "Continue with GitHub"}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className={styles.action}
          disabled={pending !== null}
          onClick={signInWithPasskey}
        >
          {pending === "passkey" ? (
            <CircleNotchIcon
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <FingerprintIcon aria-hidden="true" />
          )}
          {pending === "passkey"
            ? "Waiting for your passkey…"
            : "Sign in with passkey"}
        </Button>
      </div>
      <Link href="/" className={styles.back}>
        <ArrowLeftIcon size={16} aria-hidden="true" />
        Back to home
      </Link>
      <p className="mt-3 text-muted-foreground text-xs text-center">
        If two-factor authentication is enabled, use your password to sign in.
      </p>
    </div>
  );
}
