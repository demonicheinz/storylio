import {
  EnvelopeIcon,
  GithubLogoIcon,
  InstagramLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { person, socialLinks } from "@/components/public/sections/about/data";
import { LanguageIntro } from "@/components/public/sections/about/language-intro";
import { Button } from "@/components/ui/button";

const icons = {
  github: GithubLogoIcon,
  instagram: InstagramLogoIcon,
  twitter: XLogoIcon,
  email: EnvelopeIcon,
};

export function BioSection() {
  return (
    <div className="flex flex-col gap-8 md:py-2">
      <div className="flex flex-col items-center md:items-start">
        <p className="mb-3 text-xs font-semibold tracking-[0.28em] text-brand-soft uppercase">
          About Heinz
        </p>
        <h1 className="text-center font-heading text-[34px] leading-none font-bold text-foreground sm:text-[48px] md:text-left md:text-[56px]">
          {person.name}
        </h1>
        <p className="mt-3 text-center text-[20px] text-brand-soft sm:text-[28px] md:text-left md:text-[32px]">
          {person.role}
        </p>

        <div className="mt-6 mb-2 flex flex-wrap justify-center gap-2 md:justify-start">
          {socialLinks.map((item) => {
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

      <LanguageIntro />
    </div>
  );
}
