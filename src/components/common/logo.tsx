import Image from "next/image";
import logoDark from "@/assets/logo/logo-dark.svg";
import logoLight from "@/assets/logo/logo-light.svg";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  alt = "Storylio",
  size = 28,
}: {
  className?: string;
  alt?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex shrink-0", className)}>
      <Image
        src={logoLight}
        alt={alt}
        width={size}
        height={size}
        className="block dark:hidden object-contain"
      />
      <Image
        src={logoDark}
        alt={alt}
        width={size}
        height={size}
        className="hidden dark:block object-contain"
      />
    </span>
  );
}
