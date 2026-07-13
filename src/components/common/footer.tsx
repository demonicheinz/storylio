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
        "bg-background/80 backdrop-blur-md py-6 md:py-8 border-t w-full",
        className,
      )}
    >
      <div className="mx-auto px-4 max-w-6xl">
        <div className="items-center gap-4 md:gap-6 grid grid-cols-1 md:grid-cols-2">
          <div className="flex justify-center md:justify-start items-center h-full">
            <p className="text-muted-foreground text-sm md:text-left text-center">
              &copy; {year} {copyrightName}. All rights reserved.
            </p>
          </div>

          {showSocialMedia && socialLinks.length > 0 && (
            <div className="flex justify-center md:justify-end items-center gap-3 h-full">
              {socialLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
