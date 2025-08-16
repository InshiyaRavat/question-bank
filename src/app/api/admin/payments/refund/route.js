import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { stripePaymentId, reason, amount } = body;

    if (!stripePaymentId) {
      return NextResponse.json({ success: false, error: "Stripe payment ID required" }, { status: 400 });
    }

    // Validate refund reason - must be one of Stripe's accepted values
    const validReasons = ["duplicate", "fraudulent", "requested_by_customer"];
    const refundReason = reason && validReasons.includes(reason) ? reason : "requested_by_customer";

    // Get the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentId);

    if (!paymentIntent) {
      return NextResponse.json({ success: false, error: "Payment not found in Stripe" }, { status: 404 });
    }

    if (paymentIntent.status === "canceled" || paymentIntent.charges?.data?.[0]?.refunded) {
      return NextResponse.json({ success: false, error: "Payment already refunded" }, { status: 400 });
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: stripePaymentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
      reason: refundReason,
    });

    // Try to find and update associated subscription
    const paymentAmount = paymentIntent.amount / 100;
    const paymentDate = new Date(paymentIntent.created * 1000);

    const subscription = await prisma.subscription.findFirst({
      where: {
        subscribedAt: {
          gte: new Date(paymentDate.getTime() - 5 * 60 * 1000), // 5 minutes before
          lte: new Date(paymentDate.getTime() + 5 * 60 * 1000), // 5 minutes after
        },
        duration: paymentAmount === 10 ? 6 : paymentAmount === 15 ? 12 : undefined,
      },
    });

    // Update subscription status if found
    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "cancelled" },
      });
    }

    // Fetch username using Clerk (same logic as first code)
    let username = null;
    if (subscription?.userId) {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(subscription.userId);
        username = user.username || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses?.[0]?.emailAddress || subscription.userId;
      } catch (_e) {
        // If Clerk lookup fails, fall back to userId
        username = subscription.userId;
      }
    }

    // Log the refund in the database
    const refundLog = await prisma.refund.create({
      data: {
        stripeRefundId: refund.id,
        stripePaymentId: stripePaymentId,
        userId: subscription?.userId || null,
        amount: refund.amount / 100,
        reason: refundReason,
        status: refund.status,
        subscriptionId: subscription?.id || null,
        processedBy: "admin",
      },
    });

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        paymentIntentId: stripePaymentId,
        logId: refundLog.id,
      },
      subscription: subscription
        ? {
          id: subscription.id,
          status: "cancelled",
          username: username || "unknown",
        }
        : null,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}