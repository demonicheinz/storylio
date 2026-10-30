"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { confirmAction } from "@/features/dashboard/shared/confirmation";
import { authClient } from "@/lib/auth-client";

type Passkey = NonNullable<
  ReturnType<typeof authClient.useListPasskeys>["data"]
>[number];
type MutationResult = { error?: { message?: string } | null };
type SavePasskey = (name: string) => Promise<string | null>;
const controlClass = "min-h-11 rounded-md motion-reduce:transition-none";

export function PasskeySettings({
  mfaEnabled,
  authUnavailable = false,
}: {
  mfaEnabled: boolean;
  authUnavailable?: boolean;
}) {
  const {
    data: passkeys,
    isPending,
    isRefetching,
    error: listError,
    refetch,
  } = authClient.useListPasskeys();
  const loading = isPending || isRefetching;
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const loadError =
    refreshError ||
    listError?.message ||
    (listError ? "Could not load passkeys. Try again." : null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const mutationLock = useRef(false);
  const mounted = useRef(false);
  const canAdd = mfaEnabled === false && !authUnavailable;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refreshPasskeys = async () => {
    setRefreshError(null);
    try {
      // The installed hook returns Promise<void>; returned fetch errors are
      // published through its reactive error state, not the promise result.
      await refetch();
    } catch {
      if (mounted.current)
        setRefreshError(
          "Could not refresh passkeys. Check your connection and retry.",
        );
    }
  };

  const mutate = async (
    write: () => Promise<MutationResult>,
    successMessage: string,
    fallback: string,
  ): Promise<string | null> => {
    if (mutationLock.current) return "A passkey update is already in progress.";
    mutationLock.current = true;
    setPending(true);
    setMutationError(null);
    try {
      const result = await write();
      if (result.error) return result.error.message || fallback;
      if (!mounted.current) return null;
      toast.add({ title: successMessage, type: "success" });
      // Refresh errors belong to the list; the completed write stays successful.
      await refreshPasskeys();
      return null;
    } catch (error) {
      return error instanceof Error && error.message ? error.message : fallback;
    } finally {
      mutationLock.current = false;
      if (mounted.current) setPending(false);
    }
  };

  return (
    <Card aria-label="Manage passkeys" className="min-w-0">
      <CardHeader className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-4">
        <div className="min-w-0">
          <CardTitle>
            <h2>Passkeys</h2>
          </CardTitle>
          <CardDescription className="mt-1">
            Use biometric or security keys for faster, secure sign-ins.
          </CardDescription>
        </div>
        <div className="shrink-0">
          <AddPasskeyDialog
            disabled={!canAdd || pending || loading}
            onSave={(name) => {
              if (!canAdd)
                return Promise.resolve(
                  "Confirm two-factor authentication is turned off before adding a passkey.",
                );
              return mutate(
                () =>
                  authClient.passkey.addPasskey({
                    name: name || `Passkey ${new Date().toLocaleDateString()}`,
                  }),
                "Passkey added successfully.",
                "Failed to add passkey. Try again.",
              );
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 min-w-0">
        {authUnavailable || typeof mfaEnabled !== "boolean" ? (
          <p role="status" className="text-sm">
            Your two-factor status is unknown. Adding passkeys is unavailable
            until it can be confirmed. You can still rename or delete stored
            keys.
          </p>
        ) : mfaEnabled ? (
          <p className="text-sm">
            Stored passkeys cannot be used to sign in while two-factor
            authentication is enabled. You can rename or delete them. Turn off
            two-factor authentication before adding a passkey.
          </p>
        ) : null}

        {loading && (
          <p role="status" className="text-muted-foreground text-sm">
            {passkeys === null ? "Loading passkeys…" : "Refreshing passkeys…"}
          </p>
        )}
        {loadError && (
          <div className="flex flex-wrap items-center gap-2">
            <p role="alert" className="flex-1 min-w-0 text-sm wrap-anywhere">
              {loadError}
              {passkeys !== null &&
                " Showing previously loaded passkeys; this list may be out of date."}
            </p>
            <Button
              type="button"
              variant="outline"
              className={controlClass}
              disabled={loading || pending}
              onClick={refreshPasskeys}
            >
              Retry
            </Button>
          </div>
        )}
        {mutationError && (
          <p role="alert" className="text-destructive text-sm wrap-anywhere">
            {mutationError}
          </p>
        )}

        {passkeys && passkeys.length > 0 ? (
          <ul className="divide-y min-w-0">
            {passkeys.map((passkey) => (
              <li
                key={passkey.id}
                className="flex flex-wrap items-center gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex-1 min-w-0 basis-40">
                  <h3 className="font-medium text-sm wrap-anywhere">
                    {passkey.name || "Unnamed passkey"}
                  </h3>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Added{" "}
                    {new Date(passkey.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <EditPasskeyDialog
                    passkey={passkey}
                    disabled={pending || loading}
                    onSave={(name) =>
                      mutate(
                        () =>
                          authClient.passkey.updatePasskey({
                            id: passkey.id,
                            name,
                          }),
                        "Passkey renamed successfully.",
                        "Failed to rename passkey. Try again.",
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    className={controlClass}
                    disabled={pending || loading}
                    aria-label={`Delete ${passkey.name || "unnamed passkey"}`}
                    onClick={async () => {
                      if (mutationLock.current || pending || loading) return;
                      if (
                        !(await confirmAction(
                          `Delete passkey "${passkey.name || "Unnamed passkey"}"? You will need to register it again to use it for sign-in. Other sign-in methods will not be changed.`,
                          {
                            title: "Delete passkey?",
                            confirmLabel: "Delete passkey",
                            cancelLabel: "Cancel",
                          },
                        ))
                      )
                        return;
                      if (
                        !mounted.current ||
                        mutationLock.current ||
                        pending ||
                        loading
                      )
                        return;
                      const error = await mutate(
                        () =>
                          authClient.passkey.deletePasskey({ id: passkey.id }),
                        "Passkey deleted successfully.",
                        "Failed to delete passkey. Try again.",
                      );
                      if (mounted.current && error) setMutationError(error);
                    }}
                  >
                    <TrashIcon data-icon="inline-start" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : passkeys !== null && !loading && !loadError ? (
          <p className="text-muted-foreground text-sm">
            No passkeys registered yet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AddPasskeyDialog(props: { disabled: boolean; onSave: SavePasskey }) {
  return <PasskeyNameDialog {...props} mode="add" />;
}

function EditPasskeyDialog({
  passkey,
  ...props
}: {
  passkey: Passkey;
  disabled: boolean;
  onSave: SavePasskey;
}) {
  return (
    <PasskeyNameDialog
      {...props}
      mode="rename"
      initialName={passkey.name || ""}
    />
  );
}

function PasskeyNameDialog({
  mode,
  initialName = "",
  disabled,
  onSave,
}: {
  mode: "add" | "rename";
  initialName?: string;
  disabled: boolean;
  onSave: SavePasskey;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const inputId = useId();
  const adding = mode === "add";
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (lock.current || disabled || (!adding && !name.trim())) return;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const failure = await onSave(name.trim());
      if (failure) {
        setError(failure);
      } else {
        setOpen(false);
        if (adding) setName("");
      }
    } catch {
      setError("Could not save this passkey. Please try again.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (lock.current) return;
        if (value) {
          setName(initialName);
          setError(null);
        }
        setOpen(value);
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={adding ? "outline" : "ghost"}
            className={`${controlClass} w-fit`}
            disabled={disabled || pending}
          />
        }
      >
        {adding ? "Add Passkey" : "Rename"}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="rounded-xl motion-reduce:transition-none"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={submit}
          aria-busy={pending}
        >
          <DialogHeader>
            <DialogTitle>
              {adding ? "Add New Passkey" : "Rename Passkey"}
            </DialogTitle>
            <DialogDescription>
              {adding
                ? "Name the device or security key so you can recognize it later. Your browser will ask you to create a passkey."
                : "Choose a name that helps you recognize this device or security key."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>Passkey name</Label>
            <Input
              id={inputId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={pending}
              aria-invalid={!!error}
              aria-describedby={error ? `${inputId}-error` : undefined}
              className={controlClass}
            />
            {error && (
              <p
                id={`${inputId}-error`}
                role="alert"
                className="text-destructive text-sm wrap-anywhere"
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className={controlClass}
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={controlClass}
              disabled={disabled || pending || (!adding && !name.trim())}
            >
              {pending ? "Saving…" : adding ? "Save Passkey" : "Save name"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
