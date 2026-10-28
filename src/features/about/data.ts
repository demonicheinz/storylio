import { asc, desc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { aboutContent } from "@/lib/db/schema";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

export const ABOUT_CONTENT_SINGLETON_ID = "about-content";

export const aboutContentOrderBy = [
  desc(aboutContent.updatedAt),
  asc(aboutContent.id),
];

export async function getAboutContent() {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_CACHE_TAGS.about);

  return getAboutContentUncached();
}

export async function getAboutContentUncached() {
  return db.query.aboutContent
    .findFirst({
      orderBy: aboutContentOrderBy,
      columns: {
        introEn: true,
        introId: true,
        howIWorkEn: true,
        howIWorkId: true,
        whatIValueEn: true,
        whatIValueId: true,
        defaultLanguage: true,
      },
    })
    .then((row) => row ?? null);
}
