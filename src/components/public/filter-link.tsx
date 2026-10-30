"use client";

import Link, { useLinkStatus } from "next/link";
import { type ReactNode, useState } from "react";
import styles from "@/components/public/public-page.module.css";
import { cn } from "@/lib/utils";

function FilterLabel({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();

  return (
    <span aria-busy={pending} className={cn(pending && "opacity-70")}>
      {children}
    </span>
  );
}

export function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  const [intent, setIntent] = useState(false);

  return (
    <Link
      href={href}
      prefetch={!active && intent}
      scroll={false}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setIntent(true)}
      onFocus={() => setIntent(true)}
      onNavigate={(event) => {
        if (active) event.preventDefault();
      }}
      className={styles.filter}
    >
      <FilterLabel>{children}</FilterLabel>
    </Link>
  );
}
