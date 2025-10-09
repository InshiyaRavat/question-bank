import { NextResponse } from "next/server";
import { validateStripeConfig } from "@/lib/stripe.js";
import { verifyAndParseStripeEvent, handleStripeEvent } from "@/lib/payments/stripe.js";

/**
 * Comprehensive Stripe webhook handler
 * Handles all subscription lifecycle events with proper signature verification
 */
export async function POST(req) {
  try {
    // Validate Stripe configuration
    validateStripeConfig();

    const event = await verifyAndParseStripeEvent(req);

    console.log(`Processing webhook event: ${event.type}`);

    try {
      await handleStripeEvent(event);

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error(`Error processing webhook ${event.type}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delegated to lib/payments/stripe
