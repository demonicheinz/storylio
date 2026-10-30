"use client";

import {
  ArrowSquareOutIcon,
  CaretUpDownIcon,
  GearIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProfileAvatar } from "@/components/common/profile-avatar";
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
  const { isMobile } = useSidebar();
  const [currentUser, setCurrentUser] = useState(user);
  const optimisticUserRef = useRef<Partial<User> | null>(null);
  const logoutLock = useRef(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

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
    if (logoutLock.current) return;
    logoutLock.current = true;
    setLoggingOut(true);
    setLogoutError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      // Discard cached authenticated pages and read the cleared session cookie
      // in a fresh document, rather than racing SPA navigation and refresh.
      window.location.replace("/sign-in");
    } catch {
      logoutLock.current = false;
      setLoggingOut(false);
      setLogoutError("Unable to sign out. Please try again.");
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <ProfileAvatar
              src={currentUser.avatar}
              name={currentUser.name}
              className="rounded-xl"
            />
            <div className="flex-1 grid text-sm text-left leading-tight">
              <span className="font-medium truncate">{currentUser.name}</span>
              <span className="text-sidebar-foreground/70 text-xs truncate">
                {currentUser.email}
              </span>
            </div>
            <CaretUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="rounded-lg min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-sm text-left">
                  <ProfileAvatar
                    src={currentUser.avatar}
                    name={currentUser.name}
                    className="rounded-xl"
                  />
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
              <DropdownMenuItem render={<Link href="/" target="_blank" />}>
                <ArrowSquareOutIcon />
                View Site
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
                <GearIcon />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={loggingOut}
                variant="destructive"
              >
                <SignOutIcon />
                {loggingOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {logoutError && (
          <p role="alert" className="px-2 py-1 text-destructive text-xs">
            {logoutError}
          </p>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
