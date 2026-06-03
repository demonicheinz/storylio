import type { PrismaClient } from "@/generated/prisma";
import { PostStatus } from "@/generated/prisma";

type SeedPostsOptions = {
  db: PrismaClient;
  ownerId: string;
};

const posts = [
  {
    title: "Building Storylio With Server-First Pages",
    slug: "building-storylio-with-server-first-pages",
    excerpt:
      "A practical note on shaping public portfolio pages with Server Components, Prisma, and small client islands.",
    content: [
      "## Why Server First",
      "Storylio leans on Server Components because most public pages are content-led. The page can fetch directly from Prisma, render stable HTML, and leave only interaction details to client components.",
      "## The Pattern",
      "- Fetch public data in the route page",
      "- Cache read-heavy public content with `cacheLife`",
      "- Keep filters, share controls, and counters as small client islands",
      "## Example",
      "```tsx",
      "async function getPublishedPosts() {",
      '  "use cache";',
      '  cacheLife("minutes");',
      "  return db.post.findMany({ where: { status: 'PUBLISHED' } });",
      "}",
      "```",
      "## Takeaway",
      "The result is a site that feels fast without turning every public page into a client-side app.",
    ].join("\n\n"),
    coverImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    tags: ["Next.js", "Prisma", "Architecture"],
    publishedAt: new Date("2026-05-28T09:00:00.000Z"),
    viewCount: 128,
    status: PostStatus.PUBLISHED,
  },
  {
    title: "Designing Calm Interfaces For Repeated Work",
    slug: "designing-calm-interfaces-for-repeated-work",
    excerpt:
      "Notes on keeping dashboards, editors, and operational screens clear after the hundredth visit.",
    content: [
      "## Calm Is A Feature",
      "A useful interface does not need to announce every capability at once. Calm software makes repeated work easier by keeping hierarchy obvious and visual noise low.",
      "> The best dashboard is often the one people can understand before their coffee is finished.",
      "## What Helps",
      "1. Keep primary actions close to the data they affect.",
      "2. Use restrained contrast for secondary information.",
      "3. Avoid decorative cards inside decorative cards.",
      "## Small Details",
      "Hover states, loading states, and empty states matter because they are where the product tells the user it is still paying attention.",
    ].join("\n\n"),
    coverImage:
      "https://res.cloudinary.com/demo/image/upload/c_scale,w_1200/docs/models.jpg",
    tags: ["UI/UX", "Dashboard", "Product"],
    publishedAt: new Date("2026-05-20T09:00:00.000Z"),
    viewCount: 94,
    status: PostStatus.PUBLISHED,
  },
  {
    title: "What I Look For In A Portfolio Project",
    slug: "what-i-look-for-in-a-portfolio-project",
    excerpt:
      "A short checklist for making project pages communicate decisions instead of only showing screenshots.",
    content: [
      "## The Screenshot Is Not Enough",
      "A project page should show what was built, but also why the work matters. The strongest case studies explain constraints, decisions, tradeoffs, and outcomes.",
      "## A Better Shape",
      "- What problem existed",
      "- What was built",
      "- What decisions made the work better",
      "- What changed after shipping",
      "## Closing Thought",
      "A good portfolio project lets visitors see the thinking behind the interface.",
    ].join("\n\n"),
    coverImage:
      "https://res.cloudinary.com/demo/image/upload/c_scale,w_1200/docs/colored_pencils.jpg",
    tags: ["Portfolio", "Writing", "UI/UX"],
    publishedAt: new Date("2026-05-12T09:00:00.000Z"),
    viewCount: 71,
    status: PostStatus.PUBLISHED,
  },
  {
    title: "Draft Note",
    slug: "draft-note",
    excerpt: "A draft article used to verify unpublished posts stay private.",
    content:
      "This post intentionally stays unpublished and should return 404 on the public detail route.",
    coverImage: null,
    tags: ["Testing"],
    publishedAt: null,
    viewCount: 0,
    status: PostStatus.DRAFT,
  },
];

export async function seedPosts({ db, ownerId }: SeedPostsOptions) {
  for (const post of posts) {
    await db.post.upsert({
      where: {
        slug: post.slug,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        status: post.status,
        publishedAt: post.publishedAt,
        viewCount: post.viewCount,
        authorId: ownerId,
        tags: {
          set: [],
          connectOrCreate: post.tags.map((tag) => ({
            where: {
              name: tag,
            },
            create: {
              name: tag,
            },
          })),
        },
      },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        status: post.status,
        publishedAt: post.publishedAt,
        viewCount: post.viewCount,
        authorId: ownerId,
        tags: {
          connectOrCreate: post.tags.map((tag) => ({
            where: {
              name: tag,
            },
            create: {
              name: tag,
            },
          })),
        },
      },
    });
  }

  console.log(`Seeded ${posts.length} sample posts`);
}
