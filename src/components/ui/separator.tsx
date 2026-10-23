"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={(state) =>
        cn(
          "data-[orientation=vertical]:self-stretch bg-border data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=horizontal]:h-px shrink-0",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

export { Separator };
