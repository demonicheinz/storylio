"use client";

import Link from "next/link";
import { introCopy } from "@/components/public/sections/about/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AboutLanguage = keyof typeof introCopy;

const languages: {
  label: string;
  value: AboutLanguage;
}[] = [
  { label: "English", value: "en" },
  { label: "Indonesian", value: "id" },
];

export function LanguageIntro({
  intro,
  language,
}: {
  intro: string;
  language: AboutLanguage;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex w-fit rounded-full border border-border/50 bg-surface/70 p-1 backdrop-blur">
        {languages.map((item) => {
          const isActive = language === item.value;

          return (
            <Button
              key={item.value}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 rounded-full px-4",
                !isActive && "text-muted-foreground hover:text-foreground",
              )}
              asChild
            >
              <Link href={`/about?lang=${item.value}`} scroll={false}>
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>
      <p className="text-lg leading-8 text-muted-foreground">{intro}</p>
    </div>
  );
}
