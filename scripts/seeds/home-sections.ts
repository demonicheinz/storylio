import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { homeSection } from "@/lib/db/schema";

export async function seedHomeSections(db: Database) {
  const phases = await db.query.homeSection.findFirst({
    where: eq(homeSection.type, "PHASE"),
    columns: { id: true },
  });
  if (!phases) {
    await db.insert(homeSection).values([
      {
        type: "PHASE",
        label: "Discovery",
        content:
          "Understanding your vision, goals, and requirements through collaborative discussion.",
        order: 1,
      },
      {
        type: "PHASE",
        label: "Design & Build",
        content:
          "Crafting beautiful, performant solutions with modern technologies and best practices.",
        order: 2,
      },
      {
        type: "PHASE",
        label: "Launch & Support",
        content:
          "Deploying to production with ongoing maintenance and continuous improvement.",
        order: 3,
      },
    ]);
    console.log("Created initial phases");
  }

  const logos = await db.query.homeSection.findFirst({
    where: eq(homeSection.type, "LOGO"),
    columns: { id: true },
  });
  if (!logos) {
    await db.insert(homeSection).values([
      { type: "LOGO", label: "Next.js", imageUrl: null, order: 1 },
      { type: "LOGO", label: "React", imageUrl: null, order: 2 },
      { type: "LOGO", label: "TypeScript", imageUrl: null, order: 3 },
      { type: "LOGO", label: "Node.js", imageUrl: null, order: 4 },
      { type: "LOGO", label: "PostgreSQL", imageUrl: null, order: 5 },
    ]);
    console.log("Created initial logos");
  }
}
