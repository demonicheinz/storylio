import { resolve } from "node:path";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";
import { readDatabaseSchema } from "./lib/database-schema";
import { adoptBaseline, migrationStatus } from "./lib/migration-baseline";

async function main() {
  const command = process.argv[2];
  const options = process.argv.slice(3).filter((option) => option !== "--");
  if (command === "reset") {
    throw new Error(
      "Automatic database reset is retired. Use an isolated database and db:migrate; existing data is never reset by this tool.",
    );
  }
  if (!["status", "baseline", "migrate"].includes(command)) {
    throw new Error(
      "Expected a database command: status, baseline [--apply], or migrate.",
    );
  }
  if (
    options.some((option) => command !== "baseline" || option !== "--apply")
  ) {
    throw new Error(
      "Unsupported database option. Only baseline accepts --apply; no flags are silently ignored.",
    );
  }
  if (!process.env.DIRECT_URL)
    throw new Error(
      "DIRECT_URL is required. Run the matching Infisical database script.",
    );
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  const db = drizzle(pool);
  const execute = (query: Parameters<typeof db.execute>[0]) =>
    db.execute<Record<string, unknown>>(query);
  try {
    if (command === "baseline") {
      const result = await adoptBaseline(
        {
          execute,
          transaction: (callback) =>
            db.transaction((tx) =>
              callback((query) => tx.execute<Record<string, unknown>>(query)),
            ),
        },
        options.includes("--apply"),
      );
      console.log(
        result.alreadyApplied
          ? "Baseline already applied."
          : result.applied
            ? "Existing schema adopted. Only the Drizzle migration ledger was written."
            : "Existing schema matches all " +
              result.tables +
              " baseline tables. No database changes made.",
      );
      if (!result.applied && !result.alreadyApplied)
        console.log(
          "To adopt this existing database, rerun this command with --apply after review.",
        );
      return;
    }
    const status = await migrationStatus(execute);
    const schema = await readDatabaseSchema(execute);
    if (command === "status") {
      console.log(
        JSON.stringify({
          applied: status.applied,
          pending: status.pending,
          requiresBaseline: status.applied === 0 && schema.tables.length > 0,
        }),
      );
      if (status.pending) process.exitCode = 1;
      return;
    }
    if (status.applied === 0 && schema.tables.length > 0) {
      throw new Error(
        "Existing tables detected without a Drizzle baseline. Run db:baseline, review, then db:baseline --apply before db:migrate. No migration was applied.",
      );
    }
    await migrate(db, { migrationsFolder: resolve("drizzle") });
    console.log("Drizzle migrations are up to date.");
  } finally {
    await pool.end();
  }
}
main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Database operation failed.",
  );
  process.exitCode = 1;
});
