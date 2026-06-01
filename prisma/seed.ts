import { hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db";

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    console.error("OWNER_EMAIL and OWNER_PASSWORD must be set");
    process.exit(1);
  }

  let owner = await db.user.findUnique({
    where: {
      email: ownerEmail,
    },
    include: {
      accounts: true,
    },
  });

  if (!owner) {
    const now = new Date();
    const passwordHash = await hashPassword(ownerPassword);

    owner = await db.user.create({
      data: {
        email: ownerEmail.toLowerCase(),
        name: "Ahmad Haizul Amany",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        accounts: {
          create: {
            accountId: "",
            providerId: "credential",
            password: passwordHash,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
      include: {
        accounts: true,
      },
    });

    console.log("Created owner user with Better Auth:", ownerEmail);
  } else {
    console.log("Owner user already exists:", ownerEmail);
  }

  if (!owner) {
    throw new Error("Failed to create or find owner user");
  }

  await db.user.update({
    where: {
      id: owner.id,
    },
    data: {
      name: "Ahmad Haizul Amany",
      emailVerified: true,
      tagline: "Full Stack Developer",
      bio: "Personal portfolio of Ahmad Haizul Amany (Heinz)",
      github: "https://github.com/demonicheinz",
      instagram: "https://instagram.com/heinzdev",
      twitter: "https://x.com/chrysantastix",
    },
  });

  const phasesCount = await db.homeSection.count({
    where: { type: "PHASE" },
  });

  if (phasesCount === 0) {
    await db.homeSection.createMany({
      data: [
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
      ],
    });

    console.log("Created initial phases");
  }

  const logosCount = await db.homeSection.count({
    where: { type: "LOGO" },
  });

  if (logosCount === 0) {
    await db.homeSection.createMany({
      data: [
        { type: "LOGO", label: "Next.js", imageUrl: null, order: 1 },
        { type: "LOGO", label: "React", imageUrl: null, order: 2 },
        { type: "LOGO", label: "TypeScript", imageUrl: null, order: 3 },
        { type: "LOGO", label: "Node.js", imageUrl: null, order: 4 },
        { type: "LOGO", label: "PostgreSQL", imageUrl: null, order: 5 },
      ],
    });

    console.log("Created initial logos");
  }

  const testimonialsCount = await db.testimonial.count();

  if (testimonialsCount === 0) {
    await db.testimonial.createMany({
      data: [
        {
          name: "Sarah Johnson",
          role: "CTO",
          company: "TechStart Inc.",
          content:
            "Heinz delivered an exceptional e-commerce platform that exceeded our expectations. His attention to detail and technical expertise made all the difference.",
          order: 1,
        },
        {
          name: "Michael Chen",
          role: "Product Manager",
          company: "Innovate Labs",
          content:
            "Working with Heinz was a pleasure. He understood our requirements perfectly and delivered a scalable solution that has grown with our business.",
          order: 2,
        },
        {
          name: "Emma Davis",
          role: "Founder",
          company: "Creative Studio",
          content:
            "The website Heinz built for us is fast, beautiful, and exactly what we envisioned. Highly recommend for any web project.",
          order: 3,
        },
      ],
    });

    console.log("Created sample testimonials");
  }

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
