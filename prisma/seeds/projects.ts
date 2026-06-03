import type { PrismaClient } from "@/generated/prisma";
import { ProjectStatus } from "@/generated/prisma";

type SeedProjectsOptions = {
  db: PrismaClient;
  ownerId: string;
};

const sampleScreenshots = [
  "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  "https://res.cloudinary.com/demo/image/upload/c_scale,w_1200/docs/colored_pencils.jpg",
  "https://res.cloudinary.com/demo/image/upload/c_scale,w_1200/docs/models.jpg",
];

const projects = [
  {
    title: "Storylio",
    slug: "storylio",
    description:
      "A dark-space personal portfolio and CMS for publishing projects, writing, gallery items, and home page content without touching code.",
    content: [
      "## Overview",
      "Storylio is a full-stack portfolio platform built with Next.js, Prisma, and PostgreSQL. The public site focuses on expressive storytelling, while the dashboard keeps content management calm and practical for a single owner.",
      "> The goal was to make publishing feel like part of the product, not a chore hidden behind code edits.",
      "## What Was Built",
      "- Public pages for Home, About, Projects, Blog, and Gallery",
      "- Server-first data fetching with Prisma",
      "- CMS-ready models for projects, posts, testimonials, gallery, and home sections",
      "- Dark space visual system with subtle motion and glow states",
      "## Implementation Detail",
      "A small cached query keeps the public project archive responsive while still allowing content to refresh after CMS updates.",
      "```tsx",
      "async function getProjectsData() {",
      '  "use cache";',
      '  cacheLife("minutes");',
      "  return db.project.findMany({ where: { status: 'PUBLISHED' } });",
      "}",
      "```",
      "## Outcome",
      "The result is a portfolio foundation that can grow into a complete publishing system without changing the public architecture every time new content is added.",
    ].join("\n\n"),
    coverImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    screenshots: sampleScreenshots,
    techStack: [
      "Next.js",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "Tailwind CSS",
    ],
    liveUrl: "https://storylio.example.com",
    githubUrl: "https://github.com/demonicheinz/storylio",
    order: 1,
    status: ProjectStatus.PUBLISHED,
  },
  {
    title: "Nebula Commerce",
    slug: "nebula-commerce",
    description:
      "A storefront concept with product discovery, fast checkout flows, and polished responsive merchandising sections.",
    content: [
      "## Overview",
      "Nebula Commerce explores how an online store can feel premium without becoming heavy. The interface emphasizes clear product comparison, fast navigation, and reusable commerce sections that can scale with a growing catalog.",
      "## Design Priorities",
      "- Keep product information easy to compare",
      "- Make primary purchase actions obvious",
      "- Preserve a quiet, premium tone on mobile and desktop",
      "## Technical Notes",
      "The storefront is structured around reusable product sections so merchandising content can be rearranged without rewriting the page.",
    ].join("\n\n"),
    coverImage:
      "https://res.cloudinary.com/demo/image/upload/c_scale,w_1200/docs/colored_pencils.jpg",
    screenshots: sampleScreenshots.slice(0, 2),
    techStack: ["Next.js", "React", "Stripe", "Tailwind CSS"],
    liveUrl: "https://nebula-commerce.example.com",
    githubUrl: "https://github.com/demonicheinz/nebula-commerce",
    order: 2,
    status: ProjectStatus.PUBLISHED,
  },
  {
    title: "Pulse Analytics",
    slug: "pulse-analytics",
    description:
      "A focused analytics dashboard for monitoring content performance, popular posts, and lightweight product metrics.",
    content: [
      "## Overview",
      "Pulse Analytics is a dashboard prototype designed for fast scanning. It uses compact cards, clear hierarchy, and restrained visual styling so repeated operational checks stay efficient.",
      "## Dashboard Rules",
      "1. Put the most important numbers above the fold.",
      "2. Avoid decorative noise in repeated operational views.",
      "3. Make comparison states readable at a glance.",
      "## Example Metric Shape",
      "```ts",
      "type Metric = {",
      "  label: string;",
      "  value: number;",
      "  trend: 'up' | 'down' | 'flat';",
      "};",
      "```",
    ].join("\n\n"),
    coverImage:
      "https://res.cloudinary.com/demo/image/upload/c_scale,w_1200/docs/models.jpg",
    screenshots: sampleScreenshots.slice(1),
    techStack: ["React", "TypeScript", "Prisma", "PostgreSQL"],
    liveUrl: "https://pulse-analytics.example.com",
    githubUrl: "https://github.com/demonicheinz/pulse-analytics",
    order: 3,
    status: ProjectStatus.PUBLISHED,
  },
  {
    title: "Canvas Notes",
    slug: "canvas-notes",
    description:
      "An interactive note board experiment with drag-friendly layouts, quick capture, and visual organization patterns.",
    content: [
      "## Overview",
      "Canvas Notes tests a looser workspace for organizing ideas visually. The focus is interaction detail: quick entry, responsive cards, and a calm canvas that does not fight the content.",
      "## Interaction Focus",
      "- Fast capture without modal friction",
      "- Stable card dimensions during hover and drag states",
      "- Motion that clarifies placement instead of distracting from writing",
    ].join("\n\n"),
    coverImage: null,
    screenshots: [],
    techStack: ["React", "Framer Motion", "Tailwind CSS"],
    liveUrl: "https://canvas-notes.example.com",
    githubUrl: "https://github.com/demonicheinz/canvas-notes",
    order: 4,
    status: ProjectStatus.PUBLISHED,
  },
  {
    title: "Archive Draft",
    slug: "archive-draft",
    description:
      "A draft project used to verify that unpublished work never appears on public project pages.",
    content:
      "This project intentionally stays unpublished and should return 404 on the public detail route.",
    coverImage: null,
    screenshots: [],
    techStack: ["Next.js", "Testing"],
    liveUrl: null,
    githubUrl: null,
    order: 99,
    status: ProjectStatus.DRAFT,
  },
];

export async function seedProjects({ db, ownerId }: SeedProjectsOptions) {
  for (const project of projects) {
    await db.project.upsert({
      where: {
        slug: project.slug,
      },
      update: {
        ...project,
        authorId: ownerId,
      },
      create: {
        ...project,
        authorId: ownerId,
      },
    });
  }

  console.log(`Seeded ${projects.length} sample projects`);
}
