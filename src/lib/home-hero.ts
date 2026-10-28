export const HOME_HERO_ID = "home-hero";
export const DEFAULT_HOME_HERO = {
  headline: "I’m Heinz. I build web apps.",
  subheadline:
    "A full stack web developer based in Central Java, Indonesia. Here you’ll find my projects and the decisions behind them.",
};

/** The existing profile bio is the subheadline; empty content uses the default. */
export function resolveHomeHero(headline?: string | null, bio?: string | null) {
  return {
    headline: headline?.trim() || DEFAULT_HOME_HERO.headline,
    subheadline: bio?.trim() || DEFAULT_HOME_HERO.subheadline,
  };
}
