"use client";

import type { MagicButtonProps } from "@/types/ui";

export const MagicButton = ({ order }: MagicButtonProps) => {
  return (
    <div className="flex justify-center items-center">
      <button
        type="button"
        className="inline-flex relative p-[1px] rounded-full overflow-hidden"
      >
        <span className="absolute inset-[-1000%] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] animate-[spin_2s_linear_infinite]" />
        <span className="inline-flex justify-center items-center bg-background-secondary backdrop-blur-3xl px-6 py-3 rounded-full w-full h-full font-medium text-white text-base cursor-pointer">
          {order}
        </span>
      </button>
    </div>
  );
};
