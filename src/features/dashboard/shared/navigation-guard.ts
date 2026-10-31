"use client";

import { confirmAction } from "./confirmation";

const guards = new Map<symbol, string>();
let replaying = false;
let permittedUnloadUntil = 0;

function beforeUnload(event: BeforeUnloadEvent) {
  if (Date.now() < permittedUnloadUntil) {
    permittedUnloadUntil = 0;
    return;
  }
  event.preventDefault();
  event.returnValue = "";
}

function navigate(event: MouseEvent) {
  if (
    replaying ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const anchor =
    event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (
    !(anchor instanceof HTMLAnchorElement) ||
    (anchor.target && anchor.target !== "_self") ||
    anchor.hasAttribute("download")
  )
    return;
  const next = new URL(anchor.href, location.href);
  if (
    !["http:", "https:"].includes(next.protocol) ||
    (next.origin === location.origin &&
      next.pathname === location.pathname &&
      next.search === location.search)
  )
    return;
  const message = guards.values().next().value;
  if (!message) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const href = anchor.href;
  void confirmAction(message, {
    title: "Leave this page?",
    confirmLabel: "Leave page",
  }).then((approved) => {
    if (!approved || !anchor.isConnected || anchor.href !== href) return;
    // Replay the original link so Next Link, targets and native navigation keep their behavior.
    permittedUnloadUntil = Date.now() + 1000;
    replaying = true;
    try {
      anchor.click();
    } finally {
      replaying = false;
    }
  });
}

export function registerNavigationGuard(message: string) {
  const id = Symbol();
  guards.set(id, message);
  if (guards.size === 1) {
    permittedUnloadUntil = 0;
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", navigate, true);
  }
  return () => {
    guards.delete(id);
    if (!guards.size) {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", navigate, true);
      permittedUnloadUntil = 0;
    }
  };
}
