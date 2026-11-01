import { beforeEach, expect, it, vi } from "vitest";
import { generateMetadata as articleMetadata } from "@/app/(public)/blog/[slug]/page";
import { generateMetadata as blogMetadata } from "@/app/(public)/blog/page";
import HomePage, { metadata as homeMetadata } from "@/app/(public)/page";
import { generateMetadata as projectMetadata } from "@/app/(public)/projects/page";
import robots from "@/app/robots";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const rows = vi.hoisted(() => ({ post: null as unknown }));
const archive = vi.hoisted(() => ({ count: 14 }));
vi.mock("@/lib/public-writing-cache", () => ({
  getWritingFacets: async () =>
    ["notes", "Web"].flatMap((name) =>
      Array.from({ length: archive.count }, (_, index) => ({
        id: `${name}-${index}`,
        slug: `${name}-${index}`,
        tags: [name],
      })),
    ),
  getWritingRows: async () => [],
}));
vi.mock("@/lib/public-project-cache", () => ({
  getProjectFacets: async () => ({
    technologies: ["Next.js", "React"],
    totalProjects: archive.count,
  }),
  getProjectCount: async () => archive.count,
  getProjectRows: async () => [],
}));
beforeEach(() => {
  archive.count = 14;
});

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({ innerJoin: () => ({ where: () => [] }) }),
    }),
    query: new Proxy(
      {},
      {
        get: (_target, table) => ({
          findMany: async () => [],
          findFirst: async () => (table === "post" ? rows.post : null),
        }),
      },
    ),
  },
}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

it("uses one site identity for homepage structured data, sharing metadata and robots sitemap", async () => {
  const page = await HomePage({ searchParams: Promise.resolve({}) });
  const script = page.props.children[0];
  expect(script.type).toBe("script");
  expect(script.props.type).toBe("application/ld+json");
  expect(JSON.parse(script.props.dangerouslySetInnerHTML.__html)).toMatchObject(
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
  );
  expect(homeMetadata.alternates?.canonical).toBe("/");
  expect(homeMetadata.openGraph).toMatchObject({
    siteName: SITE_NAME,
    url: "/",
  });
  expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
});

it("points a legacy Note URL to its collection rather than making the redirect a canonical article", async () => {
  rows.post = {
    title: "Note",
    slug: "note",
    excerpt: "A note",
    publishedAt: null,
    tags: [{ tag: { id: "notes", name: "notes" } }],
  };
  try {
    const metadata = await articleMetadata({
      params: Promise.resolve({ slug: "note" }),
    });
    expect(metadata.alternates?.canonical).toBe("/blog?tag=notes");
    expect(metadata.openGraph).toMatchObject({ url: "/blog?tag=notes" });
  } finally {
    rows.post = null;
  }
});

it("keeps archive pages and normalized filters distinct while dropping incidental note parameters", async () => {
  const blog = await blogMetadata({
    searchParams: Promise.resolve({
      tag: " notes ",
      page: "2",
      note: "example",
    }),
  });
  expect(blog.alternates?.canonical).toBe("/blog?tag=notes&page=2");
  const projects = await projectMetadata({
    searchParams: Promise.resolve({
      tech: ["React", " Next.js ", "React"],
      page: "2",
    }),
  });
  expect(projects.alternates?.canonical).toBe(
    "/projects?tech=Next.js&tech=React&page=2",
  );
  expect(
    (await blogMetadata({ searchParams: Promise.resolve({ page: "invalid" }) }))
      .alternates?.canonical,
  ).toBe("/blog");
});

it.each([
  [6, 1],
  [14, 3],
  [0, 1],
])(
  "canonicalizes an out-of-range page to the displayed page for %i records",
  async (count, page) => {
    archive.count = count;
    const suffix = page > 1 ? `?page=${page}` : "";
    const blog = await blogMetadata({
      searchParams: Promise.resolve({ page: "999" }),
    });
    const projects = await projectMetadata({
      searchParams: Promise.resolve({ page: "999" }),
    });
    expect(blog.alternates?.canonical).toBe(`/blog${suffix}`);
    expect(blog.openGraph).toMatchObject({ url: `/blog${suffix}` });
    expect(projects.alternates?.canonical).toBe(`/projects${suffix}`);
    expect(projects.openGraph).toMatchObject({ url: `/projects${suffix}` });
  },
);
