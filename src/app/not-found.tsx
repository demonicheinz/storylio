import { ArrowLeftIcon, CompassIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PublicBackground } from "@/components/common";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex justify-center items-center px-4 py-24 min-h-screen">
      <PublicBackground variant="home" />

      <section className="relative bg-surface/70 shadow-[0_0_72px_rgba(139,92,246,0.12)] backdrop-blur-xl p-8 md:p-10 border border-border/40 rounded-3xl w-full max-w-2xl text-center">
        <CompassIcon className="mx-auto size-12 text-brand-soft" />
        <p className="mt-6 font-semibold text-brand-soft text-xs uppercase tracking-[0.32em]">
          404 / Page not found
        </p>
        <h1 className="mt-4 font-heading font-bold text-foreground text-4xl md:text-5xl">
          This page drifted out of view.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-muted-foreground text-base leading-8">
          The address may be incorrect, or the page may have moved. Return home
          to continue exploring Storylio.
        </p>

        <Button asChild className="mt-8 rounded-full">
          <Link href="/">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to home
          </Link>
        </Button>
      </section>
    </main>
  );
}
