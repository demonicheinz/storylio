import type * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:inline-flex bg-surface file:bg-transparent disabled:opacity-50 px-3 py-1 border border-input aria-invalid:border-destructive focus-visible:border-ring file:border-0 rounded-md outline-none aria-invalid:ring-2 aria-invalid:ring-destructive/20 focus-visible:ring-2 focus-visible:ring-ring/40 w-full min-w-0 h-9 file:h-7 max-md:min-h-11 pointer-coarse:min-h-11 file:font-medium placeholder:text-muted-foreground file:text-foreground md:text-sm file:text-sm text-base transition-[color,border-color,box-shadow,background-color] disabled:cursor-not-allowed disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
