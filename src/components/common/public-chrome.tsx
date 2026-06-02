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
  Footer,
  ScrollToTop,
} from "@/components/common";

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
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Suspense fallback={null}>
        <FloatingNav navItems={navItems} />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
