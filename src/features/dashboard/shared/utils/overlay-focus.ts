import type { MouseEvent } from "react";

export function blurBeforeOpen<T extends HTMLElement>(
  event: MouseEvent<T>,
  open: () => void,
) {
  event.currentTarget.blur();

  const schedule =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (callback: FrameRequestCallback) => window.setTimeout(callback, 0);

  schedule(open);
}
