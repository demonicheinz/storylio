"use client";

import { useState } from "react";
import { introCopy } from "@/components/public/sections/about/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Language = keyof typeof introCopy;
type IntroCopy = Record<Language, string>;

const languages: {
  label: string;
  value: Language;
}[] = [
  { label: "English", value: "en" },
  { label: "Indonesia", value: "id" },
];

export function LanguageIntro({
  introCopyOverride,
}: {
  introCopyOverride?: Partial<IntroCopy>;
}) {
  const [language, setLanguage] = useState<Language>("en");
  const copy = {
    ...introCopy,
    ...introCopyOverride,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex w-fit rounded-full border border-border/50 bg-surface/70 p-1 backdrop-blur">
        {languages.map((item) => {
          const isActive = language === item.value;

          return (
            <Button
              key={item.value}
              type="button"
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 rounded-full px-4",
                !isActive && "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setLanguage(item.value)}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
      <p className="text-lg leading-8 text-muted-foreground">
        {copy[language]}
      </p>
    </div>
  );
}
