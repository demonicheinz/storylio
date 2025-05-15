"use client";

import { Button, Icon } from "@/components/ui";
import { about, person, social } from "@/data/";
import Link from "next/link";

export function BioSection() {
  return (
    <div className="flex flex-col gap-8 md:py-2">
      <div className="flex flex-col items-center sm:items-center md:items-start">
        <h1 className="font-bold text-[28px] sm:text-[44px] md:text-[56px]">{person.name}</h1>
        <p className="-mt-1 sm:mt-0 text-[20px] text-purple sm:text-[28px] md:text-[32px]">
          {person.role}
        </p>

        {social.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5 mb-2">
            {social.map((item) => (
              <Button
                key={item.name}
                variant="outline"
                size="icon"
                className="md:px-3 md:py-2 rounded-full md:rounded-full w-8 md:w-auto h-8 md:h-auto"
                asChild
              >
                <Link href={item.link || "#"}>
                  <Icon
                    name={item.icon}
                    className="md:mr-1 w-4 h-4"
                  />
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              </Button>
            ))}
          </div>
        )}
      </div>

      <p className="text-lg leading-relaxed">{about.intro.description}</p>
    </div>
  );
}
