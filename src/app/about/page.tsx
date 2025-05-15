"use client";

import {
  BioSection,
  EducationSection,
  ExperienceSection,
  ProfileSection,
  SideNavigation,
  SkillsSection,
} from "@/components/about";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  // Constants untuk spacings dan widths
  const SECTION_SPACING = "mt-15";
  const PROFILE_WIDTHS = {
    base: "w-[240px]",
    lg: "lg:w-[280px]",
    xl: "xl:w-[320px]",
  };

  return (
    <main className="min-h-screen">
      {/* Wrapper utama */}
      <div className="flex xl:flex-row flex-col justify-center min-h-screen">
        {/* Kolom Kiri - Navigasi (fixed) */}
        <div className="hidden left-0 fixed xl:flex flex-col justify-center items-center h-screen">
          <SideNavigation />
        </div>

        {/* Kolom Tengah - Area konten utama */}
        <div className="relative flex flex-col justify-center mx-auto px-4 sm:px-6 lg:px-8 pt-30 w-full min-w-0 max-w-[1056px]">
          {/* Container dengan 2 kolom di md, 1 kolom di sm */}
          <div className="flex md:flex-row flex-col w-full">
            {/* Profile section for mobile */}
            <div className="md:hidden flex flex-col items-center gap-4 pb-8 w-full">
              <ProfileSection />
            </div>

            {/* Fixed position profile for desktop */}
            <div
              className={cn(
                "hidden z-10 fixed md:flex flex-col items-start gap-4 px-4 pb-8",
                `max-w-${PROFILE_WIDTHS.base}`,
                `lg:max-w-${PROFILE_WIDTHS.lg}`,
                `xl:max-w-${PROFILE_WIDTHS.xl}`,
                "md:pr-6 lg:pr-8",
              )}
              style={{ top: "120px" }}
            >
              <ProfileSection />
            </div>

            {/* Spacer div for desktop to match the width of the fixed profile */}
            <div
              className={cn(
                "hidden md:block flex-shrink-0",
                PROFILE_WIDTHS.base,
                PROFILE_WIDTHS.lg,
                PROFILE_WIDTHS.xl,
              )}
            />

            {/* Area konten */}
            <div className="relative flex flex-col md:pl-6 lg:pl-4 xl:pl-0 w-full max-w-full md:max-w-[calc(100%-280px)] lg:max-w-[calc(100%-320px)] xl:max-w-[40rem]">
              <section
                id="introduction"
                className="mt-8 md:mt-0"
              >
                <BioSection />
              </section>

              {["work-experience", "education-history", "technical-skills"].map((id, index) => (
                <section
                  key={id}
                  id={id}
                  className={cn(
                    SECTION_SPACING,
                    index === 2 ? "mb-16" : "", // Tambahkan margin bottom pada section terakhir
                  )}
                >
                  {id === "work-experience" && <ExperienceSection />}
                  {id === "education-history" && <EducationSection />}
                  {id === "technical-skills" && <SkillsSection />}
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer spacing */}
      <div className="h-32" />
    </main>
  );
}
