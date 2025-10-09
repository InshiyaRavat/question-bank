import { NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG, validateStripeConfig } from "@/lib/stripe.js";
import { getActiveSubscriptionByUser } from "@/lib/billing.js";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Create a Stripe Customer Portal session
 * Allows customers to manage their subscriptions, update payment methods, etc.
 */
export async function POST(req) {
  try {
    // Validate Stripe configuration
    validateStripeConfig();

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user's active subscription to find their Stripe customer ID
    const subscription = await getActiveSubscriptionByUser(user.id);
    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // Check if subscription has a Stripe customer ID
    if (!subscription.stripeCustomerId) {
      return NextResponse.json(
        {
          error: "Subscription not properly linked to Stripe. Please contact support.",
        },
        { status: 400 }
      );
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription`,
    });

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to create customer portal session",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
