"use client";

import { type FormEvent, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function TwoFactorSettings() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const enabled = session?.user.twoFactorEnabled === true;
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [uri, setUri] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const run = async (
    action: "enable" | "verify" | "disable" | "regenerate",
  ) => {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      if (action === "enable") {
        const result = await authClient.twoFactor.enable({ password });
        if (result.error || !result.data || result.data.method !== "totp")
          throw new Error(result.error?.message ?? "Unable to start setup.");
        setUri(result.data.totpURI);
        setCodes(result.data.backupCodes);
        setSaved(false);
        setVerified(false);
      } else if (action === "verify") {
        const result = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice: false,
        });
        if (result.error)
          throw new Error(
            "Code not accepted. Check your authenticator and try again.",
          );
        setUri(null);
        setCode("");
        setVerified(true);
        setMessage(
          "Two-factor authentication is enabled. Other sessions have been signed out.",
        );
        await refetch();
      } else if (action === "regenerate") {
        const result = await authClient.twoFactor.generateBackupCodes({
          password,
        });
        if (result.error || !result.data)
          throw new Error(result.error?.message ?? "Unable to generate codes.");
        setCodes(result.data.backupCodes);
        setSaved(false);
        setVerified(true);
        setMessage(
          "New backup codes are ready. All previous codes are invalid.",
        );
      } else {
        const result = await authClient.twoFactor.disable({ password });
        if (result.error) throw new Error(result.error.message);
        setCodes([]);
        setUri(null);
        setMessage("Two-factor authentication is disabled.");
        await refetch();
      }
      setPassword("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to complete the request. Try again.",
      );
    } finally {
      lock.current = false;
      setPending(false);
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
  if (isPending)
    return (
      <p role="status" className="text-muted-foreground text-sm">
        Loading authentication settings…
      </p>
    );
  return (
    <div className="flex flex-col gap-4" data-mfa-settings>
      <p className="text-muted-foreground text-sm">
        {enabled
          ? "Enabled. Sign in with your password, then an authenticator or backup code. GitHub and passkey sign-in are unavailable while this is enabled."
          : "Add a six-digit authenticator code after your password. Save backup codes before leaving setup."}
      </p>
      {uri ? (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-sm">
            Scan this QR code with your authenticator app, then enter its
            current code to finish setup.
          </p>
          <div className="bg-white p-4 rounded-lg w-fit max-w-full">
            <QRCode
              value={uri}
              size={176}
              title="Scan to add Storylio to your authenticator"
            />
          </div>
          <details className="text-sm">
            <summary className="py-3 cursor-pointer">
              Can’t scan? Enter the setup key manually
            </summary>
            <code className="block bg-muted p-3 rounded-lg break-all select-all">
              {new URL(uri).searchParams.get("secret")}
            </code>
          </details>
          <div className="gap-2 grid">
            <Label htmlFor="mfa-code">Authenticator code</Label>
            <Input
              id="mfa-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              disabled={pending}
              className="min-h-11"
            />
          </div>
          <Button type="submit" disabled={pending} className="w-fit min-h-11">
            {pending ? "Verifying…" : "Verify and enable"}
          </Button>
        </form>
      ) : codes.length > 0 && verified ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            Save these codes somewhere private. They are shown here only until
            you close this view.
          </p>
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
            className="w-fit min-h-11"
          >
            Download backup codes
          </Button>
          <label className="flex items-center gap-3 min-h-11 text-sm">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              className="size-4 accent-primary"
            />
            I saved my backup codes.
          </label>
          <Button
            type="button"
            className="w-fit min-h-11"
            disabled={!saved}
            onClick={() => {
              setCodes([]);
              setVerified(false);
              setSaved(false);
            }}
          >
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
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
              disabled={pending}
              className="min-h-11"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {enabled ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || !password}
                  onClick={() => void run("regenerate")}
                  className="min-h-11"
                >
                  Regenerate backup codes
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending || !password}
                  onClick={() => void run("disable")}
                  className="min-h-11"
                >
                  Disable two-factor
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                disabled={pending || !password}
                className="min-h-11"
              >
                {pending ? "Preparing…" : "Set up authenticator"}
              </Button>
            )}
          </div>
        </form>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
