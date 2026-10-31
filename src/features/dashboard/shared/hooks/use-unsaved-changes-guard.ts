"use client";

import { useEffect } from "react";
import { registerNavigationGuard } from "../navigation-guard";

/** Protect draft editors: protect reloads and ordinary in-app link navigation. */
export function useUnsavedChangesGuard(dirty: boolean, context: string) {
  useEffect(() => {
    if (!dirty) return;
    return registerNavigationGuard(
      `Leave ${context} and discard unsaved changes?`,
    );
  }, [dirty, context]);
}
