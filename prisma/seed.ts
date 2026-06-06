import { db } from "@/lib/db";
import { seedAboutContent } from "./seeds/about";
import { seedGallery } from "./seeds/gallery";
import { seedHomeSections } from "./seeds/home-sections";
import { seedOwner } from "./seeds/owner";
import { seedPosts } from "./seeds/posts";
import { seedProjects } from "./seeds/projects";
import { seedTestimonials } from "./seeds/testimonials";

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
