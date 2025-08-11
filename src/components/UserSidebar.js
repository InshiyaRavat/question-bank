"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, CreditCard } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarHeader } from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Question Topics", url: "/question-topic", icon: BookOpen },
  { title: "Subscription", url: "/subscription", icon: CreditCard },
];

export default function UserSidebar() {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar className="bg-white border-r border-border min-h-screen w-64 flex flex-col">
        <SidebarHeader className="flex flex-col items-center py-6">
          <div className="text-2xl font-bold mb-2 text-primary">📚 Question Bank</div>
          <UserButton />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.url)}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="truncate">{item.title}</span>
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
