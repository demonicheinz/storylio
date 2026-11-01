export const SITE_NAME = "Heinz";
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://heinz.id",
).origin;
