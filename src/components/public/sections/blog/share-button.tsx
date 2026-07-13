"use client";

import { CheckIcon, LinkSimpleIcon, XLogoIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type ShareButtonProps = {
  title: string;
};

export function ShareButton({ title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareToX = () => {
    const url = new URL("https://twitter.com/intent/tweet");
    url.searchParams.set("text", title);
    url.searchParams.set("url", window.location.href);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="bg-surface/70 border-border/60 rounded-full"
        onClick={copyLink}
      >
        {copied ? (
          <CheckIcon data-icon="inline-start" />
        ) : (
          <LinkSimpleIcon data-icon="inline-start" />
        )}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="bg-surface/70 border-border/60 rounded-full"
        onClick={shareToX}
      >
        <XLogoIcon data-icon="inline-start" />
        Share on X
      </Button>
    </div>
  );
}
