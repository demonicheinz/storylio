import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IMAGE_QUALITY } from "@/lib/image-policy";

export function renderWithImages(children: ReactNode): string {
  return renderToStaticMarkup(
    createElement(
      ImageConfigContext.Provider,
      {
        value: {
          ...imageConfigDefault,
          qualities: Object.values(IMAGE_QUALITY),
        },
      },
      children,
    ),
  );
}
