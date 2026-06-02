"use client";

import { Card, MagicButton } from "@/components/common";
import { CanvasRevealEffect } from "@/components/effects";

export type HomePhase = {
  id: string;
  label: string;
  content: string | null;
  order: number;
};

const visualPresets = [
  {
    backgroundClassName: "bg-emerald-900",
    animationSpeed: 3,
    colors: undefined,
    dotSize: undefined,
  },
  {
    backgroundClassName: "bg-pink-900",
    animationSpeed: 3,
    colors: [
      [255, 166, 158],
      [221, 255, 247],
    ],
    dotSize: 2,
  },
  {
    backgroundClassName: "bg-sky-600",
    animationSpeed: 3,
    colors: [[125, 211, 252]],
    dotSize: undefined,
  },
] satisfies {
  backgroundClassName: string;
  animationSpeed: number;
  colors?: number[][];
  dotSize?: number;
}[];

export function ApproachSection({ phases }: { phases: HomePhase[] }) {
  return (
    <section className="w-full py-10">
      <h1 className="heading">
        My <span className="text-brand-soft">approach</span>
      </h1>
      <div className="mx-auto my-20 flex w-full max-w-7xl flex-wrap justify-center gap-6 px-4">
        {phases.map((phase, index) => {
          const visual = visualPresets[index % visualPresets.length];

          return (
            <Card
              key={phase.id}
              title={phase.label}
              icon={<MagicButton as="span" order={`Phase ${phase.order}`} />}
              des={
                phase.content ??
                "A focused phase in the process from idea to launch."
              }
            >
              <CanvasRevealEffect
                animationSpeed={visual.animationSpeed}
                containerClassName={`${visual.backgroundClassName} rounded-3xl overflow-hidden`}
                colors={visual.colors}
                dotSize={visual.dotSize}
              />
            </Card>
          );
        })}
      </div>
    </section>
  );
}
