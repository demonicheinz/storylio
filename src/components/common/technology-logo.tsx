"use client";

import { CodeIcon } from "@phosphor-icons/react";
import Image, { type StaticImageData } from "next/image";
import { useState } from "react";
import nextLogo from "@/assets/technology/nextdotjs.svg";
import nodeLogo from "@/assets/technology/nodedotjs.svg";
import postgresLogo from "@/assets/technology/postgresql.svg";
import reactLogo from "@/assets/technology/react.svg";
import typescriptLogo from "@/assets/technology/typescript.svg";
import { normalizeTechnologyName } from "@/lib/home-technologies";
import { cn } from "@/lib/utils";

const builtInLogos: Record<string, StaticImageData> = {
  nextjs: nextLogo,
  react: reactLogo,
  typescript: typescriptLogo,
  nodejs: nodeLogo,
  postgresql: postgresLogo,
};

type TechnologyLogoProps = {
  label: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
  monoClassName?: string;
};

export function TechnologyLogo(props: TechnologyLogoProps) {
  return (
    <LogoImage key={`${props.label}:${props.imageUrl ?? ""}`} {...props} />
  );
}

function LogoImage({
  label,
  imageUrl,
  size = 40,
  className,
  monoClassName,
}: TechnologyLogoProps) {
  const local = builtInLogos[normalizeTechnologyName(label)];
  const [source, setSource] = useState<"uploaded" | "builtin" | "fallback">(
    imageUrl ? "uploaded" : local ? "builtin" : "fallback",
  );
  const src =
    source === "uploaded" ? imageUrl : source === "builtin" ? local : undefined;
  return (
    <span
      className={cn("inline-grid place-items-center shrink-0", className)}
      style={{ width: size, height: size }}
      data-logo-source={source}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          unoptimized
          className={cn(
            "size-full object-contain",
            source === "builtin" && (monoClassName ?? "dark:invert"),
          )}
          onError={() =>
            setSource(source === "uploaded" && local ? "builtin" : "fallback")
          }
        />
      ) : (
        <CodeIcon size={Math.max(size - 8, 16)} aria-hidden="true" />
      )}
    </span>
  );
}
