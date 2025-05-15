import type { badgeVariants } from "@/data";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

/**
 * Props for the Badge component
 */
export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  /**
   * When true, badge will be rendered as a child component
   */
  asChild?: boolean;
}
