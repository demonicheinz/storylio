"use client";

import {
  ArrowSquareOutIcon,
  CaretUpDownIcon,
  GearIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

type User = {
  name: string;
  email: string;
  avatar: string;
};

export function NavUser({ user }: { user: User }) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [currentUser, setCurrentUser] = useState(user);
  const optimisticUserRef = useRef<Partial<User> | null>(null);

  useEffect(() => {
    const optimisticUser = optimisticUserRef.current;

    if (optimisticUser) {
      const hasSynced =
        (!optimisticUser.name || optimisticUser.name === user.name) &&
        (!optimisticUser.email || optimisticUser.email === user.email) &&
        (!optimisticUser.avatar || optimisticUser.avatar === user.avatar);

      if (!hasSynced) {
        return;
      }

      optimisticUserRef.current = null;
    }

    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = (event: Event) => {
      const detail = (event as CustomEvent<Partial<User>>).detail;
      optimisticUserRef.current = detail;

      setCurrentUser((current) => ({
        name: detail.name ?? current.name,
        email: detail.email ?? current.email,
        avatar: detail.avatar ?? current.avatar,
      }));
    };

    window.addEventListener("dashboard-user-updated", handleUserUpdate);

    return () => {
      window.removeEventListener("dashboard-user-updated", handleUserUpdate);
    };
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="rounded-xl">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback className="rounded-xl">
                  {currentUser.name?.slice(0, 2).toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 grid text-sm text-left leading-tight">
                <span className="font-medium truncate">{currentUser.name}</span>
                <span className="text-sidebar-foreground/70 text-xs truncate">
                  {currentUser.email}
                </span>
              </div>
              <CaretUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="rounded-lg min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-sm text-left">
                <Avatar className="rounded-xl">
                  <AvatarImage
                    src={currentUser.avatar}
                    alt={currentUser.name}
                  />
                  <AvatarFallback className="rounded-xl">
                    {currentUser.name?.slice(0, 2).toUpperCase() || "US"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 grid text-sm text-left leading-tight">
                  <span className="font-medium truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-muted-foreground text-xs truncate">
                    {currentUser.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/" target="_blank">
                  <ArrowSquareOutIcon />
                  View Site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <GearIcon />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} variant="destructive">
              <SignOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
