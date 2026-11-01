import { resolveSitemap } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import * as schema from "@/lib/db/schema";
import { SITE_URL } from "@/lib/site";
import { createTestDatabase } from "../helpers/database";

const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock("@/lib/db", () => ({
  get db() {
    return state.db;
  },
}));
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
const updatedAt = new Date("2026-10-30T00:00:00Z");

beforeAll(async () => {
  fixture = await createTestDatabase();
  state.db = fixture.db;
  await fixture.db.insert(schema.user).values({
    id: "owner",
    email: "seo@example.test",
    image: "/uploads/portrait.webp",
  });
  await fixture.db.insert(schema.post).values(
    [
      {
        id: "article",
        slug: "article",
        title: "Article",
        status: "PUBLISHED" as const,
      },
      { id: "note", slug: "note", title: "Note", status: "PUBLISHED" as const },
      { id: "draft", slug: "draft", title: "Draft", status: "DRAFT" as const },
      {
        id: "future",
        slug: "future",
        title: "Future",
        status: "PUBLISHED" as const,
        publishedAt: new Date("2099-01-01"),
      },
    ].map((post) => ({
      content: "Fixture",
      authorId: "owner",
      publishedAt: new Date("2026-06-07"),
      updatedAt,
      coverImage: `/uploads/${post.id}.webp`,
      ...post,
    })),
  );
  await fixture.db.insert(schema.tag).values({ id: "notes", name: "notes" });
  await fixture.db
    .insert(schema.postToTag)
    .values({ postId: "note", tagId: "notes" });
  await fixture.db.insert(schema.project).values([
    {
      id: "project",
      slug: "project",
      title: "Project",
      authorId: "owner",
      status: "PUBLISHED",
      coverImage: "/uploads/project.webp",
      thumbnailImageUrl: "/uploads/project-thumb.webp",
      updatedAt,
    },
    {
      id: "draft-project",
      slug: "draft-project",
      title: "Draft",
      authorId: "owner",
      status: "DRAFT",
      updatedAt,
    },
  ]);
  await fixture.db.insert(schema.projectScreenshot).values([
    {
      id: "screenshot",
      projectId: "project",
      imageUrl: "https://res.cloudinary.com/example/image/upload/screen.webp",
    },
    {
      id: "duplicate",
      projectId: "project",
      imageUrl: "/uploads/project.webp",
    },
    {
      id: "private",
      projectId: "draft-project",
      imageUrl: "/uploads/private.webp",
    },
  ]);
  await fixture.db.insert(schema.galleryItem).values([
    { id: "visible", imageUrl: "/uploads/gallery.webp", isVisible: true },
    { id: "hidden", imageUrl: "/uploads/hidden.webp", isVisible: false },
    { id: "invalid", imageUrl: "data:image/png;base64,AA==", isVisible: true },
  ]);
});

it("associates public photos with their landing pages, normalizes URLs and excludes hidden assets", async () => {
  const entries = await sitemap();
  const images = (path: string) =>
    entries.find(({ url }) => url === `${SITE_URL}${path}`)?.images;
  expect(images("/about")).toEqual([`${SITE_URL}/uploads/portrait.webp`]);
  expect(images("/blog/article")).toEqual([`${SITE_URL}/uploads/article.webp`]);
  expect(images("/projects")).toEqual([
    `${SITE_URL}/uploads/project-thumb.webp`,
  ]);
  expect(images("/projects/project")).toEqual([
    `${SITE_URL}/uploads/project.webp`,
    "https://res.cloudinary.com/example/image/upload/screen.webp",
  ]);
  expect(images("/gallery")).toEqual([`${SITE_URL}/uploads/gallery.webp`]);
  expect(JSON.stringify(entries)).not.toMatch(
    /hidden\.webp|private\.webp|draft\.webp|future\.webp|note\.webp|data:image/,
  );
});
afterAll(async () => {
  await fixture?.client.close();
});

it("lists only public destination URLs and reports actual edits rather than sitemap generation time", async () => {
  const entries = await sitemap();
  expect(entries.map(({ url }) => url)).toEqual([
    SITE_URL,
    `${SITE_URL}/about`,
    `${SITE_URL}/projects`,
    `${SITE_URL}/projects/project`,
    `${SITE_URL}/blog`,
    `${SITE_URL}/blog/article`,
    `${SITE_URL}/gallery`,
  ]);
  expect(
    entries.find(({ url }) => url.endsWith("/blog/article"))?.lastModified,
  ).toEqual(updatedAt);
  expect(
    entries.find(({ url }) => url.endsWith("/projects/project"))?.lastModified,
  ).toEqual(updatedAt);
  expect(
    entries.filter(({ lastModified }) => lastModified === undefined),
  ).toHaveLength(5);
});

it("escapes image URLs in the installed Next.js XML serializer without altering signed query values", async () => {
  const imageUrl =
    "https://res.cloudinary.com/example/image/upload/photo.webp?width=144&signature=a%2Bb%3D&label=one%26two";
  await fixture.db
    .insert(schema.galleryItem)
    .values({ id: "signed", imageUrl, isVisible: true });
  const xml = resolveSitemap(await sitemap());
  expect(xml).toContain(
    `<image:loc>${imageUrl.replaceAll("&", "&amp;")}</image:loc>`,
  );
  expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-f]+;)/i);
  expect(
    (
      await fixture.db.query.galleryItem.findFirst({
        where: (table, { eq }) => eq(table.id, "signed"),
      })
    )?.imageUrl,
  ).toBe(imageUrl);
});
