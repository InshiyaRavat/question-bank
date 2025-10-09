"use client";
import React from "react";
import { XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600">Your payment was cancelled. No charges have been made.</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-2">What's Next?</h3>
          <p className="text-yellow-700 text-sm">
            You can try again anytime or explore our free features. Contact support if you need assistance.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/subscription"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Try Again
          </Link>

          <Link
            href="/dashboard"
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-200 flex items-center justify-center"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Contact our{" "}
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
