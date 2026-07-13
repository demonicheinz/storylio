"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer after:absolute relative after:-inset-x-3 after:-inset-y-2 flex justify-center items-center bg-input/90 data-checked:bg-primary dark:data-checked:bg-primary disabled:opacity-50 group-has-disabled/field:opacity-50 border border-transparent data-checked:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive focus-visible:border-ring dark:aria-invalid:border-destructive/50 rounded-[5px] outline-none aria-invalid:ring-3 aria-invalid:ring-destructive/20 focus-visible:ring-3 focus-visible:ring-ring/30 dark:aria-invalid:ring-destructive/40 size-4 data-checked:text-primary-foreground transition-shadow disabled:cursor-not-allowed shrink-0",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="place-content-center grid [&>svg]:size-3.5 text-current transition-none"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
