import { hashPassword } from "better-auth/crypto";
import type { PrismaClient } from "@/generated/prisma";

export async function seedOwner(db: PrismaClient) {
  const ownerEmail = process.env.OWNER_EMAIL?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    throw new Error("OWNER_EMAIL and OWNER_PASSWORD must be set");
  }

  let owner = await db.user.findUnique({
    where: { email: ownerEmail },
  });

  if (!owner) {
    const now = new Date();
    owner = await db.user.create({
      data: {
        email: ownerEmail,
        name: "Ahmad Haizul Amany",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        accounts: {
          create: {
            accountId: "",
            providerId: "credential",
            password: await hashPassword(ownerPassword),
            createdAt: now,
            updatedAt: now,
          },
        },
      },
    });
    console.log("Created owner user with Better Auth:", ownerEmail);
  } else {
    console.log("Owner user already exists:", ownerEmail);
  }

  await db.user.update({
    where: { id: owner.id },
    data: {
      name: "Ahmad Haizul Amany",
      emailVerified: true,
      tagline: "Full Stack Developer",
      bio: "Hi! I'm Heinz, a Full Stack Developer based in Central Java, Indonesia.",
      github: "https://github.com/demonicheinz",
      instagram: "https://instagram.com/heinzdev",
      twitter: "https://x.com/chrysantastix",
      websiteUrl: "https://heinz.id",
      publicEmail: "hello@heinz.id",
    },
  });

  return owner;
}
