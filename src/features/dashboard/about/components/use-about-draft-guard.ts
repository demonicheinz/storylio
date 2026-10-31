"use client";

import { useEffect } from "react";
import { registerNavigationGuard } from "@/features/dashboard/shared/navigation-guard";

export function useAboutDraftGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    return registerNavigationGuard("Leave About and discard unsaved changes?");
  }, [dirty]);
}
