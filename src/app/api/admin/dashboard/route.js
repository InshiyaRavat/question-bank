import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/admin/dashboard - Get comprehensive dashboard analytics
export async function GET(req) {
  try {
    // Check authentication
    const { userId } = await auth();
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Calculate previous period for comparison
    const periodDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    const previousEndDate = new Date(startDate);

    // Fetch basic metrics using existing schema
    const [
      totalSubscriptions,
      newSubscriptions,
      previousNewSubscriptions,
      activeSubscriptions,
      previousActiveSubscriptions,
      allSubscriptions,
      totalQuestionsSolved,
      previousQuestionsSolved,
      totalSubjects,
      totalTopics,
      totalQuestions,
      totalComments,
      softDeletedSubjects,
      softDeletedTopics,
      softDeletedQuestions,
      topTopics,
      recentSubscriptions,
      recentQuestionActivity,
      totalFlaggedQuestions,
      pendingFlags,
      recentFlags,
    ] = await Promise.all([
      // Basic counts
      prisma.subscription.count(),
      prisma.subscription.count({
        where: { subscribedAt: { gte: startDate } },
      }),
      prisma.subscription.count({
        where: {
          subscribedAt: {
            gte: previousStartDate,
            lt: previousEndDate,
          },
        },
      }),
      prisma.subscription.count({
        where: { status: "active" },
      }),
      prisma.subscription.count({
        where: {
          status: "active",
          subscribedAt: {
            gte: previousStartDate,
            lt: previousEndDate,
          },
        },
      }),
      prisma.subscription.findMany({
        select: {
          id: true,
          status: true,
          duration: true,
          subscribedAt: true,
        },
      }),

      // Activity metrics
      prisma.solvedQuestion.count({
        where: { solvedAt: { gte: startDate } },
      }),
      prisma.solvedQuestion.count({
        where: {
          solvedAt: {
            gte: previousStartDate,
            lt: previousEndDate,
          },
        },
      }),

      // Content metrics
      prisma.subject.count({
        where: { deletedAt: null },
      }),
      prisma.topic.count({
        where: { deletedAt: null },
      }),
      prisma.question.count({
        where: { deletedAt: null },
      }),
      prisma.comment.count(),
      prisma.subject.count({
        where: { deletedAt: { not: null } },
      }),
      prisma.topic.count({
        where: { deletedAt: { not: null } },
      }),
      prisma.question.count({
        where: { deletedAt: { not: null } },
      }),

      // Popular topics
      prisma.topic.findMany({
        where: { deletedAt: null },
        include: {
          attemptedQuestions: {
            select: { id: true },
          },
        },
        take: 10,
      }),

      // Recent data for charts
      prisma.subscription.findMany({
        where: { subscribedAt: { gte: startDate } },
        select: {
          subscribedAt: true,
          duration: true,
          status: true,
        },
        orderBy: { subscribedAt: "asc" },
      }),
      prisma.solvedQuestion.findMany({
        where: { solvedAt: { gte: startDate } },
        select: {
          solvedAt: true,
          isCorrect: true,
        },
        orderBy: { solvedAt: "asc" },
      }),

      // Flagged questions metrics
      prisma.questionFlag.count(),
      prisma.questionFlag.count({
        where: { status: "pending" },
      }),
      prisma.questionFlag.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          createdAt: true,
          status: true,
          reason: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Process results
    const userGrowth =
      previousNewSubscriptions > 0
        ? (((newSubscriptions - previousNewSubscriptions) / previousNewSubscriptions) * 100).toFixed(1)
        : 0;

    // Calculate revenue from subscriptions
    const calculateRevenue = (subs) => {
      return subs.reduce((total, sub) => {
        if (sub.duration === 1) return total + 9.99; // Monthly
        if (sub.duration === 12) return total + 99.99; // Annual
        if (sub.duration === 999) return total + 299.99; // Lifetime
        return total;
      }, 0);
    };

    const currentRevenue = calculateRevenue(allSubscriptions.filter((s) => s.subscribedAt >= startDate));
    const previousRevenue = calculateRevenue(
      allSubscriptions.filter((s) => s.subscribedAt >= previousStartDate && s.subscribedAt < previousEndDate)
    );
    const revenueGrowth =
      previousRevenue > 0 ? (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1) : 0;

    const subscriptionGrowth =
      previousActiveSubscriptions > 0
        ? (((activeSubscriptions - previousActiveSubscriptions) / previousActiveSubscriptions) * 100).toFixed(1)
        : 0;

    const avgQuestionsPerUser = totalSubscriptions > 0 ? Math.round(totalQuestionsSolved / totalSubscriptions) : 0;
    const trashItems = softDeletedSubjects + softDeletedTopics + softDeletedQuestions;

    // Calculate subscription plan distribution
    const planDistribution = allSubscriptions.reduce((acc, sub) => {
      const plan =
        sub.duration === 1 ? "Monthly" : sub.duration === 12 ? "Annual" : sub.duration === 999 ? "Lifetime" : "Other";
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});

    // Calculate subscription status distribution
    const statusDistribution = allSubscriptions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {});

    // Process popular topics
    const popularTopicsData = topTopics
      .map((topic) => ({
        topic: topic.name,
        attempts: topic.attemptedQuestions.length,
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);

    // Process chart data
    const processChartData = (data, dateKey, groupBy = "day") => {
      const grouped = {};
      data.forEach((item) => {
        const date = new Date(item[dateKey]);
        const key = date.toISOString().split("T")[0];
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(item);
      });
      return Object.entries(grouped)
        .map(([date, items]) => ({
          date,
          count: items.length,
          items,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    };

    const userGrowthChart = processChartData(recentSubscriptions, "subscribedAt").map((item) => ({
      date: item.date,
      newUsers: item.count,
    }));

    const revenueChart = processChartData(recentSubscriptions, "subscribedAt").map((item) => ({
      month: item.date,
      revenue: calculateRevenue(item.items),
    }));

    const questionsSolvedChart = processChartData(recentQuestionActivity, "solvedAt").map((item) => ({
      date: item.date,
      solved: item.count,
      correct: item.items.filter((q) => q.isCorrect).length,
    }));

    // Generate some mock data for missing charts
    const userStatusChart = [
      { name: "Active", value: Math.floor(activeSubscriptions * 0.8), color: "#22c55e" },
      { name: "Inactive", value: Math.floor(activeSubscriptions * 0.2), color: "#ef4444" },
    ];

    const subscriptionPlansChart = Object.entries(planDistribution).map(([plan, count]) => ({
      plan,
      count,
    }));

    const revenueByPlanChart = Object.entries(planDistribution).map(([plan, count]) => ({
      name: plan,
      revenue: count * (plan === "Monthly" ? 9.99 : plan === "Annual" ? 99.99 : plan === "Lifetime" ? 299.99 : 0),
      color: plan === "Monthly" ? "#3b82f6" : plan === "Annual" ? "#10b981" : "#f59e0b",
    }));

    const subscriptionStatusChart = Object.entries(statusDistribution).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: status === "active" ? "#22c55e" : status === "cancelled" ? "#ef4444" : "#f59e0b",
    }));

    // Calculate conversion rate
    const conversionRate = totalSubscriptions > 0 ? ((activeSubscriptions / totalSubscriptions) * 100).toFixed(1) : 0;

    // Calculate churn rate
    const cancelledCount = statusDistribution.cancelled || 0;
    const churnRate = totalSubscriptions > 0 ? ((cancelledCount / totalSubscriptions) * 100).toFixed(1) : 0;

    const dashboardData = {
      overview: {
        totalUsers: totalSubscriptions, // Using subscriptions as proxy for users
        userGrowth: parseFloat(userGrowth),
        totalRevenue: currentRevenue,
        revenueGrowth: parseFloat(revenueGrowth),
        activeSubscriptions,
        subscriptionGrowth: parseFloat(subscriptionGrowth),
        questionsSolved: totalQuestionsSolved,
        avgQuestionsPerUser,
      },
      userMetrics: {
        newUsers: newSubscriptions,
        conversionRate: parseFloat(conversionRate),
      },
      revenueMetrics: {
        avgRevenue: totalSubscriptions > 0 ? Math.round(currentRevenue / totalSubscriptions) : 0,
        mrr: Math.round(currentRevenue / (periodDays / 30)), // Monthly recurring revenue estimate
        arr: Math.round((currentRevenue * 12) / (periodDays / 30)), // Annual recurring revenue estimate
        averageDealSize: totalSubscriptions > 0 ? Math.round(currentRevenue / totalSubscriptions) : 0,
      },
      subscriptionMetrics: {
        churnRate: parseFloat(churnRate),
        monthlyPlans: planDistribution.Monthly || 0,
        annualPlans: planDistribution.Annual || 0,
        lifetimePlans: planDistribution.Lifetime || 0,
        retentionRate: (100 - parseFloat(churnRate)).toFixed(1),
      },
      activityMetrics: {
        avgSessionDuration: "25m", // This would need session tracking
        questionsPerSession: Math.round(totalQuestionsSolved / Math.max(newSubscriptions, 1)),
        overallAccuracy:
          totalQuestionsSolved > 0
            ? Math.round((recentQuestionActivity.filter((q) => q.isCorrect).length / totalQuestionsSolved) * 100)
            : 0,
        peakHour: "2 PM", // This would need hourly activity tracking
      },
      contentMetrics: {
        totalSubjects,
        totalTopics,
        totalQuestions,
        totalComments,
        trashItems,
        avgQuestionsPerTopic: totalTopics > 0 ? Math.round(totalQuestions / totalTopics) : 0,
        totalFlaggedQuestions,
        pendingFlags,
        recentFlagsCount: recentFlags.length,
      },
      charts: {
        userGrowth: userGrowthChart,
        userStatus: userStatusChart,
        userActivity: [], // Would need hourly data
        revenue: revenueChart,
        revenueByPlan: revenueByPlanChart,
        subscriptionPlans: subscriptionPlansChart,
        subscriptionStatus: subscriptionStatusChart,
        dailyActiveUsers: userGrowthChart, // Using same data as proxy
        questionsSolved: questionsSolvedChart,
        contentBySubject: [], // Would need subject-wise difficulty breakdown
        popularTopics: popularTopicsData,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
