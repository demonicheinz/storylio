import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { MotionReveal, RouteMotion } from "@/components/common/motion";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("motion/react", () => ({
  motion: { div: "div" },
  useReducedMotion: () => false,
}));

function render(pathname: string) {
  route.pathname = pathname;
  return RouteMotion({ children: createElement("main", null, "Page content") });
}

describe("public route animation identity", () => {
  it("keeps content visible before JavaScript starts either animation", () => {
    expect(render("/").props.initial).toMatchObject({ opacity: 1 });
    expect(MotionReveal({ children: "Content" }).props.initial).toMatchObject({
      opacity: 1,
    });
  });
  it("keeps the root shell key when Vercel resumes through its internal /index alias", () => {
    expect(render("/index").key).toBe(render("/").key);
  });
  it.each(["/about", "/projects", "/projects/storylio", "/blog", "/gallery"])(
    "preserves route-change identity for %s",
    (path) => {
      expect(render(path).key).toBe(path);
      expect(render(path).props.animate).toEqual({ opacity: 1, y: 0 });
    },
  );
});
