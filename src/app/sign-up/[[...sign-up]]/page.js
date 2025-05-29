"use client";
import { PlanContext } from "@/context/PlanContext";
import { useRouter } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { useEffect, useContext } from "react";

export default function Page() {
  const { isSubscribed } = useContext(PlanContext);
  const router = useRouter();

  useEffect(() => {
    if (isSubscribed) {
      router.push("/question");
    }
  }, [isSubscribed, router]);

  return (
    <div className="flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#001219] via-[#005F73] to-[#0A9396] p-6">
      <h2 className="text-3xl font-extrabold text-center text-[#EE9B00] mb-6">
        Create Your Account ✨
      </h2>
      <div className="w-full flex justify-center">
        <SignUp />
      </div>
    </div>
  );
}
