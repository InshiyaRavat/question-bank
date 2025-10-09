"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { THEME } from "@/theme";

const Subscription = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePlanSelection = async (duration) => {
    if (!isLoaded || !user) {
      setError("Please sign in to continue");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create checkout session
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration: duration,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.success && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-white text-black p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">{error}</div>
      )}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
        {/* 6-month plan */}
        <div
          className="text-black rounded-2xl shadow-lg p-8 w-full max-w-md transform transition duration-300"
          style={{ background: THEME.surface }}
        >
          <div className="text-center">
            <span className="text-4xl font-bold" style={{ color: THEME.primary }}>
              £10 <small className="text-sm font-medium">/ month</small>
            </span>
            <p className="text-2xl mt-2 font-semibold " style={{ color: THEME.textSecondary }}>
              6 Months
            </p>
            <p className="text-sm mt-4 " style={{ color: THEME.neutral700 }}>
              Subscribe to unlock full access to{" "}
              <strong className="">study materials, tests, performance tracking, and peer discussions</strong>
              —everything you need to excel in your learning journey!
            </p>
          </div>
          <ul className="mt-6 text-sm space-y-2 list-disc list-inside" style={{ color: THEME.neutral900 }}>
            <li>Test mode</li>
            <li>Practice mode</li>
            <li>Performance tracking</li>
            <li>Custom study plans</li>
            <li>Exclusive updates</li>
          </ul>
          <div className="text-center mt-6">
            <button
              onClick={() => handlePlanSelection(6)}
              disabled={loading}
              className={`font-bold py-2 px-6 rounded-full shadow-lg transition ${
                loading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "text-blue-900 hover:bg-blue-700 hover:text-white"
              }`}
            >
              {loading ? "Processing..." : "Buy Plan"}
            </button>
          </div>
        </div>

        {/* 12-month plan */}
        <div
          className="text-black rounded-2xl shadow-lg p-8 w-full max-w-md transform transition duration-300"
          style={{ background: THEME.surface }}
        >
          <div className="text-center">
            <span className="text-4xl font-bold" style={{ color: THEME.primary }}>
              £20 <small className="text-sm font-medium ">/ month</small>
            </span>
            <p className="text-2xl mt-2 font-semibold " style={{ color: THEME.textSecondary }}>
              12 Months
            </p>
            <p className="text-sm mt-4" style={{ color: THEME.neutral700 }}>
              Subscribe to unlock full access to{" "}
              <strong className="">study materials, tests, performance tracking, and peer discussions</strong>
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
              onClick={() => handlePlanSelection(12)}
              disabled={loading}
              className={`font-bold py-2 px-6 rounded-full shadow-lg transition ${
                loading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "text-blue-900 hover:bg-blue-700 hover:text-white"
              }`}
            >
              {loading ? "Processing..." : "Buy Plan"}
            </button>
          </div>
        </div>
      </div>

      <h3 className="mt-10 text-center text-sm">
        <strong>Note:</strong> Features are identical across plans—only the duration (6 or 12 months) differs.
      </h3>
    </div>
  );
};

export default Subscription;
