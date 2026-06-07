import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isOwnerEmail } from "@/lib/owner-guard";

/**
 * Get the authenticated session for a Server Action.
 * Throws if not authenticated — callers should catch and return actionError.
 */
export async function getActionSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !isOwnerEmail(session.user.email)) {
    throw new Error("Unauthorized");
  }

  return session;
}
