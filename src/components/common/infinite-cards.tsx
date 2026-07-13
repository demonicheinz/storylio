"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  avatar?: string;
}

export type Direction = "left" | "right";
export type Speed = "fast" | "normal" | "slow";

export interface InfiniteCardsProps {
  clientItems: Testimonial[];
  direction?: Direction;
  speed?: Speed;
  pauseOnHover?: boolean;
  className?: string;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function InfiniteCards({
  clientItems,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: InfiniteCardsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ignoreNextClickRef = React.useRef(false);
  const [start, setStart] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const repeatedGroups = useMemo(
    () => [
      { id: "alpha", items: clientItems },
      { id: "bravo", items: clientItems },
      { id: "charlie", items: clientItems },
    ],
    [clientItems],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse",
    );

    const baseDuration = speed === "fast" ? 20 : speed === "normal" ? 40 : 80;
    const duration = `${baseDuration * 2}s`;

    containerRef.current.style.setProperty("--animation-duration", duration);
    setStart(true);
  }, [direction, speed]);

  const togglePause = () => {
    if (!pauseOnHover) return;

    setIsPaused((current) => !current);
  };

  const handleClick = () => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }

    togglePause();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!pauseOnHover || event.pointerType === "mouse") return;

    ignoreNextClickRef.current = true;
    togglePause();
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!pauseOnHover || event.pointerType !== "mouse") return;

    setIsHoverPaused(true);
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!pauseOnHover || event.pointerType !== "mouse") return;

    setIsHoverPaused(false);
  };

  const animationPlayState = isPaused || isHoverPaused ? "paused" : "running";

  return (
    <div
      ref={containerRef}
      className={cn(
        "z-20 relative w-full overflow-hidden scroller mask-[linear-gradient(to_right,transparent,white_5%,white_95%,transparent)]",
        className,
      )}
    >
      <button
        aria-label={isPaused ? "Resume testimonials" : "Pause testimonials"}
        aria-pressed={isPaused}
        className={cn(
          "flex flex-nowrap py-8 w-max min-w-full text-left shrink-0",
          start && "animate-scroll",
        )}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        style={{ animationPlayState }}
        type="button"
      >
        <MarqueeGroup groups={repeatedGroups} />
        <MarqueeGroup groups={repeatedGroups} ariaHidden />
      </button>
    </div>
  );
}

function MarqueeGroup({
  groups,
  ariaHidden,
}: {
  groups: {
    id: string;
    items: Testimonial[];
  }[];
  ariaHidden?: boolean;
}) {
  return (
    <div
      aria-hidden={ariaHidden}
      className="flex flex-nowrap gap-6 pr-6 shrink-0"
    >
      {groups.flatMap((group) =>
        group.items.map((item) => (
          <TestimonialCard item={item} key={`${group.id}-${item.name}`} />
        )),
      )}
    </div>
  );
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <article className="relative flex bg-surface/90 hover:bg-surface-hover shadow-md hover:shadow-xl backdrop-blur-sm px-6 sm:px-8 py-6 border border-border/40 hover:border-brand-soft/60 rounded-3xl w-[min(86vw,22rem)] sm:w-95 md:w-112.5 h-68 sm:h-64 md:h-60 transition-all hover:-translate-y-2 duration-300 shrink-0">
      <blockquote className="flex flex-col min-w-0 h-full">
        <p className="z-20 relative min-w-0 font-normal text-[#E4ECFF] text-base wrap-break-word italic text-wrap leading-[1.8] tracking-wide">
          &ldquo;{item.quote}&rdquo;
        </p>
        <div className="z-20 relative flex flex-row items-center gap-3 mt-auto pt-6">
          <Avatar className="border-2 border-brand-soft/50 size-12">
            {item.avatar ? (
              <AvatarImage src={item.avatar} alt={`${item.name} avatar`} />
            ) : null}
            <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
          </Avatar>
          <span className="flex flex-col">
            <span className="font-semibold text-brand-soft/90 text-sm leading-[1.6]">
              {item.name}
            </span>
            {item.title ? (
              <span className="font-normal text-gray-400 text-xs leading-[1.6]">
                {item.title}
              </span>
            ) : null}
          </span>
        </div>
      </blockquote>
    </article>
  );
}
