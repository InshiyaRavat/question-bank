import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

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
      subscriptionsByYear,
      subscriptionsByDuration,
      seriesMonthlyRaw,
      seriesYearlyRaw,
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

      // Subscriptions by year (last 10 years)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('year', subscribed_at) as year,
          COUNT(*) as count
        FROM "Subscription"
        WHERE subscribed_at >= NOW() - INTERVAL '10 years'
        GROUP BY DATE_TRUNC('year', subscribed_at)
        ORDER BY year DESC
      `,

      // Subscriptions by duration
      prisma.subscription.groupBy({
        by: ["duration"],
        _count: { duration: true },
        orderBy: { duration: "asc" },
      }),

      // Detailed monthly series (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', subscribed_at) AS bucket,
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN status <> 'active' THEN 1 ELSE 0 END) AS expired,
          SUM(CASE WHEN duration = 6 THEN 1 ELSE 0 END) AS d6,
          SUM(CASE WHEN duration = 12 THEN 1 ELSE 0 END) AS d12
        FROM "Subscription"
        WHERE subscribed_at >= NOW() - INTERVAL '12 months'
        GROUP BY 1
        ORDER BY bucket DESC
      `,

      // Detailed yearly series (last 10 years)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('year', subscribed_at) AS bucket,
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN status <> 'active' THEN 1 ELSE 0 END) AS expired,
          SUM(CASE WHEN duration = 6 THEN 1 ELSE 0 END) AS d6,
          SUM(CASE WHEN duration = 12 THEN 1 ELSE 0 END) AS d12
        FROM "Subscription"
        WHERE subscribed_at >= NOW() - INTERVAL '10 years'
        GROUP BY 1
        ORDER BY bucket DESC
      `,
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

    // Attach usernames for recent subscriptions
    let recentActivity = recentSubscriptions;
    try {
      const uniqueUserIds = Array.from(new Set(recentSubscriptions.map((s) => s.userId)));
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
      recentActivity = recentSubscriptions.map((s) => ({
        ...s,
        username: idToUsername.get(s.userId) || s.userId,
      }));
    } catch (_e) {
      // If Clerk lookup fails, fall back silently to userId
      recentActivity = recentSubscriptions.map((s) => ({ ...s, username: s.userId }));
    }

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

    const monthlySeries = seriesMonthlyRaw.map((row) => {
      const d6 = Number(row.d6) || 0;
      const d12 = Number(row.d12) || 0;
      return {
        period: row.bucket,
        total: Number(row.total) || 0,
        active: Number(row.active) || 0,
        expired: Number(row.expired) || 0,
        duration6: d6,
        duration12: d12,
        estimatedRevenue: d6 * 10 + d12 * 15,
      };
    });

    const yearlySeries = seriesYearlyRaw.map((row) => {
      const d6 = Number(row.d6) || 0;
      const d12 = Number(row.d12) || 0;
      return {
        period: row.bucket,
        total: Number(row.total) || 0,
        active: Number(row.active) || 0,
        expired: Number(row.expired) || 0,
        duration6: d6,
        duration12: d12,
        estimatedRevenue: d6 * 10 + d12 * 15,
      };
    });

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
        subscriptionsByYear: subscriptionsByYear.map((row) => ({
          year: row.year,
          count: parseInt(row.count),
        })),
        subscriptionsByDuration: subscriptionsByDuration.map((item) => ({
          duration: item.duration,
          count: item._count.duration,
          label: item.duration === 6 ? "6 Months (£10)" : "12 Months (£15)",
        })),
        revenueByDuration,
      },
      series: {
        monthly: monthlySeries,
        yearly: yearlySeries,
      },
      recentActivity,
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
