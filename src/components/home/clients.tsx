"use client";

import { InfiniteCards } from "@/components/ui";
import { companies, testimonials } from "@/data";
import type { ClientsProps } from "@/types/ui";
import Image from "next/image";
import React from "react";

export function Clients({
  title = "Kind words from",
  subtitle = "satisfied clients",
}: ClientsProps = {}) {
  return (
    <section
      id="testimonials"
      className="py-10"
    >
      <h1 className="heading">
        {title}
        <span className="text-purple"> {subtitle}</span>
      </h1>

      <div className="flex flex-col items-center max-lg:mt-10">
        <div className="relative flex flex-col justify-center items-center bg-transparent rounded-md h-[50vh] md:h-[30rem] overflow-hidden antialiased">
          <InfiniteCards
            clientItems={testimonials}
            direction="left"
            speed="normal"
          />
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-16 max-lg:mt-10">
          {companies.map((company) => (
            <React.Fragment key={company.id}>
              <div className="flex justify-center items-center gap-2 max-w-32 md:max-w-60">
                <div className="relative w-5 md:w-10 h-5 md:h-10">
                  <Image
                    src={company.img}
                    alt={company.name}
                    fill
                    sizes="(max-width: 768px) 20px, 40px"
                    className="invert-0 dark:invert-0 object-contain filter"
                    loading="lazy"
                  />
                </div>
                <div className="relative w-20 md:w-24 h-6 md:h-8">
                  <Image
                    src={company.nameImg}
                    alt={company.name}
                    fill
                    sizes="(max-width: 768px) 80px, 96px"
                    className="invert-0 dark:invert-0 object-contain filter"
                    loading="lazy"
                  />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
