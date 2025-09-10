"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, CreditCard, History, BarChart3, Target } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarHeader,
} from "@/components/ui/sidebar";
import DynamicLogo from "@/components/common/DynamicLogo";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Study Plan", url: "/study-plan", icon: Target },
  { title: "Question Topics", url: "/question-topic", icon: BookOpen },
  { title: "Personalized Report", url: "/personalized-report", icon: BarChart3 },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Subscription", url: "/subscription", icon: CreditCard },
  { title: "Billing History", url: "/billing-history", icon: History },
];

export default function UserSidebar() {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar className="bg-white border-r border-border min-h-screen w-64 flex flex-col shadow-lg lg:shadow-none">
        <SidebarHeader className="flex flex-col items-center py-4 lg:py-6 px-4">
          <div className="mb-2">
            <DynamicLogo fallbackText="Question Bank" size="lg" showText={true} className="text-primary" />
          </div>
          <UserButton />
        </SidebarHeader>
        <SidebarContent className="px-2 lg:px-0">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 lg:px-0">Main Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.url)}
                      className="rounded-lg mx-2 lg:mx-0"
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate text-sm lg:text-base">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
