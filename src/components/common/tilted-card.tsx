"use client";

import { type ReactNode, useEffect, useRef } from "react";
import styles from "./tilted-card.module.css";

function spring(
  state: Record<string, number>,
  key: string,
  target: number,
  dt: number,
) {
  const velocity = `v${key}`;
  const omega = 20 * 0.2 ** 0.6;
  const steps = Math.max(1, Math.ceil(dt * 240));
  const step = dt / steps;
  for (let i = 0; i < steps; i++) {
    state[velocity] +=
      (omega * omega * (target - state[key]) -
        2 * 0.82 * omega * state[velocity]) *
      step;
    state[key] += state[velocity] * step;
  }
  if (
    Math.abs(target - state[key]) < 0.001 &&
    Math.abs(state[velocity]) < 0.01
  ) {
    state[key] = target;
    state[velocity] = 0;
    return false;
  }
  return true;
}

/** Cover-only enhancement; listens on its parent link or an explicit card target. */
export function TiltedCard({
  children,
  amplitude = 4,
  scale = 1.02,
}: {
  children: ReactNode;
  amplitude?: number;
  scale?: number;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    const body = bodyRef.current;
    const link = stage?.closest<HTMLElement>("a, [data-tilt-target]");
    if (!stage || !body || !link) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(hover: hover) and (pointer: fine)");
    const controller = new AbortController();
    const options = { signal: controller.signal, passive: true };
    const state: Record<string, number> = {
      rx: 0,
      vrx: 0,
      ry: 0,
      vry: 0,
      lift: 0,
      vlift: 0,
    };
    let rx = 0,
      ry = 0,
      lift = 0,
      raf = 0,
      last = 0,
      visible = true;
    const allowed = () =>
      !motion.matches && pointer.matches && visible && !document.hidden;
    const reset = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      rx = ry = lift = 0;
      for (const key of Object.keys(state)) state[key] = 0;
      body.style.transform = "";
      body.style.removeProperty("--tilt-glare");
      delete stage.dataset.tiltActive;
    };
    const frame = (now: number) => {
      raf = 0;
      if (!allowed()) {
        reset();
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const movingX = spring(state, "rx", rx, dt);
      const movingY = spring(state, "ry", ry, dt);
      const movingLift = spring(state, "lift", lift, dt);
      body.style.transform = `rotateX(${state.rx}deg) rotateY(${state.ry}deg) scale(${1 + (scale - 1) * state.lift})`;
      body.style.setProperty("--tilt-glare", String(state.lift * 0.12));
      const busy = movingX || movingY || movingLift;
      stage.toggleAttribute("data-tilt-active", lift > 0 || busy);
      if (busy) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (raf || !allowed()) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const track = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !allowed()) return;
      const bounds = link.getBoundingClientRect();
      const x = Math.max(
        -1,
        Math.min(
          1,
          (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2),
        ),
      );
      const y = Math.max(
        -1,
        Math.min(
          1,
          (event.clientY - bounds.top - bounds.height / 2) /
            (bounds.height / 2),
        ),
      );
      rx = -y * amplitude;
      ry = x * amplitude;
      lift = 1;
      body.style.setProperty("--tilt-gx", `${(x + 1) * 50}%`);
      body.style.setProperty("--tilt-gy", `${(y + 1) * 50}%`);
      wake();
    };
    link.addEventListener("pointerenter", track, options);
    link.addEventListener("pointermove", track, options);
    link.addEventListener(
      "pointerleave",
      () => {
        rx = ry = lift = 0;
        wake();
      },
      options,
    );
    motion.addEventListener("change", reset, options);
    pointer.addEventListener("change", reset, options);
    window.addEventListener("blur", reset, options);
    document.addEventListener("visibilitychange", reset, options);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset();
    });
    observer.observe(stage);
    return () => {
      controller.abort();
      observer.disconnect();
      reset();
    };
  }, [amplitude, scale]);
  return (
    <div ref={stageRef} className={styles.stage} data-tilted-cover>
      <div ref={bodyRef} className={styles.body}>
        {children}
        <span className={styles.glare} aria-hidden="true" />
      </div>
    </div>
  );
}
