"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tag, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function CouponInput({ onCouponApplied, onCouponRemoved, appliedCoupon = null }) {
  const [couponCode, setCouponCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState(null);

  const validateCoupon = async (code) => {
    if (!code.trim()) return;

    setValidating(true);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), type: "promotion_code" }),
      });

      const data = await response.json();

      if (data.valid) {
        setValidatedCoupon(data);
        toast.success("Coupon code is valid!");
      } else {
        setValidatedCoupon(null);
        toast.error(data.error || "Invalid coupon code");
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      setValidatedCoupon(null);
      toast.error("Failed to validate coupon code");
    } finally {
      setValidating(false);
    }
  };

  const handleApplyCoupon = () => {
    if (validatedCoupon && onCouponApplied) {
      onCouponApplied(validatedCoupon);
      setCouponCode("");
      setValidatedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    if (onCouponRemoved) {
      onCouponRemoved();
    }
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

  const formatCurrency = (amount, currency = "gbp") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="space-y-4">
      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-green-800">
                      {appliedCoupon.promotion_code?.code || appliedCoupon.coupon?.id}
                    </span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {formatDiscount(appliedCoupon.coupon || appliedCoupon)}
                    </Badge>
                  </div>
                  <p className="text-sm text-green-600">{appliedCoupon.coupon?.name || "Discount applied"}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coupon Input */}
      {!appliedCoupon && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <span>Have a coupon code?</span>
            </CardTitle>
            <CardDescription>Enter your promotion code to get a discount on your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="coupon-code" className="sr-only">
                  Coupon Code
                </Label>
                <Input
                  id="coupon-code"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      validateCoupon(couponCode);
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => validateCoupon(couponCode)}
                disabled={!couponCode.trim() || validating}
                variant="outline"
              >
                {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
              </Button>
            </div>

            {/* Validated Coupon Preview */}
            {validatedCoupon && (
              <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">{validatedCoupon.promotion_code?.code}</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {formatDiscount(validatedCoupon.coupon)}
                      </Badge>
                    </div>
                    <p className="text-sm text-green-600 mt-1">{validatedCoupon.coupon?.name}</p>
                    {validatedCoupon.coupon?.duration && (
                      <p className="text-xs text-green-500 mt-1">Duration: {validatedCoupon.coupon.duration}</p>
                    )}
                  </div>
                  <Button onClick={handleApplyCoupon} size="sm" className="bg-green-600 hover:bg-green-700">
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
