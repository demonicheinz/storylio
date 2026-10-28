import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { post, postToTag, tag } from "@/lib/db/schema";
import { HOME_NOTES_TAG } from "@/lib/home-content";

/** Notes grounded in this site's implemented decisions, with no invented results. */
export const storylioNotes = [
  {
    title: "Keeping the hero image sharp",
    slug: "storylio-notes-keeping-the-hero-image-sharp",
    excerpt:
      "The planet image already sets the mood. Keeping its original AVIF and adding a separate navy overlay preserves detail while making the text easier to read.",
    content: [
      "The hero starts with the supplied planet image. Its horizon, light and astronaut already give the page its visual direction.",
      "The image is served as the original 2560 × 1441 AVIF. A separate navy overlay dims it behind the text, and a gradient at the bottom joins it to the page background. Dimming the overlay keeps the source image intact.",
      "The crop still matters. On a narrow screen, the image has to lose some of its sides to fill the hero. Preserving the original file avoids another lossy encode, but it does not remove the limits of the source resolution or the mobile crop.",
    ].join("\n\n"),
  },
  {
    title: "A button that stays ready",
    slug: "storylio-notes-a-button-that-stays-ready",
    excerpt:
      "The Venom effect takes time to prepare. A readable link stays available during loading, then hands over to the full-size animated button.",
    content: [
      "The Venom button adds material and movement to the hero, but preparing its shaders, cursor textures and font takes work. The link needs to be usable while that happens.",
      "A navy CSS button carries the text from the start. A thin blue light travels around its edge until the first complete WebGL frame is ready. The transition keeps the button at its normal size instead of making visitors wait through a growing entrance.",
      "Scrolling away pauses the scene. Returning resumes the same scene with the label visible. Touch devices, reduced motion and unavailable WebGL keep the regular link, which now leads to the selected projects on this page.",
    ].join("\n\n"),
  },
  {
    title: "Giving the stack one row",
    slug: "storylio-notes-giving-the-stack-one-row",
    excerpt:
      "Six logos on desktop, four on tablet and three on mobile. A staggered wipe gives the remaining tools a turn while keeping the section's height steady.",
    content: [
      "The tech stack is a short introduction to the tools behind the work. Keeping it to one row gives it a defined place between the approach and the writing.",
      "The row holds six logos on desktop, four on tablet and three on mobile. Extra entries rotate through groups with a staggered wipe. The last group shares a few entries with the previous group when needed, so it stays filled.",
      "Hovering or focusing the row pauses the rotation. Swipe and keyboard navigation still reach the other tools when reduced motion is enabled. Technology categories, display order and Home visibility are controlled through the dashboard, so adding a tool does not require changing a list in the component.",
    ].join("\n\n"),
  },
] as const;

/** Create-only: repeated runs never republish drafts, retag or overwrite edits. */
export async function seedNotes({
  db,
  ownerId,
}: {
  db: Database;
  ownerId: string;
}) {
  const result = await db.transaction(async (tx) => {
    let created = 0;
    for (const note of storylioNotes) {
      const [inserted] = await tx
        .insert(post)
        .values({
          ...note,
          authorId: ownerId,
          status: "PUBLISHED",
          publishedAt: new Date(),
        })
        .onConflictDoNothing({ target: post.slug })
        .returning({ id: post.id });
      if (!inserted) continue;
      await tx
        .insert(tag)
        .values({ name: HOME_NOTES_TAG })
        .onConflictDoNothing({ target: tag.name });
      const notesTag = await tx.query.tag.findFirst({
        where: eq(tag.name, HOME_NOTES_TAG),
        columns: { id: true },
      });
      if (!notesTag) throw new Error("Notes tag was not created");
      await tx
        .insert(postToTag)
        .values({ postId: inserted.id, tagId: notesTag.id });
      created++;
    }
    return { created, skipped: storylioNotes.length - created };
  });
  console.log(
    `Storylio notes: ${result.created} created, ${result.skipped} existing posts preserved.`,
  );
  return result;
}
