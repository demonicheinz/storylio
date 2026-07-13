import type * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex bg-input/50 disabled:opacity-50 px-3 py-3 border border-transparent aria-invalid:border-destructive focus-visible:border-ring dark:aria-invalid:border-destructive/50 rounded-2xl outline-none aria-invalid:ring-3 aria-invalid:ring-destructive/20 focus-visible:ring-3 focus-visible:ring-ring/30 dark:aria-invalid:ring-destructive/40 w-full min-h-16 placeholder:text-muted-foreground md:text-sm text-base transition-[color,box-shadow,background-color] field-sizing-content resize-none disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
