import { beforeEach, expect, it, vi } from "vitest";
import AboutPage, { generateMetadata } from "@/app/(public)/about/page";
import { SITE_URL } from "@/lib/site";

const state = vi.hoisted(() => ({
  profile: {
    name: "Ahmad Haizul Amany",
    image: "https://res.cloudinary.com/example/image/upload/portrait.png",
    tagline: "Full Stack Developer",
    github: "https://github.com/example",
  } as Record<string, string | null>,
  content: {
    defaultLanguage: "en",
    introEn: "English introduction.",
    introId: "Perkenalan Indonesia.",
  },
}));
vi.mock("@/features/about/data", () => ({
  getAboutContent: async () => state.content,
}));
vi.mock("@/lib/db", () => ({
  db: {
    query: new Proxy(
      {},
      {
        get: () => ({
          findFirst: async () => state.profile,
          findMany: async () => [],
        }),
      },
    ),
  },
}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/lib/mdx", () => ({ renderMDX: async () => null }));

beforeEach(() => {
  state.content.defaultLanguage = "en";
  state.profile.name = "Ahmad Haizul Amany";
  state.profile.image =
    "https://res.cloudinary.com/example/image/upload/portrait.png";
});

it.each([
  ["en", "/about?lang=en", "English introduction."],
  ["id", "/about?lang=id", "Perkenalan Indonesia."],
  [["id", "en"], "/about?lang=id", "Perkenalan Indonesia."],
])(
  "keeps metadata and canonical aligned with the requested language %s",
  async (lang, canonical, description) => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ lang }),
    });
    expect(metadata.alternates).toEqual({
      canonical,
      languages: {
        en: "/about?lang=en",
        id: "/about?lang=id",
        "x-default": "/about",
      },
    });
    expect(metadata.description).toBe(description);
    expect(metadata.openGraph).toMatchObject({
      url: canonical,
      images: [state.profile.image],
    });
  },
);

it("uses the CMS default language for missing and unsupported language parameters", async () => {
  state.content.defaultLanguage = "id";
  for (const lang of [undefined, "fr"]) {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ lang }),
    });
    expect(metadata.alternates?.canonical).toBe("/about?lang=id");
    expect(metadata.description).toBe("Perkenalan Indonesia.");
  }
});

it("describes the visible person with the original portrait and safely serializes CMS text", async () => {
  state.profile.name = "Heinz </script><script>alert(1)</script>";
  const shell = AboutPage({ searchParams: Promise.resolve({ lang: "id" }) });
  const content = shell.props.children;
  const main = await content.type(content.props);
  expect(main.props.lang).toBe("id");
  const script = main.props.children[0];
  const json = script.props.dangerouslySetInnerHTML.__html;
  expect(json).not.toContain("<");
  expect(JSON.parse(json)).toMatchObject({
    "@type": "ProfilePage",
    url: `${SITE_URL}/about?lang=id`,
    inLanguage: "id",
    mainEntity: {
      "@type": "Person",
      "@id": `${SITE_URL}/about#person`,
      name: state.profile.name,
      image: state.profile.image,
      sameAs: ["https://github.com/example"],
    },
  });
});

it("does not identify the generated logo as a person's portrait when a photo is absent", async () => {
  state.profile.image = "/images/heinz.jpg";
  const metadata = await generateMetadata({
    searchParams: Promise.resolve({}),
  });
  expect(metadata.openGraph).not.toHaveProperty("images");
  const shell = AboutPage({ searchParams: Promise.resolve({}) });
  const content = shell.props.children;
  const main = await content.type(content.props);
  const schema = JSON.parse(
    main.props.children[0].props.dangerouslySetInnerHTML.__html,
  );
  expect(schema.mainEntity).not.toHaveProperty("image");
});
