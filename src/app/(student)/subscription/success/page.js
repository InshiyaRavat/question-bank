"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Fetch the latest subscription data
    const fetchSubscription = async () => {
      try {
        const response = await fetch(`/api/subscription?userid=${user.id}`);
        const data = await response.json();

        if (data.success && data.subscription) {
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isLoaded, user]);

  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Thank you for subscribing to our premium plan.</p>
        </div>

        {loading ? (
          <div className="py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading subscription details...</p>
          </div>
        ) : subscription ? (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Your Subscription</h3>
            <p className="text-blue-700">
              <strong>{subscription.duration}-Month Plan</strong>
            </p>
            <p className="text-sm text-blue-600">
              Status: <span className="capitalize">{subscription.status}</span>
            </p>
            <p className="text-sm text-blue-600">
              Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/study-material"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center"
          >
            Start Learning
          </Link>
        </div>

        {sessionId && <p className="text-xs text-gray-500 mt-4">Session ID: {sessionId}</p>}
      </div>
    </div>
  );
}
