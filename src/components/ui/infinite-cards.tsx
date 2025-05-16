"use client";

import { cn } from "@/lib/utils";
import type { InfiniteCardsProps } from "@/types/ui";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

export const InfiniteCards = ({
  clientItems,
  direction = "left",
  speed = "normal",
  pauseOnHover = true,
  className,
}: InfiniteCardsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Buat array dengan item yang diulang untuk animasi mulus
  const repeatedItems = [...clientItems, ...clientItems, ...clientItems];

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;

    // Atur arah dan kecepatan animasi
    if (containerRef.current) {
      containerRef.current.style.setProperty(
        "--animation-direction",
        direction === "left" ? "forwards" : "reverse",
      );

      const duration = speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s";
      containerRef.current.style.setProperty("--animation-duration", duration);
    }

    setStart(true);

    // Cleanup function untuk mencegah duplikasi animasi saat komponen unmount
    return () => {
      setStart(false);
    };
  }, [clientItems, direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn("scroller relative z-20 w-full overflow-hidden", className)}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-6 py-8 w-max flex-nowrap",
          start && "animate-scroll",
          isHovered && pauseOnHover && "paused",
        )}
        style={{ paddingLeft: "0", paddingRight: "0" }}
        onMouseEnter={() => pauseOnHover && setIsHovered(true)}
        onMouseLeave={() => pauseOnHover && setIsHovered(false)}
      >
        {repeatedItems.map((item, idx) => (
          <li
            key={`${item.name}-${idx}`}
            className="relative flex-shrink-0 bg-dark-purple/90 hover:bg-hover shadow-md hover:shadow-xl backdrop-blur-sm px-8 py-6 border border-border/40 hover:border-border-secondary/60 rounded-3xl w-[350px] md:w-[450px] max-w-full transition-all hover:-translate-y-2 duration-300"
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="-top-0.5 -left-0.5 -z-1 absolute w-[calc(100%_+_4px)] h-[calc(100%_+_4px)] pointer-events-none user-select-none"
              />
              <span className="z-20 relative font-normal text-gray-700 dark:text-[#E4ECFF] text-base italic leading-[1.8] tracking-wide">
                &ldquo;{item.quote}&rdquo;
              </span>
              <div className="z-20 relative flex flex-row items-center gap-4 mt-6">
                <div className="shadow-sm border-2 border-purple/50 rounded-full w-12 h-12 overflow-hidden">
                  <Image
                    src={item.avatar}
                    alt={`${item.name}'s avatar`}
                    width={48}
                    height={48}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="flex flex-col">
                  <span className="font-semibold text-purple/90 text-sm leading-[1.6]">
                    {item.name}
                  </span>
                  <span className="font-normal text-gray-400 text-xs leading-[1.6]">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
