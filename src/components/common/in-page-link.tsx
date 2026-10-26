"use client";

import type { ComponentProps, MouseEvent } from "react";
import { navigateToAnchor } from "@/lib/page-scroll";

/** Preserve modified clicks while handling repeated in-page navigation. */
export function scrollToAnchor(
  event: MouseEvent<HTMLAnchorElement>,
  href: `#${string}`,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.currentTarget.target && event.currentTarget.target !== "_self")
  )
    return;
  if (navigateToAnchor(href)) event.preventDefault();
}

/** Keep hash history in sync with Next.js, including repeated anchor activation. */
export function InPageLink({
  href,
  children,
  ...props
}: Omit<ComponentProps<"a">, "href" | "onClick"> & { href: `#${string}` }) {
  return (
    <a {...props} href={href} onClick={(event) => scrollToAnchor(event, href)}>
      {children}
    </a>
  );
}
