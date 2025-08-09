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
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get payment data from Stripe
    const stripeQuery = {
      limit: Math.min(limit * 2, 100), // Get more to account for filtering
    };

    if (startDate || endDate) {
      stripeQuery.created = {};
      if (startDate) stripeQuery.created.gte = Math.floor(new Date(startDate).getTime() / 1000);
      if (endDate) stripeQuery.created.lte = Math.floor(new Date(endDate).getTime() / 1000);
    }

    let allPayments = [];
    let hasMore = true;
    let startingAfter = null;

    // Fetch multiple pages if needed
    while (hasMore && allPayments.length < limit * page) {
      const query = { ...stripeQuery };
      if (startingAfter) query.starting_after = startingAfter;

      const payments = await stripe.paymentIntents.list(query);

      let filteredPayments = payments.data;
      if (status) {
        filteredPayments = filteredPayments.filter((p) => p.status === status);
      }

      allPayments = allPayments.concat(filteredPayments);
      hasMore = payments.has_more;
      if (payments.data.length > 0) {
        startingAfter = payments.data[payments.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    // Paginate the results
    const skip = (page - 1) * limit;
    const paginatedPayments = allPayments.slice(skip, skip + limit);

    // Get associated subscriptions for these payments
    const paymentLogs = await Promise.all(
      paginatedPayments.map(async (payment) => {
        // Try to find associated subscription by timing and amount
        const amount = payment.amount / 100;
        const paymentDate = new Date(payment.created * 1000);

        const subscription = await prisma.subscription.findFirst({
          where: {
            subscribedAt: {
              gte: new Date(paymentDate.getTime() - 5 * 60 * 1000), // 5 minutes before
              lte: new Date(paymentDate.getTime() + 5 * 60 * 1000), // 5 minutes after
            },
            // Match amount to duration (rough estimation)
            duration: amount === 10 ? 6 : amount === 15 ? 12 : undefined,
          },
        });

        return {
          id: payment.id,
          userId: subscription?.userId || "unknown",
          subscriptionId: subscription?.id || null,
          stripePaymentId: payment.id,
          amount,
          currency: payment.currency.toUpperCase(),
          status: payment.status,
          paymentMethod: payment.payment_method_types?.[0] || "card",
          description: payment.description || `${amount === 10 ? "6-month" : "12-month"} subscription`,
          createdAt: new Date(payment.created * 1000),
          subscription: subscription
            ? {
                id: subscription.id,
                status: subscription.status,
                duration: subscription.duration,
              }
            : null,
        };
      })
    );

    // Calculate summary statistics
    const totalAmount = allPayments.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + p.amount / 100, 0);

    const statusBreakdown = allPayments.reduce((acc, payment) => {
      const status = payment.status;
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0 };
      }
      acc[status].count++;
      if (status === "succeeded") {
        acc[status].amount += payment.amount / 100;
      }
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        logs: paymentLogs,
        pagination: {
          page,
          limit,
          total: allPayments.length,
          totalPages: Math.ceil(allPayments.length / limit),
        },
        summary: {
          totalAmount,
          totalTransactions: allPayments.length,
          statusBreakdown: Object.entries(statusBreakdown).map(([status, data]) => ({
            status,
            count: data.count,
            amount: data.amount,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payment logs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
