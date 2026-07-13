import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PublicBackground } from "@/components/common";
import { Button } from "@/components/ui/button";

export default function ArticleNotFound() {
  return (
    <main className="flex justify-center items-center px-4 py-24 min-h-screen">
      <PublicBackground variant="blog" />

      <section className="bg-surface/70 shadow-[0_0_72px_rgba(139,92,246,0.12)] backdrop-blur-xl p-8 md:p-10 border border-border/40 rounded-3xl w-full max-w-2xl text-center">
        <p className="mb-4 font-semibold text-brand-soft text-xs uppercase tracking-[0.32em]">
          404 / Article not found
        </p>
        <h1 className="font-heading font-bold text-foreground text-4xl md:text-5xl">
          This article is not available.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-muted-foreground text-base leading-8">
          The article may be unpublished, moved, or never existed. Head back to
          the writing archive to browse published notes.
        </p>

        <Button asChild className="mt-8 rounded-full">
          <Link href="/blog">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to writing
          </Link>
        </Button>
      </section>
    </main>
  );
}
