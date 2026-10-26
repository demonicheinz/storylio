"use client";

import Link from "next/link";
import page from "@/components/public/public-page.module.css";
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
      <nav aria-label="Language" className={styles.languageNav}>
        {languages.map((item) => {
          const isActive = language === item.value;

          return (
            <Link
              key={item.value}
              className={page.filter}
              href={`/about?lang=${item.value}`}
              prefetch={true}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p>{intro}</p>
    </div>
  );
}
