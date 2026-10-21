import { asc, desc } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { db } from "@/lib/db";
import { aboutContent } from "@/lib/db/schema";

export const ABOUT_CONTENT_SINGLETON_ID = "about-content";

export const aboutContentOrderBy = [
  desc(aboutContent.updatedAt),
  asc(aboutContent.id),
];

export async function getAboutContent() {
  "use cache";
  cacheLife("hours");

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
