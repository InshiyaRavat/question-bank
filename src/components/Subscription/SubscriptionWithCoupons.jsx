"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { THEME } from "@/theme";
import CouponInput from "@/components/Coupon/CouponInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SubscriptionWithCoupons = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handlePlanSelection = async (plan) => {
    if (!isLoaded || !user) {
      setError("Please sign in to continue");
      return;
    }

    setSelectedPlan(plan);
  };

  const handleCheckout = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prepare checkout data
      const checkoutData = {
        planId: selectedPlan.id,
        duration: selectedPlan.durationMonths,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription`,
      };

      // Add coupon/promotion code if applied
      if (appliedCoupon) {
        if (appliedCoupon.promotion_code) {
          checkoutData.promotionCode = appliedCoupon.promotion_code.code;
        } else if (appliedCoupon.coupon) {
          checkoutData.couponCode = appliedCoupon.coupon.id;
        }
      }

      // Use the enhanced checkout session API
      const response = await fetch("/api/stripe/create-checkout-session-with-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
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
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCouponApplied = (coupon) => {
    setAppliedCoupon(coupon);
    toast.success("Coupon applied successfully!");
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
    toast.info("Coupon removed");
  };

  const formatDiscount = (coupon) => {
    if (coupon.percent_off) {
      return `${coupon.percent_off}% off`;
    } else if (coupon.amount_off) {
      const amount = (coupon.amount_off / 100).toFixed(2);
      const currency = coupon.currency?.toUpperCase() || "GBP";
      return `${currency} ${amount} off`;
    }
    return "Discount applied";
  };

  const calculateDiscountedPrice = (plan, coupon) => {
    if (!coupon) return plan.price;

    const originalPrice = parseFloat(plan.price);
    let discount = 0;

    if (coupon.percent_off) {
      discount = (originalPrice * coupon.percent_off) / 100;
    } else if (coupon.amount_off) {
      discount = coupon.amount_off / 100; // Convert from pence to pounds
    }

    const discountedPrice = Math.max(0, originalPrice - discount);
    return discountedPrice.toFixed(2);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/plans");
        const data = await res.json();
        if (mounted && data.success) setPlans(data.plans || []);
      } catch (_) {
        // ignore
      } finally {
        if (mounted) setPlansLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-black p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">{error}</div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: THEME.primary }}>
            Choose Your Plan
          </h1>
          <p className="text-lg" style={{ color: THEME.textSecondary }}>
            Get full access to our question bank with premium features
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Plans */}
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
              {plansLoading ? (
                <div className="col-span-2 text-center text-sm" style={{ color: THEME.neutral700 }}>
                  Loading plans...
                </div>
              ) : plans.length ? (
                plans.map((p) => (
                  <Card
                    key={p.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedPlan?.id === p.id ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
                    }`}
                    onClick={() => handlePlanSelection(p)}
                  >
                    <CardHeader>
                      <CardTitle className="text-center">
                        <span className="text-3xl font-bold" style={{ color: THEME.primary }}>
                          {p.currency} {Number(p.price).toFixed(2)}
                        </span>
                        {appliedCoupon && (
                          <div className="mt-2">
                            <span className="text-2xl font-bold text-green-600">
                              {p.currency} {calculateDiscountedPrice(p, appliedCoupon.coupon)}
                            </span>
                            <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                              {formatDiscount(appliedCoupon.coupon)}
                            </Badge>
                          </div>
                        )}
                      </CardTitle>
                      <CardDescription className="text-center text-lg font-semibold">
                        {p.name} ({p.durationMonths} months)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4" style={{ color: THEME.neutral700 }}>
                        {p.description || "Full access to study materials, tests, performance tracking, and more."}
                      </p>
                      {p.features?.length ? (
                        <ul className="text-sm space-y-2 list-disc list-inside" style={{ color: THEME.neutral900 }}>
                          {p.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center text-sm" style={{ color: THEME.neutral700 }}>
                  No plans available. Please check back later.
                </div>
              )}
            </div>
          </div>

          {/* Coupon Input and Checkout */}
          <div className="space-y-6">
            <CouponInput
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              appliedCoupon={appliedCoupon}
            />

            {selectedPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>{selectedPlan.name}</span>
                    <span>
                      {selectedPlan.currency} {Number(selectedPlan.price).toFixed(2)}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({formatDiscount(appliedCoupon.coupon)})</span>
                      <span>
                        -{selectedPlan.currency}{" "}
                        {(
                          Number(selectedPlan.price) -
                          Number(calculateDiscountedPrice(selectedPlan, appliedCoupon.coupon))
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <hr />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>
                      {selectedPlan.currency} {calculateDiscountedPrice(selectedPlan, appliedCoupon?.coupon)}
                    </span>
                  </div>

                  <Button onClick={handleCheckout} disabled={loading} className="w-full" size="lg">
                    {loading ? "Processing..." : "Proceed to Checkout"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionWithCoupons;
