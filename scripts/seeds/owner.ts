import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { account, user } from "@/lib/db/schema";

export async function seedOwner(db: Database) {
  const ownerEmail = process.env.OWNER_EMAIL?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    throw new Error("OWNER_EMAIL and OWNER_PASSWORD must be set");
  }

  let owner = await db.query.user.findFirst({
    where: eq(user.email, ownerEmail),
  });

  if (!owner) {
    const now = new Date();
    const password = await hashPassword(ownerPassword);
    owner = await db.transaction(async (tx) => {
      const [createdOwner] = await tx
        .insert(user)
        .values({
          email: ownerEmail,
          name: "Ahmad Haizul Amany",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      await tx.insert(account).values({
        userId: createdOwner.id,
        accountId: "",
        providerId: "credential",
        password,
        createdAt: now,
        updatedAt: now,
      });
      return createdOwner;
    });
    console.log("Created owner user with Better Auth:", ownerEmail);
  } else {
    console.log("Owner user already exists:", ownerEmail);
  }

  await db
    .update(user)
    .set({
      name: "Ahmad Haizul Amany",
      emailVerified: true,
      tagline: "Full Stack Developer",
      bio: "Hi! I'm Heinz, a Full Stack Developer based in Central Java, Indonesia.",
      github: "https://github.com/demonicheinz",
      instagram: "https://instagram.com/heinzdev",
      twitter: "https://x.com/chrysantastix",
      websiteUrl: "https://heinz.id",
      publicEmail: "hello@heinz.id",
    })
    .where(eq(user.id, owner.id));

  return owner;
}
