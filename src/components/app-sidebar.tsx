"use client";

import * as React from "react";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  PieChart,
  Settings2,
  ShieldAlert,
  Power,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Relay Controls",
      url: "/relay-controls",
      icon: Power,
    },
    {
      title: "Logs",
      url: "/logs",
      icon: FileText,
    },
    {
      title: "Charts",
      url: "/charts",
      icon: PieChart,
    },
    {
      title: "Pinouts/Diagrams/Docs",
      url: "/docs",
      icon: BookOpen,
    },
    {
      title: "Fault/Err History",
      url: "/fault-history",
      icon: ShieldAlert,
    },
  ],
  projects: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <a href="/settings">
                <Settings2 />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
