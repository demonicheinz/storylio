import {
  EnvelopeIcon,
  GithubLogoIcon,
  InstagramLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { person, socialLinks } from "@/components/public/sections/about/data";
import {
  type AboutLanguage,
  LanguageIntro,
} from "@/components/public/sections/about/language-intro";
import { Button } from "@/components/ui/button";

const icons = {
  github: GithubLogoIcon,
  instagram: InstagramLogoIcon,
  twitter: XLogoIcon,
  email: EnvelopeIcon,
};

type ProfileBio = {
  name?: string | null;
  email?: string | null;
  tagline?: string | null;
  bio?: string | null;
  github?: string | null;
  instagram?: string | null;
  twitter?: string | null;
};

export function BioSection({
  intro,
  language,
  profile,
}: {
  intro: string;
  language: AboutLanguage;
  profile?: ProfileBio;
}) {
  const name = profile?.name ?? person.name;
  const role = profile?.tagline ?? person.role;
  const links = socialLinks.map((item) => {
    if (item.icon === "github") {
      return { ...item, link: profile?.github ?? item.link };
    }

    if (item.icon === "instagram") {
      return { ...item, link: profile?.instagram ?? item.link };
    }

    if (item.icon === "twitter") {
      return { ...item, link: profile?.twitter ?? item.link };
    }

    if (item.icon === "email" && profile?.email) {
      return { ...item, link: `mailto:${profile.email}` };
    }

    return item;
  });
  return (
    <div className="flex flex-col gap-8 md:py-2">
      <div className="flex flex-col items-center md:items-start">
        <p className="mb-3 text-xs font-semibold tracking-[0.28em] text-brand-soft uppercase">
          About Heinz
        </p>
        <h1 className="text-center font-heading text-[34px] leading-none font-bold text-foreground sm:text-[48px] md:text-left md:text-[56px]">
          {name}
        </h1>
        <p className="mt-3 text-center text-[20px] text-brand-soft sm:text-[28px] md:text-left md:text-[32px]">
          {role}
        </p>

        <div className="mt-6 mb-2 flex flex-wrap justify-center gap-2 md:justify-start">
          {links.map((item) => {
            const Icon = icons[item.icon];

            return (
              <Button
                key={item.name}
                variant="outline"
                size="sm"
                className="rounded-full border-border/60 bg-surface/70 backdrop-blur"
                asChild
              >
                <Link href={item.link} target="_blank" rel="noreferrer">
                  <Icon data-icon="inline-start" />
                  <span>{item.name}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </div>

      <LanguageIntro intro={intro} language={language} />
    </div>
  );
}
