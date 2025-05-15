import type { SocialLinks } from "@/types/data";

export const person = {
  name: "Ahmad Haizul Amany",
  role: "Full Stack Developer",
  location: "Central Java, Indonesia",
  avatar: "/images/heinz.jpg",
  languages: ["Indonesian", "English"],
};

export const social: SocialLinks = [
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/demonicheinz",
  },
  {
    name: "Instagram",
    icon: "instagram",
    link: "https://instagram.com/im.heinzzz",
  },

  {
    name: "X",
    icon: "twitter",
    link: "https://x.com/chrysantastixxx",
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://linkedin.com/",
  },
  {
    name: "Email",
    icon: "email",
    link: "mailto:contact@heinz.id",
  },
];

export const about = {
  title: "About",
  description: "Information about me, my work experience, education, and skills.",
  path: "/about",
  tableOfContent: {
    display: true,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "https://calendly.com/yourusername",
  },
  intro: {
    title: "Introduction",
    display: true,
    description:
      "I'm Heinz — a full-stack developer and informatics student passionate about building modern, scalable web apps. I work with React, Next.js, TypeScript, and backend tools like Prisma, GraphQL, and PostgreSQL. I enjoy crafting clean code, exploring new tech, and delivering user-friendly digital experiences.",
  },
  work: {
    title: "Work Experience",
    display: true,
    experiences: [
      {
        company: "FLY",
        role: "Senior Design Engineer",
        timeframe: "2022 - Present",
        achievements: [
          "Redesigned the UI/UX for the FLY platform, resulting in a 20% increase in user engagement and 30% faster load times.",
          "Spearheaded the integration of AI tools into design workflows, enabling designers to iterate 50% faster.",
        ],
        images: [
          {
            src: "/images/bg.png",
            alt: "FLY",
            width: 254,
            height: 142,
          },
        ],
      },
      {
        company: "CreativJ",
        role: "Lead Designer",
        timeframe: "2018 - 2022",
        achievements: [
          "Developed a design system that unified the brand across multiple platforms, improving design consistency by 40%.",
          "Led a cross-functional team to launch a new product line, contributing to a 15% increase in overall company revenue.",
        ],
        images: [],
      },
    ],
  },
  education: {
    title: "Education",
    display: true,
    institutions: [
      {
        name: "University of Jakarta",
        description: "Studied software engineering.",
      },
      {
        name: "Build the Future",
        description: "Studied online marketing and personal branding.",
      },
    ],
  },
  technical: {
    title: "Technical skills",
    display: true,
    skills: [
      {
        title: "Figma",
        description: "Able to prototype in Figma with Once UI with unnatural speed.",
        images: [
          {
            src: "/images/bg.png",
            alt: "FLY",
            width: 254,
            height: 142,
          },
        ],
      },
      {
        title: "Next.js",
        description: "Building next gen apps with Next.js + Once UI + Supabase.",
        images: [
          {
            src: "/images/bg.png",
            alt: "FLY",
            width: 254,
            height: 142,
          },
        ],
      },
    ],
  },
};
