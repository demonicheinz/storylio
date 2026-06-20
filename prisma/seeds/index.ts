import { db } from "@/lib/db";
import { seedAboutContent } from "./about";
import { seedGallery } from "./gallery";
import { seedHomeSections } from "./home-sections";
import { seedOwner } from "./owner";
import { seedPosts } from "./posts";
import { seedProjects } from "./projects";
import { seedTestimonials } from "./testimonials";

async function main() {
  const owner = await seedOwner(db);

  await seedAboutContent(db);
  await seedHomeSections(db);
  await seedTestimonials(db);

  await seedProjects({
    db,
    ownerId: owner.id,
  });

  await seedPosts({
    db,
    ownerId: owner.id,
  });

  await seedGallery({
    db,
  });

  console.log("Seeding completed!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
