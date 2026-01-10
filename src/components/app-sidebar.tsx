"use client"

import * as React from "react"
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  PieChart,
  Power,
  Settings2,
  ShieldAlert,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

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
      title: "Charts",
      url: "/charts",
      icon: PieChart,
    },
    {
      title: "Logs",
      url: "/logs",
      icon: FileText,
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
    {
      title: "Relay Controls",
      url: "/relay-controls",
      icon: Power,
    },
  ],
  projects: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavMain
          items={[
            {
              title: "Settings",
              url: "/settings",
              icon: Settings2,
            },
          ]}
        />
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
