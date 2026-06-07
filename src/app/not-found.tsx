import { ArrowLeftIcon, CompassIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PublicBackground } from "@/components/common";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <PublicBackground variant="home" />

      <section className="relative w-full max-w-2xl rounded-3xl border border-border/40 bg-surface/70 p-8 text-center shadow-[0_0_72px_rgba(139,92,246,0.12)] backdrop-blur-xl md:p-10">
        <CompassIcon className="mx-auto size-12 text-brand-soft" />
        <p className="mt-6 text-xs font-semibold tracking-[0.32em] text-brand-soft uppercase">
          404 / Page not found
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold text-foreground md:text-5xl">
          This page drifted out of view.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-8 text-muted-foreground">
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
