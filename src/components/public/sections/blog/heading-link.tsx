"use client";

import { LinkIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type BlogHeadingLinkProps = {
  as: "h2" | "h3";
  id?: string;
  children: ReactNode;
  className?: string;
};

export function BlogHeadingLink({
  as,
  id,
  children,
  className,
}: BlogHeadingLinkProps) {
  const copyLink = async () => {
    if (!id) {
      return;
    }

    const url = `${window.location.origin}${window.location.pathname}#${id}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.add({ title: "Heading link copied.", type: "success" });
    } catch {
      toast.add({ title: "Could not copy heading link.", type: "error" });
    }
  };

  const action = id ? (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "inline-flex opacity-0 group-focus-within/heading:opacity-100 group-hover/heading:opacity-100 rounded-full transition-opacity translate-y-[-0.12em]",
        as === "h3" && "ml-2",
      )}
      aria-label="Copy heading link"
      data-heading-link
      onClick={copyLink}
    >
      <LinkIcon />
    </Button>
  ) : null;

  if (as === "h2") {
    return (
      <SectionHeading
        id={id}
        className={cn("group/heading", className)}
        action={action}
      >
        {children}
      </SectionHeading>
    );
  }

  return (
    <h3 id={id} className={cn("group/heading", className)}>
      <span className="inline wrap-break-word">{children}</span>
      {action}
    </h3>
  );
}
