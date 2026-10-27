import Image from "next/image";
import GravityStars from "@/components/effects/gravity-stars";
import styles from "./sign-in.module.css";

/** Decorative auth-only sky; the form stays usable before the canvas loads. */
export function AuthBackground() {
  return (
    <div className={styles.background} data-auth-background aria-hidden="true">
      <div className={styles.earth}>
        <Image
          src="/images/auth-earth.avif"
          alt=""
          fill
          sizes="(max-width: 1280px) 1280px, 100vw"
          loading="eager"
          unoptimized
          fetchPriority="high"
          className={styles.earthImage}
          data-auth-earth
        />
      </div>
      <div className={styles.veil} />
      <div className={styles.sky} data-auth-stars>
        <GravityStars
          className={styles.stars}
          color="var(--planet-glow)"
          count={48}
          speed={0.06}
          starSize={1}
          glow={2.4}
          twinkle={0.08}
          tint={0}
        />
      </div>
    </div>
  );
}
