"use client";

import { ArrowClockwiseIcon, HouseIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Public page error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-24">
      <section className="w-full max-w-2xl rounded-3xl border border-border/40 bg-surface/70 p-8 text-center shadow-[0_0_72px_rgba(139,92,246,0.12)] backdrop-blur-xl md:p-10">
        <p className="text-xs font-semibold tracking-[0.32em] text-brand-soft uppercase">
          Page unavailable
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold text-foreground">
          This part of Storylio could not load.
        </h1>
        <p className="mx-auto mt-5 max-w-lg leading-8 text-muted-foreground">
          The issue may be temporary. Try again, or return home while the page
          recovers.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => unstable_retry()}>
            <ArrowClockwiseIcon />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <HouseIcon />
              Home
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
