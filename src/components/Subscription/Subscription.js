"use client";
import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlanContext } from "@/context/PlanContext";
import { THEME } from '@/theme'

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
      router.push("/payment-form");
    }
  }, [plan]);
  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
        {/* 6-month plan */}
        <div className="text-black rounded-2xl shadow-lg p-8 w-full max-w-md transform transition duration-300"
          style={{ background: THEME.surface }}>
          <div className="text-center">
            <span className="text-4xl font-bold"
              style={{ color: THEME.primary }}>
              £10{" "}
              <small className="text-sm font-medium">/ month</small>
            </span>
            <p className="text-2xl mt-2 font-semibold "
              style={{ color: THEME.textSecondary }}>
              6 Months
            </p>
            <p className="text-sm mt-4 "
              style={{ color: THEME.neutral700 }}>
              Subscribe to unlock full access to{" "}
              <strong className="">
                study materials, tests, performance tracking, and peer
                discussions
              </strong>
              —everything you need to excel in your learning journey!
            </p>
          </div>
          <ul className="mt-6 text-sm space-y-2 list-disc list-inside"
            style={{ color: THEME.neutral900 }}>
            <li>Test mode</li>
            <li>Practice mode</li>
            <li>Performance tracking</li>
            <li>Custom study plans</li>
            <li>Exclusive updates</li>
          </ul>
          <div className="text-center mt-6">
            <button
              className="text-blue-900 font-bold py-2 px-6 rounded-full shadow-lg transition hover:bg-blue-700 hover:text-white"
              onClick={() =>
                handleClick({ target: { dataset: { value: 10 } } })
              }
            >
              Buy Plan
            </button>
          </div>
        </div>

        {/* 12-month plan */}
        <div className="text-black rounded-2xl shadow-lg p-8 w-full max-w-md transform transition duration-300"
          style={{ background: THEME.surface }}>
          <div className="text-center">
            <span className="text-4xl font-bold"
              style={{ color: THEME.primary }}>
              £20{" "}
              <small className="text-sm font-medium ">/ month</small>
            </span>
            <p className="text-2xl mt-2 font-semibold "
              style={{ color: THEME.textSecondary }}>
              12 Months
            </p>
            <p className="text-sm mt-4"
              style={{ color: THEME.neutral700 }}>
              Subscribe to unlock full access to{" "}
              <strong className="">
                study materials, tests, performance tracking, and peer
                discussions
              </strong>
              —everything you need to excel in your learning journey!
            </p>
          </div>
          <ul className="mt-6 text-sm space-y-2 list-disc list-inside">
            <li>Test mode</li>
            <li>Practice mode</li>
            <li>Performance tracking</li>
            <li>Custom study plans</li>
            <li>Exclusive updates</li>
          </ul>
          <div className="text-center mt-6">
            <button
              className="text-blue-900 font-bold py-2 px-6 rounded-full shadow-lg transition hover:bg-blue-700 hover:text-white"
              onClick={() =>
                handleClick({ target: { dataset: { value: 20 } } })
              }
            >
              Buy Plan
            </button>
          </div>
        </div>
      </div>

      <h3 className="mt-10 text-center text-sm">
        <strong>Note:</strong> Features are identical across plans—only the
        duration (6 or 12 months) differs.
      </h3>
    </div>
  );
};

export default Subscription;