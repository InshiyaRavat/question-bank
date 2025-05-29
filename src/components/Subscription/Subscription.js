"use client";
import React, { useContext, useEffect } from "react";
import "../../Style/subscription.css";
import { useRouter } from "next/navigation";
import { PlanContext } from "@/context/PlanContext";

const Subscription = () => {
  const { plan, setPlan } = useContext(PlanContext);
  const router = useRouter();

  const handleClick = (e) => {
    const selectedPlan = e.target.dataset.value;
    console.log("selectedplan: ", selectedPlan);
    setPlan(selectedPlan);
  };

  useEffect(() => {
    if (plan !== null) {
      console.log("plan set to: ", plan);
      router.push("/PaymentForm");
    }
  }, [plan]);
  return (
    <div className="min-h-screen bg-[#001219] text-white p-8">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
        {/* 6-month plan */}
        <div className="bg-[#005F73] rounded-2xl shadow-lg p-8 w-full max-w-md transform hover:scale-105 transition duration-300">
          <div className="text-center">
            <span className="text-4xl font-bold text-[#E9D8A6]">
              £10{" "}
              <small className="text-sm font-medium text-white">/ month</small>
            </span>
            <p className="text-2xl mt-2 font-semibold text-[#94D2BD]">
              6 Months
            </p>
            <p className="text-sm mt-4 text-white">
              Subscribe to unlock full access to{" "}
              <strong className="text-[#EE9B00]">
                study materials, tests, performance tracking, and peer
                discussions
              </strong>
              —everything you need to excel in your learning journey!
            </p>
          </div>
          <ul className="mt-6 text-sm text-white space-y-2 list-disc list-inside">
            <li>Test mode</li>
            <li>Practice mode</li>
            <li>Performance tracking</li>
            <li>Custom study plans</li>
            <li>Exclusive updates</li>
          </ul>
          <div className="text-center mt-6">
            <button
              className="bg-[#EE9B00] hover:bg-[#CA6702] text-white font-bold py-2 px-6 rounded-full shadow-lg transition"
              onClick={() =>
                handleClick({ target: { dataset: { value: 10 } } })
              }
            >
              Buy Plan
            </button>
          </div>
        </div>

        {/* 12-month plan */}
        <div className="bg-[#0A9396] rounded-2xl shadow-lg p-8 w-full max-w-md transform hover:scale-105 transition duration-300">
          <div className="text-center">
            <span className="text-4xl font-bold text-[#E9D8A6]">
              £20{" "}
              <small className="text-sm font-medium text-white">/ month</small>
            </span>
            <p className="text-2xl mt-2 font-semibold text-[#94D2BD]">
              12 Months
            </p>
            <p className="text-sm mt-4 text-white">
              Subscribe to unlock full access to{" "}
              <strong className="text-[#EE9B00]">
                study materials, tests, performance tracking, and peer
                discussions
              </strong>
              —everything you need to excel in your learning journey!
            </p>
          </div>
          <ul className="mt-6 text-sm text-white space-y-2 list-disc list-inside">
            <li>Test mode</li>
            <li>Practice mode</li>
            <li>Performance tracking</li>
            <li>Custom study plans</li>
            <li>Exclusive updates</li>
          </ul>
          <div className="text-center mt-6">
            <button
              className="bg-[#EE9B00] hover:bg-[#CA6702] text-white font-bold py-2 px-6 rounded-full shadow-lg transition"
              onClick={() =>
                handleClick({ target: { dataset: { value: 20 } } })
              }
            >
              Buy Plan
            </button>
          </div>
        </div>
      </div>

      <h3 className="mt-10 text-center text-sm text-[#94D2BD]">
        <strong>Note:</strong> Features are identical across plans—only the
        duration (6 or 12 months) differs.
      </h3>
    </div>
  );
};

export default Subscription;
