"use client";
import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlanContext } from "@/context/PlanContext";

const plans = [
  {
    duration: "6 Months",
    price: "£10",
    value: 10,
  },
  {
    duration: "12 Months",
    price: "£20",
    value: 20,
  },
];

export default function Subscription() {
  const { plan, setPlan } = useContext(PlanContext);
  const router = useRouter();

  const handleClick = (value) => {
    setPlan(value);
  };

  useEffect(() => {
    if (plan !== null) {
      router.push("/payment-form");
    }
  }, [plan]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 px-6 py-12">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-semibold">Choose Your Plan</h1>
        <p className="text-gray-500 mt-2">
          Unlock access to tests, materials, and performance tracking.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row justify-center items-stretch gap-8">
        {plans.map((planOption) => (
          <div
            key={planOption.value}
            className="flex flex-col justify-between border border-gray-200 rounded-xl shadow-sm bg-white w-full max-w-md p-8 transition hover:shadow-md"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2">{planOption.price} <span className="text-sm text-gray-500">/ month</span></h2>
              <p className="text-lg font-medium text-gray-700 mb-4">{planOption.duration}</p>
              <p className="text-sm text-gray-500 mb-6">
                Full access to all features including:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                <li>Test mode & practice mode</li>
                <li>Performance tracking</li>
                <li>Custom study plans</li>
                <li>Exclusive updates</li>
              </ul>
            </div>
            <button
              onClick={() => handleClick(planOption.value)}
              className="mt-8 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              Choose Plan
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500 mt-10">
        <strong>Note:</strong> All features are included in both plans — only the duration differs.
      </p>
    </div>
  );
}
