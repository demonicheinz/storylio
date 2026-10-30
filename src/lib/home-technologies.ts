const technologyNames = new Set([
  "nextjs",
  "react",
  "typescript",
  "javascript",
  "nodejs",
  "postgresql",
  "tailwindcss",
  "drizzle",
  "prisma",
  "git",
  "github",
  "figma",
  "vercel",
  "supabase",
  "redis",
  "upstash",
  "vitest",
  "playwright",
  "bun",
  "docker",
  "html",
  "css",
  "python",
  "go",
  "rust",
  "mongodb",
  "mysql",
  "vue",
  "svelte",
]);
export const normalizeTechnologyName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]/g, "");

export const hasLocalTechnologyLogo = (label: string) =>
  ["nextjs", "react", "typescript", "nodejs", "postgresql"].includes(
    normalizeTechnologyName(label),
  );

export type HomeLogoCategory = "TECHNOLOGY" | "CLIENT";
type LogoRecord = { label: string; content?: string | null };
export type HomeLogoSettings = {
  category: HomeLogoCategory;
  showOnHome: boolean;
  description: string;
};

/** LOGO content holds versioned settings; PHASE content remains plain text. */
export function getHomeLogoSettings(logo: LogoRecord): HomeLogoSettings {
  if (logo.content) {
    try {
      const value: unknown = JSON.parse(logo.content);
      if (
        value &&
        typeof value === "object" &&
        "kind" in value &&
        value.kind === "home-logo" &&
        "version" in value &&
        value.version === 1 &&
        "category" in value &&
        (value.category === "TECHNOLOGY" || value.category === "CLIENT") &&
        "showOnHome" in value &&
        typeof value.showOnHome === "boolean"
      ) {
        return {
          category: value.category,
          showOnHome: value.showOnHome,
          description:
            "description" in value && typeof value.description === "string"
              ? value.description
              : "",
        };
      }
    } catch {
      // Unconfigured legacy logos keep their existing public visibility.
    }
  }
  const technology = technologyNames.has(normalizeTechnologyName(logo.label));
  return {
    category: technology ? "TECHNOLOGY" : "CLIENT",
    showOnHome: technology,
    description: logo.content ?? "",
  };
}

export function serializeHomeLogoSettings(settings: HomeLogoSettings) {
  return JSON.stringify({
    kind: "home-logo",
    version: 1,
    ...settings,
    showOnHome: settings.category === "TECHNOLOGY" && settings.showOnHome,
  });
}

export function selectHomeTechnologies<T extends LogoRecord>(logos: T[]) {
  const seen = new Set<string>();
  return logos.filter((logo) => {
    const name = normalizeTechnologyName(logo.label);
    const settings = getHomeLogoSettings(logo);
    if (
      settings.category !== "TECHNOLOGY" ||
      !settings.showOnHome ||
      seen.has(name)
    )
      return false;
    seen.add(name);
    return true;
  });
}
