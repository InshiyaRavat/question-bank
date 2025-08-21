import { AdminSidebarProvider } from "@/components/Admin-side/AdminSidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }) {
  const { sessionClaims } = await auth();
  if (sessionClaims.metadata.role !== "admin") {
    return redirect("/dashboard");
  }

  return <AdminSidebarProvider>{children}</AdminSidebarProvider>;
}
