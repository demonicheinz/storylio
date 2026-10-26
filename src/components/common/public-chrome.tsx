"use client";

import {
  ArticleIcon,
  CodeIcon,
  HouseIcon,
  ImagesIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { type ReactNode, Suspense } from "react";
import {
  FloatingNav,
  type FloatingNavItem,
} from "@/components/common/floating-nav";
import { RouteMotion } from "@/components/common/motion";
import { PublicStarfield } from "@/components/common/public-starfield";
import styles from "./public-chrome.module.css";

const navItems: FloatingNavItem[] = [
  {
    icon: <HouseIcon />,
    name: "Home",
    link: "/",
  },
  {
    icon: <UserCircleIcon />,
    name: "About",
    link: "/about",
  },
  {
    icon: <CodeIcon />,
    name: "Projects",
    link: "/projects",
  },
  {
    icon: <ArticleIcon />,
    name: "Blog",
    link: "/blog",
  },
  {
    icon: <ImagesIcon />,
    name: "Gallery",
    link: "/gallery",
  },
];

export function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <div className={`flex flex-col min-h-screen ${styles.chrome}`}>
      <Suspense fallback={null}>
        <PublicStarfield />
      </Suspense>
      <Suspense fallback={null}>
        <FloatingNav navItems={navItems} />
      </Suspense>
      <div className="flex-1">
        <Suspense fallback={null}>
          <RouteMotion>{children}</RouteMotion>
        </Suspense>
      </div>
    </div>
  );
}
