import {
  GithubLogoIcon,
  InstagramLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export interface FooterProps {
  copyrightName?: string;
  copyrightYear?: string | number;
  showSocialMedia?: boolean;
  className?: string;
}

async function getSocialProfile() {
  "use cache";
  cacheLife("hours");
  cacheTag("public-profile");

  return db.user.findFirst({
    select: {
      github: true,
      instagram: true,
      twitter: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

async function getCurrentYear() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 7200 });

  return new Date().getFullYear();
}

export async function Footer({
  copyrightName = "Heinz",
  copyrightYear,
  showSocialMedia = true,
  className = "",
}: FooterProps) {
  const [year, profile] = await Promise.all([
    copyrightYear ?? getCurrentYear(),
    showSocialMedia ? getSocialProfile() : null,
  ]);
  const socialLinks = [
    {
      href: profile?.github,
      icon: GithubLogoIcon,
      label: "GitHub",
    },
    {
      href: profile?.instagram,
      icon: InstagramLogoIcon,
      label: "Instagram",
    },
    {
      href: profile?.twitter,
      icon: XLogoIcon,
      label: "X",
    },
  ].filter((item): item is typeof item & { href: string } =>
    Boolean(item.href),
  );

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

          {showSocialMedia && socialLinks.length > 0 && (
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
