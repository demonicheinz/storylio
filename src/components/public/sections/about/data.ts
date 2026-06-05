export const person = {
  name: "Ahmad Haizul Amany",
  role: "Full Stack Developer",
  location: "Central Java, Indonesia",
  avatar: "/images/heinz.jpg",
  languages: ["Indonesian", "English"],
};

export const socialLinks = [
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/demonicheinz/",
  },
  {
    name: "Instagram",
    icon: "instagram",
    link: "https://instagram.com/im.heinzzz/",
  },
  {
    name: "X",
    icon: "twitter",
    link: "https://x.com/chrysantastixxx/",
  },
  {
    name: "Email",
    icon: "email",
    link: "mailto:contact@heinz.id",
  },
] as const;

export const introCopy = {
  en: "I'm Heinz, a full-stack developer and informatics student passionate about building modern, scalable web apps. I work with React, Next.js, TypeScript, and backend tools like Prisma and PostgreSQL. I enjoy crafting clean code, exploring new tech, and delivering user-friendly digital experiences.",
  id: "Saya Heinz, full-stack developer sekaligus mahasiswa informatika yang senang membangun aplikasi web modern dan scalable. Saya banyak bekerja dengan React, Next.js, TypeScript, serta backend tools seperti Prisma dan PostgreSQL. Saya menikmati proses merapikan kode, mengeksplorasi teknologi baru, dan membuat pengalaman digital yang nyaman digunakan.",
};

export const aboutStoryFallback = {
  howIWork: `I like building from the middle of design and engineering: enough structure to keep a product maintainable, enough visual care to make it feel memorable. My best work usually starts with a clear problem, a small set of constraints, and a willingness to polish the details people actually touch.

The stack I reach for most often is Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, and small interface systems that make repeated work easier. I care about fast pages, useful content models, and interfaces that still feel calm after the hundredth visit.`,
  whatIValue: `- Clear communication before clever implementation
- Responsive interfaces that feel intentional on every screen
- Server-first architecture with client components only where interaction needs them
- Content workflows that let projects grow without constant code edits`,
};

export const workExperiences = [
  {
    company: "Independent Projects",
    role: "Product-minded Developer",
    timeframe: "2020 - 2022",
    achievements: [
      "Designed and shipped web experiments focused on interface quality and interaction polish.",
      "Explored full-stack patterns across authentication, databases, deployment, and content systems.",
      "Practiced translating rough ideas into usable products with thoughtful UI decisions.",
    ],
  },
  {
    company: "Freelance Developer",
    role: "Full Stack Web Developer",
    timeframe: "2022 - Present",
    achievements: [
      "Developed and maintained client websites using Next.js, React, TypeScript, and Tailwind CSS.",
      "Built responsive interfaces with performance, accessibility, and maintainability in mind.",
      "Created CMS-backed workflows so content can be updated without touching source code.",
    ],
  },
];

export const educationItems = [
  {
    name: "Nahdlatul Ulama Al Ghazali University",
    description: "Bachelor's Degree in Informatics Engineering",
  },
  {
    name: "Dicoding Academy",
    description:
      "Full Stack JavaScript learning path and web development courses",
  },
  {
    name: "freeCodeCamp",
    description: "Responsive Web Design and JavaScript Algorithms fundamentals",
  },
];

export const skillGroups = [
  {
    title: "Frontend",
    description:
      "React, Next.js, TypeScript, Tailwind CSS, shadcn/ui, and motion-driven interfaces.",
  },
  {
    title: "Backend",
    description:
      "Node.js, Prisma, PostgreSQL, API design, authentication, and server-side rendering workflows.",
  },
  {
    title: "UI/UX",
    description:
      "Interface systems, responsive layouts, interaction details, prototyping, and product polish.",
  },
  {
    title: "DevOps",
    description:
      "Vercel, Docker basics, GitHub Actions, environment management, and deployment hygiene.",
  },
];
