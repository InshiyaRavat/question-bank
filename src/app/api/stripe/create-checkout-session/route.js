import { NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG, getPriceIdByDuration } from "@/lib/stripe.js";
import prisma from "@/lib/prisma";
import { ensureStripeCustomer } from "@/lib/billing.js";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Create a Stripe Checkout Session for subscription
 * This follows industry standards for subscription checkout
 */
export async function POST(req) {
  try {
    // Soft-validate Stripe env: ensure secret key exists; price resolution is handled below
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { duration, planId, successUrl, cancelUrl } = body;

    // Determine price: prefer planId (admin-defined), fallback to legacy duration mapping
    let priceId = null;
    let resolvedDuration = duration;
    if (planId) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: Number(planId) } });
      if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "Selected plan is not available for checkout" }, { status: 400 });
      }
      // Prefer plan.stripePriceId when present
      if (plan.stripePriceId) {
        priceId = plan.stripePriceId;
      } else {
        // Fallback to legacy duration-based pricing using plan.durationMonths
        resolvedDuration = plan.durationMonths;
        if (!resolvedDuration || ![6, 12].includes(resolvedDuration)) {
          return NextResponse.json({ error: "Selected plan is missing Stripe price and unsupported duration" }, { status: 400 });
        }
        priceId = getPriceIdByDuration(resolvedDuration);
        if (!priceId) {
          return NextResponse.json({ error: `No price configured for ${resolvedDuration}-month plan` }, { status: 400 });
        }
      }
    } else {
      // Legacy fallback: duration-based pricing
      if (!resolvedDuration || ![6, 12].includes(resolvedDuration)) {
        return NextResponse.json({ error: "Invalid duration. Must be 6 or 12 months." }, { status: 400 });
      }
      priceId = getPriceIdByDuration(resolvedDuration);
      if (!priceId) {
        return NextResponse.json({ error: `No price configured for ${resolvedDuration}-month plan` }, { status: 400 });
      }
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // priceId is determined above

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
      metadata: planId ? { userId: user.id, plan_id: String(planId) } : { userId: user.id, duration: String(resolvedDuration), plan_type: `${resolvedDuration}_month` },
      subscription_data: {
        metadata: planId ? { userId: user.id, plan_id: String(planId) } : { userId: user.id, duration: String(resolvedDuration), plan_type: `${resolvedDuration}_month` },
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
