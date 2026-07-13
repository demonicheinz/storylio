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
      <div className="flex bg-surface/70 backdrop-blur p-1 border border-border/50 rounded-full w-fit">
        {languages.map((item) => {
          const isActive = language === item.value;

          return (
            <Button
              key={item.value}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "px-4 rounded-full h-8",
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
      <p className="text-muted-foreground text-lg leading-8">{intro}</p>
    </div>
  );
}
