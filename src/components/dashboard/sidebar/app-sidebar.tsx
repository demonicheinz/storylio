"use client";

import {
  ArticleIcon,
  ChartLineIcon,
  ChatCircleTextIcon,
  CouchIcon,
  FolderOpenIcon,
  GearIcon,
  HouseIcon,
  ImageIcon,
  ImagesIcon,
  // SparkleIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";
import { NavMain } from "@/components/dashboard/sidebar/nav-main";
import { NavUser } from "@/components/dashboard/sidebar/nav-user";
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

const navItems = [
  { title: "Overview", url: "/dashboard", icon: HouseIcon },
  { title: "Home", url: "/dashboard/home", icon: CouchIcon },
  { title: "Posts", url: "/dashboard/posts", icon: ArticleIcon },
  { title: "Projects", url: "/dashboard/projects", icon: FolderOpenIcon },
  {
    title: "Testimonials",
    url: "/dashboard/testimonials",
    icon: ChatCircleTextIcon,
  },
  { title: "Media", url: "/dashboard/media", icon: ImageIcon },
  { title: "Gallery", url: "/dashboard/gallery", icon: ImagesIcon },
  { title: "Analytics", url: "/dashboard/analytics", icon: ChartLineIcon },
  { title: "Settings", url: "/dashboard/settings", icon: GearIcon },
];

const owner = {
  name: "Heinz",
  email: "Owner",
  avatar: "",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Storylio">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl">
                  {/* <SparkleIcon /> */}
                  <Image
                    src="/images/logo.png"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="size-6 object-contain"
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-heading font-semibold">
                    Storylio
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Dashboard
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <NavUser user={owner} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
