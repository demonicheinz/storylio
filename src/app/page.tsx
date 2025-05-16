import { ApproachSection, ClientsSection, HeroSection } from "@/components/home";
import { cn } from "@/lib/utils";

export default function Home() {
  const mainStyles = cn(
    "relative flex flex-col items-center min-h-screen w-full",
    "text-white overflow-x-hidden",
  );

  const contentContainerStyles = cn(
    "relative z-10 w-full max-w-[1400px] mx-auto",
    "px-4 sm:px-6 lg:px-8",
  );

  return (
    <main className={mainStyles}>
      {/* Hero Section - Full screen */}
      <section className="w-full h-screen">
        <HeroSection />
      </section>

      {/* Main content */}
      <div className={contentContainerStyles}>
        <div className="flex flex-col gap-10">
          <section className="w-full">
            <ApproachSection />
          </section>
          <section className="w-full">
            <ClientsSection />
          </section>
        </div>
      </div>

      {/* Footer spacing */}
      <div className="h-32" />
    </main>
  );
}
