"use client";

import {
  GithubLogoIcon,
  InstagramLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface FooterProps {
  copyrightName?: string;
  copyrightYear?: string | number;
  showSocialMedia?: boolean;
  className?: string;
}

export function Footer({
  copyrightName = "Heinz",
  copyrightYear,
  showSocialMedia = true,
  className = "",
}: FooterProps) {
  const year = copyrightYear || 2026;
  const socialLinks = [
    {
      href: "https://github.com/demonicheinz/",
      icon: GithubLogoIcon,
      label: "GitHub",
    },
    {
      href: "https://instagram.com/im.heinzzz/",
      icon: InstagramLogoIcon,
      label: "Instagram",
    },
    {
      href: "https://x.com/chrysantastixxx/",
      icon: XLogoIcon,
      label: "X",
    },
  ];

  return (
    <footer
      className={cn(
        "w-full border-t bg-background/80 py-6 backdrop-blur-md md:py-8",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-2 md:gap-6">
          <div className="flex h-full items-center justify-center md:justify-start">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {year} {copyrightName}. All rights reserved.
            </p>
          </div>

          {showSocialMedia && (
            <div className="flex h-full items-center justify-center gap-3 md:justify-end">
              {socialLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                >
                  <item.icon className="size-5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
