"use client";
import { useEffect, useRef, useState } from "react";
import { MotionReveal } from "@/components/common/motion";
import { SectionHeading } from "@/components/common/section-heading";
import { TechnologyLogo } from "@/components/common/technology-logo";
import { getTechnologyPage } from "@/lib/technology-pagination";
import styles from "./home.module.css";
import type { HomeLogo } from "./types";

function LogoSlot({
  logo,
  index,
  wave,
  animate,
}: {
  logo: HomeLogo;
  index: number;
  wave: number;
  animate: boolean;
}) {
  const slotRef = useRef<HTMLLIElement>(null);
  const lastWave = useRef(wave);
  const [displayed, setDisplayed] = useState(logo);
  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || !animate || wave === lastWave.current) {
      lastWave.current = wave;
      setDisplayed(logo);
      return;
    }
    lastWave.current = wave;
    const delay = index * 110;
    slot.dataset.wiping = "true";
    // Same 920ms wipe/blur envelope as the supplied logo-clouds reference.
    const animation = slot.animate(
      [
        {
          clipPath: "inset(0 0% 0 0)",
          filter: "blur(0px)",
          opacity: 1,
          offset: 0,
          easing: "ease-in",
        },
        {
          clipPath: "inset(0 100% 0 0)",
          filter: "blur(8px)",
          opacity: 0.2,
          offset: 0.4,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        },
        {
          clipPath: "inset(0 0% 0 0)",
          filter: "blur(0px)",
          opacity: 1,
          offset: 1,
        },
      ],
      { duration: 920, delay },
    );
    const swap = window.setTimeout(() => setDisplayed(logo), delay + 368);
    animation.onfinish = () => {
      delete slot.dataset.wiping;
    };
    return () => {
      clearTimeout(swap);
      animation.cancel();
      delete slot.dataset.wiping;
    };
  }, [logo, index, wave, animate]);
  return (
    <li ref={slotRef} className={styles.logo}>
      <TechnologyLogo
        key={`${displayed.id}-${displayed.imageUrl}`}
        label={displayed.label}
        imageUrl={displayed.imageUrl}
        monoClassName={styles.monoLogo}
      />
      <span className={styles.logoName} title={displayed.label}>
        {displayed.label}
      </span>
    </li>
  );
}

export function TechStackSection({ logos }: { logos: HomeLogo[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const firstWave = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [capacity, setCapacity] = useState(6);
  const [page, setPage] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeDocument, setActiveDocument] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [wave, setWave] = useState(0);
  const group = getTechnologyPage(logos, capacity, page);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const desktop = matchMedia("(min-width: 1200px)");
    const tablet = matchMedia("(min-width: 768px)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const updateSize = () => {
      setCapacity(desktop.matches ? 6 : tablet.matches ? 4 : 3);
      setPage(0);
      setWave((current) => current + 1);
    };
    const updateMotion = () => setReduced(motion.matches);
    const updateVisibility = () => setActiveDocument(!document.hidden);
    desktop.addEventListener("change", updateSize, options);
    tablet.addEventListener("change", updateSize, options);
    motion.addEventListener("change", updateMotion, options);
    document.addEventListener("visibilitychange", updateVisibility, options);
    window.addEventListener("blur", () => setActiveDocument(false), options);
    window.addEventListener("focus", updateVisibility, options);
    const observer = new IntersectionObserver(
      ([entry]) =>
        setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25),
      { threshold: 0.25 },
    );
    observer.observe(section);
    updateSize();
    updateMotion();
    updateVisibility();
    return () => {
      controller.abort();
      observer.disconnect();
    };
  }, [logos.length]);

  useEffect(() => {
    if (visible && !firstWave.current) {
      firstWave.current = true;
      setWave((current) => current + 1);
    }
  }, [visible]);

  useEffect(() => {
    if (reduced || hovered || focused || !visible || !activeDocument) return;
    const timeout = setTimeout(() => {
      setPage((current) => (current + 1) % group.pages);
      setWave((current) => current + 1);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [group.pages, reduced, hovered, focused, visible, activeDocument, wave]);

  const move = (direction: number) => {
    setPage((current) => (current + direction + group.pages) % group.pages);
    setWave((current) => current + 1);
  };
  if (logos.length === 0) return null;
  return (
    <section
      ref={sectionRef}
      className={styles.stack}
      aria-labelledby="stack-title"
      aria-roledescription="carousel"
      data-tech-stack
      data-total={logos.length}
      data-capacity={capacity}
      data-page={group.page}
      data-pages={group.pages}
      data-wave={wave}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <MotionReveal>
        <div className={styles.stackHeader}>
          <SectionHeading id="stack-title" size="compact">
            My usual stack
          </SectionHeading>
          <p>For the interface and the systems behind it.</p>
        </div>
        <div
          className={styles.stackWindow}
          data-tech-window
          role="group"
          tabIndex={group.pages > 1 ? 0 : undefined}
          aria-label="Technologies"
          aria-description={
            group.pages > 1
              ? "Swipe or use the left and right arrow keys to see more technologies."
              : undefined
          }
          onKeyDown={(event) => {
            if (group.pages < 2) return;
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              move(event.key === "ArrowRight" ? 1 : -1);
            } else if (event.key === "Home" || event.key === "End") {
              event.preventDefault();
              setPage(event.key === "Home" ? 0 : group.pages - 1);
              setWave((current) => current + 1);
            }
          }}
          onPointerDown={(event) => {
            if (event.pointerType !== "mouse") {
              swipe.current = { x: event.clientX, y: event.clientY };
              event.currentTarget.setPointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={() => {
            swipe.current = null;
          }}
          onPointerUp={(event) => {
            const start = swipe.current;
            swipe.current = null;
            if (!start || group.pages < 2) return;
            const dx = event.clientX - start.x,
              dy = event.clientY - start.y;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25)
              move(dx < 0 ? 1 : -1);
          }}
        >
          <ul className={styles.logos} aria-live="off">
            {group.items.map((logo, index) => (
              <LogoSlot
                key={index}
                logo={logo}
                index={index}
                wave={wave}
                animate={!reduced && visible && activeDocument}
              />
            ))}
          </ul>
          <span
            className="sr-only"
            aria-live={focused || reduced ? "polite" : "off"}
          >
            Technology group {group.page + 1} of {group.pages}
          </span>
        </div>
      </MotionReveal>
    </section>
  );
}
