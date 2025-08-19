import { AdminSidebarProvider } from "@/components/Admin-side/AdminSidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }) {
  const { sessionClaims } = await auth();
  console.log(sessionClaims);
  // if (sessionClaims.role !== "admin") {
  //   return redirect("/");
  // }

  return <AdminSidebarProvider>{children}</AdminSidebarProvider>;
}
