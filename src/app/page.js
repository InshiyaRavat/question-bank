"use client";
import { useUser } from "@clerk/nextjs";
import Subscription from "@/components/Subscription/Subscription";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    const isAdmin = async () => {
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        console.log(user.username);
        if (user.username === "admin") {
          router.push("/admin/dashboard");
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
            router.push("/question-topic");
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

  return <Subscription />;
}
