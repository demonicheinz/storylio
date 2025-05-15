import { buttonVariants } from "@/data";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "@/types/ui";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

/**
 * Button component with various style variants and sizes
 */
function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
