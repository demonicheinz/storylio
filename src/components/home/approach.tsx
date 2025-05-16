"use client";

import { Card } from "@/components/home";
import { CanvasRevealEffect, MagicButton } from "@/components/ui";
import { approachData } from "@/data";

export const ApproachSection = () => {
  return (
    <section className="py-10 w-full">
      <h1 className="heading">
        My <span className="text-purple-300">approach</span>
      </h1>
      <div className="flex flex-wrap justify-center gap-6 mx-auto my-20 px-4 w-full max-w-7xl">
        {approachData.map((card) => (
          <Card
            key={card.id}
            title={card.title}
            icon={<MagicButton order={card.phase} />}
            des={card.description}
          >
            <CanvasRevealEffect
              animationSpeed={card.animationSpeed}
              containerClassName={`${card.backgroundClassName} rounded-3xl overflow-hidden`}
              colors={card.colors}
              dotSize={card.dotSize}
            />
          </Card>
        ))}
      </div>
    </section>
  );
};
