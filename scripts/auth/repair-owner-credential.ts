import { and, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../../src/lib/db";
import { account, user } from "../../src/lib/db/schema";

/** Repairs only the empty credential identifier produced by the old owner seed. */
export async function repairOwnerCredential(
  db: Database,
  emails: string[],
  apply = false,
) {
  const owners = [
    ...new Set(
      emails.map((email) => email.trim().toLowerCase()).filter(Boolean),
    ),
  ];
  if (!owners.length) throw new Error("OWNER_EMAIL must be configured.");
  return db.transaction(async (tx) => {
    if (apply)
      await tx.execute(sql`LOCK TABLE ${account} IN SHARE ROW EXCLUSIVE MODE`);
    const users = await tx.query.user.findMany({
      columns: { id: true },
      where: inArray(user.email, owners),
      with: {
        accounts: {
          columns: {
            id: true,
            accountId: true,
            providerId: true,
            password: true,
          },
        },
      },
    });
    const candidates: Array<{ id: string; userId: string }> = [];
    for (const owner of users) {
      const credentials = owner.accounts.filter(
        (a) => a.providerId === "credential",
      );
      if (!credentials.some((a) => a.accountId === "")) continue;
      if (credentials.length !== 1 || !credentials[0].password)
        throw new Error(
          "Ambiguous or passwordless owner credentials. No changes made.",
        );
      candidates.push({ id: credentials[0].id, userId: owner.id });
    }
    if (apply)
      for (const candidate of candidates) {
        const changed = await tx
          .update(account)
          .set({ accountId: candidate.userId })
          .where(
            and(
              eq(account.id, candidate.id),
              eq(account.userId, candidate.userId),
              eq(account.providerId, "credential"),
              eq(account.accountId, ""),
            ),
          )
          .returning({ id: account.id });
        if (changed.length !== 1)
          throw new Error(
            "Credential changed during repair. Transaction rolled back.",
          );
      }
    return {
      matchedOwners: users.length,
      repairable: candidates.length,
      updated: apply ? candidates.length : 0,
    };
  });
}
