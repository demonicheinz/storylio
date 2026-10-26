"use client";

import { InPageLink } from "@/components/common/in-page-link";
import { useActiveSection } from "@/hooks/use-active-section";
import styles from "./about.module.css";

export interface SideNavItem {
  title: {
    en: string;
    id: string;
  };
  href: string;
  id: string;
}

export const sideNavItems: SideNavItem[] = [
  {
    title: { en: "Introduction", id: "Perkenalan" },
    href: "#introduction",
    id: "introduction",
  },
  {
    title: { en: "Working Principles", id: "Prinsip Kerja" },
    href: "#working-principles",
    id: "working-principles",
  },
  {
    title: { en: "Work Experience", id: "Pengalaman Kerja" },
    href: "#work-experience",
    id: "work-experience",
  },
  {
    title: { en: "Education History", id: "Riwayat Pendidikan" },
    href: "#education-history",
    id: "education-history",
  },
  {
    title: { en: "Technical Skills", id: "Keahlian Teknis" },
    href: "#technical-skills",
    id: "technical-skills",
  },
];

const sectionIds = sideNavItems.map((item) => item.id);

export function AboutSideNavigation({ language }: { language: "en" | "id" }) {
  const activeId = useActiveSection(sectionIds, "position");
  return (
    <nav
      className={styles.sidebarNav}
      aria-label={language === "id" ? "Di halaman ini" : "On this page"}
    >
      <ul>
        {sideNavItems.map((item) => (
          <li key={item.id}>
            <InPageLink
              href={`#${item.id}`}
              aria-current={activeId === item.href ? "location" : undefined}
            >
              {item.title[language]}
            </InPageLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
