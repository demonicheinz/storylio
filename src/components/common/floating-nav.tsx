"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import GooeyNav from "@/components/common/gooey-nav";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getPublicNavIndex } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export type FloatingNavItem = {
  icon?: ReactNode;
  name: string;
  link: string;
};

export const FloatingNav = ({
  navItems,
  className,
  initiallyVisible = true,
}: {
  navItems: FloatingNavItem[];
  className?: string;
  initiallyVisible?: boolean;
}) => {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(initiallyVisible);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = getPublicNavIndex(
    pathname,
    navItems.map((item) => item.link),
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () =>
      setTheme(root.classList.contains("dark") ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      if (containerRef.current?.querySelector(":focus-visible")) {
        setVisible(true);
        return;
      }
      const direction = current - (scrollYProgress.getPrevious() ?? 0);

      if (scrollYProgress.get() < 0.05) {
        setVisible(true);
      } else if (direction < 0) {
        setVisible(true);
      } else if (direction > 0) {
        setVisible(false);
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={containerRef}
        onFocusCapture={() => setVisible(true)}
        initial={false}
        animate={{
          y: visible || reducedMotion ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: reducedMotion ? 0 : 0.2,
        }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
        className={cn(
          "top-5 z-50 fixed inset-x-0 flex justify-center items-center mx-auto max-w-[calc(100vw-2rem)] sm:max-w-fit",
          className,
        )}
      >
        <GooeyNav
          items={navItems.map((item) => ({
            label: item.name,
            href: item.link,
            icon: item.icon,
          }))}
          activeIndex={activeIndex}
          theme={theme}
          color={theme === "dark" ? "#f2fbfe" : "#000b27"}
          activeTextColor={theme === "dark" ? "#000b27" : "#f2fbfe"}
          colors={["#068ce6"]}
          compactOnMobile
          animationTime={400}
          particleCount={7}
          timeVariance={100}
          spread={24}
          gooeyness={0.3}
          wobble={0.2}
          style={
            {
              "--gn-frame":
                "color-mix(in oklch, var(--surface) 96%, transparent)",
              "--gn-frame-edge": "var(--border)",
              "--gn-frame-highlight":
                "color-mix(in oklch, var(--glow) 6%, transparent)",
              "--gn-frame-shadow": "0 12px 28px -12px rgb(0 11 39 / 35%)",
              "--gn-ink": "var(--foreground)",
              "--gn-muted": "var(--muted-foreground)",
            } as CSSProperties
          }
        />
      </motion.div>
    </AnimatePresence>
  );
};
