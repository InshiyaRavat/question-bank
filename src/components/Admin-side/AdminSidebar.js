"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
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
  Megaphone,
  Activity,
  Trash2,
  Flag,
  Image,
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
import { useTheme } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
    title: "User Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
    description: "Individual user performance",
  },
  {
    title: "User Reports",
    url: "/admin/user-reports",
    icon: Users,
    description: "Comprehensive user reports and analytics",
  },
  {
    title: "Retake Limits",
    url: "/admin/retake-limits",
    icon: Settings,
    description: "Manage user retake limits",
  },
  {
    title: "Question Analytics",
    url: "/admin/question-analytics",
    icon: BarChart3,
    description: "Question performance and difficulty analysis",
  },
  {
    title: "Comments & Replies",
    url: "/admin/comments",
    icon: MessageSquare,
    description: "Moderate discussions",
  },
  {
    title: "Feedback",
    url: "/admin/feedback",
    icon: MessageSquare,
    description: "Report questions and feedback",
  },
  {
    title: "Flagged Questions",
    url: "/admin/flagged-questions",
    icon: Flag,
    description: "Review reported questions",
  },
  {
    title: "Announcements",
    url: "/admin/announcements",
    icon: Megaphone,
    description: "Manage announcements",
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: CreditCard,
    description: "Manage user plans",
  },
  {
    title: "Activity Logs",
    url: "/admin/activity-logs",
    icon: Activity,
    description: "Admin activity tracking",
  },
  {
    title: "Trash Bin",
    url: "/admin/trash",
    icon: Trash2,
    description: "Recover deleted items",
  },
];

const settingsItems = [
  {
    title: "Logo Management",
    url: "/admin/logo",
    icon: Image,
    description: "Upload and manage site logo",
  },
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
  const { colors } = useTheme();
  const { user, isLoaded, isSignedIn } = useUser();
  const [username, setUsername] = useState("");
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setUsername(user.username || "");
    }
  }, [isLoaded, user, isSignedIn]);

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold" style={{ color: colors.neutral900 }}>
              {username}
            </span>
            <span className="truncate text-xs" style={{ color: colors.textSecondary }}>
              Admin • Question Bank
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel style={{ color: colors.textSecondary }}>Main Navigation</SidebarGroupLabel>
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
                      className={`hover:bg-blue-200 hover:text-sidebar-accent-foreground ${isActive ? "text-blue-700" : ""
                        }`}
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
          <SidebarGroupLabel style={{ color: colors.textSecondary }}>System</SidebarGroupLabel>
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
        <div
          className="flex items-center justify-between gap-2 rounded-lg p-2"
          style={{ backgroundColor: colors.neutral50 }}
        >
          <div className="grid flex-1 text-left text-xs leading-tight">
            <span style={{ color: colors.textSecondary }}>Admin Dashboard v1.0</span>
            <span style={{ color: colors.textMuted }}>Question Bank System</span>
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminSidebarProvider({ children }) {
  const { colors } = useTheme();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1" style={{ backgroundColor: colors.background }}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
