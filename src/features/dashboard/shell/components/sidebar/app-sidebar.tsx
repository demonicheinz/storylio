"use client";

import {
  ArticleIcon,
  ChartLineIcon,
  CouchIcon,
  FolderOpenIcon,
  GearIcon,
  HouseIcon,
  IdentificationCardIcon,
  ImageIcon,
  ImagesIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { NavMain } from "@/features/dashboard/shell/components/sidebar/nav-main";
import { NavUser } from "@/features/dashboard/shell/components/sidebar/nav-user";
import { authClient } from "@/lib/auth-client";

const navGroups = [
  {
    label: "Content",
    items: [
      { title: "Overview", url: "/dashboard", icon: HouseIcon },
      { title: "Home", url: "/dashboard/home", icon: CouchIcon },
      { title: "About", url: "/dashboard/about", icon: IdentificationCardIcon },
      { title: "Projects", url: "/dashboard/projects", icon: FolderOpenIcon },
      { title: "Posts", url: "/dashboard/posts", icon: ArticleIcon },
      { title: "Gallery", url: "/dashboard/gallery", icon: ImagesIcon },
    ],
  },
  {
    label: "Library",
    items: [{ title: "Media", url: "/dashboard/media", icon: ImageIcon }],
  },
  {
    label: "System",
    items: [
      { title: "Analytics", url: "/dashboard/analytics", icon: ChartLineIcon },
      { title: "Settings", url: "/dashboard/settings", icon: GearIcon },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <AppSidebarContent {...props} />;
}

function AppSidebarContent({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const owner = {
    name: user?.name || "User",
    email: user?.email || "",
    avatar: user?.image || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Storylio">
              <Link href="/dashboard">
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl">
                  <Image
                    src="/images/logo.png"
                    alt="Logo"
                    width={28}
                    height={28}
                    className="size-7 object-contain"
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-heading text-[15px] font-semibold">
                    Storylio
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarSeparator className="mx-0 w-full" />
      <SidebarFooter>
        <NavUser user={owner} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
