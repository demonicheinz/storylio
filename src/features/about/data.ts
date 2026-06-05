import { cacheLife } from "next/cache";
import { db } from "@/lib/db";

export const ABOUT_CONTENT_SINGLETON_ID = "about-content";

export const aboutContentOrderBy = [
  { updatedAt: "desc" as const },
  { id: "asc" as const },
];

export async function getAboutContent() {
  "use cache";
  cacheLife("hours");

  return db.aboutContent.findFirst({
    orderBy: aboutContentOrderBy,
    select: {
      introEn: true,
      introId: true,
      howIWorkEn: true,
      howIWorkId: true,
      whatIValueEn: true,
      whatIValueId: true,
      defaultLanguage: true,
    },
  });
}
