"use client";
import { PlanContext } from "@/context/PlanContext";
import { useRouter } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { useEffect, useContext } from "react";
import { THEME } from "@/theme";

export default function Page() {
  const { isSubscribed } = useContext(PlanContext);
  const router = useRouter();

  useEffect(() => {
    if (isSubscribed) {
      router.push("/question");
    }
  }, [isSubscribed, router]);

  return (
    <div className={`flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[${THEME.primary_4}] via-[${THEME.primary_3}] to-[${THEME.primary_2}] p-6`}>
      <h2 className={`text-3xl font-extrabold text-center text-[${THEME.secondary_2}] mb-6`}>
        Welcome 👋
      </h2>
      <div className="w-full flex justify-center">
        <SignIn />
      </div>
    </div>
  );
}
