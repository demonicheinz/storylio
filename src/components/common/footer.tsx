import {
  GithubLogoIcon,
  InstagramLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { asc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { HomeFooter } from "@/components/public/sections/home/home-footer";
import { db } from "@/lib/db";

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

  return db.query.user
    .findFirst({
      columns: {
        github: true,
        instagram: true,
        twitter: true,
        publicEmail: true,
      },
      orderBy: (table) => [asc(table.createdAt)],
    })
    .then((row) => row ?? null);
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
    <HomeFooter
      year={year}
      name={copyrightName}
      socialLinks={socialLinks.map(({ href, label }) => ({ href, label }))}
      email={profile?.publicEmail}
    />
  );
}
