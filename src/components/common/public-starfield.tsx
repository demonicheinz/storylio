"use client";

import { usePathname } from "next/navigation";
import GravityStars from "@/components/effects/gravity-stars";
import styles from "./public-chrome.module.css";

export function PublicStarfield() {
  const pathname = usePathname();
  if (!/^\/(about|projects|blog|gallery)(\/|$)/.test(pathname)) return null;

  return (
    <div className={styles.starfield} data-public-starfield aria-hidden="true">
      <GravityStars
        className={styles.stars}
        color="var(--planet-glow)"
        count={56}
        speed={0.1}
        starSize={0.9}
        glow={2.4}
        tint={0.08}
        twinkle={0.12}
      />
    </div>
  );
}
