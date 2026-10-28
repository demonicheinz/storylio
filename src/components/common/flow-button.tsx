import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import styles from "./flow-button.module.css";

export function FlowButton({
  children,
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={cn(styles.button, className)} data-flow-button>
      <span className={styles.sweep} aria-hidden="true" />
      <ArrowRightIcon
        size={16}
        className={styles.enteringArrow}
        aria-hidden="true"
      />
      <span className={styles.label}>{children}</span>
      <ArrowRightIcon
        size={16}
        className={styles.leavingArrow}
        aria-hidden="true"
      />
    </Link>
  );
}
