"use client";

import { SignOutIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  actionListDashboardSessions,
  actionRevokeDashboardSession,
  actionRevokeOtherDashboardSessions,
  type DashboardSessionItem,
} from "@/features/dashboard/settings/actions";

function sessionDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SessionSettings({
  onSummaryChange,
  refreshKey = 0,
}: {
  onSummaryChange: (value: string) => void;
  refreshKey?: number;
}) {
  const [sessions, setSessions] = useState<DashboardSessionItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const otherCount = sessions?.filter((item) => !item.isCurrent).length ?? 0;
  const request = useRef(0);
  const mutationLock = useRef(false);
  const mounted = useRef(false);
  const bulkTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Both dependencies deliberately trigger a fresh server read.
    void refreshKey;
    void retry;
    const version = ++request.current;
    setLoading(true);
    const load = async () => {
      try {
        const result = await actionListDashboardSessions();
        if (request.current !== version) return;
        if (!result.success) {
          setLoadError(result.error);
        } else if (!Array.isArray(result.data)) {
          setLoadError("The session list was unavailable. Try again.");
        } else {
          setSessions(result.data);
          setLoadError(null);
        }
      } catch {
        if (request.current === version)
          setLoadError(
            "Could not load sessions. Check your connection and retry.",
          );
      } finally {
        if (request.current === version) setLoading(false);
      }
    };
    void load();
    return () => {
      request.current += 1;
    };
  }, [refreshKey, retry]);

  useEffect(() => {
    onSummaryChange(
      loading
        ? "Loading…"
        : loadError || sessions === null
          ? "Unknown"
          : String(sessions.length),
    );
  }, [loading, loadError, sessions, onSummaryChange]);

  const revoke = async (id?: string) => {
    if (mutationLock.current) return;
    if (!id) {
      const count = sessions?.filter((item) => !item.isCurrent).length ?? 0;
      if (loading || count === 0) return;
    }
    mutationLock.current = true;
    setPending(id ?? "others");
    setMutationError(null);
    try {
      const result = id
        ? await actionRevokeDashboardSession(id)
        : await actionRevokeOtherDashboardSessions();
      if (!mounted.current) return;
      if (!result.success) {
        setMutationError(result.error);
        return;
      }
      // An older in-flight list must not resurrect a revoked session.
      request.current += 1;
      setLoading(false);
      setSessions(
        (current) =>
          current?.filter((item) => (id ? item.id !== id : item.isCurrent)) ??
          null,
      );
      toast.add({
        title: id ? "Session revoked." : "Other sessions revoked.",
        type: "success",
      });
      if (!id) setConfirmOthers(false);
    } catch {
      if (mounted.current)
        setMutationError(
          "Could not revoke sessions. Check your connection and retry.",
        );
    } finally {
      mutationLock.current = false;
      if (mounted.current) setPending(null);
    }
  };

  return (
    <Card aria-label="Active sessions" className="min-w-0">
      <CardHeader className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-4">
        <div className="min-w-0">
          <CardTitle>
            <h2>Active sessions</h2>
          </CardTitle>
          <CardDescription className="mt-1">
            Review signed-in devices. Signing out other sessions keeps this
            browser signed in.
          </CardDescription>
        </div>
        <div className="shrink-0">
          <Button
            type="button"
            variant="destructive"
            ref={bulkTrigger}
            className="rounded-md min-h-11 motion-reduce:transition-none"
            disabled={
              loading || !!pending || !sessions?.some((item) => !item.isCurrent)
            }
            onClick={() => {
              setMutationError(null);
              setConfirmOthers(true);
            }}
          >
            <SignOutIcon data-icon="inline-start" aria-hidden="true" />
            {pending === "others" ? "Revoking…" : "Revoke Other Sessions"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 min-w-0">
        {loading && (
          <p role="status" className="text-muted-foreground text-sm">
            {sessions === null ? "Loading sessions…" : "Refreshing sessions…"}
          </p>
        )}
        {loadError && (
          <div className="flex flex-wrap items-center gap-2">
            <p role="alert" className="flex-1 min-w-0 text-sm wrap-anywhere">
              {loadError}
              {sessions !== null &&
                " Showing previously loaded sessions; this list may be out of date."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-md min-h-11 motion-reduce:transition-none"
              disabled={loading || !!pending}
              onClick={() => setRetry((value) => value + 1)}
            >
              Retry
            </Button>
          </div>
        )}
        {mutationError && !confirmOthers && (
          <p role="alert" className="text-destructive text-sm wrap-anywhere">
            {mutationError}
          </p>
        )}

        {sessions && sessions.length > 0 ? (
          <ul className="divide-y min-w-0">
            {sessions.map((item) => (
              <li key={item.id} className="py-3 first:pt-0 last:pb-0 min-w-0">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div className="flex-1 min-w-0 basis-40">
                    <h3 className="font-medium text-sm">
                      {item.isCurrent ? "Current session" : "Dashboard session"}
                    </h3>
                    <p className="mt-1 text-muted-foreground text-sm wrap-anywhere">
                      {item.userAgent || "Unknown browser"}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      Last active {sessionDate(item.updatedAt)}
                    </p>
                  </div>
                  {!item.isCurrent && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="hover:bg-destructive/10 rounded-md focus-visible:ring-destructive/30 min-h-11 text-destructive hover:text-destructive motion-reduce:transition-none"
                      disabled={!!pending}
                      onClick={() => revoke(item.id)}
                      aria-label={`Revoke session from ${item.userAgent || "unknown browser"}`}
                    >
                      <SignOutIcon
                        data-icon="inline-start"
                        aria-hidden="true"
                      />
                      {pending === item.id ? "Revoking…" : "Revoke session"}
                    </Button>
                  )}
                </div>
                <details className="mt-1 min-w-0 text-sm">
                  <summary className="content-center rounded-md focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 min-h-11 text-muted-foreground hover:text-foreground underline-offset-4 cursor-pointer">
                    Session details
                  </summary>
                  <dl className="gap-2 grid sm:grid-cols-3 min-w-0 text-sm">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">IP address</dt>
                      <dd className="wrap-anywhere">
                        {item.ipAddress || "Unknown"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd>{sessionDate(item.createdAt)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Expires</dt>
                      <dd>{sessionDate(item.expiresAt)}</dd>
                    </div>
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        ) : sessions !== null && !loading && !loadError ? (
          <p className="text-muted-foreground text-sm">
            No active sessions are available.
          </p>
        ) : null}
      </CardContent>
      <AlertDialog
        open={confirmOthers}
        onOpenChange={(open) => {
          if (!mutationLock.current) setConfirmOthers(open);
        }}
      >
        <AlertDialogContent
          finalFocus={bulkTrigger}
          className="motion-reduce:transition-none"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke other sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              {otherCount} other{" "}
              {otherCount === 1 ? "session is" : "sessions are"} currently
              listed. These devices will need to sign in again. This browser
              will remain signed in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {mutationError && (
            <p role="alert" className="text-destructive text-sm">
              {mutationError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!pending} className="min-h-11">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              className="min-h-11"
              disabled={loading || !!pending || otherCount === 0}
              onClick={() => revoke()}
            >
              {pending === "others"
                ? "Revoking…"
                : `Revoke ${otherCount} ${otherCount === 1 ? "session" : "sessions"}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
