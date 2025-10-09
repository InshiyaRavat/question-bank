"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { RefreshCw, ArrowUpRight, ArrowDownLeft, XCircle, CreditCard } from "lucide-react";
import UserSidebar from "@/components/UserSidebar";

export default function SubscriptionPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubscription = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/subscription?userid=${user.id}`);
      const json = await res.json();
      if (!json.success) {
        setSubscription(null);
      } else {
        setSubscription(json.subscription);
      }
    } catch (e) {
      setError("Failed to load subscription.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const expiryDate = useMemo(() => {
    if (!subscription) return null;
    const d = new Date(subscription.subscribedAt);
    d.setMonth(d.getMonth() + (subscription.duration || 0));
    return d;
  }, [subscription]);

  const daysRemaining = useMemo(() => {
    if (!expiryDate) return null;
    const now = new Date();
    return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [expiryDate]);

  const performAction = async (action) => {
    if (!subscription) return;
    setActionLoading(true);
    try {
      if (action === "manage") {
        // Open Stripe Customer Portal for subscription management
        const response = await fetch("/api/stripe/customer-portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          alert("Failed to open subscription management. Please try again.");
        }
      } else if (action === "renew") {
        // Create a new checkout session for renewal
        const response = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duration: subscription.duration,
            successUrl: `${window.location.origin}/subscription/success`,
            cancelUrl: `${window.location.origin}/subscription`,
          }),
        });

        const data = await response.json();

        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          alert("Failed to create renewal session. Please try again.");
        }
      }
    } catch (e) {
      console.error("Action failed:", e);
      alert("Action failed. Please try again.");
    } finally {
      setActionLoading(false);
      fetchSubscription();
    }
  };

  return (
    <div className="flex h-screen bg-white w-full">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 h-full">
        <UserSidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 min-h-screen flex flex-col overflow-auto">
        <header className="px-6 lg:px-8 pt-6 lg:pt-8 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" /> Subscription
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your plan and billing status</p>
        </header>

        <main className="px-6 lg:px-8 pb-10 space-y-6">
          {/* Status Card */}
          <section className="rounded-xl border border-border p-4 sm:p-6 bg-white">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading subscription...</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : !subscription ? (
              <div className="text-sm text-muted-foreground">No subscription found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <div className="text-xs text-blue-700 uppercase tracking-wide">Plan</div>
                  <div className="text-lg font-semibold text-blue-900 mt-1">{subscription.duration}-month</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Status</div>
                  <div
                    className={`text-lg font-semibold mt-1 ${
                      subscription.status === "active" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {subscription.status}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Days Remaining</div>
                  <div
                    className={`text-lg font-semibold mt-1 ${
                      daysRemaining != null && daysRemaining <= 0 ? "text-red-700" : "text-gray-900"
                    }`}
                  >
                    {daysRemaining == null ? "-" : daysRemaining <= 0 ? "Expired" : `${daysRemaining} days`}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Paid On</div>
                  <div className="text-lg font-semibold mt-1">
                    {subscription?.subscribedAt ? new Date(subscription.subscribedAt).toLocaleDateString() : "-"}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Expires On</div>
                  <div
                    className={`text-lg font-semibold mt-1 ${
                      daysRemaining != null && daysRemaining <= 0 ? "text-red-700" : "text-gray-900"
                    }`}
                  >
                    {expiryDate ? expiryDate.toLocaleDateString() : "-"}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Actions */}
          <section className="rounded-xl border border-border p-4 sm:p-6 bg-white">
            <div className="text-base font-semibold mb-4">Manage Subscription</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={() => performAction("manage")}
                disabled={actionLoading || loading || !subscription}
              >
                <CreditCard className="w-4 h-4" /> Manage Subscription
              </button>
              {subscription?.status === "canceled" || subscription?.status === "past_due" ? (
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                  onClick={() => performAction("renew")}
                  disabled={actionLoading || loading}
                >
                  <RefreshCw className="w-4 h-4" /> Renew Subscription
                </button>
              ) : null}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Use "Manage Subscription" to update your plan, change payment methods, view
                billing history, or cancel your subscription. All changes are handled securely through Stripe.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
