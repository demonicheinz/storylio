import type { PrismaClient } from "@/generated/prisma";

const aboutContent = {
  introEn:
    "I'm Heinz, a full-stack developer and informatics student passionate about building modern, scalable web apps. I work with React, Next.js, TypeScript, and backend tools like Prisma and PostgreSQL. I enjoy crafting clean code, exploring new tech, and delivering user-friendly digital experiences.",
  introId:
    "Saya Heinz, full-stack developer sekaligus mahasiswa informatika yang senang membangun aplikasi web modern dan scalable. Saya banyak bekerja dengan React, Next.js, TypeScript, serta backend tools seperti Prisma dan PostgreSQL. Saya menikmati proses merapikan kode, mengeksplorasi teknologi baru, dan membuat pengalaman digital yang nyaman digunakan.",
  howIWorkEn:
    "I like building from the middle of design and engineering: enough structure to keep a product maintainable, enough visual care to make it feel memorable. My best work usually starts with a clear problem, a small set of constraints, and a willingness to polish the details people actually touch.\n\nThe stack I reach for most often is Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, and small interface systems that make repeated work easier. I care about fast pages, useful content models, and interfaces that still feel calm after the hundredth visit.",
  whatIValueEn:
    "- Clear communication before clever implementation\n- Responsive interfaces that feel intentional on every screen\n- Server-first architecture with client components only where interaction needs them\n- Content workflows that let projects grow without constant code edits",
  defaultLanguage: "en",
};
const ABOUT_CONTENT_SINGLETON_ID = "about-content";

export async function seedAboutContent(db: PrismaClient) {
  const existing = await db.aboutContent.findFirst({
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: { id: true },
  });

  if (existing) {
    console.log("About content already exists");
    return;
  }

  await db.aboutContent.upsert({
    where: { id: ABOUT_CONTENT_SINGLETON_ID },
    update: {},
    create: {
      id: ABOUT_CONTENT_SINGLETON_ID,
      ...aboutContent,
    },
  });
  console.log("Created initial About content");
}
