"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { OtpInput } from "@/components/common/otp-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmAction } from "@/features/dashboard/shared/confirmation";
import { useUnsavedChangesGuard } from "@/features/dashboard/shared/hooks/use-unsaved-changes-guard";
import { authClient } from "@/lib/auth-client";
import styles from "./two-factor-settings.module.css";

export function TwoFactorSettings({
  onFlowStateChange,
  onSecurityChange,
}: {
  onFlowStateChange?: (state: { dirty: boolean; pending: boolean }) => void;
  onSecurityChange?: (enabled: boolean) => void;
} = {}) {
  const {
    data: session,
    error: sessionError,
    isPending,
    isRefetching,
    refetch,
  } = authClient.useSession();
  // A successful mutation remains authoritative even if session refresh fails.
  const [committedEnabled, setCommittedEnabled] = useState<boolean | null>(
    null,
  );
  const enabled = committedEnabled ?? session?.user.twoFactorEnabled === true;
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [uri, setUri] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const lock = useRef(false);
  const mounted = useRef(true);
  const copyLock = useRef(false);
  const dirty = uri !== null || (codes.length > 0 && !saved);
  const flowPending = pending || isPending || isRefetching;
  const unavailable = !!sessionError || !session?.user;
  const refreshProblem = refreshError || unavailable;
  useUnsavedChangesGuard(
    dirty || flowPending,
    flowPending
      ? "two-factor authentication while a security request is in progress"
      : uri
        ? "authenticator setup and its unsaved backup codes"
        : "two-factor authentication with unsaved backup codes",
  );
  useEffect(() => {
    onFlowStateChange?.({ dirty, pending: flowPending });
  }, [dirty, flowPending, onFlowStateChange]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      // Unmount drops secret state; late requests must not repopulate it.
      mounted.current = false;
    };
  }, []);

  const clearSecrets = () => {
    setPassword("");
    setCode("");
    setUri(null);
    setCodes([]);
    setVerified(false);
    setSaved(false);
    setConfirming(false);
    setKeyCopied(false);
    setCopyError(null);
    onFlowStateChange?.({ dirty: false, pending: lock.current || flowPending });
  };
  const cancel = async () => {
    if (lock.current || copyLock.current) return;
    if (
      codes.length > 0 &&
      !saved &&
      !(await confirmAction(
        "Close setup and discard these unsaved backup codes? Closing this view does not undo changes already made to your account.",
        {
          title: "Close setup?",
          confirmLabel: "Close setup",
          cancelLabel: "Cancel",
        },
      ))
    )
      return;
    if (!mounted.current || lock.current || copyLock.current) return;
    clearSecrets();
    setError(null);
    setMessage(
      "Setup view closed. Any changes already made to your account remain in effect.",
    );
  };
  const refresh = async () => {
    if (!mounted.current) return;
    setRefreshError(false);
    try {
      await refetch();
    } catch {
      if (mounted.current) setRefreshError(true);
    }
  };
  const retry = async () => {
    if (lock.current || flowPending) return;
    lock.current = true;
    setPending(true);
    onFlowStateChange?.({ dirty, pending: true });
    try {
      await refresh();
    } finally {
      lock.current = false;
      if (mounted.current) {
        setPending(false);
        onFlowStateChange?.({ dirty, pending: false });
      }
    }
  };
  const run = async (
    action: "enable" | "verify" | "disable" | "regenerate",
  ) => {
    if (lock.current || copyLock.current || flowPending || unavailable) return;
    if (action === "verify" && !/^[0-9]{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator.");
      return;
    }
    if (action !== "verify" && !password) return;
    if (
      action === "disable" &&
      !(await confirmAction(
        "Disable two-factor authentication? Authenticator and backup codes will no longer protect sign-in. GitHub and passkey sign-in will become available again.",
        {
          title: "Disable two-factor authentication?",
          confirmLabel: "Disable two-factor",
          cancelLabel: "Cancel",
        },
      ))
    )
      return;
    if (
      action === "regenerate" &&
      !(await confirmAction(
        "Regenerate backup codes? All previous backup codes will stop working immediately. Save the new codes before leaving this view.",
        {
          title: "Regenerate backup codes?",
          confirmLabel: "Regenerate codes",
          cancelLabel: "Cancel",
        },
      ))
    )
      return;
    if (!mounted.current || lock.current || copyLock.current || flowPending)
      return;
    lock.current = true;
    setPending(true);
    onFlowStateChange?.({ dirty, pending: true });
    setError(null);
    setMessage(null);
    let nextDirty = dirty;
    try {
      if (action === "enable") {
        const result = await authClient.twoFactor.enable({ password });
        if (!mounted.current) return;
        if (result.error || !result.data || result.data.method !== "totp")
          throw new Error(result.error?.message ?? "Unable to start setup.");
        setUri(result.data.totpURI);
        setCodes(result.data.backupCodes);
        setSaved(false);
        setVerified(false);
        nextDirty = true;
        onFlowStateChange?.({ dirty: true, pending: true });
      } else if (action === "verify") {
        const result = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice: false,
        });
        if (!mounted.current) return;
        if (result.error)
          throw new Error(
            "Code not accepted. Check your authenticator and try again.",
          );
        setUri(null);
        setCode("");
        setVerified(true);
        setCommittedEnabled(true);
        setPassword("");
        setKeyCopied(false);
        setCopyError(null);
        setMessage(
          "Two-factor authentication is enabled. Other sessions have been signed out.",
        );
        onSecurityChange?.(true);
        await refresh();
      } else if (action === "regenerate") {
        const result = await authClient.twoFactor.generateBackupCodes({
          password,
        });
        if (!mounted.current) return;
        if (result.error || !result.data)
          throw new Error(result.error?.message ?? "Unable to generate codes.");
        setCodes(result.data.backupCodes);
        setSaved(false);
        setVerified(true);
        setCommittedEnabled(true);
        setPassword("");
        nextDirty = true;
        onFlowStateChange?.({ dirty: true, pending: true });
        setMessage(
          "New backup codes are ready. All previous codes are invalid.",
        );
      } else {
        const result = await authClient.twoFactor.disable({ password });
        if (!mounted.current) return;
        if (result.error) throw new Error(result.error.message);
        clearSecrets();
        nextDirty = false;
        setCommittedEnabled(false);
        setMessage("Two-factor authentication is disabled.");
        onSecurityChange?.(false);
        await refresh();
      }
      if (mounted.current) setPassword("");
    } catch (cause) {
      if (!mounted.current) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to complete the request. Try again.",
      );
    } finally {
      lock.current = false;
      if (mounted.current) {
        setPending(false);
        onFlowStateChange?.({ dirty: nextDirty, pending: false });
      }
    }
  };
  let setupKey = "";
  if (uri) {
    try {
      setupKey = new URL(uri).searchParams.get("secret") ?? "";
    } catch {
      // A missing manual key must not crash the setup view.
    }
  }
  const copySetupKey = async () => {
    if (!setupKey || copyLock.current || lock.current || flowPending) return;
    copyLock.current = true;
    setCopying(true);
    setKeyCopied(false);
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(setupKey);
      if (mounted.current && !lock.current) setKeyCopied(true);
    } catch {
      if (mounted.current && !lock.current)
        setCopyError("Unable to copy. Select and copy the setup key manually.");
    } finally {
      copyLock.current = false;
      if (mounted.current) setCopying(false);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (enabled && !uri) return;
    void run(uri ? "verify" : "enable");
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          "Storylio backup codes\nKeep these private. Each code works once.\n\n" +
            codes.join("\n"),
        ],
        { type: "text/plain" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "storylio-backup-codes.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (
    isPending &&
    !sessionError &&
    !refreshError &&
    committedEnabled === null &&
    !uri &&
    codes.length === 0
  )
    return (
      <p role="status" className="text-muted-foreground text-sm">
        Loading authentication settings…
      </p>
    );
  const unknown =
    unavailable && committedEnabled === null && !uri && codes.length === 0;
  const busy = flowPending || unavailable;
  return (
    <Card className="min-w-0">
      <CardHeader className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-4">
        <div className="min-w-0">
          <CardTitle>
            <h2>Two-factor authentication</h2>
          </CardTitle>
          <CardDescription className="mt-1">
            Protect password sign-in with an authenticator and recovery codes.
          </CardDescription>
        </div>
        {!unknown && !confirming && !uri && !(codes.length > 0 && verified) && (
          <div className="shrink-0">
            <Button
              type="button"
              variant={enabled ? "outline" : "default"}
              disabled={busy}
              aria-expanded={confirming}
              onClick={() => {
                if (!lock.current) {
                  setConfirming(true);
                  setError(null);
                  setMessage(null);
                }
              }}
              className="w-fit min-h-11"
            >
              {enabled ? "Manage two-factor" : "Set up authenticator"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div
          className={`${styles.settings} motion-reduce:**:transition-none motion-reduce:**:animate-none`}
          data-mfa-settings
          aria-busy={flowPending}
        >
          {!unknown && (
            <>
              <div className={styles.status}>
                <span className="font-medium text-sm">
                  {enabled ? "Enabled" : "Not enabled"}
                </span>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {enabled
                    ? "Use your password, then an authenticator or backup code. GitHub and passkey sign-in are unavailable."
                    : "Add an authenticator code after your password. GitHub and passkey sign-in are unavailable when enabled."}
                </p>
              </div>
              {uri ? (
                <form onSubmit={submit} className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">
                      1. Scan with your authenticator
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Scan this QR code to add Storylio to your authenticator
                      app.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg w-fit max-w-full">
                    <QRCode
                      value={uri}
                      size={176}
                      title="Scan to add Storylio to your authenticator"
                    />
                  </div>
                  <details className="text-sm">
                    <summary className="py-3 rounded-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4 cursor-pointer">
                      Can’t scan? Enter the setup key manually
                    </summary>
                    <div className="flex flex-col items-start gap-2">
                      <code className="block bg-muted p-3 rounded-lg max-w-full break-all select-all">
                        {setupKey ||
                          "Manual setup key unavailable. Use the QR code above."}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!setupKey || copying || busy}
                        onClick={() => void copySetupKey()}
                        className="min-h-11"
                      >
                        Copy setup key
                      </Button>
                      {copying && <p role="status">Copying setup key…</p>}
                      {keyCopied && <p role="status">Setup key copied.</p>}
                      {copyError && (
                        <p role="alert" className="text-destructive">
                          {copyError}
                        </p>
                      )}
                    </div>
                  </details>
                  <div className="gap-2 grid">
                    <h3 className="mt-2 font-medium text-sm">
                      2. Verify your code
                    </h3>
                    <Label htmlFor="mfa-code">Authenticator code</Label>
                    <OtpInput
                      id="mfa-code"
                      value={code}
                      onValueChange={(value) => {
                        setCode(value);
                        setError(null);
                      }}
                      required
                      disabled={busy}
                      aria-describedby={
                        error ? "mfa-code-help mfa-error" : "mfa-code-help"
                      }
                      aria-invalid={!!error}
                    />
                    <p
                      id="mfa-code-help"
                      className="text-muted-foreground text-sm"
                    >
                      Enter the six-digit code shown in your app.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={busy || copying || code.length !== 6}
                    className="w-fit min-h-11"
                  >
                    {pending ? "Verifying…" : "Verify and enable"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={flowPending || copying}
                    onClick={cancel}
                    className="w-fit min-h-11"
                  >
                    Cancel setup
                  </Button>
                  <p className="text-muted-foreground text-sm">
                    Cancel closes this view and clears the setup key and codes
                    here. It does not undo changes already made to your account.
                  </p>
                </form>
              ) : codes.length > 0 && verified ? (
                <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">
                      Save your backup codes
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Each code works once if you lose access to your
                      authenticator. Keep them somewhere private. They disappear
                      when you close this view.
                    </p>
                  </div>
                  <ul
                    aria-label="Backup codes"
                    className="gap-2 grid grid-cols-1 sm:grid-cols-2 p-4 border rounded-lg font-mono text-sm"
                  >
                    {codes.map((value) => (
                      <li key={value} className="select-all">
                        {value}
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={download}
                    disabled={flowPending}
                    className="w-fit min-h-11"
                  >
                    Download backup codes
                  </Button>
                  <label className="flex items-center gap-3 min-h-11 text-sm">
                    <input
                      type="checkbox"
                      checked={saved}
                      disabled={flowPending}
                      onChange={(e) => {
                        setSaved(e.target.checked);
                        onFlowStateChange?.({
                          dirty: !e.target.checked,
                          pending: flowPending,
                        });
                      }}
                      className="focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4 size-4 accent-primary"
                    />
                    I saved my backup codes.
                  </label>
                  <Button
                    type="button"
                    className="w-fit min-h-11"
                    disabled={!saved || flowPending}
                    onClick={() => {
                      if (!saved || lock.current) return;
                      clearSecrets();
                    }}
                  >
                    Done
                  </Button>
                </div>
              ) : confirming ? (
                <form
                  id="mfa-confirmation"
                  onSubmit={submit}
                  className="flex flex-col gap-4"
                >
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {enabled
                      ? "Confirm your password to replace backup codes or turn off two-factor authentication."
                      : "Confirm your password to connect an authenticator. Other sessions will be signed out when you enable it. You’ll save backup codes after verification."}
                  </p>
                  <div className="gap-2 grid">
                    <Label htmlFor="mfa-password">Confirm your password</Label>
                    <Input
                      id="mfa-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      maxLength={128}
                      disabled={busy}
                      className="min-h-11"
                      aria-describedby={error ? "mfa-error" : undefined}
                      aria-invalid={!!error}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {enabled ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy || !password}
                          onClick={() => void run("regenerate")}
                          className="min-h-11"
                        >
                          Regenerate backup codes
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={busy || !password}
                          onClick={() => void run("disable")}
                          className="min-h-11"
                        >
                          Disable two-factor
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="submit"
                        disabled={busy || !password}
                        className="min-h-11"
                      >
                        {pending ? "Preparing…" : "Set up authenticator"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={flowPending}
                      onClick={() => {
                        if (!lock.current) {
                          clearSecrets();
                          setError(null);
                        }
                      }}
                      className="min-h-11"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}
            </>
          )}
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
          {error && (
            <p id="mfa-error" role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          {refreshProblem && (
            <div className="flex flex-col items-start gap-3">
              <p role="alert" className="text-destructive text-sm">
                {committedEnabled !== null
                  ? "Your security change was saved, but we couldn’t refresh authentication settings. Retry to check the latest account state."
                  : "We couldn’t load authentication settings. Your two-factor status is unknown. Retry before making changes."}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={flowPending}
                onClick={() => void retry()}
                className="min-h-11"
              >
                {pending ? "Retrying…" : "Retry"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
