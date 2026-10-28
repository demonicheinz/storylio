"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import styles from "../dashboard-shell.module.css";

/** Tablet starts with a rail; a manual choice survives resizing and navigation. */
export function DashboardSidebarProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const chosen = useRef(false);
  useEffect(() => {
    const desktop = matchMedia("(min-width: 1024px)");
    let preference: string | null = null;
    try {
      preference = localStorage.getItem("storylio.sidebar");
    } catch {}
    if (preference !== "expanded" && preference !== "collapsed")
      preference = null;
    if (preference === "expanded" || preference === "collapsed") {
      setOpen(preference === "expanded");
      chosen.current = true;
    } else setOpen(desktop.matches);
    const update = () => {
      if (!chosen.current) setOpen(desktop.matches);
    };
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);
  const change = (value: boolean) => {
    chosen.current = true;
    setOpen(value);
    try {
      localStorage.setItem(
        "storylio.sidebar",
        value ? "expanded" : "collapsed",
      );
    } catch {}
  };
  return (
    <SidebarProvider
      className={styles.shell}
      open={open}
      onOpenChange={change}
      style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}
    >
      {children}
    </SidebarProvider>
  );
}
