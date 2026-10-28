import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./section-heading.module.css";

export function SectionHeading({
  children,
  className,
  action,
  size = "section",
  ...props
}: ComponentProps<"h2"> & {
  action?: ReactNode;
  size?: "section" | "compact";
}) {
  return (
    <h2
      {...props}
      className={cn(
        styles.heading,
        size === "compact" && styles.compact,
        className,
      )}
      data-section-heading
      data-heading-size={size}
      data-heading-action={action ? "" : undefined}
    >
      <span className={styles.label}>{children}</span>
      {action}
    </h2>
  );
}
