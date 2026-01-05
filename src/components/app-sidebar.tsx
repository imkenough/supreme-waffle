"use client"

import * as React from "react"
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  PieChart,
  Settings2,
  ShieldAlert,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
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
      url: "#",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Charts",
      url: "#",
      icon: PieChart,
    },
    {
      title: "Logs",
      url: "#",
      icon: FileText,
    },
    {
      title: "Pinouts/Diagrams/Docs",
      url: "#",
      icon: BookOpen,
    },
    {
      title: "Fault/Err History",
      url: "#",
      icon: ShieldAlert,
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
              url: "#",
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
