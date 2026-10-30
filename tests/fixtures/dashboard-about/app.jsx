import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Logo } from "@/components/common/logo";
import { ExperienceSection } from "@/components/public/sections/about/experience";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastProvider } from "@/components/ui/toast";
import { AboutContentForm } from "@/features/dashboard/about/components/content-form";
import { AboutStructuredManager } from "@/features/dashboard/about/components/structured-manager";

const data = {
  experiences: [
    {
      id: "work",
      title: "Full Stack Developer working on accessible publishing tools",
      company: "An example company with a deliberately long name",
      location: "Central Java, Indonesia",
      order: 0,
      isVisible: true,
      startDate: "2024-01",
      isCurrent: true,
      descriptionEn: "Developing thoughtful web applications.",
      descriptionId: "Membangun aplikasi web yang mudah digunakan.",
    },
  ],
  education: [
    {
      id: "course",
      institution: "Independent learning and professional development",
      degree: "Web development",
      order: 0,
      isVisible: true,
      startYear: "2022",
      endYear: "2024",
    },
  ],
  categories: [
    {
      id: "frontend",
      name: "Frontend",
      order: 0,
      isVisible: true,
      skills: [
        {
          id: "react",
          name: "React",
          level: "Advanced",
          order: 0,
          isVisible: true,
        },
        {
          id: "typescript",
          name: "TypeScript with a deliberately long label",
          level: "Daily use",
          order: 1,
          isVisible: true,
        },
      ],
    },
    {
      id: "backend",
      name: "Backend",
      order: 1,
      isVisible: false,
      skills: [
        {
          id: "postgres",
          name: "PostgreSQL",
          level: "Intermediate",
          order: 0,
          isVisible: true,
        },
      ],
    },
  ],
};
const content = {
  introEn: "I build web applications with a focus on clarity and usability.",
  introId: "Saya membangun aplikasi web yang jelas dan mudah digunakan.",
  howIWorkEn:
    "I work from a concrete problem, test the assumptions, and refine the details.",
  howIWorkId: "Saya mulai dari masalah yang jelas dan menguji asumsi.",
  whatIValueEn: "Accessible interfaces and maintainable software.",
  whatIValueId:
    "Antarmuka yang mudah diakses dan perangkat lunak yang mudah dirawat.",
  defaultLanguage: "en",
};
function PublicExperienceRegression() {
  const [language, setLanguage] = useState("en");
  return (
    <main className="mx-auto p-6 max-w-3xl">
      <button
        type="button"
        onClick={() => setLanguage(language === "en" ? "id" : "en")}
      >
        Switch language
      </button>
      <ExperienceSection
        language={language}
        experiences={[
          {
            id: "duplicate-highlights",
            title: "Developer",
            company: "Example",
            location: null,
            type: null,
            startDate: "2024",
            endDate: null,
            isCurrent: true,
            description: null,
            highlights: ["Highlight", "Highlight", "Another achievement"],
          },
        ]}
      />
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  location.search.includes("public-experience") ? (
    <PublicExperienceRegression />
  ) : (
    <ToastProvider>
      <main className="mx-auto p-4 md:p-8 w-full max-w-6xl">
        <Logo loading="eager" />
        <h1 className="mb-6 font-semibold text-3xl">About</h1>
        <Tabs defaultValue="content" className="gap-5 min-w-0">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 [&>button]:px-2 w-full sm:w-fit h-auto [&>button]:min-h-11">
            {["content", "experience", "education", "skills"].map((value) => (
              <TabsTrigger key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="content" keepMounted>
            <AboutContentForm content={content} />
          </TabsContent>
          {["experience", "education", "skills"].map((section) => (
            <TabsContent key={section} value={section}>
              <AboutStructuredManager data={data} section={section} />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </ToastProvider>
  ),
);
