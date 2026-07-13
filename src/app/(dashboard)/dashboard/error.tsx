"use client";

import { ArrowClockwiseIcon, HouseIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard page error:", error);
  }, [error]);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-7.5rem)]">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>Dashboard page unavailable</CardTitle>
          <CardDescription>
            The requested CMS view could not be loaded. Your saved content was
            not changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => unstable_retry()}>
            <ArrowClockwiseIcon />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <HouseIcon />
              Dashboard overview
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
