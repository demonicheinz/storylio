"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { actionDeleteProject } from "@/features/dashboard/projects/actions";

type ProjectDeleteButtonProps = {
  projectId: string;
  title: string;
  trigger?: ReactElement;
  triggerNativeButton?: boolean;
};

export function ProjectDeleteButton({
  projectId,
  title,
  trigger,
  triggerNativeButton = true,
}: ProjectDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await actionDeleteProject(projectId);

      if (result.success) {
        toast.add({
          title: result.message ?? "Project deleted.",
          type: "success",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast.add({ title: result.error, type: "error" });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        nativeButton={triggerNativeButton}
        render={
          trigger ?? (
            <Button type="button" size="sm" variant="destructive">
              <TrashIcon data-icon="inline-start" />
              Delete
            </Button>
          )
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <span className="font-medium text-foreground">{title}</span>. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
