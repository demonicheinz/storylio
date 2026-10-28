import Image from "next/image";
import logoDark from "@/assets/logo/logo-dark.svg";
import logoLight from "@/assets/logo/logo-light.svg";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  alt = "Storylio",
  size = 28,
  loading = "lazy",
}: {
  className?: string;
  alt?: string;
  size?: number;
  loading?: "eager" | "lazy";
}) {
  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={logoLight}
        alt={alt}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        loading={loading}
        className="dark:hidden block object-contain"
      />
      <Image
        src={logoDark}
        alt={alt}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        loading={loading}
        className="hidden dark:block object-contain"
      />
    </span>
  );
}
