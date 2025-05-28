'use client'
import { UserButton, useUser } from "@clerk/nextjs"
import Subscription from "@/components/Subscription/Subscription"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    const isAdmin = async () => {
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        console.log(user.username);
        if (user.username === "admin") {
          router.push("/adminDashboard");
        }
      } catch (e) {
        console.log(e);
      }
    };

    isAdmin();
  }, [isLoaded, isSignedIn, router, user]);


  useEffect(() => {
    const getSubscriptionStatus = async () => {
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        console.log(user.id);
        const response = await fetch(`/api/subscription?userid=${user.id}`);
        const data = await response.json();
        console.log("subscription data: ", data.subscription);
        if (data.subscription) {
          if (data.subscription.status == "active") {
            router.push("/QuestionTopic");
          }
        } else {
          console.log("user has not subscribed");
        }

        console.log("status: ", data.subscription.status);
      } catch (error) {
        console.log("error occured while fetching subscription status: ", error);
      }
    };            

    getSubscriptionStatus();
  }, [isLoaded, isSignedIn, router, user]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <UserButton />
      <Subscription />
    </div>
  );
}
