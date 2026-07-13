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
    <main className="flex justify-center items-center bg-background px-4 py-24 min-h-screen">
      <section className="bg-surface/70 shadow-[0_0_72px_rgba(139,92,246,0.12)] backdrop-blur-xl p-8 md:p-10 border border-border/40 rounded-3xl w-full max-w-2xl text-center">
        <p className="font-semibold text-brand-soft text-xs uppercase tracking-[0.32em]">
          Page unavailable
        </p>
        <h1 className="mt-4 font-heading font-bold text-foreground text-4xl">
          This part of Storylio could not load.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-muted-foreground leading-8">
          The issue may be temporary. Try again, or return home while the page
          recovers.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
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
