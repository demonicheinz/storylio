import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { homeSection } from "@/lib/db/schema";
import { HOME_HERO_ID } from "@/lib/home-hero";

/** A singleton Home section stores the headline; profile.bio remains subheadline. */
export async function saveHomeHeadline(
  db: Pick<Database, "insert" | "delete">,
  headline: string,
) {
  if (!headline.trim()) {
    await db.delete(homeSection).where(eq(homeSection.id, HOME_HERO_ID));
    return;
  }
  await db
    .insert(homeSection)
    .values({
      id: HOME_HERO_ID,
      type: "HERO",
      label: headline.trim(),
      order: 0,
    })
    .onConflictDoUpdate({
      target: homeSection.id,
      set: { label: headline.trim(), type: "HERO" },
    });
}
