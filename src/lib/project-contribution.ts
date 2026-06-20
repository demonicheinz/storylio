const backendTechnologies = new Set([
  "drizzle",
  "express",
  "firebase",
  "mongodb",
  "mysql",
  "nestjs",
  "node.js",
  "postgresql",
  "prisma",
  "redis",
  "supabase",
]);

const frontendTechnologies = new Set([
  "astro",
  "framer motion",
  "react",
  "svelte",
  "tailwind css",
  "vue",
]);

export function getProjectContribution(techStack: string[]) {
  const technologies = new Set(techStack.map((tech) => tech.toLowerCase()));
  const hasBackend = [...backendTechnologies].some((tech) =>
    technologies.has(tech),
  );
  const hasFrontend = [...frontendTechnologies].some((tech) =>
    technologies.has(tech),
  );

  if (hasBackend && hasFrontend) {
    return "Full-stack development";
  }

  if (hasBackend) {
    return "Backend development";
  }

  if (hasFrontend) {
    return "Frontend development";
  }

  return "Product development";
}
