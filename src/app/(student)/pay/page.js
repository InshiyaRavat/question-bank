import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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

  // Check subscription status
  try {
    const subscription = await getActiveSubscriptionByUser(userId);

    if (subscription && subscription.status === "active") {
      redirect("/dashboard");
    }
  } catch (error) {
    console.log("Error occurred while fetching subscription status:", error);
  }

  return <Subscription />;
}
