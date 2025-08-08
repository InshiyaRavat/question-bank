"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  BookOpen,
  Settings,
  BarChart3,
  MessageSquare,
  CreditCard,
  Shield,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { THEME } from "@/theme";

const adminNavItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
    description: "Overview and analytics",
  },
  {
    title: "Users Management",
    url: "/admin/users",
    icon: Users,
    description: "Manage user accounts",
  },
  {
    title: "Questions",
    url: "/admin/questions",
    icon: FileQuestion,
    description: "Manage question bank",
  },
  {
    title: "Subjects & Topics",
    url: "/admin/subjects",
    icon: BookOpen,
    description: "Organize content structure",
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
    description: "Usage statistics",
  },
  {
    title: "Comments & Replies",
    url: "/admin/comments",
    icon: MessageSquare,
    description: "Moderate discussions",
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: CreditCard,
    description: "Manage user plans",
  },
];

const settingsItems = [
  {
    title: "System Settings",
    url: "/admin/settings",
    icon: Settings,
    description: "Configure application",
  },
  {
    title: "Security",
    url: "/admin/security",
    icon: Shield,
    description: "Security configurations",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: THEME.primary }}
          >
            <Shield className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold" style={{ color: THEME.neutral900 }}>
              Admin Panel
            </span>
            <span className="truncate text-xs" style={{ color: THEME.textSecondary }}>
              Question Bank Management
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel style={{ color: THEME.textSecondary }}>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.description}
                      className={`hover:bg-blue-200 hover:text-sidebar-accent-foreground ${isActive ? 'text-blue-700' : ''}`}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel style={{ color: THEME.textSecondary }}>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.description}
                      className="hover:bg-blue-200 hover:text-sidebar-accent-foreground"
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: THEME.neutral50 }}>
          <div className="grid flex-1 text-left text-xs leading-tight">
            <span style={{ color: THEME.textSecondary }}>Admin Dashboard v1.0</span>
            <span style={{ color: THEME.textMuted }}>Question Bank System</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminSidebarProvider({ children }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
