import { type SeedOwnerProfile, seedOwnerProfileSchema } from "./profile";

export const seedChoices = [
  { id: "owner", label: "Owner account and profile" },
  { id: "home", label: "Initial approach phases and technology logos" },
  { id: "about", label: "Initial About content" },
  { id: "testimonials", label: "Demo testimonials" },
  { id: "projects", label: "Demo projects (replaces matching demo slugs)" },
  {
    id: "posts",
    label: "Demo posts (replaces matching demo slugs and view counts)",
  },
  { id: "gallery", label: "Demo gallery" },
  {
    id: "notes",
    label:
      "Storylio work notes (creates missing notes; preserves existing posts)",
  },
] as const;
export type SeedPart = (typeof seedChoices)[number]["id"];
export type SeedPlan = {
  parts: SeedPart[];
  profile?: SeedOwnerProfile;
  updateProfile: boolean;
};

export function parseSeedSelection(answer: string): SeedPart[] {
  if (answer.trim() === "0" || !answer.trim()) return [];
  if (answer.trim() === "all") return seedChoices.map(({ id }) => id);
  const indexes = answer.split(",").map((part) => part.trim());
  if (
    indexes.some(
      (part) => !/^[1-9]\d*$/.test(part) || Number(part) > seedChoices.length,
    )
  )
    throw new Error(
      `Choose 1–${seedChoices.length} separated by commas, all, or 0 to cancel.`,
    );
  return [...new Set(indexes.map((part) => seedChoices[Number(part) - 1].id))];
}

/** Gather a reviewable plan before the CLI connects to the database. */
export async function collectSeedPlan({
  ask,
  write,
  environment,
  dryRun = false,
}: {
  ask: (question: string) => Promise<string>;
  write: (message: string) => void;
  environment: string;
  dryRun?: boolean;
}): Promise<SeedPlan | null> {
  write(`Storylio seed menu — environment: ${environment}`);
  seedChoices.forEach((choice, index) =>
    write(`${index + 1}. ${choice.label}`),
  );
  write("all. All listed seed groups\n0. Cancel");
  let parts: SeedPart[];
  while (true) {
    try {
      parts = parseSeedSelection(await ask("Seed groups: "));
      break;
    } catch (error) {
      write((error as Error).message);
    }
  }
  if (!parts.length) return null;
  let profile: SeedOwnerProfile | undefined;
  let updateProfile = false;
  if (parts.includes("owner")) {
    write(
      "Login email/password come from Infisical. Blank optional answers leave existing fields unchanged.",
    );
    profile = {};
    const fields = [
      ["name", "Display name"],
      ["tagline", "Role / tagline"],
      ["headline", "Home headline"],
      ["subheadline", "Home subheadline (existing bio)"],
      ["publicEmail", "Public contact email"],
      ["websiteUrl", "Website URL"],
      ["github", "GitHub URL"],
      ["instagram", "Instagram URL"],
      ["twitter", "X URL"],
    ] as const;
    for (const [field, label] of fields) {
      while (true) {
        const value = (await ask(`${label} (optional): `)).trim();
        if (!value) break;
        const parsed = seedOwnerProfileSchema.shape[field].safeParse(value);
        if (!parsed.success) {
          write(parsed.error.issues[0].message);
          continue;
        }
        profile[field] = value;
        break;
      }
    }
    updateProfile =
      (
        await ask(
          "If the owner already exists, apply the supplied profile fields? [y/N]: ",
        )
      )
        .trim()
        .toLowerCase() === "y";
  }
  write(`Selected: ${parts.join(", ")}`);
  if (profile && Object.keys(profile).length)
    write(`Profile fields: ${JSON.stringify(profile)}`);
  if (parts.some((part) => part === "posts" || part === "projects"))
    write(
      "Matching demo projects/posts will be overwritten. Posts include their tags, publication settings and view counts.",
    );
  if (dryRun) {
    write("Dry run: no database connection or changes.");
    return null;
  }
  const answer = (await ask(`Apply this plan to ${environment}? [y/N]: `))
    .trim()
    .toLowerCase();
  return answer === "y" ? { parts, profile, updateProfile } : null;
}
