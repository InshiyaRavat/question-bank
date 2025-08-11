"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { CreditCard, Calendar, PoundSterling, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export default function UserBillingHistory() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    const fetchBilling = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/user/billing?userid=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch billing data");
        const result = await res.json();
        if (result.success) {
          setBilling(result.billing);
        } else {
          throw new Error(result.error || "Failed to fetch billing");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [isLoaded, isSignedIn, user]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
      case "canceled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "succeeded":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <section className="bg-card text-card-foreground rounded-xl shadow p-6 border border-border w-full">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-card text-card-foreground rounded-xl shadow p-6 border border-border w-full">
        <div className="text-red-500 text-center py-4">{error}</div>
      </section>
    );
  }

  return (
    <section className="bg-card text-card-foreground rounded-xl shadow p-6 border border-border w-full">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Billing History</h2>
      </div>

      {!billing?.subscription ? (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No subscription found</p>
          <p className="text-sm text-gray-400">You haven&apos;t subscribed to any plans yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Plan Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">{billing.subscription.planName}</h3>
                <p className="text-sm text-blue-700">
                  £{billing.subscription.planPrice} • {billing.subscription.duration} months
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  £{billing.summary.totalSpent}
                </div>
                <div className="text-sm text-blue-600">Total Spent</div>
              </div>
            </div>
          </div>

          {/* Billing Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <PoundSterling className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Total Payments</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{billing.summary.totalPayments}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Subscribed Since</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDate(billing.subscription.subscribedAt)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Plan Status</span>
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(billing.subscription.status)}`}>
                {getStatusIcon(billing.subscription.status)}
                {billing.subscription.status}
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Payment History</h3>
            {billing.payments.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No payment records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {billing.payments.map((payment) => (
                  <div key={payment.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <p className="font-medium text-gray-900">{payment.description}</p>
                          <p className="text-sm text-gray-500">
                            {payment.paymentMethod} • {formatDate(payment.createdAt)}
                          </p>
                          {payment.isMock && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                              <span className="text-xs text-amber-600">Based on subscription data</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          £{payment.amount}
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
