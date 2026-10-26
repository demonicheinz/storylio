import {
  EnvelopeIcon,
  GithubLogoIcon,
  InstagramLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import page from "@/components/public/public-page.module.css";
import { person, socialLinks } from "@/components/public/sections/about/data";
import {
  type AboutLanguage,
  LanguageIntro,
} from "@/components/public/sections/about/language-intro";
import styles from "./about.module.css";

const icons = {
  github: GithubLogoIcon,
  instagram: InstagramLogoIcon,
  twitter: XLogoIcon,
  email: EnvelopeIcon,
};

type ProfileBio = {
  name?: string | null;
  publicEmail?: string | null;
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

    if (item.icon === "email" && profile?.publicEmail) {
      return { ...item, link: `mailto:${profile.publicEmail}` };
    }

    return item;
  });
  return (
    <div className={styles.bio}>
      <div>
        <h1 id="page-title" className={page.title}>
          {name}
        </h1>
        <p className={styles.role}>{role}</p>

        <div className={styles.socials}>
          {links.map((item) => {
            const Icon = icons[item.icon];

            return (
              <Link
                key={item.name}
                className={page.link}
                href={item.link}
                target="_blank"
                rel="noreferrer"
              >
                <Icon data-icon="inline-start" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <LanguageIntro intro={intro} language={language} />
    </div>
  );
}
