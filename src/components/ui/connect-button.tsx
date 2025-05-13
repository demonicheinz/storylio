import React from "react";
import { Icon, type IconProps } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { IconName } from "@/data";
import Image from "next/image";

export interface ConnectButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  iconName?: IconName;
  imageSrc?: string;
  imageAlt?: string;
  iconPosition?: "left" | "right";
  imagePosition?: "left" | "right";
  iconSize?: number;
  imageSize?: number;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  iconProps?: Omit<IconProps, "name" | "size">;
  imageProps?: Omit<React.ComponentProps<typeof Image>, "src" | "alt" | "width" | "height">;
}

const ConnectButton = React.forwardRef<HTMLButtonElement, ConnectButtonProps>(
  (
    {
      children,
      className,
      iconName,
      imageSrc,
      imageAlt = "",
      iconPosition = "right",
      imagePosition = "left",
      iconSize = 16,
      imageSize,
      variant = "default",
      size = "md",
      iconProps,
      imageProps,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "no-underline group cursor-pointer relative shadow-zinc-900 rounded-full p-px font-semibold leading-6 inline-block";

    const variantStyles = {
      default: "bg-slate-800 text-white shadow-2xl",
      outline: "bg-transparent border border-slate-800 text-slate-800",
      ghost: "bg-transparent text-slate-800 hover:bg-slate-100",
    };

    const sizeStyles = {
      sm: "text-xs py-1.5 px-4",
      md: "text-sm py-2.5 px-6",
      lg: "text-base py-3.5 px-8",
    };

    const imageSizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    // Calculate actual image size based on imageSize prop or size variant
    const actualImageSize = imageSize || (size === "sm" ? 16 : size === "md" ? 20 : 24);

    const renderIcon = iconName && (
      <span
        className={cn(
          "flex items-center justify-center",
          iconPosition === "left" ? "mr-2" : "ml-2",
        )}
      >
        <Icon
          name={iconName}
          size={iconSize}
          {...iconProps}
        />
      </span>
    );

    const renderImage = imageSrc && (
      <span
        className={cn(
          "flex items-center justify-center",
          imagePosition === "left" ? "mr-2" : "ml-2",
        )}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={actualImageSize}
          height={actualImageSize}
          className={cn("object-contain", imageSizeClasses[size])}
          {...imageProps}
        />
      </span>
    );

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        <span className="absolute inset-0 rounded-full overflow-hidden">
          <span className="absolute inset-0 bg-[image:radial-gradient(75%_100%_at_50%_0%,oklch(0.85_0.1114_302.42)_0%,oklch(0.8_0.1114_302.42/0)_75%)] opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-500" />
        </span>
        <div
          className={cn(
            "relative flex items-center z-10 rounded-full bg-zinc-950 ring-1 ring-white/10",
            sizeStyles[size],
          )}
        >
          {imagePosition === "left" && renderImage}
          {iconPosition === "left" && renderIcon}
          <span>{children}</span>
          {iconPosition === "right" && renderIcon}
          {imagePosition === "right" && renderImage}
        </div>
        <span className="-bottom-0 left-[1.125rem] absolute bg-gradient-to-r from-purple/0 via-purple/90 to-purple/0 group-hover:opacity-40 w-[calc(100%-2.25rem)] h-px transition-opacity duration-500" />
      </button>
    );
  },
);

ConnectButton.displayName = "ConnectButton";

export { ConnectButton };
