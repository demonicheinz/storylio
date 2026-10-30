import type * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex bg-surface disabled:opacity-50 px-3 py-3 border border-input aria-invalid:border-destructive focus-visible:border-ring rounded-md outline-none aria-invalid:ring-2 aria-invalid:ring-destructive/20 focus-visible:ring-2 focus-visible:ring-ring/40 w-full min-h-16 placeholder:text-muted-foreground md:text-sm text-base transition-[color,border-color,box-shadow,background-color] field-sizing-content resize-none disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
