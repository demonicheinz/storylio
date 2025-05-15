import { badgeVariants } from "@/data";
import { cn } from "@/lib/utils";
import type { BadgeProps } from "@/types/ui";
import { Slot } from "@radix-ui/react-slot";

function Badge({ className, variant, size, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
