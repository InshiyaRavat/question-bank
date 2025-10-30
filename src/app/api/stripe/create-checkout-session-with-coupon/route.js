import { NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG, getPriceIdByDuration } from "@/lib/stripe.js";
import prisma from "@/lib/prisma";
import { ensureStripeCustomer } from "@/lib/billing.js";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Create a Stripe Checkout Session for subscription with coupon support
 * This follows industry standards for subscription checkout with discounts
 */
export async function POST(req) {
  try {
    // Soft-validate Stripe env: ensure secret key exists; price resolution is handled below
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { duration, planId, successUrl, cancelUrl, couponCode, promotionCode } = body;

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
          return NextResponse.json(
            { error: "Selected plan is missing Stripe price and unsupported duration" },
            { status: 400 }
          );
        }
        priceId = getPriceIdByDuration(resolvedDuration);
        if (!priceId) {
          return NextResponse.json(
            { error: `No price configured for ${resolvedDuration}-month plan` },
            { status: 400 }
          );
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

    // Ensure Stripe customer exists
    const customerId = await ensureStripeCustomer({
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
    });

    // Prepare discounts array
    const discounts = [];

    // Validate and add coupon if provided
    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          discounts.push({ coupon: couponCode });
        } else {
          return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      }
    }

    // Validate and add promotion code if provided
    if (promotionCode) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: promotionCode,
          limit: 1,
        });

        if (promotionCodes.data.length === 0) {
          return NextResponse.json({ error: "Invalid promotion code" }, { status: 400 });
        }

        const promoCode = promotionCodes.data[0];
        if (!promoCode.active) {
          return NextResponse.json({ error: "Promotion code is not active" }, { status: 400 });
        }

        if (promoCode.expires_at && promoCode.expires_at < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: "Promotion code has expired" }, { status: 400 });
        }

        if (promoCode.max_redemptions && promoCode.times_redeemed >= promoCode.max_redemptions) {
          return NextResponse.json({ error: "Promotion code has reached maximum redemptions" }, { status: 400 });
        }

        discounts.push({ promotion_code: promotionCode });
      } catch (error) {
        return NextResponse.json({ error: "Invalid promotion code" }, { status: 400 });
      }
    }

    // Create checkout session
    const sessionConfig = {
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
      metadata: planId
        ? { userId: user.id, plan_id: String(planId) }
        : { userId: user.id, duration: String(resolvedDuration), plan_type: `${resolvedDuration}_month` },
      subscription_data: {
        metadata: planId
          ? { userId: user.id, plan_id: String(planId) }
          : { userId: user.id, duration: String(resolvedDuration), plan_type: `${resolvedDuration}_month` },
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
    };

    // Add discounts if any
    if (discounts.length > 0) {
      sessionConfig.discounts = discounts;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      discounts: discounts.length > 0 ? discounts : undefined,
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
