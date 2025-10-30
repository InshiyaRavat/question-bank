import { auth } from "@clerk/nextjs/server";
import { redirect, RedirectType } from "next/navigation";
import Subscription from "@/components/Subscription/Subscription";
import { getActiveSubscriptionByUser } from "@/lib/billing";

export default async function PayPage() {
  const { userId, sessionClaims } = await auth();

  // Redirect unauthenticated users to sign in
  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user is admin and redirect to admin panel
  if (sessionClaims?.metadata?.role === "admin") {
    redirect("/admin/users");
  }

  return <Subscription />;
}
