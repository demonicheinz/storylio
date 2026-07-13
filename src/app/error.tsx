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
    <main className="flex justify-center items-center bg-background px-4 py-24 min-h-screen text-foreground">
      <section className="bg-card shadow-lg p-8 md:p-10 border rounded-3xl w-full max-w-xl text-center">
        <p className="font-semibold text-destructive text-xs uppercase tracking-[0.28em]">
          Unexpected error
        </p>
        <h1 className="mt-4 font-heading font-bold text-3xl">
          Storylio could not load this page.
        </h1>
        <p className="mt-4 text-muted-foreground leading-7">
          The problem may be temporary. Try loading the page again, or return
          home.
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
