"use client";

import { LinkIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BlogHeadingLinkProps = {
  as: "h2" | "h3";
  id?: string;
  children: ReactNode;
  className?: string;
};

export function BlogHeadingLink({
  as: Component,
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
      toast.success("Heading link copied.");
    } catch {
      toast.error("Could not copy heading link.");
    }
  };

  return (
    <Component id={id} className={cn("group/heading", className)}>
      <span className="inline wrap-break-word">{children}</span>
      {id && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="inline-flex opacity-0 group-focus-within/heading:opacity-100 group-hover/heading:opacity-100 ml-2 rounded-full transition-opacity translate-y-[-0.12em]"
          aria-label="Copy heading link"
          onClick={copyLink}
        >
          <LinkIcon />
        </Button>
      )}
    </Component>
  );
}
