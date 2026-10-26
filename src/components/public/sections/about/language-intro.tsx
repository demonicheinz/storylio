"use client";

import type { CSSProperties } from "react";
import GooeyNav from "@/components/common/gooey-nav";
import { introCopy } from "@/components/public/sections/about/data";
import styles from "./about.module.css";

export type AboutLanguage = keyof typeof introCopy;

const languages: {
  label: string;
  value: AboutLanguage;
}[] = [
  { label: "English", value: "en" },
  { label: "Indonesian", value: "id" },
];

export function LanguageIntro({
  intro,
  language,
}: {
  intro: string;
  language: AboutLanguage;
}) {
  return (
    <div className={styles.language}>
      <GooeyNav
        ariaLabel="Language"
        className={styles.languageNav}
        items={languages.map((item) => ({
          label: item.label,
          href: `/about?lang=${item.value}`,
        }))}
        activeIndex={languages.findIndex((item) => item.value === language)}
        scroll={false}
        color="#f2fbfe"
        activeTextColor="#000b27"
        size="sm"
        animationTime={400}
        particleCount={5}
        spread={16}
        timeVariance={100}
        gooeyness={0.3}
        wobble={0.2}
        hoverEffect={false}
        style={
          {
            "--gn-pad": "4px",
            "--gn-gap": "4px",
            "--gn-x": "16px",
            "--gn-frame": "var(--surface)",
            "--gn-frame-edge": "var(--border)",
            "--gn-frame-highlight": "transparent",
            "--gn-frame-shadow": "none",
            "--gn-ink": "var(--foreground)",
            "--gn-muted": "var(--muted-foreground)",
          } as CSSProperties
        }
      />
      <p>{intro}</p>
    </div>
  );
}
