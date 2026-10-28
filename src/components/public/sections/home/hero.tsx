import Image from "next/image";
import { BlurText } from "@/components/common/blur-text";
import { VenomButton } from "@/components/common/venom-button";
import GravityStars from "@/components/effects/gravity-stars";
import { DEFAULT_HOME_HERO } from "@/lib/home-hero";
import { HeroEntrance } from "./hero-entrance";
import styles from "./home.module.css";

export interface HeroProps {
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  buttonLink?: string;
}
export function HeroSection({
  headline = DEFAULT_HOME_HERO.headline,
  subheadline = DEFAULT_HOME_HERO.subheadline,
  buttonText = "Selected projects",
  buttonLink = "#selected-projects",
}: HeroProps = {}) {
  return (
    <HeroEntrance className={styles.hero}>
      <div className={styles.heroVisual} aria-hidden="true">
        <Image
          src="/images/home-hero.avif"
          alt=""
          fill
          unoptimized
          preload
          className={styles.heroImage}
        />
      </div>
      <GravityStars className={styles.heroStars} color="var(--planet-glow)" />
      <div className={styles.heroContent}>
        <h1 id="home-title" className={styles.heroTitle}>
          <BlurText text={headline} />
        </h1>
        <p className={styles.heroDescription}>{subheadline}</p>
        <div className={styles.heroAction}>
          <VenomButton href={buttonLink}>{buttonText}</VenomButton>
        </div>
      </div>
    </HeroEntrance>
  );
}
