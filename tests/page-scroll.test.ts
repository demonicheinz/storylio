import type Lenis from "lenis";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  lockPageScroll,
  registerPageScroller,
  scrollPageTo,
} from "@/lib/page-scroll";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.reverse()) cleanup();
  cleanups.length = 0;
  vi.unstubAllGlobals();
});

function register() {
  const instance = { stop: vi.fn(), start: vi.fn(), scrollTo: vi.fn() };
  cleanups.push(registerPageScroller(instance as unknown as Lenis));
  return instance;
}

function lock() {
  const release = lockPageScroll();
  cleanups.push(release);
  return release;
}

describe("public page scrolling", () => {
  it("keeps overlapping overlays locked and releases each lock only once", () => {
    const instance = register();
    const first = lock();
    const second = lock();
    first();
    first();
    scrollPageTo(100);
    expect(instance.start).not.toHaveBeenCalled();
    expect(instance.scrollTo).not.toHaveBeenCalled();
    second();
    second();
    expect(instance.start).toHaveBeenCalledTimes(1);
    scrollPageTo(100);
    expect(instance.scrollTo).toHaveBeenCalledWith(100, { immediate: false });
  });

  it("locks a deferred instance that loads while a lightbox is open", () => {
    const release = lock();
    const instance = register();
    expect(instance.stop).toHaveBeenCalledTimes(1);
    release();
    expect(instance.start).toHaveBeenCalledTimes(1);
  });

  it("does not clear the new instance when an old route cleans up", () => {
    const old = registerPageScroller({} as Lenis);
    const current = register();
    old();
    scrollPageTo(200, { immediate: true });
    expect(current.scrollTo).toHaveBeenCalledWith(200, { immediate: true });
  });

  it("uses native scrolling after public layout cleanup", () => {
    const cleanup = registerPageScroller({} as Lenis);
    cleanup();
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollTo });
    scrollPageTo(0, { immediate: true });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });

  it("uses final layout coordinates and CSS offsets for animated headings", () => {
    const instance = register();
    const root = {};
    const parent = { offsetTop: 200, clientTop: 1, offsetParent: null };
    const heading = {
      offsetTop: 400,
      offsetParent: parent,
    } as unknown as HTMLElement;
    vi.stubGlobal("document", { documentElement: root });
    vi.stubGlobal("getComputedStyle", (element: unknown) =>
      element === root
        ? { scrollPaddingTop: "8px" }
        : { scrollMarginTop: "112px" },
    );
    scrollPageTo(heading);
    expect(instance.scrollTo).toHaveBeenCalledWith(481, { immediate: false });
  });
});
