"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Dot = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
};

type FloatingDotsProps = {
  className?: string;
  count?: number;
  minRadius?: number;
  maxRadius?: number;
  speed?: number;
  color?: string;
  connectThreshold?: number;
  interactive?: boolean;
  lineOpacity?: number;
  mouseLineOpacity?: number;
};

const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.hypot(x2 - x1, y2 - y1);
};

const withOpacity = (color: string, opacity: number) => {
  if (color.startsWith("rgba")) {
    return color.replace(/rgba\((.+?),\s*[\d.]+\)/, `rgba($1, ${opacity})`);
  }

  if (color.startsWith("rgb")) {
    return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
  }

  return color;
};

export function FloatingDots({
  className,
  count = 38,
  minRadius = 0.8,
  maxRadius = 2.2,
  speed = 0.22,
  color = "rgba(168, 85, 247, 0.22)",
  connectThreshold = 145,
  interactive = true,
  lineOpacity = 0.14,
  mouseLineOpacity = 0.28,
}: FloatingDotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const frameRef = useRef<number | null>(null);
  const visibleRef = useRef(true);
  const reducedMotionRef = useRef(false);

  const initDots = useCallback(
    (width: number, height: number) => {
      dotsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        dx: (Math.random() - 0.5) * speed,
        dy: (Math.random() - 0.5) * speed,
        radius: minRadius + Math.random() * (maxRadius - minRadius),
      }));
    },
    [count, maxRadius, minRadius, speed],
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    initDots(rect.width, rect.height);
  }, [initDots]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = container.getBoundingClientRect();

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < dotsRef.current.length; i++) {
      const dot = dotsRef.current[i];

      if (!reducedMotionRef.current) {
        dot.x += dot.dx;
        dot.y += dot.dy;
      }

      if (dot.x < 0 || dot.x > width) {
        dot.dx *= -1;
        dot.x = Math.max(0, Math.min(dot.x, width));
      }

      if (dot.y < 0 || dot.y > height) {
        dot.dy *= -1;
        dot.y = Math.max(0, Math.min(dot.y, height));
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      for (let j = i + 1; j < dotsRef.current.length; j++) {
        const otherDot = dotsRef.current[j];
        const distance = getDistance(dot.x, dot.y, otherDot.x, otherDot.y);

        if (distance > connectThreshold) continue;

        const opacity = (1 - distance / connectThreshold) * lineOpacity;

        ctx.beginPath();
        ctx.moveTo(dot.x, dot.y);
        ctx.lineTo(otherDot.x, otherDot.y);
        ctx.strokeStyle = withOpacity(color, opacity);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      if (interactive) {
        const mouseDistance = getDistance(
          dot.x,
          dot.y,
          mouseRef.current.x,
          mouseRef.current.y,
        );

        const mouseThreshold = connectThreshold * 1.35;

        if (mouseDistance < mouseThreshold) {
          const opacity =
            (1 - mouseDistance / mouseThreshold) * mouseLineOpacity;

          ctx.beginPath();
          ctx.moveTo(dot.x, dot.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.strokeStyle = withOpacity(color, opacity);
          ctx.lineWidth = 0.65;
          ctx.stroke();
        }
      }
    }
  }, [color, connectThreshold, interactive, lineOpacity, mouseLineOpacity]);

  const animate = useCallback(() => {
    if (visibleRef.current) {
      draw();
    }

    frameRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    resizeCanvas();

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      observer.disconnect();

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [animate, resizeCanvas]);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [interactive]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      visibleRef.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
