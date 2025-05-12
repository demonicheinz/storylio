"use client";

import React from "react";
import Image from "next/image";
import { testimonials, companies } from "@/data";
import { InfiniteCards } from "@/components/ui/infinite-cards";

const Clients = () => {
  const isCompactLogo = (id: number) => id === 4 || id === 5;

  return (
    <section
      id="testimonials"
      className="py-10"
    >
      <h1 className="heading">
        Kind words from
        <span className="text-purple"> satisfied clients</span>
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
                <div className="relative w-5 md:w-10 aspect-auto">
                  <Image
                    src={company.img}
                    alt={company.name}
                    width={40}
                    height={40}
                    className="invert-0 dark:invert-0 object-contain filter"
                    loading="lazy"
                  />
                </div>
                <div className="relative w-20 md:w-24 aspect-auto">
                  <Image
                    src={company.nameImg}
                    alt={company.name}
                    width={isCompactLogo(company.id) ? 100 : 150}
                    height={40}
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
};

export default Clients;
