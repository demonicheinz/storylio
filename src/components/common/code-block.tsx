"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function CodeBlock({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      // Some browsers report Shift + wheel as deltaY instead of deltaX.
      if (
        !event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.deltaX ||
        !event.deltaY
      )
        return;
      if (element.scrollWidth <= element.clientWidth) return;
      const unit =
        event.deltaMode === 1
          ? Number.parseFloat(getComputedStyle(element).lineHeight)
          : event.deltaMode === 2
            ? element.clientWidth
            : 1;
      if (event.cancelable) {
        event.preventDefault();
        element.scrollLeft += event.deltaY * unit;
      }
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="bg-background/80 border border-border/40 rounded-lg max-w-full overflow-hidden">
      <pre
        ref={ref}
        data-lenis-prevent-wheel
        style={{ overscrollBehaviorY: "auto" }}
        className="[&_code]:bg-transparent [&_mark]:bg-transparent **:data-highlighted-chars:bg-transparent **:data-highlighted-line:bg-transparent p-4 [&_code]:p-0 max-w-full overflow-x-auto [&_code]:text-inherit text-sm leading-7 whitespace-pre scrollbar-thin"
      >
        {children}
      </pre>
    </div>
  );
}
