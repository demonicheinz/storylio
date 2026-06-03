import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PublicBackground } from "@/components/common";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <PublicBackground variant="projects" />

      <section className="w-full max-w-2xl rounded-3xl border border-border/40 bg-surface/70 p-8 text-center shadow-[0_0_72px_rgba(139,92,246,0.12)] backdrop-blur-xl md:p-10">
        <p className="mb-4 text-xs font-semibold tracking-[0.32em] text-brand-soft uppercase">
          404 / Project not found
        </p>
        <h1 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
          This project is not in the archive.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-8 text-muted-foreground">
          The project may be unpublished, moved, or never existed. Head back to
          the projects archive to browse the published work.
        </p>

        <Button asChild className="mt-8 rounded-full">
          <Link href="/projects">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to projects
          </Link>
        </Button>
      </section>
    </main>
  );
}
