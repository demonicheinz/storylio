"use client";

import { ArrowClockwiseIcon, HouseIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useReportError } from "@/hooks/use-report-error";
import styles from "./error-state.module.css";

export function ErrorState({
  error,
  retry,
  boundary,
  embedded = false,
}: {
  error: unknown;
  retry: () => void;
  boundary: "root" | "public" | "dashboard";
  embedded?: boolean;
}) {
  useReportError(error, boundary);
  const Container = embedded ? "section" : "main";
  return (
    <Container className={styles.page} data-error-boundary={boundary}>
      <div className={styles.content}>
        <h1>This page couldn’t load.</h1>
        <p>
          The problem may be temporary. Try again, or return{" "}
          {embedded ? "to the dashboard" : "home"}.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={retry}>
            <ArrowClockwiseIcon size={18} aria-hidden="true" />
            Try again
          </button>
          <Link
            href={embedded ? "/dashboard" : "/"}
            className={styles.secondary}
          >
            <HouseIcon size={18} aria-hidden="true" />
            {embedded ? "Dashboard overview" : "Back to home"}
          </Link>
        </div>
      </div>
    </Container>
  );
}
