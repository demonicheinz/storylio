import { closeDb, db } from "../src/lib/db";
import { getOwnerEmails } from "../src/lib/owner-guard";
import { repairOwnerCredential } from "./auth/repair-owner-credential";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--apply"))
  throw new Error("Usage: repair-owner-credential.ts [--apply]");
try {
  console.log(
    JSON.stringify({
      mode: args.includes("--apply") ? "apply" : "dry-run",
      ...(await repairOwnerCredential(
        db,
        getOwnerEmails(),
        args.includes("--apply"),
      )),
    }),
  );
} catch {
  console.error(
    "Credential repair failed; no partial changes committed. Inspect the owner credential rows without exposing password hashes.",
  );
  process.exitCode = 1;
} finally {
  await closeDb();
}
