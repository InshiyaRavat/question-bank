"use client";
import { AdminSidebarProvider } from "@/components/Admin-side/AdminSidebar";

export default function AdminLayout({ children }) {
  return <AdminSidebarProvider>{children}</AdminSidebarProvider>;
}
