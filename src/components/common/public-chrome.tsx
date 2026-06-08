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
import { ScrollToTop } from "@/components/common/scroll-to-top";

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

export function PublicChrome({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Suspense fallback={null}>
        <FloatingNav navItems={navItems} />
      </Suspense>
      <main className="flex-1">
        <Suspense fallback={null}>
          <RouteMotion>{children}</RouteMotion>
        </Suspense>
      </main>
      {footer}
    </div>
  );
}
