"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { THEME } from "@/theme";

const Subscription = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Client-side redirection logic extracted from pay/page.js
  useEffect(() => {
    if (!isLoaded) return; // wait for Clerk

    // Unauthenticated → sign-in
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Admin → admin panel
    const role = user?.publicMetadata?.role || user?.unsafeMetadata?.role;
    if (role === "admin") {
      router.push("/admin/users");
      return;
    }

    // Check active subscription and redirect
    (async () => {
      try {
        const res = await fetch(`/api/subscription?userid=${user.id}`);
        const data = await res.json();
        if (data?.success && data?.subscription) {
          const status = data.subscription.status;
          const isActive = data.subscription.isActive === true;
          if (isActive || status === "active") {
            router.push("/question-topic");
          }
        }
      } catch (_e) {
        // ignore network/API errors for redirect path
      }
    })();
  }, [isLoaded, user, router]);

  const handlePlanSelection = async (arg) => {
    const duration = typeof arg === 'number' ? arg : arg?.duration;
    const planId = typeof arg === 'object' ? arg?.planId : undefined;
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
          ...(planId ? { planId } : { duration }),
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/plans');
        const data = await res.json();
        if (mounted && data.success) setPlans(data.plans || []);
      } catch (_) {
        // ignore
      } finally {
        if (mounted) setPlansLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);
  return (
    <div className="min-h-screen bg-white text-black p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">{error}</div>
      )}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
        {plansLoading ? (
          <div className="text-center text-sm" style={{ color: THEME.neutral700 }}>Loading plans...</div>
        ) : plans.length ? (
          plans.map((p) => (
            <div key={p.id} className="text-black rounded-2xl shadow-lg p-8 w-full max-w-md transform transition duration-300" style={{ background: THEME.surface }}>
              <div className="text-center">
                <span className="text-4xl font-bold" style={{ color: THEME.primary }}>
                  {p.currency} {Number(p.price).toFixed(2)}
                </span>
                <p className="text-2xl mt-2 font-semibold " style={{ color: THEME.textSecondary }}>
                  {p.name} ({p.durationMonths} months)
                </p>
                <p className="text-sm mt-4 " style={{ color: THEME.neutral700 }}>
                  {p.description || "Full access to study materials, tests, performance tracking, and more."}
                </p>
              </div>
              {p.features?.length ? (
                <ul className="mt-6 text-sm space-y-2 list-disc list-inside" style={{ color: THEME.neutral900 }}>
                  {p.features.map((f, i) => (<li key={i}>{f}</li>))}
                </ul>
              ) : null}
              <div className="text-center mt-6">
                <button
                  onClick={() => handlePlanSelection({ planId: p.id, duration: p.durationMonths })}
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
          ))
        ) : (
          <div className="text-center text-sm" style={{ color: THEME.neutral700 }}>No plans available. Please check back later.</div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
