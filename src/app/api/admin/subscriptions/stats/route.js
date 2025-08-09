import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function GET() {
  try {
    // Get subscription statistics from database
    const [
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      subscriptionsByMonth,
      subscriptionsByDuration,
    ] = await Promise.all([
      // Total subscriptions
      prisma.subscription.count(),

      // Active subscriptions
      prisma.subscription.count({
        where: { status: "active" },
      }),

      // Expired/inactive subscriptions
      prisma.subscription.count({
        where: { status: { not: "active" } },
      }),

      // Subscriptions by month (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', subscribed_at) as month,
          COUNT(*) as count
        FROM "Subscription"
        WHERE subscribed_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', subscribed_at)
        ORDER BY month DESC
      `,

      // Subscriptions by duration
      prisma.subscription.groupBy({
        by: ["duration"],
        _count: { duration: true },
        orderBy: { duration: "asc" },
      }),
    ]);

    // Get recent subscription activity
    const recentSubscriptions = await prisma.subscription.findMany({
      take: 10,
      orderBy: { subscribedAt: "desc" },
      select: {
        id: true,
        userId: true,
        status: true,
        duration: true,
        subscribedAt: true,
      },
    });

    // Calculate estimated revenue based on subscription data
    const revenueByDuration = subscriptionsByDuration.map((item) => ({
      duration: item.duration,
      count: item._count.duration,
      // Estimate revenue: 6 months = £10, 12 months = £15
      estimatedRevenue: item._count.duration * (item.duration === 6 ? 10 : 15),
    }));

    const totalEstimatedRevenue = revenueByDuration.reduce((sum, item) => sum + item.estimatedRevenue, 0);

    // Try to get some payment data from Stripe (limited by API)
    let stripePayments = [];
    try {
      const payments = await stripe.paymentIntents.list({
        limit: 100,
        created: {
          gte: Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60, // Last year
        },
      });
      stripePayments = payments.data;
    } catch (stripeError) {
      console.warn("Could not fetch Stripe data:", stripeError.message);
    }

    const stats = {
      overview: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        totalEstimatedRevenue,
        stripePaymentsCount: stripePayments.length,
      },
      charts: {
        subscriptionsByMonth: subscriptionsByMonth.map((row) => ({
          month: row.month,
          count: parseInt(row.count),
        })),
        subscriptionsByDuration: subscriptionsByDuration.map((item) => ({
          duration: item.duration,
          count: item._count.duration,
          label: item.duration === 6 ? "6 Months (£10)" : "12 Months (£15)",
        })),
        revenueByDuration,
      },
      recentActivity: recentSubscriptions,
      stripePayments: stripePayments.slice(0, 10).map((payment) => ({
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency.toUpperCase(),
        status: payment.status,
        created: new Date(payment.created * 1000),
      })),
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching subscription stats:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
