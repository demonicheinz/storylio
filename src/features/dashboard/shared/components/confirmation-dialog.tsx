"use client";

import { usePathname } from "next/navigation";
import { Suspense, useLayoutEffect, useRef, useSyncExternalStore } from "react";
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
import { confirmationController } from "../confirmation";

function ConfirmationDialog() {
  const pathname = usePathname();
  const request = useSyncExternalStore(
    confirmationController.subscribe,
    confirmationController.getSnapshot,
    () => null,
  );
  const previous = useRef(request);
  if (request) previous.current = request;
  const shown = request ?? previous.current;
  const cancel = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => confirmationController.mount(), []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: A route change must cancel any pending request owned by the previous screen.
  useLayoutEffect(() => () => confirmationController.cancel(), [pathname]);
  return (
    <AlertDialog
      key={shown?.id ?? "initial"}
      open={request?.open ?? false}
      onOpenChange={(open) => {
        if (!open) confirmationController.close(false);
      }}
      onOpenChangeComplete={(open) => {
        if (!open) confirmationController.finish();
      }}
    >
      <AlertDialogContent
        initialFocus={cancel}
        finalFocus={() => (shown?.opener?.isConnected ? shown.opener : true)}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {shown?.options.title ?? "Discard unsaved changes?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="max-h-[50dvh] overflow-y-auto wrap-anywhere">
            {shown?.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancel}>
            {shown?.options.cancelLabel ?? "Keep editing"}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={
              shown?.options.destructive === false ? "default" : "destructive"
            }
            onClick={() => confirmationController.close(true)}
          >
            {shown?.options.confirmLabel ?? "Discard changes"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DashboardConfirmationHost() {
  return (
    <Suspense fallback={null}>
      <ConfirmationDialog />
    </Suspense>
  );
}
