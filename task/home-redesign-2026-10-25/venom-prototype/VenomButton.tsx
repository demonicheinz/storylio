"use client";

import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./VenomButton.module.css";

type VenomButtonProps = {
  children?: ReactNode;
  onClick?: () => void;
  strands?: number;
  /** Tendrils let go beyond this distance from the button edge. */
  maxPull?: number;
  /** Broader liquid roots; false leaves finer individual filaments. */
  goo?: boolean;
  className?: string;
};
type Point = { x: number; y: number };

// Ray intersection with the rounded rectangle, including its straight sides.
function perimeter(
  angle: number,
  halfW: number,
  halfH: number,
  radius: number,
) {
  const ux = Math.cos(angle),
    uy = Math.sin(angle);
  let low = 0,
    high = Math.hypot(halfW, halfH);
  for (let i = 0; i < 14; i++) {
    const distance = (low + high) / 2;
    const qx = Math.abs(ux * distance) - halfW + radius;
    const qy = Math.abs(uy * distance) - halfH + radius;
    const outside =
      Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
      Math.min(Math.max(qx, qy), 0) -
      radius;
    if (outside > 0) high = distance;
    else low = distance;
  }
  return { x: ux * low, y: uy * low };
}
function curve(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x,
    y: u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t ** 3 * d.y,
  };
}
const point = (p: Point) => p.x.toFixed(2) + "," + p.y.toFixed(2);

function ribbon(samples: Point[], widthAt: (t: number) => number) {
  const left: Point[] = [],
    right: Point[] = [];
  const last = samples.length - 1;
  samples.forEach((p, i) => {
    const before = samples[Math.max(0, i - 1)],
      after = samples[Math.min(last, i + 1)];
    const distance = Math.hypot(after.x - before.x, after.y - before.y) || 1;
    const width = widthAt(i / last);
    const dx = (-(after.y - before.y) / distance) * width;
    const dy = ((after.x - before.x) / distance) * width;
    left.push({ x: p.x + dx, y: p.y + dy });
    right.push({ x: p.x - dx, y: p.y - dy });
  });
  return {
    body:
      "M" +
      left.map(point).join(" L") +
      " L" +
      right.reverse().map(point).join(" L") +
      " Z",
    glint: "M" + left.map(point).join(" L"),
  };
}

const freeSeeds = [-1.35, -0.8, -0.3, 0.35, 0.95, 1.5];

export default function VenomButton({
  children = "we are venom",
  onClick,
  strands = 9,
  maxPull = 360,
  goo = true,
  className,
}: VenomButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const cutoutRef = useRef<SVGRectElement>(null);
  const bodyRefs = useRef<(SVGPathElement | null)[]>([]);
  const glintRefs = useRef<(SVGPathElement | null)[]>([]);
  const webRefs = useRef<(SVGPathElement | null)[]>([]);
  const freeRefs = useRef<(SVGPathElement | null)[]>([]);
  const freeGlintRefs = useRef<(SVGPathElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);
  const maskId = "venom-" + useId().replace(/:/g, "");
  const count = Number.isFinite(strands)
    ? Math.max(3, Math.min(18, Math.round(strands)))
    : 9;
  const pull = Number.isFinite(maxPull) ? Math.max(60, maxPull) : 360;
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: "strand-" + i,
        offset: (i / (count - 1) - 0.5) * 2,
        phase: i * 2.399,
        width: 2 + ((i * 17) % 5) * 0.55,
      })),
    [count],
  );

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    const button = btnRef.current,
      group = groupRef.current,
      cutout = cutoutRef.current;
    if (!button || !group || !cutout) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const s = {
      x: 0,
      y: 0,
      mx: 0,
      my: 0,
      vx: 0,
      vy: 0,
      active: false,
      running: false,
      raf: 0,
      last: 0,
    };
    let rect = button.getBoundingClientRect();
    let radius = 0;
    const measure = () => {
      rect = button.getBoundingClientRect();
      const value = getComputedStyle(button).borderTopLeftRadius;
      radius = Math.min(
        rect.width / 2,
        rect.height / 2,
        Number.parseFloat(value) *
          (value.endsWith("%") ? Math.min(rect.width, rect.height) / 100 : 1) ||
          0,
      );
      cutout.setAttribute("x", String(rect.left + 1));
      cutout.setAttribute("y", String(rect.top + 1));
      cutout.setAttribute("width", String(Math.max(0, rect.width - 2)));
      cutout.setAttribute("height", String(Math.max(0, rect.height - 2)));
      cutout.setAttribute("rx", String(Math.max(0, radius - 1)));
    };
    const stop = () => {
      cancelAnimationFrame(s.raf);
      s.active = false;
      s.running = false;
      group.style.opacity = "0";
      button.removeAttribute("data-pulling");
      button.style.removeProperty("--venom-light-x");
    };
    const step = (now: number) => {
      const cx = rect.left + rect.width / 2,
        cy = rect.top + rect.height / 2;
      const dt = Math.min((now - s.last) / 16.667, 2);
      s.last = now;
      const tx = s.active ? s.mx : cx,
        ty = s.active ? s.my : cy;
      const damping = 0.73 ** dt;
      s.vx = (s.vx + (tx - s.x) * 0.19 * dt) * damping;
      s.vy = (s.vy + (ty - s.y) * 0.19 * dt) * damping;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const angle = Math.atan2(s.y - cy, s.x - cx);
      const ux = Math.cos(angle),
        uy = Math.sin(angle),
        nx = -uy,
        ny = ux;
      const edge = perimeter(angle, rect.width / 2, rect.height / 2, radius);
      const length = Math.max(
        0,
        Math.hypot(s.x - cx, s.y - cy) - Math.hypot(edge.x, edge.y),
      );
      const grow = Math.min(1, length / 30),
        tension = Math.min(1, length / pull);
      if (!s.active && length < 1) {
        stop();
        return;
      }
      group.style.opacity = String(s.active ? 1 : grow);
      const curves: Point[][] = [];
      seeds.forEach((seed, index) => {
        const root = perimeter(
          angle + seed.offset * 0.92,
          rect.width / 2,
          rect.height / 2,
          radius,
        );
        const a = { x: cx + root.x * 0.98, y: cy + root.y * 0.98 };
        // Widen the contact BEHIND the native cursor, never draw a replacement pointer.
        const contact = Math.sin(seed.phase * 1.7);
        const fan = contact * (13 + tension * 4);
        const d = {
          x: s.x - ux * (5 + Math.abs(contact) * 11) + nx * fan,
          y: s.y - uy * (5 + Math.abs(contact) * 11) + ny * fan,
        };
        const slack =
          (Math.sin(seed.phase + now * 0.0021) * 0.7 +
            Math.sin(seed.phase * 1.3 - now * 0.0033) * 0.3) *
          (1 - tension * 0.75) *
          Math.min(35, length * 0.22);
        const inertia = Math.max(-28, Math.min(28, s.vx * nx + s.vy * ny));
        const b = {
          x:
            a.x +
            ux * length * 0.24 +
            nx * (seed.offset * 18 + slack - inertia),
          y:
            a.y +
            uy * length * 0.24 +
            ny * (seed.offset * 18 + slack - inertia),
        };
        const c = {
          x:
            d.x -
            ux * length * 0.29 -
            nx * (seed.offset * 24 + slack * 0.7 + inertia * 0.4),
          y:
            d.y -
            uy * length * 0.29 -
            ny * (seed.offset * 24 + slack * 0.7 + inertia * 0.4),
        };
        const samples = Array.from({ length: 25 }, (_, j) =>
          curve(a, b, c, d, j / 24),
        );
        curves.push(samples);
        const shape = ribbon(
          samples,
          (t) =>
            ((goo ? 5.5 : 2) * (1 - t) ** 7 +
              seed.width *
                (0.25 + 0.3 * Math.sin(Math.PI * t + seed.phase) ** 2) *
                (1 - tension * 0.45) +
              1.15 * t ** 9) *
            (1 - 0.88 * t ** 12) *
            grow,
        );
        bodyRefs.current[index]?.setAttribute("d", shape.body);
        glintRefs.current[index]?.setAttribute("d", shape.glint);
      });

      // Unattached feelers keep searching around the roots while the cursor rests.
      freeSeeds.forEach((offset, i) => {
        const phase = now * (0.0017 + i * 0.00019) + i * 2.3;
        const theta = angle + offset + Math.sin(phase * 0.7) * 0.08;
        const root = perimeter(theta, rect.width / 2, rect.height / 2, radius);
        const rx = Math.cos(theta),
          ry = Math.sin(theta),
          px = -ry,
          py = rx;
        const reach = 22 + (i % 3) * 11 + Math.sin(phase) * 8;
        const curl = Math.sin(phase * 1.3) * 22;
        const a = { x: cx + root.x * 0.98, y: cy + root.y * 0.98 };
        const d = {
          x: a.x + rx * reach + px * curl * 0.65,
          y: a.y + ry * reach + py * curl * 0.65,
        };
        const b = {
          x: a.x + rx * reach * 0.65 - px * curl,
          y: a.y + ry * reach * 0.65 - py * curl,
        };
        const c = {
          x: d.x + rx * reach * 0.35 + px * curl,
          y: d.y + ry * reach * 0.35 + py * curl,
        };
        const samples = Array.from({ length: 25 }, (_, j) =>
          curve(a, b, c, d, j / 24),
        );
        const shape = ribbon(
          samples,
          (t) => (3.4 + (i % 3) * 0.6) * (1 - t) ** 1.55 + 0.06,
        );
        freeRefs.current[i]?.setAttribute("d", shape.body);
        freeGlintRefs.current[i]?.setAttribute("d", shape.glint);
      });
      // Sparse, irregular bridges give the fibres a webbed structure.
      seeds.forEach((seed, i) => {
        if (i === seeds.length - 1) return;
        const t = 7 + ((i * 7) % 12);
        const a = curves[i][t],
          b = curves[i + 1][Math.min(24, t + 3 + (i % 3))];
        const bend = 5 * Math.sin(seed.phase);
        webRefs.current[i]?.setAttribute(
          "d",
          "M" +
            point(a) +
            " Q" +
            ((a.x + b.x) / 2 + nx * bend) +
            "," +
            ((a.y + b.y) / 2 + ny * bend) +
            " " +
            point(b),
        );
      });
      // Keep the symbiote alive while engaged, including with a stationary cursor.
      s.raf = requestAnimationFrame(step);
    };
    const start = () => {
      if (s.running) return;
      s.running = true;
      s.last = performance.now();
      s.raf = requestAnimationFrame(step);
    };
    const move = (event: PointerEvent) => {
      if (!s.active || event.pointerType !== "mouse") return;
      s.mx = event.clientX;
      s.my = event.clientY;
      const outsideX = Math.max(rect.left - s.mx, 0, s.mx - rect.right);
      const outsideY = Math.max(rect.top - s.my, 0, s.my - rect.bottom);
      if (Math.hypot(outsideX, outsideY) > pull) {
        s.active = false;
        button.removeAttribute("data-pulling");
      }
      button.style.setProperty(
        "--venom-light-x",
        Math.max(10, Math.min(90, ((s.mx - rect.left) / rect.width) * 100)) +
          "%",
      );
      start();
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || motion.matches || !fine.matches)
        return;
      measure();
      if (!s.active) {
        s.x = event.clientX;
        s.y = event.clientY;
        s.vx = 0;
        s.vy = 0;
      }
      s.active = true;
      button.setAttribute("data-pulling", "true");
      move(event);
    };
    const preference = () => {
      if (motion.matches || !fine.matches) stop();
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    button.addEventListener("pointerenter", enter);
    button.addEventListener("click", stop);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    window.addEventListener("resize", stop);
    window.addEventListener("scroll", stop, true);
    window.addEventListener("keydown", stop);
    document.addEventListener("mouseleave", stop);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", preference);
    fine.addEventListener("change", preference);
    return () => {
      stop();
      button.removeEventListener("pointerenter", enter);
      button.removeEventListener("click", stop);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
      window.removeEventListener("resize", stop);
      window.removeEventListener("scroll", stop, true);
      window.removeEventListener("keydown", stop);
      document.removeEventListener("mouseleave", stop);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", preference);
      fine.removeEventListener("change", preference);
    };
  }, [mounted, seeds, pull, goo]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={onClick}
        className={[styles.btn, className ?? ""].join(" ")}
      >
        <span className={styles.reflection} aria-hidden="true" />
        <span className={styles.label}>{children}</span>
      </button>
      {mounted &&
        createPortal(
          <svg className={styles.overlay} aria-hidden="true" focusable="false">
            <defs>
              <mask
                id={maskId}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="100%"
                height="100%"
              >
                <rect width="100%" height="100%" fill="white" />
                <rect ref={cutoutRef} fill="black" />
              </mask>
            </defs>
            <g
              ref={groupRef}
              style={{ opacity: 0 }}
              mask={"url(#" + maskId + ")"}
            >
              {seeds.map((seed, i) => (
                <path
                  key={seed.id}
                  className={styles.strand}
                  ref={(el) => {
                    bodyRefs.current[i] = el;
                  }}
                />
              ))}
              {seeds.slice(0, -1).map((seed, i) => (
                <path
                  key={seed.id}
                  className={styles.web}
                  ref={(el) => {
                    webRefs.current[i] = el;
                  }}
                />
              ))}
              {seeds.map((seed, i) => (
                <path
                  key={seed.id}
                  className={styles.glint}
                  ref={(el) => {
                    glintRefs.current[i] = el;
                  }}
                />
              ))}
              {freeSeeds.map((seed, i) => (
                <path
                  key={seed}
                  data-tendril="free"
                  className={styles.strand}
                  ref={(el) => {
                    freeRefs.current[i] = el;
                  }}
                />
              ))}
              {freeSeeds.map((seed, i) => (
                <path
                  key={seed}
                  className={styles.glint}
                  ref={(el) => {
                    freeGlintRefs.current[i] = el;
                  }}
                />
              ))}
            </g>
          </svg>,
          document.body,
        )}
    </>
  );
}
