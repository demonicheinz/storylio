import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { saveHomeHeadline } from "@/features/home/hero-content";
import type { Database } from "@/lib/db";
import { account, user } from "@/lib/db/schema";
import { SeedInputError } from "./errors";
import { type SeedOwnerProfile, seedOwnerProfileSchema } from "./profile";

export async function seedOwner(
  db: Database,
  options: { profile?: SeedOwnerProfile; updateProfile?: boolean } = {},
) {
  const profile = seedOwnerProfileSchema.parse(options.profile ?? {});
  const ownerEmail = process.env.OWNER_EMAIL?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail) throw new SeedInputError("OWNER_EMAIL must be set");

  let owner = await db.query.user.findFirst({
    where: eq(user.email, ownerEmail),
  });

  if (owner && !options.updateProfile) return owner;
  let password: string | undefined;
  if (!owner) {
    if (!ownerPassword || ownerPassword.length < 8)
      throw new SeedInputError(
        "OWNER_PASSWORD must contain at least 8 characters for a new owner",
      );
    password = await hashPassword(ownerPassword);
  }
  return db.transaction(async (tx) => {
    const now = new Date();
    if (!owner) {
      const [createdOwner] = await tx
        .insert(user)
        .values({
          email: ownerEmail,
          name: profile.name ?? ownerEmail.split("@")[0],
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      await tx.insert(account).values({
        userId: createdOwner.id,
        accountId: createdOwner.id,
        providerId: "credential",
        password,
        createdAt: now,
        updatedAt: now,
      });
      owner = createdOwner;
    }
    const { headline, subheadline, ...fields } = profile;
    const updates = {
      ...fields,
      ...(subheadline !== undefined ? { bio: subheadline || null } : {}),
    };
    if (Object.keys(updates).length > 0) {
      const [updated] = await tx
        .update(user)
        .set(updates)
        .where(eq(user.id, owner.id))
        .returning();
      owner = updated;
      if (!owner)
        throw new SeedInputError("The owner profile no longer exists.");
    }
    if (headline !== undefined) await saveHomeHeadline(tx, headline);
    return owner;
  });
}
