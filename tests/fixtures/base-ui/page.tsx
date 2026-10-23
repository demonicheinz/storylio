"use client";

import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MigrationCheck() {
  const [open, setOpen] = useState(false),
    [alert, setAlert] = useState(false),
    [extras, setExtras] = useState(false),
    [count, setCount] = useState(0),
    [action, setAction] = useState("");
  const input = useRef<HTMLInputElement>(null);
  return (
    <Toaster>
      <TooltipProvider>
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<a href="#controls" />}
                    tooltip="Fixture home"
                  >
                    Fixture home
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <div id="controls" className="flex flex-col gap-6 p-6 min-w-0">
              <SidebarTrigger />
              <h1>Base UI migration check</h1>
              <Button
                onClick={() =>
                  toast.add({
                    title: "Fixture saved",
                    description: "Native Base toast",
                    type: "success",
                    timeout: 0,
                  })
                }
              >
                Show toast
              </Button>
              <Drawer showSwipeHandle>
                <DrawerTrigger render={<Button />}>Open drawer</DrawerTrigger>
                <DrawerContent>
                  <DrawerTitle>Drawer check</DrawerTitle>
                  <DrawerDescription>Native Base drawer</DrawerDescription>
                  <DrawerClose render={<Button />}>Close drawer</DrawerClose>
                  <Dialog>
                    <DialogTrigger render={<Button />}>
                      Open nested dialog
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>Nested check</DialogTitle>
                      <DialogDescription>
                        Dialog inside drawer
                      </DialogDescription>
                      <DialogClose render={<Button />}>
                        Close nested dialog
                      </DialogClose>
                    </DialogContent>
                  </Dialog>
                </DrawerContent>
              </Drawer>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<a href="#controls" />}>
                      Breadcrumb home
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Badge render={<a href="#controls" />}>Badge link</Badge>
              <Button
                nativeButton={false}
                role="link"
                render={<a href="#controls" />}
              >
                Native link
              </Button>
              <Button disabled>Disabled action</Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button />}>
                    Open menu
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <Dialog>
                        <DialogTrigger
                          nativeButton={false}
                          render={<DropdownMenuItem closeOnClick={false} />}
                        >
                          Open menu form
                        </DialogTrigger>
                        <DialogContent>
                          <DialogTitle>Menu form</DialogTitle>
                          <DialogDescription>
                            Dialog root inside the menu group
                          </DialogDescription>
                          <Input aria-label="Menu form input" />
                          <textarea aria-label="Menu form textarea" />
                          <DialogClose render={<Button />}>
                            Close menu form
                          </DialogClose>
                        </DialogContent>
                      </Dialog>
                      <DropdownMenuItem
                        onClick={() => setAction("Action performed")}
                      >
                        Perform action
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        nativeButton
                        closeOnClick={false}
                        render={<DialogTrigger />}
                      >
                        Open dialog from menu
                      </DropdownMenuItem>
                      <DropdownMenuCheckboxItem
                        checked={extras}
                        onCheckedChange={setExtras}
                      >
                        Show extras
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <p>{action}</p>
                <DialogContent initialFocus={input}>
                  <DialogTitle>Dialog check</DialogTitle>
                  <DialogDescription>Fixture dialog content</DialogDescription>
                  <Input ref={input} aria-label="Dialog name" />
                  <DialogClose render={<Button />}>Close dialog</DialogClose>
                </DialogContent>
              </Dialog>
              <AlertDialog open={alert} onOpenChange={setAlert}>
                <AlertDialogTrigger render={<Button />}>
                  Open alert
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Delete fixture?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Local test only
                  </AlertDialogDescription>
                  <AlertDialogCancel>Cancel alert</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setAlert(false)}>
                    Confirm alert
                  </AlertDialogAction>
                </AlertDialogContent>
              </AlertDialog>
              <Checkbox aria-label="Example checkbox" />
              <Checkbox aria-label="Mixed checkbox" indeterminate />
              <Switch aria-label="Enable feature" />
              <Tabs defaultValue="first">
                <TabsList>
                  <TabsTrigger value="first">First tab</TabsTrigger>
                  <TabsTrigger value="second">Second tab</TabsTrigger>
                </TabsList>
                <TabsContent value="first">First panel</TabsContent>
                <TabsContent value="second">Second panel</TabsContent>
              </Tabs>
              <Collapsible>
                <CollapsibleTrigger render={<Button />}>
                  Toggle details
                </CollapsibleTrigger>
                <CollapsibleContent>Collapsible details</CollapsibleContent>
              </Collapsible>
              <Tooltip>
                <TooltipTrigger render={<Button />}>Hint</TooltipTrigger>
                <TooltipContent>Hint text</TooltipContent>
              </Tooltip>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setCount(count + 1);
                }}
              >
                <Button type="submit">Submit fixture</Button>
                <p>Submitted {count}</p>
              </form>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </Toaster>
  );
}
