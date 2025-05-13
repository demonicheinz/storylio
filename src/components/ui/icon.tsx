import React from "react";
import { iconLibrary, type IconName } from "@/data";
import { cn } from "@/lib/utils";
import type { IconBaseProps } from "react-icons";

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  wrapperClassName?: string;
  useWrapper?: boolean;
  iconProps?: IconBaseProps;
  wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
}

const Icon = React.forwardRef<HTMLDivElement, IconProps>(
  (
    {
      name,
      size = 24,
      className,
      useWrapper = false,
      wrapperClassName,
      iconProps = {},
      wrapperProps = {},
    },
    ref,
  ) => {
    const IconComponent = iconLibrary[name];

    if (!IconComponent) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Icon dengan nama "${name}" tidak ditemukan.`);
      }
      return null;
    }

    // Without wrapper (direct SVG)
    if (!useWrapper) {
      return (
        <span
          ref={ref}
          className={className}
          {...wrapperProps}
        >
          <IconComponent
            size={size}
            {...iconProps}
          />
        </span>
      );
    }

    // With wrapper (div containing SVG)
    return (
      <div
        className={cn("inline-flex items-center justify-center", wrapperClassName)}
        ref={ref}
        {...wrapperProps}
      >
        <IconComponent
          size={size}
          className={className}
          {...iconProps}
        />
      </div>
    );
  },
);

Icon.displayName = "Icon";

export { Icon };
