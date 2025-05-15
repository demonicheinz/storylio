import type { buttonVariants } from "@/data";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

/**
 * Props for the Button component
 */
export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /**
   * When true, button will be rendered as a child component
   */
  asChild?: boolean;
}
