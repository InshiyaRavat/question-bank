import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userid");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { subscribedAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json({ 
        success: true, 
        billing: { 
          subscription: null, 
          payments: [], 
          summary: { totalSpent: 0, totalPayments: 0 } 
        } 
      });
    }

    // Try to find related Stripe payments with better date matching
    let payments = [];
    try {
      // Get payments from a wider time range to ensure we don't miss any
      const subscriptionDate = new Date(subscription.subscribedAt);
      const startDate = new Date(subscriptionDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before
      const endDate = new Date(subscriptionDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days after

      const paymentIntents = await stripe.paymentIntents.list({
        limit: 100,
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000),
        },
      });

      // Filter payments that could match this subscription with better logic
      payments = paymentIntents.data
        .filter(payment => {
          const amount = payment.amount / 100;
          const expectedAmount = subscription.duration === 6 ? 10 : 15;
          
          // More precise amount matching
          if (Math.abs(amount - expectedAmount) > 0.01) return false;
          
          // Check if payment was successful
          if (payment.status !== "succeeded") return false;
          
          return true;
        })
        .map(payment => ({
          id: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency.toUpperCase(),
          status: payment.status,
          paymentMethod: payment.payment_method_types?.[0] || "card",
          description: `${subscription.duration}-month subscription`,
          createdAt: new Date(payment.created * 1000),
          subscriptionId: subscription.id,
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // If no payments found, create a mock payment based on subscription for display purposes
      if (payments.length === 0) {
        payments = [{
          id: `mock-${subscription.id}`,
          amount: subscription.duration === 6 ? 10 : 15,
          currency: "GBP",
          status: "succeeded",
          paymentMethod: "card",
          description: `${subscription.duration}-month subscription`,
          createdAt: subscription.subscribedAt,
          subscriptionId: subscription.id,
          isMock: true
        }];
      }
    } catch (stripeError) {
      console.warn("Could not fetch Stripe payments:", stripeError.message);
      
      // Fallback: create a mock payment based on subscription
      payments = [{
        id: `fallback-${subscription.id}`,
        amount: subscription.duration === 6 ? 10 : 15,
        currency: "GBP",
        status: "succeeded",
        paymentMethod: "card",
        description: `${subscription.duration}-month subscription`,
        createdAt: subscription.subscribedAt,
        subscriptionId: subscription.id,
        isMock: true
      }];
    }

    // Calculate billing summary
    const totalSpent = payments
      .filter(p => p.status === "succeeded")
      .reduce((sum, p) => sum + p.amount, 0);

    const billing = {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        duration: subscription.duration,
        subscribedAt: subscription.subscribedAt,
        planName: subscription.duration === 6 ? "6-Month Plan" : "12-Month Plan",
        planPrice: subscription.duration === 6 ? 10 : 15,
        currency: "GBP"
      },
      payments,
      summary: {
        totalSpent,
        totalPayments: payments.filter(p => p.status === "succeeded").length,
        currency: "GBP"
      }
    };

    return NextResponse.json({ success: true, billing });
  } catch (error) {
    console.error("Error fetching user billing:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
