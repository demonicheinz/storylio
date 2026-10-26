"use client";

import { ArrowClockwiseIcon, HouseIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";
import { PublicState } from "@/components/public/public-state";
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
    <PublicState
      title="This page couldn’t load."
      description="The issue may be temporary. Try again, or return home to keep exploring."
    >
      <Button
        type="button"
        onClick={() => unstable_retry()}
        className="min-h-11"
      >
        <ArrowClockwiseIcon aria-hidden="true" /> Try again
      </Button>
      <Button
        role="link"
        render={<Link href="/" />}
        nativeButton={false}
        variant="outline"
        className="min-h-11"
      >
        <HouseIcon aria-hidden="true" /> Home
      </Button>
    </PublicState>
  );
}
