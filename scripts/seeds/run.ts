import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { seedAboutContent } from "./about";
import { SeedInputError } from "./errors";
import { seedGallery } from "./gallery";
import { seedHomeSections } from "./home-sections";
import type { SeedPlan } from "./menu";
import { seedNotes } from "./notes";
import { seedOwner } from "./owner";
import { seedPosts } from "./posts";
import { seedProjects } from "./projects";
import { seedTestimonials } from "./testimonials";

export async function runSeedPlan(db: Database, plan: SeedPlan) {
  let owner: { id: string } | undefined;
  if (plan.parts.includes("owner"))
    owner = await seedOwner(db, {
      profile: plan.profile,
      updateProfile: plan.updateProfile,
    });
  if (
    plan.parts.some(
      (part) => part === "projects" || part === "posts" || part === "notes",
    ) &&
    !owner
  ) {
    const email = process.env.OWNER_EMAIL?.split(",")[0]?.trim().toLowerCase();
    owner = email
      ? await db.query.user.findFirst({
          where: eq(user.email, email),
          columns: { id: true },
        })
      : undefined;
    if (!owner)
      throw new SeedInputError(
        "Seed the owner account first, or include owner in the selected groups.",
      );
  }
  for (const part of plan.parts) {
    if (part === "home") await seedHomeSections(db);
    else if (part === "about") await seedAboutContent(db);
    else if (part === "testimonials") await seedTestimonials(db);
    else if (part === "projects")
      await seedProjects({ db, ownerId: owner!.id });
    else if (part === "posts") await seedPosts({ db, ownerId: owner!.id });
    else if (part === "gallery") await seedGallery({ db });
    else if (part === "notes") await seedNotes({ db, ownerId: owner!.id });
  }
}
