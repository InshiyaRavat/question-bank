import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

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
    const subscriptionsWithPayments = await Promise.all(
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
          payment,
          subscription,
          amount,
          paymentDate: new Date(payment.created * 1000),
        };
      })
    );

    // Fetch usernames using Clerk (same logic as first code)
    let paymentLogs = subscriptionsWithPayments.map(({ payment, subscription, amount, paymentDate }) => ({
      id: payment.id,
      userId: subscription?.userId || null,
      subscriptionId: subscription?.id || null,
      stripePaymentId: payment.id,
      amount,
      currency: payment.currency.toUpperCase(),
      status: payment.status,
      paymentMethod: payment.payment_method_types?.[0] || "card",
      description: payment.description || `${amount === 10 ? "6-month" : "12-month"} subscription`,
      createdAt: paymentDate,
      subscription: subscription
        ? {
          id: subscription.id,
          status: subscription.status,
          duration: subscription.duration,
        }
        : null,
    }));

    // Attach usernames using the same logic as the first code
    try {
      const uniqueUserIds = Array.from(
        new Set(
          paymentLogs
            .map((log) => log.userId)
            .filter(Boolean) // Remove null/undefined userIds
        )
      );

      if (uniqueUserIds.length > 0) {
        const clerk = await clerkClient();
        const users = await Promise.all(
          uniqueUserIds.map((uid) => clerk.users.getUser(uid).catch(() => null))
        );

        const idToUsername = new Map(
          users
            .filter(Boolean)
            .map((u) => [
              u.id,
              u.username || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.emailAddresses?.[0]?.emailAddress || u.id,
            ])
        );

        paymentLogs = paymentLogs.map((log) => ({
          ...log,
          username: log.userId ? (idToUsername.get(log.userId) || log.userId) : "unknown",
        }));
      } else {
        paymentLogs = paymentLogs.map((log) => ({ ...log, username: "unknown" }));
      }
    } catch (_e) {
      // If Clerk lookup fails, fall back silently to userId
      paymentLogs = paymentLogs.map((log) => ({
        ...log,
        username: log.userId || "unknown",
      }));
    }

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