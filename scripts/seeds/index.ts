import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";
import { ZodError } from "zod";
import { SeedInputError } from "./errors";
import { collectSeedPlan } from "./menu";

export async function main(args = process.argv.slice(2)) {
  const options = args.filter((argument) => argument !== "--");
  if (options.includes("--help")) {
    console.log(
      "Storylio interactive seeder\nUse bun run db:seed (dev), db:seed:preview (staging), or db:seed:production (prod).\nSelect seed groups and enter profile fields in the terminal.\n--dry-run previews the menu plan without connecting to the database.",
    );
    return;
  }
  const environment = options
    .find((option) => option.startsWith("--environment="))
    ?.split("=")[1];
  if (!environment || !["dev", "staging", "prod"].includes(environment))
    throw new SeedInputError("Use an environment-specific db:seed script.");
  if (
    options.some(
      (option) =>
        option !== "--dry-run" && option !== `--environment=${environment}`,
    )
  )
    throw new SeedInputError("Unsupported seed option. Use --help.");
  if (!process.stdin.isTTY)
    throw new SeedInputError(
      "The seeder needs an interactive terminal. No database connection was opened.",
    );
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let plan: Awaited<ReturnType<typeof collectSeedPlan>>;
  try {
    plan = await collectSeedPlan({
      ask: (question) => terminal.question(question),
      write: console.log,
      environment,
      dryRun: options.includes("--dry-run"),
    });
  } finally {
    terminal.close();
  }
  if (!plan) {
    console.log("No database changes made.");
    return;
  }
  const { db, closeDb } = await import("@/lib/db");
  try {
    const { runSeedPlan } = await import("./run");
    await runSeedPlan(db, plan);
    console.log("Selected seed groups completed.");
    console.log(
      "Running app caches are separate from this CLI. Hard-refresh local dev, or revalidate/rebuild the deployed app to display changed content.",
    );
  } finally {
    await closeDb();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof SeedInputError
        ? error.message
        : error instanceof ZodError
          ? error.issues.map((issue) => issue.message).join("\n")
          : "Seeding failed. Check database migrations and environment configuration.",
    );
    process.exitCode = 1;
  });
}
