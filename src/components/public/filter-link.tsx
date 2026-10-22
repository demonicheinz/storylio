"use client";

import Link, { useLinkStatus } from "next/link";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
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
    <Button
      asChild
      size="sm"
      variant={active ? "default" : "outline"}
      className="rounded-full shrink-0"
    >
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
      >
        <FilterLabel>{children}</FilterLabel>
      </Link>
    </Button>
  );
}
