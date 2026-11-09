export const SITE_NAME = "Heinz";
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://heinz.id",
).origin;

export const ABOUT_LANGUAGE_PATHS = {
  en: "/about?lang=en",
  id: "/about?lang=id",
  "x-default": "/about",
} as const;
