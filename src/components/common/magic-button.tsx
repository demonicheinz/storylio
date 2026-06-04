"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

type MagicButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  iconName?: "arrowUpRight";
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  iconPosition?: "left" | "right";
  imageSize?: number;
  iconSize?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
  order?: string;
  href?: string;
  as?: "button" | "span";
};

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const variantClasses = {
  default: "bg-background/90 text-white",
  outline: "bg-background/60 text-white ring-1 ring-white/15",
  ghost: "bg-transparent text-white",
};

export function MagicButton({
  children,
  className,
  iconName,
  imageSrc,
  imageAlt = "",
  imagePosition = "left",
  iconPosition = "right",
  imageSize = 28,
  iconSize = 20,
  size = "md",
  variant = "default",
  order,
  href,
  as = "button",
  type = "button",
  ...props
}: MagicButtonProps) {
  const content = children ?? order;
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(imageSrc) && !hasImageError;
  const showIcon = iconName === "arrowUpRight";

  const classNames = cn(
    "group inline-flex relative p-px rounded-full overflow-hidden",
    className,
  );

  const inner = (
    <>
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
      <span
        className={cn(
          "inline-flex h-full w-full items-center justify-center gap-2 rounded-full font-medium backdrop-blur-3xl transition-colors",
          sizeClasses[size],
          variantClasses[variant],
        )}
      >
        {showImage && imagePosition === "left" && imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={imageSize}
            height={imageSize}
            className="rounded-full object-cover"
            onError={() => setHasImageError(true)}
          />
        ) : null}
        {showIcon && iconPosition === "left" ? (
          <ArrowUpRightIcon size={iconSize} aria-hidden="true" />
        ) : null}
        <span>{content}</span>
        {showIcon && iconPosition === "right" ? (
          <ArrowUpRightIcon
            size={iconSize}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        ) : null}
        {showImage && imagePosition === "right" && imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={imageSize}
            height={imageSize}
            className="rounded-full object-cover"
            onError={() => setHasImageError(true)}
          />
        ) : null}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {inner}
      </Link>
    );
  }

  if (as === "span") {
    return <span className={classNames}>{inner}</span>;
  }

  return (
    <button type={type} className={classNames} {...props}>
      {inner}
    </button>
  );
}
