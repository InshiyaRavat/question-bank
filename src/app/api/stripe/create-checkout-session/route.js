import { NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG, getPriceIdByDuration, validateStripeConfig } from "@/lib/stripe.js";
import { ensureStripeCustomer } from "@/lib/billing.js";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Create a Stripe Checkout Session for subscription
 * This follows industry standards for subscription checkout
 */
export async function POST(req) {
  try {
    // Validate Stripe configuration
    validateStripeConfig();

    const body = await req.json();
    const { duration, successUrl, cancelUrl } = body;

    // Validate input
    if (!duration || ![6, 12].includes(duration)) {
      return NextResponse.json({ error: "Invalid duration. Must be 6 or 12 months." }, { status: 400 });
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get price ID for the selected duration
    const priceId = getPriceIdByDuration(duration);
    if (!priceId) {
      return NextResponse.json({ error: `No price configured for ${duration}-month plan` }, { status: 400 });
    }

    // Ensure Stripe customer exists
    const customerId = await ensureStripeCustomer({
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || STRIPE_CONFIG.SUCCESS_URL,
      cancel_url: cancelUrl || STRIPE_CONFIG.CANCEL_URL,
      metadata: {
        userId: user.id,
        duration: duration.toString(),
        plan_type: `${duration}_month`,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          duration: duration.toString(),
          plan_type: `${duration}_month`,
        },
      },
      // Enable customer portal for subscription management
      customer_update: {
        address: "auto",
        name: "auto",
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Billing address collection
      billing_address_collection: "required",
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to create checkout session",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
