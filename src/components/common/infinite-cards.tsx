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
        "scroller relative z-20 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_5%,white_95%,transparent)]",
        className,
      )}
    >
      <button
        aria-label={isPaused ? "Resume testimonials" : "Pause testimonials"}
        aria-pressed={isPaused}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap py-8 text-left",
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
      className="flex shrink-0 flex-nowrap gap-6 pr-6"
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
    <article className="relative flex h-[17rem] w-[min(86vw,22rem)] flex-shrink-0 rounded-3xl border border-border/40 bg-surface/90 px-6 py-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-brand-soft/60 hover:bg-surface-hover hover:shadow-xl sm:h-[16rem] sm:w-[380px] sm:px-8 md:h-[15rem] md:w-[450px]">
      <blockquote className="flex h-full min-w-0 flex-col">
        <p className="relative z-20 min-w-0 text-base leading-[1.8] font-normal tracking-wide text-wrap break-words text-[#E4ECFF] italic">
          &ldquo;{item.quote}&rdquo;
        </p>
        <div className="relative z-20 mt-auto flex flex-row items-center gap-3 pt-6">
          <Avatar className="size-12 border-2 border-brand-soft/50">
            {item.avatar ? (
              <AvatarImage src={item.avatar} alt={`${item.name} avatar`} />
            ) : null}
            <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
          </Avatar>
          <span className="flex flex-col">
            <span className="text-sm leading-[1.6] font-semibold text-brand-soft/90">
              {item.name}
            </span>
            {item.title ? (
              <span className="text-xs leading-[1.6] font-normal text-gray-400">
                {item.title}
              </span>
            ) : null}
          </span>
        </div>
      </blockquote>
    </article>
  );
}
