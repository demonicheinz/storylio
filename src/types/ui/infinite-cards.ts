import type { Testimonial } from "@/types";

export type Direction = "left" | "right";
export type Speed = "fast" | "normal" | "slow";

export interface InfiniteCardsProps {
  clientItems: Testimonial[];
  direction?: Direction;
  speed?: Speed;
  pauseOnHover?: boolean;
  className?: string;
}
