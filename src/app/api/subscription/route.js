import { NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/billing.js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userid");

  if (!userId) {
    return NextResponse.json({ success: false, error: "userid is required" }, { status: 400 });
  }

  try {
    const subscriptionStatus = await getSubscriptionStatus(userId);

    if (!subscriptionStatus.hasSubscription) {
      return NextResponse.json({ success: false, subscription: null });
    }

    // Return subscription with computed metadata
    const response = {
      ...subscriptionStatus.subscription,
      expiresAt: subscriptionStatus.expiresAt,
      daysRemaining: subscriptionStatus.daysRemaining,
      isActive: subscriptionStatus.isActive,
    };

    return NextResponse.json({ success: true, subscription: response });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Note: Subscriptions are now created via Stripe webhooks
// This endpoint is kept for backward compatibility but should not be used
// for creating new subscriptions. Use Stripe Checkout instead.
