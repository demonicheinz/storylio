"use client";

import { ArrowClockwiseIcon, HouseIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-24 text-foreground">
      <section className="w-full max-w-xl rounded-3xl border bg-card p-8 text-center shadow-lg md:p-10">
        <p className="text-xs font-semibold tracking-[0.28em] text-destructive uppercase">
          Unexpected error
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold">
          Storylio could not load this page.
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          The problem may be temporary. Try loading the page again, or return
          home.
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
