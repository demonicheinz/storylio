import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/common/logo";
import GravityStars from "@/components/effects/gravity-stars";
import styles from "./space-state.module.css";

type SpaceStateProps = {
  title?: string;
  description?: string;
  archive?: { href: string; label: string };
  branded?: boolean;
};

/** Shared public 404 artwork; routing decides the status before this renders. */
export function SpaceState({
  title = "Lost in orbit.",
  description = "This page doesn’t exist, or it may have moved.",
  archive,
  branded = false,
}: SpaceStateProps) {
  return (
    <main
      className={styles.page}
      data-space-state
      aria-labelledby="missing-title"
    >
      {branded && (
        <Link href="/" className={styles.logo} aria-label="Storylio home">
          <Logo size={32} loading="eager" />
        </Link>
      )}
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.earth}>
          <Image
            src="/images/auth-earth.avif"
            alt=""
            fill
            unoptimized
            loading="eager"
            className={styles.earthImage}
          />
        </div>
        <div className={styles.veil} />
        <GravityStars
          className={styles.stars}
          color="var(--planet-glow)"
          count={48}
          speed={0.06}
          starSize={1}
          glow={2.4}
          tint={0}
          twinkle={0.08}
        />
      </div>
      <section className={styles.content}>
        <div className={styles.art} aria-hidden="true">
          <span className={styles.code}>404</span>
          <div className={styles.astronaut}>
            <div className={styles.crop}>
              <Image
                src="/images/404-astronaut.avif"
                alt=""
                width={2728}
                height={1536}
                unoptimized
                loading="eager"
                className={styles.astronautImage}
                data-astronaut
              />
            </div>
          </div>
        </div>
        <div className={styles.message}>
          <h1 id="missing-title">
            <span className="sr-only">404: </span>
            {title}
          </h1>
          <p>{description}</p>
        </div>
        <div className={styles.actions}>
          <Link href="/" className={styles.primary}>
            <ArrowLeftIcon size={18} aria-hidden="true" />
            Back to home
          </Link>
          {archive && (
            <Link href={archive.href} className={styles.secondary}>
              {archive.label}
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
