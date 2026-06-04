"use client";

import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { actionReorderProjects } from "@/app/(dashboard)/dashboard/actions/project-actions";
import { Button } from "@/components/ui/button";

type ProjectReorderButtonProps = {
  direction: "up" | "down";
  disabled?: boolean;
  updates: Array<{
    id: string;
    order: number;
  }>;
};

export function ProjectReorderButton({
  direction,
  disabled,
  updates,
}: ProjectReorderButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const Icon = direction === "up" ? ArrowUpIcon : ArrowDownIcon;

  const handleClick = () => {
    startTransition(async () => {
      const result = await actionReorderProjects(updates);

      if (result.success) {
        toast.success(result.message ?? "Project order updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="size-8"
      onClick={handleClick}
      disabled={disabled || isPending}
      aria-label={direction === "up" ? "Move project up" : "Move project down"}
    >
      <Icon />
    </Button>
  );
}
