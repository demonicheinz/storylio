"use client";

import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { FooterProps } from "@/types/ui";

export function Footer({
  copyrightName = "Storylio",
  copyrightYear,
  showSocialMedia = true,
  className = "",
}: FooterProps) {
  const year = copyrightYear || new Date().getFullYear();

  return (
    <footer
      className={cn(
        "w-full py-6 md:py-8 bg-background-secondary backdrop-blur-md border-t border-border",
        className,
      )}
    >
      <div className="mx-auto px-4 max-w-6xl">
        <div className="flex flex-col space-y-6">
          {/* Social Media - Muncul paling atas pada layar kecil, bersebelahan */}
          <div className="md:hidden flex justify-center items-center gap-4">
            {showSocialMedia && (
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Icon
                    name="github"
                    size={18}
                  />
                </a>
                <a
                  href="https://instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Icon
                    name="instagram"
                    size={18}
                  />
                </a>
                <a
                  href="https://twitter.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Icon
                    name="twitter"
                    size={18}
                  />
                </a>
              </div>
            )}
          </div>

          {/* 2 kolom layout untuk desktop, stack pada mobile */}
          <div className="items-center gap-4 md:gap-6 grid grid-cols-1 md:grid-cols-2">
            {/* Kolom 1: Copyright */}
            <div className="flex justify-center md:justify-start items-center h-full">
              <p className="text-muted-foreground text-sm md:text-left text-center">
                &copy; {year} {copyrightName}. All rights reserved.
              </p>
            </div>

            {/* Kolom 2: Social Media - hanya tampil pada layar medium ke atas */}
            <div className="hidden md:flex justify-end items-center gap-4 h-full">
              {showSocialMedia && (
                <>
                  <a
                    href="https://github.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Icon
                      name="github"
                      size={18}
                    />
                  </a>
                  <a
                    href="https://instagram.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Icon
                      name="instagram"
                      size={18}
                    />
                  </a>
                  <a
                    href="https://twitter.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Icon
                      name="twitter"
                      size={18}
                    />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
